import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class WindowManager {
  private window: BrowserWindow | null = null;

  create(): BrowserWindow {
    this.window = new BrowserWindow({
      width: 760,
      height: 380,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      hasShadow: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');
    this.positionTopCenter();

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
    this.positionTopCenter();
    win.show();
    win.focus();
    win.webContents.send('island:show');
  }

  hideIsland(): void {
    if (this.window) this.window.hide();
  }

  positionTopCenter(): void {
    if (!this.window) return;
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const bounds = display.workArea;
    const winBounds = this.window.getBounds();
    const x = Math.round(bounds.x + (bounds.width - winBounds.width) / 2);
    const y = Math.round(bounds.y + 12);
    this.window.setPosition(x, y, false);
  }
}
