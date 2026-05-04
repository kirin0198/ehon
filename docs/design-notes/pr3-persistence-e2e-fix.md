> Last updated: 2026-05-04
> GitHub Issue: (作成後に追記)
> Analyzed by: analyst (2026-05-04)
> Next: developer
> Related: docs/design-notes/tweaks-simplification.md (PR #3 本体), docs/design-notes/pr1-ci-e2e-failures.md (前例)

# PR #3 Playwright E2E 失敗の修正方針 — persistence 旧スキーマ残存テストの WebKit 競合

## 1. 背景 / Motivation

PR #3 (`feat/tweaks-simplification`) の Tweaks 縮小 Phase D で developer が
新規追加した E2E テスト `persistence: 旧スキーマ (fontSize/accent/font) 残存でもクラッシュしない`
(`tests/e2e/persistence.spec.ts:34-60`) が **WebKit プロファイル
(webkit-ipad / webkit-iphone) でのみ**失敗する。

CI run id `25329664647` のログから:

```
✓  3 [chromium-pc]   persistence.spec.ts:34   ← chromium は PASS
✘ 11 [webkit-ipad]   persistence.spec.ts:34   ← FAIL
✘ 12 [webkit-ipad]   persistence.spec.ts:34   ← retry FAIL
✘ 13 [webkit-ipad]   persistence.spec.ts:34   ← retry FAIL
✘ 20 [webkit-iphone] persistence.spec.ts:34   ← FAIL (1回目)
✓ 21 [webkit-iphone] persistence.spec.ts:34   ← retry で PASS (flaky)
```

最終結果: webkit-ipad 1 failed / webkit-iphone 1 flaky / 18 passed / 1 skipped。

エラーは `await expect(page.locator('html')).toHaveClass(/no-ruby/, { timeout: 5000 })`
で `<html>` の `class` 属性が `""` のまま 9 回確認しても変わらない、というもの。

ローカル `npm test` (Vitest) の 57/57 unit テストは全て pass しており、
特に `tweaks-reducer.test.ts` の TC-TR-005 / TC-TR-006 で
`normalizeTweaks({ ruby: false, fontSize: 30, accent, font })` が
`ruby: false` を正しく取り出すことは検証済み。**実装側のロジックには
バグはない**。

## 2. Goal / 受入基準

- WebKit (webkit-ipad / webkit-iphone) でも該当テストが安定して PASS する
- 旧スキーマ (`fontSize` / `accent` / `font`) 残存時でも:
  - アプリがクラッシュしない (`#app` が visible)
  - 有効キー (`shelfVariant: 'B'`, `ruby: false`, `night: false`) が正しく復元される
  - `ruby: false` → `<html class="no-ruby">` クラスが付与される
- chromium-pc / webkit-ipad / webkit-iphone の 3 プロファイルすべてで
  3 回連続して flaky を出さない

## 3. Scope

- `tests/e2e/persistence.spec.ts` のみ修正対象
- 実装ファイル (`src/stores/tweaks-defaults.ts` / `src/stores/tweaks-context.tsx` /
  `src/stores/tweaks-reducer.ts` / `src/types/tweaks.ts`) は **変更不要**
- SPEC.md / ARCHITECTURE.md / UI_SPEC.md も **変更不要** (テスト戦略のみ)

## 4. Constraints / 制約

- Playwright のテスト構造 (一部のテストは UI クリック経由で localStorage を
  作る、他のテストは直接注入する) は維持し、テスト追加コストを最小にする
- `addInitScript` を使う場合、`context.addInitScript` か `page.addInitScript`
  のスコープを正しく選び、他テストへ漏れないこと

## 5. 分析: なぜ WebKit でのみ失敗するか

### 5.1 既調査仮説の棄却

事前に共有された 4 仮説 (A: normalizeTweaks 取りこぼし / B: useEffect 不具合 /
C: 別要素にクラス付与 / D: whitelist false 破棄) はすべて棄却できる。

`src/stores/tweaks-reducer.ts:33` の判定は

```ts
if (typeof r.ruby === 'boolean') v.ruby = r.ruby;
```

であり `false` も正しく拾う。`tweaks-context.tsx:48-52` の useEffect も
`if (tweaks.ruby) remove('no-ruby'); else add('no-ruby')` で対称。
unit テスト TC-TR-005 / TC-TR-006 で `ruby: false` 経路は検証済み。
**実装は正しい**。

### 5.2 真の根本原因 — テスト構造のレースコンディション

現在のテスト (`persistence.spec.ts:38-53`) のシーケンス:

```ts
await page.goto('/');                              // ① 初回ロード
await page.evaluate(() => {                        // ② localStorage 注入
  localStorage.setItem('eh.tweaks', JSON.stringify({
    shelfVariant: 'B', viewerVariant: 'A',
    ruby: false, night: false,
    fontSize: 30, accent: '#FF0000', font: 'klee',
  }));
});
await page.reload();                               // ③ reload
await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
await expect(page.locator('html')).toHaveClass(/no-ruby/, { timeout: 5000 });
```

ここで以下のレースが起きる:

| 段階 | 期待される動作 | 実際に起きうる動作 (WebKit) |
|------|----------------|-------------------------------|
| ① page.goto('/') | ページロード、React マウント開始 | `'load'` イベント時点で React マウントが**完了している保証はない** |
| ① 完了直後 | テスト側に制御戻る | TweaksProvider の lazy initializer はまだ未実行のことがある |
| ② setItem | テスト注入が localStorage に書かれる | OK。ここまでは Chromium / WebKit 共通 |
| ②と並行 | (順序未定義) | TweaksProvider の **永続化 useEffect (`tweaks-context.tsx:36-38`) が DEFAULTS (`ruby: true`) を localStorage に書き戻す**ことがある |
| ③ reload | 注入した値で再起動 | ②で書き戻された **DEFAULTS の `ruby: true`** で起動してしまう → `<html>` に `no-ruby` 付かない |

つまり **「初回 `page.goto('/')` のあとに React がマウントし、TweaksProvider の
永続化 useEffect が空 localStorage を DEFAULTS で埋める」副作用** が、
テストの `setItem` を上書きし、その上書きされた状態で reload するレースが
WebKit ではタイミング的に発生しやすい。

#### 5.3 なぜ Chromium では起きにくいか

Chromium はおそらく `page.goto('/')` の `'load'` で返る時点で
React のマウントと最初の commit が高確率で完了しており、**setItem の前に
DEFAULTS の書き戻しが終わっている**。その後の `setItem` は永続化 useEffect が
再発火しないので上書きされず、`reload()` で正しく注入値が読まれる。

WebKit (Safari WebKit) は JS マウントの順序が微妙にずれるため、
**setItem の後に永続化 useEffect が走るシナリオが現実化する**。

#### 5.4 もう一つ存在しうる側面

WebKit には `localStorage` のディスク書き込み遅延があり、
`setItem → 即座に reload` するとブラウザが古い値を読むことが
歴史的に観測されてきた (Playwright の issues や WebKit bugzilla 多数)。
これも今回の症状を後押ししている可能性がある。
ただし主因は 5.2 の **「アプリの永続化 useEffect が setItem を踏み潰す」**
構造の方であり、これさえ消せば付随的な遅延も問題化しない。

### 5.5 対照テスト (`persistence.spec.ts:6-32`) がなぜ pass するか

対照テスト (UI クリック経由 night ON) は:
1. `goto('/')` → React マウント → 永続化 useEffect で DEFAULTS が書かれる
2. UI クリックで `night: true` に setState → 永続化 useEffect で上書き保存
3. reload → `night: true` を読む → `<html>` に `night` クラス

この順序では **「アプリ自身が書いた値を、アプリ自身が読み戻す」** だけで、
テスト外からの注入は無い。レースが原理的に発生しない。

## 6. 修正方針

### 6.1 推奨: `addInitScript` でロード前に localStorage を仕込む

最も堅牢で意図 (「旧スキーマが残存した状態でアプリを開く」) を正確に
モデル化できる。`addInitScript` は新ページロードのたびにブラウザ側で
**ドキュメント評価より前**に実行されるため、React マウントよりも確実に
早い段階で localStorage を準備できる。

```ts
test('persistence: 旧スキーマ (fontSize/accent/font) 残存でもクラッシュしない', async ({
  page,
}) => {
  // ページロード前に旧スキーマを仕込む (React マウント前に実行されることが
  // 保証されるため、TweaksProvider の lazy initializer が確実にこの値を読む)
  await page.addInitScript(() => {
    localStorage.setItem(
      'eh.tweaks',
      JSON.stringify({
        shelfVariant: 'B',
        viewerVariant: 'A',
        ruby: false,
        night: false,
        fontSize: 30,
        accent: '#FF0000',
        font: 'klee',
      }),
    );
  });
  await page.goto('/');

  // アプリが正常にレンダリングされる (クラッシュしない)
  await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
  // ruby=false → .no-ruby クラスが html に付与される
  await expect(page.locator('html')).toHaveClass(/no-ruby/, { timeout: 5000 });
  // 旧スキーマキーは normalizeTweaks の whitelist で破棄され、
  // 永続化 useEffect が新スキーマ 4 キーで再書き込みすることも検証する
  await expect
    .poll(async () => {
      const raw = await page.evaluate(() => localStorage.getItem('eh.tweaks'));
      return raw ? Object.keys(JSON.parse(raw)).sort() : [];
    })
    .toEqual(['night', 'ruby', 'shelfVariant', 'viewerVariant']);
});
```

ポイント:
- `page.addInitScript` は **そのページ (test) のスコープ**でのみ有効で、
  他テストへリークしない
- `goto('/') → reload()` の 2 段階が不要になり、テストが短くなる
- 追加の `expect.poll` で「旧キーが永続化 useEffect でクリーンアップされる」
  という 5.2 で発見した副作用も**逆に検証点として活用**できる
  (これは元のテストに無かったが、PR #3 本体の `normalizeTweaks` の whitelist
  動作を E2E で確認する強化として有益)

### 6.2 代替案: `goto + 一拍待つ + setItem + reload`

`addInitScript` を使わない最小修正パターン。

```ts
await page.goto('/');
// React マウントと初回永続化 useEffect の完了を待つ。
// TweaksProvider が DEFAULTS を localStorage に書き終えるまで待機。
await page.waitForFunction(() => {
  const raw = localStorage.getItem('eh.tweaks');
  return raw !== null;
});
await page.evaluate(() => { localStorage.setItem('eh.tweaks', JSON.stringify({...})); });
await page.reload();
await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
await expect(page.locator('html')).toHaveClass(/no-ruby/, { timeout: 5000 });
```

ただし WebKit の `setItem → reload` 直後の永続化遅延 (5.4) が残るリスクが
あるため、**(a) を推奨**する。

### 6.3 棄却した案

- **`tweaks-context.tsx` の永続化 useEffect 側で「初回 mount のときだけ
  書き戻しをスキップ」** — 不要な実装複雑化。テスト側の都合で本番ロジックを
  曲げるべきでない
- **テスト全体を webkit から除外** — カバレッジ低下。R-004 (iPad Safari
  100vh ずれ検証) のため WebKit は必須
- **タイムアウトを伸ばす** — 根本原因 (永続化レース) は解決せず flaky が残る

## 7. ドキュメント変更

| ドキュメント | 変更 |
|--------------|------|
| `SPEC.md` | no_change |
| `UI_SPEC.md` | no_change |
| `ARCHITECTURE.md` | no_change |
| `TEST_PLAN.md` | (任意) `addInitScript` パターンを「localStorage 直接注入の標準手法」として追記してもよい。必須ではない |

実装ファイルへの修正:

| ファイル | 変更 |
|----------|------|
| `tests/e2e/persistence.spec.ts` | §6.1 の通り、L34-60 のテストを `addInitScript` パターンに書き換え |
| `src/stores/*.ts` | no_change |
| `src/types/tweaks.ts` | no_change |

## 8. developer / tester への引き継ぎ

### 修正タスク (1 件のみ、所要時間 ~30 分)

**TASK-Fix1**: `tests/e2e/persistence.spec.ts:34-60` を §6.1 のスニペットで
置き換え。

修正手順:
1. `page.evaluate(setItem) → page.reload()` の 2 段構成を削除
2. `page.addInitScript` でロード前に旧スキーマを仕込む
3. `goto('/')` 1 回のみ
4. 既存の `#app` visible / `html.no-ruby` アサーションは維持
5. 追加 (推奨): `expect.poll` で localStorage が新スキーマ 4 キーに
   クリーンアップされることを検証 (`normalizeTweaks` whitelist の E2E 検証)

### 検証手順

1. ローカルで全 3 プロファイル (`chromium-pc` / `webkit-ipad` /
   `webkit-iphone`) を実行:
   ```bash
   npx playwright test tests/e2e/persistence.spec.ts --project=chromium-pc --project=webkit-ipad --project=webkit-iphone
   ```
2. CI で **3 回連続**で flaky 無しを確認 (`gh run rerun` で同じ workflow を
   2 回追加実行する)
3. PR #3 のレビュー再開

### Co-author / commit メッセージ

```
test: persistence 旧スキーマ残存テストを addInitScript パターンに修正 (TASK-Fix1)

- WebKit の永続化レース (goto → useEffect 書き戻し → setItem 上書き) を回避
- localStorage 注入を React マウント前に確実化
- normalizeTweaks whitelist の E2E 検証を追加

Co-Authored-By: Claude <noreply@anthropic.com>
```

ブランチは現行の `feat/tweaks-simplification` を継続使用 (PR #3 内で fix-up)。
