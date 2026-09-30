import { unstable_cache } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { getRigSpec } from "@/data/rigSpecs";
import { coupangSearchUrl, searchOffers, shopProvider, type Offer, type OfferResult } from "@/lib/shop";

export const dynamic = "force-dynamic";

/**
 * 어종별 채비 준비물 + 실시간 가격.
 * 같은 검색어는 3시간 동안 서버 캐시(쿠팡 호출 한도 보호) + CDN 1시간 캐시.
 */
const cachedSearch = unstable_cache(async (keyword: string) => searchOffers(keyword, 5), ["gear-offers-v1"], { revalidate: 3 * 3600 });

export interface GearResponse {
  provider: "coupang" | "naver" | null;
  fetchedAt: string | null;
  items: { id: string; offer: Offer | null; moreUrl: string; alternatives: number }[];
}

export async function GET(req: NextRequest) {
  const species = req.nextUrl.searchParams.get("species") ?? "";
  const spec = getRigSpec(species);
  if (!spec) return NextResponse.json({ error: "unknown species" }, { status: 404 });

  const provider = shopProvider();
  let fetchedAt: string | null = null;
  const items = await Promise.all(
    spec.gear.map(async (g) => {
      let r: OfferResult | null = null;
      if (provider) {
        try {
          r = await cachedSearch(g.keyword);
          if (!fetchedAt || r.fetchedAt < fetchedAt) fetchedAt = r.fetchedAt;
        } catch {
          r = null;
        }
      }
      return {
        id: g.id,
        // 검색 1위(가장 관련 있는 상품)를 대표로 보여준다
        offer: r?.offers[0] ?? null,
        moreUrl: r?.moreUrl ?? coupangSearchUrl(g.keyword),
        alternatives: Math.max(0, (r?.offers.length ?? 0) - 1),
      };
    }),
  );
  const body: GearResponse = { provider: items.some((i) => i.offer) ? provider : null, fetchedAt, items };
  return NextResponse.json(body, {
    headers: { "cache-control": provider ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=600" },
  });
}
