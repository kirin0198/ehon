// 本棚画面のヘッダー。サービス名「えほんやさん」とサブテキストを表示する。
import type { ReactNode } from 'react';

type Props = {
  /** バリアントごとに変わるサブテキスト */
  subText: string;
  right?: ReactNode;
};

export function Header({ subText, right }: Props) {
  return (
    <div className="eh-header">
      <div className="eh-logo">
        <div className="eh-logo-mark" aria-hidden="true">
          本
        </div>
        <div>
          <div className="eh-logo-text">えほんやさん</div>
          <div className="eh-logo-sub">Ehon — {subText}</div>
        </div>
      </div>
      {right}
    </div>
  );
}
