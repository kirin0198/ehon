import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 設定: React 18 + TS。`mock/` 配下の旧モック資産はビルドから完全に除外する。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      // mock/ 配下を誤って取り込まないよう external 化
      external: [/^\/mock\//],
    },
  },
  optimizeDeps: {
    exclude: ['mock'],
  },
});
