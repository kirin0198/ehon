// Tweaks パネル本体: 設定を一括操作する右下フローティングオーバーレイ
// 本番固定化 (2026-05-04) により 2 セクション・4 操作のみに縮小。
// 削除: 色セクション (TweakColor) / フォントセクション (TweakSelect) /
//        よみやすさセクションの文字サイズスライダー (TweakSlider)
import { useEffect } from 'react';
import { TweakSection } from './TweakSection';
import { TweakRadio } from './TweakRadio';
import { TweakToggle } from './TweakToggle';
import { useTweaks } from '../../stores/tweaks-context';

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

      {/* レイアウトセクション: 本棚バリアント / ビュアーバリアント */}
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

      {/* よみやすさセクション: ふりがな / 夜モード (文字サイズスライダーは固定化により削除) */}
      <TweakSection title="よみやすさ">
        <TweakToggle
          label="ふりがな (ルビ)"
          value={tweaks.ruby}
          onChange={(v) => setTweak('ruby', v)}
        />
        <TweakToggle label="夜モード" value={tweaks.night} onChange={(v) => setTweak('night', v)} />
      </TweakSection>
    </div>
  );
}
