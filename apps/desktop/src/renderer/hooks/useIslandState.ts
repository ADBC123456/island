import { useMemo, useState } from 'react';
import type { CaseStyle, IslandStatus, NameCandidate, VariableType } from '@variable-island/shared';

export interface IslandState {
  status: IslandStatus;
  description: string;
  caseStyle: CaseStyle;
  variableType: VariableType;
  candidates: NameCandidate[];
  selectedIndex: number;
  message: string;
  translatedDescription: string;
  translatedDescriptionSource: string;
}

export function createInitialIslandState(): IslandState {
  return {
    status: 'compact',
    description: '',
    caseStyle: 'camelCase',
    variableType: 'auto',
    candidates: [],
    selectedIndex: 0,
    message: '',
    translatedDescription: '',
    translatedDescriptionSource: ''
  };
}

export function useIslandState() {
  const [state, setState] = useState<IslandState>(createInitialIslandState);

  const selectedCandidate = useMemo(
    () => state.candidates[state.selectedIndex],
    [state.candidates, state.selectedIndex]
  );

  return { state, setState, selectedCandidate };
}
