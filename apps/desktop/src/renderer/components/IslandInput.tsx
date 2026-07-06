import { useCallback, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange(value: string): void;
}

export function IslandInput({ value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const pendingFocusFrameRef = useRef<number | null>(null);

  const cancelPendingFocusFrame = useCallback(() => {
    if (pendingFocusFrameRef.current === null) return;
    window.cancelAnimationFrame(pendingFocusFrameRef.current);
    pendingFocusFrameRef.current = null;
  }, []);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const unsubscribe = window.variableIsland.onShow(() => {
      cancelPendingFocusFrame();
      const valueBeforeFrame = ref.current?.value ?? '';
      pendingFocusFrameRef.current = window.requestAnimationFrame(() => {
        pendingFocusFrameRef.current = null;
        const input = ref.current;
        if (!input) return;
        input.focus({ preventScroll: true });
        if (input.value === valueBeforeFrame) {
          input.select();
        }
      });
    });

    return () => {
      cancelPendingFocusFrame();
      unsubscribe();
    };
  }, [cancelPendingFocusFrame]);

  return (
    <input
      ref={ref}
      className="island-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="描述变量用途..."
      aria-label="变量用途描述"
      spellCheck={false}
    />
  );
}
