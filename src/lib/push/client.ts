import { readFavs } from "@/lib/localStore";

/** 앱 푸시 알림 (브라우저 쪽). 서비스워커(public/sw.js)가 알림을 화면에 띄운다. */

export const PREF_KEY = "fc:prefs";
export interface Prefs {
  region: string;
  notiGolden: boolean;
  notiDanger: boolean;
}

export function loadPrefs(): Prefs {
  try {
    return { region: "", notiGolden: true, notiDanger: true, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch {
    return { region: "", notiGolden: true, notiDanger: true };
  }
}

export type PushSupport = "ok" | "unsupported" | "ios-install" | "denied";

/** 이 기기에서 알림을 켤 수 있는지 */
export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  // 아이폰은 홈 화면에 추가한 웹앱에서만 알림을 받을 수 있다 (iOS 16.4+)
  if (ios && !standalone) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "ok";
}

export interface ServerStatus {
  enabled: boolean;
  publicKey: string;
  reason: "store" | "keys" | null;
  cron: boolean;
}

export async function serverStatus(): Promise<ServerStatus | null> {
  try {
    return (await (await fetch("/api/push/status", { cache: "no-store" })).json()) as ServerStatus;
  } catch {
    return null;
  }
}

function keyBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  return reg;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "ok") return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

async function post(path: string, body: object) {
  const r = await fetch(`/api/push/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { message?: string };
  if (!r.ok) throw new Error(j.message ?? "처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
  return j;
}

const prefsBody = (p: Prefs) => ({ golden: p.notiGolden, danger: p.notiDanger });

/** 알림 켜기: 권한 요청 → 구독 → 서버에 저장 */
export async function enablePush(publicKey: string, p: Prefs): Promise<void> {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error(perm === "denied" ? "알림이 차단돼 있어요. 브라우저 설정에서 이 사이트 알림을 허용해 주세요." : "알림 허용을 눌러야 받을 수 있어요.");
  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) as BufferSource }));
  await post("subscribe", { sub: sub.toJSON(), prefs: prefsBody(p), favs: readFavs() });
}

/** 설정·즐겨찾기가 바뀌면 서버에 다시 알린다 (구독이 없으면 아무것도 안 함) */
export async function syncPush(p: Prefs = loadPrefs()): Promise<boolean> {
  const sub = await currentSubscription();
  if (!sub) return false;
  await post("subscribe", { sub: sub.toJSON(), prefs: prefsBody(p), favs: readFavs() });
  return true;
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await post("unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export async function testPush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) throw new Error("알림을 먼저 켜 주세요.");
  await post("test", { endpoint: sub.endpoint });
}
