// TC-SS: safe-storage のユニットテスト
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storage from '../../src/lib/safe-storage';

describe('safe-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storage._resetMemoryFallback();
  });

  it('TC-SS-001 get: キー未設定なら fallback を返す', () => {
    expect(storage.get('x', { a: 1 })).toEqual({ a: 1 });
  });

  it('TC-SS-002 set/get round-trip', () => {
    storage.set('k', { b: 2 });
    expect(storage.get('k', null)).toEqual({ b: 2 });
  });

  it('TC-SS-003 setItem が throw しても上に伝播しない / console.warn が呼ばれる', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // localStorage.setItem を Storage.prototype レベルで spy して throw させる
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => storage.set('k', { c: 3 })).not.toThrow();
    expect(warn).toHaveBeenCalled();
    spy.mockRestore();
    // in-memory fallback で取り出せる
    expect(storage.get('k', null)).toEqual({ c: 3 });
    warn.mockRestore();
  });

  it('TC-SS-004 不正な JSON が保存されている場合は fallback', () => {
    window.localStorage.setItem('k', 'not-json');
    expect(storage.get('k', { fallback: true })).toEqual({ fallback: true });
  });
});
