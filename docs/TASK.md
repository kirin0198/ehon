# TASK.md

> Source: ARCHITECTURE.md (2026-05-05 / Phase 2 ADR-011 追記版)
> Source: docs/design-notes/page-turn-animation-phase2.md (2026-05-05)
> GitHub Issue: [#7](https://github.com/kirin0198/ehon/issues/7)

## Phase: Phase 2 — ページめくりアニメ強化 (CSS only)

Last updated: 2026-05-05T03:00+0900
Status: in-progress

> 前提:
> - Phase 1 (タッチスワイプ / ADR-010) は PR #6 で完了済
> - 本フェーズは **CSS only**。JS / React / 型 / hook には触れない
> - ライブラリ追加なし (バンドル増 0 kB / AC2-6)
> - RTL (Issue #8) は本フェーズの対象外。本 PR マージ後に別 PR で対応
> - ブランチ: `feat/page-turn-anim-phase2` を main から切る (developer が最初に実施)

## Task list

### Phase 2

- [x] TASK-2-1: `.book-a` に `perspective: 1500px` + `transform-style: preserve-3d` を付与 | Target file: `src/styles/ehon.css`
- [x] TASK-2-2: `flipNextLeft` / `flipPrevRight` キーフレームに中間キー (50%) で `box-shadow` を追加 | Target file: `src/styles/ehon.css`
- [x] TASK-2-3: `flipNextRightFade` のフェード開始を 60% → 40% に前倒し | Target file: `src/styles/ehon.css`
- [x] TASK-2-4: ViewerB の slide easing を `cubic-bezier(0.2, 0.8, 0.2, 1)` に統一 (4 行) | Target file: `src/styles/ehon.css`
- [x] TASK-2-5: `prefers-reduced-motion` の挙動確認 (既存 `reduced-motion.css` で網羅されることを確認 / 追記不要) | Target file: `src/styles/reduced-motion.css` (確認のみ)
- [x] TASK-2-6: SPEC.md / UI_SPEC.md 差分更新 (差分方針は ARCHITECTURE.md §10 末尾参照) | Target file: `docs/SPEC.md`, `docs/UI_SPEC.md`
- [ ] TASK-2-7: 検証 (typecheck / lint / format / unit / e2e / build / 手動視覚レビュー / reduced-motion 確認) | Target: ローカル + CI

## Task 詳細

### TASK-2-1: `.book-a` に perspective を付与
- **目的**: 子要素の `rotateY` を立体的に表示する準備
- **編集箇所**: `src/styles/ehon.css` の `.book-a` セレクタ (既存ブロックを拡張)
- **追加内容**:
  ```css
  .book-a {
    /* 既存プロパティに加えて以下を追加 */
    perspective: 1500px;
    transform-style: preserve-3d;
  }
  ```
- **依存**: なし。最初に実行
- **AC**: AC2-2

### TASK-2-2: `flipNextLeft` / `flipPrevRight` に box-shadow 中間キー追加
- **目的**: めくり中のページに紙の厚みを示す影を表現
- **編集箇所**: `src/styles/ehon.css` の `@keyframes flipNextLeft` / `@keyframes flipPrevRight`
- **変更内容**:
  ```css
  @keyframes flipNextLeft {
    0%   { transform: rotateY(0); box-shadow: none; }
    50%  {
      transform: rotateY(-90deg);
      box-shadow: -20px 0 30px rgba(0, 0, 0, 0.3);
    }
    100% { transform: rotateY(-180deg); opacity: 0.7; box-shadow: none; }
  }
  @keyframes flipPrevRight {
    0%   { transform: rotateY(0); box-shadow: none; }
    50%  {
      transform: rotateY(90deg);
      box-shadow: 20px 0 30px rgba(0, 0, 0, 0.3);
    }
    100% { transform: rotateY(180deg); opacity: 0.7; box-shadow: none; }
  }
  ```
- **依存**: TASK-2-1 と並行可
- **不変条件**: duration 0.55s は据え置き (既存セレクタ `.book-a.flipping-* .book-a-page.*` の `animation` 値は変更不要)
- **AC**: AC2-1

### TASK-2-3: `flipNextRightFade` のフェードタイミング調整
- **目的**: 回転中盤で新ページが立ち上がる視覚情報を強化
- **編集箇所**: `src/styles/ehon.css` の `@keyframes flipNextRightFade`
- **変更内容**:
  ```css
  @keyframes flipNextRightFade {
    0%   { opacity: 0; }
    40%  { opacity: 0; }   /* 60% → 40% に前倒し */
    100% { opacity: 1; }
  }
  ```
- **依存**: TASK-2-1 / 2-2 と並行可
- **AC**: AC2-1 (補強)

### TASK-2-4: ViewerB easing を cubic-bezier に統一
- **目的**: ViewerB の slide に余韻を与え「紙の物体感」を出す
- **編集箇所**: `src/styles/ehon.css` の以下 4 行
  ```css
  .book-b.flipping-next .book-b-bg       { animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .book-b.flipping-next .book-b-text-card { animation: slideInRightCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .book-b.flipping-prev .book-b-bg       { animation: slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .book-b.flipping-prev .book-b-text-card { animation: slideInLeftCard 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
  ```
- **依存**: TASK-2-1〜2-3 と並行可
- **不変条件**: duration 0.5s は据え置き
- **AC**: AC2-3

### TASK-2-5: prefers-reduced-motion 動作確認
- **目的**: 既存 `src/styles/reduced-motion.css` のルールが新中間キーを含む全アニメを停止することを確認する
- **方針**: 既存ルール `@media (prefers-reduced-motion: reduce) { .book-a, .book-b, ... { animation: none !important; } }` がキーフレーム全体を停止するため、**reduced-motion.css への追記は不要**
- **確認手順**:
  1. DevTools > Rendering > Emulate CSS media feature `prefers-reduced-motion: reduce` を有効化
  2. ViewerA / ViewerB でページ送り操作 → アニメが瞬時に切り替わり、影や perspective による立体感が描画されないことを目視確認
- **依存**: TASK-2-1〜2-4 後
- **AC**: AC2-4

### TASK-2-6: SPEC.md / UI_SPEC.md 差分更新
- **目的**: ドキュメントの整合性を保つ
- **詳細な差分方針**: `docs/ARCHITECTURE.md` §10 末尾「SPEC.md / UI_SPEC.md 差分更新方針 (Phase 2)」を参照 (重複記載を避けるためここでは要点のみ列挙)
- **SPEC.md** (`docs/SPEC.md`):
  - Update history に `2026-05-05: ページめくりアニメ強化 Phase 2 (developer / UC-006 受入基準にアニメの立体感を追記 / CSS only / バンドル増 0 kB)` を追記
  - UC-006 受入基準の末尾に「ページ送り時にめくり中の影 + perspective による立体感が視覚的に確認できる (reduced-motion 時は除外)」「バンドル増 0 kB」を追加
  - §11 受入条件サマリーに「(2026-05-05 追加) ページめくり時に紙の厚み・立体感が CSS only のアニメで表現される」を追加
- **UI_SPEC.md** (`docs/UI_SPEC.md`):
  - Update history に `2026-05-05: ページめくりアニメ強化 Phase 2 (developer / Animations 表に perspective / box-shadow / easing を反映)` を追記
  - §8 Animations / Transitions 表の `flipNextLeft` / `flipPrevRight` に「中間キー (50%) で box-shadow」を注記、`flipNextRightFade` に「フェード開始 60%→40%」を注記、`slideIn*` の easing 列を `cubic-bezier(0.2, 0.8, 0.2, 1)` に更新
  - 表の下に `.book-a` の `perspective: 1500px` + `transform-style: preserve-3d` 補足を追記
- **ARCHITECTURE.md** (`docs/ARCHITECTURE.md`): architect 段階で更新済 (`§3 ページめくりアニメ強化` 節 + ADR-011)。developer は再編集 **不要**。コミット時にステージに含めるだけで OK
- **依存**: TASK-2-1〜2-5 と並行可 (実装が固まってからまとめて更新するのが楽)

### TASK-2-7: 検証
- **目的**: AC 全項目を満たすことを確認
- **手順**:
  1. `pnpm typecheck` (= `tsc --noEmit`) — pass
  2. `pnpm lint` — pass
  3. `pnpm format:check` — pass
  4. `pnpm test` — 既存ユニットテスト pass (新規テストは追加しない)
  5. `pnpm test:e2e` — 既存 7 ケース全 pass (新規 E2E は追加しない / AC2-5)
  6. `pnpm build` — 成功。`dist/assets/*.js` の gzip サイズを記録し、Phase 1 完了時 (PR #6 マージ直後) と比較して **増加 0 kB** を確認 (AC2-6)
  7. `pnpm dev` でローカル起動し手動視覚レビュー: 昼/夜 × ViewerA/B × 次/前 = 8 パターンを目視
     - 中間キーの影が紙の厚みとして見える
     - perspective により ViewerA の rotateY が立体感を持つ
     - ViewerB の slide が余韻のある動きになる
     - キーボード/ボタン/スワイプの 3 操作系すべてで同等のアニメが再生される (AC2-7)
  8. DevTools > Rendering > `prefers-reduced-motion: reduce` を有効化し、全アニメが停止することを確認 (AC2-4)
- **依存**: TASK-2-1〜2-6 後 / 最終
- **AC**: AC2-1 〜 AC2-7 全項目

## 受け入れ基準 (再掲 / 設計メモ §2 より)

| ID  | 受け入れ基準 | 担当 Task |
|-----|--------------|-----------|
| AC2-1 | ViewerA のページ送り時、めくり中のページに影 (内側 / 外側) が表示され、紙の厚みが感じられる | TASK-2-2 / 2-3 / 2-7 |
| AC2-2 | `.book-a` 親要素に perspective が付与され、rotateY が立体的に見える | TASK-2-1 / 2-7 |
| AC2-3 | ViewerB の slide にも余韻のある easing (cubic-bezier) が適用される | TASK-2-4 / 2-7 |
| AC2-4 | `prefers-reduced-motion: reduce` のとき、影・perspective を含む全アニメは停止 (即時切替) | TASK-2-5 / 2-7 |
| AC2-5 | 既存 E2E 7 ケース (`viewer-keyboard.spec.ts` / `viewer-swipe.spec.ts` 他) を破壊しない | TASK-2-7 |
| AC2-6 | バンドルサイズ (gzip) の増加は **0 kB** (CSS のみ、JS ライブラリ追加なし) | TASK-2-7 |
| AC2-7 | キーボード ←/→ / ◀/▶ ボタン / スワイプの全 3 操作系で同等のアニメが再生される | TASK-2-7 |

## Branch & Commit

- Branch: `feat/page-turn-anim-phase2` (developer が main から切る)
- Commit 粒度の目安:
  - `style: .book-a に perspective を付与し flipping キーフレームに box-shadow / フェード調整 (TASK-2-1 / 2-2 / 2-3)`
  - `style: ViewerB の slide easing を cubic-bezier(0.2, 0.8, 0.2, 1) に統一 (TASK-2-4)`
  - `docs: SPEC.md / UI_SPEC.md / ARCHITECTURE.md にページめくりアニメ Phase 2 を反映 (TASK-2-6)`
  - TASK-2-5 / 2-7 は別 commit を立てなくても良い (確認のみ / 検証のみのため)
- PR タイトル例: `style: ページめくりアニメ強化 Phase 2 (CSS only / Closes #7)`
- PR 本文には `Closes #7` を必ず記載

## Recent commits

(developer が各タスク完了時に `git log --oneline -3` を貼る)

## Suspension notes

(セッション中断時に状況を記録する)
