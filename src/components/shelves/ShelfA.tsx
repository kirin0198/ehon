// 本棚バリアント A: 木製の立てかけ書架。
// モック (mock/components/Shelves.jsx の ShelfA) を TS 化して移植。
import type { Story } from '../../types/story';
import { Header } from '../layout/Header';
import { ShelfSwitcher } from './ShelfSwitcher';
import { TagFilter } from './TagFilter';
import { EmptyState } from '../common/EmptyState';
import type { Settings } from '../../types/settings';

type Props = {
  stories: readonly Story[];
  onOpen: (id: string) => void;
  shelfVariant: Settings['shelfVariant'];
  setShelfVariant: (v: Settings['shelfVariant']) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
};

const SPINE_HEIGHTS = [240, 260, 230, 250, 245, 255];
const SPINE_WIDTHS = [62, 70, 58, 66, 64, 60];

function filterByTags(stories: readonly Story[], selected: string[]): readonly Story[] {
  if (!selected || selected.length === 0) return stories;
  return stories.filter((s) => (s.tags ?? []).some((t) => selected.includes(t)));
}

export function ShelfA({
  stories,
  onOpen,
  shelfVariant,
  setShelfVariant,
  selectedTags,
  setSelectedTags,
}: Props) {
  const filtered = filterByTags(stories, selectedTags);

  return (
    <div className="eh-home shelf-a">
      <Header
        subText="よみたいおはなしを えらんでね"
        right={<ShelfSwitcher value={shelfVariant} onChange={setShelfVariant} />}
      />
      <div className="shelf-a-stage">
        <div className="shelf-a-greeting">
          <h1>きょうは どのおはなしを よもうかな？</h1>
          <p>本のせなかを タップすると、おはなしがはじまります</p>
        </div>
        <TagFilter stories={stories} selected={selectedTags} setSelected={setSelectedTags} />
        <div className="shelf-a-shelf">
          <div className="shelf-a-decor" aria-hidden="true">
            <div className="shelf-a-decor-item lamp" />
            <div className="shelf-a-decor-item" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="shelf-a-books">
              {filtered.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className="shelf-a-book"
                  onClick={() => onOpen(s.id)}
                  aria-label={`${s.title} をひらく`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="shelf-a-spine"
                    style={{
                      background: s.spine,
                      height: SPINE_HEIGHTS[idx % SPINE_HEIGHTS.length],
                      width: SPINE_WIDTHS[idx % SPINE_WIDTHS.length],
                    }}
                  >
                    <div className="shelf-a-spine-title">{s.title}</div>
                    <div className="shelf-a-spine-emoji" aria-hidden="true">
                      {s.placeholderEmoji}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="shelf-a-floor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
