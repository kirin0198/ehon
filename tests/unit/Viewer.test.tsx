// TC-VW: Viewer のテスト (ViewerA を代表として検証)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewerA } from '../../src/components/viewers/ViewerA';
import { STORIES } from '../../src/data/stories';

const story = STORIES[0]; // 赤ずきん, pages 7

function setup(overrides: Partial<Parameters<typeof ViewerA>[0]> = {}) {
  const props = {
    story,
    onClose: vi.fn(),
    ruby: true,
    fontSize: 22,
    night: false,
    setRuby: vi.fn(),
    setFontSize: vi.fn(),
    setNight: vi.fn(),
    variant: 'A' as const,
    setVariant: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<ViewerA {...props} />) };
}

describe('ViewerA', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-VW-001 初期表示は表紙ページで CTA を表示', () => {
    setup();
    // 「よみはじめる」CTA (テキストには ▶ が含まれる場合があるので部分一致)
    const cta = screen.getAllByRole('button', { name: /よみはじめる/ });
    expect(cta.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-VW-006 role=dialog + aria-modal を持つ', () => {
    const { container } = setup();
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('aria-modal')).toBe('true');
  });

  it('TC-VW-002 CTA クリックで本文 1 ページ目へ', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setup();
    const cta = screen.getAllByRole('button', { name: /よみはじめる/ })[0];
    await user.click(cta);
    act(() => {
      vi.runAllTimers();
    });
    // 本文 1 ページ目のテキストが描画されている
    // page 1 本文の一部「かわいい」を含む要素を確認 (RubyText が ruby/rt で分断するため textContent ベース検索)
    const bodyHasText = (text: string) =>
      Array.from(document.querySelectorAll('.book-a-text')).some((el) =>
        (el.textContent ?? '').includes(text),
      );
    expect(bodyHasText('かわいい')).toBe(true);
  });

  it('TC-VW-003 ふりがな ON で <rt> が DOM に存在', () => {
    const { container } = setup();
    // 表紙の titleRuby は `赤{あか}ずきん` なので rt が出る
    expect(container.querySelector('rt')).not.toBeNull();
  });

  it('TC-VW-005 night=true で .eh-viewer に night クラス', () => {
    const { container } = setup({ night: true });
    const root = container.querySelector('.eh-viewer');
    expect(root!.classList.contains('night')).toBe(true);
  });

  it('文字サイズ ± で setFontSize が呼ばれる', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { props } = setup({ fontSize: 22 });
    await user.click(screen.getByRole('button', { name: '文字を大きく' }));
    expect(props.setFontSize).toHaveBeenCalledWith(24);
    await user.click(screen.getByRole('button', { name: '文字を小さく' }));
    expect(props.setFontSize).toHaveBeenCalledWith(20);
  });

  it('閉じるボタンで onClose 呼出', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { props } = setup();
    await user.click(screen.getByRole('button', { name: 'ほんだなへもどる' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
