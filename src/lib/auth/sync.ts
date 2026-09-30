import type { SupabaseClient } from "@supabase/supabase-js";
import { getOwner, mergeData, readFavs, readLogs, setOwner, writeFavs, writeLogs, type LogEntry } from "@/lib/localStore";
import { getSupabase } from "./client";

/**
 * 즐겨찾기·조과 기록을 계정(Supabase)과 맞춘다.
 * 테이블 구조와 권한(RLS)은 supabase/schema.sql 참고. 모든 함수는 실패해도 앱을 멈추지 않는다.
 */

async function session(): Promise<{ sb: SupabaseClient; uid: string } | null> {
  const p = getSupabase();
  if (!p) return null;
  const sb = await p;
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  return uid ? { sb, uid } : null;
}

export async function pushFavorite(spotId: string, on: boolean): Promise<void> {
  try {
    const s = await session();
    if (!s) return;
    if (on) await s.sb.from("favorites").upsert({ user_id: s.uid, spot_id: spotId });
    else await s.sb.from("favorites").delete().eq("user_id", s.uid).eq("spot_id", spotId);
  } catch {}
}

export async function pushLog(entry: LogEntry): Promise<boolean> {
  try {
    const s = await session();
    if (!s) return false;
    const { error } = await s.sb.from("catch_logs").upsert({ user_id: s.uid, id: entry.id, data: entry, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}

export async function removeLog(id: string): Promise<void> {
  try {
    const s = await session();
    if (!s) return;
    await s.sb.from("catch_logs").delete().eq("user_id", s.uid).eq("id", id);
  } catch {}
}

async function fetchServer(sb: SupabaseClient, uid: string) {
  const [f, l] = await Promise.all([
    sb.from("favorites").select("spot_id").eq("user_id", uid),
    sb.from("catch_logs").select("data").eq("user_id", uid),
  ]);
  if (f.error) throw f.error;
  if (l.error) throw l.error;
  return {
    favs: (f.data ?? []).map((r: { spot_id: string }) => r.spot_id),
    logs: (l.data ?? []).map((r: { data: LogEntry }) => r.data).filter((x) => x && typeof x.id === "string"),
  };
}

async function upload(sb: SupabaseClient, uid: string, favs: string[], logs: LogEntry[]) {
  if (favs.length) {
    const { error } = await sb.from("favorites").upsert(favs.map((spot_id) => ({ user_id: uid, spot_id })));
    if (error) throw error;
  }
  // 사진이 들어 있으면 한 번에 너무 커질 수 있어 20개씩
  for (let i = 0; i < logs.length; i += 20) {
    const { error } = await sb
      .from("catch_logs")
      .upsert(logs.slice(i, i + 20).map((e) => ({ user_id: uid, id: e.id, data: e, updated_at: new Date().toISOString() })));
    if (error) throw error;
  }
}

/** 로그인 직후: 서버와 이 기기 데이터를 합친다 */
export async function syncOnSignIn(sb: SupabaseClient, uid: string): Promise<{ ok: boolean; favs: number; logs: number }> {
  try {
    const server = await fetchServer(sb, uid);
    const owner = getOwner();
    const m = mergeData({ favs: readFavs(), logs: readLogs() }, server, !owner || owner === uid);
    await upload(sb, uid, m.uploadFavs, m.uploadLogs);
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
export async function flushBeforeSignOut(sb: SupabaseClient, uid: string): Promise<boolean> {
  try {
    await upload(sb, uid, readFavs(), readLogs());
    writeFavs([]);
    writeLogs([]);
    setOwner(null);
    return true;
  } catch {
    return false;
  }
}
