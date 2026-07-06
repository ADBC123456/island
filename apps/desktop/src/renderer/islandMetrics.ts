import type { IslandStatus } from '@variable-island/shared';

export interface IslandDimensions {
  width: number;
  height: number;
  borderRadius: number;
}

const LIST_ROW_HEIGHT = 68;
const LIST_ROW_GAP = 10;
const LIST_VERTICAL_PADDING = 20;
const LIST_MAX_HEIGHT = 244;
// fixed top input row (56) + expanded padding (13) + control row (54+12) + content bottom (15)
const EXPANDED_BASE_HEIGHT = 150;
const EMPTY_STATE_HEIGHT = 130;

function expandedHeight(candidateCount: number): number {
  const listHeight = candidateCount === 0
    ? EMPTY_STATE_HEIGHT
    : Math.min(
        LIST_VERTICAL_PADDING + candidateCount * LIST_ROW_HEIGHT + (candidateCount - 1) * LIST_ROW_GAP,
        LIST_MAX_HEIGHT
      );
  return EXPANDED_BASE_HEIGHT + listHeight;
}

export function islandDimensions(status: IslandStatus, candidateCount: number): IslandDimensions {
  if (status === 'hidden') {
    return { width: 96, height: 30, borderRadius: 15 };
  }
  if (status === 'expanded') {
    return { width: 704, height: expandedHeight(candidateCount), borderRadius: 36 };
  }
  if (status === 'success' || status === 'error') {
    return { width: 392, height: 60, borderRadius: 30 };
  }
  return { width: 338, height: 56, borderRadius: 28 };
}
