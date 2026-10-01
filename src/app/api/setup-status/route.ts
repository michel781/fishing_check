import { NextResponse } from "next/server";
import { mailProvider } from "@/lib/auth/server/mail";
import { getKV, redisEnv } from "@/lib/auth/server/store";

export const dynamic = "force-dynamic";

/**
 * 운영자 설정 점검 (키 값은 절대 내보내지 않고 켜짐/꺼짐과 연결 결과만).
 * Supabase 는 공개 키로 테이블이 있는지까지 확인한다.
 */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]?.trim());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();

  let tables: Record<string, "ok" | "missing" | "error"> | null = null;
  let supabaseReachable: boolean | null = null;
  if (url && anon) {
    tables = {};
    for (const t of ["profiles", "favorites", "catch_logs", "shop_tips"]) {
      try {
        const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=0`, {
          headers: { apikey: anon, ...(anon.startsWith("eyJ") ? { authorization: `Bearer ${anon}` } : {}) },
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        supabaseReachable = true;
        const body = r.ok ? "" : await r.text();
        tables[t] = r.ok ? "ok" : /42P01|does not exist|PGRST205|Could not find the table/.test(body) ? "missing" : "error";
      } catch {
        supabaseReachable ??= false;
        tables[t] = "error";
      }
    }
  }

  // 자체 회원 저장소 (Upstash Redis)
  const kvEnv = Boolean(redisEnv());
  let kvReachable: boolean | null = null;
  const kv = getKV();
  if (kv?.kind === "redis") {
    try {
      kvReachable = (await kv.cmd<string>("PING")) === "PONG";
    } catch {
      kvReachable = false;
    }
  }

  return NextResponse.json(
    {
      accounts: { store: kvEnv, reachable: kvReachable },
      // 어떤 메일 서비스인지만 (키 값은 내보내지 않음)
      mail: mailProvider(),
      // 앱 푸시: 알림 서명 키·예약 작업 비밀값이 있는지만
      push: { keys: has("VAPID_PUBLIC_KEY") && has("VAPID_PRIVATE_KEY"), cron: has("CRON_SECRET") },
      supabase: {
        url: Boolean(url),
        anonKey: Boolean(anon),
        serviceKey: has("SUPABASE_SERVICE_ROLE_KEY") || has("SUPABASE_SECRET_KEY"),
        kakaoLogin: process.env.NEXT_PUBLIC_AUTH_KAKAO === "1",
        reachable: supabaseReachable,
        tables,
      },
      data: { publicData: has("DATA_GO_KR_SERVICE_KEY") },
      extras: {
        kakaoRest: has("KAKAO_REST_API_KEY"),
        coupang: has("COUPANG_ACCESS_KEY") && has("COUPANG_SECRET_KEY"),
        naver: has("NAVER_CLIENT_ID") && has("NAVER_CLIENT_SECRET"),
        operator: has("OPERATOR_NAME") && has("CONTACT_EMAIL"),
      },
      // NEXT_PUBLIC_ 값은 빌드 때 들어간다: 서버에는 있는데 화면 코드에 없으면 "다시 배포" 필요
      buildHasSupabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
