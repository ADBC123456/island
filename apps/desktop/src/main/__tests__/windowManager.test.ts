import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RETRACT_ANIMATION_MS, WindowManager } from '../windowManager.js';

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
  screen: {
    getCursorScreenPoint: vi.fn(() => ({ x: 960, y: 8 })),
    getDisplayNearestPoint: vi.fn(() => ({
      workArea: { x: 0, y: 0, width: 1920, height: 1080 }
    }))
  }
}));

interface FakeWindow {
  getBounds: ReturnType<typeof vi.fn>;
  isVisible: ReturnType<typeof vi.fn>;
  setBounds: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
  setPosition: ReturnType<typeof vi.fn>;
  setIgnoreMouseEvents: ReturnType<typeof vi.fn>;
  hide: ReturnType<typeof vi.fn>;
  webContents: {
    send: ReturnType<typeof vi.fn>;
  };
}

function createManagerWithWindow() {
  const bounds = { x: 600, y: 6, width: 720, height: 322 };
  const fakeWindow: FakeWindow = {
    getBounds: vi.fn(() => ({ ...bounds })),
    isVisible: vi.fn(() => true),
    setBounds: vi.fn((nextBounds: typeof bounds) => {
      Object.assign(bounds, nextBounds);
    }),
    setSize: vi.fn((width: number, height: number) => {
      bounds.width = width;
      bounds.height = height;
    }),
    setPosition: vi.fn((x: number, y: number) => {
      bounds.x = x;
      bounds.y = y;
    }),
    setIgnoreMouseEvents: vi.fn(),
    hide: vi.fn(),
    webContents: {
      send: vi.fn()
    }
  };
  const manager = new WindowManager();
  (manager as unknown as { window: FakeWindow }).window = fakeWindow;
  return { manager, fakeWindow };
}

describe('WindowManager resize lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the larger visible window when renderer enters compact state', () => {
    const { manager, fakeWindow } = createManagerWithWindow();

    manager.setIslandStatus('compact', { width: 338, height: 56 });
    vi.advanceTimersByTime(1000);

    expect(fakeWindow.setBounds).not.toHaveBeenCalled();
  });

  it('does not shrink the native window before sending a hide request', () => {
    const { manager, fakeWindow } = createManagerWithWindow();

    manager.setIslandStatus('compact', { width: 338, height: 56 });
    expect(fakeWindow.setBounds).not.toHaveBeenCalled();

    manager.requestHideIsland();
    vi.advanceTimersByTime(RETRACT_ANIMATION_MS - 1);

    expect(fakeWindow.webContents.send).toHaveBeenCalledWith('island:hide-request');
    expect(fakeWindow.hide).not.toHaveBeenCalled();
    expect(fakeWindow.setBounds).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(fakeWindow.hide).toHaveBeenCalledTimes(1);
  });

  it('grows immediately but leaves visible shrinking to the renderer', () => {
    const { manager, fakeWindow } = createManagerWithWindow();

    manager.setIslandStatus('expanded', { width: 704, height: 394 });

    expect(fakeWindow.setBounds).toHaveBeenCalledTimes(1);
    expect(fakeWindow.setBounds).toHaveBeenLastCalledWith({
      x: 600,
      y: 6,
      width: 720,
      height: 412
    }, false);

    manager.setIslandStatus('compact', { width: 338, height: 56 });
    vi.advanceTimersByTime(1000);

    expect(fakeWindow.setBounds).toHaveBeenCalledTimes(1);
  });

  it('resets the native footprint to compact when hiding', () => {
    const { manager, fakeWindow } = createManagerWithWindow();

    manager.hideIsland();

    expect(fakeWindow.setSize).toHaveBeenCalledWith(354, 74, false);
    expect(fakeWindow.setPosition).toHaveBeenCalled();
    expect(fakeWindow.hide).toHaveBeenCalledTimes(1);
  });
});
