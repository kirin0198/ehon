# Interview Result: えほんやさん（Ehon）

> Created: 2026-05-04
> Update history:
>   - 2026-05-04: Initial creation by interviewer (Discovery Flow / Light plan)

## Project Overview

3〜5 歳（未就学児）向けに、著作権切れの古典童話・昔話を読める日本語の絵本 Web アプリ。
親子で一緒に読むことを想定し、ふりがな・文字サイズ・夜モード・フォント切替などのユーザー調整を備える。
現状は Claude Design 由来のハイファイモック（HTML/JSX/CSS, CDN 直読み込み）が存在し、本実装ではこれを
リファレンスとして React 18 + TypeScript + Vite のビルド済みアプリに作り直し、Vercel にパブリック公開する。

## PRODUCT_TYPE

service

Rationale:
- ブラウザでアクセスする Web アプリであり、ホスティング先（Vercel）から HTTP 経由で配信される。
- ローカル CLI / ライブラリ / デスクトップツールではない。
- 認証や DB は持たないが、提供形態としてはネットワーク越しにユーザーへ機能を届ける「service」に分類される。

## Stakeholders

| Stakeholder | Role | Concerns |
|---|---|---|
| 子ども（3〜5歳） | エンドユーザー（直接の読者） | 読みやすいフォント・大きな文字・直感的な操作・絵による補助 |
| 保護者（親） | 同伴ユーザー / 読み聞かせ補助 / 設定担当 | コンテンツの安全性、操作のしやすさ、夜の読み聞かせ（夜モード）、ふりがな ON/OFF |
| プロジェクトオーナー（本人） | 開発者・運用者・コンテンツ管理者 | 技術スタックの保守性、Vercel デプロイの容易性、将来の LLM 連携への拡張余地 |
| 一般訪問者 | 偶発的な閲覧者 | パブリック公開のためアクセス制限なし。コンテンツが公序良俗に反しないこと |

## Requirements

### Functional Requirements

| # | Requirement | Priority | Notes |
|---|---|---|---|
| FR-001 | 本棚（ホーム）画面で物語一覧を表示する | high | 著作権切れの古典 6 作品（赤ずきん / 桃太郎 / 白雪姫 / つるの恩返し / ブレーメンの音楽隊 / かさじぞう） |
| FR-002 | 本棚レイアウトを 2 種類（立てかけ書架=ShelfA / 表紙ならべ=ShelfB）から切り替え可能 | high | モックの `ShelfSwitcher` ピル相当。永続化対象 |
| FR-003 | タグフィルターで物語を絞り込み（由来粒度：「グリム童話」「日本昔話」） | high | 単一選択セグメント。"" = ぜんぶ |
| FR-004 | 物語をクリック/タップしてビュアーで開く | high | `openId` 状態で管理 |
| FR-005 | ビュアーで見開きまたは全画面背景の 2 レイアウト切替（ViewerA / ViewerB） | high | ツールバー右の A/B トグル。永続化対象 |
| FR-006 | 表紙ページ（pageIndex=0）に「よみはじめる」CTA を配置 | high | 1 タップで本文 1 ページ目へ |
| FR-007 | ページ送り（次/前ページ）をボタン・キーボード（←/→）・タップで操作 | high | 円形ナビボタン 56px。Esc でビュアー閉じる |
| FR-008 | ふりがな表示の ON/OFF を切り替え可能 | high | DOM は `<ruby>` を維持しつつ `display:none` で `<rt>` を制御。スクリーンリーダー互換性を維持 |
| FR-009 | 本文の文字サイズを 16〜36px の範囲で 2px ステップ調整 | high | ビュアー上部ツールバーの ± ボタン |
| FR-010 | 夜モード（ナイトテーマ）の ON/OFF | high | `.night` クラスでパレット切替。読み聞かせ時の眩しさ低減 |
| FR-011 | フォントプリセットを 6 種類から選択可能 | medium | rounded（既定）/ udp / klee / pop / maru / mincho。Google Fonts 経由 |
| FR-012 | アクセント色（テラコッタ等）を 4 色程度から選択可能 | medium | CSS 変数 `--terracotta` などを差し替え |
| FR-013 | Tweaks（設定）パネルで上記 FR-008〜FR-012 をまとめて操作 | medium | モックの `tweaks-panel.jsx` の UX を踏襲。ホスト連携 postMessage は不要 |
| FR-014 | Tweaks 設定を localStorage に永続化し、再訪時に復元 | high | `eh.tweaks` キー想定。プロジェクトルール「設定の永続化」と一致 |
| FR-015 | 物語データはビルド時静的（`src/data/stories.ts` にコミット） | high | DB なし。LLM 生成・動的取得は MVP では行わない |
| FR-016 | 進捗バー（4px）でビュアー内のページ進捗を表示 | medium | モック仕様 |
| FR-017 | ページ遷移アニメーション（flipNextLeft / slideInRight / floaty / viewerIn） | low | UX 補助。アクセシビリティ的に必要なら `prefers-reduced-motion` で抑制 |
| FR-018 | 表紙が見つからないタグの場合「🔍 このタグの えほんは まだないよ」を表示 | low | 空状態 UI |
| FR-019 | レスポンシブ：PC・タブレットいずれも丁寧に表示 | high | 〜900px / 〜560px のブレークポイント。タッチ操作と hover 抑制を両立 |
| FR-020 | URL クエリで本棚/ビュアーのバリアントを切替可能（任意目標） | low | 共有時に同じ見た目を再現。MVP では努力目標 |

### Non-Functional Requirements

| Category | Requirement | Notes |
|---|---|---|
| パフォーマンス | 初回 LCP 2.5s 以内（高速回線・標準 PC）/ 物語遷移は 100ms 以内 | 静的サイトのため達成容易。Vite のチャンク分割と Google Fonts の `display=swap` を活用 |
| アクセシビリティ | WCAG 2.1 AA 相当のコントラスト比 4.5:1 を本文・UI ともに担保 | 夜モードの `--mustard` は要検証 |
| アクセシビリティ | キーボードのみで全操作完結（Tab / ←→ / Esc / Enter） | ナビボタンに `aria-label` 必須 |
| アクセシビリティ | スクリーンリーダーで本文を正しい読み（ふりがな順）で読める | `<ruby>` + `<rt>` 構造を維持 |
| アクセシビリティ | `@media (hover: none)` で hover 効果を抑制（タッチ阻害防止） | プロジェクトルール準拠 |
| アクセシビリティ | `prefers-reduced-motion` で過度なアニメーションを抑制 | flipNextLeft / floaty を短縮または停止 |
| ユーザビリティ | 対象年齢（3〜5 歳）に合わせ、タップ領域 44×44px 以上 | iOS HIG / Material 推奨値 |
| 互換性 | 主要モダンブラウザ最新 2 バージョン（Chrome / Safari / Edge / Firefox） | iPad Safari 含む |
| 互換性 | iPad / Android タブレットの主要解像度（1024×768〜1366×1024）でレイアウト崩れなし | E2E で検証 |
| セキュリティ | パブリック公開だが個人情報は一切扱わない | localStorage は端末内設定のみ |
| セキュリティ | コンテンツ・コードに API キー / シークレットを含めない | `.env*` コミット禁止（Hook B が保護） |
| 保守性 | TypeScript strict / ESLint / Prettier / Vitest を導入し、CI で型・Lint・テストを通す | プロジェクトルールの Build/Test Commands に準拠 |
| 保守性 | 1 ファイル 300 行以内を目安、関数の責務は単一に保つ | プロジェクトルール Code Style |
| 国際化 | 日本語のみ（i18n は MVP 範囲外） | コメント・UI コピーは日本語 |
| ライセンス | コンテンツは著作権切れ古典のみ。再話文は本プロジェクトの著作物として MIT 等で扱う想定 | 詳細は scope-planner で確認 |

### Implicit Requirements (discovered via interview)

| # | Requirement | Basis |
|---|---|---|
| IR-001 | ビュアー閉じ操作（Esc キー / 戻るボタン）必須 | 子どもが操作不能で詰まることを防ぐ。モックの `useViewerNav` で実装済み |
| IR-002 | localStorage 利用不可環境（プライベートブラウジング等）でも動作する | 永続化失敗時は in-memory にフォールバックし、エラーで停止しない |
| IR-003 | フォント未読込時のフォールバック（system-ui） | Google Fonts 取得失敗時もテキストが読める状態を維持 |
| IR-004 | 物語データ（stories.ts）は型安全に管理し、`Story` 型で IDE 補完を効かせる | プロジェクトルールで TypeScript 型定義として共有方針が記載済み |
| IR-005 | 既存モック資産（`Ehon.html` / `app.jsx` / `components/` 他）は `mock/` に退避し、本実装では参照のみ | プロジェクトルールに明記 |
| IR-006 | hover 効果はタッチデバイスで抑制（`@media (hover: none)`） | プロジェクトルール / モック CSS 既存対応 |
| IR-007 | ビュアー入場時のフォーカス管理（最初のナビボタンへ移動）と離脱時の元要素復帰 | キーボードユーザビリティ。a11y 要件 |
| IR-008 | エラー境界（React Error Boundary）でクラッシュしても本棚へ復帰可能にする | 子どもの利用を想定し、白画面で詰まらないようにする |
| IR-009 | 公開後の物語追加は `src/data/stories.ts` への PR として運用する | 「ビルド時静的」の必然的な帰結 |
| IR-010 | Vercel デプロイは GitHub Flow（main ブランチ自動デプロイ + PR プレビュー）で運用する | プロジェクトルールの Branch Strategy と整合 |

## Constraints / Preconditions

### 技術的制約
- フロントエンド単一構成（バックエンド・DB なし）
- Vercel ホスティング（静的サイトとしてビルド成果物を配信）
- React 18 + Vite + TypeScript、パッケージマネージャは pnpm（プロジェクトルール）
- 既存モックは React 18 + Babel Standalone（CDN）で動作。本実装ではビルド前提に切り替える
- `tweaks-panel.jsx` のホスト連携プロトコル（`__edit_mode_*` postMessage）は再利用しない

### コンテンツ制約
- 物語は著作権切れ古典の再話のみ（赤ずきん / 桃太郎 / 白雪姫 / つるの恩返し / ブレーメンの音楽隊 / かさじぞう）
- LLM による新規物語生成は MVP では完全に Out of Scope（UI からも削除）
- TTS（読み上げ）は MVP では含めない
- 挿絵は実画像対応（MVP 内）。配置先: `public/illustrations/{storyId}/{scene}.webp`、表紙は `cover.webp`。シーン名キーは `data/stories.js` の `pages[].scene` と一致。Delivery 中にユーザーが順次配置し、未配置のシーンは `placeholderEmoji` + `bg` 色面でフォールバック表示

### 運用・公開制約
- パブリック公開（誰でもアクセス可、認証不要）
- 親モード等の権限分離は MVP では不要
- PWA / オフライン対応は MVP では行わない
- Output Language: ja（UI コピー・コメント・ドキュメントすべて日本語）

### ターゲット環境
- PC とタブレットを同等に丁寧に作る（スマホは下位互換）
- Chrome / Safari / Edge / Firefox の最新 2 バージョン

## UI Presence

HAS_UI: true

Rationale:
- ブラウザで子どもが直接タップ・閲覧する Web アプリであり、UI が中心の成果物。
- モックには 4 つの主要画面構成（ShelfA / ShelfB / ViewerA / ViewerB）と Tweaks パネルが定義済み。
- アクセシビリティ・レスポンシブ・キーボード操作などの UI 関連 NFR が複数存在する。
- Delivery Flow では `ux-designer` の起動条件（HAS_UI=true）に該当する。

## Unresolved Items

- **サービス名の正式決定**（暫定: 「えほんやさん（Ehon）」）→ Delivery 冒頭で spec-designer がユーザーと候補を決定し、SPEC.md / README / `<title>` / OGP / `package.json` に反映
- **挿絵画像の段階的配置**（FR-021）→ Delivery 中にユーザーが `public/illustrations/{storyId}/{scene}.webp` を順次配置。シーン名キーは `data/stories.js` の `pages[].scene` と一致。推奨: WebP / 表紙 1024×1024 / シーン 1600×900 / 1 枚 ≤ 200KB。未配置シーンは `placeholderEmoji` + `bg` 色面でフォールバック
- アクセント色の選択肢の正確な候補数と色値（モックでは複数の CSS 変数が用意されているが、UI 上で何色を露出するかは scope-planner / ux-designer で確定）
- 夜モード時の `--mustard` のコントラスト 4.5:1 達成可否（visual-designer / 実装フェーズで定量検証）
- URL クエリでのバリアント切替（FR-020）を MVP に含めるか努力目標とするかの最終判断 → scope-planner で決定
- 著作権切れ古典の再話文の権利表記（フッター等）の文面 → scope-planner で雛形を決定
- アナリティクス（Vercel Analytics 等）導入の要否 → MVP では未定。将来検討
- favicon / OGP 画像の用意 → 公開前に必要（Delivery 段階の visual-designer / scaffolder で対応）
- 物語追加運用の Lint（ふりがな記法 `漢字{かんじ}` のバリデーション）→ 余裕があれば test-designer / developer で実装

---

## AGENT_RESULT

```
AGENT_RESULT: interviewer
STATUS: success
ARTIFACTS:
  - INTERVIEW_RESULT.md
PRODUCT_TYPE: service
HAS_UI: true
REQUIREMENTS_COUNT: 20
IMPLICIT_REQUIREMENTS: 10
NEXT: scope-planner
```
