> Last updated: 2026-05-05
> GitHub Issue: [#7](https://github.com/kirin0198/ehon/issues/7)
> Analyzed by: analyst (2026-05-05)
> Next: architect

# ページめくりアニメーション強化 (Phase 2 / CSS only)

## 1. 背景 / 動機

Phase 1 (PR #6, Issue #5) で `react-swipeable` によるタッチスワイプ対応が
完了し、`useViewerNav` の `flipDir` / `isFlipping` / 500ms ロックも安定動作
している。Phase 1 ではアニメーション本体は既存の `rotateY` ベースのキー
フレームをそのまま流用しており、紙の「めくり感」は十分に表現できていない。

Phase 2 は **CSS のみで完結する控えめな強化** をスコープに、紙の厚み・影・
立体感を補強する。設計メモ `page-turn-animation.md` の §7 Phase 2 章で
仮置きしていた方針を独立 Issue として確定させる。

オーナーから 2026-05-05 に「Phase 2 に進んでください」と明示指示あり。

## 2. ゴール / 受け入れ基準

| ID  | 受け入れ基準 |
|-----|--------------|
| AC2-1 | ViewerA のページ送り時、めくり中のページに影 (内側 / 外側) が表示され、紙の厚みが感じられる |
| AC2-2 | `.book-a` 親要素に `perspective` が付与され、`rotateY` が立体的に見える |
| AC2-3 | ViewerB の slide にも余韻のある easing (`cubic-bezier`) が適用される |
| AC2-4 | `prefers-reduced-motion: reduce` のとき、影・perspective を含む全アニメは停止 (即時切替) |
| AC2-5 | 既存 E2E 7 ケース (`viewer-keyboard.spec.ts` / `viewer-swipe.spec.ts`) を破壊しない |
| AC2-6 | バンドルサイズ (gzip) の増加は **0 kB** (CSS のみ、JS ライブラリ追加なし) |
| AC2-7 | キーボード ←/→ / ◀/▶ ボタン / スワイプの全 3 操作系で同等のアニメが再生される |

## 3. スコープ

**IN**:
- `src/styles/ehon.css` の `flipping-*` 関連キーフレーム改修
  - `.book-a` 親への `perspective: 1500px` 付与
  - `flipNextLeft` / `flipPrevRight` キーフレームに中間キー (50%) で `box-shadow` を追加
  - `flipNextRightFade` のフェードタイミング微調整 (60% → 40% で開始)
- ViewerB (`.book-b.flipping-*`) の easing を `cubic-bezier(0.2, 0.8, 0.2, 1)` に
- `src/styles/reduced-motion.css` への対応追記 (新規セレクタが増える場合のみ)
- `docs/UI_SPEC.md` 「アニメーション一覧」表のパラメータ更新 (architect 委譲)

**OUT (本 Issue ではやらない)**:
- ドラッグ追従めくり (Framer Motion / @use-gesture 導入が必要 → 別 Phase 3 候補)
- 3D 紙めくりライブラリ (`react-pageflip` 等) の導入
- ページ厚みの擬似要素追加 (`::before` でページ束を表現する等)
- ViewerA のページ送り方向反転 → 別 Issue (`viewer-a-rtl.md`)

## 4. 制約 / 未確定事項

未確定 (architect が判断):
- `box-shadow` の濃度・色 (`rgba(0,0,0,0.3)` を仮置き) は実機で視覚確認しながら調整
- `perspective` 値 (1500px 仮置き) は端末サイズで見え方が変わる可能性あり
- ViewerB の easing 変更が現状の slide とどの程度差を生むか visual review 必要

制約:
- React 18.3.1 / Vite 5 / TypeScript strict
- `<ruby>` / `<rt>` の DOM 構造を壊さない (R-005)
- `prefers-reduced-motion: reduce` 必須対応 (R-006)
- `@media (hover: none)` で hover 効果抑制中 (project-rules.md)
- AC2-6 の通り **JS ライブラリ追加禁止**

## 5. 現状分析

### 5.1 既存キーフレームの実体 (`src/styles/ehon.css:665-705`)

```css
.book-a.flipping-next .book-a-page.left {
  transform-origin: right center;
  animation: flipNextLeft 0.55s ease-in;
}
.book-a.flipping-next .book-a-page.right {
  animation: flipNextRightFade 0.55s ease-out;
}
.book-a.flipping-prev .book-a-page.right {
  transform-origin: left center;
  animation: flipPrevRight 0.55s ease-in;
}

@keyframes flipNextLeft {
  0% { transform: rotateY(0); }
  100% { transform: rotateY(-180deg); opacity: 0.7; }
}
@keyframes flipPrevRight {
  0% { transform: rotateY(0); }
  100% { transform: rotateY(180deg); opacity: 0.7; }
}
```

**不足点**:
- `.book-a` 親に `perspective` がない → rotateY が「斜めから見た」立体感に
  ならず、平板な回転に見える
- 中間キーがない → めくり中の影が表現できない
- 進入側 (`flipNextRightFade`) のフェード開始が 60% でやや遅い

### 5.2 ViewerB のアニメ (`ehon.css:763-814`)

`slideInRight` / `slideInLeft` は単純な `translateX(60px)` + `opacity` の
線形 ease。余韻のない切替で「紙の物体感」が乏しい。

### 5.3 reduced-motion.css のカバレッジ確認 (要 architect)

新規 CSS プロパティ (`box-shadow` / `perspective`) が `reduced-motion.css`
側でも明示的に無効化される必要があるか、または既存の `animation: none`
オーバーライドだけで十分か、architect が確認する。

## 6. 推奨アプローチ

### 6.1 ViewerA 強化案

```css
/* 親要素に perspective を付与 */
.book-a {
  perspective: 1500px;
  transform-style: preserve-3d;  /* 子要素の rotateY を立体保持 */
}

@keyframes flipNextLeft {
  0%   { transform: rotateY(0); box-shadow: none; }
  50%  {
    transform: rotateY(-90deg);
    box-shadow: -20px 0 30px rgba(0, 0, 0, 0.3);  /* めくり中の影 */
  }
  100% { transform: rotateY(-180deg); opacity: 0.7; box-shadow: none; }
}

@keyframes flipNextRightFade {
  0%   { opacity: 0; }
  40%  { opacity: 0; }   /* 60% → 40% に早めて、紙が起き上がる視覚情報を強化 */
  100% { opacity: 1; }
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

### 6.2 ViewerB 強化案

```css
.book-b.flipping-next .book-b-bg {
  animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.book-b.flipping-prev .book-b-bg {
  animation: slideInLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
/* card 側も同 easing に統一 */
```

### 6.3 reduced-motion.css

既存の `.book-a, .book-b { animation: none !important; }` 系のセレクタが
キーフレーム自体を無効化していれば追加対応不要。`perspective` は静的な
プロパティで動かないため対象外でよい (要 architect 確認)。

## 7. ドキュメント変更 (architect 委譲)

- `docs/SPEC.md`
  - UC-006 の AC に変更なし (既存「prefers-reduced-motion で停止」をそのまま継承)
  - 不要であれば触らない
- `docs/UI_SPEC.md`
  - 「アニメーション一覧」表 (該当節) に `box-shadow` / `perspective` の値を追記
- `docs/ARCHITECTURE.md`
  - R-006 (reduced-motion) のカバレッジ表を確認し、影響なければ更新不要
- `docs/TEST_PLAN.md`
  - E2E は変更不要 (アニメは見た目のみで挙動への影響なし)

## 8. architect への引き継ぎ (ARCHITECT_BRIEF)

- **目的**: 紙の厚み・立体感を CSS だけで表現し、ViewerA/B の「めくり感」を
  強化する
- **方針**:
  - `src/styles/ehon.css` のキーフレーム書き換えのみ
  - JS ライブラリ追加禁止 (AC2-6)
  - `prefers-reduced-motion` 互換維持 (R-006)
- **要決定事項**:
  - `box-shadow` の濃度 (案: `rgba(0, 0, 0, 0.3)`)
  - `perspective` の値 (案: 1500px)
  - ViewerB の `cubic-bezier` 値
- **回帰リスク**:
  - 既存 E2E 7 ケース (`viewer-keyboard.spec.ts` / `viewer-swipe.spec.ts`) を
    破壊しないこと → アニメ duration が 0.55s で同じなら timing は維持される
  - reduced-motion で AC2-4 を満たすこと
- **テスト方針**:
  - 視覚レビュー (ローカル `pnpm dev` で実機確認)
  - 既存 E2E は再実行のみ (新規ケース不要)
