/** 서버 전용 fetch 래퍼: 타임아웃 + Next 데이터 캐시(revalidate) */
export async function fetchJson<T>(url: string, revalidateSec: number, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      next: { revalidate: revalidateSec },
      headers: { accept: "application/json" },
    } as RequestInit);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${new URL(url).host}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      // 공공데이터포털은 인증 오류 시 XML 을 돌려준다
      throw new Error(`JSON 아님: ${text.slice(0, 120)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/** 프로세스 메모리 캐시 (서버리스 인스턴스 재사용 시 호출 절약) */
const mem = new Map<string, { exp: number; value: unknown }>();
export async function memo<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const hit = mem.get(key);
  if (hit && hit.exp > Date.now()) return hit.value as T;
  const value = await fn();
  mem.set(key, { exp: Date.now() + ttlSec * 1000, value });
  if (mem.size > 500) {
    for (const [k, v] of mem) if (v.exp < Date.now()) mem.delete(k);
  }
  return value;
}
