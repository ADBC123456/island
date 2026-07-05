import { AnimatePresence, motion } from 'framer-motion';
import type { IslandStatus } from '@variable-island/shared';
import { IslandInput } from './IslandInput';
import { NamingRuleTabs } from './NamingRuleTabs';
import { VariableTypeSelector } from './VariableTypeSelector';
import { CandidateList } from './CandidateList';
import { ShortcutHints } from './ShortcutHints';
import { StatusToast } from './StatusToast';
import type { IslandState } from '../hooks/useIslandState';

interface Props {
  state: IslandState;
  setState: React.Dispatch<React.SetStateAction<IslandState>>;
}

function dimensions(status: IslandStatus) {
  if (status === 'expanded') return { width: 640, minHeight: 246, borderRadius: 28 };
  if (status === 'success' || status === 'error') return { width: 360, minHeight: 58, borderRadius: 29 };
  return { width: 300, minHeight: 56, borderRadius: 28 };
}

export function IslandShell({ state, setState }: Props) {
  const isFeedback = state.status === 'success' || state.status === 'error';

  return (
    <main className="island-stage">
      <motion.section
        className="island-shell"
        animate={dimensions(state.status)}
        initial={{ opacity: 0, y: -20, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
      >
        <AnimatePresence mode="wait">
          {isFeedback ? (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatusToast message={state.message} kind={state.status === 'success' ? 'success' : 'error'} />
            </motion.div>
          ) : (
            <motion.div key="editor" className="island-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <IslandInput
                value={state.description}
                onChange={(description) => setState((current) => ({ ...current, description }))}
              />
              <AnimatePresence>
                {state.status === 'expanded' && (
                  <motion.div className="expanded-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                    <div className="control-row">
                      <NamingRuleTabs value={state.caseStyle} onChange={(caseStyle) => setState((current) => ({ ...current, caseStyle }))} />
                      <VariableTypeSelector value={state.variableType} onChange={(variableType) => setState((current) => ({ ...current, variableType }))} />
                    </div>
                    <CandidateList
                      candidates={state.candidates}
                      selectedIndex={state.selectedIndex}
                      onSelect={(selectedIndex) => setState((current) => ({ ...current, selectedIndex }))}
                    />
                    <ShortcutHints />
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
