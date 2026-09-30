import { unstable_cache } from "next/cache";

/**
 * 서버 공유 캐시 (Vercel 데이터 캐시 — 서버 인스턴스가 바뀌어도 유지).
 * 캐시가 오래되면 먼저 이전 값을 바로 돌려주고 뒤에서 새로 계산한다(stale-while-revalidate).
 * Next 실행 환경 밖(테스트·스크립트)에서는 그냥 계산한다.
 */
export function persist<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, revalidateSec: number): (...args: A) => Promise<R> {
  const cached = unstable_cache(fn, [key], { revalidate: revalidateSec });
  return async (...args: A) => {
    try {
      return await cached(...args);
    } catch (e) {
      if (/incrementalCache|static generation store|outside a request scope/i.test(String((e as Error)?.message))) return fn(...args);
      throw e;
    }
  };
}
