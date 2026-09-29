import { NextResponse } from "next/server";
import { getForecast } from "@/lib/forecast";
import { ctxFrom } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const spot = u.searchParams.get("spot");
  if (!spot) return NextResponse.json({ error: "spot 파라미터가 필요합니다" }, { status: 400 });
  const mul = u.searchParams.get("mul");
  const ctx = ctxFrom(
    { sim: u.searchParams.get("sim") ?? undefined, simDate: u.searchParams.get("simDate") ?? undefined, simHour: u.searchParams.get("simHour") ?? undefined },
    mul === "7" ? 7 : mul === "8" ? 8 : undefined,
  );
  const f = await getForecast(spot, u.searchParams.get("species") ?? undefined, ctx);
  if (!f) return NextResponse.json({ error: "알 수 없는 포인트" }, { status: 404 });
  return NextResponse.json(
    {
      spot: f.spot,
      species: { id: f.species.id, name: f.species.name },
      ranking: f.ranking.map((r) => ({ id: r.species.id, name: r.species.name, score: r.score, closed: r.closed })),
      ...f.result,
    },
    { headers: { "cache-control": ctx.sim ? "no-store" : "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
