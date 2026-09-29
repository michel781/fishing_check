import type { MulddaeSystem } from "@/lib/engine/astro";
import type { Ctx } from "@/lib/forecast";
import { isScenario, SCENARIOS, type ScenarioId } from "./scenarios";

/**
 * 시뮬레이션 모드: ?sim=typhoon&simDate=2026-10-03&simHour=15
 * 개발 환경이거나 FISHING_SIM_ENABLED=1 일 때만 켜진다 (운영에서 사용자가 가짜 예보를 보지 않도록).
 */
export function simEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.FISHING_SIM_ENABLED === "1";
}

export interface SimQuery {
  sim?: string;
  simDate?: string;
  simHour?: string;
}

const hh = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return String(Number.isFinite(n) && v !== "" && v != null ? Math.max(0, Math.min(23, Math.floor(n))) : fallback).padStart(2, "0");
};

export function ctxFrom(q: SimQuery, mulddae?: MulddaeSystem): Ctx {
  const base: Ctx = { now: new Date(), mulddae };
  if (!simEnabled()) return base;
  const sim: ScenarioId | undefined = isScenario(q.sim) ? q.sim : undefined;
  let now = base.now;
  if (q.simDate && /^\d{4}-\d{2}-\d{2}$/.test(q.simDate)) {
    now = new Date(`${q.simDate}T${hh(q.simHour, 12)}:00:00+09:00`);
  } else if (q.simHour) {
    const d = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    now = new Date(`${d}T${hh(q.simHour, 12)}:00:00+09:00`);
  }
  return { now, sim, mulddae };
}

/** 링크에 붙일 시뮬레이션 쿼리 (없으면 빈 문자열) */
export function simQueryString(q: SimQuery): string {
  if (!simEnabled()) return "";
  const u = new URLSearchParams();
  if (isScenario(q.sim)) u.set("sim", q.sim);
  if (q.simDate) u.set("simDate", q.simDate);
  if (q.simHour) u.set("simHour", q.simHour);
  return u.toString();
}

export function isSimActive(q: SimQuery): boolean {
  return simEnabled() && (isScenario(q.sim) || !!q.simDate || !!q.simHour);
}

export function simLabel(q: SimQuery): string {
  const parts: string[] = [];
  if (isScenario(q.sim)) parts.push(SCENARIOS[q.sim]);
  if (q.simDate || q.simHour) parts.push(`가상 시각 ${q.simDate ?? "오늘"} ${hh(q.simHour, 12)}시`);
  return parts.join(" · ");
}
