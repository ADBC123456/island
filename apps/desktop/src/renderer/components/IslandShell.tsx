import { AnimatePresence, motion } from 'framer-motion';
import { IslandInput } from './IslandInput';
import { NamingRuleTabs } from './NamingRuleTabs';
import { VariableTypeSelector } from './VariableTypeSelector';
import { CandidateList } from './CandidateList';
import { StatusToast } from './StatusToast';
import { ShortcutHints } from './ShortcutHints';
import { islandDimensions } from '../islandMetrics';
import type { IslandState } from '../hooks/useIslandState';

interface Props {
  state: IslandState;
  setState: React.Dispatch<React.SetStateAction<IslandState>>;
}

/**
 * Apple Dynamic Island style springs.
 * morph: capsule size transitions (snappy, slight overshoot).
 * pop: content entering after a morph (faster, tighter).
 */
const morphSpring = { type: 'spring', stiffness: 440, damping: 33, mass: 0.9 } as const;
const popSpring = { type: 'spring', stiffness: 520, damping: 32, mass: 0.7 } as const;

export function IslandShell({ state, setState }: Props) {
  const isFeedback = state.status === 'success' || state.status === 'error';
  const hasCandidates = state.candidates.length > 0;
  const size = islandDimensions(state.status, state.candidates.length);

  return (
    <main className="island-stage">
      <motion.section
        className={`island-shell island-shell-${state.status}`}
        initial={{ opacity: 0, scale: 0.68, y: -16, ...size }}
        animate={{ ...size, opacity: 1, y: 0, scale: 1 }}
        transition={morphSpring}
        aria-live="polite"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isFeedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.09 } }}
              transition={popSpring}
            >
              <StatusToast message={state.message} kind={state.status === 'success' ? 'success' : 'error'} />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              className="island-content"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.09 } }}
              transition={popSpring}
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
                  <motion.span
                    className={hasCandidates ? 'island-count active' : 'island-count'}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={popSpring}
                  >
                    {hasCandidates ? `${state.candidates.length} 个` : '等待'}
                  </motion.span>
                )}
              </div>
              <AnimatePresence initial={false}>
                {state.status === 'expanded' && (
                  <motion.div
                    className="expanded-content"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.99, transition: { duration: 0.1 } }}
                    transition={{ ...popSpring, delay: 0.02 }}
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
