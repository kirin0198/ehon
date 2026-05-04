// Tweaks の useReducer 本体。
// `set` / `reset` の 2 アクションを扱う薄い実装。
// 本番固定化 (2026-05-04) により fontSize / accent / font 関連の分岐を削除。
import type { Tweaks, TweakKey } from '../types/tweaks';
import { TWEAK_DEFAULTS } from './tweaks-defaults';

export type TweaksAction =
  | { type: 'set'; key: TweakKey; value: Tweaks[TweakKey] }
  | { type: 'reset' };

export function tweaksReducer(state: Tweaks, action: TweaksAction): Tweaks {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value };
    case 'reset':
      return { ...TWEAK_DEFAULTS };
    default:
      return state;
  }
}

/**
 * localStorage から取り出した不明な値を、安全に Tweaks 型へ正規化する。
 * 不正値は既定値にフォールバックし、永続化破損でアプリが落ちることを防ぐ。
 * 旧スキーマの余分なキー (fontSize / accent / font) は whitelist 方式で自動無視される。
 */
export function normalizeTweaks(raw: unknown): Tweaks {
  if (!raw || typeof raw !== 'object') return { ...TWEAK_DEFAULTS };
  const r = raw as Record<string, unknown>;
  const v: Tweaks = { ...TWEAK_DEFAULTS };
  if (r.shelfVariant === 'A' || r.shelfVariant === 'B') v.shelfVariant = r.shelfVariant;
  if (r.viewerVariant === 'A' || r.viewerVariant === 'B') v.viewerVariant = r.viewerVariant;
  if (typeof r.ruby === 'boolean') v.ruby = r.ruby;
  if (typeof r.night === 'boolean') v.night = r.night;
  return v;
}
