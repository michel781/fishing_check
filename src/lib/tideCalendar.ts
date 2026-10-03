import { lunarDay, mulddae, type MulddaeSystem } from "@/lib/engine/astro";
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
