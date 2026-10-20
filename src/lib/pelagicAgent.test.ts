import { describe, expect, it } from "vitest";
import { SPOTS, getSpot } from "@/data/spots";
import { getSpecies } from "@/data/species";
import type { ForecastResult, HourScore } from "@/lib/types";
import { isPilotWalkSpot, picksFor, rankPicks } from "./pelagicAgent";

const H = 3600e3;
const D0 = Date.parse("2026-10-21T00:00:00+09:00");
const SR = "2026-10-21T06:44:00+09:00";
const SS = "2026-10-21T17:43:00+09:00";

/** 간조 05:00 → 만조 11:12 → 간조 17:24 (조차 ampCm*2) 인 하루 */
function fake(ampCm: number, opts: { danger?: boolean; temp?: number } = {}): ForecastResult {
  const HALF = 6.2;
  const cmAt = (h: number) => 100 - ampCm * Math.cos((Math.PI * (h - 5)) / HALF);
  const tideSeries = Array.from({ length: 49 }, (_, i) => ({ time: new Date(D0 + i * H).toISOString(), cm: cmAt(i) }));
  const extremes = [
    { type: "LOW" as const, time: new Date(D0 + 5 * H).toISOString(), cm: cmAt(5) },
    { type: "HIGH" as const, time: new Date(D0 + 11.2 * H).toISOString(), cm: cmAt(11.2) },
    { type: "LOW" as const, time: new Date(D0 + 17.4 * H).toISOString(), cm: cmAt(17.4) },
    { type: "HIGH" as const, time: new Date(D0 + 23.6 * H).toISOString(), cm: cmAt(23.6) },
  ];
  const hours = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(D0 + i * H).toISOString(),
    score: i === 8 ? 80 : 60,
    available: !opts.danger,
    safety: opts.danger ? "DANGER" : "OK",
    cond: { seaTempC: opts.temp ?? 19 },
  })) as unknown as HourScore[];
  return {
    hours,
    tideSeries,
    days: [{ date: "2026-10-21", sunrise: SR, sunset: SS, extremes, tideRangeCm: Math.round(ampCm * 2) }],
  } as unknown as ForecastResult;
}

const now = new Date(D0 + 3 * H);
const sm = getSpecies("spanishmackerel")!;

describe("회유어 찾기 에이전트", () => {
  it("시범 지역 워킹 포인트만 (선상 제외)", () => {
    const ids = SPOTS.filter(isPilotWalkSpot).map((s) => s.id);
    expect(ids).toContain("sokcho-outer");
    expect(ids).toContain("hajodae-rock");
    expect(ids).not.toContain("jumunjin-boat");
    expect(SPOTS.filter(isPilotWalkSpot).every((s) => ["속초", "양양", "강릉"].includes(s.area))).toBe(true);
  });

  it("오전 피딩 + 들물 후반 + 방파제 끝 + 적정 수온이면 4개 조건 모두 맞음", () => {
    const picks = picksFor(getSpot("sokcho-outer")!, sm, fake(100), now, 1);
    const am = picks.find((p) => p.phase === "am")!;
    expect(am.checks.map((c) => c.ok)).toEqual([true, true, true, true]);
    expect(am.matched).toBe(4);
    expect(am.appScore).toBe(80);
    // 앱 점수 80 × 0.6 + 조건 만점 40
    expect(am.agentScore).toBe(88);
    expect(am.checks[1].detail).toContain("들물 후반");
  });

  it("동해처럼 물 높이 차이가 작으면 들물 가중치를 줄이고 경고", () => {
    const am = picksFor(getSpot("sokcho-outer")!, sm, fake(15), now, 1).find((p) => p.phase === "am")!;
    expect(am.agentScore).toBeLessThan(88);
    expect(am.warnings.join(" ")).toContain("들물 효과가 작아요");
  });

  it("내항은 외해 소통 ✗, 수온 범위 밖은 수온 ✗", () => {
    const inner = picksFor(getSpot("dongmyeong-inner")!, sm, fake(100, { temp: 11 }), now, 1).find((p) => p.phase === "am")!;
    expect(inner.checks.find((c) => c.key === "open")!.ok).toBe(false);
    expect(inner.checks.find((c) => c.key === "temp")!.ok).toBe(false);
  });

  it("위험한 시간뿐이거나 이미 지난 시간대는 후보에서 뺀다", () => {
    expect(picksFor(getSpot("sokcho-outer")!, sm, fake(100, { danger: true }), now, 1)).toHaveLength(0);
    const later = picksFor(getSpot("sokcho-outer")!, sm, fake(100), new Date(D0 + 12 * H), 1);
    expect(later.map((p) => p.phase)).not.toContain("am");
  });

  it("같은 포인트·날짜·시간대는 한 번만, 점수 높은 순", () => {
    const a = picksFor(getSpot("sokcho-outer")!, sm, fake(100), now, 1);
    const b = picksFor(getSpot("sokcho-outer")!, getSpecies("mackerel")!, fake(100), now, 1);
    const top = rankPicks([...a, ...b], 10);
    const keys = top.map((p) => `${p.spotId}${p.date}${p.phase}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (let i = 1; i < top.length; i++) expect(top[i - 1].agentScore).toBeGreaterThanOrEqual(top[i].agentScore);
  });
});
