# Operations Plan: えほんやさん（Ehon）

> Source: docs/ARCHITECTURE.md (2026-05-04), docs/DELIVERY_RESULT.md (2026-05-04),
>         vercel.json, .github/workflows/ci.yml, .github/workflows/e2e.yml
> Created: 2026-05-04
> Last updated: 2026-05-04
> Operations Plan: Light
> Update history:
>   - 2026-05-04: 初版 (ops-planner / Operations Flow Light)

> このドキュメントは静的 SPA を Vercel にデプロイすることを前提にした運用計画書である。
> サーバ・DB・認証はないため、運用範囲はビルド成果物 / CDN / 静的アセット / 依存ライブラリの
> ヘルスケアに限られる。

## 0. システム概要 (運用観点)

| 項目 | 値 |
|------|-----|
| サービス名 | えほんやさん (Ehon) |
| デプロイターゲット | Vercel (静的 SPA) |
| ビルドコマンド | `npm run build` |
| 公開ディレクトリ | `dist/` |
| バックエンド | なし |
| データベース | なし (localStorage のみ) |
| 認証 | なし (パブリック公開) |
| 状態保存先 | クライアント localStorage `eh.tweaks` |
| 環境変数 (任意) | `VITE_OG_IMAGE_URL` |
| SLA | 個人プロジェクト相当 / Vercel 標準稼働率に従う |
| RTO 目安 | 15 分以内 (Vercel UI ロールバック / GitHub revert) |
| RPO | 該当なし (永続データなし) |

## 1. デプロイ手順

### 1.1 前提条件 (初回セットアップ)

- [ ] GitHub リポジトリの作成・push が完了している
- [ ] Vercel アカウントが GitHub と連携済み
- [ ] Vercel プロジェクトをリポジトリと紐づけ、`Framework Preset = Other`、
      `Build Command = npm run build`、`Output Directory = dist`、
      `Install Command = npm ci` を設定
- [ ] `vercel.json` がリポジトリルートにコミット済みであることを確認
- [ ] (任意) Vercel プロジェクト設定で環境変数 `VITE_OG_IMAGE_URL` を Production スコープに追加

### 1.2 初回デプロイ手順

1. ローカルで最終チェック ← **ロールバックポイント 1** (push 前なら影響範囲ゼロ)
   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   npm run build
   ```
   いずれかが失敗した場合はデプロイ中止。
2. main ブランチへの PR を作成し、CI (`.github/workflows/ci.yml`) と E2E
   (`.github/workflows/e2e.yml`) が全 pass することを確認 ← **ロールバックポイント 2**
3. PR を main にマージ (Squash merge 推奨)
4. Vercel が main の更新を検知し、自動的に Production デプロイを開始
5. デプロイ完了通知 (Vercel ダッシュボード / Slack 連携時は通知) を確認
6. 「1.4 デプロイ検証チェックリスト」を実施 ← **ロールバックポイント 3**

### 1.3 通常デプロイ手順 (2 回目以降)

1. feature/fix ブランチでローカル検証 (1.2 step 1 と同等)
2. PR を作成 → Vercel が自動的に **Preview Deployment** URL を発行
3. Preview URL で目視確認 (本棚 / ビュアー / Tweaks / iPad プロファイル)
4. CI / E2E pass を確認
5. main マージ → 自動 Production デプロイ
6. 1.4 のチェックリストを実施

### 1.4 デプロイ検証チェックリスト

- [ ] `https://<your-domain>/` が 200 を返す
- [ ] トップ (本棚) が表示される
- [ ] 6 物語 (赤ずきん / 桃太郎 / 白雪姫 / つるの恩返し / ブレーメンの音楽隊 / かさじぞう) が一覧に並ぶ
- [ ] 任意の物語を選択し、表紙 → 「よみはじめる」→ 全ページ閲覧 → 戻るが完遂する
- [ ] Tweaks パネルを開き、ふりがな / 文字サイズ / 夜モード / アクセント色 / フォント / 本棚バリアント / ビュアーバリアントが切り替わる
- [ ] リロード後も Tweaks 設定が保持される (localStorage 永続化)
- [ ] iPad / iPhone (Safari) でレイアウト崩れなし (`100dvh` 適用)
- [ ] DevTools Console にエラー出力がない
- [ ] Lighthouse (Mobile, Production URL) で a11y ≥ 95、Performance ≥ 90、Best Practices ≥ 95
- [ ] レスポンスヘッダに CSP / X-Frame-Options=DENY / HSTS が含まれている
  ```bash
  curl -sI https://<your-domain>/ | grep -iE 'content-security-policy|x-frame-options|strict-transport-security|referrer-policy|permissions-policy'
  ```

## 2. ロールバック手順

### 2.1 トリガ条件 (即時ロールバック)

以下のいずれかに該当する場合、ためらわずロールバックを発動する。

- 本棚画面が空白 / 500 系エラーになる
- 主要動線 (本棚 → ビュアー → 戻る) が完了しない
- DevTools Console に未知の例外が連発する
- セキュリティヘッダが消える / CSP がブロックして動かない
- パフォーマンス回帰: LCP > 4 秒 (3G Fast 相当) / バンドル gz > 200 KB

### 2.2 ロールバック手順 (Vercel UI / 推奨)

1. Vercel ダッシュボード → 該当プロジェクト → **Deployments** タブ
2. 直前の正常な Production デプロイを特定
3. そのデプロイの「⋯」メニューから **Promote to Production** を選択
4. Production が即座に旧バージョンに戻ることを確認 (Vercel 側で 30 秒〜1 分)
5. 2.4 のロールバック検証を実施

### 2.3 ロールバック手順 (Git revert / 副系)

Vercel UI が利用できない場合、または問題コミットを履歴から取り除きたい場合:

1. ローカルで `git log --oneline main` から問題コミット SHA を特定
2. ```bash
   git checkout main
   git pull origin main
   git revert <bad-sha>
   git push origin main
   ```
3. CI / E2E が pass し、Vercel が自動再デプロイすることを確認
4. 2.4 のロールバック検証を実施

### 2.4 ロールバック検証

- [ ] 1.4 のデプロイ検証チェックリストと同じ項目をすべて実施
- [ ] 直前のリリースと挙動が一致することを目視確認
- [ ] CHANGELOG.md にロールバック実施を追記 (yyyy-mm-dd / 理由 / 対応する Issue)

## 3. インシデント対応プレイブック

### 3.1 重大度定義

| Level | 定義 | 応答時間目標 | エスカレーション |
|-------|------|--------------|-----------------|
| P1 | サイト全体が完全停止 / 致命的セキュリティ事象 | 15 分以内 | 即時 |
| P2 | 主要動線 (ビュアー / 本棚) が機能しない / 全数のユーザに影響 | 30 分以内 | 30 分後 |
| P3 | 一部機能 (Tweaks の特定項目 / 特定ブラウザ) のみ影響 | 2 時間以内 | 翌営業日 |
| P4 | 表示崩れ / typo / 軽微な UI 問題 | 翌営業日 | 不要 |

> 個人プロジェクト相当のため当面 1 名運用を想定。エスカレーション先は本人 (オーナー) の
> セカンダリチャネル (例: SMS / 別 Slack ワークスペース) に置く。

### 3.2 シナリオ別対応

#### Scenario 1: Vercel デプロイ失敗 (P2)

- **検知**: GitHub Actions / Vercel ダッシュボードでデプロイが Failed
- **初動 (5 分以内)**:
  1. Vercel のビルドログを確認 (どの段階で失敗したか)
  2. CI ログ (`.github/workflows/ci.yml`) と比較し、ローカルで再現
  3. 直前の Production は維持されている (Vercel は失敗時昇格しない) ことを確認
- **エスカレーション**: ビルド再現せず復旧見込みが立たない場合
- **復旧**:
  - 原因が小さければ修正コミット → 通常デプロイ
  - 大きければ問題 PR を revert (§2.3) し、原因を別 PR で調査

#### Scenario 2: サイトが空白 / コンソールに例外 (P1)

- **検知**:
  - 自分での目視 / ユーザ報告 (issue, SNS)
  - DevTools Console に "Uncaught ..." 連発
- **初動 (15 分以内)**:
  1. 直近のデプロイを特定 (Vercel Deployments タブ)
  2. 例外スタックトレースを確認 (sourcemap は本番では出ないので、必要なら preview デプロイ /
     ローカルで再現)
  3. ErrorBoundary が機能しているか確認 (ホームへもどるボタンが出ているか)
- **復旧**: §2.2 で Vercel UI ロールバック

#### Scenario 3: Google Fonts 取得失敗 / フォント崩れ (P3)

- **検知**: ユーザ報告 / 自分での視認
- **初動**: ブラウザの Network パネルで `fonts.googleapis.com` / `fonts.gstatic.com`
  へのリクエスト状況を確認
- **対応方針**:
  - `index.html` に `font-display: swap` 指定済み → system フォントで暫定継続表示される
  - 取得不可が広範囲なら `@fontsource/*` 等での self-host へ切替を検討 (ARCHITECTURE.md
    R-002 緩和策)
- **復旧**: 一時的事象なら経過観察。長期化時は self-host PR を作成

#### Scenario 4: CSP がアプリを誤ブロック (P2)

- **検知**: DevTools Console に "Refused to ... because it violates CSP" / 機能不動作
- **初動 (30 分以内)**:
  1. 違反対象を特定 (script / style / img / font / connect / その他)
  2. `vercel.json` の `Content-Security-Policy` を確認
  3. 一時的に `Report-Only` モードに切替えるか、許可元を追加した PR を作成
- **復旧**:
  - 修正 PR をマージ → 自動デプロイ
  - 緊急時は `vercel.json` の該当ヘッダを削除 (一時) → 後で改めて適切な policy を再設定

#### Scenario 5: 依存ライブラリ脆弱性 (P3 〜 P2 [Critical 時])

- **検知**:
  - GitHub Dependabot アラート
  - CI の `npm audit --omit=dev --audit-level=high` が fail
  - Hook E (deps-postinstall) のリマインドから手動実行した `/vuln-scan`
- **初動**:
  1. 脆弱性 ID と影響範囲を確認 (production / dev のどちらか)
  2. dev only かつ本番ビルドに含まれない場合は P4 として扱う
- **復旧**:
  - `npm audit fix` で対応可能なら適用 → CI / E2E pass を確認 → デプロイ
  - 上位バージョン更新が必要な場合は別 PR で実施し、リグレッションテスト

#### Scenario 6: ドメイン / SSL 証明書の問題 (P1)

- **検知**:
  - ブラウザに証明書警告
  - ドメインが解決しない / 503
- **初動**:
  1. Vercel ダッシュボードの **Domains** で証明書・DNS 状態を確認
  2. DNS プロバイダ側で A / CNAME レコードが正しいか確認
- **復旧**:
  - Vercel が自動更新する Let's Encrypt 証明書のため通常は経過観察
  - 24 時間以上未復旧なら Vercel サポートに連絡

#### Scenario 7: 著作権侵害の疑いがある挿絵が混入 (P2 / 法務)

- **検知**: 第三者からの通報 / 自己発見
- **初動 (30 分以内)**:
  1. 該当ファイルを `git rm` し、即座にデプロイ
  2. `LICENSE-illustrations.md` の表を更新し、削除済みである旨を記録
- **復旧**: 必要に応じて履歴再書き込み (filter-repo) を検討。CHANGELOG.md に記録。

### 3.3 共通対応 — 判断に迷ったら

> 迷ったら **ロールバック優先**。差分は後で取り戻せるが、ユーザ体験はやり直せない。

## 4. メンテナンスチェックリスト

子供向けかつ個人運営の前提で、頻度を「毎日」ではなく現実的なタイムスケールに調整する。

### 4.1 週次 (毎週)

- [ ] Vercel ダッシュボードで直近 7 日の **Analytics** (アクセス数 / Web Vitals) を確認
- [ ] Vercel **Logs** にエラー / 警告がないか確認
- [ ] Dependabot / GitHub Security alerts に新規通知がないか確認
- [ ] (挿絵を順次配置中の場合) `LICENSE-illustrations.md` の表が最新か確認

### 4.2 月次 (毎月)

- [ ] `npm outdated` を実行し、メジャー以外の更新候補を把握
- [ ] `npm audit` を実行し、脆弱性ゼロを確認 (high+ で fail に設定済み)
- [ ] 主要動線を実機 (PC / iPad / iPhone) で各 1 回以上動作確認
- [ ] Lighthouse (Mobile) で Performance / Accessibility / Best Practices / SEO の数値を取得
- [ ] バンドル gz サイズが NFR (≤ 200KB) を維持しているか `dist/assets/*.js` を確認

### 4.3 四半期 (3 ヶ月ごと)

- [ ] 依存ライブラリの**メジャー**アップデートを評価 (React / Vite / TypeScript / ESLint /
      Vitest / Playwright)
- [ ] CSP / セキュリティヘッダのベストプラクティスを再評価 (OWASP / Mozilla Observatory)
- [ ] CHANGELOG / README の記述が古くなっていないか棚卸
- [ ] 夜モード `--mustard` のコントラスト (TBD-002) 実測 — Lighthouse / axe-core
- [ ] (挿絵が一通り揃ったあと) 挿絵の最適化状況を確認 (webp 化 / リサイズ漏れ)

### 4.4 年次 (毎年)

- [ ] Vercel プロジェクト設定 / 環境変数の棚卸
- [ ] ドメイン / SSL の有効期限を確認 (Vercel 自動更新を信頼するが、念押しで)
- [ ] LICENSE / 著作権表記 (`© {year} えほんやさん`) の年度更新
- [ ] CHANGELOG.md と GitHub Releases (任意) の整合性確認

## 5. 連絡先 / エスカレーション

| Role | 連絡先 | 備考 |
|------|--------|------|
| プロジェクトオーナー | リポジトリ owner (GitHub プロフィール) | 主要運用者 |
| ホスティングサポート | https://vercel.com/help | Vercel Status: https://www.vercel-status.com/ |
| ドメイン / DNS | (利用 DNS プロバイダのコントロールパネル) | 設定・障害連絡 |
| 通報窓口 (著作権 / 不適切コンテンツ) | GitHub Issue (テンプレ「Report」) を新設予定 | LICENSE-illustrations.md §5 と連動 |

## 6. アナリティクス・Web Vitals (任意・推奨)

DELIVERY_RESULT.md §7 #9「アナリティクス導入の要否」は Operations Flow に委譲されていた。
本プロジェクトは個人プロジェクトかつ子供向けで、PII 取得は避けたい。下記の前提で **Vercel
Analytics (Speed Insights)** の導入を推奨する。

### 推奨設定

- **Vercel Speed Insights**: Web Vitals (LCP / INP / CLS) を取得。
  - 計測コードは Vercel ダッシュボード経由で有効化するだけで OK (コード変更不要)
  - クッキー不使用、PII を保存しない方針
- **Vercel Analytics (アクセス数)**: 任意。子供向けかつ広告/トラッキング不要のため見送りも可。

### 採用しない場合の代替

- 月次の Lighthouse (Mobile) 計測 (上記 4.2) で Web Vitals を手動取得
- ブラウザ DevTools の Performance タブで重要シナリオの LCP を点検

> **注意**: Google Analytics 等の Cookie ベースのアナリティクスを導入する場合は、CSP の
> `script-src` / `connect-src` に対象ドメインを追加し、Cookie 同意 UI と Privacy Policy の
> 整備が必要になる (本 MVP では非推奨)。

## 7. SLO / KPI (運用継続中の目標値)

| 指標 | 目標 | 観測手段 |
|------|------|---------|
| 可用性 | Vercel 稼働率に追従 (実質 ≥ 99.9%) | Vercel Status / 月次目視 |
| LCP (mobile) | ≤ 2.5s | Vercel Speed Insights / Lighthouse 月次 |
| INP | ≤ 200ms | 同上 |
| CLS | ≤ 0.1 | 同上 |
| バンドル初回 JS gz | ≤ 200 KB | CI build 出力 / 月次 dist 検証 |
| Lighthouse Accessibility | ≥ 95 | 月次 Lighthouse |
| 重大インシデント MTTR | ≤ 30 分 | インシデント発生時記録 |

## 8. 残課題

- TBD-002: 夜モード `--mustard` のコントラスト 4.5:1 実測 → 4.3 (四半期) に組み込み
- 挿絵画像のユーザ段階配置 → ユーザ作業 (LICENSE-illustrations.md 同時更新)
- og-image.png 本格制作 → デザイン作業
- (任意) URL クエリでのバリアント切替 (FR-020 / Could) → 後続 PR
- (任意) GitHub Issues の障害報告テンプレート整備
- (任意) Lighthouse CI による CI 上での回帰検出自動化
