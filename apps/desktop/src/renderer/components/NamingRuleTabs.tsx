import { motion } from 'framer-motion';
import type { CaseStyle } from '@variable-island/shared';

const rules: CaseStyle[] = ['camelCase', 'PascalCase', 'Hungarian'];

interface Props {
  value: CaseStyle;
  onChange(value: CaseStyle): void;
}

export function NamingRuleTabs({ value, onChange }: Props) {
  return (
    <div className="rule-tabs">
      {rules.map((rule) => (
        <button key={rule} className="rule-tab" onClick={() => onChange(rule)}>
          {value === rule && <motion.span layoutId="active-rule" className="rule-tab-active" />}
          <span className="rule-tab-label">{rule}</span>
        </button>
      ))}
    </div>
  );
}
