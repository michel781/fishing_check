import { NextResponse } from "next/server";
import { SPOT_TYPE_LABEL } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { isPartialRanking, rankSpotsCached } from "@/lib/forecast";
import { ctxFrom } from "@/lib/sim/mode";
import type { Sea } from "@/lib/types";

export const dynamic = "force-dynamic";
// 첫 요청(캐시 없음)에 여러 포인트의 외부 예보를 모으므로 여유 있게
export const maxDuration = 30;

/**
 * 해역 전체 포인트 랭킹: /api/ranking?sea=WEST&dates=2026-10-03,2026-10-04&limit=5
 * dates 를 비우면 오늘. 날짜별로 상위 포인트와 위험 포인트 수를 준다.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ctx = ctxFrom({
    sim: u.searchParams.get("sim") ?? undefined,
    simDate: u.searchParams.get("simDate") ?? undefined,
    simHour: u.searchParams.get("simHour") ?? undefined,
  });
  const seaQ = u.searchParams.get("sea");
  const sea: Sea | undefined = seaQ === "WEST" || seaQ === "EAST" || seaQ === "SOUTH" ? seaQ : undefined;
  const all = u.searchParams.get("all") === "1";
  const limit = Math.min(all ? 60 : 10, Math.max(1, Number(u.searchParams.get("limit") ?? 5) || 5));
  const today = kstDateString(ctx.now);
  const dates = (u.searchParams.get("dates") ?? today).split(",").filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 3);
  let partial = false;
  const out = await Promise.all(
    dates.map(async (date) => {
      const ranked = await rankSpotsCached(ctx, date, sea);
      if (isPartialRanking(ranked)) partial = true;
      return {
        date,
        danger: ranked.filter((r) => r.day.verdict === "DANGER").length,
        total: ranked.length,
        top: ranked.filter((r) => all || r.day.verdict !== "DANGER").slice(0, limit).map((r) => ({
          id: r.spot.id,
          name: r.spot.name,
          area: r.spot.area,
          sea: r.spot.sea,
          type: SPOT_TYPE_LABEL[r.spot.type],
          species: { id: r.species.id, name: r.species.name },
          score: r.score,
          verdict: r.day.verdict,
          mulddae: r.day.mulddae,
          golden: r.day.nextGolden ?? (r.day.remainingBest == null ? r.day.golden[0] ?? null : null),
        })),
      };
    }),
  );
  return NextResponse.json(
    { today, sea: sea ?? "ALL", days: out },
    { headers: { "cache-control": ctx.sim ? "no-store" : partial ? "public, s-maxage=20" : "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
