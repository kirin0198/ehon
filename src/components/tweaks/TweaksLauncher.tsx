// 右下フローティングの ⚙ ボタン。クリックで Tweaks パネル開閉
type Props = {
  onClick: () => void;
  open: boolean;
};

export function TweaksLauncher({ onClick, open }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tweaks せってい"
      title={open ? 'Tweaks をとじる' : 'Tweaks をひらく'}
      aria-expanded={open}
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: 'var(--ink)',
        color: 'var(--paper)',
        fontSize: 24,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        zIndex: 150,
        fontFamily: 'inherit',
      }}
    >
      ⚙
    </button>
  );
}
