// TC-ST: useSettingsStore / normalizeSettings のユニットテスト
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsStore, normalizeSettings } from '../../src/stores/settings-store';
import { SETTINGS_DEFAULTS } from '../../src/types/settings';
import * as storage from '../../src/lib/safe-storage';

describe('normalizeSettings', () => {
  it('TC-ST-001 null/undefined は SETTINGS_DEFAULTS を返す', () => {
    expect(normalizeSettings(null)).toEqual(SETTINGS_DEFAULTS);
    expect(normalizeSettings(undefined)).toEqual(SETTINGS_DEFAULTS);
  });

  it('TC-ST-002 不正な型は SETTINGS_DEFAULTS を返す', () => {
    expect(normalizeSettings('string')).toEqual(SETTINGS_DEFAULTS);
    expect(normalizeSettings(42)).toEqual(SETTINGS_DEFAULTS);
  });

  it('TC-ST-003 whitelist: 4 キー以外は無視される', () => {
    const raw = {
      shelfVariant: 'B',
      viewerVariant: 'A',
      ruby: false,
      night: true,
      fontSize: 30, // 旧スキーマキー
      accent: '#FF0000', // 旧スキーマキー
      font: 'klee', // 旧スキーマキー
    };
    const result = normalizeSettings(raw);
    expect(result).toEqual({
      shelfVariant: 'B',
      viewerVariant: 'A',
      ruby: false,
      night: true,
    });
    expect('fontSize' in result).toBe(false);
    expect('accent' in result).toBe(false);
    expect('font' in result).toBe(false);
  });

  it('TC-ST-004 shelfVariant/viewerVariant: A|B 以外はデフォルトにフォールバック', () => {
    const result = normalizeSettings({ shelfVariant: 'C', viewerVariant: 'X' });
    expect(result.shelfVariant).toBe('A');
    expect(result.viewerVariant).toBe('A');
  });

  it('TC-ST-005 空オブジェクトは SETTINGS_DEFAULTS を返す', () => {
    expect(normalizeSettings({})).toEqual(SETTINGS_DEFAULTS);
  });
});

describe('useSettingsStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storage._resetMemoryFallback();
    document.documentElement.classList.remove('night', 'no-ruby');
  });
  afterEach(() => {
    document.documentElement.classList.remove('night', 'no-ruby');
  });

  it('TC-ST-006 lazy init: localStorage 未設定なら SETTINGS_DEFAULTS で初期化', () => {
    const { result } = renderHook(() => useSettingsStore());
    expect(result.current.settings).toEqual(SETTINGS_DEFAULTS);
  });

  it('TC-ST-007 lazy init: localStorage に有効な設定があれば復元する', () => {
    window.localStorage.setItem(
      'eh.settings',
      JSON.stringify({ shelfVariant: 'B', viewerVariant: 'B', ruby: false, night: true }),
    );
    const { result } = renderHook(() => useSettingsStore());
    expect(result.current.settings.shelfVariant).toBe('B');
    expect(result.current.settings.night).toBe(true);
    expect(result.current.settings.ruby).toBe(false);
  });

  it('TC-ST-008 setSetting で単一キーを更新できる', async () => {
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.setSetting('night', true);
    });
    expect(result.current.settings.night).toBe(true);
    // 他キーは変更されない
    expect(result.current.settings.ruby).toBe(true);
  });

  it('TC-ST-009 setSetting 後に localStorage へ永続化される', async () => {
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.setSetting('shelfVariant', 'B');
    });
    const raw = window.localStorage.getItem('eh.settings');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).shelfVariant).toBe('B');
  });

  it('TC-ST-010 reset で SETTINGS_DEFAULTS に戻る', async () => {
    window.localStorage.setItem(
      'eh.settings',
      JSON.stringify({ shelfVariant: 'B', viewerVariant: 'B', ruby: false, night: true }),
    );
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.reset();
    });
    expect(result.current.settings).toEqual(SETTINGS_DEFAULTS);
  });

  it('TC-ST-011 night=true で <html> に night クラスが付与される', async () => {
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.setSetting('night', true);
    });
    expect(document.documentElement.classList.contains('night')).toBe(true);
  });

  it('TC-ST-012 night=false で <html> から night クラスが除去される', async () => {
    window.localStorage.setItem(
      'eh.settings',
      JSON.stringify({ ...SETTINGS_DEFAULTS, night: true }),
    );
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.setSetting('night', false);
    });
    expect(document.documentElement.classList.contains('night')).toBe(false);
  });

  it('TC-ST-013 ruby=false で <html> に no-ruby クラスが付与される', async () => {
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.setSetting('ruby', false);
    });
    expect(document.documentElement.classList.contains('no-ruby')).toBe(true);
  });

  it('TC-ST-014 ruby=true で <html> から no-ruby クラスが除去される', async () => {
    window.localStorage.setItem(
      'eh.settings',
      JSON.stringify({ ...SETTINGS_DEFAULTS, ruby: false }),
    );
    const { result } = renderHook(() => useSettingsStore());
    await act(async () => {
      result.current.setSetting('ruby', true);
    });
    expect(document.documentElement.classList.contains('no-ruby')).toBe(false);
  });

  it('TC-ST-015 旧 eh.tweaks キーは読まれない (無関係な key は無視)', () => {
    // 旧キーに値を仕込んでも新 hook は参照しない
    window.localStorage.setItem(
      'eh.tweaks',
      JSON.stringify({ shelfVariant: 'B', ruby: false, night: true }),
    );
    const { result } = renderHook(() => useSettingsStore());
    // 旧キーの値ではなく SETTINGS_DEFAULTS で初期化される
    expect(result.current.settings).toEqual(SETTINGS_DEFAULTS);
  });
});
