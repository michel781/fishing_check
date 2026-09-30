import type { TideExtreme, TidePoint, TideStation } from "@/lib/types";
import { moonAgeDays, springness, SYNODIC_MONTH } from "./astro";

const HOUR = 3600 * 1000;
/** 주태음반일주조(M2) 주기 */
export const M2_PERIOD_H = 12.4206;

/**
 * 고·저조 시각(조석예보)만 있을 때 코사인 보간으로 조위 곡선을 만든다.
 * 인접한 고조–저조 사이를 반주기 코사인으로 잇는 방식(조석표 보간의 표준 근사).
 */
export function seriesFromExtremes(extremes: TideExtreme[], stepMin = 20): TidePoint[] {
  const ex = [...extremes].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const out: TidePoint[] = [];
  for (let i = 0; i < ex.length - 1; i++) {
    const t0 = Date.parse(ex[i].time);
    const t1 = Date.parse(ex[i + 1].time);
    const h0 = ex[i].cm;
    const h1 = ex[i + 1].cm;
    for (let t = t0; t < t1; t += stepMin * 60000) {
      const f = (t - t0) / (t1 - t0);
      const h = h0 + (h1 - h0) * (1 - Math.cos(Math.PI * f)) / 2;
      out.push({ time: new Date(t).toISOString(), cm: Math.round(h * 10) / 10 });
    }
  }
  if (ex.length) out.push({ time: ex[ex.length - 1].time, cm: ex[ex.length - 1].cm });
  return out;
}

/** 조위 시계열에서 극값(고조·저조)을 찾는다. 포물선 보정으로 시각을 다듬는다. */
export function findExtremes(series: TidePoint[]): TideExtreme[] {
  const out: TideExtreme[] = [];
  for (let i = 1; i < series.length - 1; i++) {
    const a = series[i - 1].cm;
    const b = series[i].cm;
    const c = series[i + 1].cm;
    const isHigh = b >= a && b > c;
    const isLow = b <= a && b < c;
    if (!isHigh && !isLow) continue;
    const t = Date.parse(series[i].time);
    const dt = Date.parse(series[i + 1].time) - t;
    const denom = a - 2 * b + c;
    const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
    const peak = b - 0.25 * (a - c) * shift;
    out.push({
      time: new Date(t + shift * dt).toISOString(),
      cm: Math.round(peak * 10) / 10,
      type: isHigh ? "HIGH" : "LOW",
    });
  }
  // 모델 잡음으로 생긴 너무 가까운 극값(3시간 이내, 같은 방향 교차) 제거
  const filtered: TideExtreme[] = [];
  for (const e of out) {
    const prev = filtered[filtered.length - 1];
    if (prev && Date.parse(e.time) - Date.parse(prev.time) < 3 * HOUR) {
      if (prev.type === e.type) {
        if ((e.type === "HIGH" && e.cm > prev.cm) || (e.type === "LOW" && e.cm < prev.cm)) {
          filtered[filtered.length - 1] = e;
        }
      } else {
        filtered.pop();
      }
      continue;
    }
    filtered.push(e);
  }
  return filtered;
}

/** 선형보간 조위 */
/** 시각 문자열 → ms 배열을 한 번만 만들어 재사용 (매시간 이진 탐색마다 Date.parse 하지 않게) */
const msCache = new WeakMap<readonly TidePoint[], Float64Array>();
function timesOf(series: readonly TidePoint[]): Float64Array {
  let a = msCache.get(series);
  if (!a || a.length !== series.length) {
    a = Float64Array.from(series, (p) => Date.parse(p.time));
    msCache.set(series, a);
  }
  return a;
}

export function tideAt(series: TidePoint[], t: number): number | null {
  if (series.length < 2) return null;
  const ms = timesOf(series);
  let lo = 0;
  let hi = series.length - 1;
  if (t < ms[0] || t > ms[hi]) return null;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ms[mid] <= t) lo = mid;
    else hi = mid;
  }
  const t0 = ms[lo];
  const t1 = ms[hi];
  const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
  return series[lo].cm + (series[hi].cm - series[lo].cm) * f;
}

/** 조위 변화율(cm/h). 양수 = 들물(밀물) */
export function tideRate(series: TidePoint[], t: number): number | null {
  const a = tideAt(series, t - 0.5 * HOUR);
  const b = tideAt(series, t + 0.5 * HOUR);
  if (a == null || b == null) return null;
  return b - a;
}

/** 가장 가까운 극값까지의 시간(h) */
export function hoursToNearestExtreme(extremes: TideExtreme[], t: number): number | null {
  let best: number | null = null;
  const ms = timesOf(extremes);
  for (let i = 0; i < ms.length; i++) {
    const d = Math.abs(ms[i] - t) / HOUR;
    if (best == null || d < best) best = d;
  }
  return best;
}

/**
 * 추정 조석 모델 (API 키도 네트워크도 없을 때의 최후 폴백).
 * 달의 남중 시각 + 평균고조간격(HWI)으로 고조 시각을 잡고,
 * 조차는 사리 정도(springness)로 대조~소조 조차 사이를 보간한다.
 * 실제 조석예보와 수십 분~1시간 이상 차이 날 수 있어 화면에 "추정"으로 표시한다.
 */
export function estimateTide(
  station: TideStation,
  lon: number,
  fromMs: number,
  toMs: number,
  stepMin = 20,
): TidePoint[] {
  const out: TidePoint[] = [];
  const msl = (station.springRangeM / 2 + 0.3) * 100; // 약최저저조면 기준 평균해면 근사(cm)
  for (let t = fromMs; t <= toMs; t += stepMin * 60000) {
    const d = new Date(t);
    const s = springness(d);
    const range = (station.neapRangeM + (station.springRangeM - station.neapRangeM) * s) * 100;
    // 고조는 달이 남중한 뒤 HWI 시간 후에 온다 → (t - HWI) 시점의 달 시간각으로 계산
    const tl = t - station.hwiHours * HOUR;
    const sunHourAngle = (2 * Math.PI * (tl / HOUR + lon / 15 - 12)) / 24;
    const elongation = (2 * Math.PI * moonAgeDays(new Date(tl))) / SYNODIC_MONTH;
    const moonHourAngle = sunHourAngle - elongation;
    const h = msl + (range / 2) * Math.cos(2 * moonHourAngle);
    out.push({ time: d.toISOString(), cm: Math.round(h) });
  }
  return out;
}
