// ユーザー設定 (Settings) の型定義。
// localStorage キー `eh.settings` に永続化される。
// Tweaks 完全削除 (2026-05-05 / ADR-009) に伴い、旧 Tweaks 型を置換。
// 固定値 (文字サイズ 26px / アクセント色 #E07856 / フォント M PLUS Rounded 1c) は tokens.css で宣言。

export type Settings = {
  shelfVariant: 'A' | 'B';
  viewerVariant: 'A' | 'B';
  /** ふりがな ON/OFF */
  ruby: boolean;
  /** 夜モード */
  night: boolean;
};

export type SettingsKey = keyof Settings;

export const SETTINGS_DEFAULTS: Settings = {
  shelfVariant: 'A',
  viewerVariant: 'A',
  ruby: true,
  night: false,
};
