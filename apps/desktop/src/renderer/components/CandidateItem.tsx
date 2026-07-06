import { motion } from 'framer-motion';
import type { NameCandidate } from '@variable-island/shared';

interface Props {
  candidate: NameCandidate;
  selected: boolean;
  index: number;
  onSelect(): void;
}

function reasonLabel(reason?: string): string {
  if (reason === 'deeplx translation') return 'DeepLX 翻译';
  if (reason === 'boolean intent detected') return '布尔语义';
  if (reason === 'local dictionary match') return '本地词典';
  return '候选命名';
}

export function CandidateItem({ candidate, selected, index, onSelect }: Props) {
  return (
    <motion.button
      className={selected ? 'candidate selected' : 'candidate'}
      type="button"
      aria-pressed={selected}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.982 }}
      transition={{ delay: index * 0.035, type: 'spring', stiffness: 330, damping: 24, mass: 0.72 }}
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
