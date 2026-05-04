# Operations Result: えほんやさん（Ehon）

> Created: 2026-05-04
> Last updated: 2026-05-04
> Operations Plan: Light
> Source: docs/DELIVERY_RESULT.md (2026-05-04), docs/ARCHITECTURE.md (2026-05-04),
>         docs/SPEC.md (2026-05-04), docs/OPS_PLAN.md (2026-05-04)
> Update history:
>   - 2026-05-04: 初版 (Operations Flow Light 完了)

## 1. サマリー

3〜5 歳向け絵本 Web アプリ「えほんやさん（Ehon）」の **Vercel デプロイ** に必要な
インフラ定義 / CI/CD / セキュリティヘッダ / ライセンス雛形 / 運用計画書を整備した。

- PRODUCT_TYPE: `service` (静的 SPA)
- ホスティング: Vercel
- DB / バックエンド: なし → db-ops は実質スキップ
- 高可用性要件: なし → observability は OPS_PLAN §6 / §7 でメトリクスのみ言及 (詳細フェーズはスキップ)
- 全テスト pass / バンドル NFR クリア (DELIVERY 結果踏襲: 175KB JS / 57KB gz)

## 2. Operations プラン詳細

| Phase | Agent | 状態 |
|-------|-------|------|
| Phase 1 | infra-builder | success |
| (skipped) | db-ops | N/A — DB 不在 |
| (skipped) | observability | N/A — Light プラン / 高可用性要件なし。代替として OPS_PLAN §6・§7 で計測方針を記載 |
| Phase 2 | ops-planner | success |

## 3. Artifacts

| File | 内容 | Status |
|------|------|--------|
| `Dockerfile` | dev/test 用コンテナ定義 (Phase 11 で整備済) | present (流用) |
| `docker-compose.yml` | dev/test サービス (dev / test / typecheck / lint / build / e2e) | present (流用) |
| `.dockerignore` | docker ビルド除外 | present |
| `vercel.json` | Vercel SPA リライト + セキュリティヘッダ + キャッシュ制御 | **present (Phase 1 新規)** |
| `.github/workflows/ci.yml` | typecheck / lint / format:check / vitest / npm audit (high+) / build | **present (Phase 1 新規)** |
| `.github/workflows/e2e.yml` | Playwright (chromium + webkit) E2E + レポート artifact | **present (Phase 1 新規)** |
| `.env.example` | 環境変数テンプレート (`VITE_OG_IMAGE_URL`) | present (Delivery で整備済) |
| `LICENSE` | MIT (コード + 再話テキスト) | **present (Phase 1 新規)** |
| `LICENSE-illustrations.md` | 挿絵の権利情報管理テンプレ | **present (Phase 1 新規)** |
| `vite.config.ts` | 本番モード時 sourcemap 出力なしに更新 | modified |
| `docs/DB_OPS.md` | DB 運用ガイド | N/A — DB 不在 |
| `docs/OBSERVABILITY.md` | Observability 設計 | N/A — Light プランでスキップ |
| `docs/OPS_PLAN.md` | デプロイ / ロールバック / インシデント / メンテ計画 | **present (Phase 2 新規)** |
| `docs/OPS_RESULT.md` | 本ファイル | **present (Phase 2 新規)** |

## 4. デプロイ準備チェックリスト

### 必須
- [x] Dockerfile / docker-compose 作成済 (dev/test 用途、本番は Vercel に委譲)
- [x] CI/CD パイプライン構築 (`ci.yml` + `e2e.yml`)
- [x] 環境変数テンプレート整備 (`.env.example`)
- [x] DB 運用ガイド整備 (該当なし)
- [x] Observability 設計 (Light プランで OPS_PLAN §6・§7 のみ整備)
- [x] デプロイ手順書作成 (`OPS_PLAN.md` §1)
- [x] ロールバック手順定義 (`OPS_PLAN.md` §2 / Vercel UI + git revert の二系統)
- [x] インシデント対応プレイブック整備 (`OPS_PLAN.md` §3 / 7 シナリオ)
- [x] セキュリティヘッダ設定 (`vercel.json` / CSP / HSTS / X-Frame-Options 他)
- [x] LICENSE 配置 (MIT) と挿絵ライセンス雛形整備

### ユーザ作業 (Operations Flow 範囲外)
- [ ] Vercel アカウントを GitHub と連携
- [ ] Vercel プロジェクトをリポジトリと紐づけ
- [ ] (任意) カスタムドメインの DNS / 証明書設定
- [ ] (任意) Vercel Speed Insights を有効化 (`OPS_PLAN.md` §6)
- [ ] 挿絵画像 (`public/illustrations/`) を順次配置 (`LICENSE-illustrations.md` 同時更新)
- [ ] og-image.png の本格制作

## 5. 運用 KPI / SLO

| 指標 | 目標 | 計測手段 |
|------|------|---------|
| 可用性 | ≥ 99.9% | Vercel Status / 月次目視 |
| LCP (mobile) | ≤ 2.5s | Vercel Speed Insights / Lighthouse 月次 |
| INP | ≤ 200ms | 同上 |
| CLS | ≤ 0.1 | 同上 |
| バンドル初回 JS gz | ≤ 200 KB | CI build 出力 |
| Lighthouse Accessibility | ≥ 95 | 月次 Lighthouse |
| 重大インシデント MTTR | ≤ 30 分 | 発生時記録 |

## 6. セキュリティヘッダ概要 (vercel.json)

| Header | 値 | 目的 |
|--------|-----|------|
| `Content-Security-Policy` | default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; ... | XSS 防御 / 外部読み込み制限 |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing 回避 |
| `X-Frame-Options` | `DENY` | clickjacking 防御 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | リファラ漏えい抑制 |
| `Permissions-Policy` | camera=(), geolocation=(), microphone=() 他全部 OFF | 不必要な権限要求遮断 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS 強制 |

> CSP は Google Fonts (Klee One / BIZ UDPGothic / M PLUS Rounded 1c 等) を許可するため
> `style-src` に `https://fonts.googleapis.com`、`font-src` に `https://fonts.gstatic.com`
> を含めている。`'unsafe-inline'` は Google Fonts の `<link>` が style 属性を含むため
> やむを得ず style-src のみ許容 (script-src には付与しない)。

## 7. CI / CD 概要

### `.github/workflows/ci.yml` (push / PR for main)
1. checkout
2. Node 20 セットアップ + npm キャッシュ
3. `npm ci`
4. `npm run typecheck`
5. `npm run lint`
6. `npm run format:check`
7. `npm test` (Vitest unit + integration / 59 件)
8. `npm audit --omit=dev --audit-level=high` (本番依存に限定。dev moderate は容認)
9. `npm run build`
10. `dist/` を 7 日間 artifact 保存

### `.github/workflows/e2e.yml` (push / PR for main + workflow_dispatch)
1. checkout
2. Node 20 + npm キャッシュ
3. `npm ci`
4. `npx playwright install --with-deps chromium webkit`
5. `npm run build`
6. `npm run test:e2e` (`CI=1`)
7. `playwright-report/` を 14 日 artifact 保存
8. 失敗時のみ `test-results/` (traces) を 14 日 artifact 保存

### Vercel 連携
- main の更新 → Vercel が自動 Production デプロイ
- PR ごとに Preview Deployment URL が発行される

## 8. 残課題 (Outstanding Items)

| # | 課題 | 重要度 | 対応方針 |
|---|------|--------|---------|
| 1 | TBD-002 夜モード `--mustard` コントラスト未実測 | medium | OPS_PLAN §4.3 (四半期) に組み込み済 |
| 2 | 挿絵画像の段階配置 (`public/illustrations/`) | medium | ユーザ作業。配置時 `LICENSE-illustrations.md` 表更新 |
| 3 | og-image.png の本格制作 | low | デザイン作業。`VITE_OG_IMAGE_URL` で差し替えも可 |
| 4 | URL クエリでのバリアント切替 (FR-020 / Could) | low | 後続 PR / 任意 |
| 5 | GitHub リポジトリ未作成 / リモート未設定 | high (本番デプロイ前提) | ユーザがリポジトリを作成し `git remote add origin` を実施 |
| 6 | Lighthouse CI 化 (回帰検出自動化) | low | 任意 / 余裕があれば後続 PR |
| 7 | アクセシビリティ自動テスト (`@axe-core/playwright`) | low | 任意 / E2E に組み込み可能 |

## 9. 完了条件チェックリスト

- [x] Operations プラン (Light) 確定
- [x] Phase 1 infra-builder 完了
- [x] Phase 2 ops-planner 完了
- [x] db-ops は DB 不在のためスキップを明示
- [x] observability は Light プラン外として代替策 (OPS_PLAN §6・§7) を提示
- [x] vercel.json / CI / E2E ワークフロー整備
- [x] LICENSE / LICENSE-illustrations 整備
- [x] OPS_PLAN.md / OPS_RESULT.md 生成

---

## AGENT_RESULT (Operations Flow Completion)

```
OPERATIONS_FLOW_COMPLETED: true
PLAN: Light
PRODUCT_TYPE: service
DEPLOY_TARGET: Vercel (static SPA)
ARTIFACTS:
  - vercel.json
  - .github/workflows/ci.yml
  - .github/workflows/e2e.yml
  - LICENSE
  - LICENSE-illustrations.md
  - vite.config.ts (modified — production sourcemap off)
  - docs/OPS_PLAN.md
  - docs/OPS_RESULT.md
DEPLOY_READY: true
RUNBOOKS: 7 (Vercel deploy fail / blank page / Google Fonts down / CSP misconfig /
            dependency vuln / domain & SSL / illustration copyright)
MAINTENANCE_ITEMS: weekly=4, monthly=5, quarterly=5, annual=4
SKIPPED_PHASES:
  - db-ops (no DB / serverless static SPA)
  - observability (Light plan; metrics covered in OPS_PLAN §6 §7)
NEXT: done
```
