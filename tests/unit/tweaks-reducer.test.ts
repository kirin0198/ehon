// TC-TR: tweaks-reducer / normalizeTweaks のユニットテスト
// 本番固定化 (2026-05-04) により fontSize / accent / font 関連アサーションを削除。
import { describe, it, expect } from 'vitest';
import { tweaksReducer, normalizeTweaks } from '../../src/stores/tweaks-reducer';
import { TWEAK_DEFAULTS } from '../../src/stores/tweaks-defaults';

describe('tweaksReducer', () => {
  it('TC-TR-001 set 単一キー (ruby)', () => {
    const next = tweaksReducer({ ...TWEAK_DEFAULTS }, { type: 'set', key: 'ruby', value: false });
    expect(next.ruby).toBe(false);
    // 他のキーは保たれる
    expect(next.shelfVariant).toBe(TWEAK_DEFAULTS.shelfVariant);
  });

  it('TC-TR-002 reset で defaults に戻る', () => {
    const modified = { ...TWEAK_DEFAULTS, night: true };
    const next = tweaksReducer(modified, { type: 'reset' });
    expect(next).toEqual(TWEAK_DEFAULTS);
  });

  // TC-TR-003: hydrate アクションは lazy initializer 化により廃止。TweaksProvider の
  // lazy initializer テストは tweaks-context.test.tsx の TC-TC-002 で継続カバーする。
});

describe('normalizeTweaks', () => {
  it('TC-TR-004 不正値は default にフォールバック', () => {
    const result = normalizeTweaks({ shelfVariant: 'X' });
    expect(result).toEqual(TWEAK_DEFAULTS);
  });

  it('TC-TR-005 部分的に有効な値はマージされる', () => {
    const result = normalizeTweaks({ ruby: false });
    expect(result.ruby).toBe(false);
    // 他は default
    expect(result.night).toBe(TWEAK_DEFAULTS.night);
    expect(result.shelfVariant).toBe(TWEAK_DEFAULTS.shelfVariant);
  });

  it('TC-TR-006 旧スキーマ (fontSize/accent/font) を含む localStorage 値でも正常に復元', () => {
    // 旧ブラウザに残存した古いキーが存在しても normalizeTweaks がクラッシュせず、
    // 4 フィールドの TWEAK_DEFAULTS を返すことを確認
    const result = normalizeTweaks({
      fontSize: 30,
      accent: '#E07856',
      font: 'rounded',
      ruby: false,
    });
    expect(result.ruby).toBe(false);
    // fontSize / accent / font は無視されて DEFAULTS の値になる
    expect(Object.keys(result)).toEqual(['shelfVariant', 'viewerVariant', 'ruby', 'night']);
  });

  it('null/undefined は default を返す', () => {
    expect(normalizeTweaks(null)).toEqual(TWEAK_DEFAULTS);
    expect(normalizeTweaks(undefined)).toEqual(TWEAK_DEFAULTS);
  });
});
