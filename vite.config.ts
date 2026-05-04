import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 設定: React 18 + TS。`mock/` 配下の旧モック資産はビルドから完全に除外する。
// 本番ビルドでは sourcemap を出力しない (情報漏洩・帯域節約のため)。dev 時は HMR と
// ブラウザデバッグの利便を取り、Vite のデフォルト挙動 (eval ベース sourcemap) を活用する。
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    target: 'es2020',
    rollupOptions: {
      // mock/ 配下を誤って取り込まないよう external 化
      external: [/^\/mock\//],
    },
  },
  optimizeDeps: {
    exclude: ['mock'],
  },
}));
