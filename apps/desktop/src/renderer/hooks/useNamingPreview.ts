import { useEffect } from 'react';
import type { IslandState } from './useIslandState';

export function useNamingPreview(state: IslandState, setState: React.Dispatch<React.SetStateAction<IslandState>>) {
  useEffect(() => {
    let cancelled = false;
    const description = state.description.trim();
    if (!description) {
      setState((current) => ({
        ...current,
        status: 'compact',
        candidates: [],
        selectedIndex: 0,
        translatedDescription: '',
        translatedDescriptionSource: ''
      }));
      return;
    }

    const timer = window.setTimeout(async () => {
      const cachedTranslation = state.translatedDescriptionSource === description
        ? state.translatedDescription
        : '';
      const result = await window.variableIsland.generateNames({
        description,
        caseStyle: state.caseStyle,
        variableType: state.variableType,
        ...(cachedTranslation ? { translatedDescription: cachedTranslation } : {})
      });
      if (!cancelled) {
        setState((current) => ({
          ...current,
          status: 'expanded',
          candidates: result.candidates,
          selectedIndex: 0,
          translatedDescription: result.translatedDescription ?? cachedTranslation,
          translatedDescriptionSource: result.translatedDescription || cachedTranslation ? description : ''
        }));
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
