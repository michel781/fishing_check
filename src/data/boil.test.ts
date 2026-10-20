import { describe, expect, it } from "vitest";
import { BOIL_SIGNS, BOIL_SRC, BOIL_TIPS, PHASE_SRC, TIDE_FIT, hasBoil, pelagicPhases, phaseTide } from "./boil";
import { getSpecies } from "./species";
import { isClosedSeason } from "@/lib/engine/score";

describe("새떼·보일링", () => {
  it("출처 번호가 모두 있고 모든 출처를 쓴다", () => {
    const used = new Set([...BOIL_TIPS.flatMap((t) => t.src), ...BOIL_SIGNS.flatMap((s) => s.src), ...PHASE_SRC]);
    for (const i of used) expect(BOIL_SRC[i], String(i)).toBeTruthy();
    expect(used.size).toBe(BOIL_SRC.length);
    expect(new Set(BOIL_SIGNS.map((s) => s.id)).size).toBe(BOIL_SIGNS.length);
  });
  it("가장 확실한 신호: 갈매기 다이빙·보일링·라이징·쫓기는 베이트볼. 가마우지는 포식어 증거가 아님", () => {
    expect(BOIL_SIGNS.filter((s) => s.level === 3).map((s) => s.id).sort()).toEqual(["boil", "dive", "flee", "rise"]);
    const corm = BOIL_SIGNS.find((s) => s.id === "cormorant")!;
    expect(corm.level).toBeLessThan(3);
    expect(BOIL_SIGNS.some((s) => s.means.includes("100%") && !s.means.includes("100%는 아니"))).toBe(false);
    for (const id of ["spanishmackerel", "mackerel", "yellowtail"]) expect(hasBoil(id)).toBe(true);
    expect(hasBoil("rockfish")).toBe(false);
  });
  it("시간대: 해 뜨기 30분 전~뜬 뒤 2시간 / 10~16시(피딩과 안 겹치게) / 해 지기 2시간 전~진 뒤 30분", () => {
    const [am, day, pm] = pelagicPhases("2026-10-20T06:43:00+09:00", "2026-10-20T17:45:00+09:00");
    expect(new Date(am.start).toISOString()).toBe("2026-10-19T21:13:00.000Z");
    expect((am.end - am.start) / 60e3).toBe(150);
    expect(new Date(day.start).toISOString()).toBe("2026-10-20T01:00:00.000Z");
    expect(new Date(day.end).toISOString()).toBe("2026-10-20T06:45:00.000Z"); // 해 지기 2시간 전(15:45)에서 끊김
    expect((pm.end - pm.start) / 60e3).toBe(150);
    // 겨울: 해 지기 2시간 전이 16시보다 이르면 낮 구간이 그만큼 짧아진다
    const w = pelagicPhases("2026-12-20T07:40:00+09:00", "2026-12-20T17:15:00+09:00");
    expect(new Date(w[1].end).toISOString()).toBe("2026-12-20T06:15:00.000Z");
  });
  it("물때 궁합: 중들물·끝들물이 가장 좋고 간조·끝썰물은 어렵다", () => {
    expect(TIDE_FIT.중들물).toBe(2);
    expect(TIDE_FIT.간조).toBe(0);
    const t0 = Date.parse("2026-10-20T06:00:00+09:00");
    const rows = [["초들물", 0], ["중들물", 1], ["끝들물", 2], ["만조", 3]].map(([stage, h]) => ({ time: new Date(t0 + (h as number) * 3600e3).toISOString(), stage: stage as keyof typeof TIDE_FIT }));
    const r = phaseTide(rows, t0, t0 + 2.5 * 3600e3);
    expect(r.fit).toBe(2);
    expect(r.stages).toEqual(["초들물", "중들물", "끝들물"]);
    expect(r.best[0]).toBe(rows[1].time);
  });
  it("삼치·감성돔 금어기 5/1~5/31", () => {
    const may = new Date("2026-05-15T12:00:00+09:00");
    const jun = new Date("2026-06-01T12:00:00+09:00");
    for (const id of ["spanishmackerel", "blackporgy"]) {
      expect(isClosedSeason(getSpecies(id)!, may), id).toBe(true);
      expect(isClosedSeason(getSpecies(id)!, jun), id).toBe(false);
    }
  });
});
