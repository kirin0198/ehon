// ビュアー上部ツールバー: タイトル / ふりがな / 夜モード / バリアント切替 / 閉じる
// 本番固定化 (2026-05-04) により「あ-」「あ+」ボタンと文字サイズ数値表示を削除。
// fontSize / setFontSize props も削除。
import type { Story } from '../../types/story';
import type { Tweaks } from '../../types/tweaks';

type Props = {
  story: Story;
  onClose: () => void;
  ruby: boolean;
  night: boolean;
  setRuby: (v: boolean) => void;
  setNight: (v: boolean) => void;
  variant: Tweaks['viewerVariant'];
  setVariant: (v: Tweaks['viewerVariant']) => void;
};

export function ViewerBar({
  story,
  onClose,
  ruby,
  night,
  setRuby,
  setNight,
  variant,
  setVariant,
}: Props) {
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
