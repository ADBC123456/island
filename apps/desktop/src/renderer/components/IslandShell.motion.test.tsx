// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import type { ReactNode } from 'react';
import type { IslandState } from '../hooks/useIslandState';
import { createInitialIslandState } from '../hooks/useIslandState';
import { islandDimensions } from '../islandMetrics';
import { shellRetractTransition } from '../motionTokens';
import { IslandShell } from './IslandShell';

type MotionRecord = {
  tag: string;
  className: string | undefined;
  animate?: unknown;
  transition?: unknown;
};

type MotionProps = {
  children?: ReactNode;
  className?: string;
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  whileTap?: unknown;
  whileHover?: unknown;
  layout?: unknown;
  layoutId?: unknown;
  [key: string]: unknown;
};

const motionRecords = vi.hoisted(() => [] as MotionRecord[]);

vi.mock('framer-motion', async () => {
  const ReactModule = await import('react');

  const passthrough = (tag: string) => ReactModule.forwardRef<HTMLElement, MotionProps>((props, ref) => {
    const {
      children,
      initial: _initial,
      animate,
      exit: _exit,
      transition,
      whileTap: _whileTap,
      whileHover: _whileHover,
      layout: _layout,
      layoutId: _layoutId,
      ...domProps
    } = props;

    motionRecords.push({
      tag,
      className: typeof props.className === 'string' ? props.className : undefined,
      animate,
      transition
    });

    return ReactModule.createElement(
      tag,
      { ...(domProps as React.HTMLAttributes<HTMLElement>), ref },
      children as ReactNode
    );
  });

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => ReactModule.createElement(ReactModule.Fragment, null, children),
    motion: {
      button: passthrough('button'),
      div: passthrough('div'),
      section: passthrough('section'),
      span: passthrough('span')
    }
  };
});

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

function lastShellRecord(): MotionRecord | undefined {
  return motionRecords.filter((record) => record.tag === 'section' && record.className?.includes('island-shell')).at(-1);
}

describe('IslandShell motion', () => {
  beforeEach(() => {
    motionRecords.length = 0;
    installVariableIsland();
    installMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses the deterministic retract transition when clearing from expanded to compact', () => {
    const setState = vi.fn() as React.Dispatch<React.SetStateAction<IslandState>>;
    const expandedState = makeState({
      status: 'expanded',
      description: 'search user by keyword',
      candidates: []
    });
    const compactState = makeState({
      status: 'compact',
      description: '',
      candidates: []
    });

    const { rerender } = render(<IslandShell state={expandedState} setState={setState} />);

    motionRecords.length = 0;
    rerender(<IslandShell state={compactState} setState={setState} />);

    const compactSize = islandDimensions('compact', 0);
    const shellRecord = lastShellRecord();

    expect(shellRecord?.animate).toMatchObject(compactSize);
    expect(shellRecord?.transition).toBe(shellRetractTransition);
    expect(shellRecord?.transition).toMatchObject({ type: 'tween' });
  });
});
