import { useEffect } from 'react';
import type { CaseStyle } from '@variable-island/shared';
import type { IslandState } from './useIslandState';

const rules: CaseStyle[] = ['camelCase', 'PascalCase', 'snake_case', 'CONSTANT_CASE', 'Hungarian'];

export function useKeyboardNavigation(
  state: IslandState,
  setState: React.Dispatch<React.SetStateAction<IslandState>>,
  onCopy: () => void,
  onInsert: () => void,
  onHide: () => void,
  canHandleKeyboard: () => boolean
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onHide();
        return;
      }
      if (!canHandleKeyboard()) return;
      if (state.status === 'success' || state.status === 'error') return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setState((current) => ({
          ...current,
          selectedIndex: Math.min(current.selectedIndex + 1, Math.max(current.candidates.length - 1, 0))
        }));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setState((current) => ({ ...current, selectedIndex: Math.max(current.selectedIndex - 1, 0) }));
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const index = rules.indexOf(state.caseStyle);
        setState((current) => ({ ...current, caseStyle: rules[(index + 1) % rules.length]! }));
      }
      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        onInsert();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onCopy();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.caseStyle, state.status, setState, onCopy, onInsert, onHide, canHandleKeyboard]);
}
