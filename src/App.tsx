// アプリのルートコンポーネント。
// scaffolder 段階ではビルド検証のための最小プレースホルダー実装。
// 本格実装は Phase 5 (developer) で TASK-023 として完成させる。
export default function App() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100dvh',
        fontFamily: "'M PLUS Rounded 1c', system-ui, sans-serif",
        background: 'var(--paper)',
        color: 'var(--ink)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Klee One', sans-serif", fontSize: 36, marginBottom: 12 }}>
          えほんやさん
        </h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          scaffolder 完了。実装は developer フェーズで行います。
        </p>
      </div>
    </div>
  );
}
