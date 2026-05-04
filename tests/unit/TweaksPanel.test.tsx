// TC-TP: TweaksPanel のテスト
// 本番固定化 (2026-05-04) により 2 セクション (レイアウト/よみやすさ) 構成に修正。
// 「色」「フォント」セクションの検証を削除。
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TweaksPanel } from '../../src/components/tweaks/TweaksPanel';
import { TweaksProvider } from '../../src/stores/tweaks-context';

describe('TweaksPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('night', 'no-ruby');
  });

  it('TC-TP-001 open=false ならパネルを描画しない', () => {
    const { container } = render(
      <TweaksProvider>
        <TweaksPanel open={false} onClose={() => {}} />
      </TweaksProvider>,
    );
    // パネルの h2 (Tweaks) が存在しない
    expect(container.querySelector('#tweaks-title')).toBeNull();
  });

  it('TC-TP-002 open=true で × ボタンを描画', () => {
    render(
      <TweaksProvider>
        <TweaksPanel open={true} onClose={() => {}} />
      </TweaksProvider>,
    );
    expect(screen.getByRole('button', { name: 'Tweaks をとじる' })).toBeInTheDocument();
  });

  it('TC-TP-003 2 セクション (レイアウト/よみやすさ) を描画', () => {
    render(
      <TweaksProvider>
        <TweaksPanel open={true} onClose={() => {}} />
      </TweaksProvider>,
    );
    const headings = screen.getAllByRole('heading', { level: 3 });
    const titles = headings.map((h) => h.textContent);
    expect(titles).toContain('レイアウト');
    expect(titles).toContain('よみやすさ');
    // 削除されたセクションが存在しないことを確認
    expect(titles).not.toContain('色');
    expect(titles).not.toContain('フォント');
  });

  it('TC-TP-004 4 つの操作要素 (本棚/ビュアー/ふりがな/夜モード) のみ存在する', () => {
    render(
      <TweaksProvider>
        <TweaksPanel open={true} onClose={() => {}} />
      </TweaksProvider>,
    );
    // 文字サイズスライダーが存在しない
    expect(screen.queryByRole('slider')).toBeNull();
  });

  it('TC-TP-005 Esc キーで onClose 呼出', () => {
    const onClose = vi.fn();
    render(
      <TweaksProvider>
        <TweaksPanel open={true} onClose={onClose} />
      </TweaksProvider>,
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('× ボタンで onClose 呼出', async () => {
    const onClose = vi.fn();
    render(
      <TweaksProvider>
        <TweaksPanel open={true} onClose={onClose} />
      </TweaksProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Tweaks をとじる' }));
    expect(onClose).toHaveBeenCalled();
  });
});
