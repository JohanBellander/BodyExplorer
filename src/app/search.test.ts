import { describe, expect, it } from 'vitest';
import { searchParts } from './search';

const items = [
  'Left Biceps Brachii (Long Head)',
  'Right Biceps Brachii (Long Head)',
  'Left Biceps Femoris (Short Head)',
  'Left Triceps Brachii (Lateral Head)',
  'Left Femur',
].map((displayName) => ({ displayName }));

describe('searchParts', () => {
  it('needs at least two characters', () => {
    expect(searchParts(items, 'b')).toEqual([]);
  });

  it('requires every query word', () => {
    expect(searchParts(items, 'right biceps').map((i) => i.displayName)).toEqual([
      'Right Biceps Brachii (Long Head)',
    ]);
  });

  it('ranks names starting with the query first', () => {
    expect(searchParts(items, 'biceps')[0]?.displayName).toMatch(/^Left Biceps/);
    expect(searchParts(items, 'brachii').map((i) => i.displayName)).toHaveLength(3);
  });
});
