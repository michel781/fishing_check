import { describe, expect, it } from "vitest";
import { SPOTS, getSpot } from "@/data/spots";
import { getSpecies } from "@/data/species";
import { toKmaGrid, parsePcp, latestBaseTime } from "@/lib/providers/kma";
import { demoHours } from "@/lib/providers/demo";
import type { ConditionsBundle, HourConditions } from "@/lib/types";
import { kstDateString, lunarDay, moonIllumination, mulddae, sunTimes } from "./astro";
import { estimateTide, findExtremes, seriesFromExtremes, tideAt } from "./tide";
import { goldenBlocks, safetyGate, scoreForecast, weightsFor } from "./score";

const kst = (s: string) => new Date(`${s}+09:00`);

describe("astro", () => {
  it("음력 일자: 2026 설날(2/17)=1일, 추석(9/25)=15일", () => {
    expect(lunarDay(kst("2026-02-17T12:00:00"))).toBe(1);
    expect(lunarDay(kst("2026-09-25T12:00:00"))).toBe(15);
  });

  it("7물때식: 음력 1일 7물, 8일 조금, 9일 무시, 10일 1물", () => {
    // 2026-02-17 = 음력 1/1
    expect(mulddae(kst("2026-02-17T12:00:00"), 7).label).toBe("7물");
    expect(mulddae(kst("2026-02-24T12:00:00"), 7).label).toBe("조금");
    expect(mulddae(kst("2026-02-25T12:00:00"), 7).label).toBe("무시");
    expect(mulddae(kst("2026-02-26T12:00:00"), 7).label).toBe("1물");
    expect(mulddae(kst("2026-02-17T12:00:00"), 8).label).toBe("8물");
  });

  it("보름 무렵 달이 밝다", () => {
    expect(moonIllumination(kst("2026-09-26T21:00:00"))).toBeGreaterThan(0.95);
    expect(moonIllumination(kst("2026-02-17T21:00:00"))).toBeLessThan(0.05);
  });

  it("서울 하지 일출·일몰 (약 05:11 / 19:57 KST)", () => {
    const s = sunTimes(kst("2026-06-21T12:00:00"), 37.5665, 126.978);
    const hm = (d: Date) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(11, 16);
    const toMin = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3));
    expect(Math.abs(toMin(hm(s.sunrise)) - toMin("05:11"))).toBeLessThanOrEqual(4);
    expect(Math.abs(toMin(hm(s.sunset)) - toMin("19:57"))).toBeLessThanOrEqual(4);
  });
});

describe("kma", () => {
  it("서울시청 격자 = (60,127)", () => {
    expect(toKmaGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 });
  });
  it("강수량 문자열 파싱", () => {
    expect(parsePcp("강수없음")).toBe(0);
    expect(parsePcp("1mm 미만")).toBe(0.5);
    expect(parsePcp("2.0mm")).toBe(2);
    expect(parsePcp("30.0~50.0mm")).toBe(40);
  });
  it("발표시각: 01:00 KST 는 전날 23시 발표", () => {
    expect(latestBaseTime(kst("2026-09-28T01:00:00"))).toEqual({ baseDate: "20260927", baseTime: "2300" });
    expect(latestBaseTime(kst("2026-09-28T14:20:00"))).toEqual({ baseDate: "20260928", baseTime: "1400" });
  });
});

describe("tide", () => {
  const spot = getSpot("sinjin-outer")!;
  const from = kst("2026-10-01T00:00:00").getTime();
  const series = estimateTide(spot.station, spot.lon, from, from + 3 * 86400e3);
  const ex = findExtremes(series);

  it("반일주조: 하루 약 4번의 극값, 고조 간격 ≈ 12.4시간", () => {
    expect(ex.length).toBeGreaterThanOrEqual(11);
    const highs = ex.filter((e) => e.type === "HIGH").map((e) => Date.parse(e.time));
    const gaps = highs.slice(1).map((t, i) => (t - highs[i]) / 3600e3);
    for (const g of gaps) expect(g).toBeGreaterThan(11.5), expect(g).toBeLessThan(13.5);
  });

  it("고·저조 보간 곡선은 극값을 통과", () => {
    const s2 = seriesFromExtremes(ex);
    for (const e of ex.slice(0, -1)) expect(Math.abs(tideAt(s2, Date.parse(e.time))! - e.cm)).toBeLessThan(1);
  });
});

function bundleFor(spotId: string, fromIso: string, override?: Partial<HourConditions>): ConditionsBundle {
  const spot = getSpot(spotId)!;
  const from = kst(fromIso).getTime();
  const demo = demoHours(spot.id, spot.sea, from, 72);
  const series = estimateTide(spot.station, spot.lon, from - 86400e3, from + 4 * 86400e3);
  return {
    hours: demo.map((d) => ({ ...d, ...override })),
    seaTempHistory: [],
    tide: { series, extremes: findExtremes(series) },
    sources: { tide: "ESTIMATE", weather: "DEMO", marine: "DEMO" },
    notes: [],
    fetchedAt: new Date().toISOString(),
  };
}

describe("score", () => {
  it("가중치 합 = 1, 서해는 물때·동해는 수온/파도 비중이 크다", () => {
    const w = weightsFor(getSpot("sinjin-outer")!, getSpecies("rockfish")!);
    const e = weightsFor(getSpot("jumunjin")!, getSpecies("mackerel")!);
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(w.tide).toBeGreaterThan(e.tide);
    expect(e.temp + e.wave).toBeGreaterThan(w.temp + w.wave);
  });

  it("점수 범위 0~100, 3일치 일별 요약", () => {
    const spot = getSpot("sinjin-outer")!;
    const r = scoreForecast(spot, getSpecies("rockfish")!, bundleFor(spot.id, "2026-10-10T00:00:00"));
    expect(r.hours).toHaveLength(72);
    expect(r.days).toHaveLength(3);
    for (const h of r.hours) {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(100);
    }
    expect(r.days[0].mulddae).toMatch(/물|조금|무시/);
  });

  it("주꾸미 금어기(6월)는 0점", () => {
    const spot = getSpot("ocheon-boat")!;
    const r = scoreForecast(spot, getSpecies("webfoot")!, bundleFor(spot.id, "2026-06-10T00:00:00"));
    expect(Math.max(...r.hours.map((h) => h.score))).toBe(0);
  });

  it("강풍·고파고면 외항은 위험, 같은 조건 내항은 파도 위험 없음", () => {
    const outer = getSpot("sinjin-outer")!;
    const inner = getSpot("sinjin-inner")!;
    const cond = demoHours("x", "WEST", Date.now(), 1)[0];
    const ctx = { t: Date.now(), nearLowTide: false, isDark: false };
    // 돌풍·비·시정은 그날 데모 값에 따라 달라지므로 고정한다 (바람·파도 효과만 보는 시험)
    const calm = { ...cond, gustMs: 7, precipMm: 0, visibilityKm: 15, swellM: 0.2, wavePeriodS: 5 };
    expect(safetyGate(outer, { ...calm, windMs: 6, waveM: 1.8 }, ctx).level).toBe("DANGER");
    expect(safetyGate(inner, { ...calm, windMs: 6, waveM: 1.8 }, ctx).level).toBe("OK");
    expect(safetyGate(inner, { ...calm, windMs: 13, gustMs: 16, waveM: 0.3 }, ctx).level).toBe("DANGER");
  });

  it("동해 너울(주기 9초, 1.1m)은 갯바위 위험", () => {
    const rock = getSpot("hajodae-rock")!;
    const cond = demoHours("x", "EAST", Date.now(), 1)[0];
    const g = safetyGate(rock, { ...cond, windMs: 3, waveM: 1.1, wavePeriodS: 9 }, { t: 0, nearLowTide: false, isDark: false });
    expect(g.level).toBe("DANGER");
  });

  it("잔잔한 날이 강풍일보다 점수가 높다", () => {
    const spot = getSpot("sinjin-outer")!;
    const sp = getSpecies("rockfish")!;
    const calm = scoreForecast(spot, sp, bundleFor(spot.id, "2026-10-10T00:00:00", { windMs: 2, waveM: 0.3, gustMs: 3 }));
    const windy = scoreForecast(spot, sp, bundleFor(spot.id, "2026-10-10T00:00:00", { windMs: 10, waveM: 1.3, gustMs: 14 }));
    expect(calm.days[0].best).toBeGreaterThan(windy.days[0].best);
  });

  it("골든타임 블록은 시간순으로 유효하고 위험 시간을 포함하지 않는다", () => {
    const spot = getSpot("jumunjin")!;
    const r = scoreForecast(spot, getSpecies("mackerel")!, bundleFor(spot.id, "2026-09-20T00:00:00"));
    for (const d of r.days) {
      for (const b of d.golden) {
        expect(Date.parse(b.end)).toBeGreaterThan(Date.parse(b.start));
        expect(Date.parse(b.end) - Date.parse(b.start)).toBeLessThanOrEqual(4 * 3600e3);
        const inside = r.hours.filter((h) => Date.parse(h.time) >= Date.parse(b.start) && Date.parse(h.time) < Date.parse(b.end));
        expect(inside.every((h) => h.safety !== "DANGER")).toBe(true);
      }
    }
    expect(goldenBlocks([])).toEqual([]);
  });

  it("모든 포인트의 어종 ID 가 유효하다", () => {
    for (const s of SPOTS) for (const id of s.species) expect(getSpecies(id), `${s.id}:${id}`).toBeTruthy();
  });

  it("KST 날짜 문자열", () => {
    expect(kstDateString(new Date("2026-09-27T15:30:00Z"))).toBe("2026-09-28");
  });
});
