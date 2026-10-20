import { SPOTS } from "@/data/spots";
import { getForecast, type Ctx } from "@/lib/forecast";
import { isPelagic, isPilotWalkSpot, picksFor, PILOT_LABEL, rankPicks, type Pick } from "@/lib/pelagicAgent";

export interface AgentRun {
  region: string;
  generatedAt: string;
  rule: string;
  formula: string;
  spots: { id: string; name: string; area: string; pelagic: string[] }[];
  considered: number;
  picks: Pick[];
  partial: boolean;
}

/** 시범 지역(속초·양양·강릉) 워킹 포인트의 회유어 후보를 계산한다 — /agent 화면, /api/agent/pelagic, Claude Code 스킬이 같이 쓴다 */
export async function runPelagicAgent(ctx: Ctx, days = 3, limit = 5, speciesId?: string): Promise<AgentRun> {
  const spots = SPOTS.filter(isPilotWalkSpot);
  const fcs = await Promise.all(spots.map((s) => getForecast(s.id, undefined, ctx).catch((e) => {
      console.error("[agent] forecast failed", s.id, e instanceof Error ? e.message : e);
      return null;
    })));
  const all = fcs.flatMap((f) =>
    f ? f.all.filter((a) => isPelagic(a.species.id) && (!speciesId || a.species.id === speciesId)).flatMap((a) => picksFor(f.spot, a.species, a.result, ctx.now, days)) : [],
  );
  return {
    region: PILOT_LABEL,
    generatedAt: ctx.now.toISOString(),
    rule: "들물 + 새벽 동틀 무렵(오전 피딩) + 외해 조류가 잘 통하는 방파제·갯바위 + 적정 수온",
    formula: "에이전트 점수 = 앱 점수(그 시간대 최고) × 0.6 + 조건 일치(오전 피딩 30% · 들물 30% · 외해 소통 25% · 수온 15%) × 40",
    spots: spots.map((s) => ({ id: s.id, name: s.name, area: s.area, pelagic: s.species.filter(isPelagic) })),
    considered: all.length,
    picks: rankPicks(all, limit),
    partial: fcs.some((f) => f?.partial),
  };
}
