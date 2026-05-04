# TASK.md

> Source: ARCHITECTURE.md (2026-05-04 / Tweaks 本番固定化版)

## Phase: Tweaks 本番固定化 (Phase A〜E)
Last updated: 2026-05-04T00:00:00
Status: Completed

## Task list

### Phase A: 型・ストアの刈り込み
- [x] TASK-A1: src/types/tweaks.ts / tweaks-defaults.ts / tweaks-reducer.ts / tweaks-context.tsx の刈り込み | Target: src/types/, src/stores/

### Phase B: UI の刈り込み
- [x] TASK-B1: TweaksPanel.tsx を 2 セクション・4 操作に縮小 | Target: src/components/tweaks/TweaksPanel.tsx
- [x] TASK-B2: ViewerBar.tsx ± ボタン削除 / ViewerA.tsx / ViewerB.tsx / App.tsx の fontSize props 削除 | Target: src/components/viewers/, src/App.tsx

### Phase C: 不要モジュール削除 + tokens.css 固定値
- [x] TASK-C1: TweakColor.tsx / TweakSelect.tsx / TweakSlider.tsx / accent-presets.ts / font-presets.ts 削除 + tokens.css 固定値追加 | Target: src/components/tweaks/, src/lib/, src/styles/tokens.css

### Phase D: テスト整理
- [x] TASK-D1: tweaks-reducer.test.ts / TweaksPanel.test.tsx / persistence.spec.ts 修正 + 旧キー残存 E2E 追加 + Viewer.test.tsx fontSize props 削除 | Target: tests/

### Phase E: index.html フォント整理
- [x] TASK-E1: index.html から不要フォント <link> を削除し M PLUS Rounded 1c のみ残す | Target: index.html

## Recent Commits
(git log 更新予定)

## Session Interruption Notes
(なし)
