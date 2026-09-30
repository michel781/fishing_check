import { describe, expect, it } from "vitest";
import { RIG_SPECS } from "@/data/rigSpecs";
import { FISH_SHAPE, makeScript } from "./scripts";

describe("캐스팅 애니메이션 대본", () => {
  for (const [id, spec] of Object.entries(RIG_SPECS)) {
    it(`${id} (${spec.motion}): 모든 순간의 위치가 화면 안의 유한한 값`, () => {
      const s = makeScript(spec.motion, spec.dims, FISH_SHAPE[id] ?? "fish");
      expect(s.duration).toBeGreaterThan(8);
      expect(s.duration).toBeLessThan(20);
      // 단계는 시간 순서
      s.phases.forEach((p, i) => i && expect(p.at).toBeGreaterThan(s.phases[i - 1].at));
      expect(s.phases.at(-1)!.at).toBeLessThan(s.duration);
      for (let t = 0; t <= s.duration; t += 0.05) {
        const p = s.pose(t);
        for (const v of [p.rod, p.bend, p.anchor.x, p.anchor.y, p.sag]) expect(Number.isFinite(v), `t=${t}`).toBe(true);
        expect(p.anchor.x).toBeGreaterThan(-5);
        expect(p.anchor.x).toBeLessThan(405);
        expect(p.anchor.y).toBeGreaterThan(-60);
        expect(p.anchor.y).toBeLessThan(262);
        if (p.fish) expect(Number.isFinite(p.fish.x + p.fish.y)).toBe(true);
      }
    });
  }
});
