// ユーザー設定 (Tweaks) の型定義。
// localStorage キー `eh.tweaks` に永続化される。
// 本番固定化 (2026-05-04) により fontSize / accent / font の 3 フィールドを削除し 4 フィールドに縮小。
// 固定値 (文字サイズ 26px / アクセント色 #E07856 / フォント M PLUS Rounded 1c) は tokens.css で宣言。

export type Tweaks = {
  shelfVariant: 'A' | 'B';
  viewerVariant: 'A' | 'B';
  /** ふりがな ON/OFF */
  ruby: boolean;
  /** 夜モード */
  night: boolean;
};

export type TweakKey = keyof Tweaks;
