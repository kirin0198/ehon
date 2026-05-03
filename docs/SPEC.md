# Specification: えほんやさん（Ehon）

> Created: 2026-05-04
> Last updated: 2026-05-04
> Source: DISCOVERY_RESULT.md (2026-05-04), INTERVIEW_RESULT.md (2026-05-04), SCOPE_PLAN.md (2026-05-04), project-rules.md (2026-05-04)
> Update history:
>   - 2026-05-04: Initial draft (spec-designer / Delivery Flow Light プラン)

## 0. サービス名（正式決定）

- 表示名: **えほんやさん**
- 英字表記 (URL / OGP / `<title>` 補助 / GitHub リポジトリ名候補): **Ehon**
- パッケージ名 (`package.json` `name`): **`ehon`**
- 命名根拠:
  - Discovery / project-rules / モック README で全面的に「えほんやさん（Ehon）」が暫定使用されており、変更コストに対する便益が低い
  - 子ども（3〜5 歳）にとって意味が明快で、保護者が共有しやすい
  - 暫定名から正式名への昇格として一貫性が最大化される
- 採用反映先 (Delivery / Operations 工程で適用):
  - `package.json` `name: "ehon"` / `description: "えほんやさん"`
  - `<title>えほんやさん</title>`、OGP `og:title`、`og:site_name`
  - `README.md` 見出し、`docs/*.md` のタイトル
  - `<header>` 内ロゴ表記、フッター著作表示

## 1. プロジェクト概要

### Purpose / Background

- 3〜5 歳（未就学児）と保護者が、著作権の心配なく古典童話・昔話を読める日本語の絵本 Web アプリを提供する
- 親子読み聞かせシーンに必要なふりがな・文字サイズ・夜モード・フォント切替などの読みやすさ調整を備える
- 既存のハイファイモック（Claude Design 由来 / `Ehon.html` + `app.jsx` + `tweaks-panel.jsx` + `components/` + `data/` + `styles/`）をデザインリファレンスとし、React 18 + TypeScript + Vite のビルド環境を持つ本実装に作り直す
- Vercel にパブリック公開し、保育園・祖父母宅などでも端末を選ばず利用できる「家庭内 Web 絵本ライブラリ」を実現する

### Scope (IN / OUT)

**IN (MVP)**
- 著作権切れ古典 6 作品（赤ずきん / 桃太郎 / 白雪姫 / つるの恩返し / ブレーメンの音楽隊 / かさじぞう）の本棚 → ビュアー動線
- 本棚 2 バリアント（ShelfA: 立てかけ書架 / ShelfB: 表紙ならべ）
- ビュアー 2 バリアント（ViewerA: 見開き / ViewerB: 全画面背景）
- 表紙 + 「よみはじめる」CTA、ページ送り（ボタン / キーボード ←/→ / タップ）、Esc でビュアー閉じる
- ふりがな ON/OFF（`<ruby>` 構造維持 + CSS 制御）
- 文字サイズ 16〜36px / 2px ステップ、夜モード ON/OFF
- フォントプリセット 6 種、アクセント色 4 色程度の選択（Should）
- Tweaks 設定の localStorage 永続化（フォント / ふりがな / 文字サイズ / 夜モード / アクセント色 / 本棚バリアント / ビュアーバリアント）
- 物語データはビルド時静的（`src/data/stories.ts`）
- レスポンシブ（PC / タブレット 〜900px / スマホ 〜560px）
- アクセシビリティ（WCAG 2.1 AA 相当 / キーボード完結 / `<ruby>` SR 互換 / `prefers-reduced-motion` / コントラスト 4.5:1 / `@media (hover: none)`）
- **実画像挿絵（FR-021）**: `public/illustrations/{storyId}/{scene}.webp`（表紙は `cover.webp`）を読み込み表示。**画像不在時は `placeholderEmoji` + `bg` 色面でフォールバック**。Delivery 中にユーザーが順次配置可能

**OUT (MVP 完全 Out of Scope)**
- LLM による新作物語生成（UI からも削除）
- TTS（読み上げ）
- PWA / オフライン対応
- 認証 / 親モード / 個人情報の取り扱い
- i18n（日本語以外）
- アナリティクス
- バックエンド / DB / API キー管理（将来 LLM 連携時に再検討）

## 2. 推奨技術スタック

| Layer | Technology | 選定根拠 |
|------|----------|---------|
| 言語 | TypeScript 5.x (strict) | project-rules.md で確定。型安全性により子供向けプロダクトでも保守性を担保 |
| フレームワーク | React 18 | 既存モックが React 18 + Babel Standalone CDN のため踏襲。コンポーネントモデルがシンプルで個人プロジェクトに最適 |
| ビルド | Vite | 高速 HMR、TS/JSX ネイティブサポート、Vercel との相性良好 |
| パッケージ管理 | pnpm | project-rules.md で推奨。ディスク効率と並列性 |
| 状態管理 | React Context + `useReducer` + localStorage | Zustand 候補もあるが、Tweaks 1 種類のみで Context で十分。依存削減 |
| ルーティング | なし（単一画面 + 状態切替） | 本棚/ビュアーは `openId` 状態で切替するため不要。URL クエリは限定的に使用（FR-020） |
| ふりがな処理 | 自前パーサ (`src/lib/ruby-parser.ts`) | `桃太郎{ももたろう}` 記法 → `<ruby>` 変換。外部依存なし |
| スタイリング | CSS Custom Properties（モック踏襲） + CSS Modules | デザイントークン（`--paper`, `--ink`, `--terracotta` 他）はそのまま `:root` に移植 |
| Lint / Format | ESLint + `@typescript-eslint` + Prettier | project-rules.md で確定 |
| ユニットテスト | Vitest + @testing-library/react | Vite 統合・高速 |
| E2E テスト | Playwright（PC / iPad プロファイル） | クロスブラウザ・キーボード操作・iPad Safari `100vh` ずれ検証に必要 |
| ホスティング | Vercel (Operations Flow で確定) | 静的サイト・PR プレビュー・GitHub Flow 親和 |

> アーキテクチャ詳細・依存ライブラリ列挙・ディレクトリ実装図は `architect` が `ARCHITECTURE.md` で確定する。

### 不採用候補と却下理由

- Next.js: 静的単一ページのため SSR / Routing の便益なし。バンドル増を回避
- Zustand: Tweaks の単一ストアのみで Context + Reducer で十分。依存削減
- Tailwind CSS: モックの CSS 変数体系を優先。導入はスタイル方針の二重化を招く
- Babel Standalone (現モック): 本番ビルド前提に切り替えるため非採用

## 3. ユーザーストーリー / ペルソナ

### Persona

- **P-1: 子ども（3〜5 歳, 直接ユーザー）**
  - 文字を覚えはじめ。ひらがな主体、ふりがなが必要
  - タッチ操作中心、誤タップしやすい（タップ領域 ≥ 44×44px が必須）
  - 注意持続時間が短く、画面遷移は直感的でなければならない

- **P-2: 保護者（親, 同伴ユーザー / 設定担当）**
  - 寝かしつけ・読み聞かせ時に夜モード・文字サイズを調整
  - スマホ・タブレット両方で利用、読み聞かせの最中に親が設定変更する
  - 著作権・コンテンツの安全性を気にする

- **P-3: プロジェクトオーナー（本人, 開発者・運用者）**
  - GitHub Flow で物語を追加・挿絵を差し替え
  - Vercel デプロイの容易性、保守性、将来の LLM 拡張余地を重視

- **P-4: 一般訪問者（偶発的閲覧者）**
  - パブリック公開のため誰でもアクセス可。コンテンツが公序良俗に反しないことのみ要請

### Use Case 一覧

| # | Use Case | Primary Actor | Priority |
|---|----------|---------------|----------|
| UC-001 | 本棚で物語一覧を見る | P-1 / P-2 | Must |
| UC-002 | 本棚レイアウトを切り替える（ShelfA ⇔ ShelfB） | P-2 | Must |
| UC-003 | タグで物語を絞り込む | P-2 | Must |
| UC-004 | 物語をひらいてビュアーに入る | P-1 / P-2 | Must |
| UC-005 | ビュアーで表紙を見て「よみはじめる」する | P-1 | Must |
| UC-006 | ページを送る・戻す（ボタン / キーボード / タップ） | P-1 / P-2 | Must |
| UC-007 | ビュアーを閉じて本棚に戻る（Esc / 戻るボタン） | P-1 / P-2 | Must |
| UC-008 | ビュアーレイアウトを切り替える（ViewerA ⇔ ViewerB） | P-2 | Must |
| UC-009 | ふりがなを ON/OFF する | P-2 | Must |
| UC-010 | 文字サイズを調整する | P-2 | Must |
| UC-011 | 夜モードを ON/OFF する | P-2 | Must |
| UC-012 | フォントプリセットを切り替える | P-2 | Should |
| UC-013 | アクセント色を切り替える | P-2 | Should |
| UC-014 | Tweaks パネルで設定を一括操作する | P-2 | Should |
| UC-015 | 設定を再訪時に復元する（localStorage） | P-1 / P-2 | Must |
| UC-016 | レスポンシブ環境で快適に閲覧する | 全 | Must |
| UC-017 | キーボードのみで全操作を完結する | P-2（a11y） | Must |
| UC-018 | 画像不在シーンをフォールバック表示で読み続ける | P-1 / P-3 | Must |
| UC-019 | URL クエリでバリアントを共有する（任意目標） | P-2 | Could |

## 4. 機能要件（Use Case 詳細）

### UC-001: 本棚で物語一覧を見る
- **概要**: ホーム画面（本棚）にアクセスし、6 作品の表紙一覧を見る
- **前提条件**: なし（パブリック公開、初回アクセスでも動作）
- **正常フロー**:
  1. ユーザーがアプリ URL にアクセス
  2. アプリは `src/data/stories.ts` から 6 作品を読み込む
  3. 既定の本棚バリアント（ShelfA: 立てかけ書架）で一覧を表示
- **例外フロー**:
  - localStorage 利用不可時 → デフォルト Tweaks (`TWEAK_DEFAULTS`) で表示。エラー表示はしない（IR-002）
- **受入基準**:
  - 6 作品すべての表紙が表示される
  - 各表紙には絵文字プレースホルダー（または実画像）+ タイトル + 著者（「グリム童話」「日本昔話」）が表示される
  - 物語データは `Story[]` として型安全に提供される

### UC-002: 本棚レイアウトを切り替える
- **概要**: ShelfA（立てかけ書架）と ShelfB（表紙ならべ）を切り替える
- **前提条件**: 本棚画面を表示中
- **正常フロー**:
  1. 本棚右上のセグメントピル「立てかけ / 表紙グリッド」を操作
  2. または Tweaks パネルから切替
  3. レイアウトが即座に切り替わり localStorage に永続化
- **受入基準**:
  - 切替後にリロードしても同じレイアウトで再現される
  - 両バリアント共通で 6 作品すべて表示される

### UC-003: タグで物語を絞り込む
- **概要**: タグフィルター（"" = ぜんぶ / 「グリム童話」/ 「日本昔話」）で表示作品を絞り込む
- **正常フロー**:
  1. タグセグメントを選択（単一選択）
  2. 該当 `tags` を持つ作品のみ表示
- **例外フロー**:
  - 該当作品ゼロ → 「🔍 このタグの えほんは まだないよ」を表示（FR-018, Could だが MVP 取込）
- **受入基準**:
  - グリム童話 = 3 作品 / 日本昔話 = 3 作品 / "" = 6 作品の絞り込みが正しい

### UC-004: 物語をひらいてビュアーに入る
- **概要**: 本棚で表紙をクリック / タップしてビュアーを開く
- **正常フロー**:
  1. 表紙を操作（クリック / タップ / Enter キー）
  2. アプリは `openId` を該当 `story.id` に設定
  3. ビュアー（既定 ViewerA）が表示され、`pageIndex=0` の表紙ページを表示
- **受入基準**:
  - 6 作品いずれもビュアーで開ける
  - 開封後、ビュアー閉じ操作（Esc / × ボタン）で本棚に戻れる
  - キーボード操作（Tab → Enter）でも開封可能（a11y）

### UC-005: 表紙ページを見て「よみはじめる」する
- **概要**: ビュアー内の表紙ページから本文へ進む
- **正常フロー**:
  1. ビュアーが `pageIndex=0`（表紙）を表示
  2. 表紙には物語タイトル（ルビ付き）+ プレースホルダー絵文字 or 実画像（cover.webp）+ 「よみはじめる」CTA
  3. CTA 操作で `pageIndex=1`（本文 1 ページ目）へ
- **受入基準**:
  - 表紙の CTA タップ領域は 44×44px 以上
  - 表紙画像は `public/illustrations/{storyId}/cover.webp` を eager 読み込み（LCP 最適化）

### UC-006: ページを送る・戻す
- **概要**: 本文ページを進めたり戻したりする
- **正常フロー**:
  1. ナビボタン（◀ / ▶, 56px 円形）/ キーボード（←/→）/ タップ（画面左右半分）で送る
  2. 最終ページに到達したら次送りは無効化
- **受入基準**:
  - 全 3 操作系（ボタン / キーボード / タップ）が機能する
  - 進捗バー（4px）が現在位置を反映する（Should）
  - `prefers-reduced-motion: reduce` のとき遷移アニメは停止 / 短縮

### UC-007: ビュアーを閉じる
- **概要**: ビュアーから本棚へ戻る
- **正常フロー**: Esc キー / × ボタン / 画面外クリック
- **受入基準**:
  - 閉じた後、フォーカスは元のクリック元（表紙要素）へ復帰（IR-007）
  - 本棚は閉じる前のスクロール位置を保持（できれば）

### UC-008: ビュアーレイアウトを切り替える
- **概要**: ViewerA（見開き）と ViewerB（全画面背景）を切り替える
- **正常フロー**: ビュアーツールバー右の A/B トグル / Tweaks パネル
- **受入基準**:
  - 切替時に現在ページ位置を保持
  - 切替設定は localStorage に永続化

### UC-009: ふりがな ON/OFF
- **概要**: ルビ表示を切り替える
- **正常フロー**: Tweaks パネル → ふりがなトグル
- **受入基準**:
  - DOM 上の `<ruby>` 構造は維持し、`<rt>` のみ CSS `display: none` で切替
  - スクリーンリーダー（VoiceOver / NVDA）はルビ ON 時に「漢字 → 読み」の順で読み上げる
  - 切替が即座に画面に反映される

### UC-010: 文字サイズ調整
- **概要**: 本文文字サイズを 16〜36px / 2px ステップで調整
- **正常フロー**: ビュアーツールバーの ± ボタン / Tweaks パネルのスライダー
- **受入基準**:
  - 範囲外への変更は無効化
  - 値は localStorage に永続化

### UC-011: 夜モード ON/OFF
- **概要**: 寝る前読み聞かせ用の暗色テーマ切替
- **正常フロー**: Tweaks パネル → 夜モードトグル / ビュアーツールバー
- **受入基準**:
  - `<html>` または `<body>` に `.night` クラスを付与
  - 主要組み合わせのコントラスト比 4.5:1 以上（visual 検証で R-001 を解消）
  - 切替は即座に全画面へ波及

### UC-012: フォントプリセット切替（Should）
- **概要**: 6 種（rounded / udp / klee / pop / maru / mincho）から選択
- **受入基準**:
  - 切替時に `--font-body` / `--font-display` CSS 変数を更新
  - Google Fonts 取得失敗時は `system-ui, sans-serif` にフォールバック（IR-003）
  - `font-display: swap` でレイアウトずれを最小化

### UC-013: アクセント色切替（Should）
- **概要**: 4 色程度のアクセント色から選択
- **受入基準**:
  - 切替時に `--terracotta`（または相当 CSS 変数）を更新
  - 候補数・色値の正式確定は ux-designer / visual-designer

### UC-014: Tweaks パネル一括操作（Should）
- **概要**: 全 Tweaks を 1 つのパネルから操作
- **受入基準**:
  - Tweaks パネルから FR-008 〜 FR-013 がすべて操作可能
  - パネルは画面右下のフローティングで、開閉可能
  - **モックの `tweaks-panel.jsx` ホスト連携プロトコル（`__edit_mode_*` postMessage）は本実装で再利用しない**

### UC-015: 設定の永続化（localStorage）
- **概要**: Tweaks 設定を再訪時に復元
- **受入基準**:
  - キー: `eh.tweaks`（モック踏襲）
  - 永続化対象: `shelfVariant` / `viewerVariant` / `fontSize` / `ruby` / `night` / `accent` / `font`
  - localStorage 利用不可環境では in-memory フォールバック（IR-002, R-003）

### UC-016: レスポンシブ
- **概要**: PC / タブレット / スマホで丁寧に表示
- **受入基準**:
  - PC（〜∞）/ タブレット（〜900px）/ スマホ（〜560px）の 3 ブレークポイント
  - iPad Safari の `100vh` ずれ対策（`100dvh` 採用、フォールバック `100vh`, R-004）

### UC-017: キーボード完結
- **概要**: マウス / タッチなしで全操作を完了
- **受入基準**:
  - Tab で本棚 → 表紙 → ビュアー → ページ送り → 閉じるが順次フォーカス可能
  - Enter で表紙オープン、←/→ でページ送り、Esc でビュアー閉じる
  - すべてのインタラクティブ要素に `aria-label` を付与

### UC-018: 画像不在シーンのフォールバック表示
- **概要**: `public/illustrations/{storyId}/{scene}.webp` が未配置でもアプリが破綻しない
- **正常フロー**:
  1. 各ページ表示時、画像 URL を `<img>` `src` に設定
  2. `onError` ハンドラ（または事前 fetch / `<img>` のロード失敗）でフォールバックモードに遷移
  3. フォールバックでは `placeholderEmoji` を中央配置 + `bg` 色面の背景で表示
- **代替フロー**:
  - 設計上、`<picture>` を使い `<source srcset="...">` 失敗で `<img>` フォールバックも検討（developer 判断）
  - 単純化のためまずは `<img onError>` で実装可
- **受入基準**:
  - 画像不在のシーン（表紙含む）でアプリがクラッシュしない / 白画面にならない
  - フォールバック時も読書動線（ページ送り / 閉じる）は完全に機能する
  - cover.webp 未配置時は本棚の表紙も `placeholderEmoji` + `coverColor` 色面で表示
  - **Delivery 中はすべてのシーンが画像なしで完成し、ユーザーが画像を順次 commit していくことで段階的に置き換わる**

### UC-019: URL クエリでバリアント共有（Could / 任意目標）
- **概要**: `?shelf=B&viewer=A` のように URL クエリでバリアントを切り替え可能にする
- **判断**: architect 段階で実装コスト確認後 MVP 取込を判定。Could グレードのため取り込まない場合も許容

## 5. 非機能要件

### Performance
- 初回 LCP ≤ 2.5s（高速回線・標準 PC）
- 物語遷移（本棚 ↔ ビュアー）≤ 100ms
- 初回 JS バンドル ≤ 200KB gzipped
- 表紙画像は eager 読み込み、シーン画像は `loading="lazy"`
- 画像推奨スペック（FR-021 関連 / R-012）:
  - フォーマット: WebP（必須）
  - 解像度: 表紙 1024×1024 / シーン 1600×900
  - サイズ: 1 枚 ≤ 200KB

### Accessibility
- WCAG 2.1 AA 相当のコントラスト比 4.5:1（夜モード `--mustard` を含めて要検証 / R-001）
- キーボードのみで全操作完結（Tab / Enter / ←→ / Esc）
- スクリーンリーダー互換（`<ruby>` + `<rt>` 構造維持 / R-005）
- `prefers-reduced-motion: reduce` で `flipNextLeft` / `floaty` / `slideInRight` / `viewerIn` を無効化（R-006）
- `@media (hover: none)` で hover 効果を抑制（タッチ阻害防止）
- タップ領域 ≥ 44×44px

### Security
- 個人情報を一切扱わない
- localStorage 用途は端末内設定のみ
- API キー / シークレットを含めない（`.env*` コミット禁止 / Hook B 保護）
- 将来 LLM 連携時は BFF 経由で鍵を保持（フロント直露出禁止）

### Compatibility
- Chrome / Safari / Edge / Firefox の最新 2 バージョン
- iPad Safari 含む。iPad / Android タブレット主要解像度（1024×768〜1366×1024）でレイアウト崩れなし
- iOS Safari `100vh` ずれは `100dvh` で対策（R-004）

### Maintainability
- TypeScript strict / ESLint / Prettier / Vitest を CI で通す
- 1 ファイル ≤ 300 行目安
- 関数は単一責務、`useEffect` は明示グループ化
- マジックナンバー禁止（CSS 変数 / `const`）
- `any` 禁止（やむを得ない場合は `unknown` + 型ガード）
- 物語追加運用は `src/data/stories.ts` への PR + `public/illustrations/{storyId}/` への画像配置（doc-writer が README 化）

### Licensing
- 物語本文: 著作権切れ古典の **再話** のみ。再話文は本プロジェクト著作物として **MIT** 想定
- 画像: ユーザー本人作成 or CC0 / MIT 同等のみ許可（R-013）
- フッター文言:
  ```
  原作: パブリックドメイン（古典童話）
  再話・コード: © {year} えほんやさん（MIT）
  ```
  Operations Flow の `infra-builder` が `LICENSE-illustrations.md` 雛形を整備

## 6. データモデル（概念レベル）

### Entity 一覧

- **Story**（物語、ビルド時静的 = `src/data/stories.ts`）
- **Page**（物語のページ、`Story.pages[]` のサブエンティティ）
- **Tweaks**（ユーザー個別設定、localStorage `eh.tweaks`）

### Story 型（概念）

| Field | Type | 必須 | 説明 |
|-------|------|------|------|
| `id` | string | ✓ | 一意キー（"akazukin", "momotaro" 等）。`public/illustrations/{id}/` のディレクトリ名と一致 |
| `title` | string | ✓ | 物語タイトル（プレーン） |
| `titleRuby` | string | ✓ | ルビ記法付きタイトル（`桃太郎{ももたろう}` 形式） |
| `author` | string | ✓ | 表記著者（「グリム童話」「日本昔話」） |
| `origin` | string | ✓ | 由来（「グリム」「日本」） |
| `tags` | string[] | ✓ | タグ配列（フィルター用 / 例: ["グリム童話"]） |
| `coverColor` | string | ✓ | 表紙ベースカラー（CSS color） |
| `coverAccent` | string | ✓ | 表紙アクセントカラー |
| `spine` | string | ✓ | 背表紙カラー（ShelfA 用） |
| `description` | string | ✓ | 一行説明 |
| `placeholderEmoji` | string | ✓ | 画像不在時のフォールバック絵文字 |
| `pages` | Page[] | ✓ | ページ配列。`pages[0]` が表紙ページ扱い、`pages[1..]` が本文 |

### Page 型（概念）

| Field | Type | 必須 | 説明 |
|-------|------|------|------|
| `scene` | string | ✓ | シーン識別子（"forest-girl", "basket" 等）。`public/illustrations/{storyId}/{scene}.webp` のファイル名と一致 |
| `bg` | string | ✓ | ページ背景色（CSS color, フォールバック時の色面） |
| `text` | string | ✓ | 本文プレーンテキスト |
| `ruby` | string | ✓ | ルビ記法付き本文（`漢字{かんじ}` 形式） |

### Tweaks 型（概念）

| Field | Type | 既定値 | 説明 |
|-------|------|--------|------|
| `shelfVariant` | "A" \| "B" | "A" | 本棚バリアント |
| `viewerVariant` | "A" \| "B" | "A" | ビュアーバリアント |
| `fontSize` | number (16〜36, step 2) | 22 | 本文文字サイズ |
| `ruby` | boolean | true | ふりがな ON/OFF |
| `night` | boolean | false | 夜モード |
| `accent` | string (CSS color) | "#E07856" | アクセント色 |
| `font` | string (preset key) | "rounded" | フォントプリセット |

### Relationships

- `Story 1 — N Page`（`Story.pages[]`）
- `Tweaks` は単一インスタンス（ユーザー端末ごとに 1 つ、localStorage `eh.tweaks`）
- `Page.scene` は `public/illustrations/{Story.id}/{scene}.webp` のファイルパスを決定する規約キー

### 物語 6 作品（MVP コンテンツ）

| Story.id | タイトル | author | tags | pages 数 |
|----------|---------|--------|------|---------|
| `akazukin` | 赤ずきん | グリム童話 | ["グリム童話"] | 7 |
| `momotaro` | 桃太郎 | 日本昔話 | ["日本昔話"] | 7 |
| `shirayuki` | 白雪姫 | グリム童話 | ["グリム童話"] | 7 |
| `tsurunoongaeshi` | つるの恩返し | 日本昔話 | ["日本昔話"] | 5 |
| `bremen` | ブレーメンの音楽隊 | グリム童話 | ["グリム童話"] | 5 |
| `kasajizo` | かさじぞう | 日本昔話 | ["日本昔話"] | 5 |

> 合計シーン数: 36（= 7+7+7+5+5+5）。表紙画像 6 枚と合わせて挿絵総数 ≈ 42 枚。

## 7. API 概要

本 MVP では HTTP API は持たない（フロントエンド単一構成）。

将来的な LLM 連携 API（Out of Scope）の構想のみ参考記載:
- `POST /api/generate-story` (BFF, 将来) — フロント直接呼び出し禁止、BFF 経由で `claude-haiku-4-5` 等を呼ぶ

## 8. 制約 / 前提条件

### 技術制約
- フロントエンド単一構成（バックエンド・DB なし）
- React 18 + Vite + TypeScript（strict）+ pnpm
- Vercel ホスティング（静的サイト）
- 既存モック（`Ehon.html` / `app.jsx` / `tweaks-panel.jsx` / `components/` / `data/` / `styles/`）は scaffolder 段階で `mock/` に退避し、本実装では参照のみ
- `tweaks-panel.jsx` のホスト連携プロトコル（`__edit_mode_*` postMessage）は再利用しない

### コンテンツ制約
- 物語は著作権切れ古典の再話のみ
- LLM 新作生成は MVP 完全 Out of Scope
- TTS / PWA / 認証 / i18n / アナリティクスは MVP 範囲外

### 運用制約
- パブリック公開、認証不要
- Output Language: ja（UI コピー / コメント / ドキュメント）
- 物語追加は `src/data/stories.ts` への PR + `public/illustrations/{storyId}/` 画像配置で運用
- 挿絵画像はユーザー本人作成 or CC0 / MIT 同等のみ

### 環境
- ターゲット: PC + タブレット同等優先、スマホは下位互換
- ブラウザ: Chrome / Safari / Edge / Firefox 最新 2 バージョン

## 9. 用語集

| 用語 | 説明 |
|------|------|
| 本棚 (Shelf) | ホーム画面。物語の一覧 |
| ShelfA | 本棚バリアント A: 立てかけ書架（縦置き本のような表現） |
| ShelfB | 本棚バリアント B: 表紙ならべ（カードグリッド） |
| ビュアー (Viewer) | 物語を読む画面 |
| ViewerA | ビュアーバリアント A: 見開き表現 |
| ViewerB | ビュアーバリアント B: 全画面背景表現 |
| Tweaks | ユーザー設定の総称（フォント / ふりがな / 文字サイズ / 夜モード / アクセント色 / バリアント） |
| ルビ記法 | `漢字{かんじ}` 形式の独自記法。パーサが `<ruby><rb>漢字</rb><rt>かんじ</rt></ruby>` に変換 |
| プレースホルダー絵文字 | 実画像不在時のフォールバック表示用 emoji（`Story.placeholderEmoji`） |
| 表紙ページ | `Story.pages[0]` を表紙扱いするのではなく、ビュアーが先頭に「表紙ページ」を独立して挿入する。表紙 → 本文 1 → 本文 2 ... の順 |
| シーン (scene) | `Page.scene` 値。挿絵ファイル名のキーとなる識別子 |
| 夜モード | `.night` クラスで暗色テーマに切替 |

## 10. 未解決事項 (TBD)

| # | 項目 | 仮定 | 解決担当 |
|---|------|------|----------|
| TBD-001 | アクセント色の UI 露出色数と色値 | モック CSS 変数群から 4 色を `ux-designer` / `visual-designer` で選定 | ux-designer |
| TBD-002 | 夜モード `--mustard` のコントラスト 4.5:1 達成可否 | 未達なら夜パレット専用置換色を導入 | ux-designer (lightweight visual default) |
| TBD-003 | URL クエリでのバリアント切替（FR-020 / UC-019）の MVP 取込 | 実装コスト小であれば取込、大きければ Could のまま | architect |
| TBD-004 | 再話文の権利表記（フッター文言） | 仮: 「原作: パブリックドメイン / 再話・コード: © 2026 えほんやさん（MIT）」 | spec-designer 仮確定 → doc-writer |
| TBD-005 | favicon / OGP 画像の用意 | scaffolder が雛形 / Operations Flow visual 段階で確定 | scaffolder + Operations |
| TBD-006 | ふりがな記法 `漢字{かんじ}` バリデーション Lint 要否 | Could 級。test-designer が判断 | test-designer |
| TBD-007 | アナリティクス導入要否 | MVP 未定、Operations Flow `ops-planner` で再判断 | Operations Flow |
| TBD-008 | 物語追加 / 挿絵配置の運用ドキュメント | doc-writer が README に手順記載（推奨スペック含む） | doc-writer |

## 11. 受入条件サマリー（Phase 末で再確認）

- [ ] 本棚 → 物語選択 → 表紙 → 全ページ閲覧 → 戻る が E2E で 100% 通過する
- [ ] 全 Must 機能（FR-001〜010, FR-014〜015, FR-019, FR-021）が動作する
- [ ] 画像不在でもアプリが破綻せずフォールバックで読み続けられる
- [ ] localStorage 不在環境でもエラーで停止しない
- [ ] キーボードのみで本棚 → ビュアー → ページ送り → 戻るが完了する
- [ ] Lighthouse Accessibility ≥ 95
- [ ] バンドル初回 JS ≤ 200KB gzipped
- [ ] 主要組み合わせのコントラスト比 4.5:1 以上（夜モード含む）

---

## AGENT_RESULT

```
AGENT_RESULT: spec-designer
STATUS: success
ARTIFACTS:
  - docs/SPEC.md
HAS_UI: true
PRODUCT_TYPE: service
TBD_COUNT: 8
SERVICE_NAME: えほんやさん（Ehon / package: ehon）
NEXT: ux-designer
```
