import { useEffect } from 'react';

/**
 * Liquid Glass rim highlight follows the pointer.
 *
 * Inspired by rdev/liquid-glass-react, which rotates a gradient rim so the
 * brightest part of the glass edge always faces the light source (the cursor).
 * We map the cursor's angle relative to the island center to a CSS custom
 * property `--rim-angle` consumed by `.island-rim` / `.island-rim-overlay`.
 *
 * Disabled under prefers-reduced-motion (static rim) and when the island is
 * hidden. Pass in the shared shell ref.
 */
export function useLiquidGlassRim(enabled: boolean, shellRef: React.RefObject<HTMLElement>): void {
  useEffect(() => {
    if (!enabled) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const onMove = (event: MouseEvent) => {
      const shell = shellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      // Only rotate the rim when the pointer is reasonably near the island;
      // far away, leave it at the default top-left highlight.
      const dist = Math.hypot(dx, dy);
      const maxReach = Math.max(rect.width, rect.height) * 1.5;
      if (dist > maxReach) return;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      shell.style.setProperty('--rim-angle', `${angle}deg`);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled, shellRef]);
}
