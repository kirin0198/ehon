# Architecture Design: えほんやさん（Ehon）

> Source: SPEC.md (2026-05-04 / Tweaks 縮小版)
> Source: UI_SPEC.md (2026-05-04 / Tweaks 縮小版)
> Source: DISCOVERY_RESULT.md (2026-05-04) / project-rules.md (2026-05-04)
> Source: docs/design-notes/tweaks-simplification.md (2026-05-04)
> Created: 2026-05-04
> Last updated: 2026-05-04
> Update history:
>   - 2026-05-04: Initial draft (architect / Delivery Flow Light プラン)
>   - 2026-05-04: Tweaks 機能の本番固定化 (architect / Tweaks 型を 4 フィールドに縮小、CSS 変数同期 useEffect を 2 本削減、ADR-008 追記、実装順序を Phase A〜E に再構成)

## 1. アーキテクチャ概要

### システム図

```mermaid
flowchart TB
  subgraph Browser[Webブラウザ]
    direction TB
    UI[React Tree<br/>App → Shelf/Viewer/TweaksPanel]
    Store[(Tweaks Context<br/>+ useReducer)]
    LS[(localStorage<br/>key: eh.tweaks)]
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
- 状態は React Context + useReducer + localStorage に閉じる
- 物語データはビルド時静的、挿絵は `public/illustrations/` 配下に静的配置 + フォールバック

### 採用アーキテクチャパターン

- **コンポーネント駆動 UI + Custom Hooks + Context Provider**
  - `App` がルート、`TweaksProvider` で全画面を包む
  - 本棚 / ビュアー切替は `tweaks.shelfVariant` / `tweaks.viewerVariant` を見て分岐レンダ
  - キーボード・ページ送り等の振舞いは Custom Hook (`useViewerNav` 等) に切り出し
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
| 状態管理 | React Context + useReducer | (内蔵) | Tweaks 1 ストアのみ。Zustand 不要 |
| ふりがな処理 | 自前パーサ | — | `桃太郎{ももたろう}` 記法。外部依存ゼロ |
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

> **追加候補は最小化**:
> - i18n / Routing / 状態管理ライブラリは導入しない (MVP 不要)
> - フォントは Google Fonts URL 直参照（`<link>`）。本番固定化に伴い M PLUS Rounded 1c のみを残し、その他のフォント `<link>` は `index.html` から除去する（ADR-008）
> - Markdown / 画像処理ライブラリは MVP 不要

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
│   ├── App.tsx                        # ルートコンポーネント
│   ├── components/
│   │   ├── shelves/
│   │   │   ├── ShelfA.tsx             # 立てかけ書架
│   │   │   ├── ShelfB.tsx             # 表紙ならべ
│   │   │   ├── ShelfSwitcher.tsx
│   │   │   └── TagFilter.tsx
│   │   ├── viewers/
│   │   │   ├── ViewerA.tsx            # 見開き
│   │   │   ├── ViewerB.tsx            # 全画面背景
│   │   │   ├── ViewerBar.tsx          # 上部ツールバー（± ボタン削除済）
│   │   │   ├── CoverPage.tsx          # 表紙ページ（共通）
│   │   │   └── PageNumber.tsx
│   │   ├── tweaks/
│   │   │   ├── TweaksLauncher.tsx     # 右下 ⚙ ボタン
│   │   │   ├── TweaksPanel.tsx        # パネル本体（2 セクション・4 操作）
│   │   │   ├── TweakSection.tsx
│   │   │   ├── TweakRadio.tsx
│   │   │   └── TweakToggle.tsx
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
│   │   ├── tweaks-context.tsx         # Context + Provider（CSS 変数同期は night/ruby のみ）
│   │   ├── tweaks-reducer.ts          # useReducer 本体
│   │   └── tweaks-defaults.ts         # TWEAK_DEFAULTS（4 フィールド）
│   ├── data/
│   │   └── stories.ts                 # 6 作品の物語データ + 型
│   ├── styles/
│   │   ├── tokens.css                 # CSS 変数（モック由来 + 固定値の直書き）
│   │   ├── global.css                 # html/body リセット + ruby
│   │   ├── ehon.css                   # モック CSS 移植（components 横断）
│   │   └── reduced-motion.css         # prefers-reduced-motion
│   └── types/
│       ├── story.ts                   # Story / Page 型
│       └── tweaks.ts                  # Tweaks / TweakKey 型（4 フィールド）
├── tests/
│   ├── unit/
│   │   ├── ruby-parser.test.ts
│   │   ├── tweaks-reducer.test.ts
│   │   ├── illustration-path.test.ts
│   │   ├── safe-storage.test.ts
│   │   ├── ShelfA.test.tsx
│   │   ├── ShelfB.test.tsx
│   │   ├── ViewerA.test.tsx
│   │   ├── ViewerB.test.tsx
│   │   ├── TagFilter.test.tsx
│   │   └── TweaksPanel.test.tsx
│   └── e2e/
│       ├── home.spec.ts               # 本棚 → ビュアー → 戻る
│       ├── viewer-keyboard.spec.ts    # キーボード完結
│       ├── ruby-toggle.spec.ts        # ふりがな切替
│       ├── persistence.spec.ts        # localStorage 永続化（4 キー対象）
│       ├── responsive-ipad.spec.ts    # iPad プロファイル
│       └── image-fallback.spec.ts     # 画像不在シナリオ
├── docs/                              # Aphelion 成果物（既存）
├── mock/                              # 既存モック退避（scaffolder で移動）
│   ├── Ehon.html
│   ├── app.jsx
│   ├── tweaks-panel.jsx
│   ├── components/
│   ├── data/
│   ├── styles/
│   └── README.md
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
> **本番固定化に伴う削除ファイル**: `src/components/tweaks/TweakColor.tsx` / `TweakSelect.tsx` / `TweakSlider.tsx` / `src/lib/accent-presets.ts` / `src/lib/font-presets.ts` の 5 ファイルは削除（ADR-008 / Phase C）。

## 3. モジュール設計

### `App` (src/App.tsx)
- **責務**: 全アプリのルート。`TweaksProvider` と `ErrorBoundary` でラップ。本棚 / ビュアー / Tweaks パネルの表示制御
- **依存**: `TweaksProvider`, `ShelfA`, `ShelfB`, `ViewerA`, `ViewerB`, `TweaksPanel`, `useTweaks`
- **公開インターフェース**: なし（Root）
- **状態**: `openId: string | null` (ビュアー対象), `tweaksOpen: boolean`

### `TweaksProvider` (src/stores/tweaks-context.tsx)
- **責務**: Tweaks の Context + 永続化。`useReducer` で更新、`useEffect` で localStorage 同期
- **依存**: `tweaks-reducer.ts`, `tweaks-defaults.ts`, `safe-storage.ts`
- **公開インターフェース**:
  - Hook: `useTweaks(): { tweaks: Tweaks; setTweak: <K extends TweakKey>(k: K, v: Tweaks[K]) => void; reset: () => void }`
  - Provider: `<TweaksProvider>{children}</TweaksProvider>`
- **副作用（2 本のみ。本番固定化により `accent` / `font` 同期は廃止）**:
  - `useEffect`: `tweaks.night` 更新時に `document.documentElement.classList.toggle('night', night)` を反映
  - `useEffect`: `tweaks.ruby` 更新時に `document.documentElement.classList.toggle('no-ruby', !ruby)` を反映
  - `useEffect`: 永続化キー `eh.tweaks` で `safe-storage.set` を呼出（書込専用 effect）

> 注: アクセントカラー (`--terracotta`) と本文/見出しフォント (`--font-body` / `--font-display`) は `tokens.css` の `:root` で固定値を宣言する。Provider からのランタイム書換は行わない（ADR-008）。

### `ruby-parser` (src/lib/ruby-parser.ts)
- **責務**: `桃太郎{ももたろう}` 形式を `<ruby><rb>桃太郎</rb><rt>ももたろう</rt></ruby>` に変換
- **依存**: なし（純関数）
- **公開インターフェース**:
  ```ts
  export type RubyToken = { type: 'plain'; text: string } | { type: 'ruby'; base: string; rt: string };
  export function parseRuby(input: string): RubyToken[];
  export function renderRuby(input: string): React.ReactNode; // JSX 配列を返す
  ```
- **入力規則**:
  - 直前の文字列が漢字 (`[一-鿿々ヶ]+`) で、その直後に `{ひらがな or カタカナ}` が続く場合に ruby 化
  - 不正記法 (`{ }` 単体、ネスト) はそのままプレーン文字として残す（ふりがなバリデーション Lint は TBD-006）

### `useViewerNav` (src/hooks/useViewerNav.ts)
- **責務**: ビュアー内のページ送り・キーボードナビ・アニメーションロック
- **依存**: なし（React Hooks のみ）
- **公開インターフェース**:
  ```ts
  export function useViewerNav(totalPages: number, onClose: () => void): {
    pageIndex: number;          // 0=表紙, 1..N=本文
    total: number;              // totalPages + 1
    flipDir: 'next' | 'prev' | null;
    go: (delta: number) => void;
  };
  ```
- **キーボード**: `ArrowRight` → `go(1)`, `ArrowLeft` → `go(-1)`, `Escape` → `onClose()`
- **アニメーションロック**: `flippingRef` で 500ms 間 `go` を抑制（モック踏襲）

### `IllustWithFallback` (src/components/common/IllustWithFallback.tsx)
- **責務**: 挿絵画像の表示と onError フォールバック
- **依存**: `illustration-path.ts`
- **Props**:
  ```ts
  type Props = {
    storyId: string;
    scene: string;          // 'cover' or page.scene
    placeholderEmoji: string;
    bgColor: string;        // フォールバック背景
    eager?: boolean;        // 表紙のみ true
    alt: string;            // 物語タイトル等
    className?: string;
  };
  ```
- **挙動**:
  1. `<img src={illustrationPath(storyId, scene)} loading={eager ? 'eager' : 'lazy'} onError={...}>` を初期描画
  2. onError で `loaded === false` 状態に遷移し、`<div style="background: bgColor">` + 中央配置の絵文字 + アクセシブルな `<span aria-hidden>{emoji}</span>` を表示
  3. プレースホルダ表示時はスクリーンリーダー向けに `alt` テキストを補助テキストで提供

### `safe-storage` (src/lib/safe-storage.ts)
- **責務**: localStorage を安全に扱う（try/catch、in-memory fallback）
- **依存**: なし
- **公開インターフェース**:
  ```ts
  export function get<T>(key: string, fallback: T): T;
  export function set<T>(key: string, value: T): void;  // 失敗時 console.warn のみ
  ```
- **実装ノート**:
  - `set` 失敗時は `console.warn('[ehon] localStorage write failed', e)` のみで例外を上に投げない（IR-002 / R-003）
  - SSR 環境（Vercel build）で `window` 不在時もガード

### `ShelfA` / `ShelfB` (src/components/shelves/*.tsx)
- **責務**: 本棚レイアウト 2 バリアント。タグフィルター結果で物語を表示
- **依存**: `TagFilter`, `ShelfSwitcher`, `Story` 型, `IllustWithFallback`（ShelfB のみ表紙画像）
- **Props**:
  ```ts
  type ShelfProps = {
    stories: Story[];
    onOpen: (id: string) => void;
    onAddStory?: () => void; // MVP では使わない（LLM 削除）。型は残すが未使用
    night: boolean;
    shelfVariant: 'A' | 'B';
    setShelfVariant: (v: 'A' | 'B') => void;
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;
  };
  ```

### `ViewerA` / `ViewerB` (src/components/viewers/*.tsx)
- **責務**: ビュアーレイアウト 2 バリアント。`useViewerNav` で状態管理
- **依存**: `useViewerNav`, `RubyText`, `IllustWithFallback`, `ViewerBar`, `CoverPage`
- **Props**（本番固定化により `fontSize` / `setFontSize` は削除済み）:
  ```ts
  type ViewerProps = {
    story: Story;
    onClose: () => void;
    settings: { ruby: boolean; night: boolean };
    setSetting: <K extends keyof Tweaks>(k: K, v: Tweaks[K]) => void;
    variant: 'A' | 'B';
    setVariant: (v: 'A' | 'B') => void;
  };
  ```
- 本文サイズは `tokens.css` の `--font-size-body: 26px` を CSS で参照（props 経由しない）

### `ViewerBar` (src/components/viewers/ViewerBar.tsx)
- **責務**: ビュアー上部のツールバー。ふりがな / 夜モード / バリアント切替 / 閉じる ボタンを提供
- **本番固定化に伴う削除**: 「あ-」「あ+」ボタンと現在値表示（fontSize 操作）を撤去
- **Props**: `ruby`, `night`, `variant`, `onToggleRuby`, `onToggleNight`, `onSwitchVariant`, `onClose`

### `TweaksPanel` (src/components/tweaks/TweaksPanel.tsx)
- **責務**: 設定パネルのコンテナ。子要素 `<TweakSection>` に分配。本番固定化により 2 セクション・4 操作のみ
  - 「レイアウト」セクション: 本棚バリアント (A/B), ビュアーバリアント (A/B)
  - 「よみやすさ」セクション: ふりがな ON/OFF, 夜モード ON/OFF
- **依存**: `useTweaks`, `TweakRadio`, `TweakToggle`（`TweakColor` / `TweakSelect` / `TweakSlider` は削除）
- **Props**: `open: boolean`, `onClose: () => void`

### `ErrorBoundary` (src/components/common/ErrorBoundary.tsx)
- **責務**: React クラッシュ時に本棚へ復帰可能にする（IR-008）
- **挙動**: `componentDidCatch` で Tweaks をリセットせず、`{children}` を fallback UI に置換し「ホームへもどる」ボタンを提供

## 4. データモデル（実装レベル）

### `Story` 型 (src/types/story.ts)

```ts
export type Story = {
  id: string;
  title: string;
  titleRuby: string;          // ruby 記法付き
  author: string;             // 「グリム童話」「日本昔話」
  origin: string;
  tags: string[];
  coverColor: string;         // CSS color
  coverAccent: string;
  spine: string;
  description: string;
  placeholderEmoji: string;
  pages: Page[];
};

export type Page = {
  scene: string;              // 例: 'forest-girl'。ファイル名キー
  bg: string;                 // CSS color
  text: string;               // プレーン
  ruby: string;               // ruby 記法付き
};
```

`src/data/stories.ts` は `export const STORIES: readonly Story[] = [...]` で 6 作品をエクスポート。

### `Tweaks` 型 (src/types/tweaks.ts) — 本番固定化版（4 フィールド）

```ts
export type Tweaks = {
  shelfVariant: 'A' | 'B';
  viewerVariant: 'A' | 'B';
  ruby: boolean;
  night: boolean;
};

export type TweakKey = keyof Tweaks;

export const TWEAK_DEFAULTS: Tweaks = {
  shelfVariant: 'A',
  viewerVariant: 'A',
  ruby: true,
  night: false,
};
```

> 既定値表（4 行）:
>
> | Key | 既定値 | 操作 UI |
> |-----|--------|---------|
> | `shelfVariant` | `'A'` (立てかけ書架) | TweaksPanel / ShelfSwitcher |
> | `viewerVariant` | `'A'` (見開き) | TweaksPanel / ViewerBar |
> | `ruby` | `true` | TweaksPanel / ViewerBar |
> | `night` | `false` | TweaksPanel / ViewerBar |

#### 固定値（CSS 変数として `tokens.css` に直書き）

ランタイム可変ではなく、`src/styles/tokens.css` の `:root` で固定宣言する。将来カラースキーマ刷新時は `tokens.css` 1 ファイルの編集のみで対応する（ADR-008）。

| CSS 変数 | 固定値 | 用途 |
|----------|--------|------|
| `--terracotta` | `#E07856` | アクセントカラー（旧 `tweaks.accent`） |
| `--font-body` | `'M PLUS Rounded 1c', system-ui, sans-serif` | 本文フォント（旧 `tweaks.font` の rounded プリセット） |
| `--font-display` | `'M PLUS Rounded 1c', system-ui, sans-serif` | 見出しフォント |
| `--font-size-body` | `26px` | 本文文字サイズ（旧 `tweaks.fontSize`、モック既定 22px から拡大） |

### Reducer の Action

```ts
type Action =
  | { type: 'set'; key: TweakKey; value: Tweaks[TweakKey] }
  | { type: 'reset' }
  | { type: 'hydrate'; value: Tweaks };  // localStorage 復元用
```

### localStorage キー / 形式

- キー: `eh.tweaks`（モック踏襲）
- 値: `Tweaks` の JSON 文字列。スキーマ不一致なら `TWEAK_DEFAULTS` にフォールバック
- 復元時バリデーション: `normalizeTweaks` が whitelist 方式で 4 キーのみを取り出す。古いブラウザに残存している `fontSize` / `accent` / `font` キーは黙殺され、次回保存時に自然消滅する（追加マイグレーション不要）

### Indexes / Relations

- 物語は配列なので index は不要
- `Page.scene` は `Story.id × scene` の複合キーで `public/illustrations/{Story.id}/{scene}.webp` を一意決定
- 重複防止: 同 Story 内で `pages[i].scene` の重複は許容（同じ画像を再利用可）

## 5. API 設計

該当なし（バックエンドなし）。

## 6. State Management Design

```mermaid
flowchart LR
  A[App] -->|wraps| TP[TweaksProvider]
  TP -->|context value| Tweaks[(tweaks state<br/>4 keys)]
  TP -->|effect| LS[localStorage<br/>'eh.tweaks']
  TP -->|effect| HtmlClass[document.documentElement<br/>.night / .no-ruby class]
  Tweaks --> Shelf[ShelfA/ShelfB]
  Tweaks --> Viewer[ViewerA/ViewerB]
  Tweaks --> Panel[TweaksPanel]
  App -->|local state| OpenId[openId: string \| null]
  App -->|local state| TweaksOpen[tweaksOpen: boolean]
```

> 本番固定化に伴い、`document.documentElement.style.setProperty('--terracotta' / '--font-*')` のランタイム書換は廃止。アクセントカラーと本文/見出しフォントは `tokens.css` で固定（ADR-008）。

### 状態の所在

| 状態 | 所在 | 永続化 |
|------|------|--------|
| `tweaks` (4 キー: `shelfVariant` / `viewerVariant` / `ruby` / `night`) | `TweaksProvider` (Context + Reducer) | localStorage `eh.tweaks` |
| `openId` (ビュアー対象 storyId) | `App` の useState | URL クエリ `?open={id}` で復元（Could / TBD-003） |
| `tweaksOpen` (パネル開閉) | `App` の useState | しない（一時的 UI 状態） |
| `selectedTags` | `App` の useState | しない（タグ絞込はセッション内のみ） |
| `pageIndex` (ビュアー内ページ位置) | `useViewerNav` の useState | しない（毎回表紙から開始） |

### 復元フロー

```
1. mount: TweaksProvider が初期 state = TWEAK_DEFAULTS
2. useEffect: safe-storage.get('eh.tweaks', TWEAK_DEFAULTS) → normalizeTweaks で whitelist 抽出 → dispatch({type:'hydrate', value: ...})
3. 以降の変更: setTweak(key, value) → reducer 更新 → useEffect で safe-storage.set
4. UI 副作用 (.night / .no-ruby クラス) は別の useEffect で同期
```

ハイドレーション時のフラッシュ対策:
- 初回レンダ時、`document.documentElement` に `data-hydrating="true"` を付与し、CSS で軽い transition 抑制
- ハイドレーション完了後に削除

## 7. 認証 / 認可

該当なし（パブリック公開、認証不要、個人情報なし）。

## 8. エラーハンドリング方針

### React コンポーネントクラッシュ
- `<ErrorBoundary>` でアプリ全体をラップ（IR-008）
- フォールバック UI: 「あれ？ なにかが おかしいみたい」+「ホームへもどる」ボタン → `window.location.reload()` でリセット

### localStorage 失敗
- すべて `safe-storage.ts` 経由で `try/catch`
- 失敗時は `console.warn` のみ。アプリは in-memory state で継続

### 画像取得失敗
- `IllustWithFallback` の `onError` で fallback モードに遷移
- ログ出力なし（ユーザー段階配置中は失敗が常態）

### Google Fonts 取得失敗
- `font-display: swap` + CSS フォントスタックの `system-ui, sans-serif` で代替
- 個別の検出は不要

### URL クエリ不正値（TBD-003 採用時）
- `?shelf=`, `?viewer=` の値は型検証しデフォルト fallback

### TypeScript 型違反 / 不正な物語データ
- ビルド時に `tsc --noEmit` で検出（CI で必須化）

## 9. テスト戦略

| Test Type | Tool | Coverage Target | Scope |
|-----------|------|-----------------|-------|
| Unit | Vitest + @testing-library/react | ≥ 80% (lines) | `lib/*`, `stores/*`, 主要コンポーネント |
| Integration | Vitest（コンポーネント結合） | — | App + Provider + Shelf + Viewer |
| E2E | Playwright | 主要動線 6 シナリオ | 本棚 / ビュアー / Tweaks / レスポンシブ |
| GUI | — | — | （該当なし、Web のため） |
| Accessibility | axe-core (Playwright) + 手動 | Lighthouse a11y ≥ 95 | 全画面 |

### E2E テストポリシー（HAS_UI: true）

- **採用ツール**: Playwright（プロジェクトルール / build-verification-commands.md 確定）
- **対象ブラウザ**: Chromium（必須）/ WebKit（iPad 検証必須）/ Firefox（任意）
- **実行モード**: ローカル開発時 headed、CI は headless
- **Page Object Model**: 採用しない（画面 2 つで規模が小さく、過剰設計）
- **対象シナリオ**:
  1. `home.spec.ts`: 本棚 → 物語選択 → 表紙 →「よみはじめる」→ 全ページ閲覧 → 戻る
  2. `viewer-keyboard.spec.ts`: マウスを使わず本棚 → ビュアー → ←/→ → Esc が完了
  3. `ruby-toggle.spec.ts`: ふりがな切替で `<rt>` の可視性が変わる
  4. `persistence.spec.ts`: Tweaks 4 キー変更 → リロード → 復元（fontSize シナリオは削除）
  5. `responsive-ipad.spec.ts`: iPad プロファイル（1024×768）でレイアウト崩れなし、`100dvh` 適用確認
  6. `image-fallback.spec.ts`: `public/illustrations/` 未配置 / 不正パス時にフォールバック表示

## 10. 実装順序 / 依存関係

> 本番固定化（Tweaks Simplification）の実装は既存実装の刈り込みであり、Phase A〜E の小さなフェーズに再構成する。タスク粒度 5〜8 を想定。
>
> 関連: `docs/design-notes/tweaks-simplification.md`

```
Phase A: 型・ストアの刈り込み
  └─ TASK-A1: src/types/tweaks.ts から fontSize / accent / font を削除
              + tweaks-defaults.ts の TWEAK_DEFAULTS 4 フィールド化
              + tweaks-reducer.ts の normalizeTweaks 該当分岐削除
              + tweaks-context.tsx から accent / font の useEffect を削除
              (依存なし。型エラーが下流に伝播するので最初に実施)

Phase B: UI の刈り込み
  └─ TASK-B1: TweaksPanel.tsx から「色」「フォント」セクションを削除
              + 「よみやすさ」セクションから文字サイズスライダー削除
              (Phase A 後)
  └─ TASK-B2: ViewerBar.tsx から ± ボタンと fontSize 数値表示を削除
              + ViewerA / ViewerB / App.tsx の fontSize / setFontSize props を削除
              (Phase A 後 / TASK-B1 と並行可)

Phase C: 不要モジュール削除 + tokens.css 固定値
  └─ TASK-C1: TweakColor.tsx / TweakSelect.tsx / TweakSlider.tsx を git rm
              + accent-presets.ts / font-presets.ts を git rm
              + tokens.css に --terracotta / --font-body / --font-display /
                --font-size-body=26px を直書き
              + ehon.css の本文サイズ基準を 26px に調整
              (Phase B 後)

Phase D: テスト整理
  └─ TASK-D1: tests/unit/tweaks-reducer.test.ts から削除キー関連アサーション除去
              + tests/unit/TweaksPanel.test.tsx を 2 セクション構成に修正
              + tests/e2e/persistence.spec.ts から fontSize 永続化シナリオ削除
              + ViewerBar 関連テストから ± ボタン操作の検証を削除
              + 古い localStorage キー残存ケースの E2E 確認を追加
              (Phase C 後)

Phase E: index.html フォント整理
  └─ TASK-E1: index.html の <link rel="stylesheet" href="...fonts.googleapis.com..."> から
              不要フォント (Klee One / Hachi Maru Pop / Zen Maru Gothic / Shippori Mincho /
              Kosugi Maru / BIZ UDPGothic) の URL を削除し、M PLUS Rounded 1c のみ残す
              (Phase D 後 / 任意で並行可)
```

> ARCHITECT_BRIEF（developer 向け）の詳細（ブランチ名 `feat/tweaks-simplification`、削除対象ファイル一覧、テスト変更内容、完了判定）は `docs/design-notes/tweaks-simplification.md` §3 / §6 / §8 を参照。

## 11. 環境 / 設定

### 環境変数（MVP では基本ゼロ）

- `VITE_OG_IMAGE_URL`（任意。OGP 画像の絶対 URL。指定なしなら `/og-image.png`）
- `.env.local` は MVP で使用しない（LLM 連携時に追加。Hook B が書き込みブロック）

### 設定ファイル

| File | 役割 | 担当 |
|------|------|------|
| `package.json` | 依存・スクリプト | scaffolder |
| `pnpm-lock.yaml` | ロック | scaffolder |
| `tsconfig.json` | TS 設定 (strict, jsx: react-jsx, paths 不要) | scaffolder |
| `tsconfig.node.json` | vite.config 用 | scaffolder |
| `vite.config.ts` | Vite 設定 (`@vitejs/plugin-react`、`mock/` 除外) | scaffolder |
| `vitest.config.ts` | Vitest 設定 (jsdom, setupFiles) | scaffolder / test-designer |
| `playwright.config.ts` | Playwright 設定 (Chromium / WebKit, iPad プロファイル) | test-designer |
| `.eslintrc.cjs` | ESLint (`@typescript-eslint`, `react-hooks`, `jsx-a11y`) | scaffolder |
| `.prettierrc` | Prettier | scaffolder |
| `.gitignore` | git 除外 (`node_modules`, `dist`, `coverage`, `.env*`, `playwright-report/`, `test-results/`) | scaffolder |
| `index.html` | Vite エントリ HTML、`<title>えほんやさん</title>`、OGP メタタグ、フォント `<link>` (M PLUS Rounded 1c のみ) | scaffolder |
| `vercel.json` | SPA リライト | Operations Flow `infra-builder` |

#### vercel.json — SPA fallback rewrite の方針

- 現行の SPA fallback rewrite パターン: `/:path*` → `/index.html`
- `framework: "vite"` を明示し、Vercel の Vite preset を有効化する
- Vercel は **filesystem-first** で URL を解決する (静的ファイル → headers → rewrites の順)
  - `dist/assets/*.js`, `dist/favicon.svg` 等のビルド成果物は rewrites より先に解決されるため、
    `source` 側でアセット拡張子を除外する必要はない
- `/api/` ルート追加時の方針: 本アプリは現状 API ルートを持たない。将来 BFF / LLM サーバルート
  (`/api/llm-generate` 等) を追加する場合は、Vercel の Functions (`api/` ディレクトリ) として
  実装すれば rewrites より優先されるため、SPA fallback と衝突しない
- 注意 (試行錯誤の経緯): Vercel の `rewrites.source` は path-to-regexp DSL を使うが、
  以下のパターンは検証で機能しなかった:
  - `/((?!.*\..*|api/.*).*)` (negative lookahead 二段) — 旧パターン
  - `/((?!api/).*)` (negative lookahead 単段)
  - `/(.*)` (regex キャプチャ。`cleanUrls: true` と併用で 404)
- 解決策: path-to-regexp の named param 形式 `/:path*` に切替え + `cleanUrls` を削除 +
  `framework: "vite"` を明示。詳細は `docs/design-notes/vercel-spa-rewrite-fix.md` を参照

> 関連: `docs/design-notes/vercel-spa-rewrite-fix.md`

### tsconfig 主要設定

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests"],
  "exclude": ["mock", "node_modules", "dist"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 12. 既知のリスクと緩和策

| Risk | Impact | Mitigation |
|------|--------|------------|
| R-001: 夜モード `--mustard` のコントラスト 4.5:1 未達 | medium | 実装後 axe-core で実測、未達なら夜パレット専用色を導入 (TBD-002) |
| R-002: Google Fonts 取得失敗時のレイアウトずれ | low | `font-display: swap` + system フォールバック CSS スタック |
| R-003: localStorage 利用不可でアプリ停止 | medium | `safe-storage.ts` で try/catch + in-memory fallback |
| R-004: iPad Safari `100vh` ずれ | medium | `100dvh` 採用、フォールバック `100vh`、Playwright iPad プロファイル E2E |
| R-005: ふりがな ON/OFF の SR 揺れ | low | DOM 構造維持、`<rt> { display: none }` のみで切替 |
| R-006: アニメーション過多 | medium | `prefers-reduced-motion: reduce` で全アニメ停止 |
| R-007: 著作権表記 | low | フッター「原作: パブリックドメイン / 再話・コード: © 2026 えほんやさん（MIT）」 |
| R-008: Vercel Vite 設定漏れ | low | `vercel.json` SPA リライトを Operations で必須整備 |
| R-009: モック資産が本番ビルドに混入 | low | `tsconfig exclude: ['mock']` + `index.html` で参照しない |
| R-010: スマホレスポンシブ後戻り | medium | モック既存 `@media (max-width:560px)` 踏襲、E2E iPhone プロファイルで補助検証 |
| R-011: 挿絵未配置で見栄え悪化 | medium | `IllustWithFallback` で `placeholderEmoji + bg` フォールバック。Delivery 中に順次配置可 |
| R-012: 挿絵画像のサイズ過大で LCP 未達 | medium | 表紙のみ `loading="eager"`、シーンは `lazy`、推奨スペック README 記載 |
| R-013: 著作権上問題のある画像混入 | high | doc-writer が README に明記、Operations Flow で `LICENSE-illustrations.md` 雛形整備 |
| R-014: 26px 固定で iPhone 小型機の 1 行幅が短くなり改行頻度が上昇 | low-medium | developer 段階で実機 / Playwright iPad / iPhone プロファイル確認、必要時は CSS で `clamp()` を検討（ADR-008） |
| R-015: 古い localStorage キー (fontSize / accent / font) 残存 | low | `normalizeTweaks` の whitelist 方式で黙殺。次回保存時に自然消滅。E2E (`persistence.spec.ts`) で確認 |

## 13. Architecture Decision Records (ADR)

### ADR-001: 状態管理に Zustand ではなく React Context + useReducer を採用
- **Context**: SPEC.md は両方を選択肢とした。Tweaks は単一ストアで非同期もない
- **Decision**: Context + useReducer + localStorage 同期
- **Rationale**:
  - 依存ライブラリを 1 つ減らせる（バンドルサイズ抑制 / 200KB gz NFR に効く）
  - Reducer なら `setTweak` のジェネリクスが書きやすく、保守性も高い
  - 子供向けプロダクトでデバッグしやすい
- **Rejected Alternatives**:
  - Zustand: 便利だが Tweaks 単一なら過剰
  - Redux Toolkit: ボイラープレートが過大
  - useState の prop drilling: 多階層に渡すのが煩雑

### ADR-002: ルーティングライブラリを採用しない
- **Context**: 物理スクリーンが本棚 + ビュアーオーバーレイのみで URL は 1 つ
- **Decision**: React Router 等は導入せず、ビュアー開閉は `openId` 状態で管理。URL クエリは Could (FR-020) として手書き同期
- **Rationale**: 200KB バンドル NFR、依存最小化
- **Rejected Alternatives**: React Router（オーバースペック）

### ADR-003: 挿絵フォールバックは `<img onError>` + 状態切替で実装
- **Context**: 画像不在シーンが Delivery 期間中常態。`<picture>` + `<source>` 失敗パターンも検討
- **Decision**: `IllustWithFallback` 内で `useState<boolean>` の `loaded` 状態を管理、`<img onError>` で false に切替し fallback DOM を描画
- **Rationale**:
  - SSR 不要なため `<img onError>` の挙動は予測可能
  - `<picture>` はレイアウト分岐がやや複雑になる
  - 単一画像 + onError がテストしやすい (`image-fallback.spec.ts`)
- **Rejected Alternatives**:
  - `<picture><source srcset>` + 失敗時 `<img>`: srcset の挙動はブラウザ依存があり Playwright での検証が複雑化
  - Pre-flight HEAD リクエスト: 余分な往復

### ADR-004: ふりがな処理を自前パーサで実装
- **Context**: モックは `renderRuby` というグローバル関数を使用。npm に既存 ruby パーサもある
- **Decision**: `src/lib/ruby-parser.ts` に純関数として自前実装
- **Rationale**:
  - 記法 `漢字{かんじ}` がプロジェクト独自で、外部 lib との適合に余計なコストがかかる
  - 純関数のため Vitest で網羅テスト容易
  - 依存最小化（バンドルサイズ）
- **Rejected Alternatives**: `kuroshiro` 等の形態素解析系（過剰、辞書サイズが巨大）

### ADR-005: スタイルシステムは CSS 素 + CSS Custom Properties（Tailwind / CSS Modules を採用しない）
- **Context**: モックは素の CSS で `--terracotta` 等のカスタムプロパティ駆動
- **Decision**: モック `styles/ehon.css` を `src/styles/` にそのまま移植。component-scoped スタイルが必要なら `*.module.css`（限定使用）
- **Rationale**:
  - モックの CSS が完成度高く、移植コストが最小
  - Tailwind を入れると設計が二重化
  - CSS Modules は導入オプションとして将来追加可
- **Rejected Alternatives**: Tailwind CSS（学習コスト + 設計変更）, Emotion / styled-components（runtime コスト）

### ADR-006: Vite + React + TypeScript（Next.js を採用しない）
- **Context**: SPEC.md は React 18 + Vite を採用
- **Decision**: そのまま採用。Next.js は不採用
- **Rationale**:
  - 単一画面 SPA で SSR / Routing 不要
  - Vercel 上でも Vite SPA はネイティブにデプロイできる
  - バンドル最小化に有利
- **Rejected Alternatives**: Next.js（オーバースペック）, Remix（同上）

### ADR-007: タスク粒度は 28 タスクに細分化（Phase 9 つ）
- **Context**: Light プラン全体推定 20h、子供向けプロダクトで品質を担保したい
- **Decision**: Phase 1〜9 で 28 タスク、各 30 分〜90 分目安
- **Rationale**: 1 commit = 1 task で履歴が読みやすい / Aphelion git-rules 準拠
- **Rejected Alternatives**: 大粒度分割（履歴が読みにくい）

### ADR-008: Tweaks 機能の本番固定化
- **Context**:
  - モック期 (Discovery / Delivery 初期) は `Tweaks` を 7 項目すべてランタイム可変として実装した
  - 本番運用フェーズ (2026-05-04 時点で Vercel 上に公開済み) では、ターゲット (3〜5 歳児 + 保護者) に対して調整 UI の選択肢が多すぎ、保護者の認知負荷を上げる懸念がある
  - 文字サイズ / アクセント色 / フォントは「読みやすさ」より全体トーンに影響するため、プロダクト主導で決め打ちしたい
  - 将来カラースキーマ刷新時にユーザーごとの保存値が新スキーマと整合しなくなるリスクがある
- **Decision**:
  - `Tweaks` 型から `fontSize` / `accent` / `font` の 3 フィールドを完全削除し、UI（TweaksPanel / ViewerBar の文字サイズ ± ボタン）からも除去する
  - `--terracotta: #E07856` / `--font-body` (M PLUS Rounded 1c) / `--font-display` (同) / `--font-size-body: 26px` を `tokens.css` の `:root` で固定宣言する
  - Provider のランタイム CSS 変数書換 useEffect (accent / font) を 2 本削減し、残るは `night` クラスと `no-ruby` クラスの同期のみとする
  - `index.html` のフォント `<link>` から不要フォント (Klee One / Hachi Maru Pop / Zen Maru Gothic / Shippori Mincho / Kosugi Maru / BIZ UDPGothic) を削除し、M PLUS Rounded 1c のみ残す
  - 削除対象モジュール: `TweakColor.tsx` / `TweakSelect.tsx` / `TweakSlider.tsx` / `accent-presets.ts` / `font-presets.ts`
- **Rationale**:
  - バンドルサイズ縮小（5 ファイル削除 + 2 useEffect 削減 + 不要フォント `<link>` 削除）
  - UI 認知負荷軽減（4 セクション → 2 セクション、4 操作のみ）
  - 将来のカラースキーマ刷新は `tokens.css` 1 ファイルの編集で完結（Provider への分散コードを廃した結果）
  - 本文 26px 固定により 3〜5 歳児に適した読みやすさを既定化（モック既定 22px から拡大）
- **Rejected Alternatives**:
  - **ストアは残し UI のみ削除**: 再利用予定が不明なまま型・ストア・useEffect を残すのは過剰。型を削ることで型エラーが下流に伝播し、削除漏れを TS が検出してくれるメリットも享受できない
  - **localStorage マイグレーションスクリプト**: `normalizeTweaks` が whitelist 方式 (4 キー以外を黙殺) のため、古いキー (fontSize / accent / font) は次回保存時に自然消滅する。専用マイグレーションは不要

---

## AGENT_RESULT

```
AGENT_RESULT: architect
STATUS: success
ARTIFACTS:
  - docs/ARCHITECTURE.md
TECH_STACK: TypeScript 5, React 18, Vite 5, pnpm 9, Vitest 1, Playwright 1.44, ESLint 8, Prettier 3
TECH_STACK_CHANGED: false
PHASES: 5
TASKS: 6
NEXT: developer
```
