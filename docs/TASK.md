# TASK.md

> Source: ARCHITECTURE.md (2026-05-06 / Phase 1: タッチスワイプ対応 / ADR-010)
> Source: docs/design-notes/page-turn-animation.md (2026-05-05) — Phase 1 章を参照
> Related Issue: #5 https://github.com/kirin0198/ehon/issues/5

## Phase: Phase 1 — タッチスワイプ対応 (react-swipeable)

Last updated: 2026-05-06 (TASK-1-1 完了)
Status: in-progress

## Overview

3〜5 歳児ターゲットのタブレット主眼ビュアーに、タッチスワイプでのページ送り
を導入する。既存の `useViewerNav` (`go(±1)` / `flipDir` / `isFlipping` /
`FLIP_LOCK_MS=500ms`) を改造せず、`react-swipeable` の `useSwipeable` を
ViewerA / ViewerB の本文ステージにインライン bind する形で実装する。

CSS アニメ強化 (Phase 2) は本フェーズの対象外。

### 確定事項 (architect / user 合意 2026-05-06)

- ライブラリ: `react-swipeable` 7.x (gzip 約 +4 kB / MIT / メンテ活発)
- スワイプ閾値: 50px (analyst 推奨値)
- `preventScrollOnSwipe: false` (縦スクロールを阻害しない)
- `trackMouse: false` (本番ではマウスドラッグでページが動かない)
- 装着先: `.eh-viewer-stage` 相当 (本文ステージ)。ViewerBar には絶対に装着しない
  (ボタン / ふりがな ON/OFF / 夜モード ボタンとの衝突回避 — R-018)
- 既存 `useViewerNav` は改造しない
- reduced-motion: スワイプ機能は維持。アニメ抑制は既存 CSS で対応
- キーボード (←/→/Esc) と ◀/▶ ボタンは引き続き動作 (回帰テストあり)

### ブランチ戦略

- ブランチ名: `feat/swipe-gesture` (main から切る)
- 最初の implementation-tier agent (developer) が `git checkout main &&
  git pull && git checkout -b feat/swipe-gesture` を実行
- PR 本文に `Closes #5` を記載

## Task list

### Phase 1

- [x] TASK-1-1: `pnpm add react-swipeable` を実行 | Target file: `package.json` / `pnpm-lock.yaml`
  - 依存追加のみ。コミット粒度: `chore: react-swipeable を依存追加 (TASK-1-1)`
  - 検証: `pnpm typecheck` が pass すること
  - 依存: なし (最初に実行)
  - 実装備考: pnpm 未インストール環境のため npm install で代替。react-swipeable 7.0.2 追加。既存 esbuild 脆弱性は react-swipeable と無関係で既存から継続。

- [ ] TASK-1-2: ViewerA にスワイプ統合 | Target file: `src/components/viewers/ViewerA.tsx`
  - `useSwipeable` を import
  - 設定: `{ onSwipedLeft: () => go(1), onSwipedRight: () => go(-1), delta: 50, preventScrollOnSwipe: false, trackMouse: false }`
  - 戻り値の `handlers` を本文ステージ要素 (現実装の `.book-a` を内包する root / `.eh-viewer-stage` 相当) にスプレッド (`{...handlers}`)
  - `useViewerNav` のインターフェースは変更しない
  - 既存の `<ruby>` 構造には触れない
  - 依存: TASK-1-1

- [ ] TASK-1-3: ViewerB にスワイプ統合 | Target file: `src/components/viewers/ViewerB.tsx`
  - 同上の設定で本文ステージ root に bind
  - **ViewerBar に装着しないことを必ず確認** (R-018 / ADR-010)
  - 依存: TASK-1-1 (TASK-1-2 と並行可)

- [ ] TASK-1-4: スワイプ E2E テスト追加 | Target file: `tests/e2e/viewer-swipe.spec.ts` (新規)
  - Playwright の touch エミュレーション (例: WebKit + iPad プロファイル / `page.touchscreen` API / `dispatchEvent('touchstart' / 'touchmove' / 'touchend')`) を使う
  - ケース:
    1. ViewerA で 50px 以上の左スワイプ → 次ページに進む
    2. ViewerA で 50px 以上の右スワイプ → 前ページに戻る (1ケース目で進めた後)
    3. ViewerB で同様の左右スワイプ
    4. 30px 程度の短い横移動はページ送りされない (閾値 50px の境界)
    5. 縦スワイプ (上下方向) では遷移しない
    6. 連続スワイプ 2 回: 1 回目で遷移、500ms 以内の 2 回目はロック中で無視される
  - 既存 E2E (`viewer-keyboard.spec.ts` / `home.spec.ts`) は変更せず維持し、回帰がないことを確認
  - 依存: TASK-1-2 / TASK-1-3
  - コミット粒度: `test: スワイプ E2E (viewer-swipe.spec.ts) を追加 (TASK-1-4)`

- [ ] TASK-1-5: ドキュメント更新 | Target file: `docs/SPEC.md` / `docs/UI_SPEC.md`
  - **SPEC.md**:
    - Update history に `2026-05-06: タッチスワイプ Phase 1 (developer / UC-006 にスワイプ操作追加 / 受入基準追記)` を追記
    - Section 1. Scope (IN) の「ページ送り（ボタン / キーボード ←/→ / タップ）」を「タッチスワイプ」に修正
    - UC-006 正常フロー: 「画面左右半分タップ」を削除し「タッチスワイプ (左/右)」に置換
    - UC-006 受入基準に以下を追記:
      - 50px 以上の左/右スワイプで前/次ページに遷移する
      - 500ms のフリップロック中はスワイプも無視される
      - 垂直方向のスワイプは無視される (縦スクロールを阻害しない)
      - スワイプはタッチデバイスで機能。マウスでは反応しない
    - Section 11. 受入条件サマリーに「(2026-05-06 追加) タブレット / スマホでスワイプによるページ送りが機能する」を追記
  - **UI_SPEC.md**:
    - Update history に `2026-05-06: ビュアーのタッチスワイプ Phase 1 (developer / SCR-002 Interactions の「画面半分タップ」を「左/右スワイプ」に置換、Accessibility 節に補足)` を追記
    - SCR-002 Interactions テーブル L293-294: 「画面右半分タップ」→「左スワイプ (タッチ)」、「画面左半分タップ」→「右スワイプ (タッチ)」
    - SCR-002 Accessibility Requirements に「キーボード (←/→/Esc) とナビボタン (◀/▶) は引き続き使用可能。スワイプは追加手段」を明記
    - Animations / Transitions 節は変更しない (アニメ強化は Phase 2)
  - 依存: TASK-1-2 / TASK-1-3 (TASK-1-4 と並行可)
  - コミット粒度: `docs: SPEC.md / UI_SPEC.md にスワイプ仕様を反映 (TASK-1-5)`

- [ ] TASK-1-6: 検証とバンドルサイズ計測
  - `pnpm typecheck` / `pnpm lint` / `pnpm format:check` / `pnpm test` 全 pass
  - `pnpm test:e2e` で `viewer-swipe.spec.ts` を含む主要シナリオ pass
  - `pnpm build` でバンドルサイズを計測 (raw / gzip 双方)
  - PR 説明にバンドルサイズ差分を記載 (AC-6: gzip +15 kB 以内 / 想定: react-swipeable 約 +4 kB)
  - PR 作成: `gh pr create --base main` で `Closes #5` を本文に記載
  - 依存: TASK-1-1 〜 TASK-1-5 (最終)
  - コミット粒度: `chore: バンドルサイズ計測結果を PR 説明に記載 (TASK-1-6)` (必要なら)

## Acceptance Criteria (本フェーズ)

- [ ] ViewerA / ViewerB の本文ステージで左右スワイプによるページ送りが機能する
- [ ] スワイプ閾値 50px 未満は無視される
- [ ] 垂直方向のスワイプはページ送りされず、縦スクロールが機能する
- [ ] 500ms のフリップロック中はスワイプも無視される
- [ ] ViewerBar 上のボタン (ふりがな / 夜モード / 閉じる / バリアント切替) はタップで反応し、スワイプ判定に食われない (R-018)
- [ ] 既存のキーボード操作 (←/→/Esc) と ◀/▶ ボタンは引き続き動作する (回帰なし)
- [ ] `prefers-reduced-motion: reduce` でもスワイプ機能は維持される (アニメは抑制)
- [ ] `<ruby>` 構造に変化なく、SR (VoiceOver / NVDA) 互換性が保たれる (R-019)
- [ ] バンドルサイズ増分が gzip +15 kB 以内 (AC-6)
- [ ] 新規 E2E `viewer-swipe.spec.ts` の全ケースが pass

## Non-Goals (Phase 1)

- CSS アニメーション強化 (`perspective`, `box-shadow`, easing 改善 等) → Phase 2 で別 PR
- ジェスチャ進行率に応じた "drag-to-flip" → Phase 3 候補 (要 `@use-gesture/react` 等再評価)
- 本棚 (ShelfA / ShelfB) へのスワイプ拡張
- マルチタッチ (ピンチズーム等)
- スワイプアップ / ダウンでのメニュー呼び出し

## Recent Commits

TASK-1-1 完了後:
- (設計メモ) docs: ARCHITECTURE.md / TASK.md / page-turn-animation.md を Phase 1 スワイプ対応で更新
- chore: react-swipeable を依存追加 (TASK-1-1)

## Session Interruption Notes

(セッション中断時にここに状況を記録する)
