import { useCallback, useEffect } from 'react';
import { IslandShell } from './components/IslandShell';
import { createInitialIslandState, useIslandState } from './hooks/useIslandState';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useNamingPreview } from './hooks/useNamingPreview';
import { islandDimensions } from './islandMetrics';

export function App() {
  const { state, setState, selectedCandidate } = useIslandState();
  useNamingPreview(state, setState);

  useEffect(() => window.variableIsland.onShow(() => setState(createInitialIslandState())), [setState]);

  const { status } = state;
  const candidateCount = state.candidates.length;
  useEffect(() => {
    const { width, height } = islandDimensions(status, candidateCount);
    void window.variableIsland.setIslandStatus({ status, width, height });
  }, [status, candidateCount]);

  const showFeedback = useCallback((status: 'success' | 'error', message: string) => {
    setState((current) => ({ ...current, status, message }));
    window.setTimeout(() => window.variableIsland.hideIsland(), status === 'success' ? 900 : 1900);
  }, [setState]);

  const copySelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const result = await window.variableIsland.copyText(selectedCandidate.name);
    showFeedback(result.success ? 'success' : 'error', result.success ? `已复制 ${selectedCandidate.name}` : '复制失败');
  }, [selectedCandidate, showFeedback]);

  const insertSelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const result = await window.variableIsland.insertText({ text: selectedCandidate.name });
    showFeedback(result.success ? 'success' : 'error', result.success ? '已插入' : '插入失败，已复制到剪贴板');
  }, [selectedCandidate, showFeedback]);

  useKeyboardNavigation(state, setState, copySelected, insertSelected);

  return <IslandShell state={state} setState={setState} />;
}
