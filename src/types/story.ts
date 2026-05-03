// 物語データの型定義。
// 既存モック (mock/data/stories.js) のフィールド構造を踏襲しつつ、TypeScript で
// 厳密化する。挿絵ファイル名は `Story.id` × `Page.scene` の組で
// `public/illustrations/{id}/{scene}.webp` に解決される。

/** 個別ページ (表紙以外の本文ページ) */
export type Page = {
  /** シーン識別子。`/illustrations/{storyId}/{scene}.webp` のファイル名キー */
  scene: string;
  /** ページ背景色 (CSS color)。挿絵不在時のフォールバック面にも使う */
  bg: string;
  /** プレーン本文 (ふりがな OFF 時に表示) */
  text: string;
  /** ふりがな記法付き本文 (例: `桃太郎{ももたろう}`)。ON 時に renderRuby で展開 */
  ruby: string;
};

/** 物語 1 作品 */
export type Story = {
  id: string;
  title: string;
  titleRuby: string;
  author: string;
  origin: string;
  tags: string[];
  coverColor: string;
  coverAccent: string;
  spine: string;
  description: string;
  placeholderEmoji: string;
  pages: Page[];
};
