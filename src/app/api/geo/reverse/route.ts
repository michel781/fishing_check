import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { reverseGeocode } from "@/lib/geo/reverse";

export const dynamic = "force-dynamic";

// 약 100m 단위로 묶어 캐시 (같은 동네는 한 번만 조회, 무료 지도 서비스 호출 한도 보호)
const cached = unstable_cache(
  async (lat: number, lon: number) => {
    const r = await reverseGeocode(lat, lon);
    if (!r) throw new Error("no address"); // 실패는 캐시하지 않는다
    return r;
  },
  ["reverse-geo-v1"],
  { revalidate: 30 * 24 * 3600 },
);

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  // 한국 주변 좌표만
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 32 || lat > 39.5 || lon < 124 || lon > 132) {
    return NextResponse.json({ label: null }, { status: 400 });
  }
  const r = await cached(Math.round(lat * 1000) / 1000, Math.round(lon * 1000) / 1000).catch(() => null);
  return NextResponse.json({ label: r?.label ?? null, source: r?.source ?? null }, { headers: { "cache-control": "private, max-age=3600" } });
}
