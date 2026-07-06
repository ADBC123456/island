import type { VariableType } from '@variable-island/shared';

const types: VariableType[] = ['auto', 'boolean', 'string', 'number', 'array', 'object', 'function'];

interface Props {
  value: VariableType;
  onChange(value: VariableType): void;
}

export function VariableTypeSelector({ value, onChange }: Props) {
  return (
    <select
      className="type-select"
      value={value}
      aria-label="变量类型"
      onChange={(event) => onChange(event.target.value as VariableType)}
    >
      {types.map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
  );
}
