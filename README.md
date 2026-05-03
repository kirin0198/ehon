# えほんやさん（Ehon）

> 3〜5 歳（未就学児）向けの、著作権切れ古典童話・昔話を読める日本語の絵本 Web アプリ。

[![Build](https://img.shields.io/badge/build-vite-blue)]() [![License](https://img.shields.io/badge/license-MIT-green)]()

---

## できること

- 6 作品の **古典童話・昔話** が読めます（赤ずきん / 桃太郎 / 白雪姫 / つるの恩返し / ブレーメンの音楽隊 / かさじぞう）
- **本棚** は 2 つのレイアウトを切り替え可能（立てかけ書架 / 表紙ならべ）
- **絵本ビュアー** も 2 つのレイアウトを切り替え可能（見開き / 全画面背景）
- **ふりがな** を ON / OFF できます（DOM 構造を維持しスクリーンリーダー互換）
- **文字サイズ** は 16〜36 px の範囲で 2 px ステップ調整
- **夜モード**（寝る前の読み聞かせに）
- **フォントプリセット 6 種** / **アクセント色 4 色** を選べます
- 設定は **localStorage に永続化**され、再訪時に復元
- **PC / タブレット / スマホ** に対応（タップ領域 ≥ 44×44 px）
- **キーボード操作のみ** でも完結（Tab / Enter / ←→ / Esc）
- **`prefers-reduced-motion`** に対応
- 著作権の切れた古典の **再話のみ** を収録（再話文・コードは MIT）

> 詳しい仕様は [`docs/SPEC.md`](docs/SPEC.md) を参照してください。

---

## クイックスタート

```bash
# 依存をインストール
npm install

# 開発サーバ起動 (http://localhost:5173)
npm run dev

# 本番ビルド
npm run build

# プレビュー
npm run preview
```

### 必要環境

- Node.js **20 LTS 以上**
- npm 10+ または pnpm 9+ （どちらでも可。プロジェクトルールでは pnpm 推奨）

---

## ディレクトリ構成

```
ehon/
├── public/
│   ├── illustrations/       # 挿絵画像 (各物語の {scene}.webp)
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── main.tsx             # Vite + React エントリ
│   ├── App.tsx              # ルートコンポーネント
│   ├── components/          # UI コンポーネント (shelves / viewers / tweaks / common / layout)
│   ├── hooks/               # useViewerNav 等
│   ├── lib/                 # ruby-parser, safe-storage, illustration-path 他
│   ├── stores/              # Tweaks Context + Reducer
│   ├── data/stories.ts      # 物語データ (静的)
│   ├── styles/              # tokens / global / ehon / reduced-motion CSS
│   └── types/               # Story / Tweaks 型
├── tests/
│   ├── unit/                # Vitest + @testing-library/react
│   └── e2e/                 # Playwright
├── docs/                    # Aphelion ワークフロー成果物
├── mock/                    # 既存ハイファイモック (リファレンス保管)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

詳細な設計は [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) を参照。

---

## 挿絵画像の追加方法

すべての物語の挿絵は WebP で `public/illustrations/{storyId}/{scene}.webp` に配置されます。
**画像が無いシーンは `placeholderEmoji` + 色面で自動的にフォールバック表示** されるため、配置は段階的に行えます。

### 配置先

```
public/illustrations/
├── akazukin/
│   ├── cover.webp           # 表紙 (1024×1024 推奨)
│   ├── forest-girl.webp     # 各シーン (1600×900 推奨)
│   ├── basket.webp
│   ├── wolf-meet.webp
│   ├── flowers.webp
│   ├── bed-wolf.webp
│   ├── hunter.webp
│   └── happy-end.webp
├── momotaro/
│   ├── cover.webp
│   ├── old-couple.webp
│   ├── peach-river.webp
│   ├── peach-boy.webp
│   ├── kibidango.webp
│   ├── animals.webp
│   ├── oni-fight.webp
│   └── treasure-home.webp
├── shirayuki/
│   └── (cover.webp + 7 シーン)
├── tsurunoongaeshi/
│   └── (cover.webp + 5 シーン)
├── bremen/
│   └── (cover.webp + 5 シーン)
└── kasajizo/
    └── (cover.webp + 5 シーン)
```

シーン名は `src/data/stories.ts` の `pages[].scene` 値と完全一致させてください。

### 推奨スペック

| 項目           | 値                                              |
| -------------- | ----------------------------------------------- |
| フォーマット   | **WebP**（必須）                                |
| 表紙の解像度   | 1024 × 1024 (正方形)                            |
| シーンの解像度 | 1600 × 900 (16:9)                               |
| 1 枚のサイズ   | **200 KB 以下**（LCP NFR 2.5s 達成のため）      |
| 品質           | 80〜85 程度                                     |
| スタイル       | 子供 (3〜5 歳) 向けの**やさしい・穏やか**な表現 |

### ライセンス上の注意

挿絵に使う画像は **以下のいずれか** を満たすものに限定してください:

- **本人作成** のオリジナル画像
- **CC0** または **MIT** など改変・再配布が許可されたパブリックライセンスの画像
- **著作権切れ** が明確な画像

> 詳細は将来的に整備される `LICENSE-illustrations.md` を参照（Operations Flow で雛形整備予定）。

### 想定総数

表紙 6 枚 + シーン 36 枚 = **約 42 枚**

---

## 物語データの追加・修正

物語は `src/data/stories.ts` に **TypeScript 型付き** で静的に定義されています。

### 新しい物語を追加するには

1. `src/data/stories.ts` の `STORIES` 配列に `Story` 型のオブジェクトを 1 件追加します
2. `id` は他と被らない英小文字 + ハイフン (`yamatomonogatari` 等)
3. `tags` は既存タグ (`グリム童話` / `日本昔話`) を再利用するか、新タグを追加
4. `pages[].scene` は他と重複しない範囲でわかりやすい英小文字 + ハイフン
5. `public/illustrations/{id}/cover.webp` と各 `{scene}.webp` を追加（無くても動作はします）

### ふりがな記法

```
桃太郎{ももたろう}は ぐんぐん大{おお}きくなりました。
```

直前の漢字部分が `<ruby><rb>桃太郎</rb><rt>ももたろう</rt></ruby>` に展開されます。
平仮名の前置詞や後続文字は `plain` テキストとして扱われます。

### コンテンツのガイドライン (project-rules.md より)

- 物語本文は **著作権切れ** の古典童話の再話のみ
- 対象年齢: 3〜5 歳 (未就学児)
- 文体: ひらがな主体、やさしい言葉、敬体不要
- 構成: 起承転結を持つ 5〜7 ページ
- 難しい漢字を使う場合は必ずルビ記法 `漢字{かんじ}` を使う

---

## 開発・テスト

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .
npm run format:check   # prettier --check .
npm run format         # prettier --write .

npm test               # vitest run (ユニット + 統合)
npm run test:watch     # 開発時ウォッチモード

# E2E (Playwright)
npm run test:e2e:install   # 初回のみブラウザインストール
npm run test:e2e           # PC + iPad + iPhone プロファイルで実行
```

### テスト方針

- **ユニット**: 59 件 (line coverage ≥ 80%) — `tests/unit/`
- **E2E**: 6 シナリオ — `tests/e2e/` (本棚動線 / キーボード完結 / ふりがな切替 / 永続化 / iPad レスポンシブ / 画像フォールバック)

詳細: [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md)

---

## 技術スタック

| Layer          | Tech                                                |
| -------------- | --------------------------------------------------- |
| 言語           | TypeScript 5 (strict)                               |
| フレームワーク | React 18                                            |
| ビルド         | Vite 5                                              |
| 状態管理       | React Context + useReducer + localStorage           |
| スタイル       | CSS Custom Properties (デザイントークン)            |
| ふりがな       | 自前パーサ (`src/lib/ruby-parser.ts`)               |
| ユニットテスト | Vitest + @testing-library/react                     |
| E2E            | Playwright (Chromium / WebKit-iPad / WebKit-iPhone) |
| Lint / Format  | ESLint + Prettier + jsx-a11y                        |
| ホスティング   | Vercel (静的サイト)                                 |

---

## アクセシビリティ

- WCAG 2.1 AA 相当のコントラスト比 4.5:1 を目指す（夜モード `--mustard` は実測中）
- キーボードのみで全操作完結
- `<ruby>` / `<rt>` 構造を維持してスクリーンリーダーで「漢字 → 読み」順に読み上げ
- `prefers-reduced-motion: reduce` ユーザーには全アニメーションを停止
- `@media (hover: none)` でタッチデバイスの hover 効果を抑制
- タップ領域は **44 × 44 px 以上**

---

## 著作権・ライセンス

- **物語本文**: 著作権切れ古典童話の **再話**。本プロジェクトのオリジナルテキストとして MIT License で配布
- **コード**: MIT License
- **挿絵画像**: ユーザーが個別に追加したものについては、追加者がライセンスを管理してください（README §「挿絵画像の追加方法 § ライセンス上の注意」参照）

```
原作: パブリックドメイン (古典童話)
再話・コード: © 2026 えほんやさん (MIT)
```

詳細は [`LICENSE`](LICENSE) を参照（後続コミットで追加予定）。

---

## 既存のハイファイモックについて

`mock/` 配下に Claude Design 由来のハイファイモック（`Ehon.html` + Babel Standalone CDN）が **デザインリファレンス** として保存されています。本実装ではこれを React 18 + Vite + TypeScript のビルド構成に作り直しています。
モック資産は本番ビルドから除外されており、ブラウザで `mock/Ehon.html` を直接開いてオリジナルの動作を確認できます。

---

## ロードマップ

- [ ] 挿絵画像の段階的配置（ユーザー作業）
- [ ] LLM 連携で新作物語生成（将来 / `claude-haiku-4-5` 等を BFF 経由で呼ぶ）
- [ ] PWA / オフライン対応
- [ ] TTS（読み上げ）
- [ ] アナリティクス導入の要否判断（Operations Flow で再判断）
- [ ] Vercel デプロイの自動化と CI（GitHub Actions / `npm audit --audit-level=high` 組み込み）

---

## ドキュメント

- [`docs/SPEC.md`](docs/SPEC.md) — 機能仕様
- [`docs/UI_SPEC.md`](docs/UI_SPEC.md) — UI 仕様 / 画面・状態
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 設計・モジュール構成・ADR
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — テスト計画
- [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) — セキュリティ監査結果
- [`docs/DELIVERY_RESULT.md`](docs/DELIVERY_RESULT.md) — Delivery Flow 結果サマリ
- [`docs/DISCOVERY_RESULT.md`](docs/DISCOVERY_RESULT.md) — Discovery Flow 結果
- [`docs/INTERVIEW_RESULT.md`](docs/INTERVIEW_RESULT.md) — 要件ヒアリング結果
- [`docs/SCOPE_PLAN.md`](docs/SCOPE_PLAN.md) — スコーププラン
