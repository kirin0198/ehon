// セグメント型ラジオ (本棚バリアント A/B、ビュアーバリアント A/B 用)
type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
};

export function TweakRadio<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
      <span>{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        style={{
          display: 'inline-flex',
          background: 'var(--paper-2)',
          borderRadius: 999,
          padding: 3,
        }}
      >
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              border: 'none',
              background: value === opt.value ? 'var(--ink)' : 'transparent',
              color: value === opt.value ? 'var(--paper)' : 'var(--ink-soft)',
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </label>
  );
}
