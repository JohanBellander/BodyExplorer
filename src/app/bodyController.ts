import { MUSCLE_GROUP_KEYS, type MuscleGroupKey } from '../data/muscleGroups';
import type { ColorMode, MaterialLibrary } from '../model/materials';
import type { LoadedBody, PartMesh } from '../model/types';

export type ChangeKind = 'selection' | 'visibility' | 'appearance';
type Listener = (kind: ChangeKind) => void;

export const DEFAULTS = {
  muscleOpacity: 1,
  boneOpacity: 0.6,
  showSkeleton: true,
  showTendons: true,
  colorMode: 'natural' as ColorMode,
};

/**
 * Single owner of the explorer's state (selection, hover, visibility, colours, opacity).
 * Everything that changes how a mesh looks goes through here, then {@link refresh} derives the
 * mesh's material from that state.
 */
export class BodyController {
  selected: PartMesh | null = null;
  hovered: PartMesh | null = null;
  readonly hidden = new Set<PartMesh>();
  readonly customColors = new Map<PartMesh, number>();
  readonly activeGroups = new Set<MuscleGroupKey>(MUSCLE_GROUP_KEYS);
  showSkeleton = DEFAULTS.showSkeleton;
  showTendons = DEFAULTS.showTendons;
  colorMode: ColorMode = DEFAULTS.colorMode;
  muscleOpacity = DEFAULTS.muscleOpacity;
  boneOpacity = DEFAULTS.boneOpacity;

  private readonly listeners = new Set<Listener>();

  constructor(
    readonly body: LoadedBody,
    private readonly materials: MaterialLibrary,
    private readonly invalidate: () => void,
  ) {
    this.applyVisibility();
  }

  get allParts(): PartMesh[] {
    return [...this.body.muscles, ...this.body.bones];
  }

  /** Meshes that can currently be picked. */
  pickable(): PartMesh[] {
    const out = this.body.muscles.filter((m) => m.visible);
    if (this.showSkeleton) out.push(...this.body.bones.filter((b) => b.visible));
    return out;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(kind: ChangeKind): void {
    this.invalidate();
    for (const fn of this.listeners) fn(kind);
  }

  private refresh(mesh: PartMesh | null): void {
    if (!mesh) return;
    mesh.material = this.materials.resolve(mesh.userData.part, {
      colorMode: this.colorMode,
      hovered: mesh === this.hovered,
      selected: mesh === this.selected,
      customColorIndex: this.customColors.get(mesh) ?? null,
    });
  }

  private refreshAll(): void {
    for (const m of this.allParts) this.refresh(m);
  }

  hover(mesh: PartMesh | null): void {
    if (mesh === this.hovered) return;
    const prev = this.hovered;
    this.hovered = mesh;
    this.refresh(prev);
    this.refresh(mesh);
    this.invalidate();
  }

  select(mesh: PartMesh | null): void {
    if (mesh === this.selected) return;
    const prev = this.selected;
    this.selected = mesh;
    this.refresh(prev);
    this.refresh(mesh);
    this.emit('selection');
  }

  setCustomColor(mesh: PartMesh, index: number | null): void {
    if (index === null) this.customColors.delete(mesh);
    else this.customColors.set(mesh, index);
    this.refresh(mesh);
    this.emit('appearance');
  }

  setColorMode(mode: ColorMode): void {
    this.colorMode = mode;
    this.refreshAll();
    this.emit('appearance');
  }

  setMuscleOpacity(v: number): void {
    this.muscleOpacity = v;
    this.materials.setMuscleOpacity(v);
    this.emit('appearance');
  }

  setBoneOpacity(v: number): void {
    this.boneOpacity = v;
    this.materials.setBoneOpacity(v);
    this.emit('appearance');
  }

  hide(mesh: PartMesh): void {
    this.hidden.add(mesh);
    if (this.selected === mesh) this.select(null);
    if (this.hovered === mesh) this.hover(null);
    this.applyVisibility();
    this.emit('visibility');
  }

  unhide(mesh: PartMesh): void {
    this.hidden.delete(mesh);
    this.applyVisibility();
    this.emit('visibility');
  }

  /** Make a mesh visible whatever is currently hiding it (manual hide, group filter, tendon/skeleton toggle). */
  reveal(mesh: PartMesh): void {
    const p = mesh.userData.part;
    this.hidden.delete(mesh);
    if (p.kind === 'bone') this.showSkeleton = true;
    else this.activeGroups.add(p.group);
    if (p.kind === 'tendon') this.showTendons = true;
    this.applyVisibility();
    this.emit('visibility');
  }

  unhideAll(): void {
    this.hidden.clear();
    this.applyVisibility();
    this.emit('visibility');
  }

  setGroupActive(group: MuscleGroupKey, active: boolean): void {
    if (active) this.activeGroups.add(group);
    else this.activeGroups.delete(group);
    this.applyVisibility();
    this.emit('visibility');
  }

  setShowTendons(v: boolean): void {
    this.showTendons = v;
    this.applyVisibility();
    this.emit('visibility');
  }

  setShowSkeleton(v: boolean): void {
    this.showSkeleton = v;
    this.applyVisibility();
    this.emit('visibility');
  }

  reset(): void {
    this.hidden.clear();
    this.customColors.clear();
    for (const g of MUSCLE_GROUP_KEYS) this.activeGroups.add(g);
    this.showSkeleton = DEFAULTS.showSkeleton;
    this.showTendons = DEFAULTS.showTendons;
    this.colorMode = DEFAULTS.colorMode;
    this.setMuscleOpacity(DEFAULTS.muscleOpacity);
    this.setBoneOpacity(DEFAULTS.boneOpacity);
    this.selected = null;
    this.hovered = null;
    this.applyVisibility();
    this.refreshAll();
    this.emit('selection');
    this.emit('visibility');
  }

  private applyVisibility(): void {
    this.body.skeleton.visible = this.showSkeleton;
    for (const m of this.body.muscles) {
      const p = m.userData.part;
      m.visible =
        !this.hidden.has(m) && this.activeGroups.has(p.group) && (p.kind !== 'tendon' || this.showTendons);
    }
    for (const b of this.body.bones) b.visible = !this.hidden.has(b);
    if (this.selected && !this.selected.visible) this.select(null);
  }
}
