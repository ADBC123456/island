import { motion } from 'framer-motion';
import type { CaseStyle } from '@variable-island/shared';
import { ruleThumbTransition } from '../motionTokens';

const rules: CaseStyle[] = ['camelCase', 'PascalCase', 'snake_case', 'CONSTANT_CASE', 'Hungarian'];
const labels: Record<CaseStyle, string> = {
  camelCase: 'camel',
  PascalCase: 'Pascal',
  snake_case: 'snake',
  CONSTANT_CASE: 'CONST',
  Hungarian: 'Hungarian'
};

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
          aria-label={rule}
          onClick={() => onChange(rule)}
        >
          {value === rule && (
            <motion.span
              layoutId="active-rule"
              className="rule-tab-active"
              transition={ruleThumbTransition}
            />
          )}
          <span className="rule-tab-label">{labels[rule]}</span>
        </button>
      ))}
    </div>
  );
}
