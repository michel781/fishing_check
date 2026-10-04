import { describe, expect, it } from "vitest";
import { FEEDING } from "@/data/feeding";
import { SPECIES, getSpecies } from "@/data/species";
import { activityByHour, baitFits, dietRows, similarDiet, tempCurve } from "./feeding";

describe("먹이 습성 데이터", () => {
  it("모든 어종에 있고 먹이 비중 합이 100", () => {
    for (const s of SPECIES) {
      const f = FEEDING[s.id];
      expect(f, s.id).toBeTruthy();
      expect(Object.values(f.diet).reduce((a, b) => a + (b ?? 0), 0), s.id).toBe(100);
      expect(Math.max(f.layer.top, f.layer.mid, f.layer.bottom), s.id).toBe(1);
    }
  });
  it("미끼마다 흉내 내는 먹이를 찾는다 (모르는 미끼 없음)", () => {
    for (const s of SPECIES) for (const b of baitFits(s.baits, FEEDING[s.id])) expect(b.kind != null || b.fit === "집어용", `${s.id} ${b.bait}`).toBe(true);
  });
  it("광어 미끼(섀드웜·미꾸라지)는 물고기를 흉내 내서 잘 맞음", () => {
    const f = baitFits(getSpecies("flatfish")!.baits, FEEDING.flatfish);
    expect(f.every((x) => x.kind === "fish" && x.fit === "잘 맞음")).toBe(true);
    expect(dietRows(FEEDING.flatfish)[0].kind).toBe("fish");
  });
});

describe("활동 시계·수온 곡선", () => {
  const d0 = Date.parse("2026-10-04T00:00:00+09:00");
  const sr = d0 + 6.5 * 3600e3;
  const ss = d0 + 18.2 * 3600e3;
  it("볼락은 밤, 학꽁치는 낮에 활발", () => {
    const b = activityByHour(getSpecies("bolak")!, d0, sr, ss);
    const h = activityByHour(getSpecies("halfbeak")!, d0, sr, ss);
    expect(b[22]).toBeGreaterThan(b[12]);
    expect(h[12]).toBeGreaterThan(h[22]);
  });
  it("수온 곡선은 최적 수온에서 1", () => {
    const s = getSpecies("rockfish")!;
    const c = tempCurve(s);
    expect(c.find((x) => x.c === s.temp.opt)!.v).toBe(1);
    expect(c[0].v).toBeLessThanOrEqual(0.2);
  });
  it("먹이가 비슷한 어종: 광어는 물고기를 먹는 어종과 묶인다", () => {
    const sim = similarDiet("flatfish");
    expect(sim).toHaveLength(3);
    expect(sim[0].shared).toBe("fish");
  });
});
