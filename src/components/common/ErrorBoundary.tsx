// React のクラッシュ時に白画面で詰まらないようにするフォールバック (IR-008)。
// 子コンポーネントでスローされた例外を捕捉し、ユーザーに「ホームへもどる」操作を提示する。
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 子供向けプロダクトのため詳細はコンソールに留め、UI には親しみやすい文言を出す
    console.error('[ehon] ErrorBoundary caught', error, info);
  }

  private handleRecover = () => {
    // フルリロードで安全に復帰
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '100dvh',
            padding: 24,
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            background: 'var(--paper)',
            color: 'var(--ink)',
          }}
        >
          <div style={{ maxWidth: 460 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>📚</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 12 }}>
              あれ？ なにかが おかしいみたい
            </h2>
            <p
              style={{ color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}
            >
              ホームへもどって、もういちど ためしてみてね。
            </p>
            <button className="eh-btn" onClick={this.handleRecover}>
              ホームへもどる
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
