// Tweaks の Context Provider と useTweaks フック。
// 本番固定化 (2026-05-04) により accent / font の CSS 変数同期 useEffect を削除。
// 残る副作用は night クラス / no-ruby クラスの同期と localStorage 永続化の 3 本のみ。
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Tweaks, TweakKey } from '../types/tweaks';
import { TWEAK_DEFAULTS } from './tweaks-defaults';
import { normalizeTweaks, tweaksReducer } from './tweaks-reducer';
import * as storage from '../lib/safe-storage';

export const TWEAKS_STORAGE_KEY = 'eh.tweaks';

type TweaksContextValue = {
  tweaks: Tweaks;
  setTweak: <K extends TweakKey>(key: K, value: Tweaks[K]) => void;
  reset: () => void;
};

const TweaksContext = createContext<TweaksContextValue | null>(null);

export function TweaksProvider({ children }: { children: ReactNode }) {
  // lazy initializer で初回レンダー時に localStorage 復元済みにする。
  // StrictMode double-invoke 耐性と hydrate フラッシュ防止を兼ねる。
  const [tweaks, dispatch] = useReducer(tweaksReducer, undefined, () =>
    normalizeTweaks(storage.get<unknown>(TWEAKS_STORAGE_KEY, TWEAK_DEFAULTS)),
  );

  // 永続化: tweaks 変化のたびに保存 (新スキーマ 4 キーのみ保存される)
  useEffect(() => {
    storage.set(TWEAKS_STORAGE_KEY, tweaks);
  }, [tweaks]);

  // 夜モード: ルートに .night クラスを付与
  useEffect(() => {
    const root = document.documentElement;
    if (tweaks.night) root.classList.add('night');
    else root.classList.remove('night');
  }, [tweaks.night]);

  // ふりがな: ルートに .no-ruby クラスで切替
  useEffect(() => {
    const root = document.documentElement;
    if (tweaks.ruby) root.classList.remove('no-ruby');
    else root.classList.add('no-ruby');
  }, [tweaks.ruby]);

  const setTweak = useCallback(<K extends TweakKey>(key: K, value: Tweaks[K]) => {
    dispatch({ type: 'set', key, value });
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const value = useMemo<TweaksContextValue>(
    () => ({ tweaks, setTweak, reset }),
    [tweaks, setTweak, reset],
  );

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>;
}

export function useTweaks(): TweaksContextValue {
  const ctx = useContext(TweaksContext);
  if (!ctx) {
    throw new Error('useTweaks must be used inside <TweaksProvider>');
  }
  return ctx;
}
