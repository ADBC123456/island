import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IslandInput } from './IslandInput';
import { NamingRuleTabs } from './NamingRuleTabs';
import { VariableTypeSelector } from './VariableTypeSelector';
import { CandidateList } from './CandidateList';
import { StatusToast } from './StatusToast';
import { islandDimensions } from '../islandMetrics';
import { useMouseCapture } from '../hooks/useMouseCapture';
import { useLiquidGlassRim } from '../hooks/useLiquidGlassRim';
import {
  collapseTransition,
  contentPopTransition,
  feedbackPopTransition,
  instantContentExitTransition,
  quickFadeTransition,
  shellExpandTransition,
  shellRetractTransition
} from '../motionTokens';
import type { IslandState } from '../hooks/useIslandState';

interface Props {
  state: IslandState;
  setState: React.Dispatch<React.SetStateAction<IslandState>>;
}

const displacementMap =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='rx' x1='0' x2='1' y1='0' y2='0'%3E%3Cstop offset='0' stop-color='%23dc8080'/%3E%3Cstop offset='.26' stop-color='%23808080'/%3E%3Cstop offset='.74' stop-color='%23808080'/%3E%3Cstop offset='1' stop-color='%23248080'/%3E%3C/linearGradient%3E%3ClinearGradient id='gy' x1='0' x2='0' y1='0' y2='1'%3E%3Cstop offset='0' stop-color='%2380dc80'/%3E%3Cstop offset='.26' stop-color='%23808080'/%3E%3Cstop offset='.74' stop-color='%23808080'/%3E%3Cstop offset='1' stop-color='%23802480'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='256' height='256' fill='%23808080'/%3E%3Crect width='256' height='256' fill='url(%23rx)' opacity='.52'/%3E%3Crect width='256' height='256' fill='url(%23gy)' opacity='.52'/%3E%3C/svg%3E";

export function IslandShell({ state, setState }: Props) {
  const isHidden = state.status === 'hidden';
  const isFeedback = state.status === 'success' || state.status === 'error';
  const hasCandidates = state.candidates.length > 0;
  const size = islandDimensions(state.status, state.candidates.length);
  const visible = state.status !== 'hidden';
  const [showEyebrow, setShowEyebrow] = useState(false);
  const previousSizeRef = useRef(size);
  const isRetracting = isHidden || size.width < previousSizeRef.current.width || size.height < previousSizeRef.current.height;
  // Both directions use a spring from the same family so the motion reads as
  // one continuous material; retract is just a touch firmer.
  const shellTransition = isRetracting ? shellRetractTransition : shellExpandTransition;
  const shellAnimation = isHidden
    ? { ...size, opacity: 0, scale: 1 }
    : { ...size, opacity: 1, scale: 1 };
  // When retracting, content exits instantly so the shell collapses cleanly
  // without the old layout lingering inside the shrinking capsule.
  const expandedContentExitTransition = isRetracting ? instantContentExitTransition : quickFadeTransition;
  const shouldShowEyebrow = state.status === 'expanded' && showEyebrow;

  // One shared shell ref drives both click-capture and the rim highlight.
  const shellRef = useRef<HTMLDivElement>(null);
  useMouseCapture(visible, shellRef);
  useLiquidGlassRim(visible, shellRef);
  useEffect(() => {
    previousSizeRef.current = size;
  }, [size]);
  useEffect(() => {
    if (state.status !== 'expanded') {
      setShowEyebrow(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowEyebrow(true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [state.status]);

  return (
    <main className="island-stage">
      <svg className="liquid-glass-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="island-glass-refraction" x="-8%" y="-16%" width="116%" height="132%" colorInterpolationFilters="sRGB">
            <feImage href={displacementMap} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="displacement-map" />
            <feDisplacementMap in="SourceGraphic" in2="displacement-map" scale="10" xChannelSelector="R" yChannelSelector="G" result="refracted" />
            <feGaussianBlur in="refracted" stdDeviation="0.18" />
          </filter>
        </defs>
      </svg>
      <motion.section
        ref={shellRef}
        className={`island-shell island-shell-${state.status}`}
        initial={{ opacity: 0, scale: 1, ...size }}
        animate={shellAnimation}
        transition={shellTransition}
        style={{ transformOrigin: '50% 50%' }}
        aria-live="polite"
      >
        <span className="island-refract" aria-hidden="true" />
        {/* Liquid Glass rim — two gradient rings (screen + overlay) */}
        <span className="island-rim" aria-hidden="true" />
        <span className="island-rim-overlay" aria-hidden="true" />
        {/* hover/active radial highlight */}
        <span className="island-glow" aria-hidden="true" />
        <AnimatePresence initial={false}>
          {isHidden ? (
            <motion.div
              key="hidden"
              className="island-collapse-core"
              initial={{ opacity: 0.34 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0, transition: quickFadeTransition }}
              transition={collapseTransition}
            />
          ) : isFeedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: quickFadeTransition }}
              transition={feedbackPopTransition}
            >
              <StatusToast message={state.message} kind={state.status === 'success' ? 'success' : 'error'} />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              className="island-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: instantContentExitTransition }}
              transition={contentPopTransition}
            >
              <div className="island-input-row">
                <div className="island-input-stack">
                  {shouldShowEyebrow && (
                    <motion.span
                      key="eyebrow"
                      className="island-eyebrow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={quickFadeTransition}
                    >
                      Variable Island
                    </motion.span>
                  )}
                  <IslandInput
                    value={state.description}
                    onChange={(description) => setState((current) => (
                      current.description === description
                        ? current
                        : { ...current, description }
                    ))}
                  />
                </div>
                {state.status === 'expanded' && (
                  <motion.span
                    className={hasCandidates ? 'island-count active' : 'island-count'}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={contentPopTransition}
                  >
                    {hasCandidates ? `${state.candidates.length} 个` : '等待'}
                  </motion.span>
                )}
              </div>
              <AnimatePresence initial={false}>
                {state.status === 'expanded' && (
                  <motion.div
                    className="expanded-content"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 0, transition: expandedContentExitTransition }}
                    transition={contentPopTransition}
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
