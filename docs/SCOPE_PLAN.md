# Scope Plan: えほんやさん（Ehon）

> Source: INTERVIEW_RESULT.md (2026-05-04)
> Created: 2026-05-04
> Last updated: 2026-05-04
> Discovery Plan: Light
> Update history:
>   - 2026-05-04: 実画像挿絵を Won't → Must (FR-021) に昇格、サービス名検討を Delivery 残課題化、関連リスク R-011/012/013 追加 (ユーザー指示)

## 1. MVP Definition

### Minimum Scope

著作権切れ古典童話 6 作品を、本棚（2 バリアント）→ ビュアー（2 バリアント）の動線で
ふりがな・文字サイズ・夜モード・**実画像挿絵（段階的配置 + フォールバック）**対応で
読める Web アプリを Vercel にパブリック公開する。

具体的には以下を含む：

1. **本棚画面**：ShelfA（立てかけ書架）/ ShelfB（表紙ならべ）の 2 バリアント切替
2. **タグフィルター**：「グリム童話」「日本昔話」での単一選択絞り込み
3. **ビュアー画面**：ViewerA（見開き）/ ViewerB（全画面背景）の 2 バリアント切替
4. **ナビゲーション**：表紙 →「よみはじめる」CTA → 本文（ボタン・キーボード ←/→・Esc 対応）
5. **ふりがな表示**：`<ruby>` 構造維持で ON/OFF 切替（CSS 制御）
6. **読みやすさ調整**：文字サイズ 16〜36px / 2px ステップ、夜モード ON/OFF
7. **設定永続化**：localStorage に Tweaks（フォント・ふりがな・文字サイズ・夜モード・アクセント色・バリアント）
8. **レスポンシブ**：PC（〜∞）/ タブレット（〜900px）/ スマホ（〜560px）対応
9. **アクセシビリティ**：キーボード完結、`<ruby>` SR 互換、コントラスト 4.5:1、`prefers-reduced-motion` 対応
10. **実画像挿絵**：`public/illustrations/{storyId}/{scene}.webp` を読み込み、不在シーンは `placeholderEmoji` + `bg` 色面でフォールバック

### Value Delivered by MVP

- 親子で著作権の心配なく古典童話を読める「家庭内 Web 絵本ライブラリ」
- ふりがな・文字サイズ・夜モード等の調整機能で、子どもの読み発達段階に合わせた読書体験を提供
- パブリック URL を共有でき、保育園・祖父母宅などで端末を選ばず利用可能
- 開発者にとっては「将来 LLM 連携・実画像差し替え・物語追加」を載せる土台が完成する

## 2. Requirements Prioritization (MoSCoW)

| # | Requirement | Category | Rationale |
|---|------|------|------|
| FR-001 | 本棚画面で物語一覧を表示 | Must | アプリの起点。これがないと何も始まらない |
| FR-002 | 本棚レイアウト 2 バリアント切替 | Must | プロジェクトの差別化価値。モックの主要価値の一つ |
| FR-003 | タグフィルター（由来粒度） | Must | 6 作品でも由来別の探索性を提供する基本機能 |
| FR-004 | 物語をクリックでビュアー起動 | Must | 本棚 → 読書への動線 |
| FR-005 | ビュアー 2 バリアント切替 | Must | 本棚と並ぶ主要価値 |
| FR-006 | 表紙ページ + 「よみはじめる」CTA | Must | UX 上の導入点。子どもが迷わないため必須 |
| FR-007 | ページ送り（ボタン/キーボード/タップ） | Must | 読書動作の核 |
| FR-008 | ふりがな ON/OFF | Must | 3〜5 歳の読み能力に合わせる中核機能 |
| FR-009 | 文字サイズ 16〜36px 調整 | Must | 視認性・年齢適応の必須機能 |
| FR-010 | 夜モード | Must | 寝る前の読み聞かせ需要を満たす中核 NFR |
| FR-014 | Tweaks 設定の localStorage 永続化 | Must | 毎回再設定は子どもの利用を阻害する |
| FR-015 | 物語データはビルド時静的 | Must | DB なしの構成的前提。データ提供方式そのもの |
| FR-019 | レスポンシブ（PC + タブレット同等） | Must | ターゲットデバイスとしてユーザー確定 |
| FR-021 | 実画像挿絵（`public/illustrations/{storyId}/{scene}.webp` + フォールバック） | Must | ユーザー指示で MVP 必須化。画像不在時は placeholderEmoji + bg 色のフォールバックで段階的配置可能 |
| FR-011 | フォントプリセット 6 種 | Should | 個人差・読みやすさ向上に貢献するが、デフォルト 1 種でも MVP は成立 |
| FR-012 | アクセント色 4 色程度の選択 | Should | カスタマイズ価値だが、コア体験は単色でも成立 |
| FR-013 | Tweaks パネル UI（一括操作） | Should | FR-008〜FR-012 を個別 UI で出すより集約した方が UX 良いが、最低限は個別ボタンでも成立 |
| FR-016 | ページ進捗バー（4px） | Should | UX 補助。なくても読書は成立 |
| FR-017 | ページ遷移アニメーション | Should | 体験向上。なくても機能は成立。`prefers-reduced-motion` で抑制 |
| FR-018 | 空タグ時のメッセージ表示 | Could | 6 作品時点ではほぼ発生しないが UX 配慮 |
| FR-020 | URL クエリでバリアント切替 | Could | 共有時に同じ見た目を再現できるが MVP 完成後でも追加可 |
| - | LLM 新作物語生成 | Won't | ユーザー確定で MVP 完全 Out of Scope。UI からも削除 |
| - | TTS（読み上げ） | Won't | ユーザー確定で MVP 含めない |
| - | PWA / オフライン対応 | Won't | ユーザー確定で MVP では行わない |
| - | 認証 / 親モード | Won't | パブリック公開・個人情報なしのため不要 |
| - | i18n（日本語以外） | Won't | コンテンツが日本語古典再話のため対象外 |
| - | アナリティクス | Won't | MVP では未定。将来検討 |
| - | 物語追加運用の Lint（ふりがな記法バリデーション） | Could | 余裕があれば test-designer / developer で実装 |

## 3. KPIs / Success Metrics

| Metric | Target | Measurement Method | Notes |
|------|--------|---------|------|
| 主要動線完遂率 | 本棚 → 物語選択 → 表紙 → 最終ページ到達まで E2E で 100% pass | Playwright E2E（tester 実装） | Delivery 段階で実測 |
| 初回 LCP（Largest Contentful Paint） | 2.5 秒以下（Vercel Edge / 3G Fast 想定） | Lighthouse / WebPageTest | Vercel Speed Insights でも継続監視可 |
| 型・Lint・Test の CI 通過率 | 100%（main ブランチ） | GitHub Actions（Vercel デフォルト + CI 追加） | プロジェクトルール準拠 |
| アクセシビリティスコア | Lighthouse Accessibility 95 以上 | Lighthouse | コントラスト・aria-label・キーボード対応の合算指標 |
| ふりがな表示の SR 互換 | VoiceOver / NVDA で「漢字 → ルビ」の順に正しく読み上げ | 手動検証（tester） | `<ruby>` 構造維持の検証 |
| キーボード完結度 | マウスを使わずに本棚 → ビュアー → 全ページ閲覧 → 戻る が完了 | Playwright E2E + 手動 | a11y NFR の達成確認 |
| バンドルサイズ | 初回 JS ≤ 200KB gzipped | `vite build` の出力サイズ計測 | プロジェクトルール「保守性」指針の補強 |
| コントラスト比 | 全主要組み合わせで 4.5:1 以上（夜モードの `--mustard` 含む） | axe-core / 手動 | NFR 由来 |

## 4. Risk Assessment

| # | Risk | Impact | Probability | Mitigation | Source |
|---|--------|--------|---------|------|------|
| R-001 | 夜モードの `--mustard` がコントラスト 4.5:1 を満たさない | medium | medium | visual-designer で代替色を試算。閾値未達なら夜モード専用パレットを別定義 | INTERVIEW_RESULT.md Unresolved |
| R-002 | Google Fonts 取得失敗時にフォントが System に落ち、レイアウトずれが発生 | low | medium | `font-display: swap` を全 6 プリセットに適用。フォールバック CSS スタックを `system-ui, sans-serif` で明示 | IR-003 |
| R-003 | localStorage 利用不可（プライベートモード等）で永続化が壊れ、エラー停止する | medium | low | try/catch で in-memory fallback。永続化失敗はサイレント無視 + console.warn のみ | IR-002 |
| R-004 | iPad Safari で `vh` 単位がツールバー分ずれる（既知の挙動） | medium | high | `100dvh` を使用、フォールバックで `100vh`。Playwright iPad プロファイルで E2E | FR-019 / 互換性 |
| R-005 | ふりがな ON/OFF を `display:none` で切ると SR の挙動が SR ごとに揺れる | low | low | `<ruby>` 構造を維持し、`rt { display: none }` のみで制御。VoiceOver / NVDA で動作確認 | FR-008 / a11y NFR |
| R-006 | アニメーション過多で `prefers-reduced-motion` ユーザーに不快感 | medium | medium | `prefers-reduced-motion: reduce` メディアクエリで `flipNextLeft` / `floaty` / `slideInRight` / `viewerIn` を無効化 | NFR a11y |
| R-007 | 著作権切れ古典再話でも翻案範囲によって権利が発生する可能性 | low | low | 再話は本プロジェクトオリジナル文として MIT 表記。フッターに「再話：本プロジェクト」明記 | NFR ライセンス |
| R-008 | Vercel デプロイ時に Vite ビルド設定（base path / SPA fallback）漏れ | low | low | `vercel.json` のリライトルール明示。infra-builder（Operations）で標準化 | デプロイ環境 |
| R-009 | 既存モックを誤って本番ビルドに混入させる | low | low | `mock/` を Vite 設定で明示的に除外。`.gitignore` ではなく公開コミット下に置くため `tsconfig.exclude` で対応 | IR-005 |
| R-010 | スマホ（〜560px）レスポンシブの優先度が下がり、後戻り発生 | medium | low | MVP は PC + タブレット同等が主目標。スマホはモック既存の `@media (max-width:560px)` を踏襲し、E2E は iPhone プロファイルで補助検証 | FR-019 |
| R-011 | 挿絵未配置のシーンが大量に残り見栄えが悪化 | medium | medium | フォールバック（placeholderEmoji + bg 色）を MVP に組み込む。ファイル配置だけで差し替え可能な設計 | FR-021 |
| R-012 | 挿絵画像のサイズ過大で LCP NFR 未達（≤ 2.5s） | medium | medium | 推奨スペック（表紙 1024×1024, シーン 1600×900, 1 枚 ≤ 200KB, WebP）を遵守。`<img loading="lazy">` で遅延、表紙は eager。Vite asset 最適化 | NFR perf |
| R-013 | 著作権上問題のある画像が混入 | high | low | ユーザー本人作成 or 著作権切れ・CC0 等のみ許可。doc-writer が README に明記、infra-builder が `LICENSE-illustrations.md` 雛形を整備 | NFR ライセンス |

## 5. Cost Estimate (Effort-Based)

> 単位は人時（一人作業換算）。プロジェクトは個人サイドプロジェクトのため、合計は週末 2〜3 週間程度を想定。

| Phase | Estimated Effort | Notes |
|---------|---------|------|
| Spec definition (spec-designer) | 3h | INTERVIEW/SCOPE が揃っているため SPEC.md は要件清書中心 |
| UX design (ux-designer) | 4h | モックがハイファイで完成しているため UX_SPEC.md はモック踏襲が中心 |
| Architecture (architect) | 4h | 標準的な Vite + React + TS。状態管理・ルーティング・永続化レイヤの設計のみ |
| Scaffolding (scaffolder) | 2h | Light プランでは省略可。導入する場合の見積 |
| Test design (test-designer) | 3h | ユニット（ruby-parser, tweaks-store）+ E2E（主要動線） |
| Implementation (developer) | 20h | モック JSX を TypeScript + Vite 構成に再構築。コンポーネント分割と CSS 整理 + 画像読込/フォールバック実装（+2h） |
| Test execution (tester) | 4h | Vitest + Playwright（PC / iPad プロファイル）|
| Code review (reviewer) | 2h | Light プランでは省略可。導入する場合の見積 |
| Security audit (security-auditor) | 1h | 静的サイト・個人情報なしのため軽量。依存脆弱性スキャン中心 |
| Doc writing (doc-writer) | 1h | README 整備（公開後の物語追加手順等） |
| **Total（Light 想定）** | **約 37〜42h** | reviewer / scaffolder を入れると +4h |
| Operations (infra-builder + ops-planner) | 3h | Vercel ホスティングのため `vercel.json` と Deploy 手順のみ |

* この見積は規模感の把握用であり、確定見積ではない。

## 6. Handoff Assessment

- [x] Requirements are sufficiently clarified
- [x] Technical risks are within acceptable range
- [x] Scope has been agreed upon
- [x] Unresolved items can be addressed in Delivery

**Assessment: READY**

判定根拠：
- 機能要件（20 件）/ 非機能要件（14 件）/ 暗黙要件（10 件）すべてに MoSCoW 分類済み
- 技術スタック（React 18 + Vite + TS + pnpm）は project-rules.md で確定済み
- 外部依存・LLM・認証・DB なしの単一フロントエンド構成で技術的不確実性は低い
- モックがハイファイ完成済みのため UX 不確実性も低い
- 残る Unresolved Items（夜モードのコントラスト・URL クエリ対応の最終可否・著作権表記文面・favicon/OGP 等）は
  すべて Delivery 段階で解決可能な粒度

## 7. Unresolved Items

Delivery で解決すべき残課題：

1. **サービス名の正式決定** — Delivery 冒頭で確定。spec-designer が候補洗い出し → ユーザー選定 → SPEC.md / README / `<title>` / OGP / `package.json` に反映。暫定 `えほんやさん（Ehon）`
2. **挿絵画像の段階的配置（ユーザー作業）**
   - 配置先: `public/illustrations/{storyId}/{scene}.webp` / 表紙は `cover.webp`
   - シーン名キーは `data/stories.js` (`pages[].scene`) と一致
   - 推奨スペック: WebP / 表紙 1024×1024 / シーン 1600×900 / 1 枚 ≤ 200KB / 子供向け穏やかな表現 / 本人作成 or CC0 等のみ
   - 推定枚数: 表紙 6 + シーン 約 40 = 計 約 45 枚
   - Delivery 中に順次 commit、未配置はフォールバック表示
3. **アクセント色の正式な選択肢確定** — モック CSS 変数群から UI で露出する 3〜5 色を ux-designer / visual-designer で決定
4. **夜モード `--mustard` のコントラスト検証と代替色** — visual-designer で 4.5:1 を実測し、必要なら夜パレット専用の置換
5. **URL クエリでのバリアント切替（FR-020）** — Could だが、実装コストが小さい場合は MVP に含める判断を architect 段階で行う
6. **再話文の権利表記（フッター文言）** — spec-designer が SPEC に明記。「再話：本プロジェクト / 原作：パブリックドメイン」程度
7. **favicon / OGP 画像** — 公開前に必須。visual-designer / scaffolder で生成
8. **ふりがな記法 `漢字{かんじ}` のバリデーション Lint** — Could 級。test-designer が判断
9. **アナリティクス導入の要否** — MVP では未定。Operations Flow（ops-planner）で再判断
10. **物語追加運用ドキュメント** — README に手順を doc-writer が記載（PR ベース、`src/data/stories.ts` への追加 + 挿絵配置手順）
