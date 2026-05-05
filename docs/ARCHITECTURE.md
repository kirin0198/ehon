# Architecture Design: えほんやさん（Ehon）

> Source: SPEC.md (2026-05-04 / Tweaks 縮小版 → 2026-05-05 で Tweaks 完全削除 / 2026-05-06 で UC-006 にスワイプ追加 / 2026-05-05 アニメ Phase 2 → 2026-05-05 RTL 化)
> Source: UI_SPEC.md (2026-05-04 / Tweaks 縮小版 → 2026-05-05 で Tweaks 完全削除 / 2026-05-06 で SCR-002 にスワイプ追加 / 2026-05-05 アニメ Phase 2 → 2026-05-05 RTL 化)
> Source: DISCOVERY_RESULT.md (2026-05-04) / project-rules.md (2026-05-04)
> Source: docs/design-notes/tweaks-simplification.md (2026-05-04)
> Source: docs/design-notes/remove-tweaks-panel.md (2026-05-05)
> Source: docs/design-notes/page-turn-animation.md (2026-05-05)
> Source: docs/design-notes/page-turn-animation-phase2.md (2026-05-05)
> Source: docs/design-notes/viewer-a-rtl.md (2026-05-05)
> Created: 2026-05-04
> Last updated: 2026-05-05
> Update history:
>   - 2026-05-04: Initial draft (architect / Delivery Flow Light プラン)
>   - 2026-05-04: Tweaks 機能の本番固定化 (architect / Tweaks 型を 4 フィールドに縮小、CSS 変数同期 useEffect を 2 本削減、ADR-008 追記、実装順序を Phase A〜E に再構成)
>   - 2026-05-05: Tweaks 機能の完全削除 (architect / TweaksPanel/Launcher/Provider/Context/Reducer 削除、useSettingsStore (custom hook) へ置換、ADR-009 追記、実装順序を Phase 1〜5 に再構成)
>   - 2026-05-06: タッチスワイプ対応 Phase 1 を追加 (architect / react-swipeable 採用、ADR-010 追記、ViewerA/ViewerB の `.eh-viewer-stage` にスワイプジェスチャ統合、R-018/R-019 追加)
>   - 2026-05-05: ページめくりアニメ強化 Phase 2 を追加 (architect / CSS only / ADR-011 追記 / `.book-a` への perspective 付与・キーフレームへ box-shadow 追加・ViewerB easing を `cubic-bezier(0.2, 0.8, 0.2, 1)` に統一 / R-021 追加)
>   - 2026-05-05: ViewerA / ViewerB の RTL 化 (architect / 解釈 Z = ページ単位の左右入れ替え + スワイプ反転 + アニメ反転 + キーボードは OS 標準維持 / ADR-012 追記 / JSX 順序変更で a11y reading order を担保 / CSS キーフレームは新名 `flipNextRight` / `flipPrevLeft` に改名 / R-022 / R-023 追加)

## 1. アーキテクチャ概要

### システム図

```mermaid
flowchart TB
  subgraph Browser[Webブラウザ]
    direction TB
    UI[React Tree<br/>App → Shelf/Viewer]
    Store[(useSettingsStore<br/>custom hook)]
    LS[(localStorage<br/>key: eh.settings)]
    Static[Static assets<br/>(stories.ts, illustrations/*.webp)]
    UI <-->|read/write| Store
    Store <-->|persist| LS
    UI -->|read| Static
  end
  Vercel[Vercel Edge CDN] -->|HTTPS / static| Browser
  Repo[GitHub repo<br/>main branch] -->|build & deploy| Vercel
```

- フロントエンド単一の SPA（バックエンド・DB・認証なし）
- Vercel ホスティング（静的サイト）
- 状態は軽量カスタム hook (`useSettingsStore`) + localStorage に閉じる
- 物語データはビルド時静的、挿絵は `public/illustrations/` 配下に静的配置 + フォールバック

### 採用アーキテクチャパターン

- **コンポーネント駆動 UI + Custom Hooks**
  - `App` がルート、ビュアー / 本棚を `App` が直接ホスト（Provider 不要）
  - 本棚 / ビュアー切替は `settings.shelfVariant` / `settings.viewerVariant` を見て分岐レンダ
  - キーボード・ページ送り等の振舞いは Custom Hook (`useViewerNav` 等) に切り出し
  - 設定状態は `useSettingsStore()` 単一 hook で取得（Context Provider なし）
- **Feature-based + Layer-based ハイブリッドのディレクトリ構成**（後述 §2）
- **トークン駆動スタイル**: CSS Custom Properties (`--paper`, `--ink`, `--terracotta` 等) を `:root` に集約。ランタイム書換は廃止し、固定値を `tokens.css` に直書きする方針へ移行（ADR-008）

### Tech Stack（確定版）

| Layer | Technology | Version | 採用根拠 |
|------|-----------|---------|---------|
| 言語 | TypeScript | 5.4+ | strict mode 必須、project-rules.md / SPEC.md 確定 |
| ランタイム (dev) | Node.js | ≥ 20 LTS | Vite 5 / pnpm の前提 |
| UI | React | 18.3+ | モック踏襲、`useState` / Hooks 安定 |
| ビルド | Vite | 5.x | 高速 HMR、TS/JSX ネイティブ、Vercel 親和 |
| パッケージ | pnpm | 9.x | project-rules.md 推奨 |
| 状態管理 | カスタム hook (`useSettingsStore`) | (内蔵) | Settings 1 種のみ。Provider/Context/Reducer の階層を排し `useState` + `useEffect` で完結（ADR-009） |
| ふりがな処理 | 自前パーサ | — | `桃太郎{ももたろう}` 記法。外部依存ゼロ |
| タッチジェスチャ | `react-swipeable` | 7.x | スワイプ閾値・方向検出を React hook 形式で薄くラップ。bundle gzip +約 4 kB（ADR-010） |
| スタイル | CSS (素 / モック踏襲) | — | モック確立済みトークンを `:root` 移植。CSS Modules はオプション |
| Lint | ESLint | 8.x + `@typescript-eslint` 7.x + `eslint-plugin-react-hooks` 4.x + `eslint-plugin-jsx-a11y` 6.x | a11y 検証必須 (`<ruby>` SR / aria-label) |
| Format | Prettier | 3.x | project-rules.md 確定 |
| ユニットテスト | Vitest | 1.x | Vite 統合 |
| ライブラリ補助 | @testing-library/react | 14.x | コンポーネントテスト |
|  | @testing-library/jest-dom | 6.x | カスタムマッチャ |
|  | @testing-library/user-event | 14.x | キーボード・タップシミュレーション |
| E2E | Playwright | 1.44+ | クロスブラウザ + iPad プロファイル必須 |
| ホスティング | Vercel | — | Operations Flow で確定。`vercel.json` SPA リライト |

### 採用ライブラリ（最小限・library-and-security-policy.md 準拠）

| Library | 目的 | 採用基準確認 |
|---------|------|-------------|
| `react` / `react-dom` 18 | UI ライブラリ | 業界標準、active maintained, MIT |
| `vite` 5 + `@vitejs/plugin-react` | ビルド / HMR | active maintained, MIT |
| `typescript` 5 | 型安全 | active maintained, Apache-2.0 |
| `eslint` + 関連プラグイン | Lint / a11y | active maintained, MIT |
| `prettier` | Format | active maintained, MIT |
| `vitest` + `@vitest/ui` (任意) | ユニットテスト | active maintained, MIT |
| `@testing-library/*` | テスト補助 | active maintained, MIT |
| `@playwright/test` | E2E | active maintained, Apache-2.0 |
| `jsdom` | Vitest 環境 | active maintained, MIT |
| `react-swipeable` 7.x | タッチスワイプ検出 hook | active maintained, MIT, gzip 約 4 kB。週 DL 100 万超で安定。`useSwipeable({ onSwipedLeft, onSwipedRight })` の薄いラッパで本プロジェクトに最適（ADR-010） |

> **追加候補は最小化**:
> - i18n / Routing / 状態管理ライブラリは導入しない (MVP 不要)
> - **Zustand 等の状態管理ライブラリは ADR-009 で明確に却下**。Settings は単一 hook で完結
> - フォントは Google Fonts URL 直参照（`<link>`）。本番固定化に伴い M PLUS Rounded 1c のみを残し、その他のフォント `<link>` は `index.html` から除去する（ADR-008）
> - Markdown / 画像処理ライブラリは MVP 不要
> - **アニメーションライブラリ (Framer Motion / React Spring) は採用しない**: 既存 CSS の `rotateY` / `translateX` で十分。Phase 2 でも CSS のみで強化する（ADR-011）。ドラッグ追従が必要になった場合のみ Phase 3 候補として再検討（ADR-010）

## 2. ディレクトリ構造

```
ehon/
├── public/
│   ├── illustrations/        # 実画像挿絵（ユーザー段階配置）
│   │   ├── akazukin/
│   │   │   ├── cover.webp    # 表紙
│   │   │   ├── forest-girl.webp
│   │   │   ├── basket.webp
│   │   │   └── ... (各 scene)
│   │   ├── momotaro/
│   │   ├── shirayuki/
│   │   ├── tsurunoongaeshi/
│   │   ├── bremen/
│   │   └── kasajizo/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── main.tsx                       # createRoot エントリ
│   ├── App.tsx                        # ルートコンポーネント（Provider 不要 / useSettingsStore 直接呼び出し）
│   ├── components/
│   │   ├── shelves/
│   │   │   ├── ShelfA.tsx             # 立てかけ書架
│   │   │   ├── ShelfB.tsx             # 表紙ならべ
│   │   │   ├── ShelfSwitcher.tsx
│   │   │   └── TagFilter.tsx
│   │   ├── viewers/
│   │   │   ├── ViewerA.tsx            # 見開き（右綴じ仕様）
│   │   │   ├── ViewerB.tsx            # 全画面背景
│   │   │   ├── ViewerBar.tsx          # 上部ツールバー
│   │   │   ├── CoverPage.tsx          # 表紙ページ（共通）
│   │   │   └── PageNumber.tsx
│   │   ├── common/
│   │   │   ├── EhButton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── IllustWithFallback.tsx # 挿絵 + フォールバック
│   │   │   └── RubyText.tsx
│   │   └── layout/
│   │       └── Header.tsx
│   ├── hooks/
│   │   ├── useViewerNav.ts            # ページ送り・キーボード
│   │   └── useFocusTrap.ts            # ビュアー a11y
│   ├── lib/
│   │   ├── ruby-parser.ts             # 漢字{かんじ} → <ruby>
│   │   ├── ruby-parser.types.ts
│   │   ├── illustration-path.ts       # storyId/scene → /illustrations/...
│   │   └── safe-storage.ts            # localStorage の try/catch ラッパ
│   ├── stores/
│   │   └── settings-store.ts          # useSettingsStore() / SETTINGS_DEFAULTS / normalizeSettings
│   ├── data/
│   │   └── stories.ts                 # 6 作品の物語データ + 型
│   ├── styles/
│   │   ├── tokens.css                 # CSS 変数（モック由来 + 固定値の直書き）
│   │   ├── global.css                 # html/body リセット + ruby
│   │   ├── ehon.css                   # モック CSS 移植（components 横断）
│   │   └── reduced-motion.css         # prefers-reduced-motion
│   └── types/
│       ├── story.ts                   # Story / Page 型
│       └── settings.ts                # Settings / SettingsKey 型（4 フィールド）
├── tests/
│   ├── unit/
│   │   ├── ruby-parser.test.ts
│   │   ├── settings-store.test.ts
│   │   ├── illustration-path.test.ts
│   │   ├── safe-storage.test.ts
│   │   ├── ShelfA.test.tsx
│   │   ├── ShelfB.test.tsx
│   │   ├── ViewerA.test.tsx
│   │   ├── ViewerB.test.tsx
│   │   ├── TagFilter.test.tsx
│   │   └── App.smoke.test.tsx
│   └── e2e/
│       ├── home.spec.ts               # 本棚 → ビュアー → 戻る
│       ├── viewer-keyboard.spec.ts    # キーボード完結（RTL 後も期待値据え置き）
│       ├── viewer-swipe.spec.ts       # ★ Phase 1 (2026-05-06): スワイプでページ送り。RTL 化で期待値を反転（右=次/左=前）
│       ├── ruby-toggle.spec.ts        # ふりがな切替
│       ├── persistence.spec.ts        # localStorage 永続化（新キー eh.settings 対象）
│       ├── responsive-ipad.spec.ts    # iPad プロファイル
│       └── image-fallback.spec.ts     # 画像不在シナリオ
├── docs/                              # Aphelion 成果物（既存）
├── mock/                              # 既存モック退避（scaffolder で移動）
├── .claude/
├── index.html                         # Vite エントリ。フォント <link> は M PLUS Rounded 1c のみ
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json                 # vite.config.ts 用
├── package.json
├── pnpm-lock.yaml
├── playwright.config.ts
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── .gitattributes
├── vercel.json                        # SPA リライト（Operations 担当）
├── README.md
├── CHANGELOG.md
├── LICENSE
└── LICENSE-illustrations.md           # Operations Flow 担当
```

> **`mock/` の扱い**: scaffolder 段階で既存モック (`Ehon.html`, `app.jsx`, `tweaks-panel.jsx`, `components/`, `data/`, `styles/`) を `mock/` に移動。`tsconfig.json` の `exclude` と Vite `optimizeDeps` で本番ビルドから除外する（R-009）。削除はしない（IR-005 / project-rules）。
>
> **本番固定化に伴う削除ファイル（ADR-008 / 完了済）**: `src/components/tweaks/TweakColor.tsx` / `TweakSelect.tsx` / `TweakSlider.tsx` / `src/lib/accent-presets.ts` / `src/lib/font-presets.ts` の 5 ファイルは削除済。
>
> **Tweaks 完全削除に伴う削除ファイル（ADR-009 / 完了済）**: `src/components/tweaks/` ディレクトリ全体、`src/stores/tweaks-*.ts(x)` 3 ファイル、`src/types/tweaks.ts`、tweaks 系 unit テスト 3 本。
>
> **タッチスワイプ Phase 1 に伴う追加（ADR-010 / 完了済）**:
> - `package.json` の `dependencies` に `react-swipeable` を追加
> - `tests/e2e/viewer-swipe.spec.ts` を新規作成（Playwright touch エミュレーションでスワイプによる前後遷移を検証）
> - 新規モジュール追加は **行わない**: `useSwipeable` を `ViewerA.tsx` / `ViewerB.tsx` 内で直接呼び出し、既存 `useViewerNav.go(±1)` を呼ぶ薄い接合に留める
>
> **ページめくりアニメ強化 Phase 2 に伴う変更（ADR-011 / 完了済）**:
> - 影響範囲は **`src/styles/ehon.css` のキーフレーム / 親要素クラス定義のみ**。React コンポーネント・型定義・hook には変更を加えない
> - JS ライブラリ追加は **なし**（バンドル増 0 kB）
> - 既存 `src/styles/reduced-motion.css` の `.book-a, .book-b { animation: none !important; }` 系セレクタが新キーフレームの中間キーも含めて停止するため、reduced-motion 側の追加対応は不要
>
> **RTL 化に伴う変更（ADR-012 / 本フェーズ）**:
> - 影響範囲は `src/components/viewers/ViewerA.tsx` / `ViewerB.tsx` の JSX とスワイプハンドラ、`src/styles/ehon.css` の `.book-a` 系キーフレーム + セレクタ
> - `useViewerNav.ts` は **改変しない**（キーボードは OS 標準維持）
> - `tests/e2e/viewer-swipe.spec.ts` は左右の期待値を反転、`viewer-keyboard.spec.ts` は **据え置き**
> - JS ライブラリ追加は **なし**（バンドル増 0 kB）

## 3. モジュール設計

### `App` (src/App.tsx)
- **責務**: 全アプリのルート。`ErrorBoundary` でラップ。本棚 / ビュアーの表示制御
- **依存**: `ErrorBoundary`, `ShelfA`, `ShelfB`, `ViewerA`, `ViewerB`, `useSettingsStore`
- **公開インターフェース**: なし（Root）
- **状態**: `openId: string | null` (ビュアー対象) / `selectedTags: string[]`

### `useSettingsStore` (src/stores/settings-store.ts)
- **責務**: Settings 4 キーの保持・更新・永続化。Provider 不要のシングル hook 実装
- **依存**: `safe-storage.ts`, `src/types/settings.ts`
- **公開インターフェース**:
  ```ts
  export type Settings = {
    shelfVariant: 'A' | 'B';
    viewerVariant: 'A' | 'B';
    ruby: boolean;
    night: boolean;
  };
  export type SettingsKey = keyof Settings;

  export const SETTINGS_DEFAULTS: Settings;
  export function normalizeSettings(value: unknown): Settings; // whitelist 抽出

  export function useSettingsStore(): {
    settings: Settings;
    setSetting: <K extends SettingsKey>(key: K, value: Settings[K]) => void;
    reset: () => void;
  };
  ```
- **永続化キー**: `eh.settings`（v1）。**旧 `eh.tweaks` / `ehon.tweaks` / `ehon.tweaks.v2` は読まない・削除しない**
- **副作用（useEffect 3 本）**:
  - 書込: `settings` 変更時に `safe-storage.set('eh.settings', settings)`
  - night 同期: `document.documentElement.classList.toggle('night', settings.night)`
  - ruby 同期: `document.documentElement.classList.toggle('no-ruby', !settings.ruby)`

### `ruby-parser` (src/lib/ruby-parser.ts)
- **責務**: `桃太郎{ももたろう}` 形式を `<ruby><rb>桃太郎</rb><rt>ももたろう</rt></ruby>` に変換
- **依存**: なし（純関数）
- **公開インターフェース**:
  ```ts
  export type RubyToken = { type: 'plain'; text: string } | { type: 'ruby'; base: string; rt: string };
  export function parseRuby(input: string): RubyToken[];
  export function renderRuby(input: string): React.ReactNode;
  ```

### `useViewerNav` (src/hooks/useViewerNav.ts)
- **責務**: ビュアー内のページ送り・キーボードナビ・アニメーションロック
- **依存**: なし（React Hooks のみ）
- **公開インターフェース**:
  ```ts
  export function useViewerNav(totalPages: number, onClose: () => void): {
    pageIndex: number;          // 0=表紙, 1..N=本文
    total: number;              // totalPages + 1
    flipDir: 'next' | 'prev' | null;
    isFlipping: boolean;        // 500ms ロック中 true
    go: (delta: number) => void;
  };
  ```
- **キーボード**: `ArrowRight` → `go(1)`, `ArrowLeft` → `go(-1)`, `Escape` → `onClose()`
- **アニメーションロック**: `flippingRef` + `isFlipping` state で 500ms (`FLIP_LOCK_MS`) 間 `go` を抑制
- **RTL 化フェーズ (ADR-012) でも改変しない**: キーボードは OS 標準を維持し、進行方向 (`go(1)`) と矢印キーの対応 (→ = 次) は不変。RTL 反転は Viewer コンポーネント側の JSX / スワイプ / CSS のみで完結する

### スワイプジェスチャ統合（Phase 1 / ADR-010 → ADR-012 で方向反転）

ビュアー内のタッチスワイプは `react-swipeable` の `useSwipeable` フックを `ViewerA.tsx` / `ViewerB.tsx` 内で直接呼び出して実装する。新たな custom hook は導入せず、既存 `useViewerNav.go(±1)` を呼ぶ薄い接合層に留める。

#### 統合ポイントと既存抽象との関係

```mermaid
flowchart LR
  Touch[タッチイベント<br/>touchstart/move/end] --> Swipeable[useSwipeable<br/>react-swipeable]
  Swipeable -->|onSwipedRight (RTL)| GoNext["go(1)"]
  Swipeable -->|onSwipedLeft  (RTL)| GoPrev["go(-1)"]
  Keyboard[キーボード<br/>ArrowLeft/Right] --> GoPrev
  Keyboard --> GoNext
  Buttons[ナビボタン<br/>◀ / ▶] --> GoPrev
  Buttons --> GoNext
  GoNext --> Nav[useViewerNav<br/>flipDir / isFlipping<br/>FLIP_LOCK_MS=500ms]
  GoPrev --> Nav
  Nav --> Anim[CSS アニメ<br/>flipping-next / flipping-prev]
```

- スワイプ・キーボード・ボタンの 3 入力経路はすべて `useViewerNav.go(delta)` に集約される
- `isFlipping === true`（500ms ロック中）はスワイプ起因の `go` も既存ロジックで自動的に無視される
- スワイプ専用のロックや状態は導入しない
- **RTL 化（ADR-012）後**: スワイプ方向は `onSwipedRight → go(1)` / `onSwipedLeft → go(-1)` に反転。キーボード・ボタンの分岐は変更なし

#### 適用対象の DOM

- 装着先: ViewerA は `.book-a` を含むステージ要素、ViewerB は `.eh-viewer-stage` 等の本文表示エリア
- **`<ViewerBar>` には装着しない**: バー上のボタン（ふりがな・夜モード・閉じる）タップとスワイプの誤検知を避けるため、スワイプ検出を本文ステージのみに限定する
- **`<ruby>` 構造には影響を与えない**: `useSwipeable` はルート要素にイベントハンドラを束ねるだけで、子の DOM 構造（`<ruby><rb>...</rb><rt>...</rt></ruby>`）を改変しない

#### `useSwipeable` の設定値（RTL 反転後）

| オプション | 値 | 意図 |
|------------|---|------|
| `onSwipedLeft` | `() => go(-1)` | **左スワイプで前ページ**（右綴じ書籍として自然な操作 / ADR-012） |
| `onSwipedRight` | `() => go(1)` | **右スワイプで次ページ**（右綴じ書籍として自然な操作 / ADR-012） |
| `delta` | `50`（px） | analyst 推奨の閾値。誤動作・テキスト範囲選択との切り分けが安定する経験値 |
| `preventScrollOnSwipe` | `false` | テキストカード内の縦スクロールやネイティブのスクロールジェスチャを阻害しない |
| `trackMouse` | `false` | 本番ではマウスドラッグでページが動かないようにする（PC でデバッグしたいときのみ true に切替可） |
| `trackTouch` | `true`（デフォルト） | タッチデバイスでのみスワイプを有効化 |

#### reduced-motion / アクセシビリティ

- `prefers-reduced-motion: reduce` でも **スワイプ機能は維持** する（操作手段は失わない）
- アニメーション抑制は既存 CSS（`reduced-motion.css`）が `flipping-*` クラスのアニメを停止する形で対応済み。スワイプ起因か否かに関わらず同じパスで処理される
- キーボード操作（←/→ / Esc）と ◀/▶ ボタンは引き続き動作する（**スワイプは追加手段であり代替ではない**）
- スワイプは VoiceOver / NVDA など SR ユーザーの操作経路には影響しない

### ページめくりアニメ強化（Phase 2 / ADR-011）

紙の厚み・立体感を **CSS only で控えめに表現** する。React コンポーネントや hook は改変せず、既存キーフレームの拡張と親要素への `perspective` 付与で実現する。

#### スコープ（影響ファイル）

- `src/styles/ehon.css`
  - `.book-a` セレクタに `perspective: 1500px;` + `transform-style: preserve-3d;` を付与
  - `@keyframes flipNextLeft` / `flipPrevRight` に中間キー (`50%`) を追加し、めくり中に `box-shadow` を表示
  - `@keyframes flipNextRightFade` のフェード開始タイミングを `60% → 40%` に前倒し
  - `.book-b.flipping-*` 配下の easing を `ease` → `cubic-bezier(0.2, 0.8, 0.2, 1)` に統一（`slideInRight` / `slideInLeft` / `slideInRightCard` / `slideInLeftCard` の 4 適用箇所）
- `src/styles/reduced-motion.css` — **変更なし**（既存の `.book-a, .book-b { animation: none !important; }` が中間キー含むキーフレーム全体を停止するため）
- React コンポーネント (`ViewerA.tsx` / `ViewerB.tsx` / `useViewerNav.ts`) — **変更なし**

> **RTL 化（ADR-012）後の状態**: 上記キーフレーム名は **改名される**（`flipNextLeft` → `flipNextRight`、`flipPrevRight` → `flipPrevLeft`、`flipNextRightFade` → `flipNextLeftFade` 等）。中間キーの `box-shadow` 方向も `±20px` の符号を反転する。詳細は §3「ViewerA / ViewerB の RTL 化」節を参照。

#### 確定パラメータ（Phase 2 確定値、RTL 化後も維持）

| パラメータ | 確定値 | 根拠 |
|------------|--------|------|
| `perspective` (`.book-a`) | **`1500px`** | analyst 案を採用。900px〜1024px 幅の見開き要素に対し、視差 ≒ 35° 程度の自然な奥行きを与える |
| `transform-style` (`.book-a`) | **`preserve-3d`** | 子要素の `rotateY` を平面投影せず立体保持するため必須 |
| `box-shadow` (中間キー 50%) | **`±20px 0 30px rgba(0, 0, 0, 0.3)`** | analyst 案を採用。0.3 の不透明度は昼モード / 夜モードで識別可能 |
| ViewerB easing | **`cubic-bezier(0.2, 0.8, 0.2, 1)`** | Material Design "standard easing" 同等 |

### ViewerA / ViewerB の RTL 化（ADR-012 / 本フェーズ）

日本語の絵本伝統である **右綴じ書籍仕様** に整合させる。スワイプ方向・見開きレイアウト・めくりアニメ方向の 3 軸を反転し、キーボードは OS 標準の左右キー対応を **維持** する。本文の文字書記方向（横書き日本語）は変えない。

#### スコープ（影響ファイル）

| ファイル | 変更内容 |
|----------|----------|
| `src/components/viewers/ViewerA.tsx` | **JSX 順序変更**: `<div className="book-a-page right">` を先に、`<div className="book-a-page left">` を後に出力する。これにより SR の reading order が「右 (現在) → 左 (めくる先)」となり、右綴じの自然な順序になる。スワイプハンドラの `onSwipedLeft` / `onSwipedRight` を反転 (`-1` / `+1` を入れ替え) |
| `src/components/viewers/ViewerB.tsx` | スワイプハンドラの `onSwipedLeft` / `onSwipedRight` を反転（ViewerB は単一ページ表示のため JSX 順序は変更しない / ACR-6 操作一貫性のみ確保） |
| `src/styles/ehon.css` | `@keyframes flipNextLeft` → **`flipNextRight`** に **改名** + 回転方向反転（rotateY 符号反転）、`@keyframes flipPrevRight` → **`flipPrevLeft`** に改名 + 回転方向反転、`@keyframes flipNextRightFade` → **`flipNextLeftFade`** に改名（フェード対象が左ページに変わるため）、関連セレクタ (`.book-a.flipping-next .book-a-page.right` / `.left` 等) の対応を更新。`box-shadow` 中間キーの方向 (`±20px`) も反転 |
| `src/hooks/useViewerNav.ts` | **変更なし**（キーボードは OS 標準維持） |
| `src/styles/reduced-motion.css` | **変更なし**（既存の `.book-a, .book-b { animation: none !important; }` が改名後のキーフレームも停止する） |
| `tests/e2e/viewer-swipe.spec.ts` | 期待値を反転（左スワイプ→前 / 右スワイプ→次） |
| `tests/e2e/viewer-keyboard.spec.ts` | **変更なし**（OS 標準維持の検証として現行アサーションをそのまま利用） |
| `docs/SPEC.md` | UC-006 受入基準を新仕様に書き換え |
| `docs/UI_SPEC.md` | SCR-002 レイアウト記述・ジェスチャ表・Animations 表を更新 |

#### 確定パラメータ（architect 判断分）

| パラメータ | 確定値 | 根拠 |
|------------|--------|------|
| **JSX 実装方式** | **JSX 順序変更**（CSS `row-reverse` 不採用） | a11y reading order の観点で DOM 順序が SR の読み上げ順と一致するため。`row-reverse` は視覚は逆になるが DOM 順は維持されるため SR が「左ページ (めくる先) → 右ページ (現在)」と誤読する可能性がある。WCAG 1.3.2 Meaningful Sequence の観点でも DOM 順序の方が堅牢 |
| **CSS キーフレーム命名** | **改名**: `flipNextLeft` → `flipNextRight` / `flipPrevRight` → `flipPrevLeft` / `flipNextRightFade` → `flipNextLeftFade` | 維持案は名前と意味の乖離が長期保守で混乱を招く（R-022）。改名は git diff が大きくなるが、後続の Phase 3 でアニメ拡張する際の認知コストを下げる |
| **ViewerA 単独ページ配置** | **右側に表示**（左は空白） | 一般的な右綴じ書籍では 1 ページ目および奇数番目で終わる最終ページは右側に表示される（既存の左綴じ実装の対称形）。具体的には `pageIndex === 0` (表紙) と `pageIndex` が pages.length-1 で総数が奇数の場合、`book-a-page.right` のみをレンダリングし、`book-a-page.left` は空 div を維持してレイアウト崩れを防ぐ |
| **ViewerA `pages[i]` / `pages[i+1]` の使い分け** | RTL 化前: 左 = `pages[i]`(現在ページの絵) / 右 = `pages[i]`(現在ページの文)。RTL 化後: **右 = `pages[i]`(現在ページの絵)** / **左 = `pages[i]`(現在ページの文)** （※同一ページの絵と文を左右に振り分ける構造は維持。ページ単位の配置（`pages[i]` 自体）は変えず、絵と文の左右を入れ替える） | 設計メモ §6.1 の解釈 Z（ページ単位の左右入れ替え）を採用。`stories.ts` の Page 型は 1 ページ = (絵 + 文) なので、絵と文の左右配置入れ替えだけで右綴じ風に見える |
| **`box-shadow` 方向** | next（右ページがめくれる）の中間キー: **`+20px 0 30px rgba(0,0,0,0.3)`**（右に影が伸びる）、prev（左ページがめくれる）: **`-20px 0 30px rgba(0,0,0,0.3)`**（左に影が伸びる） | 物理的にめくられているページの背面側に影が落ちる方向に統一。Phase 2 の値（不透明度 0.3 / blur 30px）は維持 |

#### キーボード非反転の理由（ACR-4 / Rejected Alternative の記録）

- 子供向けプロダクトでは PC / タブレット OS 標準の挙動 (← = 戻る / → = 進む) からの逸脱は混乱を招く
- アクセシビリティガイドラインでも「進行方向 = →」が広く期待される標準
- 物理的な「右綴じ」は紙の物体としての方向であり、論理的なナビゲーション（時系列の順送り）とは独立して扱える
- スワイプは「物理的な紙をめくる」アナロジーが強いため右綴じに合わせる方が直感的、キーボードは「論理的な進む / 戻る」なので OS 標準維持が直感的、という二軸の使い分けで一貫性を確保

#### ViewerB 同期の理由（ACR-6）

- ViewerB は単一ページ表示で「綴じ」概念は弱い
- ただし ViewerA / ViewerB は同一ユーザーが切替えて使うため、**スワイプ方向だけは同期反転**（右 = 次）して操作の一貫性を保つ
- アニメ方向（`slideInRight` / `slideInLeft`）は「次ページが右から流入」の語感を保つため **変更しない**（必要なら Phase 3 で再評価）

#### 既存抽象との関係

- `useViewerNav` は不変。`go(±1)` の意味（+1 が「次」）も不変
- `useSwipeable` は引数オブジェクトのプロパティ値を入れ替えるだけで、ライブラリ自体の挙動には依存しない
- `<ruby>` / `<rt>` の DOM 構造に影響なし（R-005 維持）
- `prefers-reduced-motion: reduce` 対応は既存 CSS で網羅（ACR-9 / R-006）

### `IllustWithFallback` (src/components/common/IllustWithFallback.tsx)
- **責務**: 挿絵画像の表示と onError フォールバック
- **依存**: `illustration-path.ts`
- **挙動**:
  1. `<img src={illustrationPath(storyId, scene)} loading={eager ? 'eager' : 'lazy'} onError={...}>` を初期描画
  2. onError で `loaded === false` 状態に遷移し、`<div style="background: bgColor">` + 中央配置の絵文字 + `<span aria-hidden>{emoji}</span>` を表示

### `safe-storage` (src/lib/safe-storage.ts)
- **責務**: localStorage を安全に扱う（try/catch、in-memory fallback）

### `ShelfA` / `ShelfB` (src/components/shelves/*.tsx)
- **責務**: 本棚レイアウト 2 バリアント。タグフィルター結果で物語を表示

### `ViewerA` / `ViewerB` (src/components/viewers/*.tsx)
- **責務**: ビュアーレイアウト 2 バリアント。`useViewerNav` で状態管理し、`useSwipeable` でタッチスワイプを受け付ける
- **依存**: `useViewerNav`, `useSwipeable` (react-swipeable), `RubyText`, `IllustWithFallback`, `ViewerBar`, `CoverPage`
- **RTL 化 (ADR-012) で変更**:
  - ViewerA: JSX で `book-a-page.right` を先、`book-a-page.left` を後に出力。スワイプハンドラ反転
  - ViewerB: スワイプハンドラのみ反転

### `ViewerBar` (src/components/viewers/ViewerBar.tsx)
- **責務**: ビュアー上部のツールバー
- **RTL 化 (ADR-012) でも変更なし**

### `ErrorBoundary` (src/components/common/ErrorBoundary.tsx)
- **責務**: React クラッシュ時に本棚へ復帰可能にする（IR-008）

## 4. データモデル（実装レベル）

### `Story` 型 (src/types/story.ts)

```ts
export type Story = {
  id: string;
  title: string;
  titleRuby: string;
  author: string;
  origin: string;
  tags: string[];
  coverColor: string;
  coverAccent: string;
  spine: string;
  description: string;
  placeholderEmoji: string;
  pages: Page[];
};

export type Page = {
  scene: string;
  bg: string;
  text: string;
  ruby: string;
};
```

### `Settings` 型 (src/types/settings.ts) — Tweaks 完全削除版（4 フィールド）

```ts
export type Settings = {
  shelfVariant: 'A' | 'B';
  viewerVariant: 'A' | 'B';
  ruby: boolean;
  night: boolean;
};

export type SettingsKey = keyof Settings;

export const SETTINGS_DEFAULTS: Settings = {
  shelfVariant: 'A',
  viewerVariant: 'A',
  ruby: true,
  night: false,
};
```

#### 固定値（CSS 変数として `tokens.css` に直書き）

| CSS 変数 | 固定値 | 用途 |
|----------|--------|------|
| `--terracotta` | `#E07856` | アクセントカラー |
| `--font-body` | `'M PLUS Rounded 1c', system-ui, sans-serif` | 本文フォント |
| `--font-display` | `'M PLUS Rounded 1c', system-ui, sans-serif` | 見出しフォント |
| `--font-size-body` | `26px` | 本文文字サイズ |

### localStorage キー / 形式

- 新キー: `eh.settings`
- 値: `Settings` の JSON 文字列
- 復元時バリデーション: `normalizeSettings` が whitelist 方式で 4 キーのみを取り出す
- **旧キー `eh.tweaks` / `ehon.tweaks` / `ehon.tweaks.v2` は読まない・削除しない**

## 5. API 設計

該当なし（バックエンドなし）。

## 6. State Management Design

```mermaid
flowchart LR
  A[App] -->|calls| US[useSettingsStore]
  US -->|state| Settings[(settings state<br/>4 keys)]
  US -->|effect| LS[localStorage<br/>'eh.settings']
  US -->|effect| HtmlClass[document.documentElement<br/>.night / .no-ruby class]
  Settings -->|props| Shelf[ShelfA/ShelfB]
  Settings -->|props| Viewer[ViewerA/ViewerB]
  A -->|local state| OpenId[openId: string \| null]
  A -->|local state| Tags[selectedTags: string[]]
```

### 状態の所在

| 状態 | 所在 | 永続化 |
|------|------|--------|
| `settings` (4 キー) | `useSettingsStore` (`useState`) | localStorage `eh.settings` |
| `openId` | `App` の useState | URL クエリ（Could） |
| `selectedTags` | `App` の useState | しない |
| `pageIndex` / `flipDir` / `isFlipping` | `useViewerNav` の useState / useRef | しない |

## 7. 認証 / 認可

該当なし。

## 8. エラーハンドリング方針

### React コンポーネントクラッシュ
- `<ErrorBoundary>` でアプリ全体をラップ（IR-008）

### localStorage 失敗
- `safe-storage.ts` 経由で `try/catch`、失敗時は `console.warn` のみ

### 画像取得失敗
- `IllustWithFallback` の `onError` で fallback モードに遷移

### スワイプライブラリ取得失敗（Phase 1 追加）
- `react-swipeable` は通常の npm 依存として bundle に含まれるためランタイム取得失敗は発生しない
- 万が一フックがエラーをスローしても `<ErrorBoundary>` で捕捉され、ボタン / キーボードのナビは継続して動作する

### RTL 化フェーズで追加されるリスク
- 現状なし（JSX 順序変更・スワイプハンドラ値の入れ替え・CSS キーフレーム改名のみで、ランタイム例外を引き起こす新規コードパスはない）

## 9. テスト戦略

| Test Type | Tool | Coverage Target | Scope |
|-----------|------|-----------------|-------|
| Unit | Vitest + @testing-library/react | ≥ 80% (lines) | `lib/*`, `stores/settings-store.ts`, 主要コンポーネント |
| Integration | Vitest | — | App + Shelf + Viewer |
| E2E | Playwright | 主要動線 7 シナリオ | 本棚 / ビュアー / スワイプ / 永続化 / レスポンシブ |
| Accessibility | axe-core (Playwright) + 手動 | Lighthouse a11y ≥ 95 | 全画面 |

### RTL 化（ADR-012）に伴うテスト方針

- **`viewer-swipe.spec.ts`**: 期待値を反転
  - 「左スワイプ → 次ページ」を「右スワイプ → 次ページ」に
  - 「右スワイプ → 前ページ」を「左スワイプ → 前ページ」に
  - ViewerA / ViewerB の両セクションで対称に修正
- **`viewer-keyboard.spec.ts`**: **据え置き**（OS 標準維持の検証として現行アサーションをそのまま利用）
- **`home.spec.ts`**: 本棚 → ビュアー → 戻るのフローはキーボード / クリック主体のため変更不要
- **ViewerA unit テスト** (`tests/unit/ViewerA.test.tsx`): 既存に「左ページに絵が、右ページに文が表示される」等の DOM アサーションがある場合、左右を入れ替える形で更新
- **新規 a11y reading order テスト**: 余裕があれば「ViewerA で SR が右ページ → 左ページの順に読む（DOM 順序検証）」を 1 ケース追加検討（developer 任意 / 必須ではない）

### Phase 2 (CSS アニメ強化) に伴うテスト方針（既存）

- 新規 E2E は追加しない / 既存 E2E の維持 / 手動視覚レビュー / bundle size 計測

### Phase 1 (タッチスワイプ) に伴うテスト追加 / 修正（既存 / 完了済）

- 追加 E2E: `tests/e2e/viewer-swipe.spec.ts`（5 ケース）

### E2E テストポリシー（HAS_UI: true）

- **採用ツール**: Playwright
- **対象ブラウザ**: Chromium（必須）/ WebKit（iPad 検証必須）/ Firefox（任意）
- **実行モード**: ローカル開発時 headed、CI は headless
- **対象シナリオ**:
  1. `home.spec.ts`
  2. `viewer-keyboard.spec.ts`
  3. `viewer-swipe.spec.ts`
  4. `ruby-toggle.spec.ts`
  5. `persistence.spec.ts`
  6. `responsive-ipad.spec.ts`
  7. `image-fallback.spec.ts`

## 10. 実装順序 / 依存関係

> **RTL 化フェーズ — 本フェーズで対象**
>
> ブランチ: `feat/viewer-a-rtl` (main から切る。最初の implementation-tier agent (developer) が作成)
> 関連: `docs/design-notes/viewer-a-rtl.md`
> 対応 Issue: #8

```
RTL 化: ViewerA / ViewerB 右綴じ仕様
  └─ TASK-3-1: ViewerA.tsx の JSX で左右ページ表示順を入れ替え
                src/components/viewers/ViewerA.tsx
                - <div className="book-a-page right"> を先、 <div className="book-a-page left"> を後に出力
                - 中身（絵 = 現在ページ / 文 = 現在ページ）は同一ページの絵と文を左右逆に振り分ける
                - 単独ページ (pageIndex === 0 表紙、最終ページが奇数で終わる場合) は right のみ描画し left は空 div を維持
                (依存なし。最初に実行)
  └─ TASK-3-2: ViewerA.tsx のスワイプハンドラを反転
                src/components/viewers/ViewerA.tsx
                - useSwipeable({ onSwipedLeft: () => go(-1), onSwipedRight: () => go(1), ... })
                (TASK-3-1 後 / 並行可)
  └─ TASK-3-3: ViewerB.tsx のスワイプハンドラを反転
                src/components/viewers/ViewerB.tsx
                - useSwipeable({ onSwipedLeft: () => go(-1), onSwipedRight: () => go(1), ... })
                (TASK-3-1 / 3-2 と並行可)
  └─ TASK-3-4: ehon.css のキーフレームを RTL 仕様に改名 + 回転方向反転
                src/styles/ehon.css
                - @keyframes flipNextLeft → flipNextRight に改名 + rotateY 符号反転 + box-shadow 中間キー方向反転 (+20px 側へ)
                - @keyframes flipPrevRight → flipPrevLeft に改名 + rotateY 符号反転 + box-shadow 中間キー方向反転 (-20px 側へ)
                - @keyframes flipNextRightFade → flipNextLeftFade に改名（フェード対象が左ページに変わるため）
                - 関連セレクタ (.book-a.flipping-next .book-a-page.right / .left など) のページサイドと animation 名を整合させる
                - duration 0.55s / 中間キー 50% / 不透明度 0.3 / blur 30px は据え置き
                (TASK-3-1 / 3-2 / 3-3 と並行可だが、TASK-3-1 のセレクタ対応関係に依存する形でレビューが楽)
  └─ TASK-3-5: viewer-swipe.spec.ts の期待値を反転
                tests/e2e/viewer-swipe.spec.ts
                - ViewerA / ViewerB の左右スワイプアサーションを反転
                  - 左スワイプ (70px) → 前ページに戻る
                  - 右スワイプ (70px) → 次ページに進む
                - 短い / 縦 / 連続ケースは方向不依存だが、補助的にコメント文言を更新
                (TASK-3-2 / 3-3 後)
  └─ TASK-3-6: viewer-keyboard.spec.ts の確認（変更なし）
                tests/e2e/viewer-keyboard.spec.ts
                - キーボード ←/→ の方向は OS 標準維持なので **修正不要**
                - 既存ケースが緑のままであることを確認するのみ
                (TASK-3-2 / 3-3 後)
  └─ TASK-3-7: SPEC.md / UI_SPEC.md / ARCHITECTURE.md 更新
                docs/SPEC.md / docs/UI_SPEC.md
                - SPEC.md UC-006 受入基準: スワイプ方向を「右=次 / 左=前」に書き換え。見開き時の「右ページが現在 / 左ページがめくる先」を明記。キーボードは OS 標準維持を明記。Update history に 2026-05-05 行を追記
                - UI_SPEC.md SCR-002 Layout Structure (ViewerA): 左右セルの内容を入れ替え (右 = 絵 / 左 = 文)。Interactions 表のスワイプ方向を反転 (キーボード行は変更なし)。Animations 表のキーフレーム名を `flipNextRight` / `flipPrevLeft` / `flipNextLeftFade` に更新。Update history に 2026-05-05 行を追記
                - ARCHITECTURE.md: 本ファイル §3「ViewerA / ViewerB の RTL 化」節と ADR-012 が既に追記済。developer は **再編集不要**。コミット時にステージに含めるのみ
                - 詳細差分方針は本ファイル §10 末尾「SPEC.md / UI_SPEC.md 差分更新方針 (RTL)」を参照
                (TASK-3-1〜3-6 と並行可)
  └─ TASK-3-8: 検証
                - pnpm typecheck / pnpm lint / pnpm format:check / pnpm test 全 pass
                - pnpm test:e2e (主要シナリオ + 反転後 swipe / 据え置き keyboard) pass
                - pnpm build 成功 (バンドル増 0 kB を確認)
                - 手動視覚レビュー (昼/夜 × ViewerA/B × 次/前 = 8 パターン目視):
                  - ViewerA で右ページに現在の絵 / 左ページに現在の文が表示される
                  - 右スワイプで次ページへ進み、めくりアニメが右から左へ回転する
                  - 左スワイプで前ページへ戻り、めくりアニメが左から右へ回転する
                  - キーボード → で次 / ← で前（OS 標準維持）
                - prefers-reduced-motion: reduce 環境で全アニメが停止することを DevTools で確認
                (TASK-3-1〜3-7 後 / 最終)
```

> commit 粒度の目安:
> - `feat: ViewerA を右綴じ仕様に変更 (JSX 順序入替 + スワイプ反転 / TASK-3-1 / 3-2)`
> - `feat: ViewerB のスワイプを RTL に同期反転 (TASK-3-3)`
> - `style: ehon.css のめくりキーフレームを RTL 仕様に改名 + 反転 (TASK-3-4)`
> - `test: viewer-swipe.spec.ts の期待値を RTL 仕様に反転 (TASK-3-5)`
> - `docs: SPEC.md / UI_SPEC.md / ARCHITECTURE.md に ViewerA RTL 化を反映 (TASK-3-7)`
>
> ※ TASK-3-6 / 3-8 は実装変更なしのため commit を独立させる必要なし。

### SPEC.md 差分更新方針（RTL / TASK-3-7 委譲分）

| 節 | 変更内容 |
|----|----------|
| Update history | `2026-05-05: ViewerA / ViewerB の RTL 化 (developer / UC-006 受入基準のスワイプ方向を反転、見開きレイアウト記述を右綴じ仕様に / キーボード ←/→ は OS 標準維持 / バンドル増 0 kB)` を追記 |
| 4. UC-006 正常フロー | 「ナビボタン（◀ / ▶, 56px 円形）/ キーボード（←/→）/ タッチスワイプ (左/右) で送る」を「ナビボタン（◀ / ▶）/ キーボード（←/→ は OS 標準: ← で前, → で次）/ タッチスワイプ（**右で次 / 左で前**, 右綴じ仕様）で送る」に書き換え |
| 4. UC-006 受入基準 | 既存「50px 以上の左/右スワイプで前/次ページに遷移する」を「50px 以上の **右スワイプで次ページ、左スワイプで前ページ**に遷移する（右綴じ仕様 / ADR-012）」に書き換え。新規追加: 「ViewerA の見開きで、**右ページが現在ページの絵、左ページが現在ページの文**として配置される（解釈 Z）」「キーボード ←/→ は OS 標準を維持し、← で前 / → で次のまま変更しない」「単独ページ（表紙および奇数番目で終わる最終ページ）は右側に表示され、左側は空白」「ViewerB のスワイプ方向も同期反転される（操作の一貫性）」 |
| 11. 受入条件サマリー | 「(2026-05-05 追加) ViewerA / ViewerB が右綴じ書籍仕様で動作する（スワイプ右=次, 左=前 / キーボードは OS 標準維持）」を追記 |

> **注意**: SCR-001 / 1.Scope (IN) / Tech Stack 節 / 物語データ・固定値節は **変更しない**。

### UI_SPEC.md 差分更新方針（RTL / TASK-3-7 委譲分）

| 節 | 変更内容 |
|----|----------|
| Update history | `2026-05-05: ViewerA / ViewerB の RTL 化 (developer / SCR-002 ViewerA レイアウト記述を右綴じに、Interactions 表のスワイプ方向を反転、Animations 表のキーフレーム名を flipNextRight / flipPrevLeft / flipNextLeftFade に更新、キーボード行は変更なし)` を追記 |
| 4. SCR-002 Layout Structure (ViewerA: 見開き) | アスキーアートの左右セル内容を入れ替え: 「(左:絵) / (右:本文)」を「**(右:絵) / (左:本文)**」に。図中コメントに「右綴じ仕様: 右ページが現在ページの絵、左ページが現在ページの文 (ADR-012)」を追記 |
| 4. SCR-002 Interactions | スワイプ方向行を以下に書き換え:<br/>- 「▶ ボタン / → キー / 左スワイプ (タッチ)」→ 「▶ ボタン / → キー / **右スワイプ** (タッチ)」<br/>- 「◀ ボタン / ← キー / 右スワイプ (タッチ)」→ 「◀ ボタン / ← キー / **左スワイプ** (タッチ)」<br/>備考列に「キーボード ←/→ は OS 標準維持 (ACR-4 / ADR-012)」を追記 |
| 7. Accessibility (SCR-002) | 「ナビボタン: `aria-label="まえのページ" / "つぎのページ"`」の記述は変更なし。新規追加: 「右綴じ仕様により、ViewerA の見開きでは DOM 順序が `right` ページ → `left` ページの順となり、SR の reading order と一致する (WCAG 1.3.2 / ADR-012)」を共通項目末尾に追記 |
| 8. Animations / Transitions（表） | キーフレーム名を更新:<br/>- `flipNextLeft` → **`flipNextRight`** (回転方向反転、box-shadow 中間キー +20px 側へ反転)<br/>- `flipPrevRight` → **`flipPrevLeft`** (回転方向反転、box-shadow 中間キー -20px 側へ反転)<br/>- `flipNextRightFade` → **`flipNextLeftFade`** (フェード対象が左ページに変更)<br/>duration / easing / 中間キー位置 50% / 不透明度 0.3 / blur 30px / `cubic-bezier(0.2, 0.8, 0.2, 1)` などの値は据え置き |

> **注意**: トークン表 / レスポンシブ / Screen List / Component Details (ViewerBar / ProgressBar 等) は **変更しない**。RTL 化はビュアー内の方向反転のみで、UI 全体構造は変わらない。

## 11. 環境 / 設定

### 環境変数（MVP では基本ゼロ）

- `VITE_OG_IMAGE_URL`（任意）

### 設定ファイル

| File | 役割 | 担当 |
|------|------|------|
| `package.json` | 依存・スクリプト（**RTL 化フェーズで追加なし**） | scaffolder / developer |
| `pnpm-lock.yaml` | ロック | developer |
| `tsconfig.json` | TS 設定 (strict, jsx: react-jsx) | scaffolder |
| `tsconfig.node.json` | vite.config 用 | scaffolder |
| `vite.config.ts` | Vite 設定 | scaffolder |
| `vitest.config.ts` | Vitest 設定 (jsdom) | scaffolder |
| `playwright.config.ts` | Playwright 設定 (Chromium / WebKit, iPad プロファイル) | test-designer |
| `.eslintrc.cjs` | ESLint | scaffolder |
| `.prettierrc` | Prettier | scaffolder |
| `.gitignore` | git 除外 | scaffolder |
| `index.html` | Vite エントリ HTML | scaffolder |
| `vercel.json` | SPA リライト | Operations Flow `infra-builder` |

## 12. 既知のリスクと緩和策

| Risk | Impact | Mitigation |
|------|--------|------------|
| R-001: 夜モード `--mustard` のコントラスト 4.5:1 未達 | medium | 実装後 axe-core で実測 |
| R-002: Google Fonts 取得失敗時のレイアウトずれ | low | `font-display: swap` + system フォールバック |
| R-003: localStorage 利用不可でアプリ停止 | medium | `safe-storage.ts` で try/catch + in-memory fallback |
| R-004: iPad Safari `100vh` ずれ | medium | `100dvh` 採用、Playwright iPad プロファイル E2E |
| R-005: ふりがな ON/OFF の SR 揺れ | low | DOM 構造維持、`<rt> { display: none }` のみで切替 |
| R-006: アニメーション過多 | medium | `prefers-reduced-motion: reduce` で全アニメ停止 |
| R-007: 著作権表記 | low | フッター明記 |
| R-008: Vercel Vite 設定漏れ | low | `vercel.json` SPA リライトを Operations で必須整備 |
| R-009: モック資産が本番ビルドに混入 | low | `tsconfig exclude: ['mock']` |
| R-010: スマホレスポンシブ後戻り | medium | モック既存メディアクエリ踏襲、E2E iPhone プロファイル |
| R-011: 挿絵未配置で見栄え悪化 | medium | `IllustWithFallback` でフォールバック |
| R-012: 挿絵画像のサイズ過大で LCP 未達 | medium | 表紙のみ `loading="eager"`、シーンは `lazy` |
| R-013: 著作権上問題のある画像混入 | high | doc-writer / Operations Flow で `LICENSE-illustrations.md` 雛形整備 |
| R-014: 26px 固定でスマホで改行頻度上昇 | low-medium | 実機 / Playwright 確認、必要時 `clamp()` 検討 |
| R-015: 古い localStorage キー残存 | low | `normalizeSettings` の whitelist 方式で黙殺 |
| R-016: 旧 `eh.tweaks` キーがユーザー端末に残留 | very-low | 害なし。クリーンアップは行わない |
| R-017: useSettingsStore 多重インスタンスで state が分裂 | low | `App` 1 箇所のみ呼び出し props 配布で運用 |
| R-018: タッチスワイプが ViewerBar のボタンタップと衝突する | medium | `useSwipeable` の装着先を ViewerBar から外し、本文ステージ (`.eh-viewer-stage` 相当) のみに限定する（ADR-010 / Phase 1） |
| R-019: タッチスワイプが `<ruby>` 内のテキスト範囲選択や縦スクロールを阻害する | medium-low | `preventScrollOnSwipe: false` を明示し、縦方向はネイティブのスクロールに任せる。`delta=50` で短いタップ・長押しは反応しない（ADR-010） |
| R-020: react-swipeable のメンテナンス停滞 / 後継ライブラリ未対応 | low | 採用時点 (2026-05-06) で週 DL 100 万超、最終リリース 1 年以内、React 18 互換確認済み（ADR-010） |
| R-021: `perspective` 値 1500px が端末サイズで歪んで見える / 中間キー影が夜モードで見えにくい | medium-low | 手動視覚レビュー（昼/夜 × ViewerA/B × 次/前 = 8 パターン）で確認。歪みが強い端末があれば `clamp()` 等の動的指定を Phase 3 で再評価（ADR-011 / Phase 2） |
| **R-022: キーボード方向 (← で前 / → で次) とスワイプ方向 (右で次 / 左で前) の不一致がユーザーに混乱を招く** | **medium** | **二軸の意味分離を明示する: スワイプは「物理的な紙をめくる」アナロジー、キーボードは「論理的な進む / 戻る」を OS 標準で表現。ACR-4 として SPEC.md に固定し、ユーザー教育（保護者向け README / アプリ内ヘルプ）で補足。手動視覚レビュー時に違和感がないかをオーナーが最終確認する（ADR-012 / RTL）** |
| **R-023: ViewerA の JSX 順序変更で SR の reading order が想定外に変わる / 既存 unit テストの DOM 順序アサーションが破綻する** | **medium-low** | **JSX 順序変更（CSS `row-reverse` 不採用）を採用したのは reading order を意図通り「右ページ (現在) → 左ページ (めくる先)」に揃えるため（WCAG 1.3.2）。既存 unit テスト (`tests/unit/ViewerA.test.tsx`) に「左ページに絵」「右ページに文」の DOM アサーションがある場合は左右を入れ替える形で更新する。VoiceOver / NVDA での動作確認は手動視覚レビュー時にあわせて実施（ADR-012 / RTL）** |
| **R-024: CSS キーフレーム名を改名する diff が大きく、Phase 2 マージ直後の git history と衝突する** | **low** | **PR を独立させ、Phase 2 (PR #9) マージ後にこの PR を main から切ることで履歴の交差を避ける（ADR-012 / RTL / 設計メモ §7）。改名のみで意味の追跡が容易になり、Phase 3 以降の保守性が向上する** |

## 13. Architecture Decision Records (ADR)

### ADR-001 〜 ADR-011

（既存のまま。詳細は本ファイル直前のリビジョンを参照）

> ADR-001 (Context + useReducer 採用) は ADR-009 により上書きされた。
> ADR-008 (Tweaks 本番固定化) → ADR-009 (Tweaks 完全削除) → ADR-010 (タッチスワイプ採用 / Phase 1) → ADR-011 (ページめくりアニメ強化 / Phase 2) → ADR-012 (ViewerA / ViewerB の RTL 化) と進行。

### ADR-012: ViewerA / ViewerB を右綴じ書籍仕様に変更（スワイプ方向 + 見開きレイアウト + アニメ方向反転、キーボードは OS 標準維持）

- **Context**:
  - 「えほんやさん」は日本語の絵本アプリで、日本語書籍の伝統的な綴じ方は **右綴じ**（右ページから左ページへ読み進める）
  - 現状の ViewerA は左綴じ前提で実装されており、左ページ = 絵 / 右ページ = 文、左スワイプ = 次、めくりアニメも左から右へという欧文書籍仕様だった
  - オーナーから 2026-05-05 に「ViewerA を右綴じ仕様に変更してほしい」と依頼。analyst が `docs/design-notes/viewer-a-rtl.md` で背景・現状・推奨アプローチをまとめ、ユーザー確定事項として以下が固まった:
    - スワイプは反転（右で次 / 左で前）
    - キーボード ←/→ は **OS 標準を維持**（← で前 / → で次）
    - めくりアニメも反転
    - ViewerB は単独ページ表示だが操作の一貫性のためスワイプのみ同期反転
    - 解釈 Z（ページ単位の左右入れ替え）を採用
    - Phase 2 (PR #9 / アニメ強化) マージ後の独立 PR として進行
- **Decision**:
  - **JSX 順序変更で実装する**（CSS `row-reverse` は不採用）。`ViewerA.tsx` 内で `<div className="book-a-page right">` を先に、`<div className="book-a-page left">` を後に出力し、SR の reading order を「右 → 左」に整える
  - **スワイプハンドラを反転**: `useSwipeable({ onSwipedLeft: () => go(-1), onSwipedRight: () => go(1), ... })`。ViewerA / ViewerB 両方で同じ反転を適用
  - **キーボードは改変しない**: `useViewerNav.ts` の `ArrowRight → go(1)` / `ArrowLeft → go(-1)` を維持
  - **CSS キーフレームを改名**: `flipNextLeft` → `flipNextRight`、`flipPrevRight` → `flipPrevLeft`、`flipNextRightFade` → `flipNextLeftFade`。回転方向（rotateY 符号）と box-shadow 中間キー（±20px の方向）も対応して反転する
  - **duration / easing / 不透明度 / blur は据え置き**（Phase 2 で確定した値を維持）
  - **`useViewerNav` は不変**: `go(±1)` の意味（+1 が「次」）は変えない。RTL 反転は Viewer コンポーネント側で完結
  - **単独ページ配置**: 表紙（pageIndex === 0）および総数が奇数で終わる最終ページは `book-a-page.right` のみ描画し、`book-a-page.left` は空 div としてレイアウトを維持
- **Rationale**:
  - **JSX 順序変更が a11y 観点で堅牢**: CSS `row-reverse` だと視覚は逆になるが DOM 順は維持されるため、SR が「左 (めくる先) → 右 (現在)」と誤読する可能性がある（WCAG 1.3.2 Meaningful Sequence）。JSX 順序変更なら DOM 順 = SR 読み上げ順 = 視覚順が一致する
  - **キーボード非反転の妥当性**: 子供向けプロダクトで OS 標準（→ = 進む）からの逸脱は混乱を招く。物理的な「右綴じ」（紙の方向）と論理的なナビゲーション（時系列）を二軸で分離することで、両方のメンタルモデルを破壊せずに統合できる
  - **CSS キーフレーム改名の妥当性**: 「flipNextLeft」という名前で右ページがめくれる動きを表現するのは長期保守で混乱の元（R-022 派生リスク）。意味と名前が一致した状態を保つ方が後続フェーズの認知コストが下がる
  - **ViewerB スワイプ同期の妥当性**: ViewerB は単一ページ表示だが、ユーザーは ViewerA / ViewerB を切り替えて使うため、スワイプ方向だけは同期させる方が学習負荷が低い。アニメ方向（slideInRight 等）は「次ページが右から流入」の語感を保つため変更しない
  - **解釈 Z の妥当性**: `stories.ts` の Page 型は 1 ページ = (絵 + 文) のセットで、`pageIndex` が 1 ずつ進む。見開き表示は同一ページの絵と文を左右に振り分けているだけなので、左右配置の入れ替え（解釈 Z）が最も実装が素直で副作用が少ない
  - **バンドル影響ゼロ**: ライブラリ追加なし、JSX 順序変更とスワイプ引数の入れ替えと CSS キーフレーム改名のみ
- **Rejected Alternatives**:
  - **CSS `row-reverse` で実装**: 視覚は逆になるが DOM 順序は維持されるため SR 互換性が低下する（R-023）。a11y 観点で却下
  - **キーボード方向も反転（← で次 / → で前）**: 子供向けプロダクトで OS 標準を破る判断は a11y / ユーザー混乱の両面でリスクが大きい。analyst の §6.4 でも明確に却下。物理綴じ方向と論理進行方向を一致させる必要はない（R-022 の意味分離で対応）
  - **キーフレーム名を維持して中身だけ反転**: 名前と意味の乖離が長期保守でバグの温床になる。git diff は小さくなるが、Phase 3 以降の認知コストで損する
  - **ViewerB を反転しない**: スワイプ方向の不一致が ViewerA / ViewerB 切替時に混乱を招く。ACR-6 として一貫性を担保
  - **`direction: rtl` を全体適用**: 本文の文字書記方向（横書き日本語）を変える必要はなく、ふりがな・夜モード等のトグル UI 配置にも影響が及ぶ。スコープが過大で本 Issue の趣旨を超える
  - **同 PR で Phase 2 のキーフレーム改名を含める**: Phase 2 (PR #9) は既にマージ済。本 PR は独立してマージし、衝突を回避（R-024）
- **Phase 3 での見直し方針**:
  - R-022（キーボードとスワイプの方向不一致）が現実化（ユーザーから複数のフィードバックで混乱が報告される）した場合は、ヘルプ画面 / 初回チュートリアルで二軸の意味分離を可視化する施策を検討
  - drag-to-flip を導入する場合（ADR-010 Phase 2 見直し方針も参照）は、本フェーズで確定した RTL 方向のままジェスチャ進行率に連動させる

---

## AGENT_RESULT

```
AGENT_RESULT: architect
STATUS: success
ARTIFACTS:
  - docs/ARCHITECTURE.md
  - docs/TASK.md
TECH_STACK: TypeScript 5, React 18, Vite 5, pnpm 9, Vitest 1, Playwright 1.44, ESLint 8, Prettier 3, react-swipeable 7
TECH_STACK_CHANGED: false
PHASES: 1
TASKS: 8
NEXT: developer
```
