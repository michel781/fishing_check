import { NextResponse, type NextRequest } from "next/server";
import { validateEmail } from "@/lib/auth/validate";
import { codeMail, mailProvider, sendMail } from "@/lib/auth/server/mail";
import { getKV } from "@/lib/auth/server/store";
import { CODE_MINUTES, bump, checkCode, issueCode, normEmail, verifyEnabled, type Purpose } from "@/lib/auth/server/verify";

export const dynamic = "force-dynamic";

/**
 * 이메일 인증번호.
 * GET  /api/verify/status  → { enabled }  (메일 보내기 설정 여부만, 키 값은 내보내지 않음)
 * POST /api/verify/send    { email, purpose } → { token }
 * POST /api/verify/check   { email, code, token, purpose } → { proof }
 */

const NO_STORE = { "cache-control": "no-store" };
const json = (b: unknown, status = 200) => NextResponse.json(b, { status, headers: NO_STORE });
const fail = (code: string, message: string, status: number) => json({ code, message }, status);
const ip = (req: NextRequest) => (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim().slice(0, 64);
const purposeOf = (v: unknown): Purpose => (v === "reset" ? "reset" : "signup");

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (action === "status") return json({ enabled: verifyEnabled() });
  // 자동 점검 전용: 테스트 메일함 (FC_MAIL_TEST=1 일 때만)
  if (action === "outbox" && mailProvider() === "test") {
    const to = normEmail(req.nextUrl.searchParams.get("to") ?? "");
    const box = (globalThis as { __fcOutbox?: { to: string; subject: string }[] }).__fcOutbox ?? [];
    return json({ mails: box.filter((m) => normEmail(m.to) === to).map((m) => ({ subject: m.subject })) });
  }
  return fail("not_found", "없는 요청이에요.", 404);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail("forbidden", "잘못된 요청이에요.", 403);
  if (!verifyEnabled()) return fail("not_configured", "이메일 인증이 아직 준비되지 않았어요.", 501);
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("invalid_input", "잘못된 요청이에요.", 400);
  }
  const email = String(body.email ?? "").trim();
  const bad = validateEmail(email);
  if (bad) return fail("invalid_input", bad, 400);
  const purpose = purposeOf(body.purpose);

  try {
    if (action === "send") {
      // 메일 폭탄·무료 한도 소진 막기: 같은 주소 1분에 1번·1시간에 5번, 같은 접속지 1시간에 20번
      // (자동 점검 메일함일 때만 간격을 줄여 여러 번 돌릴 수 있게)
      const test = mailProvider() === "test";
      if ((await bump(`m1:${normEmail(email)}`, test ? 2 : 60)) > 1) return fail("rate_limited", "인증번호는 1분에 한 번 받을 수 있어요. 잠시 후 다시 눌러 주세요.", 429);
      if ((await bump(`mh:${normEmail(email)}`, 3600)) > (test ? 50 : 5)) return fail("rate_limited", "이 주소로 인증번호를 너무 많이 받았어요. 1시간 뒤에 다시 시도해 주세요.", 429);
      if ((await bump(`ip:${ip(req)}`, 3600)) > (test ? 1000 : 20)) return fail("rate_limited", "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", 429);
      const { code, token } = issueCode(email, purpose);
      // 비밀번호 재설정: 서버 계정이 없으면 메일은 보내지 않지만 응답은 같게 (가입 여부 노출 방지)
      const kv = getKV();
      const skip = purpose === "reset" && kv && !(await kv.cmd<string | null>("GET", `ue:${normEmail(email)}`));
      if (!skip) await sendMail(codeMail(email, code, purpose, CODE_MINUTES));
      return json({ token, minutes: CODE_MINUTES });
    }
    if (action === "check") {
      const r = await checkCode(String(body.token ?? ""), email, String(body.code ?? ""), purpose);
      return r.ok ? json({ proof: r.proof }) : fail(r.code, r.message, 400);
    }
    return fail("not_found", "없는 요청이에요.", 404);
  } catch (e) {
    console.error("[verify]", e instanceof Error ? e.message : e);
    return fail("mail_failed", "메일을 보내지 못했어요. 주소를 확인하고 잠시 후 다시 시도해 주세요.", 502);
  }
}
