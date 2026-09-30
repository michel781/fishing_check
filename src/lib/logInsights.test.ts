import { describe, expect, it } from "vitest";
import type { LogEntry } from "@/lib/localStore";
import { insights, slotOf } from "./logInsights";

const e = (id: string, kst: string, count: number, spotId = "a", speciesId = "rockfish", inGolden?: boolean): LogEntry => ({
  id, spotId, speciesId, time: new Date(`${kst}+09:00`).toISOString(), count, maxCm: null, memo: "",
  predicted: inGolden == null ? null : { score: 70, grade: "GOOD", inGolden },
});

describe("내 낚시 분석", () => {
  it("시간대 구분 (KST)", () => {
    expect(slotOf(new Date("2026-10-01T05:00:00+09:00").toISOString()).label).toBe("새벽");
    expect(slotOf(new Date("2026-10-01T18:30:00+09:00").toISOString()).label).toBe("해질녘");
    expect(slotOf(new Date("2026-10-01T02:00:00+09:00").toISOString()).label).toBe("밤");
  });
  it("어종·포인트·시간대·황금타임 비교", () => {
    const r = insights([
      e("1", "2026-10-01T18:00:00", 6, "a", "rockfish", true),
      e("2", "2026-10-02T18:30:00", 4, "a", "rockfish", true),
      e("3", "2026-10-03T12:00:00", 1, "b", "mackerel", false),
      e("4", "2026-10-04T13:00:00", 0, "b", "mackerel", false),
    ]);
    expect(r.topSpecies).toEqual({ id: "rockfish", count: 10 });
    expect(r.topSpot).toEqual({ id: "a", count: 10 });
    expect(r.bestSlot).toMatchObject({ label: "해질녘", avg: 5, trips: 2 });
    expect(r.golden).toEqual({ inAvg: 5, outAvg: 0.5, inTrips: 2, outTrips: 2 });
    expect(r.zeroTrips).toBe(1);
  });
  it("기록 없으면 비어 있음", () => {
    expect(insights([])).toMatchObject({ trips: 0, topSpecies: null, bestSlot: null, golden: null });
  });
});
