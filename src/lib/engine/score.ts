import type {
  ConditionsBundle,
  DaySummary,
  ForecastResult,
  GoldenBlock,
  Grade,
  HourConditions,
  HourScore,
  Reason,
  SafetyLevel,
  Sea,
  Species,
  Spot,
  SpotType,
  SubScores,
  Weights,
} from "@/lib/types";
import {
  kstDateString,
  lunarDay,
  moonIllumination,
  moonPhaseName,
  mulddae,
  springness,
  sunTimes,
  type MulddaeSystem,
} from "./astro";
import { hoursToNearestExtreme, tideAt, tideRate } from "./tide";

export const ALGO_VERSION = "rule-v1.2";
const HOUR = 3600 * 1000;

/**
 * 점수 구조 (rule-v1.1)
 *   환경(env)  = Σ w·S  (그날의 물때, 바람, 파도, 수온, 기압, 포인트 궁합)
 *   타이밍     = τ·S_tideTime + (1-τ)·S_light  (시간대: 물 흐름·물돌이, 해뜰녘/해질녘/야간)
 *   점수       = 100 × env × (0.5 + 0.5·타이밍) × (0.35 + 0.65·시즌)  → 안전 게이트·금어기 적용
 * 해역별 가중치: 서해는 물때(조차)가, 동해는 파도(너울)·수온이 지배적이다.
 */
export const SEA_WEIGHTS: Record<Sea, Weights> = {
  WEST: { tide: 0.2, wind: 0.25, wave: 0.18, temp: 0.2, light: 0, pressure: 0.05, spot: 0.12 },
  EAST: { tide: 0.03, wind: 0.22, wave: 0.3, temp: 0.3, light: 0, pressure: 0.05, spot: 0.1 },
  // 남해: 조차는 서해보다 작지만 섬 사이 조류가 세고, 난류 영향으로 수온 비중이 크다
  SOUTH: { tide: 0.14, wind: 0.23, wave: 0.2, temp: 0.26, light: 0, pressure: 0.05, spot: 0.12 },
};

/** 타이밍 안에서 물 흐름이 차지하는 비중 τ (나머지는 광량·시간대) */
export const SEA_TIDE_TIMING: Record<Sea, number> = { WEST: 0.55, EAST: 0.15, SOUTH: 0.42 };

export function timingTideShare(spot: Spot, species: Species): number {
  const tb = species.weightBoost?.tide ?? 1;
  const lb = species.weightBoost?.light ?? 1;
  const t = SEA_TIDE_TIMING[spot.sea] * tb;
  const l = (1 - SEA_TIDE_TIMING[spot.sea]) * lb;
  return t / (t + l);
}

const EXPOSED: SpotType[] = ["OUTER_HARBOR", "BREAKWATER_TIP", "ROCK", "SURF"];

/** 포인트 유형별 파도 차폐 계수 (체감 파고 = 외해 파고 × 계수) */
const WAVE_EXPOSURE: Record<SpotType, number> = {
  INNER_HARBOR: 0.35,
  OUTER_HARBOR: 0.85,
  BREAKWATER_TIP: 1,
  ROCK: 1,
  SURF: 1,
  BOAT: 1,
  TIDAL_FLAT: 0.7,
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, f: number) => a + (b - a) * clamp01(f);

/** 구간 선형 함수: points = [[x, y], ...] (x 오름차순) */
function piecewise(x: number, points: [number, number][]): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return points[points.length - 1][1];
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

export function weightsFor(spot: Spot, species: Species): Weights {
  const base = { ...SEA_WEIGHTS[spot.sea] };
  for (const [k, v] of Object.entries(species.weightBoost ?? {})) {
    base[k as keyof Weights] *= v as number;
  }
  const sum = Object.values(base).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(base) as (keyof Weights)[]) base[k] /= sum;
  return base;
}

export function gradeOf(score: number, safety: SafetyLevel): Grade {
  if (safety === "DANGER") return "DANGER";
  if (score >= 80) return "BEST";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "FAIR";
  if (score >= 35) return "POOR";
  return "BAD";
}

export const GRADE_LABEL: Record<Grade, string> = {
  BEST: "최고",
  GOOD: "좋음",
  FAIR: "보통",
  POOR: "나쁨",
  BAD: "별로",
  DANGER: "위험",
};

// ───────────────────────── 하위 점수 ─────────────────────────

interface Ctx {
  spot: Spot;
  species: Species;
  t: number;
  cond: HourConditions;
  bundle: ConditionsBundle;
  maxRate: number;
  /** 지난 72시간 수온 최저·최고 (급변 감지용) */
  seaTempRange72h: { min: number; max: number } | null;
}

function tideScore(
  ctx: Ctx,
  reasons: Reason[],
  pre: TidePre,
): { daily: number; intraday: number; phase: HourScore["tidePhase"]; cm: number | null } {
  const { species, spot } = ctx;
  const { sp, cm, rate, toExt } = pre;
  const target = species.tide.mul === "neap" ? 0.2 : species.tide.mul === "mid" ? 0.55 : 0.9;
  const daily = clamp01(1 - Math.abs(sp - target) * 1.3);

  if (rate == null || cm == null) {
    return { daily, intraday: 0.6, phase: null, cm: null };
  }
  const current = ctx.maxRate > 0 ? Math.min(1, Math.abs(rate) / ctx.maxRate) : 0;
  const slack = toExt != null && toExt < 0.75;
  const phase: HourScore["tidePhase"] = slack ? "SLACK" : rate > 0 ? "FLOOD" : "EBB";
  const dirPref = slack ? Math.max(species.tide.flood, species.tide.ebb) * 0.85 : rate > 0 ? species.tide.flood : species.tide.ebb;
  const currentFit = clamp01(1 - Math.abs(current - species.tide.current) * 1.4);
  // 물돌이(만조·간조) 전후 1시간 입질 집중
  const turnBonus = toExt != null ? clamp01(1 - Math.abs(toExt - 0.75) / 1.25) : 0;
  const intraday = 0.45 * dirPref + 0.35 * currentFit + 0.2 * turnBonus;

  // 간조 무렵 서해 얕은 포인트는 수심이 사라짐
  let depthPenalty = 1;
  if (pre.shallow) {
    depthPenalty = 0.6;
    reasons.push({ label: "물이 빠져 얕음", effect: -1 });
  }

  const intradayAdj = clamp01(intraday * depthPenalty);
  if (spot.sea !== "EAST" || species.tide.current > 0.6) {
    if (phase === "FLOOD" && species.tide.flood >= 0.85) reasons.push({ label: "물 들어오는 중", effect: 1 });
    if (phase === "EBB" && species.tide.ebb >= 0.85) reasons.push({ label: "물 빠지는 중", effect: 1 });
    if (turnBonus > 0.7) reasons.push({ label: "물 방향 바뀌는 때", effect: 1 });
    if (daily >= 0.8) reasons.push({ label: "좋아하는 물때", effect: 1 });
    else if (daily < 0.4) reasons.push({ label: species.tide.mul === "neap" ? "물살이 너무 셈" : "물살이 너무 약함", effect: -1 });
  }
  return { daily, intraday: intradayAdj, phase, cm: Math.round(cm) };
}

function windScore(ctx: Ctx, reasons: Reason[]): number {
  const { cond, spot } = ctx;
  if (cond.windMs == null) return 0.6;
  const w = cond.windMs;
  const boat = spot.type === "BOAT";
  let s = boat
    ? piecewise(w, [[0, 1], [5, 1], [8, 0.6], [11, 0.2], [14, 0]])
    : piecewise(w, [[0, 1], [3, 1], [5, 0.9], [8, 0.5], [10, 0.2], [12, 0.05]]);
  if (!boat && cond.windDir != null && w >= 4 && spot.type !== "INNER_HARBOR") {
    const diff = angleDiff(cond.windDir, spot.facingDeg);
    if (diff < 60) {
      s *= 0.8;
      reasons.push({ label: `앞에서 부는 바람 ${w.toFixed(0)}m/s`, effect: -1 });
    } else if (diff > 120) {
      s = Math.min(1, s * 1.08);
      reasons.push({ label: `등 뒤에서 부는 바람 ${w.toFixed(0)}m/s`, effect: 1 });
    }
  }
  if (w <= 4) reasons.push({ label: `바람 약함 ${w.toFixed(0)}m/s`, effect: 1 });
  else if (w >= 8) reasons.push({ label: `바람 강함 ${w.toFixed(0)}m/s`, effect: -1 });
  return s;
}

function waveScore(ctx: Ctx, reasons: Reason[]): number {
  const { cond, spot, species } = ctx;
  if (cond.waveM == null) return 0.6;
  const eff = cond.waveM * WAVE_EXPOSURE[spot.type];
  let s: number;
  if (spot.type === "BOAT") {
    s = piecewise(eff, [[0, 1], [1, 1], [1.5, 0.6], [2, 0.2], [2.5, 0]]);
  } else {
    s = piecewise(eff, [[0, species.likesSurf ? 0.7 : 0.95], [0.3, 1], [0.8, 1], [1.2, 0.55], [1.5, 0.25], [2, 0.05]]);
  }
  if (cond.wavePeriodS != null && cond.wavePeriodS >= 8 && cond.waveM >= 0.8 && spot.type !== "INNER_HARBOR") {
    s *= 0.7;
    reasons.push({ label: `큰 너울(파도 간격 ${cond.wavePeriodS.toFixed(0)}초)`, effect: -1 });
  }
  if (species.likesSurf && eff >= 0.3 && eff <= 0.9) reasons.push({ label: "파도가 알맞음", effect: 1 });
  else if (eff < 0.5) reasons.push({ label: `바다 잔잔 ${cond.waveM.toFixed(1)}m`, effect: 1 });
  else if (eff >= 1.2) reasons.push({ label: `파도 높음 ${cond.waveM.toFixed(1)}m`, effect: -1 });
  return s;
}

/** 수온에 따른 먹이 활동 0~1 (최적 수온에서 1, 범위 밖은 0.2 이하) — 어종 화면 곡선과 같은 식 */
export function tempFit(species: Pick<Species, "temp">, T: number): number {
  const { min, opt, max } = species.temp;
  const sigma = T < opt ? (opt - min) / 1.6 : (max - opt) / 1.6;
  let s = Math.exp(-(((T - opt) / Math.max(0.5, sigma)) ** 2) / 2);
  if (T < min || T > max) s = Math.min(s, 0.2);
  return s;
}

function tempScore(ctx: Ctx, reasons: Reason[]): number {
  const { cond, species } = ctx;
  if (cond.seaTempC == null) return 0.6;
  const T = cond.seaTempC;
  const { opt } = species.temp;
  const s = tempFit(species, T);
  if (s >= 0.8) reasons.push({ label: `딱 좋은 물 온도 ${T.toFixed(1)}℃`, effect: 1 });
  else if (s < 0.35) reasons.push({ label: `물이 ${T < opt ? "차가움" : "따뜻함"} ${T.toFixed(1)}℃`, effect: -1 });
  return s;
}

/**
 * 수온 급변 쇼크(활성도 배수). 어류는 절대 수온보다 급변에 민감해서, 냉수대처럼 하루 이틀 새 크게 떨어지면
 * 적정 수온 범위 안이라도 2~3일간 먹이 활동이 끊긴다. 그래서 수온 점수가 아니라 전체 점수에 곱한다.
 */
function thermalShock(ctx: Ctx, reasons: Reason[]): number {
  const T = ctx.cond.seaTempC;
  if (T == null || !ctx.seaTempRange72h) return 1;
  const drop = T - ctx.seaTempRange72h.max;
  const rise = T - ctx.seaTempRange72h.min;
  if (drop <= -4) {
    reasons.push({ label: `물 온도 뚝 떨어짐 ${drop.toFixed(1)}℃ (냉수대)`, effect: -1 });
    return 0.6;
  }
  if (drop <= -2) {
    reasons.push({ label: `물 온도 떨어짐 ${drop.toFixed(1)}℃`, effect: -1 });
    return 0.82;
  }
  if (rise >= 3) {
    reasons.push({ label: `물 온도 갑자기 오름 +${rise.toFixed(1)}℃`, effect: -1 });
    return 0.9;
  }
  return 1;
}

/** 해·달에 따른 먹이 활동 0~1 (해 뜰·질 무렵 가산, 밤에는 달빛 선호 반영) — 어종 화면 시계와 같은 식 */
export function lightFit(species: Pick<Species, "light">, t: number, sr: number, ss: number, moonIllum: number): number {
  const edge = Math.min(Math.abs(t - sr), Math.abs(t - ss)) / HOUR;
  const isDay = t > sr && t < ss;
  let s = isDay ? species.light.day : species.light.night;
  if (!isDay) {
    if (species.light.moon === "dark") s *= 1 - 0.35 * moonIllum;
    if (species.light.moon === "bright") s *= 0.75 + 0.25 * moonIllum;
  }
  if (edge <= 1.25) s = Math.max(s, species.light.dawnDusk * (1 - edge / 2.5));
  return clamp01(s);
}

function lightScore(ctx: Ctx, reasons: Reason[], sun: ReturnType<typeof sunTimes>): number {
  const { t, species } = ctx;
  const sr = sun.sunrise.getTime();
  const ss = sun.sunset.getTime();
  const nearDawn = Math.abs(t - sr) / HOUR;
  const nearDusk = Math.abs(t - ss) / HOUR;
  const edge = Math.min(nearDawn, nearDusk);
  const isDay = t > sr && t < ss;
  const s = lightFit(species, t, sr, ss, isDay ? 0 : moonIllumination(new Date(t)));
  if (edge <= 1.25) {
    if (species.light.dawnDusk >= 0.9) reasons.push({ label: nearDawn < nearDusk ? "해뜰 무렵 먹이 시간" : "해질 무렵 먹이 시간", effect: 1 });
  } else if (!isDay && species.light.night >= 0.9) {
    reasons.push({ label: "밤에 활발", effect: 1 });
  }
  return clamp01(s);
}

function pressureScore(ctx: Ctx, prev3h: HourConditions | undefined, reasons: Reason[]): number {
  const p = ctx.cond.pressureHpa;
  const p0 = prev3h?.pressureHpa;
  if (p == null || p0 == null) return 0.65;
  const d = p - p0;
  if (d <= -1.5) {
    reasons.push({ label: "날씨 바뀌기 전 활발", effect: 1 });
    return 0.9;
  }
  if (d >= 2) {
    reasons.push({ label: "기압이 갑자기 오름", effect: -1 });
    return 0.45;
  }
  return 0.7;
}

// ───────────────────────── 안전 게이트 ─────────────────────────

export function safetyGate(
  spot: Spot,
  cond: HourConditions,
  ctx: { t: number; nearLowTide: boolean; isDark: boolean },
): { level: SafetyLevel; reasons: string[] } {
  const reasons: string[] = [];
  let level: SafetyLevel = "OK";
  const bump = (l: SafetyLevel, r: string) => {
    reasons.push(r);
    if (l === "DANGER" || (l === "CAUTION" && level === "OK")) level = l;
  };
  const w = cond.windMs ?? 0;
  const g = cond.gustMs ?? 0;
  const wave = cond.waveM ?? 0;
  const period = cond.wavePeriodS ?? 0;
  const boat = spot.type === "BOAT";
  const exposed = EXPOSED.includes(spot.type);

  if (boat) {
    if (w >= 14 || wave >= 2.5) bump("DANGER", "배가 못 뜰 만큼 바람·파도가 셈");
    else if (w >= 10 || wave >= 1.8) bump("CAUTION", "배 멀미·출항 취소 가능");
  } else {
    if (w >= 12 || g >= 17) bump("DANGER", `바람이 너무 셈 ${w.toFixed(0)}m/s`);
    else if (w >= 9) bump("CAUTION", `바람 강함 ${w.toFixed(0)}m/s`);
  }
  if (exposed) {
    if (wave >= 1.5) bump("DANGER", `파도 ${wave.toFixed(1)}m — 방파제·갯바위로 파도가 넘쳐요`);
    else if (period >= 8 && wave >= 1.0) bump("DANGER", `큰 너울(파도 간격 ${period.toFixed(0)}초) — 갑자기 큰 파도가 덮쳐요`);
    else if (wave >= 1.0) bump("CAUTION", `파도 조금 높음 ${wave.toFixed(1)}m`);
  }
  if (cond.visibilityKm != null && cond.visibilityKm < 1) {
    bump(boat ? "DANGER" : "CAUTION", `바다 안개 — 앞이 ${cond.visibilityKm.toFixed(1)}km밖에 안 보여요`);
  }
  if ((cond.precipMm ?? 0) >= 10) bump("CAUTION", `비가 많이 와요 ${cond.precipMm}mm`);
  if ((spot.type === "TIDAL_FLAT" || spot.type === "ROCK") && spot.sea === "WEST" && ctx.nearLowTide) {
    bump(ctx.isDark ? "DANGER" : "CAUTION", "물 빠진 때 — 물이 다시 차면 갇힐 수 있어요");
  }
  if (spot.tetrapod && ctx.isDark && level !== "OK") {
    reasons.push("밤에 테트라포드 위는 떨어질 위험");
  }
  return { level, reasons };
}

// ───────────────────────── 종합 ─────────────────────────

export function isClosedSeason(species: Species, date: Date): boolean {
  const closed = species.regulation?.closed;
  if (!closed) return false;
  const md = kstDateString(date).slice(5);
  return closed.some(({ from, to }) => (from <= to ? md >= from && md <= to : md >= from || md <= to));
}

export function seasonFactor(species: Species, date: Date): number {
  const month = Number(kstDateString(date).slice(5, 7));
  return species.season[month - 1];
}

export interface ScoreOptions {
  mulddaeSystem?: MulddaeSystem;
  /** 기준 시각 (오늘 남은 시간 계산). 기본값: 현재 */
  now?: Date;
}

/** 선상 출항 가능 시간대 [시작, 끝) KST */
export const BOAT_HOURS: [number, number] = [4, 17];

/**
 * 어종과 무관한 포인트·시간별 계산 (조류 최대값, 일출·일몰, 폭풍 직후 여부, 72시간 수온 범위, 안전 판정).
 * 한 포인트에 어종이 평균 6~7개라 어종마다 다시 계산하던 것을 한 번만 한다 (결과는 같음).
 */
interface SpotPre {
  maxRate: number;
  byTime: Map<number, ConditionsBundle["hours"][number]>;
  sun: ReturnType<typeof sunTimes>[];
  storm: boolean[];
  tempRange: ({ min: number; max: number } | null)[];
  safety: ReturnType<typeof safetyGate>[];
  /** 어종과 무관한 물때 값 (시간별) */
  tide: TidePre[];
}
interface TidePre {
  sp: number;
  cm: number | null;
  rate: number | null;
  toExt: number | null;
  /** 서해 연안 포인트에서 물이 빠져 얕은 때 (조차 하위 20%) */
  shallow: boolean;
}
const preCache = new WeakMap<ConditionsBundle, Map<string, SpotPre>>();

function spotPre(spot: Spot, bundle: ConditionsBundle): SpotPre {
  let bySpot = preCache.get(bundle);
  if (!bySpot) preCache.set(bundle, (bySpot = new Map()));
  const hit = bySpot.get(spot.id);
  if (hit) return hit;

  const sunCache = new Map<string, ReturnType<typeof sunTimes>>();
  const sunFor = (d: Date) => {
    const k = kstDateString(d);
    let v = sunCache.get(k);
    if (!v) sunCache.set(k, (v = sunTimes(d, spot.lat, spot.lon)));
    return v;
  };

  // 하루 최대 조류(조위 변화율) — 상대 조류세기 계산용
  const rates = bundle.hours
    .map((h) => tideRate(bundle.tide.series, Date.parse(h.time)))
    .filter((r): r is number => r != null)
    .map(Math.abs);
  const maxRate = rates.length ? Math.max(...rates) : 0;

  const byTime = new Map(bundle.hours.map((h) => [Date.parse(h.time), h]));
  const tempHist = new Map(bundle.seaTempHistory.map((h) => [Date.parse(h.time), h.c]));
  const seaTempAt = (t: number): number | null => byTime.get(t)?.seaTempC ?? tempHist.get(t) ?? null;
  const rough = (c: { windMs: number | null; waveM: number | null } | undefined) => !!c && ((c.windMs ?? 0) >= 14 || (c.waveM ?? 0) >= 2.5);
  const ex = bundle.tide.extremes;

  const pre: SpotPre = { maxRate, byTime, sun: [], storm: [], tempRange: [], safety: [], tide: [] };
  const highs = ex.filter((e) => e.type === "HIGH").map((e) => e.cm);
  const lows = ex.filter((e) => e.type === "LOW").map((e) => e.cm);
  const shallowCheck = spot.sea === "WEST" && spot.type !== "BOAT" && highs.length > 0 && lows.length > 0;
  const hiMax = shallowCheck ? Math.max(...highs) : 0;
  const loMin = shallowCheck ? Math.min(...lows) : 0;
  for (const cond of bundle.hours) {
    const t = Date.parse(cond.time);
    const sun = sunFor(new Date(t));
    // 폭풍 직후: 지난 24시간 안에 풍속 14m/s·파고 2.5m 이상이었다면 탁도·잔너울로 활성 저하 (현재가 잔잔해도)
    let storm = false;
    for (let k = 3; k <= 24 && !storm; k++) if (rough(byTime.get(t - k * HOUR))) storm = true;
    pre.storm.push(storm && !rough(byTime.get(t)));
    let min = Infinity;
    let max = -Infinity;
    for (let k = 3; k <= 72; k += 3) {
      const v = seaTempAt(t - k * HOUR);
      if (v == null) continue;
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    pre.tempRange.push(Number.isFinite(min) ? { min, max } : null);
    const nearLow = ex.some((e) => e.type === "LOW" && Math.abs(Date.parse(e.time) - t) < 1.5 * HOUR);
    const isDark = t < sun.dawn.getTime() || t > sun.dusk.getTime();
    pre.sun.push(sun);
    pre.safety.push(safetyGate(spot, cond, { t, nearLowTide: nearLow, isDark }));
    const cm = tideAt(bundle.tide.series, t);
    pre.tide.push({
      sp: springness(new Date(t)),
      cm,
      rate: tideRate(bundle.tide.series, t),
      toExt: hoursToNearestExtreme(ex, t),
      shallow: shallowCheck && cm != null && (cm - loMin) / Math.max(1, hiMax - loMin) < 0.2,
    });
  }
  bySpot.set(spot.id, pre);
  return pre;
}

export function scoreForecast(
  spot: Spot,
  species: Species,
  bundle: ConditionsBundle,
  opts: ScoreOptions = {},
): ForecastResult {
  const weights = weightsFor(spot, species);
  const tau = timingTideShare(spot, species);
  const hours: HourScore[] = [];
  const pre = spotPre(spot, bundle);
  const { maxRate, byTime } = pre;
  const stormAftermath = (i: number, reasons: Reason[]): number => {
    if (!pre.storm[i]) return 1;
    reasons.push({ label: "폭풍 직후라 물이 탁함", effect: -1 });
    return 0.72;
  };

  for (let i = 0; i < bundle.hours.length; i++) {
    const cond = bundle.hours[i];
    const t = Date.parse(cond.time);
    const d = new Date(t);
    const reasons: Reason[] = [];
    const ctx: Ctx = {
      spot, species, t, cond, bundle, maxRate,
      seaTempRange72h: pre.tempRange[i],
    };
    const sun = pre.sun[i];
    const tide = tideScore(ctx, reasons, pre.tide[i]);
    const sub: SubScores = {
      tide: 0.35 * tide.daily + 0.65 * tide.intraday,
      wind: windScore(ctx, reasons),
      wave: waveScore(ctx, reasons),
      temp: tempScore(ctx, reasons),
      light: lightScore(ctx, reasons, sun),
      pressure: pressureScore(ctx, byTime.get(t - 3 * HOUR), reasons),
      spot: species.spot[spot.type] ?? 0.3,
    };
    if (sub.spot >= 0.9) reasons.push({ label: "좋아하는 장소", effect: 1 });
    else if (sub.spot < 0.4) reasons.push({ label: "잘 안 맞는 장소", effect: -1 });

    const envParts: Record<keyof Weights, number> = { ...sub, tide: tide.daily };
    let env = 0;
    for (const k of Object.keys(weights) as (keyof Weights)[]) env += weights[k] * envParts[k];
    const timing = tau * tide.intraday + (1 - tau) * sub.light;
    let raw = env * (0.5 + 0.5 * timing) * thermalShock(ctx, reasons) * stormAftermath(i, reasons);

    // 비: 약한 비는 활성↑(통설)이지만 강하면 감점
    const rain = cond.precipMm ?? 0;
    if (rain >= 5) {
      raw *= 0.85;
      reasons.push({ label: `비 많이 옴 ${rain.toFixed(0)}mm`, effect: -1 });
    }

    const season = seasonFactor(species, d);
    const closed = isClosedSeason(species, d);
    let score = 100 * raw * (0.35 + 0.65 * season);
    if (season >= 0.85) reasons.push({ label: "제철", effect: 1 });
    else if (season < 0.35) reasons.push({ label: "제철 아님", effect: -1 });

    const safety = pre.safety[i];
    if (safety.level === "DANGER") score = Math.min(score, 15);
    else if (safety.level === "CAUTION") score *= 0.85;
    // 선상은 출항 시간(04~17시)에만 의미가 있다. 야간 선상 어종은 별도 프로필로 확장
    const kstHour = (d.getUTCHours() + 9) % 24;
    const offBoatHours = spot.type === "BOAT" && (kstHour < BOAT_HOURS[0] || kstHour >= BOAT_HOURS[1]);
    if (offBoatHours) {
      score = Math.min(score * 0.35, 25);
      reasons.unshift({ label: "배 안 뜨는 시간", effect: -1 });
    }
    if (closed) {
      score = 0;
      reasons.unshift({ label: "잡으면 안 되는 기간(금어기)", effect: -1 });
    }
    score = Math.round(Math.max(0, Math.min(100, score)));

    hours.push({
      time: cond.time,
      score,
      grade: closed ? "BAD" : gradeOf(score, safety.level),
      safety: safety.level,
      safetyReasons: safety.reasons,
      sub,
      season,
      reasons: dedupeReasons(reasons),
      tideCm: tide.cm,
      tidePhase: tide.phase,
      available: safety.level !== "DANGER" && !closed && !offBoatHours,
      cond,
    });
  }

  const days = summarizeDays(spot, hours, bundle, opts.mulddaeSystem ?? (spot.sea === "WEST" ? 7 : 8), opts.now);
  return {
    spotId: spot.id,
    speciesId: species.id,
    algoVersion: ALGO_VERSION,
    hours,
    days,
    tideSeries: bundle.tide.series,
    sources: bundle.sources,
    notes: bundle.notes,
    fetchedAt: bundle.fetchedAt,
  };
}

function dedupeReasons(rs: Reason[]): Reason[] {
  const seen = new Set<string>();
  return rs.filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)));
}

const MAX_BLOCK = 4;

/** 3시간 이동평균 후 임계치 이상 연속 구간을 골든타임으로 묶는다 (최대 4시간) */
export function goldenBlocks(hours: HourScore[], minScore = 65): GoldenBlock[] {
  if (!hours.length) return [];
  const smooth = hours.map((_, i) => {
    const w = hours.slice(Math.max(0, i - 1), i + 2).filter((h) => h.available);
    return w.length ? w.reduce((a, h) => a + h.score, 0) / w.length : 0;
  });
  const avail = hours.filter((h) => h.available);
  if (!avail.length) return [];
  const peakDay = Math.max(...avail.map((h) => h.score));
  const threshold = Math.max(minScore, peakDay - 12);
  const blocks: GoldenBlock[] = [];
  let i = 0;
  while (i < hours.length) {
    if (smooth[i] >= threshold && hours[i].available && hours[i].score >= threshold - 5) {
      let j = i;
      while (j + 1 < hours.length && smooth[j + 1] >= threshold && hours[j + 1].available && hours[j + 1].score >= threshold - 5) j++;
      const next = j + 1;
      // 너무 긴 구간은 합계가 가장 높은 MAX_BLOCK 시간 창으로 좁힌다 ("하루 종일 좋음"은 결정에 도움이 안 됨)
      if (j - i + 1 > MAX_BLOCK) {
        let bestK = i;
        let bestSum = -1;
        for (let k = i; k + MAX_BLOCK - 1 <= j; k++) {
          const sum = hours.slice(k, k + MAX_BLOCK).reduce((a, h) => a + h.score, 0);
          if (sum > bestSum) (bestSum = sum), (bestK = k);
        }
        i = bestK;
        j = bestK + MAX_BLOCK - 1;
      }
      const seg = hours.slice(i, j + 1);
      const peakHour = seg.reduce((a, b) => (b.score > a.score ? b : a));
      blocks.push({
        start: hours[i].time,
        end: new Date(Date.parse(hours[j].time) + HOUR).toISOString(),
        avg: Math.round(seg.reduce((a, h) => a + h.score, 0) / seg.length),
        peak: peakHour.score,
        reasons: peakHour.reasons.filter((r) => r.effect > 0).slice(0, 5),
      });
      i = next;
    } else i++;
  }
  return blocks.sort((a, b) => b.peak - a.peak).slice(0, 3);
}

function summarizeDays(
  spot: Spot,
  hours: HourScore[],
  bundle: ConditionsBundle,
  system: MulddaeSystem,
  now: Date = new Date(),
): DaySummary[] {
  const nowMs = now.getTime();
  const groups = new Map<string, HourScore[]>();
  for (const h of hours) {
    const k = kstDateString(new Date(h.time));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(h);
  }
  const out: DaySummary[] = [];
  for (const [date, hs] of groups) {
    const noon = new Date(Date.parse(`${date}T12:00:00+09:00`));
    const sun = sunTimes(noon, spot.lat, spot.lon);
    const mul = mulddae(noon, system);
    const dayStart = Date.parse(`${date}T00:00:00+09:00`);
    const dayEnd = dayStart + 24 * HOUR;
    const extremes = bundle.tide.extremes.filter((e) => {
      const t = Date.parse(e.time);
      return t >= dayStart && t < dayEnd;
    });
    const hi = extremes.filter((e) => e.type === "HIGH").map((e) => e.cm);
    const lo = extremes.filter((e) => e.type === "LOW").map((e) => e.cm);
    const okHours = hs.filter((h) => h.available);
    const best = okHours.length ? Math.max(...okHours.map((h) => h.score)) : 0;
    const dangerHours = hs.filter((h) => h.safety === "DANGER").length;
    // 오늘: 지금 이후(진행 중인 시간 포함)만으로 다시 계산
    let remainingBest: number | null = null;
    let nextGolden: GoldenBlock | null = null;
    if (dayEnd <= nowMs) remainingBest = 0;
    else if (dayStart <= nowMs) {
      const rest = hs.filter((h) => Date.parse(h.time) + HOUR > nowMs);
      const restOk = rest.filter((h) => h.available);
      remainingBest = restOk.length ? Math.max(...restOk.map((h) => h.score)) : 0;
      nextGolden = goldenBlocks(rest).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;
    }
    // 낮 시간(05~20시)의 과반이 위험이면 그날은 위험일
    const daylight = hs.filter((h) => {
      const hr = Number(new Date(Date.parse(h.time) + 9 * HOUR).toISOString().slice(11, 13));
      return hr >= 5 && hr <= 20;
    });
    const dangerDay = daylight.length > 0 && daylight.filter((h) => h.safety === "DANGER").length / daylight.length > 0.5;
    out.push({
      date,
      lunarDay: lunarDay(noon),
      mulddae: mul.label,
      springness: Math.round(springness(noon) * 100) / 100,
      moonPhase: moonPhaseName(noon),
      moonIllumination: Math.round(moonIllumination(noon) * 100) / 100,
      sunrise: sun.sunrise.toISOString(),
      sunset: sun.sunset.toISOString(),
      best,
      verdict: dangerDay ? "DANGER" : best >= 70 ? "GO" : best >= 50 ? "OK" : "SKIP",
      golden: goldenBlocks(hs),
      remainingBest,
      nextGolden,
      dangerHours,
      extremes,
      tideRangeCm: hi.length && lo.length ? Math.round(Math.max(...hi) - Math.min(...lo)) : null,
    });
  }
  return out;
}
