# TASK.md

> Source: ARCHITECTURE.md (2026-05-04)

## Phase: Phase 1〜9 implementation
Last updated: 2026-05-04
Status: in-progress

## Task list

### Phase 1: Foundation
- [x] TASK-001: project init / scaffolder の生成物確認 | (scaffolder で完了 / commit b26d067)
- [ ] TASK-002: src/types/story.ts + src/types/tweaks.ts | Target: src/types/
- [ ] TASK-003: src/data/stories.ts に既存モック data/stories.js を TS 化して移植 | Target: src/data/stories.ts
- [x] TASK-004: src/styles/{tokens,global,ehon,reduced-motion}.css 移植 | (scaffolder で完了 / 詳細は developer で追加)
- [ ] TASK-005: ruby-parser / safe-storage / illustration-path / font-presets / accent-presets | Target: src/lib/

### Phase 2: State Layer
- [ ] TASK-006: tweaks-defaults.ts + tweaks-reducer.ts | Target: src/stores/
- [ ] TASK-007: tweaks-context.tsx と useTweaks フック | Target: src/stores/

### Phase 3: Common Components
- [ ] TASK-008: RubyText.tsx | Target: src/components/common/
- [ ] TASK-009: IllustWithFallback.tsx | Target: src/components/common/
- [ ] TASK-010: EhButton / EmptyState / ErrorBoundary | Target: src/components/common/
- [ ] TASK-011: Header.tsx | Target: src/components/layout/

### Phase 4: Shelf
- [ ] TASK-012: TagFilter.tsx + ShelfSwitcher.tsx | Target: src/components/shelves/
- [ ] TASK-013: ShelfA.tsx | Target: src/components/shelves/
- [ ] TASK-014: ShelfB.tsx | Target: src/components/shelves/

### Phase 5: Viewer
- [ ] TASK-015: useViewerNav.ts | Target: src/hooks/
- [ ] TASK-016: ViewerBar.tsx | Target: src/components/viewers/
- [ ] TASK-017: CoverPage.tsx | Target: src/components/viewers/
- [ ] TASK-018: ViewerA.tsx | Target: src/components/viewers/
- [ ] TASK-019: ViewerB.tsx | Target: src/components/viewers/

### Phase 6: Tweaks Panel
- [ ] TASK-020: Tweak* 部品 (Section/Radio/Toggle/Slider/Color/Select) | Target: src/components/tweaks/
- [ ] TASK-021: TweaksLauncher.tsx | Target: src/components/tweaks/
- [ ] TASK-022: TweaksPanel.tsx | Target: src/components/tweaks/

### Phase 7: App Composition
- [ ] TASK-023: App.tsx 全体結合 | Target: src/App.tsx
- [ ] TASK-024: main.tsx エントリ | (scaffolder で骨格作成済み、necessary updates)
- [ ] TASK-025: index.html / public 整備 | (scaffolder で骨格作成済み)

### Phase 8: Polish & a11y
- [ ] TASK-026: prefers-reduced-motion 対応強化 | Target: src/styles/reduced-motion.css 拡張
- [ ] TASK-027: フォーカス管理 (useFocusTrap) と aria 属性 | Target: src/hooks/useFocusTrap.ts ほか
- [ ] TASK-028: 100dvh / iPad Safari 確認 | Target: 各 CSS

### Phase 9: Optional
- [ ] TASK-029: URL クエリ同期 (Could / 余力あれば) | Target: src/App.tsx 等

## Recent commits
b26d067 chore: initialize project scaffold (TASK-001)

## Suspension notes
(なし)
