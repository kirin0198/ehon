# Security Audit: えほんやさん（Ehon）

> Source: SPEC.md (2026-05-04), ARCHITECTURE.md (2026-05-04)
> Created: 2026-05-04
> Last updated: 2026-05-04
> Auditor: security-auditor (Aphelion Delivery Flow / Light プラン)
> Update history:
>   - 2026-05-04: Initial audit

## 1. スコープ

- フロントエンドのみ (バックエンド・DB なし)
- パブリック公開、認証なし、個人情報を扱わない
- 静的サイト (Vercel, MVP 公開時点)

## 2. 監査結果サマリー

| 観点 | 結果 |
|------|------|
| OWASP Top 10 (Web) | 該当する大半が静的サイトで N/A、残りは pass |
| 依存脆弱性スキャン (`npm audit`) | moderate × 4 (dev のみ), critical/high なし |
| ハードコード秘密 | なし |
| 入力検証 | OK (localStorage 復元時に `normalizeTweaks` で型ガード) |
| XSS / コードインジェクション | OK (`innerHTML` / `dangerouslySetInnerHTML` / `eval` 不使用) |
| 認証/認可 | N/A |
| CWE チェック | 主要項目すべて該当なしまたは pass |

**CRITICAL 件数: 0** / **WARNING 件数: 1** / **INFO 件数: 4**

## 3. OWASP Top 10 (2021) 確認

| ID | カテゴリ | 該当性 / 状況 |
|----|----------|---------------|
| A01 | Broken Access Control | N/A (認証/認可なし、すべてパブリック) |
| A02 | Cryptographic Failures | N/A (機微データなし、HTTPS 配信は Vercel 標準) |
| A03 | Injection | OK (SQL / NoSQL / OS Command 該当なし。React の自動エスケープに依存し、`innerHTML` 系不使用) |
| A04 | Insecure Design | OK (LLM 連携を将来 BFF 化する設計を ARCHITECTURE.md / project-rules.md に明記) |
| A05 | Security Misconfiguration | OK (静的サイト、`.env*` は git/Hook B で保護) |
| A06 | Vulnerable Components | WARNING (`npm audit`: moderate 4 件 / dev only。詳細は §5) |
| A07 | Identification / Auth Failures | N/A |
| A08 | Software and Data Integrity Failures | OK (依存パッケージは pnpm/npm lockfile でロック、CDN 経由は Google Fonts のみ) |
| A09 | Security Logging and Monitoring Failures | INFO (アナリティクス/監視なし。MVP では未要件、Operations Flow で再判断) |
| A10 | SSRF | N/A (サーバなし) |

## 4. 依存脆弱性スキャン結果

実行: `npm audit` / Total deps: 512

| Severity | 件数 |
|----------|------|
| critical | 0 |
| high | 0 |
| moderate | 4 |
| low | 0 |
| info | 0 |

詳細:

| Package | Severity | Range | Issue |
|---------|----------|-------|-------|
| esbuild | moderate | <=0.24.2 | GHSA-67mh-4wv8-2f99: dev server が任意の Web サイトからリクエストを受けてレスポンスを返す可能性 |
| vite | moderate | <=6.4.1 | esbuild に依存 |
| vite-node | moderate | <=2.2.0-beta.2 | vite に依存 |
| vitest | moderate | (range) | vite-node に依存 |

### 評価

- **本番への影響: なし** — esbuild の dev server 脆弱性は `npm run dev` 時のみで、Vercel に配信される静的ビルド成果物には含まれない
- **緩和策**: 開発時は `localhost` バインドのみ (Vite 既定) で運用、外部公開しない
- **修正計画**: `npm audit fix --force` は Vite 5 → Vite 8 (breaking change) を伴うため、Operations Flow / 後続 PR で計画的に対応する。Operations Flow `releaser` が CI に `npm audit --audit-level=high` を組み込むことで、将来 high/critical が出た際に検知できる体制にする

## 5. CWE チェックリスト

| CWE | 内容 | 状況 |
|-----|------|------|
| CWE-79 | XSS | OK (React 自動エスケープ、`innerHTML` 不使用、ruby-parser は createElement で React ノード生成) |
| CWE-89 | SQL Injection | N/A |
| CWE-352 | CSRF | N/A (state-changing API なし) |
| CWE-20 | Improper Input Validation | OK (localStorage 復元時 `normalizeTweaks` で全フィールド型ガード) |
| CWE-200 | Sensitive Data Exposure | OK (個人情報なし、localStorage にもセンシティブデータなし) |
| CWE-256 | Plaintext Storage of a Password | N/A |
| CWE-321 | Use of Hard-coded Cryptographic Key | N/A |
| CWE-798 | Use of Hard-coded Credentials | OK (静的解析 `grep -REn "API_KEY\|SECRET\|password\|sk-"` でヒットなし) |
| CWE-915 | Improperly Controlled Modification of Object Prototype Attributes | OK (`Object.assign` / spread のみ、`__proto__` 操作なし) |
| CWE-1004 | Sensitive Cookie Without HttpOnly Flag | N/A (Cookie 不使用) |

## 6. 認証 / 認可

該当なし。MVP はパブリックアクセス、サインアップ/ログインフロー無し。

## 7. ハードコード秘密検出

- 静的解析: `grep -REn "API_KEY|SECRET|PASSWORD|password|api_key|sk-[a-zA-Z0-9]"` → ヒットなし
- `.env*` は `.gitignore` 管理、Hook B (`aphelion-sensitive-file-guard`) が誤コミットをブロック
- `.env.example` にはコメント例のみ (`VITE_OG_IMAGE_URL` の使用方法説明)

## 8. 入力検証

| 入力源 | 検証 |
|--------|------|
| URL クエリ | MVP では使用しない (Could / TBD-003 のため未実装) |
| localStorage `eh.tweaks` | `normalizeTweaks(raw)` で全フィールド型ガード。`shelfVariant`/`viewerVariant` は 'A'/'B' のみ、`fontSize` は範囲内、`accent` は hex のみ、`font` は許容プリセット ID のみ。不正値は default にフォールバック |
| 物語データ (`stories.ts`) | ビルド時静的、ユーザー入力ではない |

## 9. その他の発見事項

| Severity | 内容 |
|----------|------|
| INFO | コンテンツセキュリティポリシー (CSP) ヘッダ未設定。Vercel デプロイ時に `vercel.json` で設定可能 (Operations Flow `infra-builder` で検討) |
| INFO | Subresource Integrity (SRI): Google Fonts の CSS は `crossorigin` のみ。`integrity` は Google が公開していないため省略 (一般的な慣行) |
| INFO | 本番ビルドの `console.warn` (`safe-storage`, `ErrorBoundary`) は意図的に残置。情報漏洩リスクなし |
| INFO | dist 出力の `.map` ファイル (sourcemap) は `vite.config.ts` で `sourcemap: true`。本番では削除を検討 (Operations Flow で `sourcemap: false` に切替候補) |

## 10. 推奨アクション

| 優先度 | アクション | 担当 |
|--------|----------|------|
| 中 | Vite 5 → 8 アップグレードで esbuild 脆弱性解消 (breaking, 後続 PR で計画的に) | Operations / Maintenance |
| 中 | CI に `npm audit --audit-level=high` を組み込み | Operations Flow `releaser` |
| 低 | Vercel `vercel.json` で CSP / X-Frame-Options / Referrer-Policy ヘッダを追加 | Operations Flow `infra-builder` |
| 低 | 本番ビルドの sourcemap を OFF にする選択肢 | Operations Flow / 個人判断 |
| 低 | 夜モード `--mustard` のコントラスト 4.5:1 実測 (a11y / TBD-002) | 手動 / 後続 |

## 11. 監査結論

- **STATUS: approved**
- **CRITICAL: 0** — 本番デプロイを阻害する脆弱性なし
- **WARNING: 1** — 開発時のみ影響する moderate 脆弱性 (Vite/esbuild) を検出。本番影響なし、計画的アップグレードで対応
- **PRODUCTION_BLOCKING: false** — Vercel 公開を進めて差し支えなし

---

## AGENT_RESULT

```
AGENT_RESULT: security-auditor
STATUS: approved
ARTIFACTS:
  - docs/SECURITY_AUDIT.md
CRITICAL_COUNT: 0
WARNING_COUNT: 1
INFO_COUNT: 4
PRODUCTION_BLOCKING: false
NEXT: doc-writer
```
