import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IslandStatus } from '@variable-island/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WINDOW_PADDING_X = 8;
const WINDOW_PADDING_TOP = 8;
const WINDOW_PADDING_BOTTOM = 10;

const islandDimensions: Record<Exclude<IslandStatus, 'hidden'>, { width: number; height: number }> = {
  compact: { width: 338, height: 56 },
  expanded: { width: 672, height: 296 },
  success: { width: 392, height: 60 },
  error: { width: 392, height: 60 }
};

export class WindowManager {
  private window: BrowserWindow | null = null;

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
        nodeIntegration: false
      }
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');

    if (diagnosticWindow) {
      this.window.center();
    } else {
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
        this.hideIsland();
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
    if (process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW !== '1') {
      this.setIslandStatus('compact');
    }
    if (process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1') {
      win.center();
    } else {
      this.positionTopCenter();
    }
    win.show();
    win.focus();
    console.log('[window] showIsland', win.getBounds());
    win.webContents.send('island:show');
  }

  hideIsland(): void {
    if (this.window) this.window.hide();
  }

  setIslandStatus(status: IslandStatus): void {
    if (!this.window || process.env.VARIABLE_ISLAND_DIAGNOSTIC_WINDOW === '1' || status === 'hidden') return;

    const dimensions = islandDimensions[status];
    this.window.setSize(
      dimensions.width + WINDOW_PADDING_X * 2,
      dimensions.height + WINDOW_PADDING_TOP + WINDOW_PADDING_BOTTOM,
      false
    );
    this.positionTopCenter();
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
    this.window.setPosition(x, y, false);
  }
}
