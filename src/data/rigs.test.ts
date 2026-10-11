import { describe, expect, it } from "vitest";
import { termById } from "./gearTerms";
import { getGuide } from "./guides";
import { getRigSpec } from "./rigSpecs";
import { pickRigs, RIGS, rigForSpecies } from "./rigs";
import { SPECIES } from "./species";

describe("채비 도감", () => {
  it("모든 어종이 정확히 하나의 채비에 속하고, 채비 그림 종류가 어종 화면과 같다", () => {
    for (const s of SPECIES) {
      const owners = RIGS.filter((r) => r.species.includes(s.id));
      expect(owners.map((r) => r.id), s.id).toHaveLength(1);
      expect(owners[0].diagram.kind, s.id).toBe(getGuide(s.id)!.rig.kind);
    }
  });
  it("어종 화면 그림의 변형(전유동·유동 봉돌·오징어 뿔)이 도감과 같다", () => {
    for (const id of ["opaleye", "rockbream", "squid"]) {
      expect(getRigSpec(id)?.variant, id).toBe(rigForSpecies(id)!.diagram.variant);
    }
  });
  it("구성 부품의 용어 연결이 모두 장비·용어 사전에 있다", () => {
    for (const r of RIGS) for (const p of r.parts) if (p.term) expect(termById(p.term), `${r.id} ${p.term}`).toBeTruthy();
  });
  it("대표 어종이 없는 채비는 언제 쓰는지 적혀 있다", () => {
    for (const r of RIGS) if (!r.species.length) expect(r.useFor, r.id).toBeTruthy();
  });
  it("채비 고르기: 백사장 + 바닥 + 생미끼면 원투 가지채비가 나오고, 조건이 없으면 전부", () => {
    expect(pickRigs({ place: "백사장", layer: "바닥", bait: "생미끼" }).map((r) => r.id)).toContain("surf-branch");
    expect(pickRigs({})).toHaveLength(RIGS.length);
    const easy = pickRigs({ place: "배" });
    for (let i = 1; i < easy.length; i++) expect(easy[i - 1].level).toBeLessThanOrEqual(easy[i].level);
  });
});
