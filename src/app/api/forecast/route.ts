import { NextResponse } from "next/server";
import { getForecast } from "@/lib/forecast";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const spot = u.searchParams.get("spot");
  if (!spot) return NextResponse.json({ error: "spot 파라미터가 필요합니다" }, { status: 400 });
  const days = Math.min(7, Math.max(1, Number(u.searchParams.get("days") ?? 7) || 7));
  const mul = u.searchParams.get("mul");
  const f = await getForecast(spot, u.searchParams.get("species") ?? undefined, {
    days,
    mulddae: mul === "7" ? 7 : mul === "8" ? 8 : undefined,
  });
  if (!f) return NextResponse.json({ error: "알 수 없는 포인트" }, { status: 404 });
  return NextResponse.json(
    { spot: f.spot, species: { id: f.species.id, name: f.species.name }, ...f.result },
    { headers: { "cache-control": "public, s-maxage=900, stale-while-revalidate=1800" } },
  );
}
