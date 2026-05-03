// TC-TR: tweaks-reducer / normalizeTweaks のユニットテスト
import { describe, it, expect } from 'vitest';
import { tweaksReducer, normalizeTweaks } from '../../src/stores/tweaks-reducer';
import { TWEAK_DEFAULTS } from '../../src/stores/tweaks-defaults';

describe('tweaksReducer', () => {
  it('TC-TR-001 set 単一キー', () => {
    const next = tweaksReducer({ ...TWEAK_DEFAULTS }, { type: 'set', key: 'fontSize', value: 24 });
    expect(next.fontSize).toBe(24);
    // 他のキーは保たれる
    expect(next.ruby).toBe(TWEAK_DEFAULTS.ruby);
  });

  it('TC-TR-002 reset で defaults に戻る', () => {
    const modified = { ...TWEAK_DEFAULTS, night: true, fontSize: 30 };
    const next = tweaksReducer(modified, { type: 'reset' });
    expect(next).toEqual(TWEAK_DEFAULTS);
  });

  it('TC-TR-003 hydrate で外部値を復元', () => {
    const external = { ...TWEAK_DEFAULTS, accent: '#000000', fontSize: 20 };
    const next = tweaksReducer(TWEAK_DEFAULTS, { type: 'hydrate', value: external });
    expect(next).toEqual(external);
  });
});

describe('normalizeTweaks', () => {
  it('TC-TR-004 不正値は default にフォールバック', () => {
    const result = normalizeTweaks({ shelfVariant: 'X', fontSize: 'big' });
    expect(result).toEqual(TWEAK_DEFAULTS);
  });

  it('TC-TR-005 部分的に有効な値はマージされる', () => {
    const result = normalizeTweaks({ ruby: false, accent: '#000000' });
    expect(result.ruby).toBe(false);
    expect(result.accent).toBe('#000000');
    // 他は default
    expect(result.fontSize).toBe(TWEAK_DEFAULTS.fontSize);
  });

  it('TC-TR-006 fontSize 範囲外は default に戻る', () => {
    const result = normalizeTweaks({ fontSize: 50 });
    expect(result.fontSize).toBe(TWEAK_DEFAULTS.fontSize);
  });

  it('TC-TR-007 accent が hex でないなら default', () => {
    const result = normalizeTweaks({ accent: 'red' });
    expect(result.accent).toBe(TWEAK_DEFAULTS.accent);
  });

  it('null/undefined は default を返す', () => {
    expect(normalizeTweaks(null)).toEqual(TWEAK_DEFAULTS);
    expect(normalizeTweaks(undefined)).toEqual(TWEAK_DEFAULTS);
  });
});
