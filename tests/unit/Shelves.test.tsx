// TC-SH: Shelf レンダリングのテスト (ShelfA / ShelfB)
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShelfA } from '../../src/components/shelves/ShelfA';
import { ShelfB } from '../../src/components/shelves/ShelfB';
import { STORIES } from '../../src/data/stories';

describe('ShelfA', () => {
  it('TC-SH-001 6 物語の背表紙ボタンを描画', () => {
    render(
      <ShelfA
        stories={STORIES}
        onOpen={() => {}}
        shelfVariant="A"
        setShelfVariant={() => {}}
        selectedTags={[]}
        setSelectedTags={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: '赤ずきん をひらく' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '桃太郎 をひらく' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '白雪姫 をひらく' })).toBeInTheDocument();
  });

  it('TC-SH-002 タグ絞込で表示数が変わる', () => {
    render(
      <ShelfA
        stories={STORIES}
        onOpen={() => {}}
        shelfVariant="A"
        setShelfVariant={() => {}}
        selectedTags={['グリム童話']}
        setSelectedTags={() => {}}
      />,
    );
    // グリム童話: 赤ずきん / 白雪姫 / ブレーメンの音楽隊
    expect(screen.getByRole('button', { name: '赤ずきん をひらく' })).toBeInTheDocument();
    // 桃太郎は出ない
    expect(screen.queryByRole('button', { name: '桃太郎 をひらく' })).toBeNull();
  });

  it('TC-SH-003 空タグ時 EmptyState を表示', () => {
    render(
      <ShelfA
        stories={STORIES}
        onOpen={() => {}}
        shelfVariant="A"
        setShelfVariant={() => {}}
        selectedTags={['存在しないタグ']}
        setSelectedTags={() => {}}
      />,
    );
    expect(screen.getByText(/このタグの えほんは まだないよ/)).toBeInTheDocument();
  });

  it('onOpen が表紙クリックで story.id とともに呼ばれる', async () => {
    const onOpen = vi.fn();
    render(
      <ShelfA
        stories={STORIES}
        onOpen={onOpen}
        shelfVariant="A"
        setShelfVariant={() => {}}
        selectedTags={[]}
        setSelectedTags={() => {}}
      />,
    );
    const userEvent = (await import('@testing-library/user-event')).default;
    await userEvent.click(screen.getByRole('button', { name: '赤ずきん をひらく' }));
    expect(onOpen).toHaveBeenCalledWith('akazukin');
  });
});

describe('ShelfB', () => {
  it('TC-SH-004 表紙カードが 6 件、cover.webp を試行', () => {
    const { container } = render(
      <ShelfB
        stories={STORIES}
        onOpen={() => {}}
        shelfVariant="B"
        setShelfVariant={() => {}}
        selectedTags={[]}
        setSelectedTags={() => {}}
      />,
    );
    expect(container.querySelectorAll('button.shelf-b-card').length).toBe(6);
    const imgs = Array.from(container.querySelectorAll('img'));
    const srcs = imgs.map((i) => i.getAttribute('src'));
    expect(srcs).toContain('/illustrations/akazukin/cover.webp');
    expect(srcs).toContain('/illustrations/momotaro/cover.webp');
  });

  it('TC-SH-005 ShelfSwitcher で aria-selected が反映される', () => {
    render(
      <ShelfB
        stories={STORIES}
        onOpen={() => {}}
        shelfVariant="B"
        setShelfVariant={() => {}}
        selectedTags={[]}
        setSelectedTags={() => {}}
      />,
    );
    const tabB = screen.getAllByRole('tab').find((b) => b.textContent?.includes('表紙ならべ'));
    expect(tabB?.getAttribute('aria-selected')).toBe('true');
  });
});
