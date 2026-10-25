import { describe, expect, it } from "vitest";
import { getSpot } from "@/data/spots";
import { fixedCams, quickChecks, ytId } from "@/data/liveView";
import type { Pick } from "@/lib/pelagicAgent";
import type { HourScore } from "@/lib/types";
import { nowScore, parseLiveNow, rankNow, surfCheck, toNowPick } from "./surfNow";

const spot = getSpot("jumunjin")!;
const hr = (o: { wave?: number; wind?: number; dir?: number; safety?: string; reasons?: string[] } = {}) =>
  ({
    time: "2026-10-26T21:00:00Z",
    safety: o.safety ?? "OK",
    safetyReasons: o.safety === "CAUTION" ? ["파도 조금 높음 1.2m"] : [],
    reasons: (o.reasons ?? []).map((label) => ({ label, effect: -1 })),
    cond: { waveM: o.wave ?? 0.5, wavePeriodS: 6, windMs: o.wind ?? 3, windDir: o.dir ?? null },
  }) as unknown as HourScore;
const pick = (spotId: string, agentScore: number, start = "2026-10-26T21:00:00Z") =>
  ({ spotId, agentScore, start, end: "2026-10-26T23:30:00Z" }) as unknown as Pick;
const now = new Date("2026-10-26T12:00:00Z");

describe("한 번에 찾기 — 서프루어 판단", () => {
  it("바다를 보는 쪽에서 부는 바람은 앞바람, 반대는 뒷바람", () => {
    expect(surfCheck(spot, [hr({ wind: 6, dir: spot.facingDeg })]).wind).toBe("앞바람");
    expect(surfCheck(spot, [hr({ wind: 6, dir: (spot.facingDeg + 180) % 360 })]).wind).toBe("뒷바람");
    expect(surfCheck(spot, [hr({ wind: 6 })]).wind).toBeNull();
  });

  it("파도·바람 주의 시간이 있으면 주의, 엔진의 수온 급강하 문구면 냉수대", () => {
    const c = surfCheck(spot, [hr(), hr({ wave: 1.2, safety: "CAUTION" })]);
    expect(c.level).toBe("caution");
    expect(c.waveM).toBe(1.2);
    expect(c.notes).toContain("파도 조금 높음 1.2m");
    expect(surfCheck(spot, [hr({ reasons: ["물 온도 뚝 떨어짐 -4.2℃ (냉수대)"] })]).coldWater).toBe(true);
    expect(surfCheck(spot, [hr({ reasons: ["물 온도 떨어짐 -2.1℃"] })]).coldWater).toBe(true);
    expect(surfCheck(spot, [hr({ reasons: ["물 온도 갑자기 오름 +3.1℃"] })]).coldWater).toBe(false);
  });

  it("지금 점수 = 에이전트 점수 − 주의 8 − 앞바람 5 − 냉수대 15", () => {
    const p = pick("a", 70);
    expect(nowScore(p, surfCheck(spot, [hr()]))).toBe(70);
    expect(nowScore(p, surfCheck(spot, [hr({ safety: "CAUTION", wind: 6, dir: spot.facingDeg, reasons: ["물 온도 떨어짐 -2.5℃"] })]))).toBe(42);
  });

  it("포인트마다 하나, 점수 같으면 먼저 시작하는 쪽", () => {
    const ok = surfCheck(spot, [hr()]);
    const ps = [
      toNowPick(pick("a", 60, "2026-10-26T21:00:00Z"), ok, now),
      toNowPick(pick("a", 65, "2026-10-26T08:00:00Z"), ok, now),
      toNowPick(pick("b", 65, "2026-10-26T14:00:00Z"), ok, now),
    ];
    const r = rankNow(ps);
    expect(r.map((p) => p.spotId)).toEqual(["a", "b"]);
    expect(r[0].ongoing).toBe(true);
    expect(r[0].startsInMin).toBe(0);
    expect(r[1].startsInMin).toBe(120);
  });
});

describe("한 번에 찾기 — 실시간 확인", () => {
  it("유튜브 영상 페이지의 방송 상태", () => {
    expect(parseLiveNow('..."liveBroadcastDetails":{"isLiveNow":true,"startTimestamp"...')).toBe(true);
    expect(parseLiveNow('"isLiveNow":false,"endTimestamp"')).toBe(false);
    expect(parseLiveNow("<html>consent</html>")).toBeNull();
  });

  it("지역 확인 링크: 오늘 영상 → 최근 조황 → 지금 낚시 라이브, 고정 캠의 유튜브 ID", () => {
    expect(quickChecks("양양").map((l) => l.kind)).toEqual(["report", "report", "youtube"]);
    expect(quickChecks("강릉")[2].url).toContain("sp=EgJAAQ");
    const yt = fixedCams("강릉").map((c) => ytId(c.url)).filter(Boolean);
    expect(yt).toEqual(["n8mJCRXGoXc"]);
    expect(ytId("https://www.youtube.com/results?search_query=x")).toBeNull();
  });
});
