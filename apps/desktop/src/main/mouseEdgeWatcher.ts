import { powerMonitor, screen } from 'electron';
import { isTopCenterTriggerPoint } from './edgeTrigger.js';
import { rememberActiveWindow } from './nativeBridge.js';
import type { WindowManager } from './windowManager.js';

// Adaptive polling: slow ticks while the cursor is far from the top edge,
// fast ticks only when it is close enough to plausibly aim for the island.
const IDLE_POLL_MS = 240;
const NEAR_POLL_MS = 70;
const NEAR_BAND_PX = 120;
const COOLDOWN_MS = 800;
const TOP_BAND_PX = 8;
const CENTER_WIDTH_PX = 440;

let timer: NodeJS.Timeout | null = null;
let currentIntervalMs = 0;
let suspended = false;
let lastTriggeredAt = 0;
let isTriggering = false;
let managerRef: WindowManager | null = null;
let powerHooksInstalled = false;

function schedule(intervalMs: number): void {
  if (suspended || !managerRef) return;
  if (timer && currentIntervalMs === intervalMs) return;
  if (timer) clearInterval(timer);
  currentIntervalMs = intervalMs;
  timer = setInterval(() => {
    void pollMouseEdge().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[mouse-edge] watcher skipped: ${message}`);
    });
  }, intervalMs);
}

function installPowerHooks(): void {
  if (powerHooksInstalled) return;
  powerHooksInstalled = true;

  const pause = () => {
    suspended = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
      currentIntervalMs = 0;
    }
  };
  const resume = () => {
    suspended = false;
    schedule(IDLE_POLL_MS);
  };

  powerMonitor.on('suspend', pause);
  powerMonitor.on('lock-screen', pause);
  powerMonitor.on('resume', resume);
  powerMonitor.on('unlock-screen', resume);
}

export function startMouseEdgeWatcher(windowManager: WindowManager): void {
  managerRef = windowManager;
  installPowerHooks();
  schedule(IDLE_POLL_MS);
}

async function pollMouseEdge(): Promise<void> {
  const windowManager = managerRef;
  if (!windowManager) return;
  const win = windowManager.getWindow();
  if (win.isDestroyed()) return;
  if (win.isVisible() || isTriggering) {
    schedule(IDLE_POLL_MS);
    return;
  }

  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const workArea = display.workArea;

  // Downshift to slow polling whenever the cursor is far from the top band.
  const nearTop = point.y <= workArea.y + NEAR_BAND_PX;
  schedule(nearTop ? NEAR_POLL_MS : IDLE_POLL_MS);

  const now = Date.now();
  if (now - lastTriggeredAt < COOLDOWN_MS) return;

  const shouldTrigger = isTopCenterTriggerPoint(point, workArea, {
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
}

export function stopMouseEdgeWatcher(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  currentIntervalMs = 0;
  managerRef = null;
}
