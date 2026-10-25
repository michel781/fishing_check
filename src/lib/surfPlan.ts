import { pelagicPhases, phaseTide } from "@/data/boil";
import { kstDateString, mulddae, sunTimes, type MulddaeSystem } from "@/lib/engine/astro";
import { estimateTide, findExtremes } from "@/lib/engine/tide";
import { tideTable, type TideStage } from "@/lib/tideTable";
import type { Spot } from "@/lib/types";

/**
 * 2주 미리 보기 — 천문 계산(해 뜨는 시각·물때)만으로 날마다 '오전 피딩(해 뜨기 30분 전~뜬 뒤 2시간) + 들물'이 겹치는지 본다.
 * 해·달 위치로 계산해서 1~2주 전에도 미리 알 수 있다. 물 높이는 천문 추정 모델이라 실제 물때표와 수십 분~1시간 차이 날 수 있다.
 * 파도·바람(7일 전부터)·수온·냉수대(1~3일 전)·현장 영상(당일)은 여기서 보지 않는다.
 */

export interface PlanCell {
  /** best = 중·끝들물이 겹침 · some = 초들물 등 들물이 조금 겹침 · none = 들물 아님 */
  flood: "best" | "some" | "none";
  stages: TideStage[];
  /** 피딩 구간 안에서 들물 후반이 시작되는 시각(ISO) */
  from: string | null;
}

export interface PlanDay {
  date: string;
  mul: string;
  amStart: string;
  amEnd: string;
  cells: PlanCell[];
}

const DAY = 86400e3;

export function dawnFloodPlan(spots: Spot[], now: Date, days = 14, system: MulddaeSystem = 8): PlanDay[] {
  const d0 = Date.parse(`${kstDateString(now)}T00:00:00+09:00`);
  const tides = spots.map((s) => {
    const series = estimateTide(s.station, s.lon, d0 - DAY, d0 + (days + 1) * DAY);
    return { series, extremes: findExtremes(series) };
  });
  const out: PlanDay[] = [];
  for (let i = 0; i < days; i++) {
    const dayStart = d0 + i * DAY;
    const noon = new Date(dayStart + 12 * 3600e3);
    const cells = spots.map((s, k): PlanCell & { am: { start: number; end: number } } => {
      const sun = sunTimes(noon, s.lat, s.lon);
      const am = pelagicPhases(sun.sunrise.toISOString(), sun.sunset.toISOString())[0];
      const rows = tideTable(tides[k].series, tides[k].extremes, dayStart);
      const t = phaseTide(rows, am.start, am.end);
      const flood = t.stages.some((x) => x.includes("들물"));
      return { flood: t.fit === 2 ? "best" : flood ? "some" : "none", stages: t.stages, from: t.fit === 2 && t.best[0] ? new Date(Math.max(Date.parse(t.best[0]), am.start)).toISOString() : null, am };
    });
    const am = cells[0].am;
    out.push({
      date: kstDateString(noon),
      mul: mulddae(noon, system).label,
      amStart: new Date(am.start).toISOString(),
      amEnd: new Date(am.end).toISOString(),
      cells: cells.map(({ am: _am, ...c }) => c),
    });
  }
  return out;
}
