// TC-IT: App 全体結合のスモークテスト
// Tweaks 完全削除 (2026-05-05 / ADR-009) により TweaksProvider ラップ不要。
// TC-IT-003 (Tweaks パネル開閉) は削除。
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

describe('App smoke', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('night', 'no-ruby');
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-IT-001 初期マウントで本棚 (ShelfA) が描画される', () => {
    render(<App />);
    expect(screen.getByText(/きょうは どのおはなしを よもうかな/)).toBeInTheDocument();
  });

  it('TC-IT-002 物語クリックでビュアー (role=dialog) が開く', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: '赤ずきん をひらく' }));
    act(() => vi.runAllTimers());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
