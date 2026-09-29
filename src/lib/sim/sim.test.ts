import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpot, nearbySpots, SPOTS } from "@/data/spots";
import { getSpecies } from "@/data/species";
import { scoreForecast } from "@/lib/engine/score";
import { getForecast, rankSpots, findAlternatives } from "@/lib/forecast";
import { liveStatus } from "@/lib/live";
import { GET as ics } from "@/app/api/ics/route";
import { ctxFrom, simEnabled } from "./mode";
import { scenarioBundle } from "./scenarios";

const kst = (s: string) => new Date(`${s}+09:00`);
const HOUR = 3600e3;
const kstHour = (iso: string) => (new Date(iso).getUTCHours() + 9) % 24;

afterEach(() => vi.unstubAllEnvs());

describe("시나리오 안전 판정", () => {
  it("태풍 절정일은 모든 포인트가 위험", () => {
    for (const spot of SPOTS) {
      const b = scenarioBundle(spot, "typhoon", kst("2026-09-01T00:00:00"));
      const r = scoreForecast(spot, getSpecies(spot.species[0])!, b, { now: kst("2026-09-01T00:00:00") });
      expect(r.days[3].verdict, spot.id).toBe("DANGER");
    }
  });

  it("동해 너울: 갯바위는 위험, 같은 해역 내항은 위험 아님", () => {
    const now = kst("2026-10-01T00:00:00");
    const rock = getSpot("hajodae-rock")!;
    const inner = getSpot("dongmyeong-inner")!;
    expect(scoreForecast(rock, getSpecies("bolak")!, scenarioBundle(rock, "swell", now), { now }).days[2].verdict).toBe("DANGER");
    expect(scoreForecast(inner, getSpecies("bolak")!, scenarioBundle(inner, "swell", now), { now }).days[2].verdict).not.toBe("DANGER");
  });
});

describe("rule-v1.2 개선", () => {
  it("선상은 출항 시간(04~17시) 밖에서 골든타임이 생기지 않고 25점 이하", () => {
    const spot = getSpot("ocheon-boat")!;
    const now = kst("2026-10-05T00:00:00");
    const r = scoreForecast(spot, getSpecies("webfoot")!, scenarioBundle(spot, "calm", now), { now });
    for (const h of r.hours) {
      const hr = kstHour(h.time);
      if (hr < 4 || hr >= 17) {
        expect(h.score).toBeLessThanOrEqual(25);
        expect(h.available).toBe(false);
      }
    }
    for (const d of r.days) for (const g of d.golden) expect(kstHour(g.start)).toBeGreaterThanOrEqual(4);
  });

  it("냉수대(수온 −6℃): 급강하 감점이 사흘 뒤까지 이어진다", () => {
    const spot = getSpot("jumunjin")!;
    const now = kst("2026-08-05T00:00:00");
    const sp = getSpecies("mackerel")!;
    const cold = scoreForecast(spot, sp, scenarioBundle(spot, "coldwater", now), { now });
    const normal = scoreForecast(spot, sp, scenarioBundle(spot, "calm", now), { now });
    const d3 = cold.hours.filter((h) => h.time.startsWith("2026-08-07"));
    expect(d3.some((h) => h.reasons.some((r) => r.label.includes("수온")))).toBe(true);
    expect(normal.days[3].best - cold.days[3].best).toBeGreaterThanOrEqual(10);
  });

  it("오늘 오후 3시 기준: 남은 시간 골든타임은 15시 이후에 시작", () => {
    const spot = getSpot("sinjin-outer")!;
    const now = kst("2026-10-10T15:00:00");
    const r = scoreForecast(spot, getSpecies("rockfish")!, scenarioBundle(spot, "calm", now), { now });
    const today = r.days[0];
    expect(today.remainingBest).not.toBeNull();
    if (today.nextGolden) expect(Date.parse(today.nextGolden.start)).toBeGreaterThanOrEqual(now.getTime());
    expect(r.days[1].remainingBest).toBeNull();
  });

  it("지금 상황: 물 흐름 방향·다음 만조/간조·다음 골든타임", () => {
    const spot = getSpot("sinjin-outer")!;
    const now = kst("2026-10-10T15:20:00");
    const r = scoreForecast(spot, getSpecies("rockfish")!, scenarioBundle(spot, "calm", now), { now });
    const live = liveStatus(r, now)!;
    expect(live.hour.time).toBe(new Date(kst("2026-10-10T15:00:00")).toISOString());
    expect(["RISING", "FALLING"]).toContain(live.trend);
    expect(live.nextExtreme!.inMin).toBeGreaterThan(0);
    expect(live.nextExtreme!.inMin).toBeLessThan(7 * 60);
    expect(live.current || live.next).toBeTruthy();
  });
});

describe("예보 서비스", () => {
  it("기본 어종은 그날 가장 점수가 높은 어종", async () => {
    const ctx = { now: kst("2026-10-10T06:00:00"), sim: "calm" as const };
    const f = (await getForecast("sinjin-outer", undefined, ctx))!;
    expect(f.species.id).toBe(f.ranking.find((r) => !r.closed)!.species.id);
    for (let i = 1; i < f.ranking.length; i++) {
      if (!f.ranking[i].closed && !f.ranking[i - 1].closed) expect(f.ranking[i - 1].score).toBeGreaterThanOrEqual(f.ranking[i].score);
    }
  });

  it("해역 랭킹은 위험 포인트를 뒤로 보낸다", async () => {
    const ctx = { now: kst("2026-10-01T09:00:00"), sim: "swell" as const };
    const r = await rankSpots(ctx, "2026-10-03", "EAST");
    const firstDanger = r.findIndex((x) => x.day.verdict === "DANGER");
    if (firstDanger >= 0) expect(r.slice(firstDanger).every((x) => x.day.verdict === "DANGER")).toBe(true);
    expect(r[0].day.verdict).not.toBe("DANGER");
  });

  it("워킹 포인트의 대체 제안에는 선상이 섞이지 않고, 모든 노출 포인트는 60km 안에 내항 대안이 있다", async () => {
    const ctx = { now: kst("2026-10-01T09:00:00"), sim: "front" as const };
    const alts = await findAlternatives(getSpot("sinjin-outer")!, "2026-10-03", ctx);
    expect(alts.every((a) => a.spot.type !== "BOAT")).toBe(true);
    for (const s of SPOTS.filter((x) => ["OUTER_HARBOR", "BREAKWATER_TIP", "ROCK", "SURF"].includes(x.type))) {
      expect(nearbySpots(s, 60).some((n) => n.spot.type === "INNER_HARBOR" || n.spot.type === "TIDAL_FLAT"), s.id).toBe(true);
    }
  });
});

describe("시뮬레이션 모드·캘린더", () => {
  it("운영(production)에서는 FISHING_SIM_ENABLED 없이 시뮬레이션이 꺼진다", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(simEnabled()).toBe(false);
    expect(ctxFrom({ sim: "typhoon" }).sim).toBeUndefined();
    vi.stubEnv("FISHING_SIM_ENABLED", "1");
    expect(ctxFrom({ sim: "typhoon", simDate: "2026-10-03", simHour: "15" })).toMatchObject({
      sim: "typhoon",
      now: kst("2026-10-03T15:00:00"),
    });
  });

  it("골든타임 .ics 는 90분 전 알림이 있는 일정", async () => {
    const res = ics(new Request("http://x/api/ics?spot=sinjin-outer&species=rockfish&start=2026-10-03T20:00:00.000Z&end=2026-10-03T23:00:00.000Z"));
    const body = await res.text();
    expect(res.headers.get("content-type")).toContain("text/calendar");
    expect(body).toContain("DTSTART:20261003T200000Z");
    expect(body).toContain("TRIGGER:-PT90M");
    expect(ics(new Request("http://x/api/ics?spot=nope&species=rockfish&start=a&end=b")).status).toBe(400);
  });

  it("시나리오 시작 시각 경계: 7일 × 24시간", () => {
    const b = scenarioBundle(getSpot("mukho")!, "typical", kst("2026-10-01T13:00:00"));
    expect(b.hours).toHaveLength(168);
    expect(b.hours[0].time).toBe(kst("2026-10-01T00:00:00").toISOString());
    expect(Date.parse(b.hours[1].time) - Date.parse(b.hours[0].time)).toBe(HOUR);
  });
});

describe("폭풍 직후", () => {
  it("태풍이 지나간 다음 날 내항은 잔잔해도 감점된다", () => {
    const spot = getSpot("dongmyeong-inner")!;
    const now = kst("2026-10-01T00:00:00");
    const sp = getSpecies("mackerel")!;
    const r = scoreForecast(spot, sp, scenarioBundle(spot, "typhoon", now), { now });
    const after = r.hours.filter((h) => h.reasons.some((x) => x.label.startsWith("폭풍 직후")));
    expect(after.length).toBeGreaterThan(0);
    expect(after.every((h) => Date.parse(h.time) > kst("2026-10-03T12:00:00").getTime())).toBe(true);
  });
});
