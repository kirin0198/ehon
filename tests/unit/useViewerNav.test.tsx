// TC-VN: useViewerNav のテスト
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewerNav } from '../../src/hooks/useViewerNav';

describe('useViewerNav', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-VN-001 初期 pageIndex=0、total=pages+1', () => {
    const { result } = renderHook(() => useViewerNav(5, () => {}));
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.total).toBe(6);
  });

  it('TC-VN-002 go(1) で pageIndex 加算', () => {
    const { result } = renderHook(() => useViewerNav(5, () => {}));
    act(() => {
      result.current.go(1);
      vi.runAllTimers();
    });
    expect(result.current.pageIndex).toBe(1);
  });

  it('TC-VN-003 go(-1) は 0 で停止', () => {
    const { result } = renderHook(() => useViewerNav(5, () => {}));
    act(() => {
      result.current.go(-1);
      vi.runAllTimers();
    });
    expect(result.current.pageIndex).toBe(0);
  });

  it('TC-VN-004 最大値で go(1) は上限を超えない', () => {
    const { result } = renderHook(() => useViewerNav(2, () => {}));
    // total = 3 (pageIndex: 0,1,2)
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.go(1);
        vi.runAllTimers();
      });
    }
    expect(result.current.pageIndex).toBe(2);
  });

  it('TC-VN-005 ArrowRight キーで次ページ', () => {
    const { result } = renderHook(() => useViewerNav(5, () => {}));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      vi.runAllTimers();
    });
    expect(result.current.pageIndex).toBe(1);
  });

  it('TC-VN-007 Escape キーで onClose を呼ぶ', () => {
    const onClose = vi.fn();
    renderHook(() => useViewerNav(5, onClose));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
