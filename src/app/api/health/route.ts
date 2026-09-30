import { NextResponse } from "next/server";
import { getSpot } from "@/data/spots";
import { getConditions } from "@/lib/providers";

export const dynamic = "force-dynamic";

/**
 * 배포 후 점검용. 키 값은 노출하지 않고 설정 여부와 실제로 쓰인 데이터 소스만 알려준다.
 * 서해(신진도) · 동해(주문진) 한 곳씩 조회한다.
 */
export async function GET() {
  const has = (k: string) => Boolean(process.env[k]?.trim());
  const probe = async (id: string) => {
    const spot = getSpot(id)!;
    const b = await getConditions(spot, 2);
    const first = b.hours.find((h) => Date.parse(h.time) >= Date.now() - 3600e3) ?? b.hours[0];
    return {
      spot: spot.name,
      sources: b.sources,
      tideExtremes: b.tide.extremes.length,
      sample: first && { time: first.time, windMs: first.windMs, waveM: first.waveM, seaTempC: first.seaTempC },
      notes: b.notes,
    };
  };
  const [west, east] = await Promise.all([probe("sinjin-outer"), probe("jumunjin")]);
  const live = [west, east].every((p) => p.sources.weather !== "DEMO" && p.sources.marine !== "DEMO");
  return NextResponse.json(
    {
      ok: live,
      time: new Date().toISOString(),
      config: {
        DATA_GO_KR_SERVICE_KEY: has("DATA_GO_KR_SERVICE_KEY"),
        KHOA_SERVICE_KEY: has("KHOA_SERVICE_KEY") ? "별도 키 사용" : "공공데이터포털 키 공용",
        FISHING_OFFLINE: process.env.FISHING_OFFLINE === "1",
        회원가입_Supabase: has("NEXT_PUBLIC_SUPABASE_URL") && (has("NEXT_PUBLIC_SUPABASE_ANON_KEY") || has("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")),
        회원탈퇴_서버키: has("SUPABASE_SERVICE_ROLE_KEY") || has("SUPABASE_SECRET_KEY"),
        카카오로그인: process.env.NEXT_PUBLIC_AUTH_KAKAO === "1",
        가격_쿠팡파트너스: has("COUPANG_ACCESS_KEY") && has("COUPANG_SECRET_KEY"),
        가격_네이버쇼핑: has("NAVER_CLIENT_ID") && has("NAVER_CLIENT_SECRET"),
      },
      west,
      east,
    },
    { status: live ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
