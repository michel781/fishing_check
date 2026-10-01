import type { ConditionsBundle, HourConditions, SourceKind, Spot, TideExtreme, TidePoint } from "@/lib/types";
import { kstDateString, kstMidnight } from "@/lib/engine/astro";
import { estimateTide, findExtremes, seriesFromExtremes } from "@/lib/engine/tide";
import { demoHours } from "./demo";
import { SPOTS_BY_ID } from "@/data/spots";
import { persist } from "@/lib/persist";
import { keepAlive } from "@/lib/keepAlive";
import { memo } from "./http";
import { khoaTideExtremes, khoaTideFromSeries } from "./khoa";
import { kmaShortForecast, type KmaHour } from "./kma";
import { omMarine, omWeather, seaLevelToTide, type OMMarineHour, type OMWeatherHour } from "./openMeteo";

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

const offline = () => env("FISHING_OFFLINE") === "1";

async function attempt<T>(label: string, notes: string[], fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    notes.push(`${label} 실패: ${(e as Error).message}`.slice(0, 160));
    return null;
  }
}

/**
 * 외부 데이터를 기다리는 최대 시간. 공공 API 가 느리면(최대 8초 타임아웃) 화면이 그만큼 멈추던 문제를 막는다.
 * 시간 안에 온 것만 쓰고 나머지는 추정·대체 값으로 채운 뒤, 늦은 요청은 뒤에서 끝까지 받아 캐시에 넣는다.
 */
const BUDGET_MS = () => Number(env("FC_DATA_BUDGET_MS") ?? 2500);
const LATE = Symbol("late");

interface Budget {
  deadline: number;
  late: Promise<unknown>[];
}

async function within<T>(b: Budget, label: string, notes: string[], fn: () => Promise<T>): Promise<T | null> {
  const local: string[] = [];
  const p = attempt(label, local, fn);
  const left = b.deadline - Date.now();
  const r = left > 0 ? await Promise.race([p, new Promise<typeof LATE>((ok) => setTimeout(() => ok(LATE), left))]) : LATE;
  if (r === LATE) {
    b.late.push(p);
    notes.push(`${label}: 응답이 늦어 이번에는 대체 값을 썼어요. 잠시 뒤 새로 고치면 반영돼요.`);
    return null;
  }
  notes.push(...local);
  return r as T | null;
}

/** 일부가 늦게 와서 공유 캐시에 넣으면 안 되는 결과 (unstable_cache 는 예외를 저장하지 않는다) */
export class PartialConditions extends Error {
  readonly partialBundle = true;
  constructor(
    public bundle: ConditionsBundle,
    public late: Promise<unknown>[],
  ) {
    super("partial conditions");
  }
}
const isPartial = (e: unknown): e is PartialConditions => !!e && typeof e === "object" && (e as { partialBundle?: boolean }).partialBundle === true;

/**
 * 포인트의 시간별 환경 값을 모은다.
 * 우선순위 — 조석: KHOA 조석예보(고·저조) → KHOA 예측 조위 곡선 → Open-Meteo 해수면 → 추정 모델
 *            날씨: 기상청 단기예보(+Open-Meteo 보충) → Open-Meteo → 데모
 *            해양: Open-Meteo Marine(+기상청 파고) → 데모
 */
export async function getConditions(spot: Spot, days = 4, now = new Date()): Promise<ConditionsBundle> {
  const bucket = Math.floor(now.getTime() / (30 * 60 * 1000)); // 30분 단위 캐시
  // 1) 이 서버 메모리 → 2) 모든 서버가 함께 쓰는 공유 캐시(외부 API 느린 응답을 방문자가 기다리지 않게) → 3) 새로 조회
  // 일부가 늦게 온 결과는 1분만 보관하고 다시 받는다
  return memo(`cond:${spot.id}:${days}:${bucket}`, (b: ConditionsBundle) => (b.partial ? 60 : 1800), async () => {
    try {
      return Math.abs(now.getTime() - Date.now()) < 5 * 60e3 ? await sharedConditions(spot.id, days) : await buildConditions(spot, days, now);
    } catch (e) {
      if (!isPartial(e)) throw e;
      keepAlive(Promise.allSettled(e.late));
      return e.bundle;
    }
  });
}

const sharedConditions = persist(
  async (spotId: string, days: number) => {
    const spot = SPOTS_BY_ID[spotId];
    return buildConditions(spot, days, new Date());
  },
  "conditions-v1",
  30 * 60,
);

async function buildConditions(spot: Spot, days: number, now: Date): Promise<ConditionsBundle> {
  const notes: string[] = [];
  const budget: Budget = { deadline: Date.now() + BUDGET_MS(), late: [] };
  const start = kstMidnight(now).getTime();
  const end = start + days * DAY;
  const grid: number[] = [];
  for (let t = start; t < end; t += HOUR) grid.push(t);

  const kmaKey = env("DATA_GO_KR_SERVICE_KEY");
  // 조석예보는 공공데이터포털로 이전되어 같은 키를 쓴다. KHOA_SERVICE_KEY 는 별도 키를 쓸 때만 지정
  const khoaKey = env("KHOA_SERVICE_KEY") ?? kmaKey;
  const net = !offline();

  const [kma, omW, omM, khoa] = await Promise.all([
    net && kmaKey ? within(budget, "기상청 단기예보", notes, () => kmaShortForecast(kmaKey, spot.lat, spot.lon, now)) : null,
    net ? within(budget, "Open-Meteo 예보", notes, () => omWeather(spot.lat, spot.lon, days)) : null,
    net ? within(budget, "Open-Meteo 해양", notes, () => omMarine(spot.lat, spot.lon, days)) : null,
    net && khoaKey
      ? within(budget, "해양조사원 조석예보", notes, () => {
          const dates: string[] = [];
          for (let t = start - DAY; t <= end; t += DAY) dates.push(kstDateString(new Date(t)));
          return khoaTideExtremes(khoaKey, spot.station.code, dates);
        })
      : null,
  ]);

  // ── 조석 ──
  let tideSource: SourceKind;
  let series: TidePoint[];
  let extremes: TideExtreme[];
  // 조석예보(고·저조)가 안 되면 같은 키로 '실측·예측 조위' 곡선에서 만조·간조를 찾는다
  const khoaSeries =
    (!khoa || khoa.length < 4) && net && khoaKey
      ? await within(budget, "해양조사원 예측 조위", notes, () => {
          const dates: string[] = [];
          for (let t = start - DAY; t <= end; t += DAY) dates.push(kstDateString(new Date(t)));
          return khoaTideFromSeries(khoaKey, spot.station.code, dates);
        })
      : null;
  if (khoa && khoa.length >= 4) {
    tideSource = "KHOA";
    extremes = khoa;
    series = seriesFromExtremes(khoa);
  } else if (khoaSeries && khoaSeries.extremes.length >= 4) {
    tideSource = "KHOA";
    series = khoaSeries.series;
    extremes = khoaSeries.extremes;
  } else {
    const fromOm = omM ? seaLevelToTide(omM) : [];
    if (fromOm.length) {
      tideSource = "OPEN_METEO";
      series = fromOm;
      extremes = findExtremes(fromOm);
      notes.push("조석: 해양조사원 키가 없어 Open-Meteo 해양모델 해수면으로 계산했습니다. 연안에서는 시각·높이 오차가 있을 수 있습니다.");
    } else {
      tideSource = "ESTIMATE";
      series = estimateTide(spot.station, spot.lon, start - DAY, end + DAY);
      extremes = findExtremes(series);
      notes.push("조석: 천문 추정 모델 값입니다. 실제 물때표와 다를 수 있으니 참고만 하세요.");
    }
  }

  // ── 날씨·해양 ──
  const kmaBy = new Map<number, KmaHour>((kma ?? []).map((h) => [Date.parse(h.time), h]));
  const omWBy = new Map<number, OMWeatherHour>((omW ?? []).map((h) => [Date.parse(h.time), h]));
  const omMBy = new Map<number, OMMarineHour>((omM ?? []).map((h) => [Date.parse(h.time), h]));
  const needDemo = !omW || !omM;
  const demo = needDemo ? demoHours(spot.id, spot.sea, start - 3 * DAY, (days + 3) * 24) : [];
  const demoBy = new Map(demo.map((h) => [Date.parse(h.time), h]));

  const weatherSource: SourceKind = kma?.length ? "KMA" : omW ? "OPEN_METEO" : "DEMO";
  const marineSource: SourceKind = omM ? "OPEN_METEO" : "DEMO";
  if (weatherSource === "DEMO" || marineSource === "DEMO") {
    notes.push("날씨·해양: 외부 예보에 연결할 수 없어 데모 값을 표시합니다. 실제 출조 판단에 쓰지 마세요.");
  }

  const pick = <T,>(...vals: (T | null | undefined)[]): T | null => {
    for (const v of vals) if (v != null) return v;
    return null;
  };

  const hours: HourConditions[] = grid.map((t) => {
    const k = kmaBy.get(t);
    const w = omWBy.get(t);
    const m = omMBy.get(t);
    const d = demoBy.get(t);
    return {
      time: new Date(t).toISOString(),
      windMs: pick(k?.windMs, w?.windMs, omW ? null : d?.windMs),
      windDir: pick(k?.windDir, w?.windDir, omW ? null : d?.windDir),
      gustMs: pick(w?.gustMs, omW ? null : d?.gustMs),
      precipMm: pick(k?.precipMm, w?.precipMm, omW ? null : d?.precipMm),
      pressureHpa: pick(w?.pressureHpa, omW ? null : d?.pressureHpa),
      visibilityKm: pick(w?.visibilityKm, omW ? null : d?.visibilityKm),
      airTempC: pick(k?.airTempC, w?.airTempC, omW ? null : d?.airTempC),
      waveM: pick(k?.waveM, m?.waveM, omM ? null : d?.waveM),
      wavePeriodS: pick(m?.wavePeriodS, omM ? null : d?.wavePeriodS),
      swellM: pick(m?.swellM, omM ? null : d?.swellM),
      swellPeriodS: pick(m?.swellPeriodS, omM ? null : d?.swellPeriodS),
      seaTempC: pick(m?.seaTempC, omM ? null : d?.seaTempC),
    };
  });

  const seaTempHistory: { time: string; c: number }[] = [];
  for (let t = start - 3 * DAY; t < start; t += HOUR) {
    const c = omMBy.get(t)?.seaTempC ?? (omM ? null : demoBy.get(t)?.seaTempC ?? null);
    if (c != null) seaTempHistory.push({ time: new Date(t).toISOString(), c });
  }

  const bundle: ConditionsBundle = {
    hours,
    seaTempHistory,
    tide: {
      series: series.filter((p) => {
        const t = Date.parse(p.time);
        return t >= start - 6 * HOUR && t <= end + 6 * HOUR;
      }),
      extremes: extremes.filter((e) => {
        const t = Date.parse(e.time);
        return t >= start - 12 * HOUR && t <= end + 12 * HOUR;
      }),
    },
    sources: { tide: tideSource, weather: weatherSource, marine: marineSource },
    notes,
    fetchedAt: new Date().toISOString(),
  };
  if (budget.late.length) throw new PartialConditions({ ...bundle, partial: true }, budget.late);
  return bundle;
}

export const SOURCE_LABEL: Record<SourceKind, string> = {
  KHOA: "국립해양조사원",
  KMA: "기상청",
  OPEN_METEO: "Open-Meteo",
  ESTIMATE: "천문 추정",
  DEMO: "데모",
};
