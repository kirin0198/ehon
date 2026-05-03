// スライダー (文字サイズ調整 16〜36px)
type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
};

export function TweakSlider({ label, value, min, max, step, onChange }: Props) {
  const id = `slider-${label}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
      <label
        htmlFor={id}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{value} px</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} ピクセル`}
        style={{ width: '100%' }}
      />
    </div>
  );
}
