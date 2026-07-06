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

  timer = setInterval(() => {
    void pollMouseEdge(windowManager).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[mouse-edge] watcher skipped: ${message}`);
    });
  }, POLL_MS);
}

async function pollMouseEdge(windowManager: WindowManager): Promise<void> {
    const win = windowManager.getWindow();
    if (win.isDestroyed()) return;
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
      console.log('[mouse-edge] top-center trigger', point);
      await rememberActiveWindow();
      windowManager.showIsland();
    } finally {
      isTriggering = false;
    }
}

export function stopMouseEdgeWatcher(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
