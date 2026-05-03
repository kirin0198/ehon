// ふりがな (ルビ) パーサ
// 入力例: "桃太郎{ももたろう}は ぐんぐん大{おお}きく..."
// 出力: { type: 'plain' | 'ruby' } のトークン列。renderRuby は React ノードに変換する。
// モック (mock/components/ruby.jsx) の renderRuby と同等の挙動を維持しつつ、純関数化してテストしやすくする。
import { Fragment, createElement, type ReactNode } from 'react';

/** パース結果トークン */
export type RubyToken =
  | { type: 'plain'; text: string }
  | { type: 'ruby'; base: string; rt: string };

const TOKEN_RE = /([^{]+?)\{([^}]+)\}|([^{]+)/g;
const TRAILING_KANJI_RE = /^(.*?)([㐀-鿿一-鿿々ヶ]+)$/;

/**
 * 文字列を `{ ふりがな }` 記法でパースしてトークン列に分解する。
 * - `漢字{よみ}` → { type: 'ruby', base: '漢字', rt: 'よみ' }
 * - 漢字の前に平仮名/カタカナがあった場合、それを plain として切り出してから ruby 化する
 * - 不正記法 (空 base / 閉じ忘れ) はそのまま plain として残す
 */
export function parseRuby(input: string): RubyToken[] {
  if (!input) return [];
  const tokens: RubyToken[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(input)) !== null) {
    if (m[3] !== undefined) {
      // 単独の plain 文字列
      tokens.push({ type: 'plain', text: m[3] });
      continue;
    }
    const before = m[1] ?? '';
    const reading = m[2] ?? '';
    const km = before.match(TRAILING_KANJI_RE);
    if (km && km[2]) {
      if (km[1]) tokens.push({ type: 'plain', text: km[1] });
      tokens.push({ type: 'ruby', base: km[2], rt: reading });
    } else {
      // 直前が漢字でない場合 (記号などの直後の {} ) はそのまま ruby 化
      tokens.push({ type: 'ruby', base: before, rt: reading });
    }
  }
  return tokens;
}

/**
 * トークン列を React ノード配列に変換。
 * 表示側は本コンポーネント (RubyText) で `<ruby><rt>` を生成。
 */
export function renderRuby(input: string): ReactNode {
  const tokens = parseRuby(input);
  return tokens.map((t, i) => {
    if (t.type === 'plain') {
      return createElement(Fragment, { key: i }, t.text);
    }
    return createElement('ruby', { key: i }, t.base, createElement('rt', null, t.rt));
  });
}
