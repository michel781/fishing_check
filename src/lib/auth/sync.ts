import { getOwner, mergeData, readFavs, readLogs, setOwner, writeFavs, writeLogs, type LogEntry } from "@/lib/localStore";
import type { DataApi } from "./backend";

/**
 * 즐겨찾기·조과 기록을 계정(서버)과 맞춘다. 저장 방식(Supabase·자체 서버)은 DataApi 가 감춘다.
 * 모든 함수는 실패해도 앱을 멈추지 않는다.
 */

// 로그인한 계정이 있고 서버 동기화가 되는 방식일 때만 채워진다 (AuthProvider 가 설정)
let active: DataApi | null = null;
export function setActiveData(d: DataApi | null) {
  active = d;
}

export async function pushFavorite(spotId: string, on: boolean): Promise<void> {
  try {
    if (!active) return;
    if (on) await active.addFavs([spotId]);
    else await active.removeFav(spotId);
  } catch {}
}

export async function pushLog(entry: LogEntry): Promise<boolean> {
  try {
    if (!active) return false;
    await active.upsertLogs([entry]);
    return true;
  } catch {
    return false;
  }
}

export async function removeLog(id: string): Promise<void> {
  try {
    await active?.removeLog(id);
  } catch {}
}

async function upload(d: DataApi, favs: string[], logs: LogEntry[]) {
  await d.addFavs(favs);
  await d.upsertLogs(logs);
}

/** 로그인 직후: 서버와 이 기기 데이터를 합친다 */
export async function syncOnSignIn(d: DataApi, uid: string): Promise<{ ok: boolean; favs: number; logs: number }> {
  try {
    const server = await d.load();
    const owner = getOwner();
    const m = mergeData({ favs: readFavs(), logs: readLogs() }, server, !owner || owner === uid);
    await upload(d, m.uploadFavs, m.uploadLogs);
    writeFavs(m.favs);
    writeLogs(m.logs);
    setOwner(uid);
    return { ok: true, favs: m.favs.length, logs: m.logs.length };
  } catch {
    return { ok: false, favs: readFavs().length, logs: readLogs().length };
  }
}

/**
 * 로그아웃 전: 남은 데이터를 모두 올리고 성공하면 이 기기에서 지운다(계정에는 남음).
 * 올리지 못하면 이 기기에 그대로 둔다.
 */
export async function flushBeforeSignOut(d: DataApi): Promise<boolean> {
  try {
    await upload(d, readFavs(), readLogs());
    writeFavs([]);
    writeLogs([]);
    setOwner(null);
    return true;
  } catch {
    return false;
  }
}
