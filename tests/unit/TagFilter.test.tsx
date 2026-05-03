// TC-TF: TagFilter / collectTags のテスト
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagFilter, collectTags } from '../../src/components/shelves/TagFilter';
import { STORIES } from '../../src/data/stories';

describe('collectTags', () => {
  it('TC-TF-001 6 stories から重複なしで集計', () => {
    const tags = collectTags(STORIES);
    const names = tags.map((t) => t.name).sort();
    expect(names).toEqual(['グリム童話', '日本昔話']);
    const grimm = tags.find((t) => t.name === 'グリム童話');
    expect(grimm?.count).toBe(3);
  });
});

describe('TagFilter', () => {
  it('TC-TF-002 ぜんぶ をクリックで selected=[] になる', async () => {
    const setSelected = vi.fn();
    render(<TagFilter stories={STORIES} selected={['グリム童話']} setSelected={setSelected} />);
    await userEvent.click(screen.getByRole('radio', { name: 'ぜんぶ' }));
    expect(setSelected).toHaveBeenCalledWith([]);
  });

  it('TC-TF-003 タグをクリックで selected=[name]', async () => {
    const setSelected = vi.fn();
    render(<TagFilter stories={STORIES} selected={[]} setSelected={setSelected} />);
    await userEvent.click(screen.getByRole('radio', { name: 'グリム童話' }));
    expect(setSelected).toHaveBeenCalledWith(['グリム童話']);
  });

  it('TC-TF-004 aria-checked が現在選択を反映', () => {
    render(<TagFilter stories={STORIES} selected={['グリム童話']} setSelected={() => {}} />);
    const grimm = screen.getByRole('radio', { name: 'グリム童話' });
    expect(grimm.getAttribute('aria-checked')).toBe('true');
    const all = screen.getByRole('radio', { name: 'ぜんぶ' });
    expect(all.getAttribute('aria-checked')).toBe('false');
  });
});
