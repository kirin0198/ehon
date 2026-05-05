> Last updated: 2026-05-05
> GitHub Issue: [#4](https://github.com/kirin0198/ehon/issues/4)
> Analyzed by: analyst (2026-05-05)
> Next: architect

# Tweaks 機能 (パネル/ランチャー/Provider) の完全削除

## 1. 背景 / Motivation

直近 PR #3 (`feat/tweaks-simplification`) で Tweaks パネルを「2 セクション・4
操作」に縮小したが、ユーザーの本来の意図は **Tweaks 機能そのものの削除** で
あり、縮小ではなかった。本作業はその意図を反映するためのフォローアップ。

ユーザー発言 (一次ソース) :

> Tweaks について、Tweaks 機能自体を削除してほしいという依頼です。
> 残っている切り替え (本棚/ビュアーのバリアント切り替え等) に関しては、
> UI 側で切り替え可能なので、削除で問題ないです。

現状を確認したところ、Tweaks パネルが提供している 4 操作はすべて画面内に
等価な UI が既に存在する:

| Tweaks パネルの操作 | 画面内の等価 UI                                | 場所             |
|---------------------|-----------------------------------------------|------------------|
| 本棚バリアント A/B  | `ShelfSwitcher` (📚 立てかけ / 🗂 表紙ならべ) | 本棚 Header 右   |
| ビュアーバリアント  | ViewerBar 右側の「見開き A/B」ピル              | ビュアー上部     |
| ふりがな ON/OFF     | ViewerBar の「ふりがな あり/なし」ボタン        | ビュアー上部     |
| 夜モード ON/OFF     | ViewerBar の「☀ ひる / 🌙 よる」ボタン          | ビュアー上部     |

つまり Tweaks パネル/ランチャーを削除しても **機能は失われない**。

## 2. Goal / 受入基準

- 右下フローティング ⚙ ボタン (`TweaksLauncher`) を画面から完全に消す
- Tweaks パネル本体 (`TweaksPanel` / `TweakSection` / `TweakRadio` /
  `TweakToggle`) を含む `src/components/tweaks/` ディレクトリを削除する
- `TweaksProvider` / `useTweaks` / `tweaksReducer` / `TWEAK_DEFAULTS` /
  `Tweaks` / `TweakKey` 型を削除する (= `src/stores/tweaks-*.ts(x)` と
  `src/types/tweaks.ts` を削除)
- 本棚バリアント・ビュアーバリアント・ふりがな・夜モードの 4 状態は
  軽量な `useSettingsStore` (Zustand 不採用方針を維持し、
  `useState` + lazy initializer + `useEffect` での localStorage 同期) に
  置換する。**永続化は維持する** (再訪時に夜モード等が記憶されている UX
  を壊さない)
- localStorage キーは新規 `eh.settings` (v1) を採用。旧 `eh.tweaks`
  (および更に旧の `ehon.tweaks` / `ehon.tweaks.v2`) は **読まない・
  削除しない** (放置)。残骸は無害 (型に乗らないキーは無視される)
- `App.tsx` から `TweaksProvider` 包みと `tweaksOpen` state を撤去
- `index.html` `<title>` 等への影響なし
- 既存ユニットテスト (`tweaks-context.test.tsx`, `tweaks-reducer.test.ts`,
  `TweaksPanel.test.tsx`) を削除し、`useSettingsStore` 用の新テストを追加
- E2E (`tests/e2e/persistence.spec.ts`) は新キー (`eh.settings`) で
  夜モード復元を検証する形に書き換える
- バンドル削減目標: PR #3 後 (170.51 kB raw / 56.08 kB gzip) からさらに
  小さくなる見込み。最低でも raw 5 kB / gzip 1 kB の追加削減を確認する

### 受入チェックリスト

- [ ] `pnpm typecheck` pass
- [ ] `pnpm lint` pass
- [ ] `pnpm format:check` pass
- [ ] `pnpm test` (Vitest) all pass
- [ ] `pnpm build` 成功 + バンドルサイズ計測値を PR 説明に記載
- [ ] Playwright E2E (`pnpm test:e2e`) 主要シナリオ pass
- [ ] 手動確認: 起動直後 ⚙ ボタンが画面に存在しない
- [ ] 手動確認: 夜モードに切替 → リロードで復元される
- [ ] 手動確認: 本棚 A → B 切替 → リロードで B が復元される
- [ ] 手動確認: ふりがな OFF → リロードで OFF が復元される

## 3. Scope

### 削除対象ファイル (10 ファイル + 1 ディレクトリ)

| 区分        | パス                                      | 理由                                        |
|-------------|------------------------------------------|---------------------------------------------|
| component   | `src/components/tweaks/TweaksLauncher.tsx`  | 右下 ⚙ ボタン: 不要                          |
| component   | `src/components/tweaks/TweaksPanel.tsx`     | パネル本体: 不要                             |
| component   | `src/components/tweaks/TweakSection.tsx`    | パネル子部品: 不要                           |
| component   | `src/components/tweaks/TweakRadio.tsx`      | パネル子部品: 不要                           |
| component   | `src/components/tweaks/TweakToggle.tsx`     | パネル子部品: 不要                           |
| dir         | `src/components/tweaks/`                    | 上記 5 ファイル削除後に空になるためディレクトリごと削除 |
| store       | `src/stores/tweaks-context.tsx`             | Provider/Context: 不要                       |
| store       | `src/stores/tweaks-reducer.ts`              | Reducer: 不要                               |
| store       | `src/stores/tweaks-defaults.ts`             | Defaults: `useSettingsStore` の中に内包する |
| type        | `src/types/tweaks.ts`                       | `Tweaks` / `TweakKey` 型: 新型に置換         |
| test (unit) | `tests/unit/tweaks-context.test.tsx`        | 対象削除                                    |
| test (unit) | `tests/unit/tweaks-reducer.test.ts`         | 対象削除                                    |
| test (unit) | `tests/unit/TweaksPanel.test.tsx`           | 対象削除                                    |

### 新規追加ファイル (2 ファイル)

| パス                                    | 内容                                                                   |
|-----------------------------------------|------------------------------------------------------------------------|
| `src/stores/settings-store.ts`           | `useSettingsStore()` カスタム hook。`Settings` 型 / `SETTINGS_DEFAULTS` / `normalizeSettings` を含む |
| `tests/unit/settings-store.test.ts`     | hook の Vitest テスト (lazy init / set / reset / 永続化)                |

> 設計メモ: 状態管理ライブラリ (Zustand 等) は導入しない。
> `project-rules.md` の「依存削減」「Tweaks 1 種類のみで Context で十分」
> という方針を継承し、`useState` + `useEffect` ベースの hook 1 本で完結
> させる (Provider 不要)。

### 改修ファイル

| パス                                  | 変更概要                                                                |
|--------------------------------------|------------------------------------------------------------------------|
| `src/App.tsx`                         | `TweaksProvider` ラップ削除 / `tweaksOpen` state 削除 / `TweaksLauncher`・`TweaksPanel` 削除 / `useSettingsStore()` で settings を取得し props で配布 |
| `src/components/shelves/ShelfA.tsx`   | `Tweaks['shelfVariant']` → `Settings['shelfVariant']` (型名のみ変更)    |
| `src/components/shelves/ShelfB.tsx`   | 同上                                                                    |
| `src/components/shelves/ShelfSwitcher.tsx` | 同上                                                              |
| `src/components/viewers/ViewerA.tsx`  | 同上 (`viewerVariant`)                                                   |
| `src/components/viewers/ViewerB.tsx`  | 同上                                                                    |
| `src/components/viewers/ViewerBar.tsx`| 同上                                                                    |
| `tests/e2e/persistence.spec.ts`       | localStorage キーを `eh.tweaks` → `eh.settings` に書き換え。旧キー残存テスト (legacy) は維持 (新コードが旧キーを読まないことを担保) |
| `tests/unit/App.smoke.test.tsx`       | `TweaksProvider` 不要化に伴うレンダ修正                                 |

### 影響を受けないファイル

- `src/lib/safe-storage.ts` — 引き続き利用 (キー名のみ変更)
- `src/lib/ruby-parser.ts` — ふりがな機能は維持
- `src/styles/tokens.css` — 固定値 (#E07856 / 26px / M PLUS Rounded 1c)
  はそのまま
- `index.html` — フォント `<link>` も現状のまま (M PLUS Rounded 1c のみ)

## 4. Constraints / Open questions

### 推測で進めた設計判断 (orchestrator/architect で再判断可能)

1. **永続化を維持する** — ユーザー発言「削除で問題ない」の対象は Tweaks
   **機能** (= 設定一括 UI) であり、UX (再訪時の状態復元) を悪化させる
   意図とは読まなかった。完全削除案 (毎回デフォルトで起動) も技術的には
   可能。
2. **localStorage キーを新規 `eh.settings` にする** — 旧 `eh.tweaks` の
   余分なキー (fontSize / accent / font の残骸) が読み込まれる経路を
   完全に絶ち、データの世代管理を明示する。旧キーは放置 (削除しない)。
3. **ふりがな機能 / 夜モード機能本体は維持** — ViewerBar 上の切替 UI が
   残っている = ユーザー発言「UI 側で切り替え可能なので削除で問題ない」
   の範疇に含まれると解釈。3〜5 歳児ターゲットで中核アクセシビリティ
   機能 (ふりがな) を消すのは設計的に重い判断のため明示的な指示なし
   では削除しない。
4. **PR #3 の扱い** — 縮小→さらに削除と二段階で履歴を積むより、PR #3
   を閉じて `refactor/remove-tweaks` ブランチを `main` から新規に切り
   `Tweaks 機能の完全削除` 単体の clean な PR にする方が履歴が読みやすい。
   ただし orchestrator/architect の判断で「PR #3 上に追加 commit を
   積む」案も選択可能 (§8 ARCHITECT_BRIEF 参照)。

### Open questions

- なし (上記推測で進める想定)

## 5. Analysis (現状分析)

### 5.1 Tweaks 関連コードの現状

PR #3 完了後の状態:

```
src/
├── components/
│   └── tweaks/                         (5 ファイル)
│       ├── TweakRadio.tsx
│       ├── TweakSection.tsx
│       ├── TweakToggle.tsx
│       ├── TweaksLauncher.tsx          # 右下 ⚙ ボタン (本件で削除)
│       └── TweaksPanel.tsx             # パネル本体 2 セクション・4 操作
├── stores/
│   ├── tweaks-context.tsx              # TweaksProvider / useTweaks
│   ├── tweaks-defaults.ts              # TWEAK_DEFAULTS (4 フィールド)
│   └── tweaks-reducer.ts               # tweaksReducer / normalizeTweaks
└── types/
    └── tweaks.ts                       # Tweaks (4 fields) / TweakKey
```

### 5.2 Tweaks 状態を参照しているコンポーネント

`useTweaks()` 直接呼び出し:
- `src/App.tsx` — `tweaks` / `setTweak` を取得し各画面に props で配布

`Tweaks` 型 import:
- `src/components/shelves/ShelfA.tsx` — `Tweaks['shelfVariant']`
- `src/components/shelves/ShelfB.tsx` — `Tweaks['shelfVariant']`
- `src/components/shelves/ShelfSwitcher.tsx` — `Tweaks['shelfVariant']`
- `src/components/viewers/ViewerA.tsx` — `Tweaks['viewerVariant']`
- `src/components/viewers/ViewerB.tsx` — `Tweaks['viewerVariant']`
- `src/components/viewers/ViewerBar.tsx` — `Tweaks['viewerVariant']`

これらは型エイリアス用途のみ。新型 `Settings` への単純置換で済む。

### 5.3 永続化 (localStorage) の現状

- 現キー: `eh.tweaks` (`src/stores/tweaks-context.tsx` の
  `TWEAKS_STORAGE_KEY`)
- 旧キー (legacy): `ehon.tweaks` / `ehon.tweaks.v2` — 既に読まれない
  運用 (`docs/design-notes/pr3-persistence-e2e-fix.md` で対応済み)
- 保存スキーマ: `{ shelfVariant, viewerVariant, ruby, night }` の 4 キー
  (PR #3 で fontSize/accent/font を除去済み)

新キー `eh.settings` 採用後も旧 `eh.tweaks` は放置で害なし
(`normalizeSettings` の whitelist により無視される)。

### 5.4 PR #3 commit history (8 commits, all on feat/tweaks-simplification)

```
57e5d80 fix(test): persistence E2E のレース解消 (TASK-Fix1)
9f09a34 docs: TASK.md / SPEC.md / ARCHITECTURE.md / UI_SPEC.md / design-notes 更新
9403688 feat: index.html から不要フォント <link> を削除し M PLUS Rounded 1c のみ残す (TASK-E1)
054df0b test: 削除キー関連アサーション除去、旧 localStorage キー残存テスト追加 (TASK-D1)
fb0a2ec feat: 不要モジュール 5 ファイル削除、tokens.css に固定値を直書き (TASK-C1)
... (Phase A/B 系コミット)
```

「縮小→削除」と二段階で進めた履歴になるため、最終形だけ残したいなら
PR #3 を閉じて `main` から新ブランチを切る方が clean。

## 6. Approach (実装方針)

### Phase 1: 新型 + 新 store

1. `src/types/settings.ts` を新規作成
   ```ts
   export type Settings = {
     shelfVariant: 'A' | 'B';
     viewerVariant: 'A' | 'B';
     ruby: boolean;
     night: boolean;
   };
   export type SettingsKey = keyof Settings;
   ```
2. `src/stores/settings-store.ts` を新規作成 (`useSettingsStore` hook)
   - `SETTINGS_DEFAULTS` / `normalizeSettings` (whitelist) を内包
   - 内部で `useState(() => normalizeSettings(storage.get('eh.settings', SETTINGS_DEFAULTS)))`
   - `useEffect(() => storage.set('eh.settings', settings), [settings])`
   - `useEffect` で `night` → `<html class="night">` 同期
   - `useEffect` で `ruby` → `<html class="no-ruby">` 同期
   - 戻り値: `{ settings, setSetting, reset }`
3. `tests/unit/settings-store.test.ts` を作成 (Vitest + renderHook)

### Phase 2: 参照側を入れ替え

1. `src/App.tsx` を改修
   - `TweaksProvider` 包み削除
   - `useTweaks()` → `useSettingsStore()`
   - `tweaksOpen` state / `<TweaksLauncher>` / `<TweaksPanel>` 削除
2. `Shelf*` / `Viewer*` / `ViewerBar` / `ShelfSwitcher` の `Tweaks` 型
   import を `Settings` 型に置換
3. `tests/unit/App.smoke.test.tsx` を `TweaksProvider` 不要前提に修正

### Phase 3: 旧 Tweaks 関連コード削除

1. `src/components/tweaks/` ディレクトリを削除 (rmdir)
2. `src/stores/tweaks-context.tsx` / `tweaks-reducer.ts` /
   `tweaks-defaults.ts` を削除
3. `src/types/tweaks.ts` を削除
4. `tests/unit/tweaks-context.test.tsx` /
   `tests/unit/tweaks-reducer.test.ts` /
   `tests/unit/TweaksPanel.test.tsx` を削除

### Phase 4: E2E + ドキュメント

1. `tests/e2e/persistence.spec.ts` を新キー `eh.settings` ベースに改修
   (旧 `eh.tweaks` 残存テスト 1 本は「新コードは旧キーを読まない」担保
    のため残す)
2. SPEC.md / ARCHITECTURE.md / UI_SPEC.md を更新 (§7 参照)
3. `pnpm build` でバンドルサイズを計測し PR 説明に記載

### Phase 5 (orchestrator 判断): PR #3 の扱い

- 推奨: PR #3 を `gh pr close 3 --comment "ユーザー意図再確認の結果、
  縮小ではなく完全削除に方針変更。新 PR で再起する"` で閉じ、
  `main` から `refactor/remove-tweaks` を切る
- 代替: PR #3 ブランチ上に Phase 1〜4 を追加 commit する
  (PR タイトル / 説明を「Tweaks 機能の完全削除」に書き換える)

## 7. Document changes (差分更新方針)

### SPEC.md

**変更が必要な節**:

| 節                     | 変更内容                                                          |
|------------------------|------------------------------------------------------------------|
| 1. Update history       | `2026-05-05: Tweaks 機能の完全削除 (analyst / TweaksPanel/Launcher/Provider/Context/Reducer 削除、useSettingsStore 置換、UC-014 削除)` を追記 |
| 1. Scope (IN)           | 「Tweaks 設定の localStorage 永続化」の文言から「フォント / 文字サイズ / アクセント色」を完全に消し、「ユーザー設定 (本棚バリアント / ビュアーバリアント / ふりがな / 夜モード) の localStorage 永続化」に書き換え |
| 2. 推奨技術スタック      | 「状態管理: React Context + useReducer + localStorage」 → 「軽量カスタム hook (`useSettingsStore`) + localStorage」 |
| 3. 不採用候補            | Zustand 不採用理由は維持 (依存削減)                              |
| 4. UC 表                | `UC-014 Tweaks パネルで本棚 / ビュアー / ふりがな / 夜モードの 4 項目を一括操作する` を **削除マーカー** に変更 (UC-010/012/013 と同じ書式)。`UC-009 / UC-011` の正常フローから「Tweaks パネル」を削除し ViewerBar のみ残す。`UC-002 / UC-008` の正常フローから「Tweaks パネル」を削除し ShelfSwitcher / ViewerBar のみ残す |
| 4. UC-015               | キー名を `eh.tweaks` → `eh.settings` に変更。旧キー `eh.tweaks` は読まれず放置される旨を追記 |
| 6. データモデル / Tweaks 型 | 節タイトルを「Settings 型」に変更。`Tweaks` 表記を `Settings` に。フィールド表は 4 行のまま (中身同じ) |
| 7. 用語集                | `Tweaks` → `Settings` のリネーム、`Tweaks パネル` 行を削除      |

### ARCHITECTURE.md

**変更が必要な節**:

| 節                       | 変更内容                                                          |
|--------------------------|------------------------------------------------------------------|
| Source 行                | `docs/design-notes/remove-tweaks-panel.md (2026-05-05)` を追記   |
| Update history           | `2026-05-05: Tweaks 機能の完全削除 (architect / TweaksProvider/Context/Reducer 削除、useSettingsStore 置換、ADR-009 追記)` を追記 |
| Mermaid 図 (Component diagram) | `App → Shelf/Viewer/TweaksPanel` から `TweaksPanel` を除去。`Tweaks Context + useReducer` を `useSettingsStore (custom hook)` に置換 |
| 技術選定表                | 「状態管理: React Context + useReducer」 → 「カスタム hook (`useSettingsStore`)」 |
| ディレクトリ図            | `src/components/tweaks/` 全体を削除。`src/stores/tweaks-*` を `src/stores/settings-store.ts` に置換。`src/types/tweaks.ts` を `src/types/settings.ts` に置換 |
| 主要コンポーネント節      | `TweaksProvider` 節を削除し `useSettingsStore` 節に置換。`TweaksPanel` / `TweaksLauncher` / `TweakSection` / `TweakRadio` / `TweakToggle` 節を削除 |
| ADR セクション            | 新規 ADR-009「Tweaks 機能の完全削除と useSettingsStore への置換」を追加 |
| Test 構成                | `tweaks-*` テストを削除し `settings-store.test.ts` を追加         |

### UI_SPEC.md

**変更が必要な節**:

| 節                       | 変更内容                                                          |
|--------------------------|------------------------------------------------------------------|
| Update history           | `2026-05-05: Tweaks パネル / TweaksLauncher を完全削除 (analyst / SCR-003 削除、本棚/ビュアー画面の Tweaks ボタン記述を全消去)` を追記 |
| §3 画面遷移図 (Mermaid)   | `Home -->|Tweaks ボタン| Tweaks` / `Viewer -->|Tweaks ボタン| Tweaks` / `Tweaks` ノードと閉じる遷移を完全削除 |
| §3 画面一覧表             | `SCR-003 Tweaks パネル` 行を削除                                  |
| SCR-001 (本棚) ASCII 図   | `[Tweaks 設定 ⚙ ]` 行を削除                                       |
| SCR-001 Component Details | `<TweaksLauncher>` 行を削除                                       |
| SCR-002 (ビュアー) ASCII 図| `[Tweaks 設定 ⚙ ]` 行を削除                                       |
| SCR-002 Interactions     | 既存の ViewerBar 操作 (ふりがな / 夜モード / バリアント) はそのまま |
| SCR-003 節                | **節全体を削除** (および §6 アクセシビリティ等で参照している箇所も連動削除) |
| §5 Shared Components 表   | `<TweaksLauncher>` / `<TweaksPanel>` 行を削除                     |

## 8. Handoff brief for architect / developer

### architect 向け

1. **ADR-009 を起こす**: 「Tweaks 機能の完全削除と `useSettingsStore` への
   置換」。理由 = ユーザー意図の再確認 (一括設定 UI 不要)、画面内に等価
   UI が既に存在、状態管理を Provider/Context/Reducer から軽量 hook へ
   ダウングレード可能 (Tweaks 1 種のみで Provider のオーバーヘッドが
   割に合わない)。
2. **ARCHITECTURE.md を §7 の表に従って更新**。Mermaid 図 / 技術選定
   表 / ディレクトリ図 / 主要コンポーネント節 / Test 構成すべてに反映。
3. **PR #3 の扱いを判断**: 推奨は「PR #3 を close → `main` から
   `refactor/remove-tweaks` ブランチを新規作成」。ただし「PR #3 上に
   追加 commit を積み PR タイトル / 説明を書き換える」案も技術的に
   可能。**この判断を architect / orchestrator が確定させ TASK.md に
   記録する**こと。
4. SPEC.md / UI_SPEC.md の更新は §7 に従って指示する (analyst では
   ARCHITECTURE.md 系列に踏み込まない)。

### developer 向け (architect 経由で渡す)

- 実装は §6 の Phase 1 → 5 順で進める。
- branch 名: `refactor/remove-tweaks` (PR #3 close 案を採用した場合) /
  `feat/tweaks-simplification` (PR #3 継続案を採用した場合)
- commit 粒度の目安:
  - `feat: useSettingsStore (settings-store + Settings type) を追加`
  - `refactor: 参照側を useTweaks → useSettingsStore に切替 (App / Shelf*  / Viewer* / ViewerBar)`
  - `feat: Tweaks 関連 (components/tweaks, stores/tweaks-*, types/tweaks) を削除`
  - `test: tweaks 系 unit テストを削除し settings-store テストを追加 / persistence E2E を eh.settings に移行`
  - `docs: SPEC.md / ARCHITECTURE.md / UI_SPEC.md を Tweaks 削除に追従`
- バンドル計測 (`pnpm build`) を PR 説明に必ず記載。
- 旧 localStorage キー (`eh.tweaks` / `ehon.tweaks` / `ehon.tweaks.v2`)
  は **読み込まない・削除しない** (放置)。クリーンアップコードを書か
  ないこと。
