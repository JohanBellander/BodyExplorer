import type * as THREE from 'three';
import type { AnatomyInfo } from '../data/anatomyDb';
import type { MuscleGroupKey } from '../data/muscleGroups';
import type { Side } from './names';

export type PartKind = 'muscle' | 'tendon' | 'bone';
export type DataSource = 'bp3d' | 'z-anatomy';

/** Metadata attached to every pickable mesh as `mesh.userData.part`. */
export interface AnatomyPart {
  id: string;
  kind: PartKind;
  /** Human-readable name, e.g. "Left Pectoralis Major (Abdominal Part)". */
  displayName: string;
  /** Raw mesh name as stored in the GLB. */
  rawName: string;
  group: MuscleGroupKey;
  side: Side;
  info: AnatomyInfo | null;
  source: DataSource;
  fmaId?: string;
}

export type PartMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material> & {
  userData: { part: AnatomyPart; baseMaterial: THREE.Material };
};

export interface MeshMappingEntry {
  name: string;
  originalName: string;
  fmaId: string;
  bpId: string;
  isTendon: boolean;
  source: DataSource;
}

export interface LoadedBody {
  root: THREE.Group;
  muscles: PartMesh[];
  bones: PartMesh[];
  skeleton: THREE.Group;
}
