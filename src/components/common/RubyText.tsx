// ふりがな付きテキストの描画。
// 入力文字列をそのまま renderRuby に渡し、結果を span でラップする。
import { renderRuby } from '../../lib/ruby-parser';

type Props = {
  /** ふりがな記法付き本文 (例: `桃太郎{ももたろう}`) */
  text: string;
  className?: string;
};

export function RubyText({ text, className }: Props) {
  return <span className={className}>{renderRuby(text)}</span>;
}
