# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 初期実装 (Aphelion Delivery Flow / Light プラン)
  - 6 作品の古典童話 (赤ずきん / 桃太郎 / 白雪姫 / つるの恩返し / ブレーメンの音楽隊 / かさじぞう)
  - 本棚 2 バリアント (ShelfA: 立てかけ書架 / ShelfB: 表紙ならべ)
  - ビュアー 2 バリアント (ViewerA: 見開き / ViewerB: 全画面背景)
  - タグフィルター (グリム童話 / 日本昔話)
  - ふりがな ON/OFF, 文字サイズ調整 (16〜36px), 夜モード, アクセント色 4 色, フォントプリセット 6 種
  - Tweaks パネルによる設定一括操作 + localStorage 永続化
  - キーボード操作完結 (Tab / Enter / ←→ / Esc)
  - レスポンシブ (PC / タブレット / スマホ) + 100dvh 対応 (iPad Safari)
  - `prefers-reduced-motion` 対応
  - 実画像挿絵 (`public/illustrations/{storyId}/{scene}.webp`) 読み込み + 不在時のプレースホルダーフォールバック
- ユニットテスト 59 件 / E2E テスト 6 シナリオ
- セキュリティ監査 (CRITICAL: 0)
- README / ARCHITECTURE / SPEC / UI_SPEC / TEST_PLAN ドキュメント

### Tech Stack

- TypeScript 5 + React 18 + Vite 5 + pnpm/npm
- Vitest + @testing-library/react + Playwright
- ESLint + Prettier + jsx-a11y
