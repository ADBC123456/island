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
        <button
          key={rule}
          type="button"
          className={value === rule ? 'rule-tab selected' : 'rule-tab'}
          aria-pressed={value === rule}
          onClick={() => onChange(rule)}
        >
          {value === rule && (
            <motion.span
              layoutId="active-rule"
              className="rule-tab-active"
              transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }}
            />
          )}
          <span className="rule-tab-label">{rule}</span>
        </button>
      ))}
    </div>
  );
}
