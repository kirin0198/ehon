// Tweaks パネル本体: 全設定を一括操作する右下フローティングオーバーレイ
import { useEffect } from 'react';
import { TweakSection } from './TweakSection';
import { TweakRadio } from './TweakRadio';
import { TweakToggle } from './TweakToggle';
import { TweakSlider } from './TweakSlider';
import { TweakColor } from './TweakColor';
import { TweakSelect } from './TweakSelect';
import { useTweaks } from '../../stores/tweaks-context';
import type { FontPreset } from '../../types/tweaks';
import { FONT_PRESETS } from '../../lib/font-presets';
import { FONT_SIZE_MAX, FONT_SIZE_MIN, FONT_SIZE_STEP } from '../../stores/tweaks-defaults';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function TweaksPanel({ open, onClose }: Props) {
  const { tweaks, setTweak } = useTweaks();

  // Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fontOptions = (Object.keys(FONT_PRESETS) as FontPreset[]).map((k) => ({
    value: k,
    label: FONT_PRESETS[k].label,
  }));

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tweaks-title"
      style={{
        position: 'fixed',
        right: 18,
        bottom: 90,
        width: 320,
        maxWidth: 'calc(100vw - 36px)',
        maxHeight: 'calc(100dvh - 120px)',
        overflowY: 'auto',
        background: 'var(--paper)',
        borderRadius: 16,
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        zIndex: 140,
        fontFamily: 'var(--font-body)',
      }}
    >
      <header
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <h2
          id="tweaks-title"
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}
        >
          Tweaks
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tweaks をとじる"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 22,
            color: 'var(--ink-soft)',
            width: 32,
            height: 32,
            borderRadius: '50%',
          }}
        >
          ×
        </button>
      </header>

      <TweakSection title="レイアウト">
        <TweakRadio
          label="本棚"
          value={tweaks.shelfVariant}
          options={[
            { value: 'A', label: '立てかけ' },
            { value: 'B', label: '表紙ならべ' },
          ]}
          onChange={(v) => setTweak('shelfVariant', v)}
        />
        <TweakRadio
          label="ビュアー"
          value={tweaks.viewerVariant}
          options={[
            { value: 'A', label: '見開き' },
            { value: 'B', label: '全画面' },
          ]}
          onChange={(v) => setTweak('viewerVariant', v)}
        />
      </TweakSection>

      <TweakSection title="よみやすさ">
        <TweakToggle
          label="ふりがな (ルビ)"
          value={tweaks.ruby}
          onChange={(v) => setTweak('ruby', v)}
        />
        <TweakSlider
          label="もじサイズ"
          value={tweaks.fontSize}
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          step={FONT_SIZE_STEP}
          onChange={(v) => setTweak('fontSize', v)}
        />
        <TweakToggle label="夜モード" value={tweaks.night} onChange={(v) => setTweak('night', v)} />
      </TweakSection>

      <TweakSection title="色">
        <TweakColor
          label="アクセント"
          value={tweaks.accent}
          onChange={(v) => setTweak('accent', v)}
        />
      </TweakSection>

      <TweakSection title="フォント">
        <TweakSelect
          label="書体"
          value={tweaks.font}
          options={fontOptions}
          onChange={(v) => setTweak('font', v)}
        />
      </TweakSection>
    </div>
  );
}
