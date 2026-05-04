// タグ絞込結果ゼロのメッセージ表示。
type Props = {
  message?: string;
};

export function EmptyState({ message = '🔍 このタグの えほんは まだないよ' }: Props) {
  return (
    <div className="shelf-empty" role="status" aria-live="polite">
      {message}
    </div>
  );
}
