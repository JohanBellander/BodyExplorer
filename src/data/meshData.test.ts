import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MeshMappingEntry } from '../model/types';
import { getMuscleInfo, isUnknownInfo } from './anatomyDb';
import { classifyMuscleGroup } from './muscleGroups';

// Runs the classifiers against every mesh that actually ships in public/anatomy.glb.
const mapping = JSON.parse(
  readFileSync(new URL('../../public/mesh_mapping.json', import.meta.url), 'utf8'),
) as MeshMappingEntry[];

describe('shipped mesh data', () => {
  it('has the expected number of meshes', () => {
    expect(mapping.length).toBeGreaterThan(400);
  });

  it('classifies nearly every mesh into a muscle group', () => {
    const unclassified = mapping.filter((m) => classifyMuscleGroup(m.name) === null).map((m) => m.name);
    // Coverage ratchet: lower this when you add classifier rules, never raise it.
    expect(unclassified.length).toBeLessThanOrEqual(1);
  });

  it('has anatomy info for most muscles', () => {
    const missing = mapping.filter((m) => isUnknownInfo(getMuscleInfo(m.name)));
    // Coverage ratchet (74 of 467 at the time of writing): lower it as entries are added.
    expect(missing.length).toBeLessThanOrEqual(74);
  });
});

describe('classifyMuscleGroup', () => {
  it.each([
    ['acromial part of left deltoid', 'SHOULDER'],
    ['left brachioradialis', 'FOREARM'],
    ['left brachialis', 'UPPER_ARM'],
    ['right gluteus maximus', 'HIP'],
    ['left soleus', 'LOWER_LEG'],
    ['diaphragm', 'TRUNK'],
  ])('%s -> %s', (name, group) => {
    expect(classifyMuscleGroup(name)).toBe(group);
  });
});
