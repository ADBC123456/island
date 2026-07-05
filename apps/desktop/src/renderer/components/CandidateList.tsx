import type { NameCandidate } from '@variable-island/shared';
import { CandidateItem } from './CandidateItem';

interface Props {
  candidates: NameCandidate[];
  selectedIndex: number;
  onSelect(index: number): void;
}

export function CandidateList({ candidates, selectedIndex, onSelect }: Props) {
  if (candidates.length === 0) {
    return <div className="empty-candidates">输入描述后生成变量名</div>;
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
