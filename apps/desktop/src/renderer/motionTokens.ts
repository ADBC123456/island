/**
 * Motion tokens for the island shell.
 *
 * Conventions enforced by motionTokens.test.ts:
 * - Retract is a deterministic tween (cannot spring past compact).
 * - Content pop is a deterministic tween (labels cannot overshoot).
 * Expand is allowed to be a spring for a livelier open.
 */

// Expand: spring with a small overshoot — feels alive without drifting.
export const shellExpandTransition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.9
} as const;

// Retract: deterministic tween, no overshoot, ~360ms.
export const shellRetractTransition = {
  type: 'tween' as const,
  duration: 0.36,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
};

export const shellRetractAnimationMs = Math.ceil(shellRetractTransition.duration * 1000);

// Content pop: deterministic tween, ≤240ms, no overshoot.
export const contentPopTransition = {
  type: 'tween' as const,
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
};

// Feedback (success/error) pop — same family as content, slightly snappier.
export const feedbackPopTransition = {
  type: 'tween' as const,
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
};

export const collapseTransition = {
  type: 'spring',
  duration: 0.44,
  bounce: 0.08
} as const;

export const candidateTransition = {
  type: 'spring',
  duration: 0.42,
  bounce: 0.1
} as const;

export const ruleThumbTransition = {
  type: 'spring',
  duration: 0.52,
  bounce: 0.14
} as const;

export const quickFadeTransition = {
  duration: 0.16,
  ease: 'easeOut'
} as const;

export const instantContentExitTransition = {
  duration: 0.01,
  ease: 'linear'
} as const;

// Backwards-compatible alias.
export const shellMorphTransition = shellExpandTransition;
