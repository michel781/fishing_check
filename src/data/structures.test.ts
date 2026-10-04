import { describe, expect, it } from "vitest";
import { CEPHALOPODS, HARBOR_NOTES, SOURCES, STRUCTURES, TYPE_STRUCTURES } from "./structures";
import { getSpecies } from "./species";
import { getSpot, SPOTS } from "./spots";

describe("구조물별 서식 데이터", () => {
  const ids = new Set(STRUCTURES.map((s) => s.id));
  it("요청한 10개 환경이 모두 있고 근거가 붙어 있다", () => {
    expect(STRUCTURES).toHaveLength(10);
    for (const s of STRUCTURES) {
      expect(s.evidence.length, s.id).toBeGreaterThan(0);
      // 문헌이 없으면 근거 종류는 추론뿐이어야 한다
      if (!s.sources.length) expect(s.evidence.every((e) => e.kind === "추론"), s.id).toBe(true);
    }
  });
  it("참조한 출처·어종·구조물 id가 모두 있다", () => {
    const refs = [...STRUCTURES.flatMap((s) => s.sources), ...CEPHALOPODS.flatMap((c) => c.sources), ...Object.values(HARBOR_NOTES).flatMap((h) => h.confirmed.map((c) => c.source))];
    for (const r of refs) expect(SOURCES[r], r).toBeTruthy();
    for (const s of STRUCTURES) for (const f of s.fish) if (f.id) expect(getSpecies(f.id), f.id).toBeTruthy();
    for (const list of Object.values(TYPE_STRUCTURES)) for (const id of list) expect(ids.has(id), id).toBe(true);
    for (const sp of SPOTS) for (const id of sp.structures ?? []) expect(ids.has(id as never), `${sp.id} ${id}`).toBe(true);
  });
  it("세 항구가 낚시터로 있고, 좌표는 대략값으로 표시된다", () => {
    for (const id of Object.keys(HARBOR_NOTES)) {
      const s = getSpot(id);
      expect(s, id).toBeTruthy();
      expect(s!.approx).toBe(true);
      expect(s!.type).toBe("INNER_HARBOR");
    }
  });
  it("문어·오징어류는 현재 장비로 권하지 않는다", () => {
    expect(CEPHALOPODS.every((c) => c.fit !== "적합")).toBe(true);
  });
});
