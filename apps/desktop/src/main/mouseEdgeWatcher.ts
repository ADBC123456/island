import { screen } from 'electron';
import { isTopCenterTriggerPoint } from './edgeTrigger.js';
import { rememberActiveWindow } from './nativeBridge.js';
import type { WindowManager } from './windowManager.js';

const POLL_MS = 120;
const COOLDOWN_MS = 800;
const TOP_BAND_PX = 8;
const CENTER_WIDTH_PX = 440;

let timer: NodeJS.Timeout | null = null;
let lastTriggeredAt = 0;
let isTriggering = false;

export function startMouseEdgeWatcher(windowManager: WindowManager): void {
  if (timer) return;

  timer = setInterval(async () => {
    const win = windowManager.getWindow();
    if (win.isVisible() || isTriggering) return;

    const now = Date.now();
    if (now - lastTriggeredAt < COOLDOWN_MS) return;

    const point = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(point);
    const shouldTrigger = isTopCenterTriggerPoint(point, display.workArea, {
      topBandPx: TOP_BAND_PX,
      centerWidthPx: CENTER_WIDTH_PX
    });

    if (!shouldTrigger) return;

    isTriggering = true;
    lastTriggeredAt = now;
    try {
      await rememberActiveWindow();
      windowManager.showIsland();
    } finally {
      isTriggering = false;
    }
  }, POLL_MS);
}

export function stopMouseEdgeWatcher(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
