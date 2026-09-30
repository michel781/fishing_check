import { NextResponse, type NextRequest } from "next/server";
import {
  AuthError,
  SESSION_COOKIE,
  SESSION_DAYS,
  addTip,
  changePassword,
  createSession,
  deleteTip,
  deleteUser,
  endOtherSessions,
  endSession,
  listTips,
  loadData,
  rateLimit,
  resetPassword,
  sessionUser,
  setNickname,
  signIn,
  signUp,
  toPublic,
  updateFavs,
  updateLogs,
  verifyPassword,
  type StoredUser,
} from "@/lib/auth/server/accounts";
import { getKV, type KV } from "@/lib/auth/server/store";
import { checkProof, verifyEnabled } from "@/lib/auth/server/verify";
import { TIP_DAYS, validateTip } from "@/lib/auth/tips";

export const dynamic = "force-dynamic";

/**
 * 자체 회원 기능 API (Supabase 를 쓰지 않을 때).
 * GET  /api/auth/me     로그인 상태 (store: 저장소가 연결됐는지)
 * GET  /api/auth/data   내 즐겨찾기·조과 기록
 * GET  /api/auth/tips?spot=  사장님 조황 (누구나)
 * POST /api/auth/{signup|login|logout|nickname|password|delete|favs|logs|tip|tip-delete}
 */

const NO_STORE = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });
const fail = (code: string, message: string, status: number) => json({ code, message }, status);

const ip = (req: NextRequest) => (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim().slice(0, 64);

function setSession(res: NextResponse, req: NextRequest, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}
const clearSession = (res: NextResponse) => res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });

async function me(kv: KV, req: NextRequest): Promise<StoredUser> {
  const u = await sessionUser(kv, req.cookies.get(SESSION_COOKIE)?.value);
  if (!u) throw new AuthError("session_not_found", "로그인이 풀렸어요. 다시 로그인해 주세요.", 401);
  return u;
}

function handleError(e: unknown) {
  if (e instanceof AuthError) return fail(e.code, e.message, e.status);
  console.error("[auth]", e instanceof Error ? e.message : e);
  return fail("server_error", "처리하지 못했어요. 잠시 후 다시 시도해 주세요.", 503);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const kv = getKV();
  if (action === "me") {
    if (!kv) return json({ store: false, user: null });
    try {
      const u = await sessionUser(kv, req.cookies.get(SESSION_COOKIE)?.value);
      return json({ store: true, user: u ? toPublic(u) : null });
    } catch (e) {
      console.error("[auth] me", e instanceof Error ? e.message : e);
      return json({ store: true, user: null, error: "unreachable" }, 503);
    }
  }
  if (!kv) return fail("not_configured", "회원 저장소가 연결되지 않았어요.", 501);
  try {
    if (action === "data") return json(await loadData(kv, (await me(kv, req)).id));
    if (action === "tips") {
      const since = new Date(Date.now() + 9 * 3600e3 - TIP_DAYS * 86400e3).toISOString().slice(0, 10);
      return json({ tips: await listTips(kv, req.nextUrl.searchParams.get("spot") ?? "", since) });
    }
    return fail("not_found", "없는 요청이에요.", 404);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  // 다른 사이트에서 몰래 보내는 요청 막기
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return fail("forbidden", "잘못된 요청이에요.", 403);
  const kv = getKV();
  if (!kv) return fail("not_configured", "회원 저장소가 연결되지 않았어요.", 501);
  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text.length > 2_000_000) return fail("too_large", "보낸 내용이 너무 커요.", 413);
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return fail("invalid_input", "잘못된 요청이에요.", 400);
  }

  try {
    switch (action) {
      case "signup": {
        await rateLimit(kv, `signup:${ip(req)}`, 10, 3600);
        // 메일 설정이 되어 있으면 이메일 인증을 마친 사람만 가입
        const verified = checkProof(body.proof, String(body.email ?? ""), "signup");
        if (verifyEnabled() && !verified) throw new AuthError("email_not_verified", "이메일 인증을 먼저 완료해 주세요.");
        const u = await signUp(kv, body as Parameters<typeof signUp>[1], verified);
        const res = json({ user: toPublic(u) });
        setSession(res, req, await createSession(kv, u.id));
        return res;
      }
      case "login": {
        const email = String(body.email ?? "").trim().toLowerCase();
        await rateLimit(kv, `login:${ip(req)}`, 30, 600);
        await rateLimit(kv, `login-e:${email}`, 10, 600);
        const u = await signIn(kv, email, String(body.password ?? ""));
        const res = json({ user: toPublic(u) });
        setSession(res, req, await createSession(kv, u.id));
        return res;
      }
      case "reset": {
        const email = String(body.email ?? "");
        await rateLimit(kv, `reset:${ip(req)}`, 10, 3600);
        if (!checkProof(body.proof, email, "reset")) throw new AuthError("email_not_verified", "이메일 인증을 다시 해 주세요.");
        const u = await resetPassword(kv, email, String(body.password ?? ""));
        if (!u) throw new AuthError("not_found", "가입되지 않은 이메일이에요.", 404);
        // 다른 기기의 로그인은 모두 풀고, 이 기기는 새 비밀번호로 로그인
        await endOtherSessions(kv, u.id, undefined);
        const res = json({ user: toPublic(u) });
        setSession(res, req, await createSession(kv, u.id));
        return res;
      }
      case "logout": {
        await endSession(kv, req.cookies.get(SESSION_COOKIE)?.value).catch(() => {});
        const res = json({ ok: true });
        clearSession(res);
        return res;
      }
      case "nickname": {
        const u = await setNickname(kv, await me(kv, req), String(body.nickname ?? ""));
        return json({ user: toPublic(u) });
      }
      case "password": {
        const u = await me(kv, req);
        await rateLimit(kv, `pw:${u.id}`, 10, 600);
        await changePassword(kv, u, String(body.current ?? ""), String(body.password ?? ""));
        await endOtherSessions(kv, u.id, req.cookies.get(SESSION_COOKIE)?.value);
        return json({ ok: true });
      }
      case "delete": {
        const u = await me(kv, req);
        await rateLimit(kv, `del:${u.id}`, 10, 600);
        if (!(await verifyPassword(String(body.password ?? ""), u.pw))) throw new AuthError("invalid_credentials", "비밀번호가 맞지 않아요.", 401);
        await deleteUser(kv, u);
        const res = json({ ok: true });
        clearSession(res);
        return res;
      }
      case "favs": {
        const u = await me(kv, req);
        await updateFavs(kv, u.id, body.add, body.remove);
        return json({ ok: true });
      }
      case "logs": {
        const u = await me(kv, req);
        await updateLogs(kv, u.id, body.upsert, body.remove);
        return json({ ok: true });
      }
      case "tip": {
        const u = await me(kv, req);
        await rateLimit(kv, `tip:${u.id}`, 20, 3600);
        return json({ tip: await addTip(kv, u, body, validateTip) });
      }
      case "tip-delete": {
        await deleteTip(kv, await me(kv, req), String(body.spot_id ?? ""), String(body.id ?? ""));
        return json({ ok: true });
      }
      default:
        return fail("not_found", "없는 요청이에요.", 404);
    }
  } catch (e) {
    return handleError(e);
  }
}
