> Last updated: 2026-05-05
> GitHub Issue: [#5](https://github.com/kirin0198/ehon/issues/5)
> Analyzed by: analyst (2026-05-05)
> Next: architect

# ページめくりアニメーションとタッチスワイプ対応

## 1. 背景 / 動機

3〜5 歳児向け絵本アプリ「えほんやさん」では、紙の絵本に近い読書体験が UX の中核
価値である (project-rules.md「コンテンツ・著作権」「アクセシビリティ」)。

現状の Viewer (ViewerA = 見開き / ViewerB = 全画面背景) では、ページ送りの
インタラクションに以下の不足がある:

- **アニメーションの「めくり感」が弱い**: ViewerA は `rotateY(-180deg)` +
  フェードが既にあるが、表現としては "ページが回転して消える" だけで、
  *めくった先のページが下から現れる* 紙の挙動とは差がある。ViewerB は
  単純なスライド+フェード。
- **スワイプ未対応**: 想定 1st デバイスがタブレット (絵本はタッチで読む) に
  もかかわらず、入力手段は ◀/▶ ボタン + キーボード ←/→ のみ。
  `src/` 配下に `onTouchStart` / `onPointerDown` 等のタッチハンドラは皆無。
- **UI_SPEC の不整合**: `docs/UI_SPEC.md:293-294` には「画面右半分タップで次」
  「画面左半分タップで前」の記述があるが、実装には反映されていない。

ユーザー (オーナー) からの追加依頼:
> ページをめくるアニメーションを追加できませんか。
> また、スマートフォンまたはタブレット表示にて、スワイプでページをめくることが
> できますか。ライブラリ等で実装できないか検討してください。

## 2. ゴール / 受け入れ基準 (案)

| ID  | 受け入れ基準 |
|-----|--------------|
| AC-1 | 次/前ページ送り時に、紙のめくり感を持つアニメーションが再生される (ViewerA / ViewerB の両バリアント) |
| AC-2 | タブレット / スマートフォンの実機 (もしくは Playwright の touch エミュレーション) で、左右スワイプでページ送りができる |
| AC-3 | キーボード ←/→ と ◀/▶ ボタンによる既存の操作は引き続き動作する (回帰なし) |
| AC-4 | `prefers-reduced-motion: reduce` のとき、めくりアニメーションは停止 (即時切替) する |
| AC-5 | スワイプ中に他のジェスチャ (縦スクロール / ピンチ) と競合せず、誤操作で勝手にページが進まない |
| AC-6 | バンドルサイズ (gzip) の増加は **+15 kB 以内** を目安とする (現状 gzip 約 55 kB) |
| AC-7 | スワイプは ViewerA / ViewerB の両方で機能する |

## 3. スコープ

**IN**:
- `src/hooks/useViewerNav.ts` の拡張 (or 新規 `useSwipeNav.ts` 追加)
- `src/components/viewers/ViewerA.tsx` / `ViewerB.tsx` のジェスチャ受け付け実装
- `src/styles/ehon.css` の `flipping-*` 関連キーフレーム改修
- `src/styles/reduced-motion.css` への対応追記 (必要なら)
- 必要に応じてアニメ/ジェスチャライブラリの導入
- `docs/SPEC.md` / `docs/UI_SPEC.md` / `docs/ARCHITECTURE.md` の関連節を architect が更新

**OUT (今回はやらない)**:
- 3D 紙めくりの完全な物理シミュレーション (めくり中の影・ページ厚み表現等)
- マルチタッチでのピンチズーム
- スワイプアップ/ダウンでメニュー呼び出し等の追加ジェスチャ
- 本棚 (ShelfA/B) へのスワイプ拡張

## 4. 制約 / 未確定事項

未確定事項 (architect/main agent が AskUserQuestion で確認すべき項目):

- **Q1 アニメ表現**: 派手な 3D 紙めくり風 / シンプルな水平スライド+影 / 現状を
  ベースに微調整 (ease 改善・durations 調整) のいずれか
- **Q2 ライブラリ方針**: ジェスチャは入れたいがアニメは CSS のままが良いか、
  Framer Motion (motion) でジェスチャ+アニメを統合したいか
- **Q3 スワイプ閾値**: デフォルト (50px / 30%幅 等) は analyst で仮置きするが、
  実機で UX 確認後に微調整が必要
- **Q4 スコープ分割**: アニメとスワイプを 1 PR で出すか、分けるか
  (推奨: スワイプ → アニメ改善 の 2 PR に分割。スワイプ単体でも UX 改善に
  効果が大きく、独立検証しやすい)

制約:
- React 18.3.1 / Vite 5 / TypeScript strict
- `<ruby>` / `<rt>` の DOM 構造を壊さない (SR 互換, SPEC R-005)
- `prefers-reduced-motion: reduce` 必須対応
- `@media (hover: none)` で hover 効果抑制中 (project-rules.md)
- ViewerBar / 進捗バー / ナビボタンとイベントが衝突しないこと

## 5. 現状分析

### 5.1 関連ファイル

| ファイル | 役割 | 変更想定 |
|----------|------|----------|
| `src/hooks/useViewerNav.ts` | ページ送り state, キーボード, 500ms ロック | 拡張 (タッチハンドラ提供 or 別 hook 追加) |
| `src/components/viewers/ViewerA.tsx` | 見開きビュアー | スワイプハンドラ装着 |
| `src/components/viewers/ViewerB.tsx` | 全画面ビュアー | スワイプハンドラ装着 |
| `src/components/viewers/ViewerBar.tsx` | 上部ツールバー | 影響なし (バー内タッチがスワイプに食われないよう注意) |
| `src/styles/ehon.css` (665-814) | `flipping-*` クラスのキーフレーム | アニメ表現を強化する場合に改修 |
| `src/styles/reduced-motion.css` | アニメ無効化 | 新規セレクタ追加が必要なら追記 |
| `docs/UI_SPEC.md:293-294` | 「画面半分タップ」記述 | 実装に合わせて再整理 (architect) |
| `docs/SPEC.md` UC-VIEW 節 | UC 受け入れ基準 | スワイプ受け入れ基準を追加 (architect) |
| `docs/ARCHITECTURE.md` ADR / R-006 | アニメロック / reduced-motion | スワイプ ADR と必要なら ADR 追加 |

### 5.2 既存アニメの実体 (ehon.css 抜粋)

```css
.book-a.flipping-next .book-a-page.left  { animation: flipNextLeft 0.55s ease-in; }
.book-a.flipping-next .book-a-page.right { animation: flipNextRightFade 0.55s ease-out; }
.book-a.flipping-prev .book-a-page.right { animation: flipPrevRight 0.55s ease-in; }

@keyframes flipNextLeft  { 0%{transform:rotateY(0)}    100%{transform:rotateY(-180deg);opacity:.7} }
@keyframes flipPrevRight { 0%{transform:rotateY(0)}    100%{transform:rotateY( 180deg);opacity:.7} }
```

ViewerA は既に 3D 風の Y 軸回転を使っており、表現としてはミドル級。
不足は (a) 「下から現れる」感の弱さ、(b) めくり最中の影、(c) 進行率に
ジェスチャを連動させる "ドラッグ追従" がないこと。

### 5.3 useViewerNav の現状

`flipDir` / `isFlipping` / 500ms `FLIP_LOCK_MS` という抽象が既に存在し、
タッチハンドラから `go(±1)` を呼ぶだけで CSS アニメフックは流用可能。
=> **スワイプ実装は最小コストで済む**。

## 6. 候補ライブラリの比較

### 6.1 アニメーション

| ライブラリ | gzip 概算 | アクティビティ | React 18 互換 | License | 評価 |
|-----------|-----------|----------------|---------------|---------|------|
| **CSS のみ** (現状継続) | 0 kB | — | — | — | 既に rotateY が動いている。durations / easing / 影の改善で済むなら最善。reduced-motion も最も素直 |
| **Framer Motion (motion)** | ~30-40 kB | 活発 | OK | MIT | 表現力◎、ドラッグ追従もネイティブにある (`drag="x"` + `dragSnapToOrigin`)。ただしバンドル増加は AC-6 を圧迫。tree-shaking 後の実際値は要計測 |
| **React Spring** | ~15-20 kB | 活発 | OK | MIT | 物理ベース。react-use-gesture と組み合わせる前提が強い |
| **react-pageflip** | ~10-15 kB | 活発度低め | OK と公称 | MIT | 紙めくり特化。見栄え◎。ただし「見開きライブラリ」の前提が強く、ViewerB (全画面背景) には不向き |

### 6.2 ジェスチャ

| ライブラリ | gzip 概算 | アクティビティ | React 18 互換 | License | 評価 |
|-----------|-----------|----------------|---------------|---------|------|
| **Pointer Events 自前** | 0 kB | — | — | — | `pointerdown/move/up` で 50 行程度。閾値 50px or 速度ベース。十分実用的 |
| **react-swipeable** | ~3-5 kB | 活発 | OK | MIT | API がシンプル (`useSwipeable`)。スワイプ用途に特化。学習コスト極小。**推奨候補** |
| **@use-gesture/react** | ~10-15 kB | 活発 | OK | MIT | 強力。React Spring と相性◎。ただしオーバースペック傾向 |
| **Hammer.js** | ~7 kB | メンテ停滞 | フック自前ラップ要 | MIT | 古典。今から採用する理由は薄い |

### 6.3 評価サマリ

- **アニメーション**: 既に CSS で `rotateY` が動作中。**追加ライブラリは原則不要**。
  必要なら durations / easing / 影 (`box-shadow`) / `perspective` 親要素の追加で
  十分に「めくり感」を強化できる。バンドル増加 0 kB を維持しつつ AC-1 を達成可能。
- **ジェスチャ**: 自前 Pointer Events (約 50 行) と `react-swipeable` (約 +4 kB) の
  二択。保守性・コードの読みやすさを取って **`react-swipeable` を推奨**。
  AC-6 (gzip +15 kB) に十分収まる。

## 7. 推奨アプローチ

### Phase 1: スワイプ対応 (最小・独立で出荷可能)

1. `pnpm add react-swipeable`
2. `src/hooks/useViewerNav.ts` に変更なし。代わりに `ViewerA.tsx` / `ViewerB.tsx`
   のルート要素に `useSwipeable({ onSwipedLeft: () => go(1), onSwipedRight: () => go(-1), trackMouse: false, delta: 50 })` を追加
3. **縦スクロール衝突対策**: `preventScrollOnSwipe: true` は誤動作の元 (テキストカード内
   スクロールを阻害) なので原則 false。横方向への大きな動きのみで判定
4. `aria-roledescription="page"` 等の付与は architect で検討
5. UI_SPEC.md `293-294` の「画面半分タップ」記述は **削除** し、スワイプ仕様に置換
6. SPEC.md UC-VIEW に「スワイプでページ送り」の受け入れ基準を追加 (architect)
7. Playwright の `page.touchscreen.tap` / `dispatchEvent('touchstart' ...)` で
   E2E ケース 1〜2 件追加

### Phase 2: アニメーション強化 (任意・段階的)

1. `src/styles/ehon.css` の改修のみ (ライブラリ追加なし):
   - `.book-a` 親に `perspective: 1500px` を付与
   - `flipNextLeft` のキーフレームに中間キー (50%) で `box-shadow: -20px 0 30px rgba(0,0,0,.3)` を入れて影でめくり感を出す
   - 進入側ページ (right) のフェードを開始 60% から 40% に早めて、紙が起き上がる視覚情報を強化
   - ViewerB の slide も `cubic-bezier(0.2, 0.8, 0.2, 1)` で余韻を付与
2. `prefers-reduced-motion` 対応 (既存 reduced-motion.css でカバー済み)
3. (オプション) ジェスチャ進行率に応じてめくりが追従する "drag-to-flip" は別 PR
   とし、**Phase 2 では含めない** (Framer Motion の導入が必要になりバンドル増)

### Phase 1+2 の作業見積

- Phase 1 (スワイプ): developer 0.5〜1 日 + tester (E2E) 0.5 日
- Phase 2 (CSS アニメ強化): developer 0.5 日 + 視覚レビュー 0.5 日

## 8. ドキュメント変更 (architect 委譲)

- `docs/SPEC.md`
  - UC-VIEW (もしくは UC-NAV) にスワイプ操作の受け入れ基準を追加
  - 受け入れ基準として「タッチ left/right swipe で前/次ページに遷移すること」を明記
- `docs/UI_SPEC.md`
  - L293-294 の「画面右半分タップ / 左半分タップ」を「左/右スワイプ」に書き換え
  - 「アニメーション一覧」表に Phase 2 で改修したパラメータ (durations, box-shadow) を追記
- `docs/ARCHITECTURE.md`
  - 「ライブラリ一覧」に react-swipeable (バージョン, 採用理由) を追記
  - 必要なら ADR-NEW: スワイプジェスチャ採用方針 (Pointer Events 自前 vs ライブラリ)
  - R-006 の reduced-motion 表でカバレッジが変わらないことを確認
- `docs/TEST_PLAN.md`
  - スワイプの E2E テストケース追加

## 9. architect への引き継ぎ (ARCHITECT_BRIEF)

- **目的**: 紙の絵本に近いめくり体験と、タッチデバイスでのスワイプ操作を導入する
- **段階分割の推奨**: Phase 1 (スワイプ / react-swipeable 採用) と
  Phase 2 (CSS アニメ強化 / ライブラリ追加なし) に分け、Phase 1 を先行リリース
- **ライブラリ判断のポイント**:
  - スワイプは `react-swipeable` (gzip 約 +4 kB) を採用推奨。自前 Pointer Events
    でも可だが、保守性で勝る
  - アニメは既存 CSS の `rotateY` 改修で十分。Framer Motion / React Spring の
    導入は「ドラッグ追従めくり」が必要になった段階で再検討 (Phase 3 候補)
- **要決定事項**:
  - スワイプ閾値 (delta) のデフォルト値 (推奨 50px)
  - `trackMouse` を有効化するか (PC でのデバッグに便利だが本番は false 推奨)
  - Phase 2 のアニメ表現の方向性 (本物の紙めくり風 vs 控えめな改善)
- **影響テスト**:
  - ViewerBar 内のタップ操作 (ふりがな切替等) がスワイプに食われないよう、
    `useSwipeable` の対象を `.eh-viewer-stage` のみに限定する
  - `<ruby>` 構造を壊さない (R-005)
  - reduced-motion で AC-4 を満たす
- **回帰リスク**:
  - 既存 E2E (ページ送り / フリップロック) が壊れないこと
  - キーボード ←/→ と ◀/▶ ボタンが引き続き動くこと

