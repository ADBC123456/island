// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import type { IslandState } from '../hooks/useIslandState';
import { createInitialIslandState } from '../hooks/useIslandState';
import { IslandShell } from './IslandShell';

function installVariableIsland() {
  const api: Window['variableIsland'] = {
    generateNames: vi.fn(async () => ({ candidates: [] })),
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

function makeState(overrides: Partial<IslandState>): IslandState {
  return {
    ...createInitialIslandState(),
    ...overrides
  };
}

describe('IslandShell', () => {
  beforeEach(() => {
    installVariableIsland();
    installMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mounts the editor input immediately when returning from hidden to compact', () => {
    const setState = vi.fn() as React.Dispatch<React.SetStateAction<IslandState>>;
    const { rerender } = render(
      <IslandShell state={makeState({ status: 'hidden' })} setState={setState} />
    );

    expect(screen.queryByLabelText('变量用途描述')).toBeNull();

    rerender(
      <IslandShell state={makeState({ status: 'compact' })} setState={setState} />
    );

    expect(screen.getByLabelText('变量用途描述')).toBeInstanceOf(HTMLInputElement);
  });

  it('removes the expanded eyebrow immediately when retracting to compact', () => {
    vi.useFakeTimers();
    try {
      const setState = vi.fn() as React.Dispatch<React.SetStateAction<IslandState>>;
      const { rerender } = render(
        <IslandShell
          state={makeState({
            status: 'expanded',
            description: 'search users',
            candidates: []
          })}
          setState={setState}
        />
      );

      act(() => {
        vi.advanceTimersByTime(180);
      });

      expect(screen.getByText('Variable Island')).toBeInstanceOf(HTMLElement);

      rerender(
        <IslandShell
          state={makeState({
            status: 'compact',
            description: '',
            candidates: []
          })}
          setState={setState}
        />
      );

      expect(screen.queryByText('Variable Island')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
