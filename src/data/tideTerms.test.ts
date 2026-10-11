import { describe, expect, it } from "vitest";
import { termById } from "./gearTerms";
import { STAGE_TERM, TIDE_GROUPS, TIDE_TERMS, TWELFTHS } from "./tideTerms";

describe("물때 용어", () => {
  it("물 높이 표의 단계 이름이 모두 용어로 설명된다", () => {
    for (const st of ["만조", "간조", "초들물", "중들물", "끝들물", "초썰물", "중썰물", "끝썰물"]) {
      const id = STAGE_TERM[st];
      expect(termById(id)?.name, st).toBe(st);
    }
  });
  it("장비·용어 사전에서 함께 검색되고, 모든 그룹에 항목이 있다", () => {
    for (const t of TIDE_TERMS) expect(termById(t.id)?.cat).toBe("tide");
    for (const g of TIDE_GROUPS) expect(TIDE_TERMS.some((t) => t.group === g.id), g.id).toBe(true);
  });
  it("'초돌'로 찾아도 초들물이 나온다", () => {
    const hit = TIDE_TERMS.filter((t) => `${t.name}${t.aka ?? ""}${t.role}${t.keys?.join("") ?? ""}`.includes("초돌"));
    expect(hit.map((t) => t.name)).toEqual(["초들물"]);
  });
  it("초들물·초날물 계산 용어가 계산기로 이어진다", () => {
    expect(termById("td-calc")?.link?.href).toBe("/sea#s-calc");
  });
  it("12분의 1 법칙: 합이 12, 가운데가 가장 크다", () => {
    expect(TWELFTHS.reduce((a, b) => a + b, 0)).toBe(12);
    expect(Math.max(...TWELFTHS)).toBe(TWELFTHS[2]);
    expect(TWELFTHS[2]).toBe(TWELFTHS[3]);
  });
});
