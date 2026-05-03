# Handoff: えほんやさん（Ehon）— 子供用絵本サイト

## 概要

3〜5歳（未就学児）向けの、著作権フリーの童話・昔話を読める日本語の絵本ウェブアプリ。

3つの主要ビュー：
1. **本棚（ホーム）** — ２種類のレイアウトを切り替え可能（立てかけ書架／表紙ならべ）
2. **絵本ビュアー** — ２種類のレイアウトを切り替え可能（見開き／全画面）
3. **「あたらしいおはなし」モーダル** — AI生成のプレースホルダー

将来的にLLM（`claude-haiku-4-5` 等）を使ってオリジナル童話を生成する想定。現在はモックデータで動作。

## 添付ファイルについて

このバンドル内の HTML/JSX/CSS は **デザインリファレンスとしての HTML プロトタイプ** です。
本番コードとして直接コピーするものではなく、「対象コードベース既存の環境（React, Next.js, Vue, SwiftUI, ネイティブ等）で同じ見た目・挙動を再現する」ことが目標です。
コードベースが未確定の場合は、プロジェクトに最適なフレームワーク（推奨：React + Vite、または Next.js App Router）を選んで実装してください。

## Fidelity

**ハイファイ (hi-fi)** — 配色、タイポグラフィ、間隔、相互作用すべて確定済み。コードベースのコンポーネントライブラリ（既存のあれば）と整合させつつ、ピクセルパーフェクトに再現してください。

---

## スクリーン構成

### 1. 本棚 案A — 立てかけ書架（`shelf-a`）

**用途**：木製本棚に背表紙が並ぶ、温かみのある書架メタファ。

**レイアウト**
- 縦フレックスフルビューポート
- ヘッダー：左にロゴ＋サブタイトル、右に本棚切替ピル
- グリーティング（中央寄せ、見出し＋サブテキスト）
- タグフィルター（横並びチップ）
- 木製シェルフ本体：
  - 木目のリピートグラデーション背景
  - インナーパディング 50px 60px 0
  - インセットシャドウ＋落ち影
  - 上端右に「ランプ」「球体」のデコ
- 本（背表紙）の横並び：
  - 各本は `width 58–70px × height 230–260px`（インデックスでバリエーション）
  - 縦書き (`writing-mode: vertical-rl`) のタイトル
  - 下部に絵文字プレースホルダー
  - hover で `translateY(-12px) rotate(-2deg)`
- 「あたらしいおはなし」ブックエンド：破線ボーダーのプレースホルダー
- 床板：濃い木目グラデーション、下方向にシャドウ

### 2. 本棚 案B — 表紙ならべ（`shelf-b`）

**用途**：表紙が一覧できる、書店風グリッド。

**レイアウト**
- ヘッダー（案Aと共通）
- グリーティング（左寄せ：eyebrow ラベル＋大見出し、右に件数）
- タグフィルターセグメント
- グリッド：`repeat(auto-fill, minmax(220px, 1fr))`、gap 28px
- 各カード：
  - 表紙：`aspect-ratio 3/4`、グラデーション背景 (`coverColor → coverAccent`)
  - 製本の溝（左 14px に縦線）
  - 著者バッジ（左上、半透明白）
  - 中央に絵文字（`font-size: 92px`、ドロップシャドウ）
  - タイトル（左下、Klee One 28px、テキストシャドウ）
  - 棚影 (`-8px 0 0 + -8px 0 16px`) で立体感
  - hover で `translateY(-6px)`
  - メタ：タイトル＋説明＋ミニタグ表示
- 末尾に「じぶんでつくる」破線カード

### 3. ビュアー 案A — 見開き

**用途**：左ページ＝挿絵、右ページ＝本文の伝統的な絵本フォーマット。

**レイアウト**
- 全画面オーバーレイ (`position: fixed; inset: 0`)
- 上部ツールバー：「← ほんだなへ」、タイトル、ふりがな切替、文字サイズ ±、夜モード、ビュアー A/B 切替
- 4px の進捗バー
- 中央に本（最大 1100px、`aspect-ratio: 16/10`）：
  - 中央の谷折り（24px のグラデーション縦帯）
  - 左ページ：`background: page.bg`、絵文字 140px、placeholder-tag
  - 右ページ：パディング 60px、本文（`line-height: 2`、可変フォントサイズ）、ページ番号
  - 表紙ページ（`pageIndex === 0`）：左に表紙絵、右にタイトル＋説明＋「よみはじめる」CTA
- 左右に円形ナビボタン（56px、`var(--ink)` 背景、シャドウ付き）
- ←/→ キー、Esc キーでナビゲーション

### 4. ビュアー 案B — 全画面背景

**用途**：背景全画面に挿絵、下部に本文カードを浮かべる現代的レイアウト。

- 背景：`page.bg` 全画面
- 中央に絵文字 280px（`floaty` アニメーション、4秒ループ）
- 下部に「テープで貼った」テキストカード（`var(--paper)` 背景、テープ装飾、最大 760px）
- 表紙ページ：CTA を中央に、タイトルは白＋黒シャドウで大きく表示
- ページ遷移：背景はスライドイン、カードは下から浮上

---

## デザイントークン

### カラー（CSS 変数）

```css
--paper:        #FBF3E0;  /* 和紙クリーム背景 */
--paper-2:      #F4E6C8;  /* やや濃い背景 */
--ink:          #3D2F1F;  /* 墨色（黒の代わり） */
--ink-soft:     #6B5742;  /* 弱い文字 */
--terracotta:       #E07856;  /* メインアクセント（変更可能） */
--terracotta-deep:  #C24D2C;
--mustard:       #E8B53A;  /* 黄 */
--mustard-soft:  #F2D88A;
--matcha:        #7FA886;  /* 抹茶 */
--matcha-deep:   #4F7A57;
--sakura:        #F2A6B8;  /* 桜 */
--sky:           #A9D6E5;  /* 空 */
--sumi:          #2B2419;  /* 濃墨 */
--shelf-wood:        #8B5A2B;
--shelf-wood-dark:   #5C3A1E;
--shelf-wood-light:  #A87545;

/* 夜モード */
--night-bg:        #1F2440;
--night-paper:     #2A2F4D;
--night-ink:       #F5EBD2;
--night-ink-soft:  #C9BFA8;
```

### タイポグラフィ

`--font-body` / `--font-display` は CSS 変数として切替可能。Tweaks で 6 プリセットを提供：

| ID | 表示名 | display | body |
|----|------|---------|------|
| `rounded` (デフォルト) | やわらか丸ゴシック | Klee One | M PLUS Rounded 1c |
| `udp` | UD教科書体 | BIZ UDPGothic | BIZ UDPGothic |
| `klee` | クレヨン手書き | Klee One | Klee One |
| `pop` | ポップ手描き | Hachi Maru Pop | Kosugi Maru |
| `maru` | やさしい丸ゴシ | Zen Maru Gothic | Zen Maru Gothic |
| `mincho` | 古風な明朝 | Shippori Mincho | Shippori Mincho |

すべて Google Fonts。本文 `line-height: 2`、`letter-spacing: 0.02em`。

### 間隔・角丸・影

- 主な角丸：4px / 8px / 14px / 18px / 999px（ピル）
- カード影：`0 12px 24px rgba(0,0,0,0.18)`
- 浮きカード影：`0 30px 60px rgba(0,0,0,0.18)`
- ボタン影：`0 3px 0 var(--terracotta-deep)`（押下式）

### アニメーション

- 表紙→本文めくり：`flipNextLeft` 0.55s ease-in（左ページが Y 軸回転）
- 案B ページ遷移：`slideInRight` 0.5s ease（背景＋カード）
- 案B 絵文字：`floaty` 4s ease-in-out infinite（上下＋微回転）
- ビュアー入場：`viewerIn` 0.35s ease（フェード＋スケール）

---

## 機能 / 相互作用

### ふりがな（ルビ）

データは `桃太郎{ももたろう}` 形式。`components/ruby.jsx` の `renderRuby()` でパースし `<ruby>桃太郎<rt>ももたろう</rt></ruby>` に変換。
非表示は `.no-ruby rt { display: none }` で CSS 制御。

### 文字サイズ

`16〜36px`、2px ステップ。本文の `font-size` インラインスタイル経由。

### 夜モード

ルートに `.night` クラス、または `.eh-viewer.night`。背景・文字・パネルを夜パレットに切替。

### キーボード

- `→`：次のページ
- `←`：前のページ
- `Esc`：ビュアー閉じる

### タグフィルター

- 単一選択セグメント（"" = ぜんぶ）
- 由来粒度のみ：「グリム童話」「日本昔話」など
- 物語データの `tags` 配列にマッチ
- 該当なしは「🔍 このタグの えほんは まだないよ」を表示

### Tweaks パネル

ホスト側がツールバーから ON/OFF。プロトコル：
- `window.parent.postMessage({type: '__edit_mode_available'}, '*')` で利用可能を通知
- `__activate_edit_mode` / `__deactivate_edit_mode` メッセージで開閉
- 値変更時に `__edit_mode_set_keys` で永続化リクエスト

実コードベースで再現する場合は、独自の設定ストア（Zustand / Redux / Context など）に置き換え、URL クエリ or localStorage に永続化するのが自然。

---

## 状態管理

| 状態 | 型 | 用途 |
|------|----|------|
| `openId` | `string \| null` | 開いている絵本の ID。null の時は本棚表示 |
| `selectedTags` | `string[]` | フィルター中のタグ（現在は単一選択を想定） |
| `showAdd` | `boolean` | 「あたらしいおはなし」モーダル表示 |
| `pageIndex` | `number` | 現在のページ。0 = 表紙、1..N = 本文 |
| `flipDir` | `"next" \| "prev" \| null` | めくり方向（CSS アニメに使用） |
| `tweaks.*` | various | フォント、ふりがな、文字サイズ、夜モード、アクセント色、本棚／ビュアーのバリアント |

ビュアー内のキーリスナーは `useViewerNav` フックで開閉時に登録／解除。

---

## データモデル

```ts
interface Story {
  id: string;            // 一意 ID
  title: string;         // タイトル
  titleRuby: string;     // タイトルのルビ付き形式
  author: string;        // 「グリム童話」「日本昔話」など
  origin: "グリム" | "日本" | string;
  tags: string[];        // 由来粒度。例: ["グリム童話"], ["日本昔話"]
  coverColor: string;    // 表紙メイン色
  coverAccent: string;   // 表紙アクセント色
  spine: string;         // 背表紙色（案A）
  description: string;   // 説明文
  placeholderEmoji: string; // 仮絵
  pages: Array<{
    scene: string;  // 挿絵スロット ID（後で実画像に差し替え）
    bg: string;     // 当該ページの背景色
    text: string;   // 通常テキスト
    ruby: string;   // ルビ付きテキスト
  }>;
}
```

## レスポンシブ

- **〜900px (タブレット)**：ヘッダー縮小、本棚A 横スクロール、グリッド 2 列、見開きビュアー縦積み
- **〜560px (スマホ)**：ロゴ縮小、サブタイトル非表示、グリッド 2 列固定、ツールバー圧縮、ナビボタン 38px
- `@media (hover: none)` で hover 効果を抑制

## アクセシビリティ

- `<ruby>` を使用しスクリーンリーダーに親仮名 → 読み を伝える
- ナビボタンは `aria-label` 必須
- キーボード操作完備
- 4.5:1 のコントラスト比を担保（夜モードの`--mustard`はチェック必要）

## 著作権・コンテンツ

- 物語本文は著作権が切れた古典童話の再話（赤ずきん、桃太郎、白雪姫、つるの恩返し、ブレーメンの音楽隊、かさじぞう）
- LLM で新規生成する場合は `window.claude.complete` 風の API を介して、3〜5歳向けの優しい言葉、起承転結を持った 5〜7 ページのテキストを生成
- 挿絵はすべて絵文字＋色面のプレースホルダー。実画像に差し替える際は `pages[i].scene` 名を ID として使用

## Assets

- 全絵文字（プレースホルダー）— OS ネイティブ絵文字を使用
- Google Fonts — 上記書体ファミリー
- 実画像は **未提供**。本実装時には絵本ごとに 7 枚程度の挿絵が必要

## バンドル内のファイル

```
Ehon.html              — エントリポイント
app.jsx                — メイン App、Tweaks 統合、状態管理
data/stories.js        — 6 つの物語データ（モック）
components/
  ruby.jsx             — ルビパーサ
  Shelves.jsx          — ShelfA, ShelfB, TagFilter, ShelfSwitcher
  Viewers.jsx          — ViewerA, ViewerB, ViewerBar, useViewerNav
styles/ehon.css        — 全スタイル（CSS 変数、レスポンシブ）
tweaks-panel.jsx       — Tweaks パネルランタイム（実装時は不要）
```

## 推奨される実装ステップ（Claude Code 側）

1. プロジェクトの既存環境を確認（React/Next/Vite/SwiftUI 等）
2. デザイントークンを既存テーマに統合 — `tailwind.config.ts` か CSS カスタムプロパティ
3. `Story` 型を共有（TypeScript 推奨）
4. データレイヤを LLM 呼び出しに差し替え（API ルート＋キャッシュ）
5. 静的ページから順に実装：本棚 → ビュアー → ルビ → ふりがな切替 → 夜モード → アニメーション
6. 状態管理：本棚／ビュアーのバリアント切替は URL クエリで保持すると共有しやすい
7. 挿絵：物語ごと `pages[i].scene` をキーにアセット管理（後から img に差し替え）
