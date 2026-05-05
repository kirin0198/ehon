# TASK.md

> Source: ARCHITECTURE.md (2026-05-05 / RTL 化 ADR-012 追記版)
> Source: docs/design-notes/viewer-a-rtl.md (2026-05-05)
> GitHub Issue: [#8](https://github.com/kirin0198/ehon/issues/8)

## Phase: RTL 化 — ViewerA / ViewerB を右綴じ書籍仕様に変更

Last updated: 2026-05-05T10:00+0900
Status: in-progress

> 前提:
> - Phase 2 (ページめくりアニメ強化 / ADR-011) は PR #9 で main にマージ済
> - 本フェーズは Phase 2 マージ後の **独立 PR** として進行（衝突回避 / R-024）
> - **ライブラリ追加なし**（バンドル増 0 kB）
> - **`useViewerNav.ts` は改変しない**（キーボードは OS 標準 ← で前 / → で次 を維持 / ACR-4 / R-022 の意味分離）
> - **CSS キーフレームは改名する**（`flipNextLeft` → `flipNextRight` 等）。名前と意味の整合性を優先（ADR-012 / 設計判断）
> - ブランチ: `feat/viewer-a-rtl` を main から切る (developer が最初に実施)

## Notes for developer

- **キーボード操作は反転しない**。`src/hooks/useViewerNav.ts` の `ArrowRight → go(1)` / `ArrowLeft → go(-1)` は維持する。`viewer-keyboard.spec.ts` も期待値を変更しない
- スワイプ方向は ViewerA / ViewerB 両方で反転する（操作の一貫性 / ACR-6）
- ViewerA の見開きでは **JSX 順序変更**（`right` ページを先、`left` ページを後）を採用。CSS `row-reverse` は a11y reading order の観点で不採用（R-023）
- ViewerA の単独ページ表示（pageIndex === 0 表紙、最終ページが奇数番目で終わる場合）は `book-a-page.right` のみ描画し、`book-a-page.left` は空 div を維持してレイアウト崩れを防ぐ
- CSS キーフレームは **改名** する（維持しない）。`flipNextLeft` → `flipNextRight` / `flipPrevRight` → `flipPrevLeft` / `flipNextRightFade` → `flipNextLeftFade`。回転方向（rotateY 符号）と中間キーの `box-shadow` 方向（±20px）も対応して反転する
- duration 0.55s / easing / 不透明度 0.3 / blur 30px / `cubic-bezier(0.2, 0.8, 0.2, 1)` などの値は **Phase 2 で確定した値を据え置き**
- ViewerB の slide アニメ方向（`slideInRight` / `slideInLeft`）は変更不要。「次ページが右から流入」の語感を保つ
- ふりがな（`<ruby>` / `<rt>`）の DOM 構造は壊さない（R-005）
- `prefers-reduced-motion: reduce` 対応は既存 CSS で網羅されているため追記不要（ACR-9 / R-006）
- 既存 unit テスト (`tests/unit/ViewerA.test.tsx`) に「左ページに絵」「右ページに文」の DOM アサーションがある場合は左右を入れ替える形で更新する（R-023）。なければスキップ

## Task list

### RTL Phase

- [x] TASK-3-1: ViewerA.tsx の JSX で左右ページ表示順を入れ替え（`right` を先、`left` を後）+ 単独ページの右側固定 | Target file: `src/components/viewers/ViewerA.tsx`
- [x] TASK-3-2: ViewerA.tsx のスワイプハンドラ (`onSwipedLeft` / `onSwipedRight`) を反転 | Target file: `src/components/viewers/ViewerA.tsx`
- [x] TASK-3-3: ViewerB.tsx のスワイプハンドラを反転（操作の一貫性 / ACR-6） | Target file: `src/components/viewers/ViewerB.tsx`
- [x] TASK-3-4: ehon.css のキーフレームを改名 + 回転 / 影方向反転（`flipNextLeft` → `flipNextRight` / `flipPrevRight` → `flipPrevLeft` / `flipNextRightFade` → `flipNextLeftFade`） | Target file: `src/styles/ehon.css`
- [ ] TASK-3-5: viewer-swipe.spec.ts の期待値を反転（左=前 / 右=次） | Target file: `tests/e2e/viewer-swipe.spec.ts`
- [ ] TASK-3-6: viewer-keyboard.spec.ts の **据え置き確認**（修正不要 / OS 標準維持の検証） | Target file: `tests/e2e/viewer-keyboard.spec.ts`
- [ ] TASK-3-7: SPEC.md / UI_SPEC.md 差分更新（差分方針は ARCHITECTURE.md §10 末尾参照） | Target file: `docs/SPEC.md`, `docs/UI_SPEC.md`
- [ ] TASK-3-8: 検証（typecheck / lint / format / unit / e2e / build / 手動視覚レビュー / reduced-motion 確認） | Target: ローカル + CI

## Task 詳細

### TASK-3-1: ViewerA.tsx の JSX で左右ページ表示順を入れ替え
- **目的**: 右綴じ書籍として右ページを「現在ページ」（先に読む）として配置する。SR の reading order を「右 → 左」に整える（WCAG 1.3.2）
- **編集箇所**: `src/components/viewers/ViewerA.tsx` の見開き JSX
- **変更内容**:
  - `<div className="book-a-page right">` を先、`<div className="book-a-page left">` を後の順に出力する
  - 中身の対応:
    - `book-a-page.right` ← 現在ページの **絵**（`<IllustWithFallback storyId scene={pages[currentIdx].scene} ... />`）
    - `book-a-page.left` ← 現在ページの **文**（`<RubyText text={pages[currentIdx].ruby} />` 等）
  - 単独ページ（`pageIndex === 0` 表紙、または奇数番目で終わる最終ページ）の場合は `book-a-page.right` のみ中身を描画し、`book-a-page.left` は空 div としてレイアウト崩れを防ぐ
  - 既存の `pages[i]` / `pages[i+1]` 切替ロジックがある場合は、ページ単位の使い分けは変えず、絵と文の左右配置のみを入れ替える
- **注意**:
  - クラス名 `left` / `right` は CSS でレイアウト位置を決めているため、マークアップ順序を変えても視覚位置は CSS で決まる
  - JSX 順序変更により DOM 順序が変わる点が a11y 上の意図的な変更（R-023）
- **依存**: なし。最初に実行
- **AC**: ACR-1

### TASK-3-2: ViewerA.tsx のスワイプハンドラを反転
- **目的**: 右綴じ書籍として右スワイプで次ページに進む（ACR-2）
- **編集箇所**: `src/components/viewers/ViewerA.tsx` の `useSwipeable` 呼び出し
- **変更内容**:
  ```tsx
  // 反転後
  const handlers = useSwipeable({
    onSwipedLeft: () => go(-1),    // 左スワイプ = 前ページ
    onSwipedRight: () => go(1),    // 右スワイプ = 次ページ
    delta: 50,
    preventScrollOnSwipe: false,
    trackMouse: false,
  });
  ```
- **依存**: TASK-3-1 と同ファイルなのでまとめてコミットしてもよい
- **AC**: ACR-2

### TASK-3-3: ViewerB.tsx のスワイプハンドラを反転
- **目的**: ViewerB のスワイプ方向を ViewerA に同期させ、操作の一貫性を確保（ACR-6）
- **編集箇所**: `src/components/viewers/ViewerB.tsx` の `useSwipeable` 呼び出し
- **変更内容**: TASK-3-2 と同じ反転を適用
- **注意**: ViewerB は単一ページ表示なので JSX 順序の変更は不要。スワイプハンドラのみ反転する
- **依存**: TASK-3-1 / 3-2 と並行可
- **AC**: ACR-6

### TASK-3-4: ehon.css のキーフレームを改名 + 回転 / 影方向反転
- **目的**: ViewerA のめくりアニメを右綴じ仕様（右ページがめくれて左へ捲れる）に整合させる（ACR-3）
- **編集箇所**: `src/styles/ehon.css` の `@keyframes` ブロック + `.book-a.flipping-*` 系セレクタ
- **変更内容**:
  - **キーフレーム改名 + 反転**:
    ```css
    /* 改名前: flipNextLeft → 改名後: flipNextRight (右ページが起き上がる) */
    @keyframes flipNextRight {
      0%   { transform: rotateY(0); box-shadow: none; }
      50%  {
        transform: rotateY(90deg);
        box-shadow: 20px 0 30px rgba(0, 0, 0, 0.3);  /* 右側に影 (符号反転) */
      }
      100% { transform: rotateY(180deg); opacity: 0.7; box-shadow: none; }
    }

    /* 改名前: flipPrevRight → 改名後: flipPrevLeft (左ページが起き上がる) */
    @keyframes flipPrevLeft {
      0%   { transform: rotateY(0); box-shadow: none; }
      50%  {
        transform: rotateY(-90deg);
        box-shadow: -20px 0 30px rgba(0, 0, 0, 0.3); /* 左側に影 (符号反転) */
      }
      100% { transform: rotateY(-180deg); opacity: 0.7; box-shadow: none; }
    }

    /* 改名前: flipNextRightFade → 改名後: flipNextLeftFade
       (フェード対象が右ページから左ページに変わる) */
    @keyframes flipNextLeftFade {
      0%   { opacity: 0; }
      40%  { opacity: 0; }   /* Phase 2 で前倒し済 */
      100% { opacity: 1; }
    }
    ```
  - **適用セレクタの対応関係更新**:
    ```css
    /* 「次へ」: 右ページが回転して消え、左ページがフェードイン */
    .book-a.flipping-next .book-a-page.right { animation: flipNextRight 0.55s ease-in; }
    .book-a.flipping-next .book-a-page.left  { animation: flipNextLeftFade 0.55s ease-out; }

    /* 「前へ」: 左ページが回転して消え、右ページがフェードイン (or 即時) */
    .book-a.flipping-prev .book-a-page.left  { animation: flipPrevLeft 0.55s ease-in; }
    /* .book-a.flipping-prev .book-a-page.right の扱いは既存実装と同じ向きで反転 */
    ```
  - **transform-origin の調整**: `flipping-next .book-a-page.right` は `transform-origin: left center;`（中央線で回転 → 左側へ捲れる）、`flipping-prev .book-a-page.left` は `transform-origin: right center;`
  - **据え置く値**: duration 0.55s / 中間キー 50% / 不透明度 0.3 / blur 30px / Phase 2 で確定した perspective 1500px / preserve-3d / `cubic-bezier(0.2, 0.8, 0.2, 1)` (ViewerB)
- **注意**: ViewerB の `slideInRight` / `slideInLeft` / `slideInRightCard` / `slideInLeftCard` は **変更しない**（次ページが右から流入する語感を維持）
- **依存**: TASK-3-1（セレクタ対応 `.book-a-page.right` / `.left` の意味が JSX 順序変更後の意味と一致する形で書き直すため、TASK-3-1 後に書く方がレビューが楽）
- **AC**: ACR-3

### TASK-3-5: viewer-swipe.spec.ts の期待値を反転
- **目的**: E2E テストを新仕様に追従させる（ACR-8）
- **編集箇所**: `tests/e2e/viewer-swipe.spec.ts`（ViewerA / ViewerB 両セクション）
- **変更内容**:
  - 「左スワイプ (70px) → 次ページに進む」 → 「**右スワイプ (70px) → 次ページに進む**」
  - 「右スワイプ (70px) → 前ページに戻る」 → 「**左スワイプ (70px) → 前ページに戻る**」
  - 短い (≤50px) スワイプで反応しないケース、垂直スワイプで反応しないケース、連続スワイプ中のロックケースは方向に依存しないアサーションだが、コメント文言を新仕様に揃える
- **注意**: ViewerA セクションだけでなく ViewerB セクション（既存 2 ケース）も同じく反転する
- **依存**: TASK-3-2 / 3-3 後（実装が反転していないとテストが緑にならない）
- **AC**: ACR-8

### TASK-3-6: viewer-keyboard.spec.ts の据え置き確認
- **目的**: キーボードは OS 標準維持なので **修正しない**ことを明示的に確認する（ACR-4）
- **編集箇所**: なし
- **確認内容**:
  - 既存の `ArrowRight` で次ページに進む / `ArrowLeft` で前ページに戻る / `Escape` で閉じる、のアサーションがそのまま緑であることを `pnpm test:e2e tests/e2e/viewer-keyboard.spec.ts` で確認する
- **依存**: TASK-3-2 / 3-3 後
- **AC**: ACR-4 / ACR-8

### TASK-3-7: SPEC.md / UI_SPEC.md 差分更新
- **目的**: ドキュメントの整合性を保つ（ACR-7）
- **詳細な差分方針**: `docs/ARCHITECTURE.md` §10 末尾「SPEC.md 差分更新方針 (RTL)」「UI_SPEC.md 差分更新方針 (RTL)」を参照（重複記載を避けるためここでは要点のみ列挙）
- **SPEC.md** (`docs/SPEC.md`):
  - Update history に `2026-05-05: ViewerA / ViewerB の RTL 化 (developer / UC-006 受入基準のスワイプ方向を反転、見開きレイアウト記述を右綴じ仕様に / キーボード ←/→ は OS 標準維持 / バンドル増 0 kB)` を追記
  - UC-006 正常フロー: 「タッチスワイプ (左/右)」を「タッチスワイプ（**右で次 / 左で前**, 右綴じ仕様）」に書き換え。キーボードは「OS 標準: ← で前, → で次」と明記
  - UC-006 受入基準を新仕様に書き換え（右=次 / 左=前）+ 「右ページが現在ページの絵 / 左ページが現在ページの文（解釈 Z）」「キーボードは OS 標準維持」「単独ページは右側に表示」「ViewerB のスワイプ方向も同期反転」を追加
  - §11 受入条件サマリーに「(2026-05-05 追加) ViewerA / ViewerB が右綴じ書籍仕様で動作する（スワイプ右=次, 左=前 / キーボードは OS 標準維持）」を追記
- **UI_SPEC.md** (`docs/UI_SPEC.md`):
  - Update history に `2026-05-05: ViewerA / ViewerB の RTL 化 (developer / SCR-002 ViewerA レイアウト記述を右綴じに、Interactions 表のスワイプ方向を反転、Animations 表のキーフレーム名を flipNextRight / flipPrevLeft / flipNextLeftFade に更新、キーボード行は変更なし)` を追記
  - SCR-002 ViewerA Layout Structure: アスキーアートの左右セル内容を入れ替え（右 = 絵 / 左 = 文）
  - SCR-002 Interactions 表: スワイプ方向を反転（▶ボタン / →キー / **右スワイプ** = 次、◀ボタン / ←キー / **左スワイプ** = 前）。キーボード行は変更なし
  - §7 Accessibility (SCR-002): DOM 順序が `right` → `left` で SR の reading order と一致する旨を共通項目末尾に追記
  - §8 Animations 表: キーフレーム名を `flipNextRight` / `flipPrevLeft` / `flipNextLeftFade` に更新（duration / easing / 中間キー位置 / 不透明度 / blur / cubic-bezier の値は据え置き）
- **ARCHITECTURE.md** (`docs/ARCHITECTURE.md`): architect 段階で更新済（`§3 ViewerA / ViewerB の RTL 化` 節 + ADR-012）。developer は再編集 **不要**。コミット時にステージに含めるだけで OK
- **依存**: TASK-3-1〜3-6 と並行可（実装が固まってからまとめて更新するのが楽）

### TASK-3-8: 検証
- **目的**: AC 全項目を満たすことを確認
- **手順**:
  1. `pnpm typecheck`（= `tsc --noEmit`） — pass
  2. `pnpm lint` — pass
  3. `pnpm format:check` — pass
  4. `pnpm test` — 既存ユニットテスト pass。ViewerA の DOM アサーションが左右入替で更新されている場合はそれも pass
  5. `pnpm test:e2e` — 既存 7 ケース全 pass（反転後の swipe / 据え置きの keyboard 含む / ACR-8）
  6. `pnpm build` — 成功。バンドル増 0 kB を確認（CSS のみの変更で JS 変動なし）
  7. `pnpm dev` でローカル起動し手動視覚レビュー: 昼/夜 × ViewerA/B × 次/前 = 8 パターンを目視
     - ViewerA で **右ページに現在の絵 / 左ページに現在の文** が表示される（ACR-1）
     - **右スワイプ** で次ページへ進み、めくりアニメが **右から左** へ回転する（ACR-2 / ACR-3）
     - **左スワイプ** で前ページへ戻り、めくりアニメが **左から右** へ回転する
     - **キーボード** → で次 / ← で前（OS 標準維持 / ACR-4）
     - ナビボタン ◀ / ▶ のラベルは現状維持で動作する（ACR-5）
     - ViewerB でも右スワイプ = 次 / 左スワイプ = 前 になっている（ACR-6）
     - 単独ページ（表紙）が右側に表示され、左側が空になっている
  8. DevTools > Rendering > `prefers-reduced-motion: reduce` を有効化し、めくりアニメが停止して即時切替になることを確認（ACR-9）
- **依存**: TASK-3-1〜3-7 後 / 最終
- **AC**: ACR-1 〜 ACR-9 全項目

## 受け入れ基準（再掲 / 設計メモ §2 より）

| ID    | 受け入れ基準 | 担当 Task |
|-------|--------------|-----------|
| ACR-1 | ViewerA の見開きで、**右ページが「現在 / 前のページ」、左ページが「次のページ」**として配置される | TASK-3-1 / 3-8 |
| ACR-2 | ViewerA の **左スワイプで前ページ、右スワイプで次ページ**に遷移する（右綴じ書籍の自然な操作） | TASK-3-2 / 3-5 / 3-8 |
| ACR-3 | ViewerA のめくりアニメーションが **右ページから左ページへ** 紙が回転する方向で再生される | TASK-3-4 / 3-8 |
| ACR-4 | キーボードは OS 標準を維持: `←` = 前ページ / `→` = 次ページ（子供向けの混乱回避） | TASK-3-6 / 3-8 |
| ACR-5 | ナビボタン `◀`（まえ） / `▶`（つぎ）のラベルは現状維持（位置・意味は変えない） | TASK-3-8（実装変更なし） |
| ACR-6 | ViewerB のスワイプ方向も **左=前 / 右=次** に同期（UI 一貫性） | TASK-3-3 / 3-5 / 3-8 |
| ACR-7 | SPEC.md UC-006 / UI_SPEC.md SCR-002 の受入基準を新仕様に書き換え | TASK-3-7 |
| ACR-8 | 既存 E2E (`viewer-swipe.spec.ts` / `viewer-keyboard.spec.ts`) の期待値を新仕様に更新し、全テスト緑 | TASK-3-5 / 3-6 / 3-8 |
| ACR-9 | `prefers-reduced-motion: reduce` 時の挙動はアニメ方向に関わらず即時切替を維持 | TASK-3-8（既存 CSS で網羅） |

## Branch & Commit

- Branch: `feat/viewer-a-rtl`（developer が main から切る。Phase 2 PR #9 マージ後の最新 main を起点とする / R-024）
- Commit 粒度の目安:
  - `feat: ViewerA を右綴じ仕様に変更 (JSX 左右入替 + スワイプ反転 / TASK-3-1 / 3-2)`
  - `feat: ViewerB のスワイプを RTL に同期反転 (TASK-3-3)`
  - `style: ehon.css のめくりキーフレームを RTL 仕様に改名 + 反転 (TASK-3-4)`
  - `test: viewer-swipe.spec.ts の期待値を RTL 仕様に反転 (TASK-3-5)`
  - `docs: SPEC.md / UI_SPEC.md / ARCHITECTURE.md に ViewerA RTL 化を反映 (TASK-3-7)`
  - TASK-3-6 / 3-8 は実装変更なしのため独立 commit を立てなくてよい
- PR タイトル例: `feat: ViewerA / ViewerB を右綴じ書籍仕様に変更 (Closes #8)`
- PR 本文には `Closes #8` を必ず記載

## Recent commits

```
# git log --oneline -3 (現状 / 着手前)
57e5d80 fix(test): persistence E2E のレース解消 — addInitScript で legacy localStorage を仕込む (TASK-Fix1)
9f09a34 docs: TASK.md / SPEC.md / ARCHITECTURE.md / UI_SPEC.md / design-notes 更新
9403688 feat: index.html から不要フォント <link> を削除し M PLUS Rounded 1c のみ残す (TASK-E1)
```

## Suspension notes

（セッション中断時に状況を記録する）
