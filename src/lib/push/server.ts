import { createHash } from "node:crypto";
import { pairs, type KV } from "@/lib/auth/server/store";
import type { PushMsg, PushPrefs } from "./plan";

/**
 * 웹 푸시 (서버 전용).
 * 필요한 설정: VAPID_PUBLIC_KEY · VAPID_PRIVATE_KEY (알림 서명 키, /setup 에서 만들 수 있음) + 서버 저장소(Upstash Redis)
 * 저장: pushsub(해시) → { id → JSON(구독·설정·즐겨찾기) }, 보낸 알림 중복 방지: pn:<id>:<key> (2일)
 */

export interface StoredSub {
  id: string;
  sub: { endpoint: string; keys: { p256dh: string; auth: string } };
  prefs: PushPrefs;
  favs: string[];
  createdAt: string;
  updatedAt: string;
}

const env = (k: string) => process.env[k]?.trim() ?? "";
export const vapidPublicKey = () => env("VAPID_PUBLIC_KEY");
export const pushTestMode = () => env("FC_PUSH_TEST") === "1";
export const pushConfigured = () => pushTestMode() || !!(env("VAPID_PUBLIC_KEY") && env("VAPID_PRIVATE_KEY"));

export const subId = (endpoint: string) => createHash("sha256").update(endpoint).digest("base64url").slice(0, 32);
const ID_RE = /^[A-Za-z0-9_.:-]{1,80}$/;
const KEY = "pushsub";

/** 브라우저가 준 구독 정보 검사 (https 알림 서버 주소만) */
export function cleanSub(v: unknown): StoredSub["sub"] | null {
  const s = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (!s || typeof s.endpoint !== "string" || s.endpoint.length > 1000) return null;
  try {
    const u = new URL(s.endpoint);
    if (u.protocol !== "https:" && !pushTestMode()) return null;
  } catch {
    return null;
  }
  const p256dh = s.keys?.p256dh;
  const auth = s.keys?.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint: s.endpoint, keys: { p256dh, auth } };
}

export const cleanPrefs = (v: unknown): PushPrefs => {
  const p = (v ?? {}) as Partial<PushPrefs>;
  return { golden: p.golden !== false, danger: p.danger !== false };
};
export const cleanFavs = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter((x) => ID_RE.test(x)).slice(0, 20) : []);

export async function saveSub(kv: KV, sub: StoredSub["sub"], prefs: PushPrefs, favs: string[]): Promise<StoredSub> {
  const id = subId(sub.endpoint);
  const now = new Date().toISOString();
  const prev = await getSub(kv, id);
  const rec: StoredSub = { id, sub, prefs, favs, createdAt: prev?.createdAt ?? now, updatedAt: now };
  if (!prev && (await kv.cmd<number>("HLEN", KEY)) >= 50_000) throw new Error("too many subscriptions");
  await kv.cmd("HSET", KEY, id, JSON.stringify(rec));
  return rec;
}

export async function getSub(kv: KV, id: string): Promise<StoredSub | null> {
  const raw = await kv.cmd<string | null>("HGET", KEY, id);
  try {
    return raw ? (JSON.parse(raw) as StoredSub) : null;
  } catch {
    return null;
  }
}

export async function allSubs(kv: KV): Promise<StoredSub[]> {
  return Object.values(pairs(await kv.cmd("HGETALL", KEY)))
    .map((s) => {
      try {
        return JSON.parse(s) as StoredSub;
      } catch {
        return null;
      }
    })
    .filter((x): x is StoredSub => !!x);
}

export const removeSub = (kv: KV, id: string) => kv.cmd("HDEL", KEY, id);

/** 같은 알림을 이미 보냈으면 false (처음이면 표시하고 true) */
export async function firstTime(kv: KV, id: string, key: string): Promise<boolean> {
  return (await kv.cmd<string | null>("SET", `pn:${id}:${key}`, "1", "NX", "EX", 2 * 86400)) === "OK";
}

// ───────── 보내기 ─────────
type Outbox = { id: string; msg: PushMsg }[];
const outbox = () => ((globalThis as { __fcPushOutbox?: Outbox }).__fcPushOutbox ??= []);
export const testOutbox = () => outbox();

/** 보내기 결과: ok | gone(구독 만료 → 지울 것) | error */
export async function sendPush(rec: StoredSub, msg: PushMsg): Promise<"ok" | "gone" | "error"> {
  if (pushTestMode()) {
    outbox().push({ id: rec.id, msg });
    if (outbox().length > 200) outbox().shift();
    return "ok";
  }
  const webpush = (await import("web-push")).default;
  try {
    await webpush.sendNotification(rec.sub, JSON.stringify({ title: msg.title, body: msg.body, url: msg.url, tag: msg.tag }), {
      vapidDetails: {
        subject: env("VAPID_SUBJECT") || (env("CONTACT_EMAIL") ? `mailto:${env("CONTACT_EMAIL")}` : "https://fishing-check.vercel.app"),
        publicKey: env("VAPID_PUBLIC_KEY"),
        privateKey: env("VAPID_PRIVATE_KEY"),
      },
      TTL: 6 * 3600,
      urgency: msg.tag.startsWith("danger") ? "high" : "normal",
      timeout: 8000,
    });
    return "ok";
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) return "gone";
    console.error("[push]", code ?? (e instanceof Error ? e.message : e));
    return "error";
  }
}
