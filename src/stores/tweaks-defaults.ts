import type { Tweaks } from '../types/tweaks';

// Tweaks の既定値。モック (mock/app.jsx) の TWEAK_DEFAULTS を踏襲する。
// localStorage に値が無い / 不正な場合のフォールバックに使われる。
export const TWEAK_DEFAULTS: Tweaks = {
  shelfVariant: 'A',
  viewerVariant: 'A',
  fontSize: 22,
  ruby: true,
  night: false,
  accent: '#E07856', // --terracotta
  font: 'rounded',
};

/** fontSize の許容範囲 / ステップ */
export const FONT_SIZE_MIN = 16;
export const FONT_SIZE_MAX = 36;
export const FONT_SIZE_STEP = 2;
