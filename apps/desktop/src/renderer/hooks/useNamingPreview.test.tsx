// @vitest-environment happy-dom
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerateNameResult } from '@variable-island/shared';
import { createInitialIslandState, type IslandState } from './useIslandState';
import { useNamingPreview } from './useNamingPreview';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function installVariableIsland(generateNames: Window['variableIsland']['generateNames']) {
  const api: Window['variableIsland'] = {
    generateNames,
    copyText: vi.fn(async () => ({ success: true })),
    insertText: vi.fn(async () => ({ success: true })),
    onShow: vi.fn(() => () => undefined),
    onHideRequest: vi.fn(() => () => undefined),
    setIslandStatus: vi.fn(async () => undefined),
    setIgnoreMouseEvents: vi.fn(async () => undefined),
    hideIsland: vi.fn(async () => undefined)
  };

  Object.defineProperty(window, 'variableIsland', {
    configurable: true,
    value: api
  });
}

function candidateResult(name: string): GenerateNameResult {
  return {
    candidates: [
      { name, score: 1, reason: 'test candidate' }
    ],
    translatedDescription: name
  };
}

function PreviewHarness({ initialDescription = '' }: { initialDescription?: string }) {
  const [state, setState] = useState<IslandState>(() => ({
    ...createInitialIslandState(),
    description: initialDescription
  }));

  useNamingPreview(state, setState);

  return (
    <section>
      <input
        aria-label="description"
        value={state.description}
        onChange={(event) => setState((current) => ({
          ...current,
          description: event.target.value
        }))}
      />
      <output aria-label="status">{state.status}</output>
      <output aria-label="candidate-count">{state.candidates.length}</output>
      <output aria-label="selected-name">{state.candidates[state.selectedIndex]?.name ?? ''}</output>
      <button
        type="button"
        onClick={() => setState((current) => ({ ...current, status: 'hidden' }))}
      >
        hide
      </button>
      <button
        type="button"
        onClick={() => setState((current) => ({ ...current, status: 'success', message: 'copied' }))}
      >
        success
      </button>
      <button
        type="button"
        onClick={() => setState((current) => ({ ...current, description: '' }))}
      >
        clear
      </button>
    </section>
  );
}

describe('useNamingPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not reopen expanded content when an old request resolves after the input is cleared', async () => {
    const pending = createDeferred<GenerateNameResult>();
    const generateNames = vi.fn(() => pending.promise);
    installVariableIsland(generateNames);

    render(<PreviewHarness initialDescription="computer run" />);

    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(generateNames).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('description'), { target: { value: '' } });
    });
    expect(screen.getByLabelText('status').textContent).toBe('compact');
    expect(screen.getByLabelText('candidate-count').textContent).toBe('0');

    await act(async () => {
      pending.resolve(candidateResult('computerRun'));
      await pending.promise;
    });

    expect(screen.getByLabelText('status').textContent).toBe('compact');
    expect(screen.getByLabelText('candidate-count').textContent).toBe('0');
    expect(screen.getByLabelText('selected-name').textContent).toBe('');
  });

  it('keeps the latest request visible when older requests resolve later', async () => {
    const first = createDeferred<GenerateNameResult>();
    const second = createDeferred<GenerateNameResult>();
    const generateNames = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    installVariableIsland(generateNames);

    render(<PreviewHarness initialDescription="first value" />);

    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(generateNames).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('description'), { target: { value: 'second value' } });
      vi.advanceTimersByTime(80);
    });
    expect(generateNames).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve(candidateResult('secondValue'));
      await second.promise;
    });
    expect(screen.getByLabelText('status').textContent).toBe('expanded');
    expect(screen.getByLabelText('selected-name').textContent).toBe('secondValue');

    await act(async () => {
      first.resolve(candidateResult('firstValue'));
      await first.promise;
    });

    expect(screen.getByLabelText('status').textContent).toBe('expanded');
    expect(screen.getByLabelText('selected-name').textContent).toBe('secondValue');
  });

  it('does not reopen while the island is retracting to hidden', async () => {
    const pending = createDeferred<GenerateNameResult>();
    const generateNames = vi.fn(() => pending.promise);
    installVariableIsland(generateNames);

    render(<PreviewHarness initialDescription="pending hide" />);

    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(generateNames).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByText('hide'));
    });
    expect(screen.getByLabelText('status').textContent).toBe('hidden');

    await act(async () => {
      pending.resolve(candidateResult('pendingHide'));
      await pending.promise;
    });

    expect(screen.getByLabelText('status').textContent).toBe('hidden');
    expect(screen.getByLabelText('candidate-count').textContent).toBe('0');
  });

  it('does not replace feedback states with late preview results', async () => {
    const pending = createDeferred<GenerateNameResult>();
    const generateNames = vi.fn(() => pending.promise);
    installVariableIsland(generateNames);

    render(<PreviewHarness initialDescription="copy feedback" />);

    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    expect(generateNames).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByText('success'));
    });
    expect(screen.getByLabelText('status').textContent).toBe('success');

    await act(async () => {
      pending.resolve(candidateResult('copyFeedback'));
      await pending.promise;
    });

    expect(screen.getByLabelText('status').textContent).toBe('success');
    expect(screen.getByLabelText('candidate-count').textContent).toBe('0');
  });

  it('does not move hidden state back to compact when the description becomes empty', async () => {
    installVariableIsland(vi.fn(async () => candidateResult('unused')));

    render(<PreviewHarness initialDescription="hide then clear" />);

    await act(async () => {
      fireEvent.click(screen.getByText('hide'));
      fireEvent.click(screen.getByText('clear'));
    });

    expect(screen.getByLabelText('status').textContent).toBe('hidden');
  });

  it('does not move feedback state back to compact when the description becomes empty', async () => {
    installVariableIsland(vi.fn(async () => candidateResult('unused')));

    render(<PreviewHarness initialDescription="success then clear" />);

    await act(async () => {
      fireEvent.click(screen.getByText('success'));
      fireEvent.click(screen.getByText('clear'));
    });

    expect(screen.getByLabelText('status').textContent).toBe('success');
  });
});
