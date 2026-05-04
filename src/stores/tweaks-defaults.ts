import type { Tweaks } from '../types/tweaks';

// Tweaks の既定値。
// 本番固定化 (2026-05-04) により 4 フィールドに縮小。
// fontSize / accent / font は tokens.css の CSS 変数として固定宣言。
export const TWEAK_DEFAULTS: Tweaks = {
  shelfVariant: 'A',
  viewerVariant: 'A',
  ruby: true,
  night: false,
};
