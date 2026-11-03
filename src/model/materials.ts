import * as THREE from 'three';
import { MUSCLE_GROUPS, MUSCLE_GROUP_KEYS, type MuscleGroupKey } from '../data/muscleGroups';
import type { AnatomyPart } from './types';

export type ColorMode = 'natural' | 'group';

export const HIGHLIGHT_COLORS = [
  { name: 'Red', hex: '#e74c3c' },
  { name: 'Orange', hex: '#e67e22' },
  { name: 'Yellow', hex: '#f1c40f' },
  { name: 'Green', hex: '#2ecc71' },
  { name: 'Cyan', hex: '#1abc9c' },
  { name: 'Blue', hex: '#3498db' },
  { name: 'Purple', hex: '#9b59b6' },
  { name: 'Pink', hex: '#e91e90' },
] as const;

export interface AppearanceState {
  colorMode: ColorMode;
  hovered: boolean;
  selected: boolean;
  customColorIndex: number | null;
}

function standard(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ metalness: 0, side: THREE.DoubleSide, ...params });
}

/**
 * Owns every material in the scene. Materials are shared between meshes; a mesh's material is
 * derived from its part + appearance state via {@link MaterialLibrary.resolve}, so highlight,
 * selection, custom colours and colour modes never fight each other.
 */
export class MaterialLibrary {
  readonly muscle = standard({ color: 0x9e2a22, roughness: 0.55 });
  readonly tendon = standard({ color: 0xebe0c7, roughness: 0.45 });
  readonly bone = standard({
    color: 0xf2ebd9,
    roughness: 0.6,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  readonly hover = standard({ color: 0xff9966, roughness: 0.4, emissive: 0x4d1a0d });
  readonly selected = standard({ color: 0xffbf8c, roughness: 0.35, emissive: 0x66260d });
  readonly boneHover = standard({ color: 0xfff4d6, roughness: 0.5, emissive: 0x332a10 });
  readonly boneSelected = standard({ color: 0xffe9a8, roughness: 0.45, emissive: 0x4d3a10 });
  readonly groups: Record<MuscleGroupKey, THREE.MeshStandardMaterial>;
  readonly custom: THREE.MeshStandardMaterial[];

  constructor() {
    this.groups = Object.fromEntries(
      MUSCLE_GROUP_KEYS.map((k) => [k, standard({ color: MUSCLE_GROUPS[k].color, roughness: 0.55 })]),
    ) as Record<MuscleGroupKey, THREE.MeshStandardMaterial>;
    this.custom = HIGHLIGHT_COLORS.map((c) =>
      standard({
        color: c.hex,
        roughness: 0.4,
        emissive: new THREE.Color(c.hex).multiplyScalar(0.15),
      }),
    );
  }

  /** Base (unhighlighted) material for a part. */
  base(part: AnatomyPart, mode: ColorMode): THREE.Material {
    if (part.kind === 'bone') return this.bone;
    if (part.kind === 'tendon') return this.tendon;
    return mode === 'group' ? this.groups[part.group] : this.muscle;
  }

  resolve(part: AnatomyPart, s: AppearanceState): THREE.Material {
    if (part.kind === 'bone') {
      if (s.selected) return this.boneSelected;
      if (s.hovered) return this.boneHover;
      return this.bone;
    }
    if (s.selected) return this.selected;
    if (s.hovered) return this.hover;
    if (s.customColorIndex !== null) return this.custom[s.customColorIndex] ?? this.base(part, s.colorMode);
    return this.base(part, s.colorMode);
  }

  private softTissue(): THREE.MeshStandardMaterial[] {
    return [
      this.muscle,
      this.tendon,
      this.hover,
      this.selected,
      ...Object.values(this.groups),
      ...this.custom,
    ];
  }

  setMuscleOpacity(opacity: number): void {
    for (const m of this.softTissue()) applyOpacity(m, opacity);
  }

  setBoneOpacity(opacity: number): void {
    for (const m of [this.bone, this.boneHover, this.boneSelected]) applyOpacity(m, opacity);
  }
}

function applyOpacity(m: THREE.Material, opacity: number): void {
  const transparent = opacity < 1;
  if (m.transparent !== transparent) m.needsUpdate = true;
  m.opacity = opacity;
  m.transparent = transparent;
  m.depthWrite = !transparent;
}
