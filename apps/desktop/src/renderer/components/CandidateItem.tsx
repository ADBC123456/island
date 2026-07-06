import { motion } from 'framer-motion';
import type { NameCandidate } from '@variable-island/shared';

interface Props {
  candidate: NameCandidate;
  selected: boolean;
  index: number;
  onSelect(): void;
}

function reasonLabel(reason?: string): string {
  if (reason === 'codelf boolean rule') return 'Codelf 布尔';
  if (reason === 'codelf collection rule') return 'Codelf 集合';
  if (reason === 'codelf function rule') return 'Codelf 函数';
  if (reason === 'codelf numeric rule') return 'Codelf 数值';
  if (reason === 'codelf compact phrase') return 'Codelf 简洁';
  if (reason === 'codelf direct phrase') return 'Codelf 直译';
  return '候选命名';
}

const itemSpring = { type: 'spring', stiffness: 480, damping: 32, mass: 0.7 } as const;

export function CandidateItem({ candidate, selected, index, onSelect }: Props) {
  return (
    <motion.button
      className={selected ? 'candidate selected' : 'candidate'}
      type="button"
      aria-pressed={selected}
      layout="position"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ ...itemSpring, delay: Math.min(index * 0.03, 0.12) }}
      onClick={onSelect}
    >
      <span className="candidate-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="candidate-main">
        <span className="candidate-name">{candidate.name}</span>
        <span className="candidate-reason">{reasonLabel(candidate.reason)}</span>
      </span>
      <span className={index === 0 ? 'candidate-badge primary' : 'candidate-badge'}>
        {index === 0 ? '首选' : `${Math.round(candidate.score * 100)}%`}
      </span>
    </motion.button>
  );
}
