// ビュアー上部ツールバー: タイトル / ふりがな / 文字サイズ / 夜モード / バリアント切替 / 閉じる
import type { Story } from '../../types/story';
import type { Tweaks } from '../../types/tweaks';
import { FONT_SIZE_MAX, FONT_SIZE_MIN, FONT_SIZE_STEP } from '../../stores/tweaks-defaults';

type Props = {
  story: Story;
  onClose: () => void;
  ruby: boolean;
  fontSize: number;
  night: boolean;
  setRuby: (v: boolean) => void;
  setFontSize: (v: number) => void;
  setNight: (v: boolean) => void;
  variant: Tweaks['viewerVariant'];
  setVariant: (v: Tweaks['viewerVariant']) => void;
};

export function ViewerBar({
  story,
  onClose,
  ruby,
  fontSize,
  night,
  setRuby,
  setFontSize,
  setNight,
  variant,
  setVariant,
}: Props) {
  const dec = () => setFontSize(Math.max(FONT_SIZE_MIN, fontSize - FONT_SIZE_STEP));
  const inc = () => setFontSize(Math.min(FONT_SIZE_MAX, fontSize + FONT_SIZE_STEP));

  return (
    <div className="eh-viewer-bar">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          className="eh-viewer-tool"
          onClick={onClose}
          aria-label="ほんだなへもどる"
        >
          ← ほんだなへ
        </button>
        <div className="eh-viewer-title" id="viewer-title">
          {story.title}
          <span className="badge">{story.author}</span>
        </div>
      </div>
      <div className="eh-viewer-tools">
        <button
          type="button"
          className={'eh-viewer-tool' + (ruby ? ' active' : '')}
          onClick={() => setRuby(!ruby)}
          aria-pressed={ruby}
          aria-label="ふりがなの切替"
        >
          ふりがな {ruby ? 'あり' : 'なし'}
        </button>
        <div className="eh-viewer-tool" style={{ padding: '4px 6px', gap: 4 }}>
          <span style={{ padding: '0 6px' }}>文字</span>
          <button
            type="button"
            onClick={dec}
            aria-label="文字を小さく"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 14,
              padding: '0 6px',
            }}
          >
            小
          </button>
          <span
            style={{ fontSize: 12, opacity: 0.7, minWidth: 24, textAlign: 'center' }}
            aria-live="polite"
          >
            {fontSize}
          </span>
          <button
            type="button"
            onClick={inc}
            aria-label="文字を大きく"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 18,
              padding: '0 6px',
            }}
          >
            大
          </button>
        </div>
        <button
          type="button"
          className={'eh-viewer-tool' + (night ? ' active' : '')}
          onClick={() => setNight(!night)}
          aria-pressed={night}
          aria-label="夜モードの切替"
        >
          {night ? '🌙 よる' : '☀ ひる'}
        </button>
        <div
          className="eh-viewer-tool"
          style={{ padding: 2, gap: 0 }}
          role="tablist"
          aria-label="ビュアーレイアウト切替"
        >
          {(['A', 'B'] as const).map((v) => (
            <button
              type="button"
              key={v}
              role="tab"
              aria-selected={variant === v}
              onClick={() => setVariant(v)}
              style={{
                border: 'none',
                background: variant === v ? 'var(--ink)' : 'transparent',
                color: variant === v ? 'var(--paper)' : 'inherit',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              見開き {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
