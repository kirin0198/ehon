// 本棚バリアント B: 表紙ならべ (グリッド)。
// モック (mock/components/Shelves.jsx の ShelfB) を TS 化して移植。
// 実画像 (cover.webp) があれば表示し、無ければ placeholderEmoji + グラデーション色面でフォールバック。
import type { Story } from '../../types/story';
import { Header } from '../layout/Header';
import { ShelfSwitcher } from './ShelfSwitcher';
import { TagFilter } from './TagFilter';
import { EmptyState } from '../common/EmptyState';
import { IllustWithFallback } from '../common/IllustWithFallback';
import type { Settings } from '../../types/settings';

type Props = {
  stories: readonly Story[];
  onOpen: (id: string) => void;
  shelfVariant: Settings['shelfVariant'];
  setShelfVariant: (v: Settings['shelfVariant']) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
};

function filterByTags(stories: readonly Story[], selected: string[]): readonly Story[] {
  if (!selected || selected.length === 0) return stories;
  return stories.filter((s) => (s.tags ?? []).some((t) => selected.includes(t)));
}

export function ShelfB({
  stories,
  onOpen,
  shelfVariant,
  setShelfVariant,
  selectedTags,
  setSelectedTags,
}: Props) {
  const filtered = filterByTags(stories, selectedTags);

  return (
    <div className="eh-home shelf-b">
      <Header
        subText="おやすみまえの よみきかせに"
        right={<ShelfSwitcher value={shelfVariant} onChange={setShelfVariant} />}
      />
      <div className="shelf-b-stage">
        <div className="shelf-b-greeting">
          <div>
            <div className="eyebrow">ようこそ</div>
            <h1>
              きょうの <span>{selectedTags.length > 0 ? selectedTags.join('・') : 'おはなし'}</span>{' '}
              を えらぼう
            </h1>
          </div>
          <div className="shelf-b-result-count">{filtered.length} さつの えほん</div>
        </div>
        <TagFilter stories={stories} selected={selectedTags} setSelected={setSelectedTags} />
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="shelf-b-grid">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                className="shelf-b-card"
                onClick={() => onOpen(s.id)}
                aria-label={`${s.title} をひらく`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  className="shelf-b-cover"
                  style={{
                    background: `linear-gradient(135deg, ${s.coverColor} 0%, ${s.coverAccent} 100%)`,
                  }}
                >
                  {/* 実画像 cover.webp があれば優先表示。無ければ emoji + グラデーション色面 */}
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <IllustWithFallback
                      storyId={s.id}
                      scene="cover"
                      placeholderEmoji={s.placeholderEmoji}
                      bgColor={s.coverColor}
                      eager
                      alt={`${s.title} の表紙`}
                    />
                  </div>
                  <div className="shelf-b-cover-tag">{s.author}</div>
                  <div className="shelf-b-cover-title">{s.title}</div>
                </div>
                <div className="shelf-b-card-meta">
                  <div className="shelf-b-card-title">{s.title}</div>
                  <div className="shelf-b-card-author">{s.description}</div>
                  <div className="shelf-b-card-tags">
                    {(s.tags ?? []).map((t) => (
                      <span key={t} className="shelf-b-mini-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
