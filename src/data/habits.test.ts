import { describe, expect, it } from "vitest";
import { closedRow, seasonRow, spawnRow } from "@/lib/habits";
import { HABITS, factEvidence } from "./habits";
import { SPECIES, getSpecies } from "./species";

describe("어종 습성 데이터", () => {
  it("모든 어종에 습성 자료가 있고, 습성 자료는 실제 어종만 가리킨다", () => {
    for (const s of SPECIES) expect(HABITS[s.id], s.id).toBeTruthy();
    for (const id of Object.keys(HABITS)) expect(getSpecies(id), id).toBeTruthy();
  });

  it("사실·산란기·움직임의 출처 번호가 모두 출처 목록 안에 있다", () => {
    for (const [id, h] of Object.entries(HABITS)) {
      const refs = [
        ...h.facts.flatMap(([, , src]) => (Array.isArray(src) ? src : [])),
        ...(h.spawn?.src ?? []),
        ...(Array.isArray(h.move?.src) ? h.move!.src : []),
      ];
      for (const r of refs) expect(r >= 0 && r < h.src.length, `${id} [${r}]`).toBe(true);
      // 쓰지 않는 출처가 없다
      for (let i = 0; i < h.src.length; i++) expect(refs.includes(i), `${id} 출처 ${i} 미사용`).toBe(true);
    }
  });

  it("출처는 https/http 주소이고 같은 어종 안에서 겹치지 않는다", () => {
    for (const [id, h] of Object.entries(HABITS)) {
      const urls = h.src.map((x) => x[1]);
      for (const u of urls) expect(u, id).toMatch(/^https?:\/\//);
      expect(new Set(urls).size, id).toBe(urls.length);
    }
  });

  it("산란 달은 1~12이고, 주 산란기는 산란기 안에 있다", () => {
    for (const [id, h] of Object.entries(HABITS)) {
      if (!h.spawn) continue;
      for (const m of h.spawn.m) expect(m >= 1 && m <= 12, id).toBe(true);
      for (const m of h.spawn.main ?? []) expect(h.spawn.m, id).toContain(m);
      expect(h.spawn.src.length, id).toBeGreaterThan(0);
    }
  });

  it("근거 수준은 출처 중 가장 공신력 있는 것을 쓴다", () => {
    const h = HABITS.rockfish;
    expect(factEvidence(h, [1, 0])).toBe("기관");
    expect(factEvidence(h, [2])).toBe("기사");
    expect(factEvidence(h, "현장")).toBe("현장");
    expect(factEvidence(h, [])).toBe("추론");
  });
});

describe("한 해 달력", () => {
  it("금어기: 달 전체 / 일부 / 해를 넘기는 기간", () => {
    const webfoot = closedRow(getSpecies("webfoot")!.regulation); // 05-11 ~ 08-31
    expect(webfoot[4]).toEqual({ kind: "part", text: "5/11~5/31" });
    expect(webfoot[5]?.kind).toBe("full");
    expect(webfoot[7]?.kind).toBe("full");
    expect(webfoot[8]).toBeNull();
    const dodari = closedRow(getSpecies("dodari")!.regulation); // 12-01 ~ 01-31
    expect(dodari[11]?.kind).toBe("full");
    expect(dodari[0]?.kind).toBe("full");
    expect(dodari[1]).toBeNull();
    expect(closedRow(undefined).every((x) => x === null)).toBe(true);
  });

  it("제철은 어종 화면과 같은 기준, 산란은 주 산란기·어림을 구분", () => {
    const rf = getSpecies("rockfish")!;
    const row = seasonRow(rf);
    const peak = Math.max(...rf.season);
    rf.season.forEach((v, i) => {
      if (v >= Math.max(0.85, peak - 0.05)) expect(row[i]).toBe("peak");
      else if (v >= 0.5) expect(row[i]).toBe("on");
      else expect(row[i]).toBeNull();
    });
    const red = spawnRow(HABITS.redseabream);
    expect(red[4]).toBe("main");
    expect(red[2]).toBe("on");
    expect(spawnRow(HABITS.opaleye)[4]).toBe("maybe");
    expect(spawnRow(HABITS.righteye).every((x) => x === null)).toBe(true);
  });

  it("참문어 금어기(5/16~6/30)가 반영돼 있다", () => {
    const oc = closedRow(getSpecies("octopus")!.regulation);
    expect(oc[4]).toEqual({ kind: "part", text: "5/16~5/31" });
    expect(oc[5]?.kind).toBe("full");
  });
});
