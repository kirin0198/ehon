// ビュアーバリアント B: 全画面背景 (背景 = 挿絵 / 下部 = テキストカード)
// 本番固定化 (2026-05-04) により fontSize / setFontSize props を削除。
// 本文サイズは tokens.css の --font-size-body (26px) を CSS で参照。
import type { Story } from '../../types/story';
import type { Tweaks } from '../../types/tweaks';
import { useViewerNav } from '../../hooks/useViewerNav';
import { ViewerBar } from './ViewerBar';
import { CoverPage } from './CoverPage';
import { IllustWithFallback } from '../common/IllustWithFallback';
import { RubyText } from '../common/RubyText';

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

export function ViewerB(props: Props) {
  const { story, onClose, ruby, night } = props;
  const { pageIndex, total, flipDir, isFlipping, go } = useViewerNav(story.pages.length, onClose);
  const isCover = pageIndex === 0;
  const page = isCover ? null : story.pages[pageIndex - 1];

  const bg = isCover
    ? `linear-gradient(135deg, ${story.coverColor}, ${story.coverAccent})`
    : page!.bg;

  return (
    <div
      className={`eh-viewer ${night ? 'night' : ''} ${ruby ? '' : 'no-ruby'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
    >
      <ViewerBar {...props} />
      <div
        className="eh-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={pageIndex + 1}
      >
        <div
          className="eh-progress-fill"
          style={{ width: `${((pageIndex + 1) / total) * 100}%` }}
        />
      </div>
      <div className="eh-viewer-stage" style={{ padding: 0 }}>
        <button
          type="button"
          className="eh-viewer-nav prev"
          disabled={pageIndex === 0 || isFlipping}
          onClick={() => go(-1)}
          aria-label="まえのページ"
        >
          ◀
        </button>
        <div className={`book-b ${flipDir ? 'flipping-' + flipDir : ''}`}>
          <div className="book-b-bg" style={{ background: bg }}>
            <IllustWithFallback
              storyId={story.id}
              scene={isCover ? 'cover' : page!.scene}
              placeholderEmoji={story.placeholderEmoji}
              bgColor={isCover ? story.coverColor : page!.bg}
              eager={isCover}
              alt={isCover ? `${story.title} の表紙` : `${story.title}: ${page!.scene}`}
            />
          </div>
          {isCover ? (
            <CoverPage story={story} onStart={() => go(1)} overlay />
          ) : (
            // <ruby>/<rt> を常に DOM に保持し、CSS の .no-ruby rt { display:none } で表示制御 (SPEC R-005)
            // 本文サイズは var(--font-size-body) = 26px 固定 (ADR-008)
            <div className="book-b-text-card" style={{ fontSize: 'var(--font-size-body)' }}>
              <RubyText text={page!.ruby} />
            </div>
          )}
        </div>
        <button
          type="button"
          className="eh-viewer-nav next"
          disabled={pageIndex >= total - 1 || isFlipping}
          onClick={() => go(1)}
          aria-label="つぎのページ"
        >
          ▶
        </button>
        {!isCover && (
          <div className="eh-pageno">
            {pageIndex} / {story.pages.length}
          </div>
        )}
      </div>
    </div>
  );
}
