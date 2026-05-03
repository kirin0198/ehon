// アクセント色プリセット選択 (4 色固定)
import { ACCENT_PRESETS } from '../../lib/accent-presets';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

export function TweakColor({ label, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
      <span>{label}</span>
      <div role="radiogroup" aria-label={label} style={{ display: 'flex', gap: 8 }}>
        {ACCENT_PRESETS.map((p) => {
          const active = value.toLowerCase() === p.value.toLowerCase();
          return (
            <button
              type="button"
              key={p.value}
              role="radio"
              aria-checked={active}
              aria-label={p.label}
              title={p.label}
              onClick={() => onChange(p.value)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: active ? '3px solid var(--ink)' : '3px solid transparent',
                background: p.value,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
