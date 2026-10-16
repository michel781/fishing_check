import { describe, expect, it } from "vitest";
import { BOIL_SIGNS, BOIL_SRC, BOIL_TIPS, boilWindows, hasBoil } from "./boil";
import { getSpecies } from "./species";
import { isClosedSeason } from "@/lib/engine/score";

describe("새떼·보일링", () => {
  it("출처 번호가 모두 있고 모든 출처를 쓴다", () => {
    const used = new Set(BOIL_TIPS.flatMap((t) => t.src));
    for (const i of used) expect(BOIL_SRC[i], String(i)).toBeTruthy();
    expect(used.size).toBe(BOIL_SRC.length);
    expect(new Set(BOIL_SIGNS.map((s) => s.id)).size).toBe(BOIL_SIGNS.length);
  });
  it("가장 확실한 신호는 새떼 내리꽂힘·보일링", () => {
    expect(BOIL_SIGNS.filter((s) => s.level === 3).map((s) => s.id).sort()).toEqual(["boil", "dive"]);
    expect(hasBoil("spanishmackerel")).toBe(true);
    expect(hasBoil("rockfish")).toBe(false);
  });
  it("살필 시간: 해 뜨기 60분 전~뜬 뒤 90분, 해 지기 90분 전~진 뒤 20분", () => {
    const [am, pm] = boilWindows("2026-10-16T06:40:00+09:00", "2026-10-16T17:50:00+09:00");
    expect(new Date(am.start).toISOString()).toBe("2026-10-15T20:40:00.000Z");
    expect((am.end - am.start) / 60e3).toBe(150);
    expect((pm.end - pm.start) / 60e3).toBe(110);
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
