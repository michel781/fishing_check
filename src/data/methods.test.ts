import { describe, expect, it } from "vitest";
import { GENRES } from "./gearTerms";
import { CHOOSER, METHODS, methodsForSpecies } from "./methods";
import { RIGS, rigForSpecies } from "./rigs";
import { SPECIES, getSpecies } from "./species";

describe("낚시 방법", () => {
  it("어종·채비·장르가 모두 실제 데이터를 가리킨다", () => {
    for (const m of METHODS) {
      for (const sp of m.species) expect(getSpecies(sp), `${m.id} ${sp}`).toBeTruthy();
      for (const sp of Object.keys(m.notes ?? {})) expect(m.species, `${m.id} note ${sp}`).toContain(sp);
      for (const r of m.rigs) expect(RIGS.some((x) => x.id === r), `${m.id} ${r}`).toBe(true);
      if (m.genre) expect(GENRES.some((g) => g.id === m.genre), m.genre).toBe(true);
    }
  });

  it("모든 어종이 적어도 한 방법에 들어 있고, 어종의 대표 채비를 쓰는 방법에 들어 있다", () => {
    for (const s of SPECIES) {
      const ms = methodsForSpecies(s.id);
      expect(ms.length, s.id).toBeGreaterThan(0);
      const rig = rigForSpecies(s.id);
      if (rig) expect(ms.some((m) => m.rigs.includes(rig.id)), `${s.id} ${rig.id}`).toBe(true);
    }
  });

  it("사용자 자료의 대표 어종이 그 방법에 들어 있다", () => {
    const has = (id: string, sps: string[]) => sps.forEach((sp) => expect(METHODS.find((m) => m.id === id)!.species, `${id} ${sp}`).toContain(sp));
    has("surf", ["rockfish", "dodari", "righteye", "conger"]);
    has("lure", ["flatfish", "seabass", "squid-bigfin", "webfoot"]);
    has("float", ["blackporgy", "opaleye", "redseabream", "mackerel", "halfbeak"]);
    has("boat", ["webfoot", "cuttlefish", "hairtail", "rockfish"]);
  });

  it("훌치기는 방법 안내 없이 규정·위험만, 출처와 함께", () => {
    const snag = METHODS.find((m) => m.id === "snag")!;
    expect(snag.how).toHaveLength(0);
    expect(snag.species).toHaveLength(0);
    expect(snag.facts!.length).toBeGreaterThan(0);
    for (const f of snag.facts!) for (const [, u] of f.src) expect(u).toMatch(/^https:\/\//);
    expect(methodsForSpecies("mullet").some((m) => m.id === "snag")).toBe(false);
  });

  it("'이런 분께'는 훌치기를 추천하지 않는다", () => {
    expect(CHOOSER.some((c) => c.id === "snag")).toBe(false);
    expect(new Set(CHOOSER.map((c) => c.id)).size).toBe(CHOOSER.length);
  });
});
