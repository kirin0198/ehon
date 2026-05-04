// Tweaks パネルの 1 セクション (見出し + 子要素)
import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

export function TweakSection({ title, children }: Props) {
  return (
    <section
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <h3
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--ink-soft)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}
