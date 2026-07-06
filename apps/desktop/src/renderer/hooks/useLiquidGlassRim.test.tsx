// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useLiquidGlassRim } from './useLiquidGlassRim';

type FrameRequestCallback = (time: number) => void;

function installMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}

function installAnimationFrame() {
  let nextFrameId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const frameId = nextFrameId;
    nextFrameId += 1;
    callbacks.set(frameId, callback);
    return frameId;
  });
  const cancelAnimationFrame = vi.fn((frameId: number) => {
    callbacks.delete(frameId);
  });

  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: requestAnimationFrame
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value: cancelAnimationFrame
  });

  return {
    cancelAnimationFrame,
    flushFrame(frameId: number) {
      const callback = callbacks.get(frameId);
      callbacks.delete(frameId);
      callback?.(performance.now());
    },
    pendingFrameIds() {
      return [...callbacks.keys()];
    },
    requestCount() {
      return requestAnimationFrame.mock.calls.length;
    }
  };
}

function RimHarness({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLiquidGlassRim(enabled, ref);
  return <div ref={ref} data-testid="shell" />;
}

describe('useLiquidGlassRim', () => {
  beforeEach(() => {
    installMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('coalesces pointer style writes to one animation frame', () => {
    const frames = installAnimationFrame();
    const { getByTestId } = render(<RimHarness enabled />);
    const shell = getByTestId('shell');
    vi.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({})
    });
    const setProperty = vi.spyOn(shell.style, 'setProperty');

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80, clientY: 30 }));

    expect(frames.requestCount()).toBe(1);
    expect(setProperty).not.toHaveBeenCalled();

    const [frameId] = frames.pendingFrameIds();
    expect(frameId).toBeDefined();
    frames.flushFrame(frameId as number);

    expect(setProperty).toHaveBeenCalledWith('--pointer-x', '80%');
    expect(setProperty).toHaveBeenCalledWith('--pointer-y', '75%');
  });

  it('cancels pending pointer work and resets rim variables when disabled', () => {
    const frames = installAnimationFrame();
    const { getByTestId, rerender } = render(<RimHarness enabled />);
    const shell = getByTestId('shell');
    vi.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      toJSON: () => ({})
    });

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 10 }));
    const [frameId] = frames.pendingFrameIds();
    expect(frameId).toBeDefined();

    rerender(<RimHarness enabled={false} />);

    expect(frames.cancelAnimationFrame).toHaveBeenCalledWith(frameId);
    expect(frames.pendingFrameIds()).toHaveLength(0);
    expect(shell.style.getPropertyValue('--pointer-x')).toBe('50%');
    expect(shell.style.getPropertyValue('--pointer-y')).toBe('0%');
    expect(shell.style.getPropertyValue('--rim-power')).toBe('0');
  });
});
