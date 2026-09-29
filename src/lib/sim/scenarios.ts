import type { ConditionsBundle, HourConditions, Sea, Spot } from "@/lib/types";
import { kstMidnight } from "@/lib/engine/astro";
import { estimateTide, findExtremes } from "@/lib/engine/tide";

/**
 * 시뮬레이션 시나리오: 특정 기상 상황을 재현한 결정적 환경 데이터.
 * 엔진 대량 검증(scripts/simulate.ts)과 앱의 시뮬레이션 모드(?sim=)에서 같이 쓴다.
 */

export const SCENARIOS = {
  typical: "평상시 (일변화 + 약한 기압골)",
  calm: "무풍·잔잔 (고기압 정체)",
  front: "한랭전선 통과 (2~3일차 북서 강풍)",
  typhoon: "태풍 접근 (3~4일차 폭풍·호우)",
  swell: "맑은 날 너울 (바람 약함, 장주기 너울)",
  fog: "해무 (새벽~오전 시정 불량)",
  rain: "장맛비 (2일차 강한 비)",
  coldwater: "냉수대 (수온 급강하 −6℃)",
  heatwave: "고수온 (+4℃)",
} as const;

export type ScenarioId = keyof typeof SCENARIOS;

export function isScenario(v: unknown): v is ScenarioId {
  return typeof v === "string" && v in SCENARIOS;
}

/** 월별 평년 표층 수온(℃, 대략값) */
export const SST_NORMAL: Record<Sea, number[]> = {
  WEST: [7, 6, 7, 10, 14, 18, 22, 25, 23, 19, 15, 11],
  EAST: [11, 10, 10, 12, 15, 18, 21, 24, 22, 19, 16, 13],
};

const HOUR = 3600 * 1000;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const bump = (x: number, center: number, width: number) => Math.exp(-(((x - center) / width) ** 2));

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export function scenarioHour(
  scenario: ScenarioId,
  sea: Sea,
  t: number,
  start: number,
  seed: number,
): HourConditions {
  const dh = (t - start) / HOUR; // 시작 후 경과 시간
  const day = dh / 24;
  const kstHour = (new Date(t).getUTCHours() + 9) % 24;
  const month = new Date(t + 9 * HOUR).getUTCMonth();
  const diurnal = 1 + 0.3 * Math.sin((2 * Math.PI * (kstHour - 9)) / 24); // 오후에 바람 강해짐
  const jitter = 0.9 + 0.2 * Math.sin(dh * 0.7 + seed * 10);
  const baseDir = sea === "WEST" ? 315 : 30;

  let wind = 3.5 * diurnal * jitter;
  let dir = baseDir;
  let wave = sea === "EAST" ? 0.5 : 0.4;
  let period = sea === "EAST" ? 6 : 4.5;
  let swell = 0.2;
  let rain = 0;
  let vis = 15;
  let pressure = 1016;
  let sst = SST_NORMAL[sea][month] + 0.3 * Math.sin(day + seed);

  switch (scenario) {
    case "typical": {
      const trough = bump(day, 2.5, 0.8);
      wind = (3 + 5 * trough) * diurnal * jitter;
      wave = 0.35 + 0.9 * trough + (sea === "EAST" ? 0.15 : 0);
      pressure = 1017 - 7 * trough;
      rain = trough > 0.6 ? 2 : 0;
      break;
    }
    case "calm":
      wind = 1.8 * diurnal * jitter;
      wave = 0.25;
      period = 4;
      pressure = 1024;
      break;
    case "front": {
      const f = bump(day, 2.2, 0.7);
      wind = (3 + 11 * f) * diurnal;
      dir = sea === "WEST" ? 320 : 340;
      wave = 0.4 + 2.2 * f;
      period = 5 + 3 * f;
      pressure = 1012 - 10 * bump(day, 1.8, 0.6) + 8 * bump(day, 3, 0.8);
      rain = f > 0.5 && day < 2.4 ? 3 : 0;
      sst -= 1.5 * clamp((day - 2) / 2, 0, 1);
      break;
    }
    case "typhoon": {
      const ty = bump(day, 3.3, 0.9);
      wind = 3 + 19 * ty;
      dir = 90 + 90 * clamp(day - 3, 0, 1);
      wave = 0.5 + 4.5 * bump(day, 3.4, 1.1);
      period = 7 + 5 * bump(day, 3, 1.4); // 태풍 너울은 먼저 도착
      swell = 0.3 + 2.5 * bump(day, 2.8, 1.2);
      rain = 25 * bump(day, 3.4, 0.5);
      pressure = 1010 - 45 * ty;
      vis = 15 - 12 * ty;
      break;
    }
    case "swell":
      wind = 2.5 * diurnal * jitter;
      wave = sea === "EAST" ? 1.3 + 0.4 * bump(day, 2, 1.2) : 0.7;
      period = sea === "EAST" ? 10.5 : 7;
      swell = wave * 0.9;
      pressure = 1021;
      break;
    case "fog": {
      const morning = kstHour >= 3 && kstHour <= 10;
      wind = 1.5 * jitter;
      wave = 0.3;
      vis = morning ? 0.3 + 0.1 * (kstHour - 3) : 6;
      pressure = 1015;
      break;
    }
    case "rain": {
      const r = bump(day, 1.5, 0.35);
      wind = (3 + 4 * r) * jitter;
      wave = 0.4 + 0.6 * r;
      rain = 12 * r;
      pressure = 1006;
      break;
    }
    case "coldwater":
      wind = 3 * diurnal * jitter;
      dir = 200; // 남서풍 지속 → 동해 용승
      wave = 0.5;
      sst -= 6 * clamp((day - 0.8) / 1.2, 0, 1);
      break;
    case "heatwave":
      wind = 2 * diurnal * jitter;
      wave = 0.3;
      sst += 4;
      pressure = 1012;
      break;
  }

  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    time: new Date(t).toISOString(),
    windMs: r1(Math.max(0, wind)),
    windDir: Math.round(((dir % 360) + 360) % 360),
    gustMs: r1(Math.max(0, wind) * 1.45),
    precipMm: r1(rain),
    pressureHpa: r1(pressure),
    visibilityKm: r1(clamp(vis, 0.1, 20)),
    airTempC: r1(sst + 2),
    waveM: r1(Math.max(0.1, wave)),
    wavePeriodS: r1(period),
    swellM: r1(swell),
    swellPeriodS: r1(period + 1),
    seaTempC: r1(sst),
  };
}

/** 시나리오 환경 번들 (조석은 천문 추정 모델) */
export function scenarioBundle(spot: Spot, scenario: ScenarioId, now: Date, days = 7): ConditionsBundle {
  const start = kstMidnight(now).getTime();
  const end = start + days * 24 * HOUR;
  const seed = hash(spot.id + scenario);
  const hours: HourConditions[] = [];
  for (let t = start; t < end; t += HOUR) hours.push(scenarioHour(scenario, spot.sea, t, start, seed));
  const seaTempHistory: { time: string; c: number }[] = [];
  for (let t = start - 72 * HOUR; t < start; t += HOUR) {
    // 시나리오 시작 전 3일은 평년 수온
    const month = new Date(t + 9 * HOUR).getUTCMonth();
    seaTempHistory.push({ time: new Date(t).toISOString(), c: SST_NORMAL[spot.sea][month] });
  }
  const series = estimateTide(spot.station, spot.lon, start - 24 * HOUR, end + 24 * HOUR);
  return {
    hours,
    seaTempHistory,
    tide: { series, extremes: findExtremes(series) },
    sources: { tide: "ESTIMATE", weather: "DEMO", marine: "DEMO" },
    notes: [`시뮬레이션: ${SCENARIOS[scenario]} — 실제 예보가 아닙니다.`],
    fetchedAt: new Date().toISOString(),
  };
}
