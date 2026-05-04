// TC-TC: TweaksProvider / useTweaks のテスト
import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TweaksProvider, useTweaks, TWEAKS_STORAGE_KEY } from '../../src/stores/tweaks-context';

function Probe() {
  const { tweaks, setTweak } = useTweaks();
  return (
    <div>
      <span data-testid="night">{tweaks.night ? 'on' : 'off'}</span>
      <span data-testid="ruby">{tweaks.ruby ? 'on' : 'off'}</span>
      <button type="button" onClick={() => setTweak('night', !tweaks.night)}>
        toggle-night
      </button>
      <button type="button" onClick={() => setTweak('ruby', !tweaks.ruby)}>
        toggle-ruby
      </button>
    </div>
  );
}

describe('TweaksProvider / useTweaks', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('night');
    document.documentElement.classList.remove('no-ruby');
  });

  it('TC-TC-001 useTweaks をプロバイダ外で使うと throw', () => {
    // 例外がコンソールに出ないようにする
    const orig = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow();
    console.error = orig;
  });

  it('TC-TC-002 初期マウントで default、setTweak 後に永続化される', async () => {
    render(
      <TweaksProvider>
        <Probe />
      </TweaksProvider>,
    );
    // 初期は default (off)
    expect(screen.getByTestId('night').textContent).toBe('off');
    await userEvent.click(screen.getByText('toggle-night'));
    expect(screen.getByTestId('night').textContent).toBe('on');
    // localStorage に書き込まれている
    const raw = window.localStorage.getItem(TWEAKS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).night).toBe(true);
  });

  it('TC-TC-003 night ON で <html> に night クラス付与', async () => {
    render(
      <TweaksProvider>
        <Probe />
      </TweaksProvider>,
    );
    await userEvent.click(screen.getByText('toggle-night'));
    expect(document.documentElement.classList.contains('night')).toBe(true);
  });

  it('TC-TC-004 ふりがな OFF で <html> に no-ruby クラス付与', async () => {
    render(
      <TweaksProvider>
        <Probe />
      </TweaksProvider>,
    );
    // 既定は ruby:true なので no-ruby は付いていない
    await act(async () => {});
    expect(document.documentElement.classList.contains('no-ruby')).toBe(false);
    await userEvent.click(screen.getByText('toggle-ruby'));
    expect(document.documentElement.classList.contains('no-ruby')).toBe(true);
  });
});
