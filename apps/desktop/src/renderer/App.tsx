import { useCallback } from 'react';
import { IslandShell } from './components/IslandShell';
import { useIslandState } from './hooks/useIslandState';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useNamingPreview } from './hooks/useNamingPreview';

export function App() {
  const { state, setState, selectedCandidate } = useIslandState();
  useNamingPreview(state, setState);

  const showFeedback = useCallback((status: 'success' | 'error', message: string) => {
    setState((current) => ({ ...current, status, message }));
    window.setTimeout(() => window.variableIsland.hideIsland(), status === 'success' ? 800 : 1800);
  }, [setState]);

  const copySelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const result = await window.variableIsland.copyText(selectedCandidate.name);
    showFeedback(result.success ? 'success' : 'error', result.success ? `Copied: ${selectedCandidate.name}` : '复制失败');
  }, [selectedCandidate, showFeedback]);

  const insertSelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const result = await window.variableIsland.insertText({ text: selectedCandidate.name });
    showFeedback(result.success ? 'success' : 'error', result.success ? 'Inserted' : '插入失败，已复制到剪贴板');
  }, [selectedCandidate, showFeedback]);

  useKeyboardNavigation(state, setState, copySelected, insertSelected);

  return <IslandShell state={state} setState={setState} />;
}
