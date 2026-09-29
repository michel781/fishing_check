import { tideAt } from "@/lib/engine/tide";
import type { ForecastResult, GoldenBlock, HourScore, TideExtreme } from "@/lib/types";

const HOUR = 3600 * 1000;

export interface LiveStatus {
  hour: HourScore;
  tideCm: number | null;
  /** 1시간 뒤 대비 조위 변화 방향 */
  trend: "RISING" | "FALLING" | null;
  nextExtreme: (TideExtreme & { inMin: number }) | null;
  /** 진행 중인 골든타임 (끝나기까지 분) */
  current: (GoldenBlock & { endsInMin: number }) | null;
  /** 다음 골든타임 (시작까지 분). 오늘 남은 시간이 없으면 다음 날 것 */
  next: (GoldenBlock & { startsInMin: number; date: string }) | null;
}

/** 현재 시각 기준 현장 상황 요약 */
export function liveStatus(result: ForecastResult, now: Date): LiveStatus | null {
  const t = now.getTime();
  const hour = result.hours.find((h) => Date.parse(h.time) <= t && t < Date.parse(h.time) + HOUR);
  if (!hour) return null;
  const cm = tideAt(result.tideSeries, t);
  const later = tideAt(result.tideSeries, t + HOUR);
  const trend = cm == null || later == null ? null : later >= cm ? "RISING" : "FALLING";

  const extremes = result.days.flatMap((d) => d.extremes);
  const nx = extremes.filter((e) => Date.parse(e.time) > t).sort((a, b) => a.time.localeCompare(b.time))[0];

  let current: LiveStatus["current"] = null;
  let next: LiveStatus["next"] = null;
  for (const d of result.days) {
    const blocks = [...d.golden, ...(d.nextGolden ? [d.nextGolden] : [])].sort((a, b) => a.start.localeCompare(b.start));
    for (const g of blocks) {
      const s = Date.parse(g.start);
      const e = Date.parse(g.end);
      if (s <= t && t < e && !current) current = { ...g, endsInMin: Math.round((e - t) / 60000) };
      if (s > t && !next) next = { ...g, date: d.date, startsInMin: Math.round((s - t) / 60000) };
    }
    if (next) break;
  }

  return {
    hour,
    tideCm: cm == null ? null : Math.round(cm),
    trend,
    nextExtreme: nx ? { ...nx, inMin: Math.round((Date.parse(nx.time) - t) / 60000) } : null,
    current,
    next,
  };
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

export interface TimeWindow {
  start: string;
  end: string;
  avg: number;
}

/**
 * 골든타임 기준(65점)에 못 미쳐도 "그나마 나은 시간"을 알려주기 위한 최선 구간.
 * fromMs 이후, toMs 이전의 이용 가능한 연속 len시간 중 평균이 가장 높은 창.
 */
export function bestWindow(hours: HourScore[], fromMs: number, toMs: number, len = 2): TimeWindow | null {
  const hs = hours.filter((h) => Date.parse(h.time) + HOUR > fromMs && Date.parse(h.time) < toMs);
  let best: TimeWindow | null = null;
  for (let i = 0; i + len <= hs.length; i++) {
    const seg = hs.slice(i, i + len);
    if (!seg.every((h) => h.available)) continue;
    if (Date.parse(seg[len - 1].time) - Date.parse(seg[0].time) !== (len - 1) * HOUR) continue;
    const avg = Math.round(seg.reduce((a, h) => a + h.score, 0) / len);
    if (!best || avg > best.avg) best = { start: seg[0].time, end: new Date(Date.parse(seg[len - 1].time) + HOUR).toISOString(), avg };
  }
  return best;
}
