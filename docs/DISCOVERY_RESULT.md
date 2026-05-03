# Discovery Result: えほんやさん（Ehon）

> Created: 2026-05-04
> Last updated: 2026-05-04
> Discovery Plan: Light
> Update history:
>   - 2026-05-04: 実画像挿絵を Won't → Must に昇格、サービス名検討を Delivery 残課題に追加 (ユーザー指示)

## Project Overview

3〜5 歳（未就学児）向けに、著作権切れの古典童話・昔話を読める日本語の絵本 Web アプリ。
本棚（2 バリアント）→ 絵本ビュアー（2 バリアント）の動線で、ふりがな・文字サイズ・夜モード・
フォント切替などの読みやすさ調整を備える。React 18 + TypeScript + Vite で実装し、Vercel に
パブリック公開する。既存のハイファイモック（Claude Design 由来）をリファレンスとして本実装に作り直す。

## Artifact Type

PRODUCT_TYPE: service

> Vercel ホスティングの Web アプリとして配信されるため `service` に分類。
> 認証・DB は持たないが、提供形態としてはネットワーク越しにユーザーへ機能を届ける。
> 後続の Operations Flow は「Light プラン（infra-builder + ops-planner）」を想定。

## Requirements Summary

### Functional Requirements (Must)

1. **本棚画面**：物語一覧表示（著作権切れ古典 6 作品）
2. **本棚レイアウト切替**：ShelfA（立てかけ書架）/ ShelfB（表紙ならべ）の 2 バリアント
3. **タグフィルター**：単一選択セグメント（"" = ぜんぶ / 「グリム童話」「日本昔話」）
4. **ビュアー起動**：物語クリック/タップでビュアーを開く
5. **ビュアーレイアウト切替**：ViewerA（見開き）/ ViewerB（全画面背景）の 2 バリアント
6. **表紙ページ + CTA**：「よみはじめる」CTA を表紙ページに配置
7. **ページ送り**：ボタン / キーボード（←/→）/ タップ。Esc でビュアー閉じる
8. **ふりがな ON/OFF**：`<ruby>` 構造を保ちつつ CSS で `<rt>` を制御
9. **文字サイズ調整**：16〜36px / 2px ステップ
10. **夜モード**：`.night` クラスでパレット切替
11. **設定永続化**：Tweaks（フォント・ふりがな・文字サイズ・夜モード・アクセント色・バリアント）を localStorage に保存
12. **静的データ**：物語データはビルド時静的（`src/data/stories.ts` にコミット）
13. **レスポンシブ**：PC + タブレット（〜900px）+ スマホ（〜560px）対応
14. **実画像挿絵**：`public/illustrations/{storyId}/{scene}.webp` を読み込み表示。`cover.webp` は表紙、`pages[].scene` 値をファイル名に対応付け。**画像不在時は `placeholderEmoji` + `bg` 色面でフォールバック**（既存モック挙動を維持）。Delivery 中にユーザーが順次配置

### Functional Requirements (Should / Could)

- **Should**：フォントプリセット 6 種選択 / アクセント色 4 色程度選択 / Tweaks 一括 UI / ページ進捗バー / ページ遷移アニメーション
- **Could**：空タグ時メッセージ表示 / URL クエリでバリアント切替 / ふりがな記法 Lint

### Functional Requirements (Won't — MVP 完全 Out of Scope)

- LLM による新作物語生成（UI からも削除）
- TTS（読み上げ）
- PWA / オフライン対応
- 認証 / 親モード
- i18n（日本語以外）
- アナリティクス

### Non-Functional Requirements

- **パフォーマンス**：初回 LCP ≤ 2.5s / 物語遷移 ≤ 100ms / バンドル初回 JS ≤ 200KB gz
- **アクセシビリティ**：WCAG 2.1 AA 相当 / キーボード完結 / `<ruby>` SR 互換 / `prefers-reduced-motion` 対応 / コントラスト 4.5:1 / `@media (hover: none)` で hover 抑制
- **ユーザビリティ**：タップ領域 ≥ 44×44px
- **互換性**：Chrome / Safari / Edge / Firefox の最新 2 バージョン、iPad / Android タブレット主要解像度
- **セキュリティ**：個人情報を扱わない / `.env*` コミット禁止（Hook B 保護）
- **保守性**：TypeScript strict / ESLint / Prettier / Vitest / Playwright を CI で通す / 1 ファイル 300 行以内目安
- **ライセンス**：物語は著作権切れ古典の再話のみ。再話文は本プロジェクト著作物として MIT 想定

## Scope

- **MVP:** 著作権切れ古典 6 作品を本棚（2 バリアント）→ ビュアー（2 バリアント）動線で、ふりがな・文字サイズ・夜モード・実画像挿絵対応で読める Web アプリを Vercel パブリック公開
- **IN:** 上記 Must 機能（FR-001〜014）+ アクセシビリティ・レスポンシブ NFR + Should 群（フォント / アクセント色 / Tweaks 一括 UI / 進捗バー / アニメーション） + **実画像挿絵の段階的配置（フォールバック付き）**
- **OUT:** Won't カテゴリ全件（LLM 生成 / TTS / PWA / 認証 / i18n / アナリティクス）+ Could で MVP に含めない判断のもの

## Technical Risks / Constraints

> Light プランのため `researcher` / `poc-engineer` は実施せず。
> 主要リスクは scope-planner が要件・モック・project-rules から導出。

### 確定済み技術制約

- フロントエンド単一構成（バックエンド・DB なし）
- React 18 + Vite + TypeScript / pnpm
- Vercel ホスティング（静的サイト）
- 既存モック（`Ehon.html` / `app.jsx` / `tweaks-panel.jsx` / `components/` / `data/` / `styles/`）は `mock/` に退避し、本実装では参照のみ
- `tweaks-panel.jsx` のホスト連携プロトコル（`__edit_mode_*` postMessage）は再利用しない

### 主要リスク（詳細は SCOPE_PLAN.md §4）

| # | Risk | Impact | Probability | Mitigation 概要 |
|---|------|--------|-------------|------------------|
| R-001 | 夜モード `--mustard` がコントラスト 4.5:1 未達 | medium | medium | visual-designer で代替色試算、必要なら夜専用パレット |
| R-002 | Google Fonts 取得失敗時のレイアウトずれ | low | medium | `font-display: swap` + system フォールバック |
| R-003 | localStorage 利用不可環境でのエラー停止 | medium | low | try/catch + in-memory fallback |
| R-004 | iPad Safari の `100vh` ツールバーずれ | medium | high | `100dvh` 採用 / Playwright iPad プロファイル E2E |
| R-005 | ふりがな ON/OFF の SR 挙動揺れ | low | low | `<ruby>` 構造維持、`rt { display: none }` のみで制御 |
| R-006 | アニメーション過多で `prefers-reduced-motion` ユーザーに不快感 | medium | medium | `prefers-reduced-motion: reduce` で各アニメ無効化 |
| R-007 | 古典再話の翻案範囲による権利問題 | low | low | 再話は本プロジェクトオリジナルとして MIT。フッター明記 |
| R-008 | Vercel デプロイ時の Vite 設定漏れ（base / SPA fallback） | low | low | `vercel.json` リライト明示 |
| R-009 | モック資産が本番ビルドに混入 | low | low | `tsconfig.exclude` で `mock/` 除外 |
| R-010 | スマホレスポンシブの優先度低下による後戻り | medium | low | モック既存の `max-width:560px` 踏襲 + iPhone E2E |
| R-011 | 挿絵未配置のページが大量発生し見栄えが悪化 | medium | medium | フォールバック（placeholderEmoji + bg 色）を MVP からそのまま生かし、Delivery 中に順次差し替え |
| R-012 | 挿絵画像のサイズ過大で LCP NFR 未達（≤ 2.5s） | medium | medium | 推奨スペック（後述）を遵守、`<img loading="lazy">` + 表紙のみ eager、Vite asset optimization 利用 |
| R-013 | 著作権の懸念がある画像が混入 | high | low | ユーザーが配置する画像は本人作成 or 著作権切れ・MIT 同等ライセンスのみ。doc-writer が README に明記 |

## Discovery Artifacts

| File | Description | Status |
|---------|------|------|
| INTERVIEW_RESULT.md | 要件ヒアリング結果（FR 20 件 / NFR 14 件 / IR 10 件 / ステークホルダー 4） | present |
| RESEARCH_RESULT.md | ドメイン研究結果 | absent (Light プランで省略) |
| POC_RESULT.md | 技術 PoC 結果 | absent (Light プランで省略) |
| CONCEPT_VALIDATION.md | コンセプト検証結果 | absent (Light プランで省略) |
| SCOPE_PLAN.md | スコーププラン（MoSCoW / KPI / Risk / Cost / Handoff） | present |
| project-rules.md | プロジェクトルール（rules-designer 生成済み） | present |

## Unresolved Items

Delivery Flow で解決すべき残課題：

1. **サービス名の正式決定**（spec-designer / Delivery Flow 冒頭で確定）
   - 暫定: 「えほんやさん（Ehon）」。`<title>` / OGP / README / package.json `name` に反映
   - 候補洗い出し → ユーザー選定 → 各成果物・コードに反映
2. **挿絵画像の段階的配置（ユーザー作業）**
   - 配置先: `public/illustrations/{storyId}/{scene}.webp`
   - 表紙: `public/illustrations/{storyId}/cover.webp`
   - シーン名: `data/stories.js` の `pages[].scene` 値（例: `forest-girl`, `basket`, `wolf-meet` ...）
   - 推奨スペック:
     - フォーマット: WebP（必須） / 透過不要なら品質 80〜85
     - 解像度: 表紙 1024×1024（正方形） / シーン 1600×900（16:9 横向き）目安
     - ファイルサイズ: 1 枚 200KB 以下推奨（LCP NFR 2.5s 確保）
     - スタイル: 子供向け（3〜5 歳）、対象年齢に配慮した穏やかな表現
     - 著作権: ユーザー本人作成 or 著作権切れ・CC0・MIT 同等のみ
   - フォールバック: 画像不在のシーンは `placeholderEmoji` + `bg` 色面で自動表示（Delivery 中に順次差し替え可能）
   - 推定総数: 表紙 6 枚 + 各話 6〜7 シーン × 6 話 ≈ 約 45 枚
3. アクセント色の UI 露出候補数と色値（ux-designer / visual-designer で確定）
4. 夜モード `--mustard` のコントラスト検証と代替色（visual-designer で実測）
5. URL クエリでバリアント切替を MVP に含めるかの最終判断（architect で判定）
6. 再話文の権利表記文面（spec-designer が SPEC に明記）
7. favicon / OGP 画像の用意（visual-designer / scaffolder）
8. ふりがな記法 `漢字{かんじ}` のバリデーション Lint（test-designer が要否判断）
9. アナリティクス導入の要否（Operations Flow / ops-planner 段階で再判断）
10. 物語追加運用ドキュメント（doc-writer が README に手順記載。挿絵配置手順も含む）

## Next Steps

- 次フロー: **Delivery Flow（推奨プラン: Light）**
  - HAS_UI: true のため `ux-designer` が起動対象
  - Light プランでは `visual-designer` は起動しない（ux-designer の lightweight visual default を適用）
  - PRODUCT_TYPE: service のため Operations Flow（Vercel デプロイ）も後続で実施
- 起動コマンド: `/delivery-flow`（DISCOVERY_RESULT.md を入力として読み込み）

---

## AGENT_RESULT

```
AGENT_RESULT: scope-planner
STATUS: success
ARTIFACTS:
  - SCOPE_PLAN.md
  - DISCOVERY_RESULT.md
MVP_SCOPE: 著作権切れ古典 6 作品を本棚 2 バリアント → ビュアー 2 バリアントで読める Web アプリを Vercel 公開（実画像挿絵を Delivery 中にユーザーが順次配置、画像不在時はプレースホルダーフォールバック）
MUST_COUNT: 14
SHOULD_COUNT: 5
RISKS: 13
HANDOFF_READY: true
NEXT: done
```
