# Architecture Design: えほんやさん（Ehon）

> Source: SPEC.md (2026-05-04 / Tweaks 縮小版 → 2026-05-05 で Tweaks 完全削除 / 2026-05-06 で UC-006 にスワイプ追加)
> Source: UI_SPEC.md (2026-05-04 / Tweaks 縮小版 → 2026-05-05 で Tweaks 完全削除 / 2026-05-06 で SCR-002 にスワイプ追加)
> Source: DISCOVERY_RESULT.md (2026-05-04) / project-rules.md (2026-05-04)
> Source: docs/design-notes/tweaks-simplification.md (2026-05-04)
> Source: docs/design-notes/remove-tweaks-panel.md (2026-05-05)
> Source: docs/design-notes/page-turn-animation.md (2026-05-05)
> Source: docs/design-notes/page-turn-animation-phase2.md (2026-05-05)
> Created: 2026-05-04
> Last updated: 2026-05-05
> Update history:
>   - 2026-05-04: Initial draft (architect / Delivery Flow Light プラン)
>   - 2026-05-04: Tweaks 機能の本番固定化 (architect / Tweaks 型を 4 フィールドに縮小、CSS 変数同期 useEffect を 2 本削減、ADR-008 追記、実装順序を Phase A〜E に再構成)
>   - 2026-05-05: Tweaks 機能の完全削除 (architect / TweaksPanel/Launcher/Provider/Context/Reducer 削除、useSettingsStore (custom hook) へ置換、ADR-009 追記、実装順序を Phase 1〜5 に再構成)
>   - 2026-05-06: タッチスワイプ対応 Phase 1 を追加 (architect / react-swipeable 採用、ADR-010 追記、ViewerA/ViewerB の `.eh-viewer-stage` にスワイプジェスチャ統合、R-018/R-019 追加)
>   - 2026-05-05: ページめくりアニメ強化 Phase 2 を追加 (architect / CSS only / ADR-011 追記 / `.book-a` への perspective 付与・キーフレームへ box-shadow 追加・ViewerB easing を `cubic-bezier(0.2, 0.8, 0.2, 1)` に統一 / R-021 追加)

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
│   │   │   ├── ViewerA.tsx            # 見開き
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
│       ├── viewer-keyboard.spec.ts    # キーボード完結
│       ├── viewer-swipe.spec.ts       # ★ 既存 (Phase 1 / 2026-05-06): スワイプでページ送り
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
> **ページめくりアニメ強化 Phase 2 に伴う変更（ADR-011 / 本フェーズ）**:
> - 影響範囲は **`src/styles/ehon.css` のキーフレーム / 親要素クラス定義のみ**。React コンポーネント・型定義・hook には変更を加えない
> - JS ライブラリ追加は **なし**（バンドル増 0 kB）
> - 既存 `src/styles/reduced-motion.css` の `.book-a, .book-b { animation: none !important; }` 系セレクタが新キーフレームの中間キーも含めて停止するため、reduced-motion 側の追加対応は不要

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
- **本フェーズ (Phase 2) では改変しない**: アニメ強化は CSS のみ。`flipDir` / `isFlipping` の値や duration 500ms（CSS 0.55s に対する余裕分）には触れない

### スワイプジェスチャ統合（Phase 1 / ADR-010）

ビュアー内のタッチスワイプは `react-swipeable` の `useSwipeable` フックを `ViewerA.tsx` / `ViewerB.tsx` 内で直接呼び出して実装する。新たな custom hook は導入せず、既存 `useViewerNav.go(±1)` を呼ぶ薄い接合層に留める。

#### 統合ポイントと既存抽象との関係

```mermaid
flowchart LR
  Touch[タッチイベント<br/>touchstart/move/end] --> Swipeable[useSwipeable<br/>react-swipeable]
  Swipeable -->|onSwipedLeft| GoNext["go(1)"]
  Swipeable -->|onSwipedRight| GoPrev["go(-1)"]
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

#### 適用対象の DOM

- 装着先: ViewerA は `.book-a` を含むステージ要素、ViewerB は `.eh-viewer-stage` 等の本文表示エリア
- **`<ViewerBar>` には装着しない**: バー上のボタン（ふりがな・夜モード・閉じる）タップとスワイプの誤検知を避けるため、スワイプ検出を本文ステージのみに限定する
- **`<ruby>` 構造には影響を与えない**: `useSwipeable` はルート要素にイベントハンドラを束ねるだけで、子の DOM 構造（`<ruby><rb>...</rb><rt>...</rt></ruby>`）を改変しない

#### `useSwipeable` の設定値

| オプション | 値 | 意図 |
|------------|---|------|
| `onSwipedLeft` | `() => go(1)` | 左スワイプで次ページ |
| `onSwipedRight` | `() => go(-1)` | 右スワイプで前ページ |
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

#### 確定パラメータ

| パラメータ | 確定値 | 根拠 |
|------------|--------|------|
| `perspective` (`.book-a`) | **`1500px`** | analyst 案を採用。900px〜1024px 幅の見開き要素に対し、視差 ≒ 35° 程度の自然な奥行きを与える。値が小さすぎる (≤800px) と歪みが強くなり、大きすぎる (≥2500px) と立体感が消える |
| `transform-style` (`.book-a`) | **`preserve-3d`** | 子要素の `rotateY` を平面投影せず立体保持するため必須。`perspective` と対で指定 |
| `box-shadow` (中間キー 50%) | **`-20px 0 30px rgba(0, 0, 0, 0.3)` (next)**<br>**`20px 0 30px rgba(0, 0, 0, 0.3)` (prev)** | analyst 案を採用。0.3 の不透明度は昼モード (`--paper`) でも夜モード (`--night-paper`) でも識別可能で、かつ「めくり感」を主張しすぎない。blur=30px で柔らかい影縁になる |
| `flipNextRightFade` フェード開始 | **`40%`** (`60%` から前倒し) | analyst 案を採用。0.55s × 0.4 = 0.22s 時点でフェード開始。回転中盤の影と同期して新ページが立ち上がる視覚情報を強化 |
| ViewerB easing | **`cubic-bezier(0.2, 0.8, 0.2, 1)`** | analyst 案を採用。Material Design の "standard easing" と同等の余韻あり（終端でゆっくり止まる）。線形 ease より「紙の物体感」が出る。bg / card 両方に同じ値を当てることでズレを防ぐ |

> **CSS 例（最終形のイメージ）**:
> ```css
> .book-a {
>   perspective: 1500px;
>   transform-style: preserve-3d;
> }
> @keyframes flipNextLeft {
>   0%   { transform: rotateY(0); box-shadow: none; }
>   50%  {
>     transform: rotateY(-90deg);
>     box-shadow: -20px 0 30px rgba(0, 0, 0, 0.3);
>   }
>   100% { transform: rotateY(-180deg); opacity: 0.7; box-shadow: none; }
> }
> @keyframes flipPrevRight {
>   0%   { transform: rotateY(0); box-shadow: none; }
>   50%  {
>     transform: rotateY(90deg);
>     box-shadow: 20px 0 30px rgba(0, 0, 0, 0.3);
>   }
>   100% { transform: rotateY(180deg); opacity: 0.7; box-shadow: none; }
> }
> @keyframes flipNextRightFade {
>   0%   { opacity: 0; }
>   40%  { opacity: 0; }
>   100% { opacity: 1; }
> }
> .book-b.flipping-next .book-b-bg {
>   animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
> }
> .book-b.flipping-next .book-b-text-card {
>   animation: slideInRightCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
> }
> .book-b.flipping-prev .book-b-bg {
>   animation: slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
> }
> .book-b.flipping-prev .book-b-text-card {
>   animation: slideInLeftCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
> }
> ```

#### duration / タイミング不変条件

- `flipNextLeft` / `flipPrevRight` / `flipNextRightFade` の **duration は 0.55s のまま据え置き**（`useViewerNav` の `FLIP_LOCK_MS=500ms` との整合）
- `slideInRight` / `slideInLeft` / `slideInRightCard` / `slideInLeftCard` の **duration は 0.5s のまま据え置き**
- 既存 E2E (`viewer-keyboard.spec.ts` / `viewer-swipe.spec.ts` / `home.spec.ts`) は timing に依存した assertion を持たないため、duration 不変なら影響なし

#### reduced-motion との関係

- `src/styles/reduced-motion.css` は `.book-a, .book-b { animation: none !important; }` の形でキーフレーム全体を無効化している
- `box-shadow` はキーフレーム内で animate されるプロパティなので、`animation: none` が効けば中間キーごと停止する → 影は描画されない
- `perspective` は静的プロパティで「動かない」ため reduced-motion での停止対象外。設定が残っていても rotateY 自体が停止すれば視差は発生しないので副作用は出ない
- 結論: **reduced-motion.css への追記は不要**（AC2-4 を既存実装で満たす）

#### 既存抽象との関係

- React コンポーネント / `useViewerNav` / 設定ストアは **一切触れない**
- スワイプ (Phase 1) との競合なし: スワイプは `useViewerNav.go(±1)` を呼ぶだけで、CSS アニメ表現には依存しない

#### Phase 3（将来課題、本フェーズの対象外）

ページ進行率にジェスチャを連動させる "drag-to-flip" や、3D 紙めくりライブラリ (`react-pageflip` 等) の導入、ページ厚みの擬似要素 (`::before`) 表現は **Phase 3 以降** で扱う。Phase 3 着手時に再度 architect を起動し、設計メモ `docs/design-notes/page-turn-animation.md` の Phase 3 候補章を再活用する想定。

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
- **Phase 2 では変更なし**: アニメ強化は CSS 側（`ehon.css`）のみ。Viewer コンポーネントの DOM / props / handler に追加・改変なし

### `ViewerBar` (src/components/viewers/ViewerBar.tsx)
- **責務**: ビュアー上部のツールバー
- **Phase 2 では変更なし**

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

### Phase 2 で追加されるリスク
- 現状なし（CSS のみの変更で、ランタイム例外を引き起こすコードパスはない）

## 9. テスト戦略

| Test Type | Tool | Coverage Target | Scope |
|-----------|------|-----------------|-------|
| Unit | Vitest + @testing-library/react | ≥ 80% (lines) | `lib/*`, `stores/settings-store.ts`, 主要コンポーネント |
| Integration | Vitest | — | App + Shelf + Viewer |
| E2E | Playwright | 主要動線 7 シナリオ（Phase 1 で +1） | 本棚 / ビュアー / スワイプ / 永続化 / レスポンシブ |
| Accessibility | axe-core (Playwright) + 手動 | Lighthouse a11y ≥ 95 | 全画面 |

### Phase 2 (CSS アニメ強化) に伴うテスト方針

- **新規 E2E は追加しない**: アニメは見た目のみで挙動・タイミングへの影響なし。既存 7 ケースが破壊されないことだけを CI で確認する
- **新規 visual regression テストは追加しない**: コスト対効果が低い。将来 Standard / Full プランで visual-designer を起動した場合に再評価
- **既存 E2E の維持**: `home.spec.ts` / `viewer-keyboard.spec.ts` / `viewer-swipe.spec.ts` を retain。duration 不変なため timing 由来の flake は発生しない想定
- **手動視覚レビュー**: developer がローカル `pnpm dev` で実機確認（昼/夜モード × ViewerA/B × 次/前ページ送り の 8 パターン目視）
- **bundle size 計測**: `pnpm build` 後の gzip サイズを記録し、AC2-6（増加 0 kB）を担保

### Phase 1 (タッチスワイプ) に伴うテスト追加 / 修正（既存 / 完了済）

- **追加 E2E**: `tests/e2e/viewer-swipe.spec.ts`（5 ケース）
- **既存 E2E の維持**: `viewer-keyboard.spec.ts` / `home.spec.ts` 既存ケースを維持

### E2E テストポリシー（HAS_UI: true）

- **採用ツール**: Playwright
- **対象ブラウザ**: Chromium（必須）/ WebKit（iPad 検証必須）/ Firefox（任意）
- **実行モード**: ローカル開発時 headed、CI は headless
- **対象シナリオ**:
  1. `home.spec.ts`: 本棚 → 物語選択 → 表紙 → 全ページ閲覧 → 戻る
  2. `viewer-keyboard.spec.ts`: マウスを使わず本棚 → ビュアー → ←/→ → Esc が完了
  3. `viewer-swipe.spec.ts` (Phase 1): タッチスワイプで前後ページ送り
  4. `ruby-toggle.spec.ts`: ふりがな切替で `<rt>` の可視性が変わる
  5. `persistence.spec.ts`: Settings 4 キー変更 → リロード → 復元
  6. `responsive-ipad.spec.ts`: iPad プロファイルでレイアウト崩れなし、`100dvh` 適用確認
  7. `image-fallback.spec.ts`: 画像不在時にフォールバック表示

## 10. 実装順序 / 依存関係

> **Phase 2 (ページめくりアニメ強化 / CSS only) — 本フェーズで対象**
>
> ブランチ: `feat/page-turn-anim-phase2` (main から切る。最初の implementation-tier agent (developer) が作成)
> 関連: `docs/design-notes/page-turn-animation-phase2.md`
> 対応 Issue: #7

```
Phase 2: ページめくりアニメ強化 (CSS only)
  └─ TASK-2-1: .book-a に perspective 付与
                src/styles/ehon.css
                - .book-a セレクタに perspective: 1500px / transform-style: preserve-3d を追加
                - 子要素の rotateY 立体保持の準備
                (依存なし。最初に実行)
  └─ TASK-2-2: flipNextLeft / flipPrevRight キーフレームに box-shadow 中間キー追加
                src/styles/ehon.css
                - 50% に rotateY(±90deg) + box-shadow(±20px 0 30px rgba(0,0,0,0.3)) を挿入
                - 0% / 100% で box-shadow: none に戻す
                (TASK-2-1 後 / 並行可)
  └─ TASK-2-3: flipNextRightFade のフェード開始タイミング調整
                src/styles/ehon.css
                - 60% → 40% に前倒し
                (TASK-2-1 と並行可)
  └─ TASK-2-4: ViewerB の easing を cubic-bezier に統一
                src/styles/ehon.css
                - .book-b.flipping-next .book-b-bg / .book-b-text-card
                - .book-b.flipping-prev .book-b-bg / .book-b-text-card
                  の 4 行を ease → cubic-bezier(0.2, 0.8, 0.2, 1) に変更
                (TASK-2-1〜2-3 と並行可)
  └─ TASK-2-5: prefers-reduced-motion 動作確認
                既存 src/styles/reduced-motion.css の挙動確認のみ
                - .book-a / .book-b の animation: none !important が新中間キーも停止することを目視確認
                - reduced-motion.css への追記は **不要**（既存セレクタで網羅）
                - 不要なら chore: コメント追加のみで完了
                (TASK-2-1〜2-4 後)
  └─ TASK-2-6: SPEC.md / UI_SPEC.md / ARCHITECTURE.md 更新
                - SPEC.md: UC-006 受入基準に「ページめくり時に立体感のあるアニメーションが視覚的に確認できる（reduced-motion 時は除外）」を追記。Update history に 2026-05-05 行を追加
                - UI_SPEC.md: §8 Animations / Transitions 表に Phase 2 の補足列（perspective / box-shadow / easing）を追記。reduced-motion 節は変更なし。Update history に 2026-05-05 行を追加
                - ARCHITECTURE.md: 本ファイル §3「ページめくりアニメ強化」節と ADR-011 が既に追記済。developer は **再編集不要**。コミット時に本ファイルもステージに含めるだけでよい
                - 詳細は本ファイル §10 末尾「SPEC.md / UI_SPEC.md 差分更新方針 (Phase 2)」を参照
                (TASK-2-1〜2-5 後 / 並行可)
  └─ TASK-2-7: 検証
                - pnpm typecheck / pnpm lint / pnpm format:check / pnpm test 全 pass
                - pnpm test:e2e (主要シナリオ + 既存 swipe / keyboard ケース) pass
                - pnpm build でバンドルサイズ計測 (raw / gzip)。AC2-6: 増加 0 kB
                - 手動視覚レビュー (昼/夜 × ViewerA/B × 次/前 = 8 パターン目視)
                  - 中間キーの影が紙の厚みとして見える
                  - perspective により ViewerA の rotateY が立体感を持つ
                  - ViewerB の slide が余韻のある動きになる
                - prefers-reduced-motion: reduce 環境で全アニメが停止することを DevTools rendering タブで確認
                (TASK-2-1〜2-6 後 / 最終)
```

> commit 粒度の目安:
> - `style: .book-a に perspective を付与し flipping キーフレームに box-shadow 中間キーを追加 (TASK-2-1 / 2-2 / 2-3)`
> - `style: ViewerB の slide easing を cubic-bezier(0.2, 0.8, 0.2, 1) に統一 (TASK-2-4)`
> - `docs: SPEC.md / UI_SPEC.md / ARCHITECTURE.md にページめくりアニメ強化 Phase 2 を反映 (TASK-2-6)`
>
> ※ TASK-2-5 は実装変更なしのため確認のみ。`chore:` コメント追加で commit を立てるか、TASK-2-2 のコミットに含めて済ませても可。

### SPEC.md 差分更新方針（Phase 2 / TASK-2-6 委譲分）

| 節 | 変更内容 |
|----|----------|
| Update history | `2026-05-05: ページめくりアニメ強化 Phase 2 (developer / UC-006 受入基準にアニメの立体感を追記 / CSS only / バンドル増 0 kB)` を追記 |
| 4. UC-006 受入基準 | 既存リストの末尾に以下を追記:<br/>- ページ送り時、めくり中のページに影と奥行き（perspective）が表現され、紙の厚みが視覚的に確認できる<br/>- `prefers-reduced-motion: reduce` のとき、影・perspective を含む全アニメは停止する（既存ルールの再確認）<br/>- バンドルサイズ (gzip) の増加は 0 kB（CSS のみの変更） |
| 11. 受入条件サマリー | 「(2026-05-05 追加) ページめくり時に紙の厚み・立体感が CSS only のアニメで表現される」を追記 |

> **注意**: SCR-001 / 1.Scope (IN) / Tech Stack 節は **変更しない**（実装はキーフレーム拡張のみ、機能は増えない）。

### UI_SPEC.md 差分更新方針（Phase 2 / TASK-2-6 委譲分）

| 節 | 変更内容 |
|----|----------|
| Update history | `2026-05-05: ページめくりアニメ強化 Phase 2 (developer / Animations 表に perspective / box-shadow / easing を反映、Phase 2 補足を Animations 節に追記)` を追記 |
| 8. Animations / Transitions（表） | 既存の `flipNextLeft` / `flipPrevRight` 行に「中間キー (50%) で `box-shadow: ±20px 0 30px rgba(0,0,0,0.3)`」を追加注記。`flipNextRightFade` 行に「フェード開始 60% → 40%」を注記。`slideInRight` / `slideInLeft` / `slideInRightCard` / `slideInLeftCard` の easing 列を `ease` → `cubic-bezier(0.2, 0.8, 0.2, 1)` に更新 |
| 8. Animations / Transitions（表の下の補足） | `.book-a` に `perspective: 1500px` + `transform-style: preserve-3d` が付与されることを 1〜2 行で明記（rotateY を立体表現するため） |
| 7. Accessibility Requirements / 共通 | 既存の reduced-motion 記述に変更なし（既存ルールが Phase 2 の中間キーも網羅するため）。**追記不要** |

> **注意**: トークン表 / レスポンシブ / Screen List / Component Details は **変更しない**。Phase 2 はビジュアル装飾のみで、UI 構造は変わらない。

## 11. 環境 / 設定

### 環境変数（MVP では基本ゼロ）

- `VITE_OG_IMAGE_URL`（任意）

### 設定ファイル

| File | 役割 | 担当 |
|------|------|------|
| `package.json` | 依存・スクリプト（**Phase 1 で `react-swipeable` を追加。Phase 2 では追加なし**） | scaffolder / developer |
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
| R-018: タッチスワイプが ViewerBar のボタンタップと衝突する | medium | `useSwipeable` の装着先を ViewerBar から外し、本文ステージ (`.eh-viewer-stage` 相当) のみに限定する。ViewerBar 領域はスワイプ検出から外すことで誤動作を回避（ADR-010 / Phase 1） |
| R-019: タッチスワイプが `<ruby>` 内のテキスト範囲選択や縦スクロールを阻害する | medium-low | `preventScrollOnSwipe: false` を明示し、縦方向はネイティブのスクロールに任せる。`useSwipeable` はルート要素にイベントハンドラを束ねるだけで `<ruby><rt>` の DOM 構造を改変しないため SR 互換性は保たれる。`delta=50` で 50px 以上の横方向の動きのみ判定し、短いタップ・長押しは反応しない（ADR-010） |
| R-020: react-swipeable のメンテナンス停滞 / 後継ライブラリ未対応 | low | 採用時点 (2026-05-06) で週 DL 100 万超、最終リリース 1 年以内、React 18 互換確認済み。Phase 2 で drag-to-flip が必要になった段階で `@use-gesture/react` 等への切替を再評価（ADR-010） |
| **R-021: `perspective` 値 1500px が端末サイズで歪んで見える / 中間キー影が夜モードで見えにくい** | **medium-low** | **手動視覚レビュー (昼/夜 × ViewerA/B × 次/前 = 8 パターン目視) で確認。歪みが強い端末があれば `clamp()` 等の動的指定を Phase 3 で再評価。夜モードでは `--night-paper` の上に rgba(0,0,0,0.3) の影が出るが、`--night-bg` (#1F2440) より十分暗いため識別可能と判定。実測で不足なら blur を 30px → 40px へ調整（ADR-011 / Phase 2）** |

## 13. Architecture Decision Records (ADR)

### ADR-001 〜 ADR-009

（既存のまま。詳細は本ファイル直前のリビジョンを参照）

> ADR-001 (Context + useReducer 採用) は ADR-009 により上書きされた。
> ADR-008 (Tweaks 本番固定化) → ADR-009 (Tweaks 完全削除) → ADR-010 (タッチスワイプ採用 / Phase 1) → ADR-011 (ページめくりアニメ強化 / Phase 2) と進行。

### ADR-010: タッチスワイプ対応に react-swipeable を採用 (Phase 1)

- **Context**:
  - 想定 1st デバイスはタブレット (絵本はタッチで読む) だが、現状の Viewer は ◀/▶ ボタン + キーボード ←/→ のみで、`src/` 配下にタッチハンドラが皆無
  - UI_SPEC.md L293-294 には「画面右/左半分タップで次/前」と記載があったが、実装には反映されていなかった
  - analyst の現状分析（`docs/design-notes/page-turn-animation.md`）で、`useViewerNav` の既存抽象 (`go(±1)` / `flipDir` / `isFlipping` / `FLIP_LOCK_MS=500ms`) がスワイプから呼ばれる前提で設計されていることを確認。スワイプ実装は最小コストで済むと判定された
  - 本フェーズはスコープを **Phase 1 (スワイプのみ)** に限定し、Phase 2 (CSS アニメ強化) は別 PR / 別 issue に分離する方針をユーザーが確定済み (2026-05-06)
- **Decision**:
  - `react-swipeable` (7.x) を `dependencies` に追加する
  - `ViewerA.tsx` / `ViewerB.tsx` 内で `useSwipeable({ onSwipedLeft: () => go(1), onSwipedRight: () => go(-1), delta: 50, preventScrollOnSwipe: false, trackMouse: false })` を呼び、本文ステージ (`.eh-viewer-stage` 相当) のルートに `{...handlers}` を bind する
  - 新規 custom hook (`useSwipeNav` 等) は **作らない**。`useSwipeable` は薄く、`useViewerNav.go(±1)` を呼ぶ接合点として直接 Viewer に書く方が依存数が増えず読みやすい
  - **`useViewerNav` は改造しない**。スワイプによる `go` 呼び出しは既存の `isFlipping`/`FLIP_LOCK_MS` ロジックでロックされ、追加の重複ロックは不要
  - スワイプ装着先は ViewerBar **以外** に限定し、ボタンタップとの衝突を避ける (R-018 緩和)
  - `prefers-reduced-motion: reduce` でもスワイプ機能は維持。アニメ抑制は既存 CSS 側で対応済み
- **Rationale**:
  - **バンドル影響が小さい**: gzip 約 +4 kB。SPEC.md NFR (200 kB gzip) と AC-6 (page-turn-animation.md / +15 kB 以内) の両方に十分収まる
  - **API がシンプル**: `useSwipeable` はオブジェクト引数 + ハンドラを返すだけの hook。プロジェクトの React 18 + TS strict と相性が良く、テストも容易
  - **保守性**: 自前 Pointer Events 実装 (約 50 行) より、ライブラリの 1 行設定の方がレビュー・バグ修正・将来の閾値変更で勝る
  - **メンテ活発**: 採用時点で週 DL 100 万超、最終リリース 1 年以内、React 18 互換確認済み (R-020)
  - **MIT ライセンス**: project-rules.md `library-and-security-policy.md` の adoption criteria を満たす
  - **既存抽象の再利用**: `useViewerNav.go(±1)` をそのまま呼ぶことで、ロック・キーボード・ボタンとの統合が自動的に整う
- **Rejected Alternatives**:
  - **自前 Pointer Events 実装**: 約 50 行で書けるが、(a) 閾値・速度・マルチタッチ対応の堅牢性で react-swipeable に劣る、(b) ユニット / E2E テスト追加コストが増える、(c) 変更依頼への追従が面倒。本プロジェクトの規模では「コードを書かない」選択が正しい
  - **`@use-gesture/react`**: 強力だが、ドラッグ追従や複雑なジェスチャ (pinch / wheel / hover) を扱うためのライブラリでオーバースペック。bundle gzip も約 +10〜15 kB と大きい。**Phase 2 で drag-to-flip (ジェスチャ進行率に応じてめくりが追従) を導入する場合に再評価する**
  - **Framer Motion (motion)**: アニメーション + ジェスチャ統合は魅力的だが gzip +30〜40 kB と AC-6 を圧迫。Phase 1 (スワイプのみ) には不要。Phase 2 でも CSS 強化で十分と analyst が判定済み
  - **Hammer.js**: メンテ停滞。React フックラッパも自前で書く必要がある。今から採用する理由が薄い
- **Phase 2 での見直し方針**:
  - 本 Phase 2 は CSS only で進めることがオーナーから確定済み（2026-05-05）。`react-swipeable` の API 範囲 (`onSwipedLeft/Right`) で十分機能しているため切替は **しない**
  - ジェスチャの進行率に応じてページが追従する "drag-to-flip" を導入する場合（Phase 3 以降）は、`react-swipeable` では `eventData.deltaX` 等で擬似的に書けるが UX として不十分。`@use-gesture/react` + CSS Custom Properties (`--page-turn-progress`) の組み合わせを再評価する

### ADR-011: ページめくりアニメーションの控えめな立体感強化 (Phase 2 / CSS only)

- **Context**:
  - Phase 1 (PR #6 / Issue #5) でタッチスワイプ対応が完了し、`useViewerNav` の `flipDir` / `isFlipping` / 500ms ロックが安定動作している
  - Phase 1 ではアニメ本体は既存の `rotateY` / `translateX` ベースのキーフレームを流用したまま。紙の「めくり感」（厚み・影・余韻）は十分に表現できていない
  - analyst（`docs/design-notes/page-turn-animation-phase2.md`）が CSS だけで完結する控えめな強化案を提示し、`box-shadow` 0.3 / `perspective` 1500px / `cubic-bezier(0.2, 0.8, 0.2, 1)` を仮置き
  - オーナーから「CSS only / ライブラリ追加なし / 控えめに」が明示確定（2026-05-05）。RTL (Issue #8) は本フェーズの対象外で、本 PR マージ後に別 PR で対応
- **Decision**:
  - **影響は `src/styles/ehon.css` のキーフレーム強化のみ** に限定する。React コンポーネント / hook / 型 / 設定ストアには触れない
  - **`.book-a` 親要素**に `perspective: 1500px;` + `transform-style: preserve-3d;` を付与し、子の `rotateY` を立体的に表示する
  - **`@keyframes flipNextLeft` / `flipPrevRight`** に中間キー (`50%`) を追加し、`box-shadow: ±20px 0 30px rgba(0, 0, 0, 0.3)` でめくり中の影を表現する。`0%` / `100%` では `box-shadow: none` に戻す
  - **`@keyframes flipNextRightFade`** のフェード開始タイミングを `60%` から `40%` に前倒しし、回転中盤で新ページが立ち上がる視覚情報を強化する
  - **ViewerB の slide easing** を `ease` から `cubic-bezier(0.2, 0.8, 0.2, 1)` に統一する（`slideInRight` / `slideInLeft` / `slideInRightCard` / `slideInLeftCard` の 4 適用箇所）。終端でゆっくり止まる Material Design 標準カーブで「紙の物体感」を出す
  - **duration は不変** (`flipNext*` / `flipPrev*` 0.55s、`slideIn*` 0.5s)。`useViewerNav.FLIP_LOCK_MS=500ms` との整合性と既存 E2E の timing 安定性を保つ
  - **`prefers-reduced-motion: reduce`** 対応は既存 `src/styles/reduced-motion.css` の `.book-a, .book-b { animation: none !important; }` で網羅される。reduced-motion.css への追記は **不要**
  - **JS ライブラリは追加しない**（バンドル増 0 kB / AC2-6）
- **Rationale**:
  - **コスト最小**: CSS 数十行の編集のみ。React 改変ゼロ、テストコード変更ゼロ、ライブラリ追加ゼロ
  - **回帰リスク低**: duration が不変なら既存 E2E (`viewer-keyboard.spec.ts` / `viewer-swipe.spec.ts` / `home.spec.ts`) は timing 由来の flake を起こさない (AC2-5)
  - **a11y 互換**: 既存 reduced-motion ルールが新中間キーも停止する。`<ruby>` 構造は CSS 変更のため影響なし (AC2-4 / R-005)
  - **立体感の表現は控えめ**: `box-shadow` 不透明度 0.3 と blur 30px は「めくっていることが分かる」最小限の主張。子供向けプロダクトの優しいトーンを崩さない
  - **`perspective` 1500px の妥当性**: モックの見開きステージは 900〜1100px 幅。`perspective / width ≈ 1.4〜1.7` の範囲は一般的な web の 3D ページめくり実装の標準値域に収まる (1000〜2000px)。`transform-style: preserve-3d` を併用することで子の `rotateY` が平面投影されない
  - **easing `cubic-bezier(0.2, 0.8, 0.2, 1)`**: Material Design "standard easing" として広く使われる値で、Web プロダクトのユーザー期待値と整合。線形 ease より自然な減速感がある
  - **将来の拡張余地**: Phase 3 で drag-to-flip / ライブラリ導入を検討する場合も、`perspective` と `box-shadow` のキーフレーム構造はそのまま流用できる
- **Rejected Alternatives**:
  - **3D 紙めくりライブラリ (`react-pageflip` 等)**: bundle gzip +20〜40 kB、API が `<HTMLFlipBook>` ラッパ前提で `useViewerNav` 抽象との整合が崩れる。子供向けプロダクトの控えめなトーンには過剰
  - **Framer Motion のレイアウトアニメ**: gzip +30〜40 kB で AC2-6 違反。本フェーズの「控えめに」要件にも合わない
  - **ページ厚みの擬似要素 (`::before` でページ束)**: 装飾は綺麗だが ViewerA / ViewerB 両方に手を入れる必要があり、レスポンシブの破綻リスクが高い。Phase 3 候補
  - **`box-shadow` 不透明度 0.5+**: 目立ちすぎて子供向けプロダクトの柔らかさを損なう。analyst 案の 0.3 を採用
  - **`perspective` を CSS 変数化 / 動的指定**: 端末別最適化はメリットあるが、本 Phase の控えめスコープを逸脱。Phase 3 で R-021 が現実化したら再評価
  - **reduced-motion.css に新規セレクタ追加**: 既存ルールが網羅しているため不要。冗長な追加は避ける
- **Phase 3 での見直し方針**:
  - R-021 が現実化（端末によって perspective が歪む / 影が見づらい）した場合は、`clamp()` を使った動的 `perspective` 指定や `--shadow-strength` の CSS 変数化を検討
  - drag-to-flip を導入するなら `@use-gesture/react` + `--page-turn-progress` の組み合わせを再評価（ADR-010 Phase 2 見直し方針も参照）
  - 3D 紙めくりライブラリは「控えめ」を捨てる判断と一緒に再検討

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
TASKS: 7
NEXT: developer
```
