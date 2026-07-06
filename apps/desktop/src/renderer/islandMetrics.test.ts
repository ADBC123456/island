import { describe, expect, it } from 'vitest';
import { islandDimensions } from './islandMetrics';

describe('island metrics', () => {
  it('matches the 10px-spaced candidate list height rhythm', () => {
    expect(islandDimensions('expanded', 3)).toEqual({
      width: 704,
      height: 394,
      borderRadius: 36
    });
  });
});
