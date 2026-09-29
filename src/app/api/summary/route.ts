import { NextResponse } from "next/server";
import { SPOT_TYPE_LABEL } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { dayScore, getSpotOverview } from "@/lib/forecast";
import { ctxFrom } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
// 첫 요청(캐시 없음)에 여러 포인트의 외부 예보를 모으므로 여유 있게
export const maxDuration = 30;

const simOf = (u: URL) => ({
  sim: u.searchParams.get("sim") ?? undefined,
  simDate: u.searchParams.get("simDate") ?? undefined,
  simHour: u.searchParams.get("simHour") ?? undefined,
});

/** 여러 포인트의 날짜별 최고 어종·점수 요약 (홈 카드용) */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ids = (u.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 12);
  const ctx = ctxFrom(simOf(u));
  const items = await Promise.all(
    ids.map(async (id) => {
      const o = await getSpotOverview(id, ctx);
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
          best: dayScore(d.top.day),
          verdict: d.top.day.verdict,
          mulddae: d.top.day.mulddae,
          golden: d.top.day.nextGolden ?? (d.top.day.remainingBest == null ? d.top.day.golden[0] ?? null : null),
        })),
      };
    }),
  );
  return NextResponse.json(
    { today: kstDateString(ctx.now), items: items.filter(Boolean) },
    { headers: { "cache-control": ctx.sim ? "no-store" : "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
