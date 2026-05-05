// ユーザー設定を管理する軽量カスタム hook。
// Provider/Context/Reducer を排し useState + useEffect で完結 (ADR-009)。
// MVP では App 1 箇所のみ呼び出し、子コンポーネントへは props で配布する。
// 旧 `eh.tweaks` / `ehon.tweaks` / `ehon.tweaks.v2` キーは読まない・削除しない (放置)。
import { useState, useEffect } from 'react';
import type { Settings, SettingsKey } from '../types/settings';
import { SETTINGS_DEFAULTS } from '../types/settings';
import * as storage from '../lib/safe-storage';

/** localStorage の永続化キー */
const STORAGE_KEY = 'eh.settings';

/**
 * 不明な値を安全に Settings 型へ正規化する。
 * whitelist 方式で 4 キー以外を黙殺し、不正値は既定値にフォールバックする。
 */
export function normalizeSettings(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return { ...SETTINGS_DEFAULTS };
  const r = raw as Record<string, unknown>;
  const v: Settings = { ...SETTINGS_DEFAULTS };
  if (r.shelfVariant === 'A' || r.shelfVariant === 'B') v.shelfVariant = r.shelfVariant;
  if (r.viewerVariant === 'A' || r.viewerVariant === 'B') v.viewerVariant = r.viewerVariant;
  if (typeof r.ruby === 'boolean') v.ruby = r.ruby;
  if (typeof r.night === 'boolean') v.night = r.night;
  return v;
}

/**
 * Settings を管理するカスタム hook。
 * - lazy initializer で初回レンダー時に localStorage (`eh.settings`) から復元する。
 * - setSetting で個別キーを更新し、useEffect で自動永続化する。
 * - night / ruby の変化は <html> クラスに同期する。
 */
export function useSettingsStore(): {
  settings: Settings;
  setSetting: <K extends SettingsKey>(key: K, value: Settings[K]) => void;
  reset: () => void;
} {
  // lazy initializer: SSR/window 不在時は SETTINGS_DEFAULTS にフォールバック
  const [settings, setSettings] = useState<Settings>(() =>
    normalizeSettings(storage.get<unknown>(STORAGE_KEY, SETTINGS_DEFAULTS)),
  );

  // 永続化: settings 変化のたびに保存
  useEffect(() => {
    storage.set(STORAGE_KEY, settings);
  }, [settings]);

  // 夜モード: ルートに .night クラスを付与
  useEffect(() => {
    document.documentElement.classList.toggle('night', settings.night);
  }, [settings.night]);

  // ふりがな: ルートに .no-ruby クラスで切替
  useEffect(() => {
    document.documentElement.classList.toggle('no-ruby', !settings.ruby);
  }, [settings.ruby]);

  const setSetting = <K extends SettingsKey>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const reset = () => {
    setSettings({ ...SETTINGS_DEFAULTS });
  };

  return { settings, setSetting, reset };
}
