import * as THREE from 'three';
import type { BodyController } from '../app/bodyController';
import type { PartMesh } from '../model/types';
import type { Stage } from '../scene/stage';

/** A press that moves further than this (CSS px) is a drag (rotate/pan), not a click. */
export const CLICK_MOVE_TOLERANCE = 5;

export function isClick(down: { x: number; y: number }, up: { x: number; y: number }): boolean {
  return Math.hypot(up.x - down.x, up.y - down.y) <= CLICK_MOVE_TOLERANCE;
}

/**
 * Hover + click picking with BVH-accelerated raycasts.
 * Hover is throttled to one raycast per animation frame and only runs for mouse pointers.
 */
export class Picker {
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private down: { x: number; y: number; id: number } | null = null;
  private pendingHover: PointerEvent | null = null;

  constructor(
    private readonly stage: Stage,
    private readonly body: BodyController,
    private readonly onPick: (mesh: PartMesh | null) => void,
  ) {
    this.raycaster.firstHitOnly = true;
    const el = stage.canvas;
    el.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.down = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    el.addEventListener('pointerup', (e) => this.onPointerUp(e));
    el.addEventListener('pointermove', (e) => this.queueHover(e));
    el.addEventListener('pointerleave', () => {
      this.body.hover(null);
      el.style.cursor = '';
    });
  }

  pickAt(clientX: number, clientY: number): PartMesh | null {
    const rect = this.stage.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.stage.camera);
    const hit = this.raycaster.intersectObjects(this.body.pickable(), false)[0];
    return (hit?.object as PartMesh | undefined) ?? null;
  }

  private onPointerUp(e: PointerEvent): void {
    const down = this.down;
    this.down = null;
    if (!down || down.id !== e.pointerId || e.button !== 0) return;
    if (!isClick(down, { x: e.clientX, y: e.clientY })) return;
    this.onPick(this.pickAt(e.clientX, e.clientY));
  }

  private queueHover(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    // Don't hover-highlight while dragging the camera.
    if (e.buttons !== 0) return;
    const first = this.pendingHover === null;
    this.pendingHover = e;
    if (!first) return;
    requestAnimationFrame(() => {
      const ev = this.pendingHover;
      this.pendingHover = null;
      if (!ev) return;
      const mesh = this.pickAt(ev.clientX, ev.clientY);
      this.body.hover(mesh);
      this.stage.canvas.style.cursor = mesh ? 'pointer' : '';
    });
  }
}
