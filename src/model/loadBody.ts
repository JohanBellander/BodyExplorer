import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { classifyMuscleGroup } from '../data/muscleGroups';
import { getMuscleInfo } from '../data/anatomyDb';
import { determineSide, formatMuscleName, isConnectiveTissue, normalizeMeshName } from './names';
import type { MaterialLibrary } from './materials';
import type { AnatomyPart, LoadedBody, MeshMappingEntry, PartKind, PartMesh } from './types';

// Accelerated raycasting for every mesh: picking against ~1.6M triangles goes from O(n) to O(log n).
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

/** Per-vertex muscle fibre direction written by the asset pipeline (glTF "_FIBER", lower-cased by GLTFLoader). */
export const FIBER_ATTRIBUTE = '_fiber';

/** Scene height of the body in world units. */
export const BODY_HEIGHT = 30;

export interface LoadOptions {
  baseUrl: string;
  materials: MaterialLibrary;
  onProgress?: (fraction: number) => void;
}

/**
 * BodyParts3D coordinates: X = left-right, Y = front-back, Z = bottom-top (mm).
 * Three.js:               X = left-right, Y = up,        Z = towards viewer.
 * Returns a matrix that converts BP3D mm into centred scene units.
 */
function bp3dToScene(center: THREE.Vector3, scale: number): THREE.Matrix4 {
  const axes = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
  const s = new THREE.Matrix4().makeScale(scale, scale, scale);
  const t = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
  return axes.multiply(s).multiply(t);
}

function loadGLB(loader: GLTFLoader, url: string, onProgress: (f: number) => void): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      resolve,
      (e) => {
        if (e.total > 0) onProgress(e.loaded / e.total);
      },
      reject,
    );
  });
}

async function loadMapping(url: string): Promise<Map<string, MeshMappingEntry>> {
  const map = new Map<string, MeshMappingEntry>();
  try {
    const res = await fetch(url);
    if (!res.ok) return map;
    const entries = (await res.json()) as MeshMappingEntry[];
    for (const e of entries) map.set(normalizeMeshName(e.name), e);
  } catch {
    // Mapping is optional metadata; the app works without it.
  }
  return map;
}

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
  });
  return out;
}

function makePart(rawName: string, kind: PartKind, index: number, entry?: MeshMappingEntry): AnatomyPart {
  return {
    id: `${kind}:${index}`,
    kind,
    displayName: formatMuscleName(rawName),
    rawName: normalizeMeshName(rawName),
    group: kind === 'bone' ? 'OTHER' : (classifyMuscleGroup(normalizeMeshName(rawName)) ?? 'OTHER'),
    side: determineSide(rawName),
    info: kind === 'bone' ? null : getMuscleInfo(normalizeMeshName(rawName)),
    source: entry?.source ?? 'bp3d',
    ...(entry?.fmaId ? { fmaId: entry.fmaId } : {}),
  };
}

/**
 * Meshopt/quantized GLBs store positions and normals as normalized integers. Transforming those in
 * place would clamp them to [-1, 1], so expand to Float32 first (the geometry is baked into scene space).
 */
function dequantize(geometry: THREE.BufferGeometry): void {
  for (const name of ['position', 'normal', FIBER_ATTRIBUTE]) {
    const attr = geometry.getAttribute(name);
    if (!attr || attr.array instanceof Float32Array) continue;
    const out = new Float32Array(attr.count * 3);
    for (let i = 0; i < attr.count; i++) {
      out[i * 3] = attr.getX(i);
      out[i * 3 + 1] = attr.getY(i);
      out[i * 3 + 2] = attr.getZ(i);
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(out, 3));
  }
}

function toPartMesh(
  src: THREE.Mesh,
  toScene: THREE.Matrix4,
  part: AnatomyPart,
  material: THREE.Material,
): PartMesh {
  const geometry = src.geometry.clone();
  dequantize(geometry);
  const matrix = new THREE.Matrix4().multiplyMatrices(toScene, src.matrixWorld);
  geometry.applyMatrix4(matrix);
  // applyMatrix4 only knows position/normal/tangent; rotate the fibre directions the same way.
  const fiber = geometry.getAttribute(FIBER_ATTRIBUTE) as THREE.BufferAttribute | undefined;
  if (fiber) {
    fiber.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(matrix));
    const v = new THREE.Vector3();
    for (let i = 0; i < fiber.count; i++) {
      v.fromBufferAttribute(fiber, i).normalize();
      fiber.setXYZ(i, v.x, v.y, v.z);
    }
  }
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.computeBoundsTree();

  const mesh = new THREE.Mesh(geometry, material) as unknown as PartMesh;
  mesh.name = part.rawName;
  // Cast onto the floor only; on-body contact shading comes from ambient occlusion.
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.userData = { part, baseMaterial: material };
  return mesh;
}

export async function loadBody({ baseUrl, materials, onProgress }: LoadOptions): Promise<LoadedBody> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  let anatomyP = 0;
  let skeletonP = 0;
  const report = () => onProgress?.(anatomyP * 0.7 + skeletonP * 0.3);

  const [anatomy, skeleton, mapping] = await Promise.all([
    loadGLB(loader, `${baseUrl}anatomy.glb`, (f) => {
      anatomyP = f;
      report();
    }),
    loadGLB(loader, `${baseUrl}skeleton.glb`, (f) => {
      skeletonP = f;
      report();
    }),
    loadMapping(`${baseUrl}mesh_mapping.json`),
  ]);

  // Size and centre are taken from the muscle model; bones share the same transform so they line up.
  const box = new THREE.Box3().setFromObject(anatomy.scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const toScene = bp3dToScene(center, BODY_HEIGHT / size.z);

  const root = new THREE.Group();
  root.name = 'Body';
  const skeletonGroup = new THREE.Group();
  skeletonGroup.name = 'Skeleton';
  root.add(skeletonGroup);

  const muscles = collectMeshes(anatomy.scene).map((src, i) => {
    const entry = mapping.get(normalizeMeshName(src.name));
    const kind: PartKind = (entry?.isTendon ?? isConnectiveTissue(src.name)) ? 'tendon' : 'muscle';
    const part = makePart(src.name || `mesh ${i}`, kind, i, entry);
    const mesh = toPartMesh(src, toScene, part, materials.base(part, 'natural'));
    mesh.renderOrder = 1;
    root.add(mesh);
    return mesh;
  });

  const bones = collectMeshes(skeleton.scene).map((src, i) => {
    const part = makePart(src.name || `bone ${i}`, 'bone', i);
    const mesh = toPartMesh(src, toScene, part, materials.bone);
    mesh.renderOrder = 0;
    skeletonGroup.add(mesh);
    return mesh;
  });

  return { root, muscles, bones, skeleton: skeletonGroup };
}
