import { describe, expect, it } from 'vitest';
import {
  contentPopTransition,
  shellRetractAnimationMs,
  shellRetractTransition
} from './motionTokens';

describe('motionTokens', () => {
  it('keeps shell retract deterministic so clearing input cannot spring past compact', () => {
    expect(shellRetractTransition.type).toBe('tween');
    expect(shellRetractTransition.duration).toBeGreaterThanOrEqual(0.34);
    expect(shellRetractTransition.duration).toBeLessThanOrEqual(0.42);
    expect(shellRetractTransition.ease).toHaveLength(4);
    expect(shellRetractAnimationMs).toBe(Math.ceil(shellRetractTransition.duration * 1000));
    expect(shellRetractAnimationMs).toBe(380);
  });

  it('keeps text and content transitions deterministic so labels cannot overshoot', () => {
    expect(contentPopTransition.type).toBe('tween');
    expect(contentPopTransition.duration).toBeLessThanOrEqual(0.24);
    expect(contentPopTransition.ease).toHaveLength(4);
  });
});
