import { describe, expect, it } from "vitest";
import type { HourScore } from "@/lib/types";
import { biteLevel, buildBite, envBlocks, rankAt } from "./bite";

const H = 3600e3;
const base = Date.parse("2026-10-01T09:00:00Z");
const hrs = (f: (i: number) => number, extra: (i: number) => Partial<HourScore> = () => ({})) =>
  Array.from({ length: 60 }, (_, i) => ({
    time: new Date(base + i * H).toISOString(),
    score: f(i),
    safety: "OK",
    sub: { wind: 0.8, wave: 0.8, pressure: 0.8, tide: 0.5, temp: 0.5, light: 0.5, spot: 0.5 },
    ...extra(i),
  })) as HourScore[];

describe("입질 지수 단계", () => {
  it("70·50·30 기준", () => {
    expect([90, 70, 69, 50, 49, 30, 29, 0].map(biteLevel)).toEqual(["좋음", "좋음", "보통", "보통", "나쁨", "나쁨", "희박", "희박"]);
  });
});

describe("타임라인", () => {
  const t = buildBite(
    [
      { id: "mackerel", name: "고등어", closed: false, hours: hrs((i) => (i === 3 ? 85 : 40)) },
      { id: "conger", name: "붕장어", closed: false, hours: hrs(() => 60, (i) => (i === 5 ? { safety: "DANGER" } : {})) },
      { id: "dodari", name: "도다리", closed: true, hours: hrs(() => 90) },
    ],
    base + 20 * 60e3, // 정시로 내림
    48,
  );
  it("지금(정시)부터 48시간", () => {
    expect(t.times).toHaveLength(48);
    expect(t.times[0]).toBe(new Date(base).toISOString());
  });
  it("위험한 시간·금어기는 0점", () => {
    expect(t.species[1].scores[5]).toBe(0);
    expect(t.species[2].scores.every((v) => v === 0)).toBe(true);
    expect(t.danger[5]).toBe(true);
    expect(t.env[5]).toBe(0);
  });
  it("시각을 옮기면 순위가 바뀐다", () => {
    expect(rankAt(t, 3).map((r) => r.name)).toEqual(["고등어", "붕장어", "도다리"]);
    expect(rankAt(t, 0).map((r) => r.name)).toEqual(["붕장어", "고등어", "도다리"]);
    expect(rankAt(t, 0, "name").map((r) => r.name)).toEqual(["고등어", "도다리", "붕장어"]);
  });
  it("환경은 3시간 묶음, 위험 시간이 끼면 위험", () => {
    const b = envBlocks(t);
    expect(b).toHaveLength(16);
    expect(b[0]).toMatchObject({ from: 0, to: 3, level: "좋음", avg: 80 });
    expect(b[1].level).toBe("위험");
  });
});
