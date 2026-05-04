> Last updated: 2026-05-04
> GitHub Issue: TBD (will be filled after `gh issue create`)
> Analyzed by: analyst (2026-05-04)
> Next: architect

# vercel.json SPA リライトの 404 問題修正

## 1. 背景 / Motivation

本番デプロイ後の検証で、SPA リライトが機能していないことが判明した。

```
$ curl -s -o /dev/null -w "%{http_code}\n" https://ehon-one.vercel.app/nonexistent
404
$ curl -s https://ehon-one.vercel.app/nonexistent | tail -3
The page could not be found
NOT_FOUND
```

期待動作: 存在しないパスは `index.html` にフォールバックし React アプリが起動する。

実環境:
- 本番 URL: https://ehon-one.vercel.app/
- セキュリティヘッダ (CSP / HSTS / X-Frame-Options ほか 7 種) は全て期待通り配信
- HTML index 配信、`/` のレンダリング自体は正常

## 2. ゴール / 受け入れ基準

- [ ] `https://ehon-one.vercel.app/nonexistent` が **HTTP 200** で `index.html` (React アプリ) を返す
- [ ] `https://ehon-one.vercel.app/favicon.svg` が **HTTP 200** で SVG を返す (アセットが index にリライトされない)
- [ ] `https://ehon-one.vercel.app/assets/*.js` が **HTTP 200** で JS を返す (バンドルアセットが正常配信される)
- [ ] `https://ehon-one.vercel.app/illustrations/*.svg` が **HTTP 200** で SVG を返す
- [ ] CSP / HSTS など全セキュリティヘッダが従来通り配信される (本修正で副作用なし)
- [ ] dev server (`pnpm dev`) ではこれまで通り動作 (vercel.json は本番 only のため変更なし想定)

## 3. スコープ

対象ファイル:
- `vercel.json` — `rewrites` セクションのみ変更

対象外:
- `src/**` — React 側ルーティング実装は今回対象外 (SPA リライトはサーバ側 fallback の話)
- `index.html`, `vite.config.ts` — 変更不要
- セキュリティヘッダ・キャッシュ制御 — 変更不要

## 4. 制約 / オープン課題

- API ルート (`/api/*`) の扱い:
  - 現プロジェクトは BFF / API ルート未使用
  - ただし `project-rules.md` の "LLM 連携 (将来)" でサーバ側 API ルート経由が明記されている
  - **将来予約として `/api/` は SPA fallback から除外する方針が妥当**
- E2E への影響: Playwright は dev server 起動で実施しているため `vercel.json` 変更の影響は受けない (PR テストでも回帰しない)
- 現状ユーザー影響: 低 (App.tsx が `useState` ベースで URL 連動なし)。ただし以下で即座に顕在化:
  - UC-019 / FR-020 / TBD-003 (URL クエリでバリアント共有) 実装時
  - PR プレビュー URL を deep-link で共有する運用
  - 検索エンジン経由の誤 URL 流入

## 5. 分析 (Root cause)

### 現行設定

`vercel.json` (L9-L14):

```json
"rewrites": [
  {
    "source": "/((?!.*\\..*|api/.*).*)",
    "destination": "/index.html"
  }
]
```

### 動かない理由

- Vercel の `rewrites.source` は path-to-regexp 系の DSL を使い、純粋な PCRE 正規表現の negative lookahead は**サポート外** (Vercel ドキュメントは `:path*` / `:slug` 形式を推奨)
- 現行の `/((?!.*\\..*|api/.*).*)` は path-to-regexp によりリテラル文字列または不正パターン扱いとなり、どのパスにもマッチせずリライトされない
- そのため Vercel は静的ファイル解決にフォールバックし、`/nonexistent` のような未存在パスに対し default 404 ページを返す

### Vercel の URL 解決順 ("filesystem-first")

Vercel の static deployment では以下の順でパスが解決される (Vercel docs `Project Configuration > Rewrites` 参照):

1. **Filesystem (静的ファイル)** — `dist/favicon.svg`, `dist/assets/index-*.js` 等のビルド成果物
2. **Headers** ルール (本件では 4 セット定義済み)
3. **Redirects** / **Rewrites** ルール — ここで本件 SPA fallback が動く
4. デフォルト 404

つまり**アセットは rewrites より先に解決される**ため、`source` 側で拡張子除外パターン (`.css/.js/.png` 等) を書く必要はない。

## 6. アプローチ

### 採用方針: A (シンプル化)

```json
"rewrites": [
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```

### 採用理由

| 候補 | 内容 | 評価 |
|------|------|------|
| **A** | `/((?!api/).*)` (API 除外のみ) | ★ 採用。filesystem-first 前提を活かしシンプル化。API 予約も明文化される |
| B | `/:path*` (全パスフォールバック) | 等価動作だが API 予約の意図がコード上消える |
| C | 旧 `routes` プロパティ | Vercel が非推奨。採用不可 |

### 補足

- `/api/` は現在未使用だが、`project-rules.md` の "LLM 連携 (将来)" で BFF / サーバ API ルートが予約されているため、将来 `/api/llm-generate` 等を追加した際に SPA fallback と衝突しないよう先に除外しておく
- アセット拡張子 (`.css/.js/.svg/.png` 等) はフィルタ不要 (Vercel filesystem-first により先に解決される)
- negative lookahead `(?!api/)` は path-to-regexp v6+ がサポート (Vercel の現行ランタイム対応範囲内)

## 7. ドキュメント変更

| ドキュメント | 変更 | 担当 |
|------------|------|------|
| `vercel.json` | `rewrites.source` を `/((?!api/).*)` に置換 | developer |
| `docs/SPEC.md` | **no_change** — UC-019 / TBD-003 等の URL クエリ仕様は別件。SPA リライト詳細は実装詳細であり SPEC スコープ外 | — |
| `docs/UI_SPEC.md` | **no_change** — UI 仕様への影響なし | — |
| `docs/ARCHITECTURE.md` | **architect が更新** — L578 周辺の `vercel.json` 行に "SPA fallback rewrite パターン (`/((?!api/).*)`)" と "Vercel filesystem-first 解決を前提とする" の補足を追加推奨 | architect |
| `docs/design-notes/vercel-spa-rewrite-fix.md` | 本ドキュメント (新規) | analyst |

ARCHITECTURE.md 更新理由: 当初 `vercel.json` の rewrite 詳細仕様が ARCHITECTURE.md に記載されていなかったため、再発防止 (将来 architect が見直すときに方針が分かる) と review-bot の根拠固定の意味で追記する。

## 8. architect / developer への引き継ぎ

### architect 担当

- ARCHITECTURE.md L578 行 (`| vercel.json | SPA リライト | Operations Flow infra-builder |`) を以下のように補強:
  - SPA fallback rewrite の現行パターン (`/((?!api/).*)`) を明記
  - Vercel filesystem-first 解決 (アセット → headers → rewrites の順) を前提として明記
  - 将来 `/api/*` ルート追加時はこのパターンが API 解決を阻害しないことを記載

### developer 担当

- ブランチ名: `fix/vercel-spa-rewrite`
- 変更点: `vercel.json` L11 のみ
- 変更前: `"source": "/((?!.*\\..*|api/.*).*)"`
- 変更後: `"source": "/((?!api/).*)"`
- コミットメッセージ例:
  ```
  fix: vercel.json SPA リライトを path-to-regexp 互換形式に修正

  - negative lookahead `(?!.*\..*|api/.*)` は Vercel の path-to-regexp で
    機能しないため、API 除外のみのシンプルな form `(?!api/)` に置換
  - アセット拡張子の除外は Vercel filesystem-first 解決に委ねる
  - Closes #N
  ```
- 受け入れ確認 (PR マージ後の本番 deploy 完了後):
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://ehon-one.vercel.app/nonexistent      # 期待: 200
  curl -s -o /dev/null -w "%{http_code}\n" https://ehon-one.vercel.app/favicon.svg      # 期待: 200
  curl -s https://ehon-one.vercel.app/nonexistent | grep -c '<div id="root"'             # 期待: 1 以上
  curl -sI https://ehon-one.vercel.app/nonexistent | grep -i 'content-security-policy'   # 期待: ヘッダあり
  ```
- PR タイトル: `fix: vercel.json SPA リライトが機能せず 404 を返す問題を修正`
- PR 本文に `Closes #N` を含めること (本 design-note の archive 連動のため)
