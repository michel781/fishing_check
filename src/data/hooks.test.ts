import { describe, expect, it } from "vitest";
import { HOOKS, hookSpec, lineSpec } from "./hooks";
import { seaImportance, tidalRangeBySea } from "./sea";
import { SPECIES } from "./species";

describe("바늘 고르기", () => {
  it("모든 어종에 바늘 정보와 실제 규격(어종 화면과 같은 값)이 있다", () => {
    for (const s of SPECIES) {
      expect(HOOKS[s.id], s.id).toBeTruthy();
      expect(hookSpec(s.id).length, `${s.id} 바늘 규격`).toBeGreaterThan(0);
      expect(lineSpec(s.id).length, `${s.id} 줄 규격`).toBeGreaterThan(0);
    }
  });
  it("에기·뿔 어종은 갈고리로 분류된다", () => {
    for (const id of ["webfoot", "cuttlefish", "squid-bigfin", "octopus", "squid"]) expect(HOOKS[id].kind, id).toBe("갈고리(에기·뿔)");
  });
});

describe("바다 이해하기", () => {
  it("사리 조차: 서해 > 남해 > 동해", () => {
    const r = tidalRangeBySea();
    const max = (s: "WEST" | "SOUTH" | "EAST") => r[s][0].m;
    expect(max("WEST")).toBeGreaterThan(max("SOUTH"));
    expect(max("SOUTH")).toBeGreaterThan(max("EAST"));
    expect(max("EAST")).toBeLessThan(1);
  });
  it("점수 비중: 합이 약 100%, 물때는 서해가 가장 크고 동해가 가장 작다", () => {
    for (const s of ["WEST", "SOUTH", "EAST"] as const) {
      const sum = seaImportance(s).reduce((a, x) => a + x.pct, 0);
      expect(Math.abs(sum - 100)).toBeLessThanOrEqual(2);
    }
    const tide = (s: "WEST" | "SOUTH" | "EAST") => seaImportance(s).find((x) => x.key === "tide")!.pct;
    expect(tide("WEST")).toBeGreaterThan(tide("SOUTH"));
    expect(tide("SOUTH")).toBeGreaterThan(tide("EAST"));
  });
});
