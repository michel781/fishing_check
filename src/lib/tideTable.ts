import { tideAt } from "@/lib/engine/tide";
import type { TideExtreme, TidePoint } from "@/lib/types";

/**
 * 시간대별 물 높이 표 (순수 함수, 테스트 대상).
 * 매시 정각의 물 높이와 1시간 변화량, 그리고 낚시꾼이 쓰는 말로 물의 단계를 붙인다.
 *  - 만조·간조 앞뒤 40분: "만조" / "간조" (물 흐름이 거의 멈춤)
 *  - 들물: 직전 간조 → 다음 만조 사이를 셋으로 나눠 초들물·중들물·끝들물
 *  - 썰물: 직전 만조 → 다음 간조 사이를 셋으로 나눠 초썰물·중썰물·끝썰물
 *  - 그날 가장 빠른 변화량의 80% 이상이면 "물살 셈"
 */

const HOUR = 3600e3;

export type TideStage = "만조" | "간조" | "초들물" | "중들물" | "끝들물" | "초썰물" | "중썰물" | "끝썰물";

export interface TideRow {
  time: string;
  /** 기준면(약최저저조면)에서 잰 물 높이 cm */
  cm: number;
  /** 다음 1시간 동안 변하는 양 cm (+ 들어옴, − 빠짐) */
  delta: number;
  stage: TideStage;
  /** 직전 간조(들물) 또는 만조(썰물)에서 몇 시간째인지 */
  sinceH: number | null;
  strong: boolean;
  /** 이 시간 안에 만조·간조가 있으면 그 정확한 시각 */
  extreme: TideExtreme | null;
}

export function tideStage(t: number, extremes: TideExtreme[]): { stage: TideStage; sinceH: number | null } {
  const ex = [...extremes].sort((a, b) => a.time.localeCompare(b.time));
  const prev = [...ex].reverse().find((e) => Date.parse(e.time) <= t);
  const next = ex.find((e) => Date.parse(e.time) > t);
  const near = (e: TideExtreme | undefined) => !!e && Math.abs(Date.parse(e.time) - t) <= 40 * 60e3;
  if (near(prev)) return { stage: prev!.type === "HIGH" ? "만조" : "간조", sinceH: 0 };
  if (near(next)) return { stage: next!.type === "HIGH" ? "만조" : "간조", sinceH: null };
  if (!prev || !next) return { stage: next?.type === "HIGH" || prev?.type === "LOW" ? "중들물" : "중썰물", sinceH: null };
  const f = (t - Date.parse(prev.time)) / (Date.parse(next.time) - Date.parse(prev.time));
  const part = f < 1 / 3 ? 0 : f < 2 / 3 ? 1 : 2;
  const rising = prev.type === "LOW";
  const stage = (rising ? (["초들물", "중들물", "끝들물"] as const) : (["초썰물", "중썰물", "끝썰물"] as const))[part];
  return { stage, sinceH: Math.round(((t - Date.parse(prev.time)) / HOUR) * 10) / 10 };
}

/** dayStartMs(한국시각 0시)부터 24시간의 매시 물 높이 */
export function tideTable(series: TidePoint[], extremes: TideExtreme[], dayStartMs: number): TideRow[] {
  const rows: Omit<TideRow, "strong">[] = [];
  for (let i = 0; i < 24; i++) {
    const t = dayStartMs + i * HOUR;
    const cm = tideAt(series, t);
    const next = tideAt(series, t + HOUR);
    if (cm == null || next == null) continue;
    const { stage, sinceH } = tideStage(t, extremes);
    const extreme = extremes.find((e) => Date.parse(e.time) >= t && Date.parse(e.time) < t + HOUR) ?? null;
    rows.push({ time: new Date(t).toISOString(), cm: Math.round(cm), delta: Math.round(next - cm), stage, sinceH, extreme });
  }
  const maxRate = Math.max(1, ...rows.map((r) => Math.abs(r.delta)));
  return rows.map((r) => ({ ...r, strong: Math.abs(r.delta) >= maxRate * 0.8 }));
}

/** 표 위 요약: 오늘 만조·간조, 조차(가장 높은 만조 − 가장 낮은 간조) */
export function tideSummary(extremes: TideExtreme[], dayStartMs: number) {
  const today = extremes.filter((e) => Date.parse(e.time) >= dayStartMs && Date.parse(e.time) < dayStartMs + 24 * HOUR);
  const highs = today.filter((e) => e.type === "HIGH");
  const lows = today.filter((e) => e.type === "LOW");
  const range = highs.length && lows.length ? Math.max(...highs.map((e) => e.cm)) - Math.min(...lows.map((e) => e.cm)) : null;
  return { today, rangeCm: range == null ? null : Math.round(range) };
}
