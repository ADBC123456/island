import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IslandStatus } from '@variable-island/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WINDOW_PADDING_X = 8;
const WINDOW_PADDING_TOP = 8;
const WINDOW_PADDING_BOTTOM = 10;
// Time for the renderer's retract animation to settle before the OS window
// shrinks down. Must stay in sync with shellRetractAnimationMs in
// src/renderer/motionTokens.ts (main cannot import that ESM module).
const SHRINK_DELAY_MS = 360;
export const RETRACT_ANIMATION_MS = 360;
const COMPACT_SHRINK_DELAY_MS = RETRACT_ANIMATION_MS;
const SHOW_BLUR_GRACE_MS = 360;

interface IslandSize {
  width: number;
  height: number;
}

// Fallback sizes when the renderer has not reported explicit dimensions yet.
const fallbackDimensions: Record<Exclude<IslandStatus, 'hidden'>, IslandSize> = {
  compact: { width: 338, height: 56 },
  expanded: { width: 704, height: 394 },
  success: { width: 392, height: 60 },
  error: { width: 392, height: 60 }
};

export class WindowManager {
  private window: BrowserWindow | null = null;
  private pendingShrink: NodeJS.Timeout | null = null;
  private pendingHideRequest: NodeJS.Timeout | null = null;
  private anchorCenterX: number | null = null;
  private ignoreBlurUntil = 0;

  create(): BrowserWindow {
    const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
    const diagnosticWindow = process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1';

    this.window = new BrowserWindow({
      width: 760,
      height: 420,
      frame: diagnosticWindow,
      transparent: !diagnosticWindow,
      resizable: diagnosticWindow,
      movable: diagnosticWindow,
      alwaysOnTop: true,
      skipTaskbar: !diagnosticWindow,
      show: false,
      hasShadow: diagnosticWindow,
      backgroundColor: diagnosticWindow ? '#202026' : '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        // Keep the hidden renderer fully throttled so the island costs ~0 CPU while idle.
        backgroundThrottling: true,
        spellcheck: false
      }
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');

    if (diagnosticWindow) {
      this.window.center();
    } else {
      // Transparent windows swallow clicks across their whole rect. Default to
      // pass-through; the renderer re-enables capture while the cursor is over
      // the visible island (window:set-ignore-mouse-events).
      this.window.setIgnoreMouseEvents(true, { forward: true });
      this.setIslandStatus('compact');
      this.positionTopCenter();
    }

    if (isDev) {
      this.window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        console.log(`[renderer:${level}] ${sourceId}:${line} ${message}`);
      });
    }

    this.window.webContents.on('preload-error', (_event, preloadPath, error) => {
      console.error('[window] preload failed', preloadPath, error);
    });

    this.window.webContents.on('render-process-gone', (_event, details) => {
      console.error('[window] renderer process gone', details);
    });

    this.window.webContents.on('did-finish-load', async () => {
      console.log('[window] renderer loaded');
      if (isDev) {
        const probe = await this.window?.webContents.executeJavaScript(`({
          hasRoot: Boolean(document.getElementById('root')),
          rootHtmlLength: document.getElementById('root')?.innerHTML.length ?? 0,
          bodyText: document.body.innerText,
          hasVariableIslandApi: Boolean(window.variableIsland),
          viewport: { width: window.innerWidth, height: window.innerHeight }
        })`);
        console.log('[window] renderer probe', probe);
      }
    });

    this.window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('[window] renderer failed to load', errorCode, errorDescription);
    });

    this.window.on('blur', () => {
      if (!diagnosticWindow) {
        if (Date.now() < this.ignoreBlurUntil) return;
        this.requestHideIsland();
      }
    });

    if (isDev && diagnosticWindow) {
      this.window.webContents.openDevTools({ mode: 'detach' });
    }

    if (process.env.VITE_DEV_SERVER_URL) {
      void this.window.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      void this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    return this.window;
  }

  getWindow(): BrowserWindow {
    if (!this.window) throw new Error('Island window has not been created');
    return this.window;
  }

  showIsland(): void {
    const win = this.getWindow();
    this.clearPendingHideRequest();
    this.ignoreBlurUntil = Date.now() + SHOW_BLUR_GRACE_MS;
    if (process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW !== '1') {
      this.setIslandStatus('compact');
    }
    if (process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1') {
      win.center();
    } else {
      this.positionTopCenter();
      this.setIgnoreMouseEvents(false);
    }
    win.show();
    win.moveTop();
    win.focus();
    win.webContents.focus();
    win.webContents.send('island:show');
  }

  requestHideIsland(): void {
    if (!this.window) return;
    if (process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1') {
      this.hideIsland();
      return;
    }

    this.clearPendingShrink();
    this.clearPendingHideRequest();
    this.setIgnoreMouseEvents(true);
    this.window.webContents.send('island:hide-request');
    this.pendingHideRequest = setTimeout(() => {
      this.pendingHideRequest = null;
      this.hideIsland();
    }, RETRACT_ANIMATION_MS);
  }

  hideIsland(): void {
    this.clearPendingShrink();
    this.clearPendingHideRequest();
    if (!this.window) return;
    // Reset to compact footprint so the next summon starts clean and no
    // oversized transparent rect lingers to trap clicks behind the desktop.
    if (process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW !== '1') {
      this.setIgnoreMouseEvents(true);
      const compact = fallbackDimensions.compact;
      this.window.setSize(
        compact.width + WINDOW_PADDING_X * 2,
        compact.height + WINDOW_PADDING_TOP + WINDOW_PADDING_BOTTOM,
        false
      );
      this.positionTopCenter();
    }
    this.window.hide();
  }

  setIgnoreMouseEvents(ignore: boolean): void {
    if (!this.window || process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1') return;
    // `forward: true` keeps mousemove flowing to the renderer so it can
    // re-capture when the cursor re-enters the visible island.
    this.window.setIgnoreMouseEvents(ignore, { forward: true });
  }

  /**
   * Resize the OS window to fit the island.
   * Growing applies immediately; shrinking waits for the renderer's spring to
   * settle so the island is never clipped mid-animation. In between, the
   * window covers the union of the old and new bounds (it is transparent, so
   * the extra area is invisible).
   */
  setIslandStatus(status: IslandStatus, size?: IslandSize): void {
    if (!this.window || process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1') return;

    this.clearPendingShrink();
    if (status === 'hidden') return;

    const island = size ?? fallbackDimensions[status];
    const targetWidth = island.width + WINDOW_PADDING_X * 2;
    const targetHeight = island.height + WINDOW_PADDING_TOP + WINDOW_PADDING_BOTTOM;
    const current = this.window.getBounds();

    const unionWidth = Math.max(targetWidth, this.window.isVisible() ? current.width : 0);
    const unionHeight = Math.max(targetHeight, this.window.isVisible() ? current.height : 0);

    this.resizeAroundCurrentTopCenter(unionWidth, unionHeight);

    if (unionWidth !== targetWidth || unionHeight !== targetHeight) {
      const shrinkDelay = status === 'compact' ? COMPACT_SHRINK_DELAY_MS : SHRINK_DELAY_MS;
      this.pendingShrink = setTimeout(() => {
        this.pendingShrink = null;
        if (!this.window || this.window.isDestroyed()) return;
        this.resizeAroundCurrentTopCenter(targetWidth, targetHeight);
      }, shrinkDelay);
    }
  }

  positionTopCenter(): void {
    if (!this.window) return;
    const windowBounds = this.window.getBounds();
    const windowCenter = {
      x: windowBounds.x + windowBounds.width / 2,
      y: windowBounds.y + windowBounds.height / 2
    };
    const display = this.window.isVisible()
      ? screen.getDisplayNearestPoint(windowCenter)
      : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const bounds = display.workArea;
    const winBounds = this.window.getBounds();
    const x = Math.round(bounds.x + (bounds.width - winBounds.width) / 2);
    const y = Math.round(bounds.y + 6);
    this.anchorCenterX = bounds.x + bounds.width / 2;
    this.window.setPosition(x, y, false);
  }

  private resizeAroundCurrentTopCenter(width: number, height: number): void {
    if (!this.window) return;
    if (!this.window.isVisible()) {
      this.window.setSize(width, height, false);
      return;
    }

    const current = this.window.getBounds();
    const centerX = this.anchorCenterX ?? current.x + current.width / 2;
    this.anchorCenterX = centerX;
    this.window.setBounds({
      x: Math.round(centerX - width / 2),
      y: current.y,
      width,
      height
    }, false);
  }

  private clearPendingShrink(): void {
    if (this.pendingShrink) {
      clearTimeout(this.pendingShrink);
      this.pendingShrink = null;
    }
  }

  private clearPendingHideRequest(): void {
    if (this.pendingHideRequest) {
      clearTimeout(this.pendingHideRequest);
      this.pendingHideRequest = null;
    }
  }
}
