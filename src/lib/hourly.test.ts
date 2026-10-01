import { describe, expect, it } from "vitest";
import type { HourScore } from "@/lib/types";
import { SLOTS, slotOfHour, slotRange, slotTop, strongSpecies, type HourlyCandidate } from "./hourly";

const H = 3600e3;
const hrs = (dateKst: string, f: (kstHour: number) => number, extra: (kstHour: number) => Partial<HourScore> = () => ({})): HourScore[] =>
  Array.from({ length: 30 }, (_, i) => {
    const t = Date.parse(`${dateKst}T00:00:00+09:00`) + i * H;
    const k = i % 24;
    return { time: new Date(t).toISOString(), score: f(i), available: true, safety: "OK", reasons: [{ label: "들물", effect: 1 }], ...extra(k) } as HourScore;
  });
const cand = (id: string, sp: HourlyCandidate["species"]): HourlyCandidate => ({ spot: { id, name: id, area: "x", sea: "WEST", type: "OUTER_HARBOR" }, species: sp });

describe("시간대", () => {
  it("6개 시간대가 하루(04~다음날 04시)를 빈틈없이 덮는다", () => {
    for (let i = 1; i < SLOTS.length; i++) expect(SLOTS[i].from).toBe(SLOTS[i - 1].to);
    expect(SLOTS[0].from).toBe(4);
    expect(SLOTS.at(-1)!.to).toBe(28);
  });
  it("시각 → 시간대 (자정~새벽 4시는 심야)", () => {
    expect(slotOfHour(5).id).toBe("dawn");
    expect(slotOfHour(13).id).toBe("midday");
    expect(slotOfHour(23).id).toBe("night");
    expect(slotOfHour(2).id).toBe("night");
  });
  it("심야는 다음 날 새벽 4시까지", () => {
    const r = slotRange("2026-10-01", SLOTS.find((s) => s.id === "night")!);
    expect(new Date(r.from).toISOString()).toBe("2026-10-01T14:00:00.000Z");
    expect(new Date(r.to).toISOString()).toBe("2026-10-01T19:00:00.000Z");
  });
});

describe("시간대 추천 목록", () => {
  const dawn = slotRange("2026-10-01", SLOTS[0]);
  it("시간대 안에서 가장 좋은 2시간, 포인트당 가장 좋은 어종 하나, 점수 높은 순", () => {
    const list = slotTop(
      [
        cand("A", [
          { id: "rockfish", name: "우럭", hours: hrs("2026-10-01", (h) => (h === 5 || h === 6 ? 80 : 30)) },
          { id: "goby", name: "망둥어", hours: hrs("2026-10-01", () => 60) },
        ]),
        cand("B", [{ id: "conger", name: "붕장어", hours: hrs("2026-10-01", () => 70) }]),
      ],
      dawn,
    );
    expect(list.map((e) => [e.spotId, e.speciesName, e.avg])).toEqual([
      ["A", "우럭", 80],
      ["B", "붕장어", 70],
    ]);
    expect(list[0].start).toBe("2026-09-30T20:00:00.000Z"); // 05:00 KST
    expect(list[0].reasons).toEqual(["들물"]);
  });
  it("위험·배 안 뜨는 시간(available=false)은 빼고 계산", () => {
    const list = slotTop([cand("A", [{ id: "rockfish", name: "우럭", hours: hrs("2026-10-01", () => 90, () => ({ available: false })) }])], dawn);
    expect(list).toEqual([]);
  });
  it("오늘 이미 지난 시간대는 비고, 진행 중이면 지금부터", () => {
    const now = Date.parse("2026-10-01T06:00:00+09:00");
    const c = [cand("A", [{ id: "rockfish", name: "우럭", hours: hrs("2026-10-01", (h) => (h === 4 ? 99 : 50)) }])];
    expect(slotTop(c, dawn, 8, Date.parse("2026-10-01T08:00:00+09:00"))).toEqual([]);
    expect(slotTop(c, dawn, 8, now)).toEqual([]); // 06~07 은 1시간뿐 → 2시간 창 불가
    const morning = slotRange("2026-10-01", SLOTS[1]);
    expect(slotTop(c, morning, 8, Date.parse("2026-10-01T08:30:00+09:00"))[0].start).toBe("2026-09-30T23:00:00.000Z"); // 08:00 부터
  });
  it("강한 어종 집계", () => {
    const e = (sp: string) => ({ speciesId: sp, speciesName: sp }) as never;
    expect(strongSpecies([e("a"), e("b"), e("a")])[0]).toEqual({ id: "a", name: "a", count: 2 });
  });
});
