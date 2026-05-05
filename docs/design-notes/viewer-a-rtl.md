> Last updated: 2026-05-05
> GitHub Issue: [#8](https://github.com/kirin0198/ehon/issues/8)
> Analyzed by: analyst (2026-05-05)
> Next: architect

# ViewerA (見開き) を右綴じ書籍仕様に変更

## 1. 背景 / 動機

「えほんやさん」は日本語の絵本アプリであり、日本語書籍の伝統的な綴じ方は
**右綴じ (右ページから左ページへ読み進める)** が主流。現状の ViewerA
(見開き) は左綴じ書籍前提で実装されており、

- 左ページ = 絵 / 右ページ = 文
- 「次ページ」で左ページが捲れて消える
- 左スワイプ = 次ページ / 右スワイプ = 前ページ

となっている。これは英語/欧文書籍の仕様で、日本の絵本としては **直感に
反する**。

オーナーから 2026-05-05 に「ViewerA の状態でページ送り方向を逆にしてほしい」
と依頼あり。本 Issue は ViewerA を右綴じ書籍として整合的に動作させるための
変更を扱う。Phase 2 (アニメ強化) とは独立したスコープで進行する。

## 2. ゴール / 受け入れ基準

| ID    | 受け入れ基準 |
|-------|--------------|
| ACR-1 | ViewerA の見開きで、**右ページが「現在 / 前のページ」、左ページが「次のページ」**として配置される |
| ACR-2 | ViewerA の **左スワイプで前ページ、右スワイプで次ページ**に遷移する (右綴じ書籍の自然な操作) |
| ACR-3 | ViewerA のめくりアニメーションが **右ページから左ページへ** 紙が回転する方向で再生される |
| ACR-4 | キーボードは OS 標準を維持: `←` = 前ページ / `→` = 次ページ (子供向けの混乱回避) |
| ACR-5 | ナビボタン `◀` (まえ) / `▶` (つぎ) のラベルは現状維持 (位置・意味は変えない) |
| ACR-6 | ViewerB のスワイプ方向も **左=前 / 右=次** に同期 (UI 一貫性) |
| ACR-7 | SPEC.md UC-006 の受入基準 (左/右スワイプの方向定義) を新仕様に書き換え |
| ACR-8 | 既存 E2E (`viewer-swipe.spec.ts` / `viewer-keyboard.spec.ts`) の期待値を新仕様に更新し、全テスト緑 |
| ACR-9 | `prefers-reduced-motion: reduce` 時の挙動はアニメ方向に関わらず即時切替を維持 |

## 3. スコープ

**IN**:
- `src/components/viewers/ViewerA.tsx`
  - ページ配置の入れ替え (左ページ ↔ 右ページの内容)
  - スワイプハンドラの `onSwipedLeft` / `onSwipedRight` の `go(±1)` 方向反転
- `src/components/viewers/ViewerB.tsx`
  - スワイプハンドラの `onSwipedLeft` / `onSwipedRight` の `go(±1)` 方向反転 (一貫性のため)
- `src/styles/ehon.css`
  - `book-a.flipping-next` のキーフレーム方向反転
  - `transform-origin` の左右入れ替え
  - 中間影の方向 (Phase 2 と統合する場合は要協調)
- `tests/e2e/viewer-swipe.spec.ts`
  - 全テストケースの「左スワイプ = 次ページ」期待を「右スワイプ = 次ページ」に変更
- `tests/e2e/viewer-keyboard.spec.ts`
  - 変更不要 (`ArrowRight` = 次は維持)
- `docs/SPEC.md` UC-006 受入基準: 「50px 以上の左/右スワイプで前/次ページに遷移する」を
  新仕様 (左=前 / 右=次) に書き換え
- `docs/UI_SPEC.md` ViewerA レイアウト節: 右ページが現在ページであることを明記

**OUT (本 Issue ではやらない)**:
- アニメーション強化 (Phase 2) → 独立 Issue
- ViewerA / ViewerB 以外の本棚 (ShelfA / ShelfB) の RTL 化
- `direction: rtl` 全体への CSS 適用 (本文テキストは横書き日本語のまま)
- ふりがな・夜モード等のトグル UI 配置の RTL 化
- iOS / Android のシステム言語との連動

## 4. 制約 / 未確定事項

未確定 (architect が判断):
- **ViewerA のレイアウト解釈**: 「左=絵 / 右=文」の現状を、
  - (X) **左=次のページの絵 / 右=現在のページの文 + 絵** に再構成?
  - (Y) **左=次のページ全体 (絵+文) / 右=現在ページ全体** に再構成?
  - (Z) ページ単位を保ったまま単純に左右入れ替え (左=現在 → 右=現在 に変える)?
  - 現状の絵本データ (`stories.ts`) は 1 ページ = 1 (絵 + 文) のセットなので、
    解釈 Z (ページ単位の左右入れ替え) が最も実装が素直
- **ViewerB 同期の必要性**: ViewerB は単一ページ表示で「綴じ」概念が
  弱いが、操作の一貫性のため同期反転を仮置き
- **アニメと方向反転の統合タイミング**: Phase 2 と本 Issue を別 PR にする
  場合、どちらを先にマージしても他方がコンフリクトする可能性あり (主に
  `ehon.css` キーフレーム)

制約:
- React 18.3.1 / Vite 5 / TypeScript strict
- `<ruby>` / `<rt>` の DOM 構造を壊さない (R-005)
- キーボードナビは OS 標準を維持 (子供向け a11y)
- 本文の文字書記方向は **横書き日本語のまま** (縦書き化はしない)
- `prefers-reduced-motion: reduce` 必須対応 (R-006)

## 5. 現状分析

### 5.1 ViewerA の現状実装 (`src/components/viewers/ViewerA.tsx`)

```tsx
<div className={`book-a ${flipDir ? 'flipping-' + flipDir : ''}`}>
  <div className="book-a-page left">
    {/* 絵 (illust) */}
  </div>
  <div className="book-a-page right">
    {/* 表紙 CTA or 本文 (RubyText) */}
  </div>
</div>
```

→ 左ページに絵、右ページに文という 1 ページ 2 セクション構成。本 Issue で
   この左右をどう変えるかが論点 (上記 X/Y/Z)。

### 5.2 useViewerNav キーボードバインド (`src/hooks/useViewerNav.ts:46-54`)

```ts
if (e.key === 'ArrowRight') go(1);
else if (e.key === 'ArrowLeft') go(-1);
```

→ OS 標準 (右矢印で次へ進む) を維持。**変更不要**。

### 5.3 スワイプハンドラ (ViewerA.tsx:37-43, ViewerB.tsx:41-47)

```ts
useSwipeable({
  onSwipedLeft: () => go(1),    // 左スワイプ = 次ページ (左綴じ標準)
  onSwipedRight: () => go(-1),  // 右スワイプ = 前ページ
  ...
})
```

**反転後**:

```ts
useSwipeable({
  onSwipedLeft: () => go(-1),   // 左スワイプ = 前ページ (右綴じ書籍)
  onSwipedRight: () => go(1),   // 右スワイプ = 次ページ
  ...
})
```

### 5.4 CSS キーフレーム (`src/styles/ehon.css:665-705`)

現状 `flipping-next` で左ページが `rotateY(-180deg)` に回転 (左から右へ
紙が起き上がる)。右綴じでは **右ページが起き上がる** べきなので、
`flipping-next` を `book-a-page.right` に適用するように変更し、`rotateY`
の符号と `transform-origin` を逆にする。

### 5.5 E2E テスト (`tests/e2e/viewer-swipe.spec.ts:123-161`)

以下のケースが影響:
- L123: 「左スワイプ (70px) → 次ページに進む」 → 「右スワイプ (70px) → 次ページに進む」
- L142: 「右スワイプ (70px) → 前ページに戻る」 → 「左スワイプ (70px) → 前ページに戻る」
- 残り 3 ケース (短い / 縦 / 連続) は方向に依らず維持可能だがアサーション値の見直しは必要

ViewerB セクション (L239-273) も同様に書き換え。

### 5.6 SPEC.md UC-006 (`docs/SPEC.md:189-201`)

```
- 50px 以上の左/右スワイプで前/次ページに遷移する
```

→ 「50px 以上の **右** スワイプで **次** ページ、**左** スワイプで **前**
ページに遷移する」に書き換え。

### 5.7 UI_SPEC.md

`docs/UI_SPEC.md:293-294` 周辺で見開きレイアウトの記述を確認し、右綴じ
仕様を反映する。

## 6. 推奨アプローチ

### 6.1 解釈の決定 (analyst 推奨: 解釈 Z = ページ単位の左右入れ替え)

現行の `stories.ts` の Page 型は 1 ページ = (illust scene + ruby text) の
セットで、`pageIndex` が 1 ずつ進む。見開き表示は技術的には「現在ページの
絵を片側、文をもう片側」に振り分けているだけなので、**ページ配置 (絵と文の
左右) を入れ替える** だけで右綴じ風に見える。

```tsx
// 反転後 (推奨)
<div className="book-a-page right">
  {/* 絵 (illust) — 右ページが「現在ページ」の絵 */}
</div>
<div className="book-a-page left">
  {/* 表紙 CTA or 本文 (RubyText) — 左ページが「現在ページ」の文 */}
</div>
```

クラス名 `left` / `right` は CSS でレイアウト位置を決めているのでマークアップ
順序を変えるだけで OK (DOM 順序は a11y reading order に影響するため要注意)。
あるいは CSS で `flex-direction: row-reverse` を `.book-a` に当てる方法も。

### 6.2 スワイプ方向反転

ViewerA / ViewerB の `useSwipeable` 設定を上記 §5.3 の通り変更。
delta=50, preventScrollOnSwipe=false, trackMouse=false は現状維持。

### 6.3 アニメーション方向反転

```css
/* 反転後 — 「次へ」で右ページが起き上がって左へ捲れる */
.book-a.flipping-next .book-a-page.right {
  transform-origin: left center;
  animation: flipNextRight 0.55s ease-in;
}
.book-a.flipping-next .book-a-page.left {
  animation: flipNextLeftFade 0.55s ease-out;
}
.book-a.flipping-prev .book-a-page.left {
  transform-origin: right center;
  animation: flipPrevLeft 0.55s ease-in;
}

@keyframes flipNextRight {
  0%   { transform: rotateY(0); }
  100% { transform: rotateY(180deg); opacity: 0.7; }
}
@keyframes flipPrevLeft {
  0%   { transform: rotateY(0); }
  100% { transform: rotateY(-180deg); opacity: 0.7; }
}
```

(Phase 2 の影 / perspective を統合するなら architect が両 Issue を統合した
キーフレームを設計)

### 6.4 キーボード非反転の理由

- 子供向けプロダクトでは PC/タブレット OS 標準の挙動 (←=戻る / →=進む)
  からの逸脱は混乱を招く
- アクセシビリティガイドラインでも「進行方向 = →」がデフォルト期待値
- 物理的な「右綴じ」は紙の物体としての方向であり、論理的なナビゲーション
  (時系列) とは独立に扱える
- → ACR-4 として明記

### 6.5 ViewerB 同期の理由

- ViewerB は見開きでないので「綴じ方向」は当てはまらないが、
  ViewerA と切り替えて使うため操作の一貫性が必要
- スワイプ方向だけ同期反転 (右=次)。アニメ方向 (slideInRight 等) は
  「次ページが右から流入」の語感を保つため変更不要 — もし変えるなら別途検討

## 7. PR 分割と Phase 2 との関係

- **本 Issue は Phase 2 と独立 PR で進める**
- どちらが先にマージされても `ehon.css` の `flipping-*` セクションが
  コンフリクトする可能性がある → 後行の developer が手動マージ
- Phase 2 を先行マージし、本 Issue は Phase 2 のキーフレーム上に方向反転を
  上書きする順序が最も安全 (アニメ強化 → 方向反転)

## 8. ドキュメント変更 (architect 委譲)

- `docs/SPEC.md`
  - UC-006 受入基準を右綴じ仕様に書き換え
  - `> Updated: 2026-05-XX (ViewerA を右綴じ仕様に変更)` を該当節先頭に追加
- `docs/UI_SPEC.md`
  - ViewerA レイアウト節 (見開き) に「右ページ = 現在 / 左ページ = 次」を明記
  - L293-294 周辺のスワイプ記述があれば書き換え
- `docs/ARCHITECTURE.md`
  - 必要なら ADR-NEW: 右綴じ仕様採用方針 (キーボードは OS 標準維持の根拠を含む)
- `docs/TEST_PLAN.md`
  - スワイプ E2E の方向期待値を更新

## 9. architect への引き継ぎ (ARCHITECT_BRIEF)

- **目的**: ViewerA を日本語絵本伝統の右綴じ仕様に変更し、操作とレイアウトを
  整合させる
- **方針**:
  - **解釈 Z** (ページ単位の左右入れ替え) を採用
  - スワイプは反転、キーボードは OS 標準維持 (ACR-4)
  - ViewerB のスワイプ方向も同期 (ACR-6)
  - 本文の文字書記方向は変えない (横書き日本語のまま)
- **要決定事項**:
  - ViewerA レイアウト変更を JSX 順序変更で実現するか CSS `row-reverse` で
    実現するか (a11y reading order の観点で前者が望ましい)
  - SPEC/UI_SPEC の改訂文言
  - Phase 2 とのマージ順序 (推奨: Phase 2 先行)
- **影響テスト**:
  - `viewer-swipe.spec.ts` の 7 ケース (ViewerA 5 + ViewerB 2) を全更新
  - `viewer-keyboard.spec.ts` は変更不要
  - 新規 E2E: 「右ページに現在ページの絵が表示されること」を 1 ケース追加検討
- **回帰リスク**:
  - キーボード操作の挙動変更がないこと (ACR-4)
  - `<ruby>` 構造を壊さない (R-005)
  - reduced-motion で ACR-9 を満たす
  - DOM 順序を変える場合、SR の reading order が想定通りになることを確認
