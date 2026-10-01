import { describe, expect, it } from "vitest";
import { SPOTS_BY_ID } from "@/data/spots";
import type { HourScore } from "@/lib/types";
import { evaluateNight, floodWindows, nightCandidates, nightWindow, parkComfort, SEOUL, windChill } from "./night";

const H = 3600e3;
const hour = (iso: string, score: number, over: Partial<HourScore> = {}): HourScore =>
  ({ time: iso, score, safety: "OK", available: true, cond: { windMs: 3, waveM: 0.4, precipMm: 0, airTempC: 12 }, ...over }) as HourScore;
const series = (startIso: string, n: number, f: (i: number) => number, over: (i: number) => Partial<HourScore> = () => ({})) =>
  Array.from({ length: n }, (_, i) => hour(new Date(Date.parse(startIso) + i * H).toISOString(), f(i), over(i)));

describe("밤 시간 창", () => {
  const day = { date: "2026-10-01", sunset: "2026-10-01T09:20:00Z" }; // 18:20 KST
  it("해 질 녘 ~ 다음 날 새벽 3시", () => {
    const w = nightWindow(day, Date.parse("2026-10-01T03:00:00Z"))!;
    expect(new Date(w.from).toISOString()).toBe("2026-10-01T09:20:00.000Z");
    expect(new Date(w.to).toISOString()).toBe("2026-10-01T18:00:00.000Z"); // 10/2 03:00 KST
  });
  it("이미 밤이면 지금부터", () => {
    const now = Date.parse("2026-10-01T13:00:00Z");
    expect(nightWindow(day, now)!.from).toBe(now);
  });
});

describe("들물 구간", () => {
  it("간조 → 만조 중 밤 시간과 겹치는 부분", () => {
    const ex = [
      { time: "2026-10-01T08:00:00Z", cm: 50, type: "LOW" as const },
      { time: "2026-10-01T14:00:00Z", cm: 800, type: "HIGH" as const },
      { time: "2026-10-01T20:00:00Z", cm: 60, type: "LOW" as const },
    ];
    const f = floodWindows(ex, Date.parse("2026-10-01T09:20:00Z"), Date.parse("2026-10-01T18:00:00Z"));
    expect(f).toEqual([{ start: "2026-10-01T09:20:00.000Z", end: "2026-10-01T14:00:00.000Z" }]);
  });
});

describe("체감온도", () => {
  it("춥고 바람 불면 더 낮게, 따뜻하면 그대로", () => {
    expect(windChill(5, 8)!).toBeLessThan(2);
    expect(windChill(18, 8)).toBe(18);
    expect(windChill(null, 3)).toBeNull();
  });
});

describe("오늘 밤 평가", () => {
  const win = { from: Date.parse("2026-10-01T09:00:00Z"), to: Date.parse("2026-10-01T18:00:00Z") };
  const sihwa = SPOTS_BY_ID["sihwa-seawall"];
  const sammok = SPOTS_BY_ID["sammok-wharf"];
  it("가장 좋은 어종의 2시간 창으로 대표", () => {
    const p = evaluateNight(
      sihwa,
      35,
      [
        { speciesId: "rockfish", speciesName: "우럭", hours: series("2026-10-01T06:00:00Z", 14, (i) => (i === 7 || i === 8 ? 80 : 40)) },
        { speciesId: "goby", speciesName: "망둥어", hours: series("2026-10-01T06:00:00Z", 14, () => 55) },
      ],
      [],
      win,
      "all",
    )!;
    expect(p.speciesName).toBe("우럭");
    expect(p.score).toBe(80);
    expect(p.verdict).toBe("GOOD");
    expect(p.best!.start).toBe("2026-10-01T13:00:00.000Z");
  });
  it("밤의 절반 넘게 위험이면 위험", () => {
    const p = evaluateNight(sihwa, 35, [{ speciesId: "rockfish", speciesName: "우럭", hours: series("2026-10-01T09:00:00Z", 9, () => 15, (i) => (i < 6 ? { safety: "DANGER", available: false } : {})) }], [], win, "all")!;
    expect(p.verdict).toBe("DANGER");
  });
  it("원투 방식은 원투 어종만, 가족은 편한 선착장이 위로", () => {
    const sp = [
      { speciesId: "seabass", speciesName: "농어", hours: series("2026-10-01T09:00:00Z", 9, () => 70) },
      { speciesId: "conger", speciesName: "붕장어", hours: series("2026-10-01T09:00:00Z", 9, () => 60) },
    ];
    expect(evaluateNight(sihwa, 35, sp, [], win, "cast")!.speciesName).toBe("붕장어");
    const a = evaluateNight(sihwa, 35, sp, [], win, "family")!;
    const b = evaluateNight(sammok, 45, sp, [], win, "family")!;
    expect(b.rank).toBeGreaterThan(a.rank); // 테트라포드 있는 방조제보다 가로등 밝은 선착장
  });
});

describe("후보·유료 낚시터", () => {
  it("서울 120km 안 밤낚시 포인트에 시화방조제·삼목선착장 포함, 선상 제외", () => {
    const ids = nightCandidates(SEOUL).map((c) => c.spot.id);
    expect(ids).toContain("sihwa-seawall");
    expect(ids).toContain("sammok-wharf");
    expect(nightCandidates(SEOUL).every((c) => c.spot.type !== "BOAT")).toBe(true);
  });
  it("비·강풍이면 궂음", () => {
    expect(parkComfort({ windMax: 13, waveMax: 1, rainMm: 0, feelsMin: 8, airMin: 10 }).level).toBe("궂음");
    expect(parkComfort({ windMax: 3, waveMax: 0.3, rainMm: 0, feelsMin: 14, airMin: 15 }).level).toBe("좋음");
  });
});
