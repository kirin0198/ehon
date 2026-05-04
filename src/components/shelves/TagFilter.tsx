// タグフィルター (単一選択セグメント)。
// 物語の `tags` から実在するタグを抽出してチップ化する。"" = ぜんぶ。
import type { Story } from '../../types/story';
import { useMemo } from 'react';

type Props = {
  stories: readonly Story[];
  selected: string[];
  setSelected: (v: string[]) => void;
};

function collectTags(stories: readonly Story[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of stories) {
    for (const t of s.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

export function TagFilter({ stories, selected, setSelected }: Props) {
  const tags = useMemo(() => collectTags(stories), [stories]);
  const current = selected.length > 0 ? selected[0] : '';
  const set = (name: string) => setSelected(name ? [name] : []);

  return (
    <div className="tag-filter" role="radiogroup" aria-label="おはなしの しゅるい">
      <span className="tag-filter-label">おはなしの しゅるい</span>
      <div className="tag-segment">
        <button
          type="button"
          role="radio"
          aria-checked={current === ''}
          className={'tag-chip' + (current === '' ? ' active' : '')}
          onClick={() => set('')}
        >
          ぜんぶ
        </button>
        {tags.map((t) => (
          <button
            type="button"
            key={t.name}
            role="radio"
            aria-checked={current === t.name}
            className={'tag-chip' + (current === t.name ? ' active' : '')}
            onClick={() => set(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export { collectTags };
