import { distanceKm, SPOTS } from "@/data/spots";
import { bestWindow } from "@/lib/live";
import type { DaySummary, HourScore, Spot, TideExtreme } from "@/lib/types";

/**
 * 오늘 밤 밤낚시 추천 (실시간 예보 기준).
 * - 밤 시간: 오늘 해 질 녘(또는 지금이 더 늦으면 지금) ~ 내일 새벽 3시
 * - 포인트마다 어종별 시간 점수에서 "밤 시간 중 가장 좋은 연속 2시간"을 찾고, 가장 좋은 어종으로 대표
 * - 서해 밤낚시 핵심인 들물(간조 → 만조) 시간을 함께 보여준다
 * - 위험(강풍·높은 파도·간조 고립 등) 시간이 밤의 절반을 넘으면 '위험'
 */

export const SEOUL = { lat: 37.5665, lon: 126.978, label: "서울시청" };
export const NIGHT_RADIUS_KM = 120;
const HOUR = 3600e3;

export type NightStyle = "all" | "cast" | "lure" | "family";
export const STYLE_LABEL: Record<NightStyle, string> = { all: "전체", cast: "원투(던져 두기)", lure: "루어·찌", family: "가족·캠낚" };
/** 낚시 방식별로 노릴 어종 (없으면 전체) */
const STYLE_SPECIES: Partial<Record<NightStyle, string[]>> = {
  cast: ["conger", "goby", "rockfish", "flatfish", "greenling", "dodari"],
  lure: ["rockfish", "flatfish", "seabass", "greenling", "webfoot", "cuttlefish", "halfbeak", "hairtail"],
};

/** 한국시각 기준 다음 날 새벽 3시 */
export function nightEnd(date: string): number {
  return Date.parse(`${date}T03:00:00+09:00`) + 24 * HOUR;
}

/** 밤 시간 창: 해 질 녘(이미 지났으면 지금) ~ 다음 날 03시. 이미 끝났으면 null */
export function nightWindow(day: Pick<DaySummary, "date" | "sunset">, nowMs: number): { from: number; to: number } | null {
  const from = Math.max(Date.parse(day.sunset), nowMs);
  const to = nightEnd(day.date);
  return from < to - HOUR ? { from, to } : null;
}

/** 밤 시간 안의 들물 구간 (간조 → 다음 만조) */
export function floodWindows(extremes: TideExtreme[], from: number, to: number): { start: string; end: string }[] {
  const ex = [...extremes].sort((a, b) => a.time.localeCompare(b.time));
  const out: { start: string; end: string }[] = [];
  for (let i = 0; i < ex.length - 1; i++) {
    if (ex[i].type !== "LOW" || ex[i + 1].type !== "HIGH") continue;
    const s = Math.max(Date.parse(ex[i].time), from);
    const e = Math.min(Date.parse(ex[i + 1].time), to);
    if (e - s >= HOUR / 2) out.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
  }
  return out;
}

/** 체감온도 (기상청 겨울 체감온도식, 10℃ 이하·풍속 1.3m/s 이상에서만) */
export function windChill(tC: number | null, windMs: number | null): number | null {
  if (tC == null) return null;
  const v = (windMs ?? 0) * 3.6;
  if (tC > 10 || v < 4.8) return Math.round(tC);
  const p = Math.pow(v, 0.16);
  return Math.round(13.12 + 0.6215 * tC - 11.37 * p + 0.3965 * tC * p);
}

export interface NightWeather {
  windMax: number | null;
  waveMax: number | null;
  rainMm: number;
  feelsMin: number | null;
  airMin: number | null;
}

export function nightWeather(hours: HourScore[], from: number, to: number): NightWeather {
  const hs = hours.filter((h) => Date.parse(h.time) + HOUR > from && Date.parse(h.time) < to);
  const max = (xs: (number | null)[]) => (xs.some((x) => x != null) ? Math.max(...xs.filter((x): x is number => x != null)) : null);
  const min = (xs: (number | null)[]) => (xs.some((x) => x != null) ? Math.min(...xs.filter((x): x is number => x != null)) : null);
  return {
    windMax: max(hs.map((h) => h.cond.windMs)),
    waveMax: max(hs.map((h) => h.cond.waveM)),
    rainMm: Math.round(hs.reduce((a, h) => a + (h.cond.precipMm ?? 0), 0) * 10) / 10,
    feelsMin: min(hs.map((h) => windChill(h.cond.airTempC, h.cond.windMs))),
    airMin: min(hs.map((h) => h.cond.airTempC)),
  };
}

export type NightVerdict = "GOOD" | "OK" | "POOR" | "DANGER";
export const VERDICT_LABEL: Record<NightVerdict, string> = { GOOD: "오늘 밤 추천", OK: "무난", POOR: "아쉬움", DANGER: "위험 · 가지 마세요" };

export interface SpeciesNight {
  speciesId: string;
  speciesName: string;
  hours: HourScore[];
}

export interface NightPick {
  spot: Spot;
  km: number;
  speciesId: string;
  speciesName: string;
  /** 정렬용 점수 (방식 보정 포함) */
  rank: number;
  /** 밤 시간 중 가장 좋은 2시간 평균 점수 */
  score: number;
  best: { start: string; end: string } | null;
  verdict: NightVerdict;
  dangerShare: number;
  flood: { start: string; end: string }[];
  weather: NightWeather;
  /** 방식에 맞춰 붙이는 이유·주의 */
  pros: string[];
  cons: string[];
}

/** 포인트 하나의 오늘 밤 평가 */
export function evaluateNight(
  spot: Spot,
  km: number,
  species: SpeciesNight[],
  extremes: TideExtreme[],
  win: { from: number; to: number },
  style: NightStyle,
): NightPick | null {
  const allow = STYLE_SPECIES[style];
  const cands = species.filter((s) => !allow || allow.includes(s.speciesId));
  if (!cands.length) return null;
  let top: { s: SpeciesNight; w: ReturnType<typeof bestWindow> } | null = null;
  for (const s of cands) {
    const w = bestWindow(s.hours, win.from, win.to, 2);
    if (w && (!top || !top.w || w.avg > top.w.avg)) top = { s, w };
    else if (!top) top = { s, w };
  }
  if (!top) return null;
  const inWin = top.s.hours.filter((h) => Date.parse(h.time) + HOUR > win.from && Date.parse(h.time) < win.to);
  const dangerShare = inWin.length ? inWin.filter((h) => h.safety === "DANGER").length / inWin.length : 0;
  const score = top.w?.avg ?? 0;
  const verdict: NightVerdict = dangerShare > 0.5 ? "DANGER" : score >= 65 ? "GOOD" : score >= 50 ? "OK" : "POOR";
  const weather = nightWeather(top.s.hours, win.from, win.to);
  const flood = floodWindows(extremes, win.from, win.to);

  const pros: string[] = [];
  const cons: string[] = [];
  if (spot.toilet) pros.push("화장실");
  if (spot.parking) pros.push("주차");
  if (spot.type === "INNER_HARBOR") pros.push("발판 편함");
  if (flood.length) pros.push("밤에 들물");
  if (spot.tetrapod) cons.push("테트라포드 추락 주의");
  if ((weather.windMax ?? 0) >= 8) cons.push(`바람 강함 ${weather.windMax}m/s`);
  if (weather.rainMm >= 1) cons.push(`비 ${weather.rainMm}mm`);
  if (weather.feelsMin != null && weather.feelsMin <= 5) cons.push(`체감 ${weather.feelsMin}℃ 방한 필수`);

  // 방식별 보정: 가족은 편한 자리, 원투는 들물, 거리가 가까울수록 조금 더
  let rank = score;
  if (style === "family") rank += (spot.toilet ? 6 : -6) + (spot.tetrapod ? -10 : 4) + (spot.type === "INNER_HARBOR" ? 6 : 0);
  if (style === "cast" && flood.length) rank += 4;
  rank += Math.max(0, 6 - km / 20);
  if (verdict === "DANGER") rank -= 100;

  return {
    spot,
    km: Math.round(km),
    speciesId: top.s.speciesId,
    speciesName: top.s.speciesName,
    rank: Math.round(rank),
    score,
    best: top.w ? { start: top.w.start, end: top.w.end } : null,
    verdict,
    dangerShare,
    flood,
    weather,
    pros,
    cons,
  };
}

/** 기준점(서울 또는 내 위치)에서 가까운 밤낚시 가능 포인트 (선상 제외) */
export function nightCandidates(base: { lat: number; lon: number }, radiusKm = NIGHT_RADIUS_KM): { spot: Spot; km: number }[] {
  return SPOTS.filter((s) => s.nightOk && s.type !== "BOAT")
    .map((spot) => ({ spot, km: distanceKm(base.lat, base.lon, spot.lat, spot.lon) }))
    .filter((x) => x.km <= radiusKm)
    .sort((a, b) => a.km - b.km);
}

/** 오늘 밤 날씨로 본 유료 낚시터 쾌적도 */
export function parkComfort(w: NightWeather): { level: "좋음" | "보통" | "궂음"; note: string } {
  if (w.rainMm >= 5 || (w.windMax ?? 0) >= 12) return { level: "궂음", note: "비·강풍 예보 — 좌대 운영이 바뀔 수 있으니 전화로 꼭 확인" };
  if (w.rainMm >= 1 || (w.windMax ?? 0) >= 8 || (w.feelsMin ?? 99) <= 3) return { level: "보통", note: "방갈로 안에서 바람·추위를 피하면 괜찮아요" };
  return { level: "좋음", note: "밤바람이 잔잔한 편이에요" };
}
