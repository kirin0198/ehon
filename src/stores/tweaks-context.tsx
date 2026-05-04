// Tweaks の Context Provider と useTweaks フック。
// 初回レンダー時に localStorage から復元済みの状態で起動し、変更時に永続化と CSS 変数同期を行う。
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
import { FONT_PRESETS } from '../lib/font-presets';

export const TWEAKS_STORAGE_KEY = 'eh.tweaks';

type TweaksContextValue = {
  tweaks: Tweaks;
  setTweak: <K extends TweakKey>(key: K, value: Tweaks[K]) => void;
  reset: () => void;
};

const TweaksContext = createContext<TweaksContextValue | null>(null);

export function TweaksProvider({ children }: { children: ReactNode }) {
  // lazy initializer で初回レンダー時に既に localStorage 復元済みにする。
  // これにより hydrate-then-apply の時間差が消え、StrictMode double-invoke 耐性も向上する。
  const [tweaks, dispatch] = useReducer(
    tweaksReducer,
    undefined,
    () => normalizeTweaks(storage.get<unknown>(TWEAKS_STORAGE_KEY, TWEAK_DEFAULTS)),
  );

  // 永続化: tweaks 変化のたびに保存 (初回も TWEAK_DEFAULTS を上書き保存するが副作用はない)
  useEffect(() => {
    storage.set(TWEAKS_STORAGE_KEY, tweaks);
  }, [tweaks]);

  // アクセント色の CSS 変数同期
  useEffect(() => {
    document.documentElement.style.setProperty('--terracotta', tweaks.accent);
  }, [tweaks.accent]);

  // フォントの CSS 変数同期
  useEffect(() => {
    const f = FONT_PRESETS[tweaks.font] ?? FONT_PRESETS.rounded;
    document.documentElement.style.setProperty('--font-body', f.body);
    document.documentElement.style.setProperty('--font-display', f.display);
  }, [tweaks.font]);

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
