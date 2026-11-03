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

type Physical = THREE.MeshPhysicalMaterial;

/** Moist muscle tissue: a soft sheen and a faint clearcoat give the wet, fibrous look of an écorché. */
function muscleMaterial(color: THREE.ColorRepresentation): Physical {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    metalness: 0,
    sheen: 0.35,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffb0a0), 0.4),
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
}

/** Tendon / fascia: pearly, glistening white. */
function tendonMaterial(): Physical {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe6dcc6,
    roughness: 0.32,
    sheen: 1,
    sheenRoughness: 0.3,
    sheenColor: 0xffffff,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    side: THREE.DoubleSide,
  });
}

/** Bone: matte, slightly warm ivory. */
function boneMaterial(): Physical {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8dcc0,
    roughness: 0.72,
    sheen: 0.3,
    sheenColor: 0xfff6e0,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0.6,
  });
}

/**
 * Owns every material in the scene. Materials are shared between meshes; a mesh's material is
 * derived from its part + appearance state via {@link MaterialLibrary.resolve}, so hover, selection,
 * custom colours and colour modes never fight each other.
 *
 * Hover and selection don't swap to a fixed colour: they use a brightened variant of the part's own
 * material (cached per base material), and selection is additionally outlined by the Stage.
 */
export class MaterialLibrary {
  readonly muscle = muscleMaterial(0x7c1c16);
  readonly tendon = tendonMaterial();
  readonly bone = boneMaterial();
  readonly groups: Record<MuscleGroupKey, Physical>;
  readonly custom: Physical[];

  private readonly hoverVariants = new Map<THREE.Material, Physical>();
  private readonly selectedVariants = new Map<THREE.Material, Physical>();
  private muscleOpacity = 1;
  private boneOpacity = 0.6;

  constructor() {
    this.groups = Object.fromEntries(
      MUSCLE_GROUP_KEYS.map((k) => [k, muscleMaterial(MUSCLE_GROUPS[k].color)]),
    ) as Record<MuscleGroupKey, Physical>;
    this.custom = HIGHLIGHT_COLORS.map((c) => muscleMaterial(c.hex));
  }

  /** Base (unhighlighted) material for a part. */
  base(part: AnatomyPart, mode: ColorMode): Physical {
    if (part.kind === 'bone') return this.bone;
    if (part.kind === 'tendon') return this.tendon;
    return mode === 'group' ? this.groups[part.group] : this.muscle;
  }

  resolve(part: AnatomyPart, s: AppearanceState): Physical {
    const base =
      part.kind !== 'bone' && s.customColorIndex !== null
        ? (this.custom[s.customColorIndex] ?? this.base(part, s.colorMode))
        : this.base(part, s.colorMode);
    if (s.selected) return this.variant(this.selectedVariants, base, 0.28);
    if (s.hovered) return this.variant(this.hoverVariants, base, 0.16);
    return base;
  }

  private variant(cache: Map<THREE.Material, Physical>, base: Physical, glow: number): Physical {
    let v = cache.get(base);
    if (!v) {
      v = base.clone();
      v.emissive = base.color.clone().lerp(new THREE.Color(0xffe0b0), 0.5).multiplyScalar(glow);
      applyOpacity(v, base === this.bone ? this.boneOpacity : this.muscleOpacity, base === this.bone);
      cache.set(base, v);
    }
    return v;
  }

  private softTissue(): Physical[] {
    const all = [this.muscle, this.tendon, ...Object.values(this.groups), ...this.custom];
    const variants = [...this.hoverVariants, ...this.selectedVariants]
      .filter(([base]) => base !== this.bone)
      .map(([, v]) => v);
    return [...all, ...variants];
  }

  setMuscleOpacity(opacity: number): void {
    this.muscleOpacity = opacity;
    for (const m of this.softTissue()) applyOpacity(m, opacity, false);
  }

  setBoneOpacity(opacity: number): void {
    this.boneOpacity = opacity;
    const bones = [this.bone, this.hoverVariants.get(this.bone), this.selectedVariants.get(this.bone)];
    for (const m of bones) if (m) applyOpacity(m, opacity, true);
  }
}

/**
 * Transparent soft tissue renders front faces only and keeps writing depth. That way you see the
 * outer surface of each muscle as a clean translucent shell over the bones, instead of a soup of
 * interleaved inner/back faces from hundreds of overlapping meshes.
 */
function applyOpacity(m: Physical, opacity: number, isBone: boolean): void {
  const transparent = opacity < 1;
  const side = isBone || transparent ? THREE.FrontSide : THREE.DoubleSide;
  if (m.transparent !== transparent || m.side !== side) m.needsUpdate = true;
  m.opacity = opacity;
  m.transparent = transparent;
  m.side = side;
  m.depthWrite = true;
}
