import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

export interface QualitySettings {
  /** Screen-space ambient occlusion (GTAO). */
  ambientOcclusion: boolean;
  shadows: boolean;
}

/** Sensible default: full quality on desktop, lighter on small / touch-first devices. */
export function defaultQuality(): QualitySettings {
  const lowPower = window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 720;
  return { ambientOcclusion: !lowPower, shadows: true };
}

/** Vertical gradient used as the backdrop, so the body reads clearly against a soft studio-like falloff. */
function gradientBackground(top: string, bottom: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Renderer, camera, controls, lighting, floor and post-processing. Renders on demand: a frame is
 * drawn only when the camera moves (including damping), an animation runs, or {@link invalidate} is called.
 *
 * Lighting is image-based (a neutral room environment) plus one shadow-casting key light; the
 * composer adds GTAO ambient occlusion, a selection outline and tone mapping (Khronos PBR Neutral, which keeps tissue reds saturated).
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly keyLight: THREE.DirectionalLight;
  readonly floor: THREE.Mesh;
  readonly outline: OutlinePass;
  readonly quality: QualitySettings;

  private readonly composer: EffectComposer;
  private readonly ao: GTAOPass;
  private dirty = true;
  /** True while the camera moves; AO is skipped then and a full-quality frame is drawn once it settles. */
  private settlePending = false;
  private readonly frameCallbacks = new Set<(now: number) => boolean>();

  constructor(readonly canvas: HTMLCanvasElement) {
    this.quality = defaultQuality();
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(canvas.clientWidth, canvas.clientHeight, false);
    r.shadowMap.enabled = this.quality.shadows;
    r.shadowMap.type = THREE.VSMShadowMap;
    // The body is static: re-render the shadow map only when visibility changes (see refreshShadows).
    r.shadowMap.autoUpdate = false;
    r.shadowMap.needsUpdate = true;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    this.renderer = r;

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.6;
    pmrem.dispose();
    this.scene.background = gradientBackground('#3b3d47', '#0e0f13');

    this.camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 300);
    this.camera.position.set(0, 5, 45);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 120;
    this.controls.zoomToCursor = true; // scroll / pinch zooms towards the point under the cursor
    this.controls.target.set(0, 5, 0);
    this.controls.addEventListener('change', () => this.invalidate());

    this.keyLight = this.addLights();
    this.floor = this.addFloor();

    // Post-processing. A multisampled target gives MSAA through the composer.
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.ao = new GTAOPass(this.scene, this.camera, size.x, size.y);
    this.ao.blendIntensity = 1.0;
    this.ao.updateGtaoMaterial({
      radius: 1.0,
      distanceExponent: 2,
      thickness: 2,
      scale: 1.4,
      samples: 16,
    });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    this.composer.addPass(this.ao);

    this.outline = new OutlinePass(new THREE.Vector2(size.x, size.y), this.scene, this.camera);
    this.outline.edgeStrength = 4;
    this.outline.edgeThickness = 1.5;
    this.outline.edgeGlow = 0.3;
    this.outline.visibleEdgeColor.set('#ffd28a');
    this.outline.hiddenEdgeColor.set('#7a5a30');
    this.outline.enabled = false;
    this.composer.addPass(this.outline);

    this.composer.addPass(new OutputPass());

    new ResizeObserver(() => this.resize()).observe(canvas);
    r.setAnimationLoop((now) => this.tick(now));
  }

  /** Request a redraw on the next frame. */
  invalidate(): void {
    this.dirty = true;
  }

  /** Run `cb` every frame until it returns false. */
  onFrame(cb: (now: number) => boolean): void {
    this.frameCallbacks.add(cb);
    this.invalidate();
  }

  setAmbientOcclusion(on: boolean): void {
    this.quality.ambientOcclusion = on;
    this.invalidate();
  }

  /** Re-render the shadow map on the next frame (call after anything visible is shown or hidden). */
  refreshShadows(): void {
    this.renderer.shadowMap.needsUpdate = true;
    this.invalidate();
  }

  setShadows(on: boolean): void {
    this.quality.shadows = on;
    this.renderer.shadowMap.enabled = on;
    this.keyLight.castShadow = on;
    this.floor.visible = on;
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      for (const mat of Array.isArray(m) ? m : [m]) mat.needsUpdate = true;
    });
    this.invalidate();
  }

  /** Objects drawn with the selection outline. */
  setOutlined(objects: THREE.Object3D[]): void {
    this.outline.selectedObjects = objects;
    this.outline.enabled = objects.length > 0;
    this.invalidate();
  }

  /** Place floor and shadow camera around the loaded body. */
  fitTo(box: THREE.Box3): void {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    this.floor.position.y = box.min.y - 0.05;

    const light = this.keyLight;
    light.target.position.copy(center);
    light.position.copy(center).add(new THREE.Vector3(12, 22, 16));
    const cam = light.shadow.camera;
    const r = Math.max(size.x, size.y, size.z) * 0.6;
    cam.left = -r;
    cam.right = r;
    cam.top = r;
    cam.bottom = -r;
    cam.near = 1;
    cam.far = light.position.distanceTo(center) + r * 2;
    cam.updateProjectionMatrix();
    this.refreshShadows();
  }

  private tick(now: number): void {
    let moving = this.frameCallbacks.size > 0;
    for (const cb of this.frameCallbacks) {
      if (!cb(now)) this.frameCallbacks.delete(cb);
    }
    // OrbitControls.update() returns true while the camera is still moving (damping).
    if (this.controls.update()) moving = true;

    if (moving) {
      this.settlePending = true;
      this.dirty = true;
    } else if (this.settlePending) {
      this.settlePending = false;
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.ao.enabled = this.quality.ambientOcclusion && !moving;
    this.composer.render();
  }

  private resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.invalidate();
  }

  private addLights(): THREE.DirectionalLight {
    // Warm key light with soft shadows; the environment map provides fill and reflections.
    const key = new THREE.DirectionalLight(0xfff1e0, 3.2);
    key.castShadow = this.quality.shadows;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 6;
    key.shadow.blurSamples = 16;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    this.scene.add(key, key.target);

    // Cool rim light from behind to separate the silhouette from the background.
    const rim = new THREE.DirectionalLight(0xbfd4ff, 1.8);
    rim.position.set(-8, 12, -20);
    this.scene.add(rim);
    return key;
  }

  private addFloor(): THREE.Mesh {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 64),
      new THREE.ShadowMaterial({ opacity: 0.35, color: 0x000000 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.y = -16;
    this.scene.add(floor);
    return floor;
  }
}
