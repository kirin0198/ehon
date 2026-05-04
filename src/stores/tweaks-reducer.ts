// Tweaks の useReducer 本体。
// `set` / `reset` の 2 アクションを扱う薄い実装。
// 初期値の復元は TweaksProvider の lazy initializer が担うため hydrate アクションは不要。
import type { Tweaks, TweakKey } from '../types/tweaks';
import { TWEAK_DEFAULTS, FONT_SIZE_MIN, FONT_SIZE_MAX } from './tweaks-defaults';
import { FONT_PRESET_KEYS } from '../lib/font-presets';

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
 */
export function normalizeTweaks(raw: unknown): Tweaks {
  if (!raw || typeof raw !== 'object') return { ...TWEAK_DEFAULTS };
  const r = raw as Record<string, unknown>;
  const v: Tweaks = { ...TWEAK_DEFAULTS };
  if (r.shelfVariant === 'A' || r.shelfVariant === 'B') v.shelfVariant = r.shelfVariant;
  if (r.viewerVariant === 'A' || r.viewerVariant === 'B') v.viewerVariant = r.viewerVariant;
  if (
    typeof r.fontSize === 'number' &&
    r.fontSize >= FONT_SIZE_MIN &&
    r.fontSize <= FONT_SIZE_MAX
  ) {
    v.fontSize = r.fontSize;
  }
  if (typeof r.ruby === 'boolean') v.ruby = r.ruby;
  if (typeof r.night === 'boolean') v.night = r.night;
  if (typeof r.accent === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(r.accent)) v.accent = r.accent;
  if (typeof r.font === 'string' && (FONT_PRESET_KEYS as readonly string[]).includes(r.font)) {
    v.font = r.font as Tweaks['font'];
  }
  return v;
}
