import { describe, expect, it } from 'vitest';
import { CLICK_MOVE_TOLERANCE, isClick } from './picking';

describe('isClick', () => {
  it('treats a small movement as a click and a drag as not', () => {
    expect(isClick({ x: 10, y: 10 }, { x: 12, y: 11 })).toBe(true);
    expect(isClick({ x: 10, y: 10 }, { x: 10 + CLICK_MOVE_TOLERANCE + 1, y: 10 })).toBe(false);
  });
});
