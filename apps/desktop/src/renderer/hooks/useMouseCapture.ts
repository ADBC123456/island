import { useEffect, useRef } from 'react';

/**
 * The transparent Electron window defaults to click-through so it never blocks
 * the apps behind it. While the cursor is over the visible island we tell the
 * main process to capture mouse events so the UI is interactive; when it
 * leaves we go back to pass-through.
 *
 * `forward: true` (set in the main process) keeps mousemove events reaching the
 * renderer even while pass-through, so this detection works in both states.
 */
export function useMouseCapture(enabled: boolean): React.RefObject<HTMLElement> {
  const shellRef = useRef<HTMLElement>(null);
  const capturingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const setCapture = (capture: boolean) => {
      if (capture === capturingRef.current) return;
      capturingRef.current = capture;
      void window.variableIsland.setIgnoreMouseEvents(!capture);
    };

    const onMove = (event: MouseEvent) => {
      const shell = shellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const overIsland =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      setCapture(overIsland);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseenter', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseenter', onMove);
      setCapture(false);
    };
  }, [enabled]);

  return shellRef;
}
