import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Renderer, camera, controls, lights and floor. Renders on demand: a frame is drawn only when
 * the camera moves (including damping), an animation is running, or {@link Stage.invalidate} is called.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly keyLight: THREE.DirectionalLight;
  readonly floor: THREE.Group;

  private dirty = true;
  private readonly frameCallbacks = new Set<(now: number) => boolean>();

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;

    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    this.camera.position.set(0, 5, 35);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 100;
    this.controls.zoomToCursor = true; // scroll / pinch zooms towards the point under the cursor
    this.controls.target.set(0, 5, 0);
    this.controls.addEventListener('change', () => this.invalidate());

    this.keyLight = this.addLights();
    this.floor = this.addFloor();

    new ResizeObserver(() => this.resize()).observe(canvas);
    this.renderer.setAnimationLoop((now) => this.tick(now));
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

  /** Place floor and shadow camera around the loaded body. */
  fitTo(box: THREE.Box3): void {
    const size = box.getSize(new THREE.Vector3());
    const feetY = box.min.y - 0.5;
    this.floor.position.y = feetY;
    const cam = this.keyLight.shadow.camera;
    cam.top = box.max.y + 5;
    cam.bottom = feetY - 1;
    cam.left = -size.x;
    cam.right = size.x;
    cam.far = Math.max(size.x, size.y, size.z) * 3;
    cam.updateProjectionMatrix();
    this.invalidate();
  }

  private tick(now: number): void {
    for (const cb of this.frameCallbacks) {
      if (!cb(now)) this.frameCallbacks.delete(cb);
      this.dirty = true;
    }
    // OrbitControls.update() returns true while the camera is still moving (damping).
    if (this.controls.update()) this.dirty = true;
    if (!this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.invalidate();
  }

  private addLights(): THREE.DirectionalLight {
    this.scene.add(new THREE.AmbientLight(0x8088a0, 1.4));

    const key = new THREE.DirectionalLight(0xffeedd, 1.8);
    key.position.set(10, 20, 15);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x9999dd, 1.0);
    fill.position.set(-10, 10, -10);
    const rim = new THREE.DirectionalLight(0xff6666, 0.5);
    rim.position.set(0, 5, -20);
    const bottom = new THREE.DirectionalLight(0x778899, 0.6);
    bottom.position.set(0, -10, 5);
    const front = new THREE.DirectionalLight(0xffffff, 0.8);
    front.position.set(0, 10, 20);
    this.scene.add(fill, rim, bottom, front, new THREE.HemisphereLight(0xbbddff, 0x553333, 0.8));
    return key;
  }

  private addFloor(): THREE.Group {
    const floor = new THREE.Group();
    floor.add(new THREE.GridHelper(60, 30, 0x333355, 0x222244));
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.3 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.receiveShadow = true;
    floor.add(shadow);
    floor.position.y = -16;
    this.scene.add(floor);
    return floor;
  }
}
