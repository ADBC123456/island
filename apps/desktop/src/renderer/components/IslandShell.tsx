import { AnimatePresence, motion } from 'framer-motion';
import type { IslandStatus } from '@variable-island/shared';
import { IslandInput } from './IslandInput';
import { NamingRuleTabs } from './NamingRuleTabs';
import { VariableTypeSelector } from './VariableTypeSelector';
import { CandidateList } from './CandidateList';
import { StatusToast } from './StatusToast';
import type { IslandState } from '../hooks/useIslandState';

interface Props {
  state: IslandState;
  setState: React.Dispatch<React.SetStateAction<IslandState>>;
}

function dimensions(status: IslandStatus) {
  if (status === 'expanded') return { width: 672, height: 296, borderRadius: 34 };
  if (status === 'success' || status === 'error') return { width: 392, height: 60, borderRadius: 30 };
  return { width: 338, height: 56, borderRadius: 28 };
}

export function IslandShell({ state, setState }: Props) {
  const isFeedback = state.status === 'success' || state.status === 'error';
  const hasCandidates = state.candidates.length > 0;

  return (
    <main className="island-stage">
      <motion.section
        className={`island-shell island-shell-${state.status}`}
        animate={{ ...dimensions(state.status), opacity: 1, y: 0, scale: 1 }}
        initial={{ opacity: 0, y: -20, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 330, damping: 25, mass: 0.86 }}
        aria-live="polite"
      >
        <div className="island-topline" aria-hidden="true" />
        <AnimatePresence mode="wait">
          {isFeedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <StatusToast message={state.message} kind={state.status === 'success' ? 'success' : 'error'} />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              className="island-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="island-input-row">
                <span className="island-state-mark" aria-hidden="true" />
                <div className="island-input-stack">
                  {state.status === 'expanded' && <span className="island-eyebrow">Variable Island</span>}
                  <IslandInput
                    value={state.description}
                    onChange={(description) => setState((current) => ({ ...current, description }))}
                  />
                </div>
                {state.status === 'expanded' && (
                  <span className={hasCandidates ? 'island-count active' : 'island-count'}>
                    {hasCandidates ? `${state.candidates.length} 个` : '等待'}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {state.status === 'expanded' && (
                  <motion.div
                    className="expanded-content"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26, mass: 0.72 }}
                  >
                    <div className="control-row">
                      <NamingRuleTabs value={state.caseStyle} onChange={(caseStyle) => setState((current) => ({ ...current, caseStyle }))} />
                      <VariableTypeSelector value={state.variableType} onChange={(variableType) => setState((current) => ({ ...current, variableType }))} />
                    </div>
                    <CandidateList
                      candidates={state.candidates}
                      selectedIndex={state.selectedIndex}
                      onSelect={(selectedIndex) => setState((current) => ({ ...current, selectedIndex }))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  );
}
