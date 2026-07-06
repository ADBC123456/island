import { useEffect } from 'react';

/**
 * Liquid Glass rim highlight follows the pointer.
 *
 * Inspired by rdev/liquid-glass-react, which rotates a gradient rim so the
 * brightest part of the glass edge always faces the light source (the cursor).
 * We map the cursor's angle and local position relative to the island center
 * to CSS custom properties consumed by the glass layers.
 *
 * Disabled under prefers-reduced-motion (static rim) and when the island is
 * hidden. Pass in the shared shell ref.
 */
export function useLiquidGlassRim(enabled: boolean, shellRef: React.RefObject<HTMLElement>): void {
  useEffect(() => {
    if (!enabled) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let pendingFrame: number | null = null;
    let pendingEvent: MouseEvent | null = null;
    let lastSizeRef: { w: number; h: number } | null = null;

    const resetRim = () => {
      const shell = shellRef.current;
      if (!shell) return;
      shell.style.setProperty('--rim-angle', '135deg');
      shell.style.setProperty('--pointer-x', '50%');
      shell.style.setProperty('--pointer-y', '0%');
      shell.style.setProperty('--rim-power', '0');
      shell.style.setProperty('--rim-opacity', '0.72');
      shell.style.setProperty('--rim-overlay-opacity', '0.62');
      shell.style.setProperty('--glow-opacity', '0.2');
    };

    const applyPointer = () => {
      pendingFrame = null;
      const event = pendingEvent;
      pendingEvent = null;
      const shell = shellRef.current;
      if (!shell || !event) return;
      const rect = shell.getBoundingClientRect();
      // While the shell is mid-morph (width/height changing between frames),
      // freeze the rim angle so the conic-gradient isn't repainted every
      // frame on top of the resizing mask layer — that repainting is what
      // flashes the full-frame ring during retract.
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      const last = lastSizeRef;
      if (last !== null && (w !== last.w || h !== last.h)) {
        lastSizeRef = { w, h };
        return;
      }
      lastSizeRef = { w, h };
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const maxReach = Math.max(rect.width, rect.height) * 1.5;
      const reach = Math.max(0, 1 - Math.min(dist / maxReach, 1));
      if (reach <= 0) {
        shell.style.setProperty('--rim-power', '0');
        shell.style.setProperty('--rim-opacity', '0.68');
        shell.style.setProperty('--rim-overlay-opacity', '0.56');
        shell.style.setProperty('--glow-opacity', '0.16');
        return;
      }

      const localX = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const localY = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

      shell.style.setProperty('--rim-angle', `${angle}deg`);
      shell.style.setProperty('--pointer-x', `${localX}%`);
      shell.style.setProperty('--pointer-y', `${localY}%`);
      shell.style.setProperty('--rim-power', reach.toFixed(3));
      shell.style.setProperty('--rim-opacity', (0.68 + reach * 0.16).toFixed(3));
      shell.style.setProperty('--rim-overlay-opacity', (0.56 + reach * 0.16).toFixed(3));
      shell.style.setProperty('--glow-opacity', (0.16 + reach * 0.18).toFixed(3));
    };

    const onMove = (event: MouseEvent) => {
      pendingEvent = event;
      if (pendingFrame !== null) return;
      pendingFrame = window.requestAnimationFrame(applyPointer);
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (pendingFrame !== null) {
        window.cancelAnimationFrame(pendingFrame);
        pendingFrame = null;
      }
      pendingEvent = null;
      lastSizeRef = null;
      resetRim();
    };
  }, [enabled, shellRef]);
}
