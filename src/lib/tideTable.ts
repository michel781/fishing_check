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

/** 만조·간조 앞뒤로 '물 멈춤(정조)'으로 보는 시간 */
export const SLACK_MS = 40 * 60e3;
/** 반일주조(M2) 주기 12시간 25분의 절반 — 다음 만조·간조를 모를 때만 쓰는 평균 간격 */
export const HALF_TIDE_MS = (12 * 60 + 25) * 30e3;

export function tideStage(t: number, extremes: TideExtreme[]): { stage: TideStage; sinceH: number | null } {
  const ex = [...extremes].sort((a, b) => a.time.localeCompare(b.time));
  const prev = [...ex].reverse().find((e) => Date.parse(e.time) <= t);
  const next = ex.find((e) => Date.parse(e.time) > t);
  const near = (e: TideExtreme | undefined) => !!e && Math.abs(Date.parse(e.time) - t) <= SLACK_MS;
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

export interface EarlyWindow {
  /** 초들물(간조 뒤) 또는 초썰물(=초날물, 만조 뒤) */
  stage: "초들물" | "초썰물";
  /** 시작 = 간조(초들물) 또는 만조(초썰물) 시각 */
  start: string;
  /** 끝 = 시작 + (다음 만조·간조까지 간격 ÷ 3) */
  end: string;
  /** 시작부터 이때까지는 물이 거의 안 움직이는 정조 */
  slackEnd: string;
  /** 다음 만조·간조까지 간격(분) */
  intervalMin: number;
  /** 다음 만조·간조를 몰라 평균 간격(6시간 12분)으로 어림했는지 */
  approx: boolean;
}

/**
 * 초들물·초썰물(초날물) 구간: 간조(만조) 시각부터 다음 만조(간조)까지 간격의 3분의 1.
 * 흔히 말하는 '간조 + 2시간'은 간격을 6시간으로 어림한 값이고, 여기서는 그날 실제 간격을 쓴다.
 * fromMs~toMs와 겹치는 구간만 돌려준다.
 */
export function earlyWindows(extremes: TideExtreme[], fromMs: number, toMs: number): EarlyWindow[] {
  const ex = [...extremes].sort((a, b) => a.time.localeCompare(b.time));
  const out: EarlyWindow[] = [];
  ex.forEach((e, i) => {
    const s = Date.parse(e.time);
    const nx = ex.slice(i + 1).find((x) => x.type !== e.type);
    const gap = nx ? Date.parse(nx.time) - s : HALF_TIDE_MS;
    const end = s + gap / 3;
    if (end <= fromMs || s >= toMs) return;
    out.push({
      stage: e.type === "LOW" ? "초들물" : "초썰물",
      start: new Date(s).toISOString(),
      end: new Date(end).toISOString(),
      slackEnd: new Date(s + Math.min(SLACK_MS, gap / 3)).toISOString(),
      intervalMin: Math.round(gap / 60e3),
      approx: !nx,
    });
  });
  return out;
}

/** 간조(또는 만조)와 다음 만조(또는 간조) 시각으로 단계별 시간 나누기 — 물때표 계산기용 */
export function splitStages(startMs: number, endMs: number, rising: boolean) {
  const gap = endMs - startMs;
  const names = rising ? (["초들물", "중들물", "끝들물"] as const) : (["초썰물", "중썰물", "끝썰물"] as const);
  const slack = Math.min(SLACK_MS, gap / 6);
  return {
    gapMin: Math.round(gap / 60e3),
    slackStart: [startMs, startMs + slack] as const,
    slackEnd: [endMs - slack, endMs] as const,
    thirds: names.map((stage, i) => ({ stage, start: startMs + (gap * i) / 3, end: startMs + (gap * (i + 1)) / 3 })),
    /** 어림셈: 시작 + 2시간 */
    rough: [startMs, startMs + 2 * 3600e3] as const,
  };
}
