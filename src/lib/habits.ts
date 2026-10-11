import type { Habit } from "@/data/habits";
import type { Regulation, Species } from "@/lib/types";

/** 평년 기준 달별 날짜 수 */
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const START = DAYS.map((_, i) => DAYS.slice(0, i).reduce((a, b) => a + b, 0));
const doy = (md: string) => {
  const [m, d] = md.split("-").map(Number);
  return START[m - 1] + Math.min(d, DAYS[m - 1]) - 1;
};

export type SeasonCell = "peak" | "on" | null;
export type MarkCell = "main" | "on" | "maybe" | null;
export type ClosedCell = { kind: "full" | "part"; text: string } | null;

/** 제철: 어종 화면 '제철 시기'와 같은 기준 (가장 잘 잡히는 달 / 잡히는 달) */
export function seasonRow(s: Species): SeasonCell[] {
  const peak = Math.max(...s.season);
  return s.season.map((v) => (v >= Math.max(0.85, peak - 0.05) ? "peak" : v >= 0.5 ? "on" : null));
}

/** 산란(출산): 주 산란기 / 산란기 / 간접 근거로 어림한 달 */
export function spawnRow(h: Habit | undefined): MarkCell[] {
  const out: MarkCell[] = Array(12).fill(null);
  const sp = h?.spawn;
  if (!sp) return out;
  for (const m of sp.m) out[m - 1] = sp.sure === false ? "maybe" : sp.main?.includes(m) ? "main" : "on";
  return out;
}

/** 금어기: 달 전체가 걸리면 full, 일부만 걸리면 part(걸리는 날짜를 함께) */
export function closedRow(reg: Regulation | undefined): ClosedCell[] {
  const covered = new Array(365).fill(false);
  for (const c of reg?.closed ?? []) {
    const a = doy(c.from);
    const b = doy(c.to);
    for (let d = a; ; d = (d + 1) % 365) {
      covered[d] = true;
      if (d === b) break;
    }
  }
  return DAYS.map((n, i) => {
    const days = covered.slice(START[i], START[i] + n);
    const k = days.filter(Boolean).length;
    if (!k) return null;
    if (k === n) return { kind: "full", text: `${i + 1}월 전체` };
    const first = days.indexOf(true) + 1;
    const last = days.lastIndexOf(true) + 1;
    return { kind: "part", text: `${i + 1}/${first}~${i + 1}/${last}` };
  });
}

/** 이번 달 상태 요약 (어종 목록·습성 한눈에 표에서 씀) */
export function monthFlags(s: Species, h: Habit | undefined, month: number): { season: SeasonCell; spawn: MarkCell; closed: ClosedCell } {
  return { season: seasonRow(s)[month - 1], spawn: spawnRow(h)[month - 1], closed: closedRow(s.regulation)[month - 1] };
}
