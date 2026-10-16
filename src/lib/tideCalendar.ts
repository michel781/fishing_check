import { lunarDay, moonPhasesBetween, mulddae, springness, type MulddaeSystem } from "@/lib/engine/astro";
import { addDays } from "@/lib/dates";
import type { TideExtreme } from "@/lib/types";

/**
 * 물때표 (순수 함수, 테스트 대상).
 *  - mulCalendar: 날짜마다 음력·물때·사리 정도 (천문 계산만 쓰므로 한 달 앞까지 가능)
 *  - nextPhase: 다음 사리·조금이 언제인지
 *  - floodWindows: 낮 시간 안의 들물 구간 (직전 간조 → 다음 만조)
 */

export type MulKind = "사리" | "조금" | "중간";

export interface MulDay {
  date: string;
  lunarDay: number;
  label: string;
  /** 0(조금)~1(사리) */
  springness: number;
  kind: MulKind;
}

const kindOf = (s: number): MulKind => (s >= 0.8 ? "사리" : s <= 0.2 ? "조금" : "중간");

export function mulDay(date: string, system: MulddaeSystem): MulDay {
  const noon = new Date(`${date}T12:00:00+09:00`);
  const m = mulddae(noon, system);
  return { date, lunarDay: lunarDay(noon), label: m.label, springness: Math.round(m.springness * 100) / 100, kind: kindOf(m.springness) };
}

export function mulCalendar(from: string, days: number, system: MulddaeSystem): MulDay[] {
  return Array.from({ length: days }, (_, i) => mulDay(addDays(from, i), system));
}

export interface MonthCell extends MulDay {
  day: number;
  /** 0=일 … 6=토 */
  weekday: number;
  /** 이날 든 삭(그믐 달)·망(보름달) */
  moon?: "삭" | "망";
  /** 음력 달이 29일이라 건너뛴 물때 이름 (이날 바로 앞) */
  skipped?: string;
}

export interface MulMonth {
  ym: string;
  year: number;
  month: number;
  blanks: number;
  cells: MonthCell[];
  prev: string;
  next: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const ymOf = (date: string) => date.slice(0, 7);
export function shiftYm(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}
export const isYm = (v: string | undefined): v is string => !!v && /^(20\d{2})-(0[1-9]|1[0-2])$/.test(v);

/** 한 달 물때 달력 (일요일 시작). 날마다 물때 이름·음력·사리 정도, 삭·망, 건너뛴 물때 */
export function mulMonth(ym: string, system: MulddaeSystem): MulMonth {
  const [year, month] = ym.split("-").map(Number);
  const n = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const first = `${ym}-01`;
  const start = Date.parse(`${first}T00:00:00+09:00`);
  const moons = new Map<string, "삭" | "망">();
  for (const p of moonPhasesBetween(new Date(start), new Date(start + n * 86400e3)))
    moons.set(new Date(p.at.getTime() + 9 * 3600e3).toISOString().slice(0, 10), p.kind);
  const before = mulddae(new Date(start - 12 * 3600e3), system).index;
  let prevIdx = before;
  const cells = Array.from({ length: n }, (_, i): MonthCell => {
    const date = `${ym}-${pad(i + 1)}`;
    const md = mulDay(date, system);
    const idx = mulddae(new Date(`${date}T12:00:00+09:00`), system).index;
    const gap = (idx - prevIdx + 15) % 15;
    prevIdx = idx;
    const skippedIdx = gap === 2 ? (idx + 14) % 15 : null;
    return {
      ...md,
      day: i + 1,
      weekday: (leadingBlanks(first) + i) % 7,
      moon: moons.get(date),
      skipped: skippedIdx == null ? undefined : mulLabels(system)[skippedIdx],
    };
  });
  return { ym, year, month, blanks: leadingBlanks(first), cells, prev: shiftYm(ym, -1), next: shiftYm(ym, 1) };
}

/** 물때 이름 15개 (1물부터 센 순서) */
export function mulLabels(system: MulddaeSystem): string[] {
  // 음력 날짜에 고정이라, 1물이 되는 날부터 15일을 차례로 계산하면 이름 순서가 나온다
  const base = Date.parse("2026-02-26T12:00:00+09:00"); // 음력 1/10 = 7물때식 1물
  const startOffset = system === 7 ? 0 : -1;
  return Array.from({ length: 15 }, (_, i) => mulddae(new Date(base + (startOffset + i) * 86400e3), system).label);
}

/**
 * 물때 이름별 평균 물 차이(사리 정도 0~1) — 2년치 날마다 계산해 평균.
 * 숫자가 커진다고 물이 계속 세지는 게 아니라 7·8물 무렵을 지나며 다시 약해지는 걸 보여 준다.
 */
const cycleCache = new Map<MulddaeSystem, { label: string; s: number }[]>();
export function mulCycle(system: MulddaeSystem): { label: string; s: number }[] {
  const hit = cycleCache.get(system);
  if (hit) return hit;
  const sum = new Array(15).fill(0);
  const cnt = new Array(15).fill(0);
  const t0 = Date.parse("2026-01-01T12:00:00+09:00");
  for (let i = 0; i < 730; i++) {
    const d = new Date(t0 + i * 86400e3);
    const { index } = mulddae(d, system);
    sum[index] += springness(d);
    cnt[index]++;
  }
  const labels = mulLabels(system);
  const out = labels.map((label, i) => ({ label, s: Math.round((sum[i] / Math.max(1, cnt[i])) * 100) / 100 }));
  cycleCache.set(system, out);
  return out;
}

/** 달력에서 처음 나오는 그 단계의 날 (오늘이 이미 그 단계면 오늘) */
export function nextPhase(cal: MulDay[], kind: Exclude<MulKind, "중간">): MulDay | null {
  return cal.find((d) => d.kind === kind) ?? null;
}

export interface FloodWindow {
  start: string;
  end: string;
  /** 이 들물 동안 오르는 물 높이 cm */
  riseCm: number;
}

/**
 * [fromMs, toMs) 안에 걸친 들물 구간. 간조 → 만조 쌍을 찾아 범위로 자른다.
 * 낮 낚시라면 from=일출 1시간 전, to=일몰 1시간 뒤처럼 넘기면 된다.
 */
export function floodWindows(extremes: TideExtreme[], fromMs: number, toMs: number): FloodWindow[] {
  const ex = [...extremes].sort((a, b) => a.time.localeCompare(b.time));
  const out: FloodWindow[] = [];
  for (let i = 0; i < ex.length - 1; i++) {
    const lo = ex[i];
    const hi = ex[i + 1];
    if (lo.type !== "LOW" || hi.type !== "HIGH") continue;
    const s = Math.max(Date.parse(lo.time), fromMs);
    const e = Math.min(Date.parse(hi.time), toMs);
    if (e - s < 30 * 60e3) continue;
    out.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString(), riseCm: Math.round(hi.cm - lo.cm) });
  }
  return out;
}

/** 달력 칸 배치: from이 속한 주의 일요일부터 시작하도록 앞에 빈칸 수 */
export function leadingBlanks(from: string): number {
  return new Date(`${from}T12:00:00+09:00`).getUTCDay();
}
