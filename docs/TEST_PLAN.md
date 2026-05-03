# Test Plan: えほんやさん（Ehon）

> Source: SPEC.md (2026-05-04), ARCHITECTURE.md (2026-05-04)
> Created: 2026-05-04
> Update history:
>   - 2026-05-04: Initial test plan (test-designer / Light プラン)

## 1. テスト方針

- **ユニット**: Vitest + @testing-library/react / jsdom 環境。`src/lib/*` (純関数) と `src/stores/*` (reducer / normalize), 主要コンポーネント (Shelf / Viewer / Tweaks / common) を対象
- **E2E**: Playwright (Chromium-PC / WebKit-iPad / WebKit-iPhone)。`tests/e2e/` に主要動線 6 シナリオを配置（Phase 7: e2e-test-designer で詳細設計、本フェーズでは方針のみ）
- **Accessibility**: 基本は a11y-aware ESLint plugin (jsx-a11y) + role/aria-* の振舞いを RTL で検証。Lighthouse a11y 95 は Phase 10 (security-auditor / 手動) で確認
- **カバレッジ目標**: line ≥ 80% (`src/**/*.{ts,tsx}`、`src/main.tsx` / `src/types/**` / `src/data/**` を除外)

## 2. テストケース一覧 (Unit)

### TC-RP (ruby-parser)

| ID | 内容 | 入力 | 期待 |
|----|------|------|------|
| TC-RP-001 | 空文字列 | `''` | `[]` |
| TC-RP-002 | プレーンのみ | `'むかしむかし'` | `[{type:'plain', text:'むかしむかし'}]` |
| TC-RP-003 | 単純なルビ | `'桃太郎{ももたろう}'` | `[{type:'ruby', base:'桃太郎', rt:'ももたろう'}]` |
| TC-RP-004 | 平仮名前置詞 + 漢字ルビ | `'おじいさんは山{やま}へ'` | `[plain('おじいさんは'), ruby('山','やま'), plain('へ')]` |
| TC-RP-005 | 複数ルビ混在 | `'女{おんな}の子{こ}が'` | plain('') + ruby('女','おんな') + plain('の') + ruby('子','こ') + plain('が') |
| TC-RP-006 | 漢字以外の前置 + ルビ | `'!桃太郎{ももたろう}'` | plain('!') + ruby('桃太郎','ももたろう') |
| TC-RP-007 | 不正記法 (閉じ忘れ) | `'桃太郎{ももたろう'` | プレーンとして残す or ruby ベース全体 (記法未閉鎖はエラーで落とさない) |
| TC-RP-008 | renderRuby が ReactNode 配列を返す | `'桃太郎{ももたろう}'` | 配列。要素 0 は ruby 要素 (タグ名 ruby) |

### TC-SS (safe-storage)

| ID | 内容 | 期待 |
|----|------|------|
| TC-SS-001 | get: キー未設定なら fallback | `get('x', {a:1})` → `{a:1}` |
| TC-SS-002 | set/get round-trip | `set('k', {b:2})` → `get('k', null)` で `{b:2}` |
| TC-SS-003 | localStorage 利用不可で警告のみ | window.localStorage を削除して `set()` が例外を投げない、`console.warn` が呼ばれる |
| TC-SS-004 | 不正な JSON が保存されている場合 fallback | localStorage に `'not-json'` を直接書き込み → `get` は fallback を返す |

### TC-IL (illustration-path)

| ID | 内容 | 期待 |
|----|------|------|
| TC-IL-001 | 通常パス生成 | `illustrationPath('akazukin','forest-girl')` → `'/illustrations/akazukin/forest-girl.webp'` |
| TC-IL-002 | coverPath は scene='cover' の糖衣 | `coverPath('momotaro')` === `illustrationPath('momotaro','cover')` |

### TC-TR (tweaks-reducer)

| ID | 内容 | 期待 |
|----|------|------|
| TC-TR-001 | set 単一キー | `reducer({...defaults}, {type:'set', key:'fontSize', value:24})` → fontSize=24 |
| TC-TR-002 | reset で defaults に戻る | 任意 state → reset → TWEAK_DEFAULTS と等価 |
| TC-TR-003 | hydrate で外部値を復元 | `{type:'hydrate', value:{...}}` → state はその値 |
| TC-TR-004 | normalizeTweaks 不正値は default にフォールバック | `{shelfVariant:'X', fontSize:'big'}` → defaults |
| TC-TR-005 | normalizeTweaks 部分的に有効値 | `{ruby:false, accent:'#000'}` の merge |
| TC-TR-006 | normalizeTweaks fontSize 範囲外 | fontSize=50 → defaults.fontSize に戻る |
| TC-TR-007 | normalizeTweaks accent 不正な hex | accent='red' → defaults.accent に戻る |

### TC-TC (tweaks-context)

| ID | 内容 | 期待 |
|----|------|------|
| TC-TC-001 | useTweaks をプロバイダ外で使うとエラー | コンポーネント外で useTweaks → throw |
| TC-TC-002 | hydrate 完了後の setTweak が localStorage に書き込まれる | render → setTweak('night', true) → safe-storage.get で night:true |
| TC-TC-003 | 夜モード切替で `<html>` に `night` クラス付与 | setTweak('night', true) → document.documentElement.classList.contains('night') |
| TC-TC-004 | ふりがな OFF で `<html>` に `no-ruby` クラス付与 | setTweak('ruby', false) → classList.contains('no-ruby') |

### TC-VN (useViewerNav)

| ID | 内容 | 期待 |
|----|------|------|
| TC-VN-001 | 初期 pageIndex=0, total=pages+1 | pages=5 → total=6 |
| TC-VN-002 | go(1) で pageIndex 加算 | 0 → 1 (waitFor で setTimeout を消化) |
| TC-VN-003 | go(-1) は 0 で停止 | pageIndex=0 で go(-1) → 0 のまま |
| TC-VN-004 | go(1) は最大値で停止 | pageIndex=N で go(1) → N のまま |
| TC-VN-005 | ArrowRight キー → go(1) | window.dispatchEvent(KeyboardEvent('keydown', {key:'ArrowRight'})) |
| TC-VN-006 | ArrowLeft キー → go(-1) | 同上 |
| TC-VN-007 | Escape キー → onClose 呼出 | mock callback が 1 回呼ばれる |

### TC-TF (TagFilter / collectTags)

| ID | 内容 | 期待 |
|----|------|------|
| TC-TF-001 | collectTags は重複なしで集計 | 6 stories → tags=[{グリム童話:3},{日本昔話:3}] (順序不定) |
| TC-TF-002 | "ぜんぶ" クリックで selected=[] | render → click ぜんぶ → setSelected([]) |
| TC-TF-003 | タグクリックで selected=[name] | click グリム童話 → setSelected(['グリム童話']) |
| TC-TF-004 | aria-checked が現在選択を反映 | active タグの role="radio" が aria-checked="true" |

### TC-IF (IllustWithFallback)

| ID | 内容 | 期待 |
|----|------|------|
| TC-IF-001 | 初期は `<img src="/illustrations/{id}/{scene}.webp">` を描画 | DOM に img が存在 |
| TC-IF-002 | onError で placeholderEmoji + bg 色面に切替 | img.onError 発火 → role="img" の div + 絵文字描画 |
| TC-IF-003 | eager=true で loading="eager" | 表紙のみ |

### TC-SH (Shelf レンダリング)

| ID | 内容 | 期待 |
|----|------|------|
| TC-SH-001 | ShelfA は 6 物語の背表紙ボタンを描画 | role="button" name="赤ずきん をひらく" 等が 6 件 |
| TC-SH-002 | タグ絞込で表示数が変わる | selectedTags=['グリム童話'] → 3 件 |
| TC-SH-003 | 空タグ時 EmptyState を表示 | selectedTags=['存在しない'] → "🔍 ..." が表示 |
| TC-SH-004 | ShelfB の表紙カードが 6 件 + cover.webp 試行 | img src=/illustrations/akazukin/cover.webp が存在 |
| TC-SH-005 | ShelfSwitcher の aria-selected 反映 | value='B' で B 側のタブが aria-selected=true |

### TC-VW (Viewer レンダリング)

| ID | 内容 | 期待 |
|----|------|------|
| TC-VW-001 | 初期表示は表紙ページ (CTA「よみはじめる」が見える) | 「よみはじめる」テキスト |
| TC-VW-002 | CTA クリックで pageIndex=1 (本文 1 ページ目) | 本文テキストが描画 |
| TC-VW-003 | ふりがな ON で `<rt>` が DOM に存在 | container.querySelector('rt') が non-null |
| TC-VW-004 | 文字サイズ ± で本文 inline style.fontSize が変わる | 「大」クリック → fontSize=24 |
| TC-VW-005 | 夜モードで `.eh-viewer` に night クラス付与 | classList.contains('night') |
| TC-VW-006 | role="dialog" + aria-modal | container.querySelector('[role=dialog]') が存在 |

### TC-TP (TweaksPanel)

| ID | 内容 | 期待 |
|----|------|------|
| TC-TP-001 | open=false でレンダリングされない | container は空 |
| TC-TP-002 | open=true で × ボタン (aria-label=Tweaks をとじる) が描画 | ボタン存在 |
| TC-TP-003 | 各セクション (レイアウト/よみやすさ/色/フォント) が描画 | h3 タグ 4 件 |
| TC-TP-004 | ふりがなトグルで context が更新 | role=switch クリック → useTweaks().tweaks.ruby が反転 |
| TC-TP-005 | Esc キーで onClose 呼出 | window.dispatchEvent(Escape) → mock onClose 1 回 |

## 3. テストケース一覧 (Smoke Integration)

App 全体結合の最低限のスモーク (RTL):

| ID | 内容 | 期待 |
|----|------|------|
| TC-IT-001 | App マウント → 本棚が描画 | h1「きょうは どのおはなしを よもうかな？」 (ShelfA 既定) |
| TC-IT-002 | 物語クリック → ビュアーが開く | role="dialog" が存在 |
| TC-IT-003 | Tweaks 開閉 | ⚙ クリック → パネル表示 / × クリック → 非表示 |

## 4. テストケース一覧 (E2E, Phase 7 で詳細化)

| ID | シナリオ | プロファイル |
|----|---------|--------------|
| TC-E2E-001 | home: 本棚 → 物語選択 → 表紙 → 全ページ閲覧 → 戻る | chromium-pc |
| TC-E2E-002 | viewer-keyboard: マウス無しで完遂 | chromium-pc |
| TC-E2E-003 | ruby-toggle: ふりがな切替で `<rt>` 可視性が変わる | chromium-pc |
| TC-E2E-004 | persistence: Tweaks 変更 → reload → 復元 | chromium-pc |
| TC-E2E-005 | responsive-ipad: iPad プロファイルでレイアウト崩れなし、`100dvh` | webkit-ipad |
| TC-E2E-006 | image-fallback: 不在画像でフォールバック | chromium-pc |

> 詳細仕様は `e2e-test-designer` フェーズで `tests/e2e/*.spec.ts` を生成する。

## 5. テスト実行コマンド

| 種別 | コマンド |
|------|---------|
| 型チェック | `npm run typecheck` (= `tsc --noEmit`) |
| Lint | `npm run lint` (= `eslint .`) |
| Format check | `npm run format:check` (= `prettier --check .`) |
| Unit | `npm test` (= `vitest run`) |
| Watch | `npm run test:watch` |
| E2E install | `npm run test:e2e:install` (= `playwright install`) |
| E2E run | `npm run test:e2e` (= `playwright test`) |

## 6. テストデータ・モック方針

- 物語データ: `src/data/stories.ts` の本物 (6 件) を参照。テスト固有のスタブは作らない（軽量で十分小さいため）
- localStorage: 各テスト前に `_resetMemoryFallback()` を呼び、`window.localStorage.clear()` で初期化
- 画像読み込み: jsdom は実際に HTTP しないため、`<img onError>` の発火はテスト内で `fireEvent.error(img)` を使う
- タイマー: `useViewerNav` の setTimeout は `vi.useFakeTimers()` + `vi.runAllTimers()` で進める

## 7. 完了条件

- [ ] 全 Unit テストが `npm test` で pass
- [ ] line coverage ≥ 80% (主要モジュール)
- [ ] tester レビュー後、tests/e2e/ の Playwright 実装をユーザーがローカル `npm run test:e2e:install && npm run test:e2e` で起動可能
- [ ] CI 化は Operations Flow の releaser が GitHub Actions で実装

---

## AGENT_RESULT

```
AGENT_RESULT: test-designer
STATUS: success
ARTIFACTS:
  - docs/TEST_PLAN.md
TEST_CASES_TOTAL: 49
UNIT: 40
INTEGRATION: 3
E2E: 6
COVERAGE_TARGET: 80%
NEXT: e2e-test-designer
```
