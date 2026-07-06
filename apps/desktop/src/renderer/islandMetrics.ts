import type { IslandStatus } from '@variable-island/shared';

export interface IslandDimensions {
  width: number;
  height: number;
  borderRadius: number;
}

const LIST_ROW_HEIGHT = 50;
const LIST_ROW_GAP = 6;
const LIST_MAX_HEIGHT = 176;
// content paddings (12+14) + input row with eyebrow (44) + expanded padding (12) + control row (38+12)
const EXPANDED_BASE_HEIGHT = 132;
const HINTS_HEIGHT = 24; // margin-top 10 + line-height 14
const EMPTY_STATE_HEIGHT = 130;

function expandedHeight(candidateCount: number): number {
  const listHeight = candidateCount === 0
    ? EMPTY_STATE_HEIGHT
    : Math.min(candidateCount * LIST_ROW_HEIGHT + (candidateCount - 1) * LIST_ROW_GAP, LIST_MAX_HEIGHT);
  return EXPANDED_BASE_HEIGHT + listHeight + HINTS_HEIGHT;
}

export function islandDimensions(status: IslandStatus, candidateCount: number): IslandDimensions {
  if (status === 'expanded') {
    return { width: 672, height: expandedHeight(candidateCount), borderRadius: 34 };
  }
  if (status === 'success' || status === 'error') {
    return { width: 392, height: 60, borderRadius: 30 };
  }
  return { width: 338, height: 56, borderRadius: 28 };
}
