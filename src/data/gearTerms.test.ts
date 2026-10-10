import { describe, expect, it } from "vitest";
import { ROD_PARTS, RIG_PARTS } from "@/components/GearAnatomy";
import { CATS, FLOW, GENRES, TERMS } from "./gearTerms";
import { getSpecies } from "./species";
import { getGuide } from "./guides";

const ids = new Set(TERMS.map((t) => t.id));

describe("장비·용어 사전", () => {
  it("id가 겹치지 않고 모든 분류에 항목이 있다", () => {
    expect(ids.size).toBe(TERMS.length);
    for (const c of CATS) expect(TERMS.some((t) => t.cat === c.id), c.id).toBe(true);
  });
  it("함께 쓰는 용어·그림 번호·6단계·장르가 모두 있는 항목을 가리킨다", () => {
    const refs = [
      ...TERMS.flatMap((t) => t.related ?? []),
      ...FLOW.flatMap((f) => f.terms),
      ...GENRES.flatMap((g) => g.terms),
      ...ROD_PARTS.map((p) => p[1]),
      ...RIG_PARTS.map((p) => p[1]),
    ];
    for (const r of refs) expect(ids.has(r), r).toBe(true);
  });
  it("사용자 자료의 핵심 용어가 모두 들어 있다", () => {
    const names = TERMS.map((t) => `${t.name} ${t.aka ?? ""}`).join(" ");
    for (const w of ["원투 낚싯대", "루어 낚싯대", "찌 낚싯대", "선상 낚싯대", "스피닝 릴", "베이트릴", "백래시", "원줄", "목줄", "채비", "봉돌", "찌", "노싱커", "도래", "낚시바늘", "밑밥통", "집게", "두레박", "구명조끼"])
      expect(names, w).toContain(w);
  });
  it("장르별 대표 어종이 있고, 장르 채비가 그 어종의 채비 종류와 맞다", () => {
    const fit: Record<string, string[]> = { surf: ["bottom"], float: ["float"], lure: ["jighead", "egi", "lure"], card: ["sabiki"], boat: ["bottom", "downshot", "tairaba", "egi", "sabiki", "lure"] };
    for (const g of GENRES)
      for (const sp of g.species) {
        expect(getSpecies(sp), sp).toBeTruthy();
        expect(fit[g.id], `${g.id} ${sp}`).toContain(getGuide(sp)!.rig.kind);
      }
  });
});
