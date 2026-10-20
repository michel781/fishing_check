import { BOIL_SPECIES, PHASE_INFO, pelagicPhases, phaseTide, type PhaseId } from "@/data/boil";
import { kstDateString } from "@/lib/engine/astro";
import { tideTable } from "@/lib/tideTable";
import type { ForecastResult, Species, Spot, SpotType } from "@/lib/types";

/**
 * 회유어 찾기 에이전트 (규칙 기반, 순수 함수).
 * 목표 조합: "들물 + 새벽 동틀 무렵(오전 피딩) + 외해 조류가 잘 통하는 방파제·갯바위".
 * 포인트 × 날짜 × 시간대(오전 피딩·낮·오후 피딩)마다
 *   - 앱 점수(바람·파도·수온·빛·물때·장소·제철·안전을 이미 합친 값)의 그 시간대 최고점
 *   - 조건 일치 4가지(오전 피딩 · 들물 겹침 · 외해 소통 포인트 · 적정 수온)
 * 를 합쳐 순위를 매긴다:  에이전트 점수 = 앱 점수 × 0.6 + 조건 일치 × 40.
 * 위험(DANGER)·금어기·출항 시간 밖처럼 앱이 '낚시 불가'로 본 시간은 빼고, 지난 시간대도 뺀다.
 * Claude Code 스킬(.claude/skills/pelagic-agent)과 /agent 화면이 같은 결과를 쓴다.
 */

export const PILOT_AREAS = ["속초", "양양", "강릉"] as const;
export const PILOT_LABEL = "속초·양양·강릉";
/** 워킹(연안) 포인트만 — 선상 제외 */
export const WALK_TYPES: SpotType[] = ["BREAKWATER_TIP", "ROCK", "OUTER_HARBOR", "SURF", "INNER_HARBOR"];
/** 외해 조류가 통하는 정도 (방파제 끝·갯바위가 가장 열려 있고 내항이 가장 막혀 있음) */
export const OPEN_SEA: Record<SpotType, number> = { BREAKWATER_TIP: 1, ROCK: 1, OUTER_HARBOR: 0.8, SURF: 0.4, INNER_HARBOR: 0.2, BOAT: 0, TIDAL_FLAT: 0 };

export const isPilotWalkSpot = (s: Spot) => (PILOT_AREAS as readonly string[]).includes(s.area) && WALK_TYPES.includes(s.type);
export const isPelagic = (id: string) => (BOIL_SPECIES as readonly string[]).includes(id);

export type CheckKey = "dawn" | "flood" | "open" | "temp";
export interface Check {
  key: CheckKey;
  label: string;
  ok: boolean;
  /** 0~1 — 부분 일치 */
  part: number;
  detail: string;
}

export interface Pick {
  spotId: string;
  spotName: string;
  area: string;
  spotType: SpotType;
  speciesId: string;
  speciesName: string;
  date: string;
  phase: PhaseId;
  phaseLabel: string;
  start: string;
  end: string;
  /** 그 시간대 앱 점수 최고점과 그 시각 */
  appScore: number;
  bestHour: string;
  checks: Check[];
  matched: number;
  agentScore: number;
  warnings: string[];
}

const WEIGHT: Record<CheckKey, number> = { dawn: 0.3, flood: 0.3, open: 0.25, temp: 0.15 };
const HOUR = 3600e3;
const hm = (ms: number) => new Date(ms + 9 * HOUR).toISOString().slice(11, 16);

/** 한 포인트·한 어종의 예보로 시간대별 후보를 만든다 */
export function picksFor(spot: Spot, species: Species, result: ForecastResult, now: Date, days = 3): Pick[] {
  const today = kstDateString(now);
  const extremes = result.days.flatMap((d) => d.extremes);
  const out: Pick[] = [];
  for (const day of result.days.filter((d) => d.date >= today).slice(0, days)) {
    const dayStart = Date.parse(`${day.date}T00:00:00+09:00`);
    const rows = tideTable(result.tideSeries, extremes, dayStart);
    const smallRange = day.tideRangeCm != null && day.tideRangeCm < 60;
    for (const ph of pelagicPhases(day.sunrise, day.sunset)) {
      if (ph.end <= now.getTime()) continue;
      const inWin = result.hours.filter((h) => Date.parse(h.time) + HOUR > Math.max(ph.start, now.getTime()) && Date.parse(h.time) < ph.end);
      const ok = inWin.filter((h) => h.available);
      if (!ok.length) continue;
      const best = ok.reduce((a, b) => (b.score > a.score ? b : a));
      const tide = phaseTide(rows, ph.start, ph.end);
      const flood = tide.stages.filter((s) => s.includes("들물"));
      const t = best.cond.seaTempC;
      const open = OPEN_SEA[spot.type];
      const checks: Check[] = [
        {
          key: "dawn",
          label: "새벽 동틀 무렵(오전 피딩)",
          ok: ph.id === "am",
          part: ph.id === "am" ? 1 : ph.id === "pm" ? 0.5 : 0,
          detail: ph.id === "am" ? `${hm(ph.start)}~${hm(ph.end)}` : ph.id === "pm" ? "오후 피딩 — 차선" : "낮 — 깊은 곳·외해 쪽",
        },
        {
          key: "flood",
          label: "들물",
          ok: flood.length > 0,
          part: (tide.fit === 2 ? 1 : flood.length ? 0.6 : 0) * (smallRange ? 0.4 : 1),
          detail: flood.length
            ? `${tide.stages.join("→")}${tide.fit === 2 && tide.best.length ? ` · ${hm(Date.parse(tide.best[0]))}부터 들물 후반` : ""}`
            : `${tide.stages.join("→") || "물때 정보 없음"} — 들물 아님`,
        },
        {
          key: "open",
          label: "외해 조류가 통하는 포인트",
          ok: open >= 0.8,
          part: open,
          detail: open >= 0.8 ? "방파제 끝·외항·갯바위" : open >= 0.4 ? "해변 — 조류보다 파도" : "내항 — 조류가 막힘",
        },
        {
          key: "temp",
          label: "적정 수온",
          ok: t != null && t >= species.temp.min && t <= species.temp.max,
          part: t == null ? 0.5 : t >= species.temp.min && t <= species.temp.max ? 1 : 0,
          detail: t == null ? "수온 정보 없음" : `${t.toFixed(1)}℃ (${species.name} ${species.temp.min}~${species.temp.max}℃)`,
        },
      ];
      const fit = checks.reduce((a, c) => a + WEIGHT[c.key] * c.part, 0);
      const warnings: string[] = [];
      if (inWin.some((h) => h.safety === "DANGER")) warnings.push("이 시간대 일부가 위험(바람·파도)으로 막혀요");
      else if (inWin.some((h) => h.safety === "CAUTION")) warnings.push("바람·파도 주의 — 방파제 끝·갯바위는 조심");
      if (smallRange) warnings.push(`물 높이 차이 ${day.tideRangeCm}cm — 동해라 들물 효과가 작아요`);
      if (spot.approx) warnings.push("좌표가 항구 부근 대략값이에요");
      out.push({
        spotId: spot.id,
        spotName: spot.name,
        area: spot.area,
        spotType: spot.type,
        speciesId: species.id,
        speciesName: species.name,
        date: day.date,
        phase: ph.id,
        phaseLabel: PHASE_INFO[ph.id].label,
        start: new Date(ph.start).toISOString(),
        end: new Date(ph.end).toISOString(),
        appScore: best.score,
        bestHour: best.time,
        checks,
        matched: checks.filter((c) => c.ok).length,
        agentScore: Math.round(best.score * 0.6 + fit * 40),
        warnings,
      });
    }
  }
  return out;
}

/** 후보 정렬: 에이전트 점수 → 앱 점수. 같은 포인트·날짜·시간대는 가장 좋은 어종 하나만 */
export function rankPicks(all: Pick[], limit = 5): Pick[] {
  const sorted = [...all].sort((a, b) => b.agentScore - a.agentScore || b.appScore - a.appScore);
  const seen = new Set<string>();
  const out: Pick[] = [];
  for (const p of sorted) {
    const k = `${p.spotId}|${p.date}|${p.phase}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
