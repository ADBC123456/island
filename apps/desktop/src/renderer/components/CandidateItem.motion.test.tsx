// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { CandidateItem } from './CandidateItem';

type MotionButtonProps = {
  children?: ReactNode;
  layout?: unknown;
  transition?: unknown;
  [key: string]: unknown;
};

const motionButtonProps = vi.hoisted(() => [] as MotionButtonProps[]);

vi.mock('framer-motion', async () => {
  const ReactModule = await import('react');

  return {
    motion: {
      button: ReactModule.forwardRef<HTMLButtonElement, MotionButtonProps>((props, ref) => {
        const {
          children,
          initial: _initial,
          animate: _animate,
          transition: _transition,
          whileTap: _whileTap,
          layout: _layout,
          ...domProps
        } = props;

        motionButtonProps.push(props);

        return ReactModule.createElement(
          'button',
          { ...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>), ref },
          children as ReactNode
        );
      })
    }
  };
});

describe('CandidateItem motion', () => {
  afterEach(() => {
    cleanup();
    motionButtonProps.length = 0;
    vi.restoreAllMocks();
  });

  it('does not opt into layout projection during rapid candidate refreshes', () => {
    render(
      <CandidateItem
        candidate={{ name: 'userName', score: 1, reason: 'test candidate' }}
        selected
        index={0}
        onSelect={vi.fn()}
      />
    );

    expect(motionButtonProps[0]?.layout).toBeUndefined();
  });

  it('does not stagger candidate rows during rapid candidate refreshes', () => {
    render(
      <CandidateItem
        candidate={{ name: 'userName', score: 1, reason: 'test candidate' }}
        selected
        index={4}
        onSelect={vi.fn()}
      />
    );

    expect(motionButtonProps[0]?.transition).not.toMatchObject({ delay: expect.any(Number) });
  });
});
