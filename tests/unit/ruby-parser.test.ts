// TC-RP: ruby-parser のユニットテスト
import { describe, it, expect } from 'vitest';
import { parseRuby } from '../../src/lib/ruby-parser';

describe('parseRuby', () => {
  it('TC-RP-001 空文字列は空配列', () => {
    expect(parseRuby('')).toEqual([]);
  });

  it('TC-RP-002 プレーン文字列のみ', () => {
    const r = parseRuby('むかしむかし');
    expect(r).toEqual([{ type: 'plain', text: 'むかしむかし' }]);
  });

  it('TC-RP-003 単純な漢字 + ルビ', () => {
    const r = parseRuby('桃太郎{ももたろう}');
    expect(r).toEqual([{ type: 'ruby', base: '桃太郎', rt: 'ももたろう' }]);
  });

  it('TC-RP-004 平仮名前置詞 + 漢字ルビ + 平仮名後置詞', () => {
    const r = parseRuby('おじいさんは山{やま}へ');
    expect(r).toEqual([
      { type: 'plain', text: 'おじいさんは' },
      { type: 'ruby', base: '山', rt: 'やま' },
      { type: 'plain', text: 'へ' },
    ]);
  });

  it('TC-RP-005 複数のルビ混在', () => {
    const r = parseRuby('女{おんな}の子{こ}が');
    expect(r).toEqual([
      { type: 'ruby', base: '女', rt: 'おんな' },
      { type: 'plain', text: 'の' },
      { type: 'ruby', base: '子', rt: 'こ' },
      { type: 'plain', text: 'が' },
    ]);
  });

  it('TC-RP-006 直前が漢字でない場合でもルビ化される', () => {
    const r = parseRuby('!桃太郎{ももたろう}');
    expect(r).toEqual([
      { type: 'plain', text: '!' },
      { type: 'ruby', base: '桃太郎', rt: 'ももたろう' },
    ]);
  });

  it('TC-RP-007 不正記法 (閉じ忘れ) でも例外を投げない', () => {
    expect(() => parseRuby('桃太郎{ももたろう')).not.toThrow();
  });
});
