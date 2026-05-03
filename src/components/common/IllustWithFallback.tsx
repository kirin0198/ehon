// 挿絵画像の表示 + onError フォールバック。
// 実画像 (public/illustrations/{storyId}/{scene}.webp) が無い場合は
// `placeholderEmoji` + `bgColor` 色面で代替表示する (UC-018 / FR-021)。
import { useState } from 'react';
import { illustrationPath } from '../../lib/illustration-path';

type Props = {
  storyId: string;
  /** シーン名。表紙の場合は 'cover' を指定 */
  scene: string;
  placeholderEmoji: string;
  bgColor: string;
  /** 表紙ページなど、LCP 影響大の画像のみ true にする */
  eager?: boolean;
  /** スクリーンリーダー向けの代替テキスト */
  alt: string;
  className?: string;
  /** フォールバック時に画面端へ表示するシーン名タグ (デバッグ補助) */
  showSceneTag?: boolean;
};

export function IllustWithFallback({
  storyId,
  scene,
  placeholderEmoji,
  bgColor,
  eager = false,
  alt,
  className,
  showSceneTag = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const src = illustrationPath(storyId, scene);

  if (failed) {
    return (
      <div
        className={className}
        style={{
          background: bgColor,
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}
        role="img"
        aria-label={alt}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 'clamp(72px, 18vw, 200px)',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
          }}
        >
          {placeholderEmoji}
        </span>
        {showSceneTag && (
          <span
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              fontSize: 10,
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: 4,
              letterSpacing: '0.05em',
            }}
          >
            挿絵: {scene}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      onError={() => setFailed(true)}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}
