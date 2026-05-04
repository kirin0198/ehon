// 挿絵画像のパス解決。
// 配置規約: public/illustrations/{storyId}/{scene}.webp (表紙は scene = 'cover')
// public/ 配下のファイルは Vite により / 直下から配信される。

/**
 * 物語 ID とシーン名から WebP の絶対パスを生成する。
 * 例: illustrationPath('akazukin', 'forest-girl') === '/illustrations/akazukin/forest-girl.webp'
 */
export function illustrationPath(storyId: string, scene: string): string {
  return `/illustrations/${storyId}/${scene}.webp`;
}

/** 表紙画像のパスを生成する。`scene = 'cover'` の糖衣 */
export function coverPath(storyId: string): string {
  return illustrationPath(storyId, 'cover');
}
