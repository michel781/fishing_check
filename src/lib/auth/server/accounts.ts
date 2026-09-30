import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { validateEmail, validateNickname, validatePassword } from "../validate";
import { pairs, type KV } from "./store";

/**
 * 자체 회원 기능 (Supabase 가 없을 때). 서버 전용.
 * - 비밀번호: scrypt + 사용자별 소금 (원문은 저장하지 않음)
 * - 로그인 유지: 무작위 토큰을 httpOnly 쿠키로, 서버에는 토큰의 해시만 저장
 * 키 구조
 *   ue:<이메일>  → uid          u:<uid> → 회원 JSON
 *   s:<토큰해시> → uid (60일)   ss:<uid> → 세션 해시 목록
 *   f:<uid> → 즐겨찾기(집합)     l:<uid> → 조과 기록(id → JSON)
 *   t:<spotId> → 사장님 조황(id → JSON)
 */

export const SESSION_COOKIE = "fc_sess";
export const SESSION_DAYS = 60;
const SESSION_TTL = SESSION_DAYS * 86400;

export interface StoredUser {
  id: string;
  email: string;
  nickname: string;
  pw: string;
  createdAt: string;
  marketing: boolean;
  termsAt: string;
}
export type PublicUser = Omit<StoredUser, "pw" | "termsAt">;

export const toPublic = ({ id, email, nickname, createdAt, marketing }: StoredUser): PublicUser => ({ id, email, nickname, createdAt, marketing });

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

// ───────── 비밀번호 ─────────
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const derive = (pw: string, salt: Buffer) =>
  new Promise<Buffer>((ok, fail) => scrypt(pw.normalize("NFKC"), salt, 32, SCRYPT, (e, k) => (e ? fail(e) : ok(k))));

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  return `s1$${salt.toString("base64url")}$${(await derive(pw, salt)).toString("base64url")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [v, s, h] = stored.split("$");
  if (v !== "s1" || !s || !h) return false;
  const want = Buffer.from(h, "base64url");
  const got = await derive(pw, Buffer.from(s, "base64url"));
  return want.length === got.length && timingSafeEqual(want, got);
}

// 없는 이메일로 로그인할 때도 같은 시간이 걸리게 하는 가짜 해시 (가입 여부 추측 방지)
let dummy: Promise<string> | null = null;

const normEmail = (e: string) => e.trim().toLowerCase();
const tokenHash = (t: string) => createHash("sha256").update(t).digest("base64url");

// ───────── 요청 횟수 제한 ─────────
export async function rateLimit(kv: KV, key: string, max: number, windowSec: number) {
  const k = `rl:${key}`;
  const n = await kv.cmd<number>("INCR", k);
  if (n === 1) await kv.cmd("EXPIRE", k, windowSec);
  if (n > max) throw new AuthError("rate_limited", "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", 429);
}

// ───────── 회원 ─────────
export async function getUser(kv: KV, uid: string): Promise<StoredUser | null> {
  const raw = await kv.cmd<string | null>("GET", `u:${uid}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const saveUser = (kv: KV, u: StoredUser) => kv.cmd("SET", `u:${u.id}`, JSON.stringify(u));

export async function signUp(kv: KV, input: { email: string; password: string; nickname: string; marketing?: boolean; agree?: boolean }): Promise<StoredUser> {
  const email = String(input.email ?? "");
  const password = String(input.password ?? "");
  const nickname = String(input.nickname ?? "").trim();
  const bad = validateNickname(nickname) ?? validateEmail(email) ?? validatePassword(password);
  if (bad) throw new AuthError("invalid_input", bad);
  if (input.agree !== true) throw new AuthError("invalid_input", "필수 항목에 동의해 주세요.");
  const id = randomUUID();
  // 같은 이메일이 동시에 가입해도 하나만 성공하게 NX 로 먼저 자리를 잡는다
  const took = await kv.cmd<string | null>("SET", `ue:${normEmail(email)}`, id, "NX");
  if (took !== "OK") throw new AuthError("user_already_exists", "이미 가입된 이메일이에요. 로그인해 주세요.", 409);
  const now = new Date().toISOString();
  const u: StoredUser = { id, email: email.trim(), nickname, pw: await hashPassword(password), createdAt: now, marketing: input.marketing === true, termsAt: now };
  try {
    await saveUser(kv, u);
  } catch (e) {
    await kv.cmd("DEL", `ue:${normEmail(email)}`).catch(() => {});
    throw e;
  }
  return u;
}

export async function signIn(kv: KV, email: string, password: string): Promise<StoredUser> {
  const fail = new AuthError("invalid_credentials", "이메일 또는 비밀번호가 맞지 않아요.", 401);
  if (validateEmail(String(email ?? "")) || !password) throw fail;
  const uid = await kv.cmd<string | null>("GET", `ue:${normEmail(email)}`);
  const u = uid ? await getUser(kv, uid) : null;
  if (!u) {
    dummy ??= hashPassword("dummy-password-1");
    await verifyPassword(String(password), await dummy);
    throw fail;
  }
  if (!(await verifyPassword(String(password), u.pw))) throw fail;
  return u;
}

export async function setNickname(kv: KV, u: StoredUser, nickname: string): Promise<StoredUser> {
  const n = String(nickname ?? "").trim();
  const bad = validateNickname(n);
  if (bad) throw new AuthError("invalid_input", bad);
  const next = { ...u, nickname: n };
  await saveUser(kv, next);
  return next;
}

export async function changePassword(kv: KV, u: StoredUser, current: string, password: string) {
  if (!(await verifyPassword(String(current ?? ""), u.pw))) throw new AuthError("invalid_credentials", "지금 비밀번호가 맞지 않아요.", 401);
  const bad = validatePassword(String(password ?? ""));
  if (bad) throw new AuthError("invalid_input", bad);
  if (current === password) throw new AuthError("same_password", "지금 쓰는 비밀번호와 다른 비밀번호를 정해 주세요.");
  await saveUser(kv, { ...u, pw: await hashPassword(password) });
}

export async function deleteUser(kv: KV, u: StoredUser) {
  const sessions = await kv.cmd<string[]>("SMEMBERS", `ss:${u.id}`);
  await kv.pipe([
    ["DEL", `u:${u.id}`, `ue:${normEmail(u.email)}`, `f:${u.id}`, `l:${u.id}`, `ss:${u.id}`],
    ...(sessions.length ? [["DEL", ...sessions.map((h) => `s:${h}`)]] : []),
  ]);
}

// ───────── 세션 ─────────
export async function createSession(kv: KV, uid: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const h = tokenHash(token);
  await kv.pipe([
    ["SET", `s:${h}`, uid, "EX", SESSION_TTL],
    ["SADD", `ss:${uid}`, h],
    ["EXPIRE", `ss:${uid}`, SESSION_TTL],
  ]);
  return token;
}

export async function sessionUser(kv: KV, token: string | undefined): Promise<StoredUser | null> {
  if (!token || token.length > 100) return null;
  const uid = await kv.cmd<string | null>("GET", `s:${tokenHash(token)}`);
  return uid ? getUser(kv, uid) : null;
}

export async function endSession(kv: KV, token: string | undefined) {
  if (!token || token.length > 100) return;
  const h = tokenHash(token);
  const uid = await kv.cmd<string | null>("GET", `s:${h}`);
  await kv.pipe([["DEL", `s:${h}`], ...(uid ? [["SREM", `ss:${uid}`, h]] : [])]);
}

/** 비밀번호를 바꾸면 다른 기기의 로그인은 모두 풀고 지금 기기만 남긴다 */
export async function endOtherSessions(kv: KV, uid: string, keep: string | undefined) {
  const keepH = keep ? tokenHash(keep) : "";
  const all = await kv.cmd<string[]>("SMEMBERS", `ss:${uid}`);
  const drop = all.filter((h) => h !== keepH);
  if (drop.length) await kv.pipe([["DEL", ...drop.map((h) => `s:${h}`)], ["SREM", `ss:${uid}`, ...drop]]);
}

// ───────── 즐겨찾기·조과 기록 ─────────
const MAX_FAVS = 500;
const MAX_LOGS = 3000;
const MAX_LOG_BYTES = 400_000; // 사진이 든 기록 한 건의 최대 크기
const ID_RE = /^[A-Za-z0-9_.:-]{1,80}$/;

export async function loadData(kv: KV, uid: string) {
  const [favs, flat] = (await kv.pipe([["SMEMBERS", `f:${uid}`], ["HGETALL", `l:${uid}`]])) as [string[], unknown];
  const logs = Object.values(pairs(flat))
    .map((s) => {
      try {
        return JSON.parse(s) as { id: string };
      } catch {
        return null;
      }
    })
    .filter((x): x is { id: string } => !!x && typeof x.id === "string");
  return { favs: favs ?? [], logs };
}

export async function updateFavs(kv: KV, uid: string, add: unknown, remove: unknown) {
  const a = (Array.isArray(add) ? add : []).map(String).filter((x) => ID_RE.test(x));
  const r = (Array.isArray(remove) ? remove : []).map(String).filter((x) => ID_RE.test(x));
  if (a.length) {
    const n = await kv.cmd<number>("SCARD", `f:${uid}`);
    if (n + a.length > MAX_FAVS) throw new AuthError("too_many", `즐겨찾기는 ${MAX_FAVS}곳까지 저장할 수 있어요.`);
    await kv.cmd("SADD", `f:${uid}`, ...a);
  }
  if (r.length) await kv.cmd("SREM", `f:${uid}`, ...r);
}

export async function updateLogs(kv: KV, uid: string, upsert: unknown, remove: unknown) {
  const up = (Array.isArray(upsert) ? upsert : []).filter(
    (e): e is { id: string } => !!e && typeof e === "object" && typeof (e as { id?: unknown }).id === "string" && ID_RE.test((e as { id: string }).id),
  );
  const rm = (Array.isArray(remove) ? remove : []).map(String).filter((x) => ID_RE.test(x));
  if (up.length) {
    const args: string[] = [];
    for (const e of up) {
      const s = JSON.stringify(e);
      if (s.length > MAX_LOG_BYTES) throw new AuthError("too_large", "사진이 너무 커서 올리지 못했어요.", 413);
      args.push(e.id, s);
    }
    const n = await kv.cmd<number>("HLEN", `l:${uid}`);
    if (n + up.length > MAX_LOGS) throw new AuthError("too_many", `조과 기록은 ${MAX_LOGS}건까지 저장할 수 있어요.`);
    await kv.cmd("HSET", `l:${uid}`, ...args);
  }
  if (rm.length) await kv.cmd("HDEL", `l:${uid}`, ...rm);
}

// ───────── 사장님 조황 ─────────
export interface Tip {
  id: string;
  spot_id: string;
  shop_name: string;
  species: string[];
  content: string;
  heard_on: string;
  nickname: string | null;
  author: string;
  created_at: string;
}

const TIP_KEEP_DAYS = 60;

export async function listTips(kv: KV, spotId: string, sinceDate: string): Promise<Tip[]> {
  if (!ID_RE.test(spotId)) return [];
  const all = Object.entries(pairs(await kv.cmd("HGETALL", `t:${spotId}`)))
    .map(([, s]) => {
      try {
        return JSON.parse(s) as Tip;
      } catch {
        return null;
      }
    })
    .filter((t): t is Tip => !!t);
  // 오래된 조황은 정리
  const old = new Date(Date.now() - TIP_KEEP_DAYS * 86400e3).toISOString().slice(0, 10);
  const stale = all.filter((t) => t.heard_on < old).map((t) => t.id);
  if (stale.length) await kv.cmd("HDEL", `t:${spotId}`, ...stale).catch(() => {});
  return all
    .filter((t) => t.heard_on >= sinceDate)
    .sort((a, b) => b.heard_on.localeCompare(a.heard_on) || b.created_at.localeCompare(a.created_at))
    .slice(0, 20);
}

export async function addTip(kv: KV, u: StoredUser, t: Partial<Tip>, validate: (t: { shop_name: string; content: string }) => string | null) {
  const spot = String(t.spot_id ?? "");
  const shop = String(t.shop_name ?? "").trim();
  const content = String(t.content ?? "").trim();
  const heard = String(t.heard_on ?? "");
  if (!ID_RE.test(spot)) throw new AuthError("invalid_input", "포인트를 확인해 주세요.");
  const bad = validate({ shop_name: shop, content });
  if (bad) throw new AuthError("invalid_input", bad);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(heard)) throw new AuthError("invalid_input", "들은 날을 확인해 주세요.");
  const species = (Array.isArray(t.species) ? t.species : []).map(String).filter((x) => ID_RE.test(x)).slice(0, 10);
  const tip: Tip = { id: randomUUID(), spot_id: spot, shop_name: shop, species, content, heard_on: heard, nickname: u.nickname, author: u.id, created_at: new Date().toISOString() };
  if ((await kv.cmd<number>("HLEN", `t:${spot}`)) >= 300) throw new AuthError("too_many", "이 포인트에 조황이 너무 많아요. 잠시 후 다시 시도해 주세요.");
  await kv.cmd("HSET", `t:${spot}`, tip.id, JSON.stringify(tip));
  return tip;
}

export async function deleteTip(kv: KV, u: StoredUser, spotId: string, id: string) {
  if (!ID_RE.test(spotId) || !ID_RE.test(id)) throw new AuthError("invalid_input", "잘못된 요청이에요.");
  const raw = await kv.cmd<string | null>("HGET", `t:${spotId}`, id);
  if (!raw) return;
  const t = JSON.parse(raw) as Tip;
  if (t.author !== u.id) throw new AuthError("forbidden", "내가 쓴 조황만 지울 수 있어요.", 403);
  await kv.cmd("HDEL", `t:${spotId}`, id);
}
