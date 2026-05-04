// ユーザー設定 (Tweaks) の型定義。
// localStorage キー `eh.tweaks` に永続化される。

/** フォントプリセット ID。各プリセットは src/lib/font-presets.ts で値を定義 */
export type FontPreset = 'rounded' | 'udp' | 'klee' | 'pop' | 'maru' | 'mincho';

export type Tweaks = {
  shelfVariant: 'A' | 'B';
  viewerVariant: 'A' | 'B';
  /** 本文文字サイズ (px)。16〜36 / 2px ステップ */
  fontSize: number;
  /** ふりがな ON/OFF */
  ruby: boolean;
  /** 夜モード */
  night: boolean;
  /** アクセント色 (CSS color)。`accent-presets.ts` の候補から選択 */
  accent: string;
  font: FontPreset;
};

export type TweakKey = keyof Tweaks;
