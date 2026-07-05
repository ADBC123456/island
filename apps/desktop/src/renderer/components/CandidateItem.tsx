import { motion } from 'framer-motion';
import type { NameCandidate } from '@variable-island/shared';

interface Props {
  candidate: NameCandidate;
  selected: boolean;
  index: number;
  onSelect(): void;
}

export function CandidateItem({ candidate, selected, index, onSelect }: Props) {
  return (
    <motion.button
      className={selected ? 'candidate selected' : 'candidate'}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.035 }}
      onClick={onSelect}
    >
      <span className="candidate-name">{candidate.name}</span>
      {index === 0 && <span className="candidate-badge">推荐</span>}
    </motion.button>
  );
}
