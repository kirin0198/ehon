> Last updated: 2026-05-04
> GitHub Issue: (作成後に追記)
> Analyzed by: analyst (2026-05-04)
> Next: architect

# Tweaks 機能の整理と本番向け固定値化

## 1. 背景 / Motivation

`Tweaks` 機能はモック作成期 (Discovery / Delivery 初期) の調整用として
7 項目を全画面ランタイム可変にする設計で実装された。しかし本番運用フェーズ
(2026-05-04 時点で Vercel 上に公開済み: https://ehon-one.vercel.app/) では:

- 本プロダクトのターゲット (3〜5 歳児 + 保護者) にとって、調整 UI の選択肢が
  多すぎると保護者の認知負荷が増える
- フォント / アクセント色 / 文字サイズの調整は「読みやすさ」よりも
  デザイントーン全体に影響するため、固定したい
- Tweaks パネルが画面右下を占有し続け、本棚 / ビュアーの視覚的な静けさを損ねる
- 将来カラースキーマを刷新する際、ユーザーごとに保存された accent/font が
  新スキーマと整合しないリスクがある

## 2. Goal / 受入基準

- Tweaks パネル UI から「文字サイズ」「アクセント色」「フォント」を完全に
  削除し、Tweaks 型・localStorage スキーマからも当該フィールドを除去する
- 本番固定値が以下となる:
  - レイアウト = 本棚バリアント A (立てかけ書架)
  - ビュアー = ViewerA (見開き)
  - ふりがな = 有効
  - 夜モード = 無効
  - 文字サイズ = 26px (固定)
  - アクセントカラー = テラコッタ `#E07856` (固定)
  - フォント = やわらか丸ゴシック (`rounded` プリセット = M PLUS Rounded 1c) (固定)
- UI から操作可能なのは 4 項目のみ:
  - 本棚バリアント (A / B)
  - ビュアーバリアント (A / B)
  - ふりがな ON/OFF
  - 夜モード ON/OFF
- ViewerBar 上の文字サイズ ± ボタン (あ- / あ+) と現在値表示も削除する
- 既存ユーザーの localStorage に保存された削除対象キー (fontSize / accent /
  font) は読み込み時に無視され、保存時に上書きで消えていくこと
- 受入: Lighthouse Accessibility ≥ 95, 主要組み合わせのコントラスト比
  4.5:1 以上, 既存 unit/E2E テストが PASS (削除対象の操作テストは除去)

## 3. Scope

### 影響を受けるファイル

| 区分 | ファイル | 変更概要 |
|------|---------|---------|
| 型 | `src/types/tweaks.ts` | `fontSize` / `accent` / `font` フィールドを削除。`FontPreset` 型は font-presets.ts と共に削除 (内部的に CSS 変数として残す) |
| ストア | `src/stores/tweaks-defaults.ts` | TWEAK_DEFAULTS から当該キー削除。`FONT_SIZE_*` 定数も削除 |
| ストア | `src/stores/tweaks-reducer.ts` | normalizeTweaks の該当 if 分岐削除 |
| ストア | `src/stores/tweaks-context.tsx` | アクセント色 / フォント CSS 変数同期の useEffect を削除 |
| パネル | `src/components/tweaks/TweaksPanel.tsx` | 「色」「フォント」セクション削除 / 「よみやすさ」セクションから文字サイズスライダー削除 |
| パネル部品 | `src/components/tweaks/TweakColor.tsx`, `TweakSelect.tsx`, `TweakSlider.tsx` | 削除 (使われなくなる) |
| ライブラリ | `src/lib/accent-presets.ts` | 削除 |
| ライブラリ | `src/lib/font-presets.ts` | 削除 |
| ビュアー | `src/components/viewers/ViewerBar.tsx` | 文字サイズ ± ボタンと数値表示を削除。`fontSize` / `setFontSize` props 削除 |
| ビュアー | `src/components/viewers/ViewerA.tsx`, `ViewerB.tsx` | `fontSize` props 削除 (固定値 26 を CSS 変数 or 直接スタイルで参照) |
| ルート | `src/App.tsx` | ViewerBar / Viewer に渡している `fontSize` / `setFontSize` 削除 |
| スタイル | `src/styles/tokens.css` | `--font-body`, `--font-display`, `--terracotta` を固定値で直書き (Provider からの動的書換を廃止) |
| スタイル | `src/styles/ehon.css` | 本文文字サイズの基準を `26px` ベースに調整 (該当箇所のみ) |
| ドキュメント | `docs/SPEC.md` | UC-010 / UC-012 / UC-013 削除, UC-014 縮小, FR / Tweaks 型表更新 |
| ドキュメント | `docs/UI_SPEC.md` | SCR-003 (Tweaks パネル) のレイアウト・コンポーネント縮小、ViewerBar からの ± 撤去 |
| ドキュメント | `docs/ARCHITECTURE.md` | Tweaks 型・State Management 図・モジュール責務の更新 (architect が実施) |
| テスト | `tests/unit/tweaks-reducer.test.ts`, `tests/unit/TweaksPanel.test.tsx` | 削除キー関連のアサーション除去 |
| テスト | `tests/e2e/persistence.spec.ts` | fontSize 永続化シナリオ削除 |

### 影響を受けない (現状維持)

- Story / Page 型, src/data/stories.ts (物語データ)
- ふりがな (ruby) パーサ, ruby ON/OFF UI
- 夜モード切替 / ShelfSwitcher / ViewerSwitcher
- 画像フォールバック (IllustWithFallback)
- vercel.json, package.json (依存変化なし — 既存ライブラリ削除のみ)

## 4. 制約 / Open questions

- **CSS 変数 `--terracotta` の扱い**: 現状 Provider が動的に書き換えていたが、
  固定化後は tokens.css の `:root { --terracotta: #E07856; }` で固定。本要望文に
  「アクセントカラー: 一旦オレンジ (全体的なカラースキーマはあとで変更予定)」と
  ある通り、将来カラースキーマ変更時は tokens.css の編集 1 ファイルで対応する
- **将来再有効化の余地**: ユーザーが将来 Tweaks 機能を復活させたい場合、本変更は
  完全削除なので git revert または再実装が必要。design-note とこの Issue を
  リンクすることで履歴は追える
- **localStorage 既存値**: `eh.tweaks` に古い `fontSize` / `accent` / `font` キーが
  残っていても normalizeTweaks は既に未知キーを単純無視する仕様 (whitelist 方式) の
  ため、追加のマイグレーションコードは不要。次回 setTweak 時に新スキーマで上書き保存
  され古いキーは自然消滅する
- **font 26px の妥当性**: モック既定 22px から 26px に拡大することで、3〜5 歳児に
  適した読みやすさが向上することを意図。Lighthouse / 実機タブレット検証は developer
  フェーズで再確認

## 5. 分析 (Requirements organization)

### 5.1 ユーザー意図の解釈

ユーザー要望文 (issue 用):

> tweaks はモック時の調整用で設定していたため、本番では不要となります。
> デフォルトを以下に設定し、レイアウト、ビューアー、ルビ、よるモードは UI から
> 変更可能 (すでに実装済みの認識) としてください。

- 「Tweaks の削除」は **Tweaks パネル全廃ではなく、調整項目の削減** を意味する
  (「レイアウト・ビューアー・ルビ・よるモードは UI から変更可能」と明記)
- 「文字サイズ / アクセントカラー / フォント」が暗黙的に削除対象
  (UI 操作可能リストから外れているため)
- 「アクセントカラー: 一旦オレンジ (全体的なカラースキーマはあとで変更予定)」
  という表現から、将来のスキーマ刷新を見越した暫定固定であると解釈

### 5.2 用語のマッピング (要望文 → 実装)

| ユーザー表現 | 実装上の対応 |
|------------|-------------|
| レイアウトのデフォルトは本棚 | `shelfVariant: 'A'` (立てかけ書架) — 既に既定 |
| ビュアーは見開き | `viewerVariant: 'A'` (ViewerA) — 既に既定 |
| ルビはデフォルト有効 | `ruby: true` — 既に既定 |
| 文字サイズ: 26px | `fontSize: 26` (現在 22 → 26 に変更, 固定化) |
| よるモード無効 | `night: false` — 既に既定 |
| アクセントカラー: 一旦オレンジ | `--terracotta: #E07856` (現在 default = テラコッタ。固定化) |
| フォント: やわらか丸ゴシック | `rounded` プリセット = M PLUS Rounded 1c (現在 default。固定化) |

→ **既定値はほぼ現状のまま、`fontSize` のみ 22 → 26 に変更**。本変更の本質は
「既定値変更」よりも **「Tweaks 調整 UI の縮小と固定化」** にある。

### 5.3 削減効果の見積

- TweaksPanel UI 行数: 約 60 行削減 (4 セクション → 2 セクション)
- 削除ファイル: 5 ファイル (TweakColor / TweakSelect / TweakSlider / accent-presets / font-presets)
- 削除コンポーネント: 3 部品 + 2 lib モジュール
- ViewerBar 簡素化: ± ボタン 2 個と数値表示削除 → ツールバーがシンプル化
- 動的 CSS 変数同期 useEffect: 2 本削減 (accent / font)

### 5.4 リスク / 互換性

- **R-MAINT-001**: 既存ユーザーが localStorage に持つ古いキーが残存
  - Impact: low (normalizeTweaks の whitelist 方式で無視。動作影響なし)
  - Mitigation: なし (次回保存時に自然消滅)
- **R-MAINT-002**: 26px が iPad 小型機 / iPhone で本文 1 行が短くなり改行頻度上昇
  - Impact: low-medium
  - Mitigation: developer 段階で実機 / Playwright iPad プロファイル確認
- **R-MAINT-003**: テストファイルの削除漏れで CI が落ちる
  - Impact: medium
  - Mitigation: developer は `pnpm test` / `pnpm test:e2e` で全テスト PASS を確認後に commit
- **R-MAINT-004**: Google Fonts の不要な `<link>` 残置によるネットワークオーバーヘッド
  - Impact: low
  - Mitigation: `index.html` の `<link rel="preconnect" href="fonts.googleapis.com">` /
    `<link rel="stylesheet" href="...">` 行から、不要なフォント (Klee One,
    Hachi Maru Pop, Zen Maru Gothic, Shippori Mincho, Kosugi Maru, BIZ UDPGothic) を
    削除し M PLUS Rounded 1c のみ残す

## 6. 提案アプローチ

### 6.1 段階的アプローチ

1. **Phase A: 型・ストアの刈り込み (architect → developer)**
   - `Tweaks` 型から 3 フィールド削除
   - normalizeTweaks / TWEAK_DEFAULTS から削除
   - tweaks-context.tsx の useEffect を 2 本削除

2. **Phase B: UI の刈り込み (developer)**
   - TweaksPanel から「色」「フォント」セクション削除、「よみやすさ」から
     スライダー削除
   - ViewerBar から ± ボタンと fontSize 表示削除
   - ViewerA / ViewerB / App.tsx の props 簡素化

3. **Phase C: 不要モジュール削除 (developer)**
   - TweakColor.tsx / TweakSelect.tsx / TweakSlider.tsx 削除
   - accent-presets.ts / font-presets.ts 削除
   - tokens.css に固定値直書き (`--terracotta`, `--font-body`, `--font-display`)

4. **Phase D: テスト整理 (developer)**
   - tweaks-reducer.test.ts: 削除キー関連アサーション除去
   - TweaksPanel.test.tsx: 4 セクションだったのを 2 セクションに修正
   - persistence.spec.ts (E2E): fontSize 永続化シナリオ削除
   - ViewerBar 関連テストがあれば fontSize ± ボタン操作の検証を削除

5. **Phase E: index.html フォント `<link>` 整理 (developer)**
   - 不要 Google Fonts URL を削除し M PLUS Rounded 1c のみ残す

### 6.2 ドキュメント更新方針

| ドキュメント | 更新概要 | 担当 |
|-------------|---------|------|
| `docs/SPEC.md` | UC-010 (文字サイズ調整) / UC-012 (フォント切替) / UC-013 (アクセント色切替) を **削除**。UC-014 (Tweaks パネル) を「4 項目に縮小」と **更新**。Tweaks 型表 (§6) を 4 フィールドに縮小。既定値表に固定値の追記 | analyst (本フェーズで実施) |
| `docs/UI_SPEC.md` | SCR-003 のレイアウト ASCII 図とコンポーネント表を縮小。ViewerBar 仕様から ± ボタン削除 | analyst (本フェーズで実施) |
| `docs/ARCHITECTURE.md` | Tweaks 型 / State Management 図 / モジュール責務 / ADR 追加 (本変更の経緯) | **architect (次フェーズ)** |

### 6.3 ブランチ戦略

- ブランチ名: `feat/tweaks-simplification` (規模が中程度のため feat 扱い。
  ユーザー向け機能変更を伴うため refactor ではない)
- PR には `Closes #N` (本 Issue) と `Linked Plan: docs/design-notes/tweaks-simplification.md` を含める

## 7. ドキュメント変更詳細 (本フェーズで適用)

### 7.1 SPEC.md 変更 (incremental edits)

- **§3 Use Case 一覧**: UC-010 / UC-012 / UC-013 行を削除。UC-014 の説明を
  「Tweaks パネルで本棚 / ビュアー / ふりがな / 夜モードを操作する」に簡素化
- **§4 Use Case 詳細**:
  - UC-010, UC-012, UC-013 の節を削除
  - UC-014 の Should → Must に格上げ + 受入基準を 4 項目操作可能に書換
- **§6 データモデル → Tweaks 型**: 行から fontSize / accent / font を削除し
  既定値を 4 行に縮小
- **§11 受入条件サマリー**: 文字サイズ関連を削除
- 冒頭 update history に 2026-05-04 のエントリ追加

### 7.2 UI_SPEC.md 変更

- **§4 SCR-002 (ビュアー)**: ViewerBar 仕様から「あ- / あ+」と数値表示の行を削除
- **§4 SCR-003 (Tweaks パネル)**:
  - レイアウト ASCII 図から「もじサイズ」「色」「フォント」ブロック削除
  - Component Details 表から TweakSlider / TweakColor / TweakSelect 行削除
  - Interactions 表から該当操作行削除
- 冒頭 update history に 2026-05-04 のエントリ追加

### 7.3 ARCHITECTURE.md (architect が次フェーズで実施)

architect は以下を更新:
- §3 モジュール設計: TweaksProvider の useEffect 説明を accent/font 同期削除に
  合わせて更新
- §4 データモデル: Tweaks 型から 3 フィールド削除、既定値更新
- §6 State Management Design: 図と表を更新 (CSS 変数同期は night/ruby のみ)
- §10 実装順序: Phase A〜E のタスク再構成
- §13 ADR: ADR-008 として「Tweaks 機能の本番固定化」を追記

## 8. Handoff brief (architect / developer 向け)

### architect への引き継ぎ

- 本 design-note の §6 (アプローチ) と §7 (ドキュメント変更詳細) を踏まえ、
  ARCHITECTURE.md を incremental update する
- 主な更新ポイント:
  - Tweaks 型の 3 フィールド削除 (§4)
  - TweaksProvider の useEffect が 4 → 2 本になる (§3)
  - ADR-008 を追加 (本変更の決定経緯と将来カラースキーマ刷新時の方針を記録)
  - 実装順序 §10 を Phase A〜E (本 design-note §6.1) に整合させる
- TASK.md (developer 用) のタスク粒度は 5〜8 タスク (Phase A〜E に小分割) を想定

### developer への引き継ぎ (architect 経由)

- ブランチ: `feat/tweaks-simplification`
- ローカル動作確認: `pnpm dev` で本棚 → ビュアー → Tweaks パネル開閉が壊れて
  いないこと、26px 固定でビュアーが読めること
- テスト: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` を全 PASS
  させてから commit
- 削除対象ファイルは git rm で明示的に削除
- localStorage 動作: 古いキーを残したブラウザで初回アクセスしてもクラッシュしない
  ことを E2E で確認 (persistence.spec.ts の更新)
- 全コミットに `Co-Authored-By: Claude <noreply@anthropic.com>` を付与 (project-rules.md)
- PR 本文: `Closes #N` + `Linked Plan: docs/design-notes/tweaks-simplification.md`

### 完了判定

- [ ] Tweaks パネルが「レイアウト」「よみやすさ」の 2 セクション・4 操作のみ
- [ ] ViewerBar が ふりがな / 夜モード / バリアント切替 / 閉じる のみ
- [ ] 本文が 26px で表示される (ビュアー A/B 両方)
- [ ] localStorage `eh.tweaks` から fontSize / accent / font キーが新規保存に
      含まれない
- [ ] 既存テストの GREEN を維持
- [ ] 本番デプロイ後の Vercel プレビュー / 本番で読みやすさが向上していること
