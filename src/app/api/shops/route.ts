import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getSpot } from "@/data/spots";
import { findShops, mapSearchLinks, shopProvider, type Shop } from "@/lib/shops";

export const dynamic = "force-dynamic";

// 가게 목록은 자주 바뀌지 않으니 포인트별 7일 캐시 (실패는 캐시하지 않음)
const cached = unstable_cache(async (id: string, lat: number, lon: number, area: string) => findShops(lat, lon, area), ["shops-v1"], { revalidate: 7 * 24 * 3600 });

export async function GET(req: NextRequest) {
  const spot = getSpot(req.nextUrl.searchParams.get("spot") ?? "");
  if (!spot) return NextResponse.json({ error: "unknown spot" }, { status: 404 });
  const provider = shopProvider();
  let shops: Shop[] = [];
  let error = false;
  if (provider) {
    try {
      shops = await cached(spot.id, spot.lat, spot.lon, spot.area);
    } catch {
      error = true;
    }
  }
  return NextResponse.json(
    { provider, error, shops, links: mapSearchLinks(spot.area, spot.name) },
    { headers: { "cache-control": provider && !error ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=600" } },
  );
}
