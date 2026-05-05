# TASK.md

> Source: ARCHITECTURE.md (2026-05-05 / Tweaks 完全削除版 / ADR-009)
> Source: docs/design-notes/remove-tweaks-panel.md (2026-05-05)
> GitHub Issue: [#4](https://github.com/kirin0198/ehon/issues/4)

## Phase: Tweaks 機能の完全削除 (Phase 1〜5)

Last updated: 2026-05-05T02:00:00
Status: in-progress
Branch: feat/tweaks-simplification (PR #3 継続使用 / ユーザー判断)

## Task list

### Phase 1: 新型 + 新 store (settings-store の追加)
- [x] TASK-1-1: `src/types/settings.ts` を新規作成 (Settings / SettingsKey 型) | Target: src/types/settings.ts
- [x] TASK-1-2: `src/stores/settings-store.ts` を新規作成 (useSettingsStore + SETTINGS_DEFAULTS + normalizeSettings) | Target: src/stores/settings-store.ts
- [x] TASK-1-3: `tests/unit/settings-store.test.ts` を新規作成 (lazy init / setSetting / reset / 永続化 / whitelist 抽出) | Target: tests/unit/settings-store.test.ts

### Phase 2: 参照側を入れ替え (App / Shelf* / Viewer*)
- [x] TASK-2-1: `src/App.tsx` 改修 (TweaksProvider 削除 / useTweaks → useSettingsStore / tweaksOpen state 削除 / TweaksLauncher・TweaksPanel 削除) | Target: src/App.tsx
- [x] TASK-2-2: Shelf 系の型 import を `Tweaks` → `Settings` に置換 | Target: src/components/shelves/ShelfA.tsx, ShelfB.tsx, ShelfSwitcher.tsx
- [x] TASK-2-3: Viewer 系の型 import を `Tweaks` → `Settings` に置換 | Target: src/components/viewers/ViewerA.tsx, ViewerB.tsx, ViewerBar.tsx
- [x] TASK-2-4: `tests/unit/App.smoke.test.tsx` を TweaksProvider 不要前提に修正 | Target: tests/unit/App.smoke.test.tsx

### Phase 3: 旧 Tweaks 関連コード削除
- [ ] TASK-3-1: `src/components/tweaks/` ディレクトリ全体を git rm (5 ファイル + ディレクトリ) | Target: src/components/tweaks/
- [ ] TASK-3-2: `src/stores/tweaks-context.tsx` / `tweaks-reducer.ts` / `tweaks-defaults.ts` を git rm | Target: src/stores/
- [ ] TASK-3-3: `src/types/tweaks.ts` を git rm | Target: src/types/tweaks.ts
- [ ] TASK-3-4: `tests/unit/tweaks-context.test.tsx` / `tweaks-reducer.test.ts` / `TweaksPanel.test.tsx` を git rm | Target: tests/unit/

### Phase 4: E2E + ドキュメント更新
- [ ] TASK-4-1: `tests/e2e/persistence.spec.ts` を新キー `eh.settings` ベースに書き換え + 旧 `eh.tweaks` 残存ケース 1 本は維持 | Target: tests/e2e/persistence.spec.ts
- [ ] TASK-4-2: `docs/SPEC.md` 更新 (詳細は ARCHITECTURE.md §10「SPEC.md 差分更新方針」参照) | Target: docs/SPEC.md
- [ ] TASK-4-3: `docs/UI_SPEC.md` 更新 (詳細は ARCHITECTURE.md §10「UI_SPEC.md 差分更新方針」参照) | Target: docs/UI_SPEC.md
- [ ] TASK-4-4: `pnpm build` でバンドルサイズを計測し PR 説明用に raw / gzip 双方を控える | Target: (build artifact only)

### Phase 5: 仕上げ
- [ ] TASK-5-1: `pnpm typecheck` / `pnpm lint` / `pnpm format:check` / `pnpm test` 全 pass 確認 | Target: (verification only)
- [ ] TASK-5-2: `pnpm test:e2e` の主要シナリオ pass 確認 | Target: (verification only)
- [ ] TASK-5-3: `docs/TASK.md` を空テンプレートにリセット (Phase 完了後の運用ルール) | Target: docs/TASK.md

## Recent Commits

(TASK-1-1〜1-3 完了後に更新予定)

## Session Interruption Notes

(なし。Phase 開始時点)

## Notes for developer

- ブランチ `feat/tweaks-simplification` を継続使用 (PR #3)。新ブランチは切らない。
- commit メッセージは Conventional Commits + Co-Authored-By トレーラ (project-rules.md / git-rules.md)。
- commit 粒度の目安 (ARCHITECTURE.md §10):
  - `feat: useSettingsStore (settings-store + Settings type) を追加 (TASK-1-1〜1-3)`
  - `refactor: 参照側を useTweaks → useSettingsStore に切替 (App / Shelf* / Viewer* / ViewerBar) (TASK-2-1〜2-4)`
  - `feat: Tweaks 関連 (components/tweaks, stores/tweaks-*, types/tweaks) を削除 (TASK-3-1〜3-4)`
  - `test: tweaks 系 unit テストを削除し settings-store テストを追加 / persistence E2E を eh.settings に移行 (TASK-1-3 / TASK-3-4 / TASK-4-1)`
  - `docs: SPEC.md / ARCHITECTURE.md / UI_SPEC.md を Tweaks 削除に追従 (TASK-4-2 / 4-3)`
  - `chore: TASK.md をリセット (TASK-5-3)`
- 旧 localStorage キー (`eh.tweaks` / `ehon.tweaks` / `ehon.tweaks.v2`) は **読まない・削除しない** (放置)。クリーンアップコードを書かないこと。
- `useSettingsStore` の多重インスタンス注意: MVP では `App` 1 箇所のみ呼び出し、子コンポーネントへは props で配布する (ARCHITECTURE.md §3 注記)。
- PR タイトル / 説明は最終 commit 後にユーザー側で更新するため、developer は触らない。
