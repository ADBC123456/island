import type { NameCandidate } from '@variable-island/shared';
import { CandidateItem } from './CandidateItem';

interface Props {
  candidates: NameCandidate[];
  selectedIndex: number;
  onSelect(index: number): void;
}

export function CandidateList({ candidates, selectedIndex, onSelect }: Props) {
  if (candidates.length === 0) {
    return (
      <div className="empty-candidates">
        <span className="empty-title">等待描述</span>
        <span className="empty-subtitle">输入后会在这里生成候选变量名</span>
      </div>
    );
  }

  return (
    <div className="candidate-list">
      {candidates.map((candidate, index) => (
        <CandidateItem
          key={`${candidate.name}-${index}`}
          candidate={candidate}
          selected={selectedIndex === index}
          index={index}
          onSelect={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
