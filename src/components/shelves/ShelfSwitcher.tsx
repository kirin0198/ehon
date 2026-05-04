// 本棚バリアント (A=立てかけ / B=表紙ならべ) 切替ピル。
import type { Tweaks } from '../../types/tweaks';

type Props = {
  value: Tweaks['shelfVariant'];
  onChange: (v: Tweaks['shelfVariant']) => void;
};

export function ShelfSwitcher({ value, onChange }: Props) {
  return (
    <div className="eh-version-pill" role="tablist" aria-label="本棚レイアウト切替">
      <span className="label">ほんだな</span>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'A'}
        className={value === 'A' ? 'active' : ''}
        onClick={() => onChange('A')}
      >
        <span className="icon" aria-hidden="true">
          📚
        </span>
        立てかけ
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'B'}
        className={value === 'B' ? 'active' : ''}
        onClick={() => onChange('B')}
      >
        <span className="icon" aria-hidden="true">
          🗂
        </span>
        表紙ならべ
      </button>
    </div>
  );
}
