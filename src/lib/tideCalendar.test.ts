import { describe, expect, it } from "vitest";
import type { TideExtreme } from "@/lib/types";
import { floodWindows, isYm, leadingBlanks, mulCalendar, nextPhase, mulCycle, mulLabels, mulMonth, shiftYm } from "./tideCalendar";

const H = 3600e3;
const day0 = Date.parse("2026-10-02T00:00:00+09:00");
const ex: TideExtreme[] = [
  { time: new Date(day0 + 2 * H).toISOString(), cm: 50, type: "LOW" },
  { time: new Date(day0 + 8.2 * H).toISOString(), cm: 750, type: "HIGH" },
  { time: new Date(day0 + 14.4 * H).toISOString(), cm: 80, type: "LOW" },
  { time: new Date(day0 + 20.6 * H).toISOString(), cm: 720, type: "HIGH" },
];

describe("물때 달력", () => {
  const cal = mulCalendar("2026-10-03", 30, 7);
  it("30일 동안 사리·조금이 각각 두 번씩 돌아온다", () => {
    expect(cal).toHaveLength(30);
    const starts = (k: string) => cal.filter((d, i) => d.kind === k && cal[i - 1]?.kind !== k).length;
    expect(starts("사리")).toBeGreaterThanOrEqual(2);
    expect(starts("조금")).toBeGreaterThanOrEqual(2);
  });
  it("7물때식: 음력 8·23일은 조금, 1·16일은 7물", () => {
    for (const d of cal) {
      if (d.lunarDay === 8 || d.lunarDay === 23) expect(d.label).toBe("조금");
      if (d.lunarDay === 1 || d.lunarDay === 16) expect(d.label).toBe("7물");
    }
  });
  it("8물때식은 7물때식보다 하루 앞서 센다", () => {
    const c8 = mulCalendar("2026-10-03", 30, 8);
    const i = c8.findIndex((d) => d.lunarDay === 1);
    expect(c8[i].label).toBe("8물");
  });
  it("다음 사리·조금", () => {
    const s = nextPhase(cal, "사리")!;
    expect(s.springness).toBeGreaterThanOrEqual(0.8);
    expect(nextPhase(cal, "조금")!.springness).toBeLessThanOrEqual(0.2);
  });
  it("달력은 일요일부터", () => {
    expect(leadingBlanks("2026-10-04")).toBe(0); // 일요일
    expect(leadingBlanks("2026-10-03")).toBe(6); // 토요일
  });
});

describe("낮 들물 구간", () => {
  it("간조→만조 쌍을 범위로 자른다", () => {
    const w = floodWindows(ex, day0 + 6 * H, day0 + 19 * H);
    expect(w).toHaveLength(2);
    expect(Date.parse(w[0].start)).toBe(day0 + 6 * H);
    expect(Date.parse(w[0].end)).toBe(day0 + 8.2 * H);
    expect(w[0].riseCm).toBe(700);
    expect(Date.parse(w[1].start)).toBe(day0 + 14.4 * H);
    expect(Date.parse(w[1].end)).toBe(day0 + 19 * H);
  });
  it("30분보다 짧게 걸치면 뺀다", () => {
    expect(floodWindows(ex, day0 + 8 * H, day0 + 14.6 * H)).toHaveLength(0);
  });
});

describe("한 달 물때 달력", () => {
  it("2026년 11월(8물때식): 일요일 시작, 첨부 달력과 같은 이름, 11/9 삭·7물 건너뜀, 11/24 망", () => {
    const m = mulMonth("2026-11", 8);
    expect(m.blanks).toBe(0);
    expect(m.cells).toHaveLength(30);
    expect(m.cells.slice(0, 3).map((c) => c.label)).toEqual(["14물", "조금", "1물"]);
    expect(m.cells[8]).toMatchObject({ day: 9, label: "8물", moon: "삭", skipped: "7물" });
    expect(m.cells[23]).toMatchObject({ day: 24, label: "8물", moon: "망" });
    expect(m.cells.filter((c) => c.skipped)).toHaveLength(1);
    expect(m.cells[6].weekday).toBe(6);
    expect([m.prev, m.next]).toEqual(["2026-10", "2026-12"]);
  });
  it("물때 이름 순서: 서해는 무시, 남·동해는 14물", () => {
    expect(mulLabels(7).slice(-3)).toEqual(["13물", "조금", "무시"]);
    expect(mulLabels(8).slice(-3)).toEqual(["13물", "14물", "조금"]);
  });
  it("물 차이는 7·8물 무렵을 지나 가장 크고, 조금 무렵 가장 작다", () => {
    for (const sys of [7, 8] as const) {
      const c = mulCycle(sys);
      const top = c.reduce((a, b) => (b.s > a.s ? b : a));
      const low = c.reduce((a, b) => (b.s < a.s ? b : a));
      const n = (l: string) => Number(l.replace("물", ""));
      expect(n(top.label)).toBeGreaterThanOrEqual(sys);
      expect(n(top.label)).toBeLessThanOrEqual(sys + 3);
      expect(["조금", "무시", "1물", "2물"]).toContain(low.label);
    }
  });
  it("달 이동·형식 검사", () => {
    expect(shiftYm("2026-12", 1)).toBe("2027-01");
    expect(shiftYm("2026-01", -1)).toBe("2025-12");
    expect(isYm("2026-11")).toBe(true);
    expect(isYm("2026-13")).toBe(false);
    expect(isYm(undefined)).toBe(false);
  });
});
