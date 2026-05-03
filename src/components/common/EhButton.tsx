// 共通ボタン。モック CSS の .eh-btn / .eh-btn.ghost / .eh-btn.icon-btn を踏襲。
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function EhButton({ variant = 'primary', className, children, ...rest }: Props) {
  const cls = [
    'eh-btn',
    variant === 'ghost' ? 'ghost' : '',
    variant === 'icon' ? 'icon-btn' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
