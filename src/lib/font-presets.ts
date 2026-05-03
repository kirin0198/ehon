// フォントプリセット定義 (モック app.jsx の FONT_PRESETS を踏襲)
import type { FontPreset } from '../types/tweaks';

export type FontPresetValue = {
  /** UI に表示する人間可読ラベル */
  label: string;
  /** body 文字に使うフォントスタック */
  body: string;
  /** display (見出し) に使うフォントスタック */
  display: string;
};

export const FONT_PRESETS: Record<FontPreset, FontPresetValue> = {
  rounded: {
    label: 'やわらか丸ゴシック (M PLUS Rounded)',
    body: "'M PLUS Rounded 1c', 'BIZ UDPGothic', system-ui, sans-serif",
    display: "'Klee One', 'M PLUS Rounded 1c', sans-serif",
  },
  udp: {
    label: 'UD教科書体 (BIZ UDPGothic)',
    body: "'BIZ UDPGothic', system-ui, sans-serif",
    display: "'BIZ UDPGothic', sans-serif",
  },
  klee: {
    label: 'クレヨン手書き (Klee One)',
    body: "'Klee One', 'M PLUS Rounded 1c', sans-serif",
    display: "'Klee One', sans-serif",
  },
  pop: {
    label: 'ポップ手描き (Hachi Maru Pop)',
    body: "'Kosugi Maru', 'M PLUS Rounded 1c', sans-serif",
    display: "'Hachi Maru Pop', sans-serif",
  },
  maru: {
    label: 'やさしい丸ゴシ (Zen Maru)',
    body: "'Zen Maru Gothic', sans-serif",
    display: "'Zen Maru Gothic', sans-serif",
  },
  mincho: {
    label: '古風な明朝 (Shippori Mincho)',
    body: "'Shippori Mincho', serif",
    display: "'Shippori Mincho', serif",
  },
};

export const FONT_PRESET_KEYS = Object.keys(FONT_PRESETS) as FontPreset[];
