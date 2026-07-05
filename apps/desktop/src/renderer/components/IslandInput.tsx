import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange(value: string): void;
}

export function IslandInput({ value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <input
      ref={ref}
      className="island-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="描述变量用途..."
      spellCheck={false}
    />
  );
}
