import { NextResponse } from "next/server";
import { SPOT_TYPE_LABEL } from "@/data/spots";
import { getSpotOverview } from "@/lib/forecast";

export const dynamic = "force-dynamic";

/** 여러 포인트의 날짜별 최고 어종·점수 요약 (홈 카드용) */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 12);
  const items = await Promise.all(
    ids.map(async (id) => {
      const o = await getSpotOverview(id, 7);
      if (!o) return null;
      return {
        id: o.spot.id,
        name: o.spot.name,
        area: o.spot.area,
        sea: o.spot.sea,
        type: SPOT_TYPE_LABEL[o.spot.type],
        sources: o.sources,
        days: o.byDay.map((d) => ({
          date: d.date,
          species: { id: d.top.species.id, name: d.top.species.name },
          best: d.top.day.best,
          verdict: d.top.day.verdict,
          mulddae: d.top.day.mulddae,
          golden: d.top.day.golden[0] ?? null,
        })),
      };
    }),
  );
  return NextResponse.json(
    { items: items.filter(Boolean) },
    { headers: { "cache-control": "public, s-maxage=900, stale-while-revalidate=1800" } },
  );
}
