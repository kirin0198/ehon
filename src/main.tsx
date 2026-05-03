// Vite + React 18 のエントリポイント。
// 実際のアプリ本体は src/App.tsx に集約する。
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/ehon.css';
import './styles/reduced-motion.css';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Root element #app not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
