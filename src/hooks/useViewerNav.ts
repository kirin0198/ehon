// ビュアーのページ送り・キーボードナビ・アニメーションロックを担うフック。
// pageIndex は 0 = 表紙ページ、1..N = 本文ページの順。total = N + 1。
import { useCallback, useEffect, useRef, useState } from 'react';

export type FlipDir = 'next' | 'prev' | null;

export type ViewerNav = {
  pageIndex: number;
  total: number;
  flipDir: FlipDir;
  /** フリップアニメーションロック中は true。ナビボタンの disabled 制御に利用する */
  isFlipping: boolean;
  go: (delta: number) => void;
};

const FLIP_LOCK_MS = 500;

export function useViewerNav(totalPages: number, onClose: () => void): ViewerNav {
  const [pageIndex, setPageIndex] = useState(0);
  const [flipDir, setFlipDir] = useState<FlipDir>(null);
  // フリップロック: state で管理することでボタンの disabled 属性に反映し、
  // Playwright 等の E2E ツールがロック完了を状態ベースで待てるようにする
  const [isFlipping, setIsFlipping] = useState(false);
  const flippingRef = useRef(false);
  const total = totalPages + 1; // 表紙 + 本文

  const go = useCallback(
    (delta: number) => {
      if (flippingRef.current) return;
      const next = pageIndex + delta;
      if (next < 0 || next >= total) return;
      flippingRef.current = true;
      setIsFlipping(true);
      setFlipDir(delta > 0 ? 'next' : 'prev');
      // ページ更新は次フレームで行うことで CSS アニメ開始のチャンスを与える
      setTimeout(() => setPageIndex(next), 0);
      setTimeout(() => {
        setFlipDir(null);
        setIsFlipping(false);
        flippingRef.current = false;
      }, FLIP_LOCK_MS);
    },
    [pageIndex, total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  return { pageIndex, total, flipDir, isFlipping, go };
}
