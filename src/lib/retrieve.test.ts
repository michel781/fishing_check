import { describe, expect, it } from "vitest";
import { ACT_INFO, RETRIEVE } from "@/data/retrieve";
import { getGuide } from "@/data/guides";
import { getSpecies, SPECIES } from "@/data/species";
import { activeTps, adjustFor, cmPerSec, cycleSec, metersPerCycle, playSteps } from "./retrieve";

describe("릴 감기 데이터", () => {
  it("모든 어종에 있고 값이 말이 된다", () => {
    for (const s of SPECIES) {
      const p = RETRIEVE[s.id];
      expect(p, s.id).toBeTruthy();
      expect(p.cycle.length, s.id).toBeGreaterThan(0);
      for (const st of p.cycle) {
        expect(ACT_INFO[st.act], `${s.id} ${st.act}`).toBeTruthy();
        expect(st.sec[0] <= st.sec[1] && st.sec[0] >= 0, `${s.id} ${st.act} sec`).toBe(true);
        if (st.tps) expect(st.tps[0] > 0 && st.tps[1] <= 3, `${s.id} tps`).toBe(true);
      }
      if (p.hooked.tps) expect(p.hooked.tps[1], s.id).toBeLessThanOrEqual(3);
    }
  });
  it("낚시 방법 탭과 같은 기준: 참돔 1초 1바퀴, 볼락 1초 반 바퀴", () => {
    expect(activeTps(RETRIEVE.redseabream)).toEqual([1, 1]);
    expect(activeTps(RETRIEVE.bolak)).toEqual([0.5, 0.5]);
    expect(getGuide("redseabream")!.steps.join(" ")).toContain("1초에 1바퀴");
  });
  it("빠른 추격형(삼치)은 숨어서 덮치는 어종(우럭·광어)보다 속도 등급이 높다", () => {
    expect(RETRIEVE.spanishmackerel.speed).toBeGreaterThan(RETRIEVE.rockfish.speed);
    expect(RETRIEVE.spanishmackerel.speed).toBeGreaterThan(RETRIEVE.flatfish.speed);
  });
});

describe("계산", () => {
  it("주기·속도·감는 길이", () => {
    expect(cycleSec(RETRIEVE.redseabream)).toEqual([18, 40]);
    expect(cmPerSec(1, 75)).toBe(75);
    // 참돔: 1바퀴/초 × 13~20초 × 75cm ≈ 9.8~15m (가이드의 10~15m와 같은 범위)
    expect(metersPerCycle(RETRIEVE.redseabream, 75)).toEqual([9.8, 15]);
  });
  it("수온이 낮으면 느리게·멈춤 길게, 적정이면 그대로", () => {
    const s = getSpecies("rockfish")!;
    const cold = adjustFor(RETRIEVE.rockfish, s, { seaTempC: s.temp.min - 3 });
    expect(cold.speed).toBeLessThan(1);
    expect(cold.pause).toBeGreaterThan(1);
    expect(adjustFor(RETRIEVE.rockfish, s, { seaTempC: s.temp.opt }).speed).toBe(1);
  });
  it("밤 보정은 낮에 주로 먹는 루어 어종에만", () => {
    expect(adjustFor(RETRIEVE.spanishmackerel, getSpecies("spanishmackerel")!, { night: true }).speed).toBeLessThan(1);
    expect(adjustFor(RETRIEVE.bolak, getSpecies("bolak")!, { night: true }).speed).toBe(1);
  });
  it("보정은 멈춤류 시간과 감는 속도에만 적용", () => {
    const st = playSteps(RETRIEVE.bolak, { speed: 0.5, pause: 2 });
    expect(st.find((x) => x.act === "감기")!.tpsMid).toBe(0.25);
    expect(st.find((x) => x.act === "멈춤")!.secMid).toBe(4);
    expect(st.find((x) => x.act === "폴링")!.secMid).toBe(6.5);
  });
});
