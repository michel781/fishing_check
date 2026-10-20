import { NextResponse } from "next/server";
import { isPelagic } from "@/lib/pelagicAgent";
import { runPelagicAgent } from "@/lib/pelagicAgentRun";
import { ctxFrom } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 회유어 찾기 에이전트 결과(JSON): /api/agent/pelagic?days=3&limit=5&species=spanishmackerel (species 생략 = 전체)
 * 속초·양양·강릉 워킹 포인트 × 날짜 × 시간대 후보를 규칙으로 순위 매긴다. Claude Code 스킬이 이 응답을 읽어 설명한다.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const days = Math.min(5, Math.max(1, Number(u.searchParams.get("days") ?? 3) || 3));
  const limit = Math.min(10, Math.max(1, Number(u.searchParams.get("limit") ?? 5) || 5));
  const ctx = ctxFrom({ sim: u.searchParams.get("sim") ?? undefined, simDate: u.searchParams.get("simDate") ?? undefined, simHour: u.searchParams.get("simHour") ?? undefined });
  const sp = u.searchParams.get("species") ?? undefined;
  const run = await runPelagicAgent(ctx, days, limit, sp && isPelagic(sp) ? sp : undefined);
  return NextResponse.json(run, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } });
}
