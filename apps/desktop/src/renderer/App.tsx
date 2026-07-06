import { useCallback, useEffect, useRef } from 'react';
import { IslandShell } from './components/IslandShell';
import { createInitialIslandState, useIslandState } from './hooks/useIslandState';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useNamingPreview } from './hooks/useNamingPreview';
import { islandDimensions } from './islandMetrics';
import { shellRetractAnimationMs } from './motionTokens';

const RETRACT_ANIMATION_MS = shellRetractAnimationMs;

export function App() {
  const { state, setState, selectedCandidate } = useIslandState();
  const hideTimerRef = useRef<number | null>(null);
  const delayedHideTimerRef = useRef<number | null>(null);
  const hideRequestIdRef = useRef(0);
  const pendingInsertIdRef = useRef<number | null>(null);
  const statusRef = useRef(state.status);
  const stateRef = useRef(state);
  useNamingPreview(state, setState);

  useEffect(() => {
    stateRef.current = state;
    statusRef.current = state.status;
  }, [state]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (delayedHideTimerRef.current !== null) {
      window.clearTimeout(delayedHideTimerRef.current);
      delayedHideTimerRef.current = null;
    }
  }, []);

  const requestHide = useCallback(() => {
    if (statusRef.current === 'hidden') {
      return hideRequestIdRef.current;
    }

    clearHideTimer();
    const requestId = hideRequestIdRef.current + 1;
    hideRequestIdRef.current = requestId;
    statusRef.current = 'hidden';
    void window.variableIsland.setIgnoreMouseEvents(true);
    setState((current) => ({ ...current, status: 'hidden' }));
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      if (hideRequestIdRef.current !== requestId) return;
      void window.variableIsland.hideIsland();
    }, RETRACT_ANIMATION_MS);
    return requestId;
  }, [clearHideTimer, setState]);

  const scheduleHide = useCallback((delayMs: number) => {
    if (delayedHideTimerRef.current !== null) {
      window.clearTimeout(delayedHideTimerRef.current);
    }
    const requestId = hideRequestIdRef.current;
    delayedHideTimerRef.current = window.setTimeout(() => {
      delayedHideTimerRef.current = null;
      if (hideRequestIdRef.current !== requestId) return;
      requestHide();
    }, delayMs);
  }, [requestHide]);

  useEffect(() => {
    const unsubscribeShow = window.variableIsland.onShow(() => {
      hideRequestIdRef.current += 1;
      pendingInsertIdRef.current = null;
      statusRef.current = 'compact';
      clearHideTimer();
      setState(createInitialIslandState());
    });
    const unsubscribeHide = typeof window.variableIsland.onHideRequest === 'function'
      ? window.variableIsland.onHideRequest(requestHide)
      : () => undefined;

    return () => {
      unsubscribeShow();
      unsubscribeHide();
      clearHideTimer();
    };
  }, [clearHideTimer, requestHide, setState]);

  const { status } = state;
  const candidateCount = state.candidates.length;
  useEffect(() => {
    const { width, height } = islandDimensions(status, candidateCount);
    void window.variableIsland.setIslandStatus({ status, width, height });
  }, [status, candidateCount]);

  const showFeedback = useCallback((status: 'success' | 'error', message: string) => {
    clearHideTimer();
    statusRef.current = status;
    setState((current) => ({ ...current, status, message }));
    scheduleHide(status === 'success' ? 900 : 1900);
  }, [clearHideTimer, scheduleHide, setState]);

  const copySelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const actionId = hideRequestIdRef.current;
    const candidateName = selectedCandidate.name;
    const description = state.description;
    const caseStyle = state.caseStyle;
    const variableType = state.variableType;
    const result = await window.variableIsland.copyText(candidateName);
    if (hideRequestIdRef.current !== actionId) return;
    const current = stateRef.current;
    const currentCandidate = current.candidates[current.selectedIndex]?.name;
    if (
      current.status !== 'expanded'
      || current.description !== description
      || current.caseStyle !== caseStyle
      || current.variableType !== variableType
      || currentCandidate !== candidateName
    ) {
      return;
    }
    showFeedback(result.success ? 'success' : 'error', result.success ? `已复制 ${candidateName}` : '复制失败');
  }, [selectedCandidate, showFeedback, state.caseStyle, state.description, state.variableType]);

  const insertSelected = useCallback(async () => {
    if (!selectedCandidate) return;
    if (pendingInsertIdRef.current !== null) return;

    const actionId = requestHide();
    pendingInsertIdRef.current = actionId;
    await new Promise((resolve) => window.setTimeout(resolve, RETRACT_ANIMATION_MS));
    try {
      if (hideRequestIdRef.current !== actionId) return;
      const result = await window.variableIsland.insertText({ text: selectedCandidate.name });
      if (!result.success) {
        console.warn('[island] insert failed, copied to clipboard', result);
      }
    } finally {
      if (pendingInsertIdRef.current === actionId) {
        pendingInsertIdRef.current = null;
      }
    }
  }, [requestHide, selectedCandidate]);

  const canHandleKeyboard = useCallback(() => statusRef.current !== 'hidden', []);

  useKeyboardNavigation(state, setState, copySelected, insertSelected, requestHide, canHandleKeyboard);

  return <IslandShell state={state} setState={setState} />;
}
