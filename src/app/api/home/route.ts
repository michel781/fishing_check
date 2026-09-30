import { NextResponse } from "next/server";
import { getSpot, distanceKm, SPOT_TYPE_LABEL } from "@/data/spots";
import { weekendDates } from "@/lib/dates";
import { kstDateString } from "@/lib/engine/astro";
import { getForecast, rankSpotsCached, type RankedSpot } from "@/lib/forecast";
import { liveStatus } from "@/lib/live";
import { ctxFrom } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const golden = (r: RankedSpot) => r.day.nextGolden ?? (r.day.remainingBest == null ? r.day.golden[0] ?? null : null);
const lite = (r: RankedSpot, km?: number | null) => ({
  id: r.spot.id,
  name: r.spot.name,
  area: r.spot.area,
  sea: r.spot.sea,
  type: r.spot.type,
  typeLabel: SPOT_TYPE_LABEL[r.spot.type],
  species: { id: r.species.id, name: r.species.name },
  speciesAll: r.spot.species,
  score: r.score,
  verdict: r.day.verdict,
  golden: golden(r),
  km: km ?? null,
});

/** 홈 화면 데이터: 지금 추천 포인트(+현재 해황), 많이 가는 포인트, 오늘의 추천, 주말 요약 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ctx = ctxFrom({
    sim: u.searchParams.get("sim") ?? undefined,
    simDate: u.searchParams.get("simDate") ?? undefined,
    simHour: u.searchParams.get("simHour") ?? undefined,
  });
  const lat = Number(u.searchParams.get("lat"));
  const lon = Number(u.searchParams.get("lon"));
  const hasLoc = Number.isFinite(lat) && Number.isFinite(lon) && u.searchParams.has("lat");
  const favs = (u.searchParams.get("favs") ?? "").split(",").filter((id) => getSpot(id)).slice(0, 8);
  const today = kstDateString(ctx.now);
  const weekend = weekendDates(today);

  const ranked = await rankSpotsCached(ctx, today);
  const kmOf = (r: RankedSpot) => (hasLoc ? distanceKm(lat, lon, r.spot.lat, r.spot.lon) : null);
  const safe = ranked.filter((r) => r.day.verdict !== "DANGER");
  // 위치가 있으면 80km 안에서 가장 좋은 곳, 없으면 전체 1위
  const near = hasLoc ? safe.filter((r) => (kmOf(r) ?? 0) <= 80) : [];
  const heroR = near[0] ?? safe[0] ?? ranked[0];

  let conditions = null;
  if (heroR) {
    const f = await getForecast(heroR.spot.id, heroR.species.id, ctx);
    const live = f ? liveStatus(f.result, ctx.now) : null;
    if (live) {
      const t = live.hour.cond.seaTempC;
      const sp = heroR.species;
      const w = live.hour.cond.waveM;
      conditions = {
        nextExtreme: live.nextExtreme,
        windMs: live.hour.cond.windMs,
        windDir: live.hour.cond.windDir,
        waveM: w,
        waveLabel: w == null ? "-" : w < 0.5 ? "낮음" : w < 1 ? "보통" : "높음",
        seaTempC: t,
        tempLabel: t == null ? "-" : t < sp.temp.min ? "낮음" : t > sp.temp.max ? "높음" : "적정",
        airTempC: live.hour.cond.airTempC,
        current: live.current,
      };
    }
  }

  const popularSrc = favs.length ? favs.map((id) => ranked.find((r) => r.spot.id === id)).filter((x): x is RankedSpot => !!x) : safe.filter((r) => r !== heroR).slice(0, 6);
  const weekendRanks = await Promise.all(
    weekend.map(async (d) => {
      const rs = d === today ? ranked : await rankSpotsCached(ctx, d);
      return { date: d, danger: rs.filter((r) => r.day.verdict === "DANGER").length, total: rs.length, top: rs.filter((r) => r.day.verdict !== "DANGER").slice(0, 3).map((r) => lite(r)) };
    }),
  );

  return NextResponse.json(
    {
      today,
      weekend: weekendRanks,
      hero: heroR ? { ...lite(heroR, kmOf(heroR)), danger: heroR.day.verdict === "DANGER" } : null,
      conditions,
      popular: { mine: favs.length > 0, items: popularSrc.map((r) => lite(r, kmOf(r))) },
      recommended: safe.slice(0, 5).map((r) => lite(r, kmOf(r))),
      dangerToday: ranked.length - safe.length,
      total: ranked.length,
    },
    // 위치는 화면에서 약 1km 단위로 줄여 보내므로 주소별로 CDN 캐시해도 된다
    { headers: { "cache-control": ctx.sim ? "no-store" : "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
