import { describe, expect, it } from 'vitest';
import { isTopCenterTriggerPoint } from '../edgeTrigger.js';

const bounds = { x: 0, y: 0, width: 1920, height: 1080 };
const options = { topBandPx: 8, centerWidthPx: 440 };

describe('isTopCenterTriggerPoint', () => {
  it('matches points touching the top center trigger band', () => {
    expect(isTopCenterTriggerPoint({ x: 960, y: 0 }, bounds, options)).toBe(true);
    expect(isTopCenterTriggerPoint({ x: 740, y: 8 }, bounds, options)).toBe(true);
    expect(isTopCenterTriggerPoint({ x: 1180, y: 8 }, bounds, options)).toBe(true);
  });

  it('rejects points outside the top center trigger band', () => {
    expect(isTopCenterTriggerPoint({ x: 960, y: 9 }, bounds, options)).toBe(false);
    expect(isTopCenterTriggerPoint({ x: 739, y: 0 }, bounds, options)).toBe(false);
    expect(isTopCenterTriggerPoint({ x: 1181, y: 0 }, bounds, options)).toBe(false);
  });
});
