// トグルスイッチ (ふりがな ON/OFF、夜モード ON/OFF)
type Props = {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
};

export function TweakToggle({ label, value, onChange }: Props) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          background: value ? 'var(--terracotta)' : 'var(--paper-2)',
          border: '2px solid ' + (value ? 'var(--terracotta)' : 'var(--ink-soft)'),
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 2,
            left: value ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.15s',
          }}
        />
      </button>
    </label>
  );
}
