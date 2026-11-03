import { describe, expect, it } from 'vitest';
import {
  determineSide,
  formatMuscleName,
  getAnatomySearchTerm,
  isConnectiveTissue,
  normalizeMeshName,
} from './names';

describe('normalizeMeshName', () => {
  it('undoes GLTFLoader underscores and strips duplicate suffixes', () => {
    expect(normalizeMeshName('left_gluteus_maximus_(2)')).toBe('left gluteus maximus');
    expect(normalizeMeshName('  left   deltoid ')).toBe('left deltoid');
  });
});

describe('formatMuscleName', () => {
  it.each([
    ['abdominal part of left pectoralis major', 'Left Pectoralis Major (Abdominal Part)'],
    ['left gluteus maximus', 'Left Gluteus Maximus'],
    ['long head of right biceps brachii', 'Right Biceps Brachii (Long Head)'],
    ['abductor digiti minimi of left foot', 'Abductor Digiti Minimi of Left Foot'],
    ['right_sartorius_(2)', 'Right Sartorius'],
  ])('%s -> %s', (raw, expected) => {
    expect(formatMuscleName(raw)).toBe(expected);
  });
});

describe('getAnatomySearchTerm', () => {
  it.each([
    ['abdominal part of left pectoralis major', 'pectoralis major'],
    ['left calcaneal tendon', 'calcaneal tendon'],
    ['long head of right biceps brachii', 'biceps brachii'],
  ])('%s -> %s', (raw, expected) => {
    expect(getAnatomySearchTerm(raw)).toBe(expected);
  });
});

describe('determineSide', () => {
  it('detects whole-word sides only', () => {
    expect(determineSide('left deltoid')).toBe('Left');
    expect(determineSide('right_soleus')).toBe('Right');
    expect(determineSide('diaphragm')).toBe('Center');
    expect(determineSide('copyright muscle')).toBe('Center');
  });
});

describe('isConnectiveTissue', () => {
  it('classifies tendons, ligaments and fascia', () => {
    expect(isConnectiveTissue('left calcaneal tendon')).toBe(true);
    expect(isConnectiveTissue('left iliotibial tract')).toBe(true);
    expect(isConnectiveTissue('left biceps brachii')).toBe(false);
  });
});
