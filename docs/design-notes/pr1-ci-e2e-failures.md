> Last updated: 2026-05-04
> GitHub Issue: TBD (filled in after gh issue create)
> Analyzed by: analyst (2026-05-04)
> Next: developer

# PR #1 CI / E2E 失敗の原因分析と修正方針

## 1. 背景 / 動機

PR #1 (`feat/initial-implementation` → `main`) の GitHub Actions が 2 つの workflow で失敗している:

- `CI / Build & Test (Node 20)` — `Format check` ステップで失敗 (run id 25300011405)
- `E2E / Playwright (chromium / webkit)` — `Run Playwright tests` ステップで失敗 (run id 25300011410)

ローカル `npm test` (Vitest 59/59) は全件 pass。CI 環境で初めて顕在化した問題群である。

## 2. ゴール / 受入条件

- CI workflow `Build & Test (Node 20)` が green になる (`format:check` を含む全ステップ pass)
- E2E workflow `Playwright (chromium / webkit)` が green になる (3 project × テスト 全件 pass)
- 修正は **テスト期待値ではなく実装または無視リスト** を直す方向を基本とする (SPEC.md と矛盾する実装を優先して修正する)

## 3. スコープ

- `.prettierignore` (CI 課題)
- `src/components/viewers/ViewerA.tsx`, `ViewerB.tsx`, `CoverPage.tsx` (E2E 課題: ふりがな構造)
- `tests/e2e/home.spec.ts` (E2E 課題: ループ回数)
- `tests/e2e/persistence.spec.ts` (E2E 課題: hydrate 待機)

影響を受ける UC: UC-009 (ふりがな ON/OFF)、永続化 (localStorage に Tweaks)。
SPEC.md / UI_SPEC.md / ARCHITECTURE.md の文面変更は不要 (実装が SPEC に追従する形)。

## 4. 制約 / オープン課題

- `react@18.3.1` の StrictMode が有効かどうかでマウント時 effect double-invoke が起きうるが、`src/main.tsx` を確認すれば確定可能 (本フェーズでは未確認 — developer が実装時に確認)。
- webkit-mobile (iPad / iPhone) 上での `setTimeout` タイミング差は仕様上の許容範囲。テスト側が実装の `pageIndex` 進行を 1 ステップ多く見込んでいる点が真因のため、タイミング系の対症療法 (大きめの sleep など) は不要。

## 5. 分析 (根本原因)

### 5.1 課題 A: CI `Format check` 失敗

**症状**: `prettier --check .` が 72 ファイルで「未フォーマット」と判定し exit 1。

**実ファイル内訳** (CI ログより):
- `.claude/agents/*.md` 39 件
- `.claude/commands/*.md` 3 件
- `.claude/orchestrator-rules.md` 1 件
- `.claude/rules/*.md` 14 件
- `docs/*.md` 11 件 (SPEC.md, ARCHITECTURE.md, UI_SPEC.md ほか Aphelion 生成成果物)
- ルート: `docker-compose.yml`, `LICENSE-illustrations.md`, `vitest.config.ts`

**根本原因**:
- `.prettierignore` は存在するが内容が `node_modules / dist / coverage / playwright-report / test-results / mock / pnpm-lock.yaml / package-lock.json` の 8 行のみ。
- 結果として `.claude/` (Aphelion 配布物) と `docs/` (Aphelion エージェント生成物) が prettier の対象になっている。これらは:
  - **`.claude/`**: Aphelion ワークフローが配布・更新するファイル群。 prettier で書き換えると `npx aphelion-agents update` 時の差分や Aphelion 側の整形規則と衝突する。
  - **`docs/`**: spec-designer / architect 等が生成する markdown。 prettier で全行折り返しが入ると、生成エージェント側のテンプレート (テーブル整列、長文の意図的な無折り返しなど) を壊す。
  - `docker-compose.yml`, `vitest.config.ts`, `LICENSE-illustrations.md` は本来フォーマット対象だが、現在 unformatted のまま。これらは整形してコミットすべき (除外ではなく整形)。

### 5.2 課題 B: E2E `home.spec.ts` 失敗 (webkit-ipad / webkit-iphone のみ)

**症状**: 3 retry すべてで `locator.click('つぎのページ')` が 30s タイムアウト。chromium-pc では 5.1s で pass。

**Playwright error-context.md (artifact) の page snapshot より確定**:
- 失敗時点でページは **本文 7/7 (最終ページ)** に到達している。
- 「つぎのページ」ボタンは disabled (`pageIndex >= total - 1` でガード)。
- Test source は `for (let i = 0; i < 7; i++) { ('つぎのページ').click() }` で 7 回 click を試みている。

**根本原因**:
- `useViewerNav` の構造: `pageIndex=0` は表紙、`pageIndex=1..N` が本文。`total = N + 1`。
- 赤ずきんは本文 7 ページ → `total = 8`、最終ページは `pageIndex = 7`。
- テストフロー:
  1. shelf 「赤ずきん をひらく」 click → ViewerA 表示 (pageIndex=0)
  2. CoverPage の `よみはじめる` CTA click → `go(1)` → pageIndex=1 (1 回進行)
  3. for ループで 「つぎのページ」 click を 7 回
- 期待される総進行回数 = 1 (CTA) + 6 (ループ) = 7 で `pageIndex=7` (最終)。
- しかし実装ではループ回数が `< 7` (= 7 回)、CTA で 1 回進んでいるので **計 8 回試行** することになる。
- chromium-pc では 7 回目の `click` が成立 → ループ終了 (next が disabled になっても expect 文に到達する) で偶発的に pass。
- webkit (mobile) では Playwright の `actionability` 判定が厳格で、disabled ボタンの click を retry し続けて 30s タイムアウト。

### 5.3 課題 C: E2E `ruby-toggle.spec.ts` 失敗 (chromium-pc / webkit-ipad / webkit-iphone)

**症状**: `<rt>` を locate → 「ふりがなの切替」を click → `rt.evaluate(...)` で 30s タイムアウト。

**根本原因 (実装が SPEC 違反)**:
- SPEC.md `## 5.3 ふりがな ON/OFF` および `R-005` で「**`<ruby>` + `<rt>` 構造維持 + CSS 制御**」が明文化されている。
- しかし実装は ViewerA / ViewerB / CoverPage のすべてで `ruby ? <RubyText text={page.ruby} /> : page.text` という三項で **DOM そのものを差し替え** ている。
  - ViewerA.tsx L86, L82
  - ViewerB.tsx L79, L76 (overlay 版含む)
  - CoverPage.tsx L18, L44
- 一方 `tweaks-context.tsx` の useEffect では `<html>.no-ruby` クラスを付与する CSS 制御も実装されている (こちらは正しい)。
- 結果、 ふりがなを OFF にすると `<rt>` ノードが DOM から削除され、テストが保持していた `rt` locator が detached になり評価不能 → タイムアウト。
- これはスクリーンリーダー互換性 (R-005, A11y 要件) も同時に損なっている: SR にとっては `<ruby>` 構造を維持したまま CSS で表示制御するほうが読み上げが安定するため SPEC 通りの構造が必須。

### 5.4 課題 D: E2E `persistence.spec.ts` 失敗 (chromium-pc / webkit-ipad / webkit-iphone)

**症状**: `await page.reload()` 直後 `expect(hasNightClass).toBe(true)` が `received: false` で失敗 (テスト全体は 2.4s 程度で完了しているのでタイムアウトではなく即時 false)。

**根本原因**:
- `TweaksProvider` のマウントシーケンス:
  1. 初回 render: `useReducer(tweaksReducer, TWEAK_DEFAULTS)` → `tweaks.night = false`
  2. 同期 effect でないため、`<html>` には class はまだ付かない (default 状態)
  3. マウント後の useEffect:
     - effect-1: localStorage から読み込み → `dispatch({ type: 'hydrate', value: { ..., night: true } })`
     - effect-2 (`[tweaks.night]`): 初回は `night=false` で `removeClass('night')`
  4. dispatch による再レンダー後、 effect-2 が再実行されて `addClass('night')` が走る。
- Playwright の `await page.reload()` は **load イベントで resolve** する。React の useEffect は load 後の microtask で実行されるため、`page.evaluate(() => ...classList.contains('night'))` を **effect-2 の再実行前** に評価してしまう競合がある。
- 結果として CI 環境では effect 完了前のスナップショットが取れて `false` が返る。

**実装側の改善余地**:
- `TWEAK_DEFAULTS` を初期値にしてから effect で hydrate するのは、SSR を想定しないこのプロジェクトでは過剰。`useReducer` の lazy initializer (`useReducer(reducer, undefined, () => normalizeTweaks(storage.get(KEY, DEFAULTS)))`) で **初回 render 時に既に hydrate 済み** にすれば、`<html>` クラス同期 effect も初回から正しい値で走る。
- これにより hydrate-then-apply の時間差そのものが消滅する。テスト側の対症療法 (waitFor 追加) より、実装側の確実性向上を選ぶ。

## 6. 修正方針 (アプローチ)

### 6.1 課題 A の方針

`.prettierignore` に Aphelion 配布物 / 生成物を追加し、`docker-compose.yml`, `vitest.config.ts`, `LICENSE-illustrations.md` の 3 ファイルは prettier で整形してコミットする。

追記する ignore パターン:
```
.claude/
docs/
```

整形してコミットするファイル:
- `docker-compose.yml`
- `vitest.config.ts`
- `LICENSE-illustrations.md`

`mock/` `dist/` `coverage/` `playwright-report/` `test-results/` `pnpm-lock.yaml` `package-lock.json` は既に ignore 済みなので変更不要。

### 6.2 課題 B の方針

`tests/e2e/home.spec.ts` の for ループ回数を `< 7` から `< 6` に修正する。
理由: 表紙の「よみはじめる」 CTA で `pageIndex=0→1` への進行が既に行われているため、本文 7 ページ (`story.pages.length === 7`) を全部めくるのに必要な追加 click は **6 回**。

```diff
- for (let i = 0; i < 7; i++) {
+ // 表紙の「よみはじめる」で 1 ページ進んでいるので、残り 6 回めくれば最終ページ
+ for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: 'つぎのページ' }).click();
    await page.waitForTimeout(550);
  }
```

`tests/e2e/viewer-keyboard.spec.ts` も同型の構造 (CTA Enter 後 `for i<6`) なので既存の `< 6` ロジックは正しい (現状 pass)。

### 6.3 課題 C の方針 (実装修正 — SPEC 準拠化)

`ViewerA.tsx`, `ViewerB.tsx`, `CoverPage.tsx` の 4 箇所で、 `ruby` 三項分岐を撤去し **常に `<RubyText>` をレンダー** する。
表示制御は `<html class="no-ruby">` + `ehon.css` 側の `.no-ruby ruby rt { display: none }` (既存実装) に一元化。
`<RubyText>` に渡す入力は今までの `page.ruby` / `story.titleRuby` (ルビ記法付き本文) のままで OK。 `<rt>` が常に DOM 上に存在するので、 SR と E2E の両方が SPEC 通り動作する。

修正対象:
- `src/components/viewers/ViewerA.tsx` L82 (CoverPage 呼び出し), L86 (本文)
- `src/components/viewers/ViewerB.tsx` L76 (CoverPage overlay 呼び出し), L79 (本文)
- `src/components/viewers/CoverPage.tsx` L18, L44 (タイトル)
- `RubyText` の prop `ruby: boolean` は不要になるため、 prop と利用側を整理する。
- `CSS` 側で `.no-ruby ruby rt { display: none }` が定義されているか念のため確認。 未定義なら追加する。

unit test (Vitest) で「`ruby=false` なら `<rt>` が無い」を検証している箇所があれば、 同時に「`<rt>` は常に存在し、 親の `.no-ruby` クラスで CSS 非表示」へ書き換える。

### 6.4 課題 D の方針 (実装修正 — hydrate を初期値で行う)

`src/stores/tweaks-context.tsx` の `useReducer` 初期化を lazy initializer に変更し、 マウント時に既に localStorage 復元済みの状態で第 1 レンダーを行う。

```diff
- const [tweaks, dispatch] = useReducer(tweaksReducer, TWEAK_DEFAULTS);
- const hydratedRef = useRef(false);
- useEffect(() => {
-   const raw = storage.get<unknown>(TWEAKS_STORAGE_KEY, TWEAK_DEFAULTS);
-   dispatch({ type: 'hydrate', value: normalizeTweaks(raw) });
-   hydratedRef.current = true;
- }, []);
- useEffect(() => {
-   if (!hydratedRef.current) return;
-   storage.set(TWEAKS_STORAGE_KEY, tweaks);
- }, [tweaks]);
+ const [tweaks, dispatch] = useReducer(
+   tweaksReducer,
+   undefined,
+   () => normalizeTweaks(storage.get<unknown>(TWEAKS_STORAGE_KEY, TWEAK_DEFAULTS)),
+ );
+ // 永続化: tweaks 変化のたびに保存。 初回も TWEAK_DEFAULTS を上書き保存するが副作用はない (SPEC.md 永続化要件と整合)。
+ useEffect(() => {
+   storage.set(TWEAKS_STORAGE_KEY, tweaks);
+ }, [tweaks]);
```

- `hydrate` action と `hydratedRef` は不要になる (削除)。
- `tweaksReducer` は `hydrate` ケースを残しても害はないが、 未使用になるので tree-shake / lint 対応として削除を推奨。
- 副次的効果として、 マウント直後の `[tweaks.night]` 等の同期 effect も初回から正しい値で走るため、 ちらつきも消える。

## 7. ドキュメント変更

- **SPEC.md**: 変更なし (SPEC は元から正しい)。
- **UI_SPEC.md**: 変更なし。
- **ARCHITECTURE.md**: 変更なし (architect への引き継ぎ不要)。
- **TEST_PLAN.md**: 変更なし (期待挙動はそのまま — 実装が追従する)。
- **`.prettierignore`**: 追記のみ (`.claude/`, `docs/`)。

## 8. developer 向け引継ぎ概要 (handoff brief)

### Phase 構成 (推奨 1 PR にまとめる)

1. **`.prettierignore` に `.claude/`, `docs/` を追加** + 既存対象ファイル 3 件 (`docker-compose.yml`, `vitest.config.ts`, `LICENSE-illustrations.md`) を `prettier --write` で整形してコミット。 → CI green 復活。
2. **TweaksProvider の lazy initializer 化** (`src/stores/tweaks-context.tsx`)。 `tweaksReducer` の `hydrate` action と `hydratedRef` を削除。 該当 unit test (Vitest) があれば更新。 → persistence.spec.ts pass。
3. **Viewer 群の ruby 三項分岐撤去** (`ViewerA.tsx`, `ViewerB.tsx`, `CoverPage.tsx`)。 `<RubyText>` を常時レンダー。 必要なら `RubyText` の `ruby` prop と利用側を整理。 `ehon.css` に `.no-ruby ruby rt { display: none }` が無ければ追加。 → ruby-toggle.spec.ts pass。
4. **home.spec.ts のループ回数を `< 6` に修正**。 同 spec 内で「最終ページで next が disabled」のアサーションが既に存在するので、 そのまま green 化。 → home.spec.ts pass。

### 確認コマンド (developer 完了時に実施)

```bash
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint .
pnpm format:check  # prettier --check . (← Phase 1 後に green になる想定)
pnpm test          # vitest run (59/59 維持)
pnpm test:e2e      # playwright test (3 project 全 pass)
```

### ブランチ / PR 戦略

- 本 issue は同一 PR (#1) のフォローアップとなる。 既存ブランチ `feat/initial-implementation` 上で続けて修正コミットを積む方針が自然。
- `git-rules.md` 「Branch & PR Strategy」 §5 (Resume) により、 developer は `git rev-parse --abbrev-ref HEAD` で `feat/initial-implementation` を検出して reuse する。
- コミットは課題ごとに 4 commit に分けることを推奨 (粒度に従い `chore:` `fix:` を使い分ける)。

### 注意事項

- 課題 C (ruby 三項撤去) は SR 互換性 (R-005) と E2E の両方を直す重要修正。 `<RubyText>` の挙動を変更する場合は unit test を併走させること。
- 課題 D は React StrictMode の double-invoke 耐性も向上する副次効果あり。
- 課題 A は `.claude/` を ignore 対象にすることで Aphelion 配布物との衝突を恒久回避する。
