import * as THREE from 'three';
import type { Stage } from './stage';

export type ViewPreset = 'front' | 'back' | 'left' | 'right';

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Smooth camera moves, preset views and framing. */
export class CameraRig {
  private homePosition = new THREE.Vector3(0, 5, 35);
  private homeTarget = new THREE.Vector3(0, 5, 0);
  private animationId = 0;

  constructor(private readonly stage: Stage) {}

  /** Frame a bounding box from the front and remember it as the home view. */
  frame(box: THREE.Box3, duration = 1200): void {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad(this.stage.camera.fov);
    const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.3;
    this.homeTarget.copy(center);
    this.homePosition.set(center.x, center.y, center.z + dist);
    this.animateTo(this.homePosition, this.homeTarget, duration);
  }

  home(duration = 800): void {
    this.animateTo(this.homePosition, this.homeTarget, duration);
  }

  view(preset: ViewPreset, duration = 800): void {
    const dist = this.homePosition.distanceTo(this.homeTarget);
    const dir = {
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
      left: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(1, 0, 0),
    }[preset];
    this.animateTo(this.homeTarget.clone().addScaledVector(dir, dist), this.homeTarget, duration);
  }

  /** Fly to a mesh, keeping the current viewing direction. */
  focus(object: THREE.Object3D, duration = 1000): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const dist = Math.max(Math.max(size.x, size.y, size.z) * 3, 8);
    const dir = this.stage.camera.getWorldDirection(new THREE.Vector3());
    this.animateTo(center.clone().addScaledVector(dir, -dist), center, duration);
  }

  animateTo(position: THREE.Vector3, target: THREE.Vector3, duration: number): void {
    const { camera, controls } = this.stage;
    const fromPos = camera.position.clone();
    const fromTarget = controls.target.clone();
    const toPos = position.clone();
    const toTarget = target.clone();
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const total = reduceMotion ? 0 : duration;
    const id = ++this.animationId;
    let start = -1;

    this.stage.onFrame((now) => {
      if (id !== this.animationId) return false; // superseded by a newer move
      if (start < 0) start = now;
      const t = total === 0 ? 1 : Math.min((now - start) / total, 1);
      const e = easeInOutQuad(t);
      camera.position.lerpVectors(fromPos, toPos, e);
      controls.target.lerpVectors(fromTarget, toTarget, e);
      return t < 1;
    });
  }

  /** Cancel a running camera animation (e.g. when the user grabs the controls). */
  cancel(): void {
    this.animationId++;
  }
}
