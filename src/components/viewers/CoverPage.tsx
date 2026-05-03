// 表紙ページ (両ビュアー共通): 物語タイトル + 「よみはじめる」CTA
import type { Story } from '../../types/story';
import { RubyText } from '../common/RubyText';

type Props = {
  story: Story;
  onStart: () => void;
  ruby: boolean;
  /** ViewerB でカバー画像が背景になっているか (true なら半透明オーバーレイ) */
  overlay?: boolean;
};

export function CoverPage({ story, onStart, ruby, overlay = false }: Props) {
  if (overlay) {
    return (
      <div className="book-cover-overlay">
        <div className="book-cover-title">
          {ruby ? <RubyText text={story.titleRuby} /> : story.title}
        </div>
        <div className="book-cover-author">{story.author}</div>
        <button
          type="button"
          className="book-cover-cta"
          onClick={onStart}
          aria-label={`${story.title} をよみはじめる`}
        >
          ▶ よみはじめる
        </button>
      </div>
    );
  }
  // ViewerA 見開きの右ページ用フラット版
  return (
    <div style={{ textAlign: 'center', margin: 'auto' }}>
      <div
        style={{
          fontFamily: "'Hachi Maru Pop', sans-serif",
          fontSize: 56,
          lineHeight: 1.2,
          color: 'var(--ink)',
          marginBottom: 16,
        }}
      >
        {ruby ? <RubyText text={story.titleRuby} /> : story.title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'var(--ink-soft)',
          letterSpacing: '0.2em',
          marginBottom: 32,
        }}
      >
        {story.author}
      </div>
      <div style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.8, marginBottom: 24 }}>
        {story.description}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="eh-btn"
        aria-label={`${story.title} をよみはじめる`}
      >
        よみはじめる ▶
      </button>
    </div>
  );
}
