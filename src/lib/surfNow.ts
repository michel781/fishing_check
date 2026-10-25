import { angleDiff } from "@/lib/engine/score";
import type { Pick } from "@/lib/pelagicAgent";
import type { ForecastResult, HourScore, Spot, SpotType } from "@/lib/types";

/**
 * 한 번에 찾기: "지금(앞으로 24시간) 회유어 서프루어를 어디서 할까" (규칙 기반, 순수 함수).
 * 서프루어 = 연안에서 메탈지그·미노우를 멀리 던지는 루어 낚시. 해변·방파제 끝·외항·갯바위를 본다(내항은 조류가 막혀 뺀다).
 * 회유어 에이전트 후보(Pick)에 그 시간대의 파도·바람 방향·냉수대를 더해 '지금 점수'를 매긴다:
 *   지금 점수 = 에이전트 점수 − 파도·바람 주의 8 − 앞바람(5m/s 이상) 5 − 냉수대 15   (감점 폭은 추론)
 * 위험(DANGER) 시간은 에이전트 후보에서 이미 빠져 있다.
 */

export const SURF_TYPES: SpotType[] = ["SURF", "BREAKWATER_TIP", "OUTER_HARBOR", "ROCK"];
export const NOW_HORIZON_MS = 24 * 3600e3;
const HOUR = 3600e3;

export type WindSide = "앞바람" | "뒷바람" | "옆바람";

export interface SurfCheck {
  level: "ok" | "caution";
  /** 시간대 안 최댓값 */
  waveM: number | null;
  periodS: number | null;
  windMs: number | null;
  /** 가장 센 바람의 방향 — 포인트가 바다를 보는 방향 기준 */
  wind: WindSide | null;
  coldWater: boolean;
  notes: string[];
}

export interface NowPick extends Pick {
  surf: SurfCheck;
  nowScore: number;
  /** 시작까지 남은 분(진행 중이면 0) */
  startsInMin: number;
  ongoing: boolean;
}

// 엔진 수온 급변 쇼크 문구: "물 온도 뚝 떨어짐 …(냉수대)" · "물 온도 떨어짐 …" (72시간 최고보다 2℃ 이상 낮음)
const COLD = /^물 온도 (뚝 )?떨어짐/;

/** 에이전트 후보와 같은 기준으로 그 시간대의 낚시 가능 시간을 고른다 */
export function windowHours(result: ForecastResult, p: Pick, now: Date): HourScore[] {
  const s = Math.max(Date.parse(p.start), now.getTime());
  const e = Date.parse(p.end);
  return result.hours.filter((h) => h.available && Date.parse(h.time) + HOUR > s && Date.parse(h.time) < e);
}

export function surfCheck(spot: Spot, hours: HourScore[]): SurfCheck {
  const max = (f: (h: HourScore) => number | null) => {
    const v = hours.map(f).filter((x): x is number => x != null);
    return v.length ? Math.max(...v) : null;
  };
  const waveM = max((h) => h.cond.waveM);
  const periodS = max((h) => h.cond.wavePeriodS);
  const windMs = max((h) => h.cond.windMs);
  const strong = hours.length ? hours.reduce((a, b) => ((b.cond.windMs ?? 0) > (a.cond.windMs ?? 0) ? b : a)) : null;
  const dir = strong?.cond.windDir;
  const diff = dir == null ? null : angleDiff(dir, spot.facingDeg);
  const wind: WindSide | null = diff == null ? null : diff < 60 ? "앞바람" : diff > 120 ? "뒷바람" : "옆바람";
  const coldWater = hours.some((h) => h.reasons.some((r) => COLD.test(r.label)));
  const notes = [...new Set(hours.filter((h) => h.safety === "CAUTION").flatMap((h) => h.safetyReasons))];
  const w = windMs ?? 0;
  if (wind === "앞바람" && w >= 5) notes.push(`앞바람 ${w.toFixed(0)}m/s — 비거리가 줄고 루어가 밀려와요(추론)`);
  else if (wind === "뒷바람" && w >= 3) notes.push(`뒷바람 ${w.toFixed(0)}m/s — 멀리 던지기 유리해요(추론)`);
  if (coldWater) notes.push("수온이 최근 3일 최고보다 2℃ 이상 낮아요 — 냉수대면 회유어가 연안에서 빠지기 쉬워요");
  return { level: hours.some((h) => h.safety === "CAUTION") ? "caution" : "ok", waveM, periodS, windMs, wind, coldWater, notes };
}

export function nowScore(p: Pick, s: SurfCheck): number {
  let v = p.agentScore;
  if (s.level === "caution") v -= 8;
  if (s.wind === "앞바람" && (s.windMs ?? 0) >= 5) v -= 5;
  if (s.coldWater) v -= 15;
  return Math.max(0, Math.round(v));
}

export function toNowPick(p: Pick, surf: SurfCheck, now: Date): NowPick {
  const start = Date.parse(p.start);
  return { ...p, surf, nowScore: nowScore(p, surf), startsInMin: Math.max(0, Math.round((start - now.getTime()) / 60000)), ongoing: start <= now.getTime() };
}

/** 지금 점수 → 더 빨리 시작 순. 포인트마다 가장 좋은 시간대 하나만 */
export function rankNow(all: NowPick[], limit = 4): NowPick[] {
  const sorted = [...all].sort((a, b) => b.nowScore - a.nowScore || a.startsInMin - b.startsInMin);
  const seen = new Set<string>();
  const out: NowPick[] = [];
  for (const p of sorted) {
    if (seen.has(p.spotId)) continue;
    seen.add(p.spotId);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/** 유튜브 영상 페이지에서 '지금 방송 중' 여부를 읽는다 (없으면 null = 확인 못 함) */
export function parseLiveNow(html: string): boolean | null {
  const m = html.match(/"isLiveNow":(true|false)/);
  return m ? m[1] === "true" : null;
}
