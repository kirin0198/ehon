// localStorage の安全な薄いラッパ
// プライベートブラウジングや SSR 環境などで失敗しても、上位の処理を中断させない。
// 失敗時は console.warn のみで in-memory にフォールバックする (IR-002 / R-003)。

const memoryFallback = new Map<string, string>();

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/** 安全な get。失敗時は fallback を返す */
export function get<T>(key: string, fallback: T): T {
  try {
    if (hasStorage()) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    }
    const memo = memoryFallback.get(key);
    if (memo !== undefined) return JSON.parse(memo) as T;
    return fallback;
  } catch (e) {
    // JSON parse 失敗等は warn して fallback
    console.warn('[ehon] safe-storage.get failed', { key, error: e });
    return fallback;
  }
}

/** 安全な set。失敗しても例外を上に伝播させない */
export function set<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  try {
    if (hasStorage()) {
      window.localStorage.setItem(key, serialized);
      return;
    }
    memoryFallback.set(key, serialized);
  } catch (e) {
    console.warn('[ehon] safe-storage.set failed (using memory fallback)', { key, error: e });
    memoryFallback.set(key, serialized);
  }
}

/** テスト用: in-memory fallback をリセット */
export function _resetMemoryFallback(): void {
  memoryFallback.clear();
}
