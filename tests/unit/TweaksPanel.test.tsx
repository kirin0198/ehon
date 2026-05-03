// TC-TP: TweaksPanel のテスト
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

  it('TC-TP-003 4 セクション (レイアウト/よみやすさ/色/フォント) を描画', () => {
    render(
      <TweaksProvider>
        <TweaksPanel open={true} onClose={() => {}} />
      </TweaksProvider>,
    );
    const headings = screen.getAllByRole('heading', { level: 3 });
    const titles = headings.map((h) => h.textContent);
    expect(titles).toContain('レイアウト');
    expect(titles).toContain('よみやすさ');
    expect(titles).toContain('色');
    expect(titles).toContain('フォント');
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
