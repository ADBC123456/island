import { useEffect, useRef } from 'react';
import type { IslandState } from './useIslandState';

export function useNamingPreview(state: IslandState, setState: React.Dispatch<React.SetStateAction<IslandState>>) {
  const requestSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    const description = state.description.trim();
    const isCurrentRequest = () => !cancelled && requestSeqRef.current === requestSeq;
    const canApplyPreview = (current: IslandState) => (
      (current.status === 'compact' || current.status === 'expanded')
      && current.description.trim() === description
    );

    if (!description) {
      setState((current) => {
        if (current.status !== 'compact' && current.status !== 'expanded') return current;
        const alreadyCleared = current.status === 'compact'
          && current.candidates.length === 0
          && current.selectedIndex === 0
          && current.translatedDescription === ''
          && current.translatedDescriptionSource === '';
        if (alreadyCleared) return current;
        return {
          ...current,
          status: 'compact',
          candidates: [],
          selectedIndex: 0,
          translatedDescription: '',
          translatedDescriptionSource: ''
        };
      });
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setTimeout(async () => {
      const cachedTranslation = state.translatedDescriptionSource === description
        ? state.translatedDescription
        : '';
      try {
        const result = await window.variableIsland.generateNames({
          description,
          caseStyle: state.caseStyle,
          variableType: state.variableType,
          ...(cachedTranslation ? { translatedDescription: cachedTranslation } : {})
        });
        if (isCurrentRequest()) {
          setState((current) => {
            if (requestSeqRef.current !== requestSeq) return current;
            if (!canApplyPreview(current)) return current;
            return {
              ...current,
              status: 'expanded',
              candidates: result.candidates,
              selectedIndex: 0,
              translatedDescription: result.translatedDescription ?? cachedTranslation,
              translatedDescriptionSource: result.translatedDescription || cachedTranslation ? description : ''
            };
          });
        }
      } catch (error) {
        console.warn('[naming] failed to generate candidates', error);
        if (isCurrentRequest()) {
          setState((current) => {
            if (requestSeqRef.current !== requestSeq) return current;
            if (!canApplyPreview(current)) return current;
            return {
              ...current,
              status: 'expanded',
              candidates: [],
              selectedIndex: 0,
              translatedDescription: cachedTranslation,
              translatedDescriptionSource: cachedTranslation ? description : ''
            };
          });
        }
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    state.description,
    state.caseStyle,
    state.variableType,
    setState
  ]);
}
