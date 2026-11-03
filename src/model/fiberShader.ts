import type * as THREE from 'three';

/**
 * Procedural muscle-fibre striations.
 *
 * The asset pipeline stores a per-vertex fibre direction (`_fiber`, a smooth harmonic flow from one end of the
 * muscle to the other). Here we evaluate value noise that is stretched along that direction, so it varies slowly
 * along the fibres and quickly across them, and use it as a screen-space bump (Mikkelsen's surface-gradient
 * method) plus a slight darkening in the grooves. Frequencies that would alias at the current zoom fade out.
 *
 * Meshes without the attribute (older assets, bones) get a zero direction and are left untouched.
 */
export interface FiberParams {
  /** Striations per scene unit across the fibres (1 unit ≈ 6 cm). */
  scale: number;
  /** Bump strength. */
  strength: number;
  /** How much the grooves darken the albedo (0..1). */
  tint: number;
}

export const MUSCLE_FIBERS: FiberParams = { scale: 38, strength: 0.06, tint: 0.7 };
export const TENDON_FIBERS: FiberParams = { scale: 60, strength: 0.03, tint: 0.3 };

const VERTEX_PARS = /* glsl */ `
attribute vec3 _fiber;
varying vec3 vFiberObj;
varying vec3 vPosObj;
varying vec3 vNormalObj;
`;

const VERTEX_MAIN = /* glsl */ `
#include <begin_vertex>
vFiberObj = _fiber;
vPosObj = position;
vNormalObj = normal;
`;

const FRAGMENT_PARS = /* glsl */ `
varying vec3 vFiberObj;
varying vec3 vPosObj;
varying vec3 vNormalObj;
uniform float uFiberScale;
uniform float uFiberStrength;
uniform float uFiberTint;

float fiberHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float fiberValueNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fiberHash(i + vec3(0, 0, 0)), fiberHash(i + vec3(1, 0, 0)), f.x),
                 mix(fiberHash(i + vec3(0, 1, 0)), fiberHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(fiberHash(i + vec3(0, 0, 1)), fiberHash(i + vec3(1, 0, 1)), f.x),
                 mix(fiberHash(i + vec3(0, 1, 1)), fiberHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

vec3 fiberPerturbNormal(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sigmaX = normalize(dFdx(surfPos));
  vec3 sigmaY = normalize(dFdy(surfPos));
  vec3 r1 = cross(sigmaY, surfNorm);
  vec3 r2 = cross(surfNorm, sigmaX);
  float det = dot(sigmaX, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

const FRAGMENT_MAIN = /* glsl */ `
#include <normal_fragment_maps>
{
  float fiberLen = length(vFiberObj);
  if (fiberLen > 0.1) {
    vec3 fdir = vFiberObj / fiberLen;
    vec3 nObj = normalize(vNormalObj);
    vec3 across = normalize(cross(nObj, fdir));
    float u = dot(vPosObj, across) * uFiberScale;
    float v = dot(vPosObj, fdir) * uFiberScale * 0.04;
    float w = dot(vPosObj, nObj) * uFiberScale * 0.1;
    // Striations are sines across the fibres; a low-frequency noise warps their phase along the fibres so
    // they read as organic fascicles. Sines have smooth screen-space derivatives (no speckle).
    float warp = fiberValueNoise(vec3(u * 0.12, v, w)) * 2.5;
    float fine = u + warp;
    float coarse = u * 0.27 + warp * 0.6 + 3.1;
    float fadeFine = 1.0 - smoothstep(0.2, 0.55, fwidth(fine));
    float fadeCoarse = 1.0 - smoothstep(0.2, 0.55, fwidth(coarse));
    const float TAU = 6.2831853;
    float aFine = 0.55 * fadeFine;
    float aCoarse = 0.45 * fadeCoarse;
    float h = aFine * sin(fine * TAU) + aCoarse * sin(coarse * TAU);
    float fade = max(fadeFine, fadeCoarse);
    if (fade > 0.0) {
      // Analytic chain rule: d(sin(p))/dx = cos(p) * dp/dx. The phases are smooth, so their screen-space
      // derivatives are too; differencing h itself would alias on stripes only a few pixels wide.
      vec2 dFine = vec2(dFdx(fine), dFdy(fine));
      vec2 dCoarse = vec2(dFdx(coarse), dFdy(coarse));
      vec2 dHdxy = (aFine * cos(fine * TAU) * dFine + aCoarse * cos(coarse * TAU) * dCoarse) * TAU * uFiberStrength;
      normal = fiberPerturbNormal(-vViewPosition, normal, dHdxy, faceDirection);
      diffuseColor.rgb *= mix(1.0, 0.9 + 0.1 * h, uFiberTint * fade);
    }
  }
}
`;

/** Patch a physical material so it renders fibre striations. Call again on clones (onBeforeCompile isn't copied). */
export function installFiberShader(material: THREE.MeshPhysicalMaterial, params: FiberParams): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFiberScale = { value: params.scale };
    shader.uniforms.uFiberStrength = { value: params.strength };
    shader.uniforms.uFiberTint = { value: params.tint };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
      .replace('#include <begin_vertex>', VERTEX_MAIN);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_PARS}`)
      .replace('#include <normal_fragment_maps>', FRAGMENT_MAIN);
  };
  material.customProgramCacheKey = () => `fiber:${params.scale}:${params.strength}:${params.tint}`;
  material.userData.fiberParams = params;
}
