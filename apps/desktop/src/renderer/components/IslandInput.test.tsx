// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IslandInput } from './IslandInput';

type FrameRequestCallback = (time: number) => void;

function installVariableIsland() {
  const showCallbacks: Array<() => void> = [];
  const api: Window['variableIsland'] = {
    generateNames: vi.fn(async () => ({ candidates: [] })),
    copyText: vi.fn(async () => ({ success: true })),
    insertText: vi.fn(async () => ({ success: true })),
    onShow: vi.fn((callback) => {
      showCallbacks.push(callback);
      return () => undefined;
    }),
    onHideRequest: vi.fn(() => () => undefined),
    setIslandStatus: vi.fn(async () => undefined),
    setIgnoreMouseEvents: vi.fn(async () => undefined),
    hideIsland: vi.fn(async () => undefined)
  };

  Object.defineProperty(window, 'variableIsland', {
    configurable: true,
    value: api
  });

  return {
    emitShow: () => showCallbacks.forEach((callback) => callback())
  };
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
    }
  };
}

describe('IslandInput focus scheduling', () => {
  beforeEach(() => {
    installVariableIsland();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not select text typed before the delayed show focus frame runs', () => {
    const island = installVariableIsland();
    const frames = installAnimationFrame();
    function ControlledInput() {
      const [value, setValue] = useState('');
      return <IslandInput value={value} onChange={setValue} />;
    }

    render(<ControlledInput />);
    const input = screen.getByLabelText('变量用途描述') as HTMLInputElement;
    const select = vi.spyOn(input, 'select');
    const focus = vi.spyOn(input, 'focus');

    island.emitShow();
    const [frameId] = frames.pendingFrameIds();
    expect(frameId).toBeDefined();
    fireEvent.change(input, { target: { value: 'abc' } });

    frames.flushFrame(frameId as number);

    expect(focus).toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it('cancels a pending show focus frame when unmounted', () => {
    const island = installVariableIsland();
    const frames = installAnimationFrame();
    const { unmount } = render(<IslandInput value="" onChange={vi.fn()} />);

    island.emitShow();
    const [frameId] = frames.pendingFrameIds();
    expect(frameId).toBeDefined();
    unmount();

    expect(frames.cancelAnimationFrame).toHaveBeenCalledWith(frameId);
    expect(frames.pendingFrameIds()).toHaveLength(0);
  });
});
