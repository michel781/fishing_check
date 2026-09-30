/**
 * 이 기기(브라우저)에 저장하는 사용자 데이터: 즐겨찾기 · 조과 기록.
 * 로그인하면 lib/auth/sync.ts 가 서버(Supabase)와 맞춘다.
 */

export const FAV_KEY = "fc:favs";
export const FAV_EVT = "fc:favs-change";
export const LOG_KEY = "fc:log";
export const LOG_EVT = "fc:log-change";
/** 이 기기의 데이터가 어느 계정 것인지 (다른 계정이 로그인하면 섞지 않기 위해) */
const OWNER_KEY = "fc:owner";

export interface LogEntry {
  id: string;
  spotId: string;
  speciesId: string;
  time: string; // ISO
  count: number;
  maxCm: number | null;
  memo: string;
  predicted: { score: number; grade: string; inGolden: boolean } | null;
  /** 작게 줄인 사진 (data URL) */
  photo?: string;
}

const emit = (name: string) => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name));
};

export function readFavs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeFavs(ids: string[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)]));
  } catch {}
  emit(FAV_EVT);
}

const isEntry = (e: unknown): e is LogEntry =>
  !!e && typeof e === "object" && typeof (e as LogEntry).id === "string" && typeof (e as LogEntry).spotId === "string" && typeof (e as LogEntry).time === "string";

export function readLogs(): LogEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    return Array.isArray(v) ? v.filter(isEntry) : [];
  } catch {
    return [];
  }
}

/** 저장 공간이 부족하면 false */
export function writeLogs(v: LogEntry[]): boolean {
  let ok = true;
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(v));
  } catch {
    ok = false;
  }
  emit(LOG_EVT);
  return ok;
}

export const sortLogs = (v: LogEntry[]) => [...v].sort((a, b) => b.time.localeCompare(a.time));

export function getOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}
export function setOwner(uid: string | null) {
  try {
    if (uid) localStorage.setItem(OWNER_KEY, uid);
    else localStorage.removeItem(OWNER_KEY);
  } catch {}
}

/** 서버 데이터와 이 기기 데이터 합치기 (순수 함수, 테스트 대상) */
export function mergeData(
  local: { favs: string[]; logs: LogEntry[] },
  server: { favs: string[]; logs: LogEntry[] },
  sameOwner: boolean,
): { favs: string[]; logs: LogEntry[]; uploadFavs: string[]; uploadLogs: LogEntry[] } {
  if (!sameOwner) {
    // 다른 계정의 데이터가 남아 있던 기기: 섞지 않고 이 계정 것으로 바꾼다
    return { favs: server.favs, logs: sortLogs(server.logs), uploadFavs: [], uploadLogs: [] };
  }
  const favs = [...new Set([...server.favs, ...local.favs])];
  const serverIds = new Set(server.logs.map((l) => l.id));
  const uploadLogs = local.logs.filter((l) => !serverIds.has(l.id));
  const logs = sortLogs([...server.logs, ...uploadLogs]);
  const uploadFavs = local.favs.filter((f) => !server.favs.includes(f));
  return { favs, logs, uploadFavs, uploadLogs };
}
