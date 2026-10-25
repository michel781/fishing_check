import { NextResponse } from "next/server";
import { runSurfNow } from "@/lib/surfNowRun";
import { ctxFrom } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 한 번에 찾기(JSON): /api/agent/now — 속초·양양·강릉 앞으로 24시간 회유어 서프루어 후보 + 지역별 지금 바다 + 유튜브 고정 캠 방송 상태.
 * 실시간 성격이라 짧게만 캐시한다.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const ctx = ctxFrom({ sim: u.searchParams.get("sim") ?? undefined, simDate: u.searchParams.get("simDate") ?? undefined, simHour: u.searchParams.get("simHour") ?? undefined });
  const run = await runSurfNow(ctx);
  return NextResponse.json(run, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
}
