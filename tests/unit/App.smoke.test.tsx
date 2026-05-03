// TC-IT: App 全体結合のスモークテスト
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

  it('TC-IT-003 Tweaks ⚙ ボタンでパネル開閉', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Tweaks せってい' }));
    expect(screen.getByRole('button', { name: 'Tweaks をとじる' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tweaks をとじる' }));
    // Tweaks をとじた後、Tweaks をひらく が再表示される
    expect(screen.getByRole('button', { name: 'Tweaks せってい' })).toBeInTheDocument();
  });
});
