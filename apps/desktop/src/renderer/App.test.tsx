// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerateNameResult, NativeCommandResult } from '@variable-island/shared';
import { App } from './App';
import { shellRetractAnimationMs } from './motionTokens';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function candidateResult(name: string): GenerateNameResult {
  return {
    candidates: [
      { name, score: 1, reason: 'test candidate' }
    ],
    translatedDescription: name
  };
}

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
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

function installVariableIsland(overrides: Partial<Window['variableIsland']> = {}) {
  const showCallbacks: Array<() => void> = [];
  const hideCallbacks: Array<() => void> = [];
  const api: Window['variableIsland'] = {
    generateNames: vi.fn(async () => candidateResult('generatedName')),
    copyText: vi.fn(async () => ({ success: true })),
    insertText: vi.fn(async () => ({ success: true })),
    onShow: vi.fn((callback) => {
      showCallbacks.push(callback);
      return () => undefined;
    }),
    onHideRequest: vi.fn((callback) => {
      hideCallbacks.push(callback);
      return () => undefined;
    }),
    setIslandStatus: vi.fn(async () => undefined),
    setIgnoreMouseEvents: vi.fn(async () => undefined),
    hideIsland: vi.fn(async () => undefined),
    ...overrides
  };

  Object.defineProperty(window, 'variableIsland', {
    configurable: true,
    value: api
  });

  return {
    api,
    emitShow: () => showCallbacks.forEach((callback) => callback()),
    emitHideRequest: () => hideCallbacks.forEach((callback) => callback())
  };
}

async function generateCandidate() {
  fireEvent.change(screen.getByLabelText('变量用途描述'), {
    target: { value: 'copy selected candidate' }
  });

  await act(async () => {
    vi.advanceTimersByTime(80);
    await Promise.resolve();
  });

  expect(screen.getByText('generatedName')).toBeInstanceOf(HTMLElement);
}

describe('App async action lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not show copy feedback after the island has started hiding', async () => {
    const copy = createDeferred<NativeCommandResult>();
    installVariableIsland({
      copyText: vi.fn(() => copy.promise)
    });

    render(<App />);
    await generateCandidate();

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Escape' });

    await act(async () => {
      await Promise.resolve();
    });

    expect(window.variableIsland.setIslandStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'hidden' })
    );

    await act(async () => {
      copy.resolve({ success: true });
      await copy.promise;
    });

    expect(screen.queryByText('已复制 generatedName')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not show copy feedback after the user continues editing', async () => {
    const copy = createDeferred<NativeCommandResult>();
    installVariableIsland({
      copyText: vi.fn(() => copy.promise)
    });

    render(<App />);
    await generateCandidate();

    fireEvent.keyDown(window, { key: 'Enter' });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('变量用途描述'), {
        target: { value: 'new editing description' }
      });
    });

    await act(async () => {
      copy.resolve({ success: true });
      await copy.promise;
    });

    expect(screen.queryByText('已复制 generatedName')).toBeNull();
    expect((screen.getByLabelText('变量用途描述') as HTMLInputElement).value).toBe('new editing description');
  });

  it('does not run a stale insert after the island is shown again', async () => {
    const island = installVariableIsland();

    render(<App />);
    await generateCandidate();

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    await act(async () => {
      island.emitShow();
      vi.advanceTimersByTime(shellRetractAnimationMs);
      await Promise.resolve();
    });

    expect(island.api.insertText).not.toHaveBeenCalled();
  });

  it('runs insert only once for repeated Ctrl+Enter during retract', async () => {
    const island = installVariableIsland();

    render(<App />);
    await generateCandidate();

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    await act(async () => {
      vi.advanceTimersByTime(shellRetractAnimationMs);
      await Promise.resolve();
    });

    expect(island.api.insertText).toHaveBeenCalledTimes(1);
  });

  it('ignores action keys after hiding starts even before React rerenders', async () => {
    const island = installVariableIsland();

    render(<App />);
    await generateCandidate();

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Tab' });

    await act(async () => {
      vi.advanceTimersByTime(shellRetractAnimationMs);
      await Promise.resolve();
    });

    expect(island.api.copyText).not.toHaveBeenCalled();
    expect(island.api.insertText).not.toHaveBeenCalled();
    expect(island.api.hideIsland).toHaveBeenCalledTimes(1);
  });

  it('waits for the retract animation before hiding the renderer window', async () => {
    const island = installVariableIsland();

    render(<App />);

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
      vi.advanceTimersByTime(shellRetractAnimationMs - 1);
    });

    expect(island.api.hideIsland).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(island.api.hideIsland).toHaveBeenCalledTimes(1);
  });

  it('does not restart the retract timer on repeated hide requests', async () => {
    const island = installVariableIsland();

    render(<App />);

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    await act(async () => {
      vi.advanceTimersByTime(Math.floor(shellRetractAnimationMs / 2));
    });
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
      vi.advanceTimersByTime(Math.ceil(shellRetractAnimationMs / 2));
    });

    expect(island.api.hideIsland).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(island.api.hideIsland).toHaveBeenCalledTimes(1);
  });
});
