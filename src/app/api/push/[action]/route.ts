import { NextResponse, type NextRequest } from "next/server";
import { getKV } from "@/lib/auth/server/store";
import { bump } from "@/lib/auth/server/verify";
import { runPush, type PushKind } from "@/lib/push/run";
import { cleanFavs, cleanPrefs, cleanSub, getSub, pushConfigured, pushTestMode, removeSub, saveSub, sendPush, subId, testOutbox, vapidPublicKey } from "@/lib/push/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 앱 푸시 알림.
 * GET  /api/push/status          → { enabled, publicKey, reason }
 * POST /api/push/subscribe       { sub, prefs, favs }   구독·설정 저장 (즐겨찾기가 바뀌어도 다시 부름)
 * POST /api/push/unsubscribe     { endpoint }
 * POST /api/push/test            { endpoint }           이 기기로 시험 알림
 * GET  /api/push/cron?kind=      예약 작업 (Authorization: Bearer CRON_SECRET)
 *      kind=digest(아침 요약) | soon(곧 황금타임) | auto(한국시각 5~6시면 digest, 그 외 soon)
 */

const NO_STORE = { "cache-control": "no-store" };
const json = (b: unknown, status = 200) => NextResponse.json(b, { status, headers: NO_STORE });
const fail = (code: string, message: string, status: number) => json({ code, message }, status);

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const kv = getKV();
  if (action === "status") {
    const reason = !kv ? "store" : !pushConfigured() ? "keys" : null;
    return json({ enabled: !reason, publicKey: vapidPublicKey() || (pushTestMode() ? "test" : ""), reason, cron: !!process.env.CRON_SECRET });
  }
  if (action === "cron") {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) return fail("not_configured", "CRON_SECRET 이 없어요.", 501);
    if (req.headers.get("authorization") !== `Bearer ${secret}`) return fail("forbidden", "권한이 없어요.", 401);
    if (!kv || !pushConfigured()) return fail("not_configured", "알림 설정이 안 됐어요.", 501);
    const q = req.nextUrl.searchParams.get("kind");
    const kstHour = (new Date().getUTCHours() + 9) % 24;
    const kind: PushKind = q === "digest" || q === "soon" ? q : kstHour === 5 ? "digest" : "soon";
    const r = await runPush(kv, kind);
    return json(r);
  }
  // 자동 점검 전용: 보낸 알림 목록
  if (action === "outbox" && pushTestMode()) return json({ items: testOutbox() });
  return fail("not_found", "없는 요청이에요.", 404);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail("forbidden", "잘못된 요청이에요.", 403);
  const kv = getKV();
  if (!kv || !pushConfigured()) return fail("not_configured", "알림 기능이 아직 준비되지 않았어요.", 501);
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("invalid_input", "잘못된 요청이에요.", 400);
  }
  try {
    if (action === "subscribe") {
      const sub = cleanSub(body.sub);
      if (!sub) return fail("invalid_input", "알림 구독 정보가 올바르지 않아요.", 400);
      const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local").trim();
      if ((await bump(`push:${ip}`, 3600)) > 60) return fail("rate_limited", "요청이 너무 많아요.", 429);
      const rec = await saveSub(kv, sub, cleanPrefs(body.prefs), cleanFavs(body.favs));
      return json({ ok: true, id: rec.id });
    }
    const endpoint = String(body.endpoint ?? "");
    const id = subId(endpoint);
    if (action === "unsubscribe") {
      await removeSub(kv, id);
      return json({ ok: true });
    }
    if (action === "test") {
      const rec = await getSub(kv, id);
      if (!rec) return fail("not_found", "알림을 먼저 켜 주세요.", 404);
      if ((await bump(`pushtest:${id}`, 600)) > 3) return fail("rate_limited", "시험 알림은 10분에 3번까지예요.", 429);
      const r = await sendPush(rec, { title: "🎣 피싱체크 알림이 켜졌어요", body: "황금타임과 위험 예보를 이렇게 알려드릴게요.", url: "/", tag: "test", key: "test" });
      if (r === "gone") await removeSub(kv, id);
      return r === "ok" ? json({ ok: true }) : fail("send_failed", "알림을 보내지 못했어요. 알림을 껐다 다시 켜 주세요.", 502);
    }
    return fail("not_found", "없는 요청이에요.", 404);
  } catch (e) {
    console.error("[push]", e instanceof Error ? e.message : e);
    return fail("server_error", "처리하지 못했어요. 잠시 후 다시 시도해 주세요.", 503);
  }
}
