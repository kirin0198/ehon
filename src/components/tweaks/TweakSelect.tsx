// セレクト (フォントプリセット選択)
type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
};

export function TweakSelect<T extends string>({ label, value, options, onChange }: Props<T>) {
  const id = `select-${label}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          fontFamily: 'inherit',
          fontSize: 14,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1.5px solid var(--ink-soft)',
          background: 'var(--paper)',
          color: 'var(--ink)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
