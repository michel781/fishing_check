import { describe, expect, it } from "vitest";
import { HOOK_CHECK, hookText, judgeHook, rangeText } from "./hookCheck";
import { hookSpec } from "./hooks";
import { getRigSpec } from "./rigSpecs";
import { SPECIES } from "./species";

describe("바늘 크기 점검", () => {
  it("모든 어종에 점검 결과가 있고, 출처·이전 값 규칙을 지킨다", () => {
    for (const s of SPECIES) {
      const c = HOOK_CHECK[s.id];
      expect(c, s.id).toBeTruthy();
      if (c.status !== "미확인") expect(c.src.length, `${s.id} 출처`).toBeGreaterThan(0);
      if (c.status === "수정" || c.status === "보완") expect(c.was, `${s.id} 이전 값`).toBeTruthy();
      for (const [, u] of c.src) expect(u).toMatch(/^https?:\/\//);
      expect(c.range || c.text, `${s.id} 규격`).toBeTruthy();
    }
  });

  it("범위가 올바르고, 어종 화면 '실제 치수'의 바늘 규격과 같은 값이다", () => {
    for (const [id, c] of Object.entries(HOOK_CHECK)) {
      const specs = hookSpec(id).map((p) => p.spec).join(" ");
      if (c.range) {
        expect(c.range.min, id).toBeLessThanOrEqual(c.range.max);
        if (c.range.base != null) expect(c.range.base >= c.range.min && c.range.base <= c.range.max, id).toBe(true);
        expect(specs, id).toContain(rangeText(c.range));
      }
    }
  });

  it("감성돔 바늘 계열은 한 자릿수 호수다 (예전 '감성돔 바늘 10~12호' 같은 표기 방지)", () => {
    for (const [id, c] of Object.entries(HOOK_CHECK)) if (c.series === "감성돔 바늘") expect(c.range!.max, id).toBeLessThan(10);
    expect(hookSpec("greenling").map((p) => p.spec).join("")).not.toContain("감성돔");
  });

  it("고친 값: 학꽁치 4~7호, 숭어 감성돔 1~2호, 가자미 세이코 12~16호", () => {
    expect(hookText("halfbeak")).toBe("학꽁치 바늘 4~7호");
    expect(hookText("mullet")).toBe("감성돔 바늘 1~2호");
    expect(hookText("righteye")).toBe("세이코 바늘 12~16호");
    expect(hookText("flatfish")).toContain("3/0~4/0");
    expect(rangeText({ min: 2, max: 2.5, unit: "에기 호" })).toBe("2.0~2.5호");
    expect(hookSpec("bolak").map((p) => p.spec).join("")).toContain("#8~#4");
  });

  it("장비 목록의 바늘·에기 규격도 같은 범위다", () => {
    const item = (id: string, gid: string) => getRigSpec(id)?.gear?.find((g) => g.id === gid)?.spec ?? "";
    expect(item("halfbeak", "hook")).toBe("4~7호");
    expect(item("rockfish", "hook")).toBe("15~20호");
    expect(item("cuttlefish", "egi")).toBe("2.5~3.5호");
  });

  it("내 바늘 체크: 작음·적당·큼", () => {
    expect(judgeHook("blackporgy", 1)!.verdict).toBe("작음");
    expect(judgeHook("blackporgy", 3)!.verdict).toBe("적당");
    expect(judgeHook("blackporgy", 6)!.verdict).toBe("큼");
    expect(judgeHook("flatfish", 4)!.verdict).toBe("적당");
    expect(judgeHook("squid", 3)).toBeNull();
  });
});
