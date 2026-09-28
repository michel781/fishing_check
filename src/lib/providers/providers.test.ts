import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpot } from "@/data/spots";
import { khoaTideExtremes } from "./khoa";
import { kmaShortForecast } from "./kma";
import { getConditions } from "./index";

function mockFetch(handler: (url: string) => unknown) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const body = handler(String(url));
    if (body == null) return new Response("not found", { status: 404 });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status: 200 });
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DATA_GO_KR_SERVICE_KEY;
  delete process.env.KHOA_SERVICE_KEY;
});

describe("기상청 단기예보 파싱", () => {
  it("카테고리를 시간별로 합친다", async () => {
    mockFetch(() => ({
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" },
        body: { items: { item: [
          { category: "WSD", fcstDate: "20260928", fcstTime: "0600", fcstValue: "4.2" },
          { category: "VEC", fcstDate: "20260928", fcstTime: "0600", fcstValue: "310" },
          { category: "PCP", fcstDate: "20260928", fcstTime: "0600", fcstValue: "1mm 미만" },
          { category: "WAV", fcstDate: "20260928", fcstTime: "0600", fcstValue: "0.5" },
        ] } },
      },
    }));
    const r = await kmaShortForecast("k", 36.67, 126.13, new Date("2026-09-28T00:00:00Z"));
    expect(r).toEqual([{ time: "2026-09-27T21:00:00.000Z", windMs: 4.2, windDir: 310, precipMm: 0.5, airTempC: null, waveM: 0.5, pop: null }]);
  });

  it("인증 오류(XML)는 예외", async () => {
    mockFetch(() => "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg></cmmMsgHeader></OpenAPI_ServiceResponse>");
    await expect(kmaShortForecast("bad", 36, 126)).rejects.toThrow(/JSON/);
  });
});

describe("해양조사원 조석예보 파싱", () => {
  it("고·저조를 KST→UTC 로 변환", async () => {
    mockFetch(() => ({ result: { data: [
      { tph_time: "2026-09-28 05:56:00", tph_level: "548", hl_code: "고조" },
      { tph_time: "2026-09-28 12:07:00", tph_level: "33", hl_code: "저조" },
    ] } }));
    const r = await khoaTideExtremes("k", "DT_0067", ["2026-09-28"]);
    expect(r).toEqual([
      { time: "2026-09-27T20:56:00.000Z", cm: 548, type: "HIGH" },
      { time: "2026-09-28T03:07:00.000Z", cm: 33, type: "LOW" },
    ]);
  });
});

describe("getConditions 폴백 체인", () => {
  it("Open-Meteo 응답이 있으면 조석은 해수면 모델, 날씨는 Open-Meteo", async () => {
    const now = new Date("2026-09-28T03:00:00Z");
    const start = Date.parse("2026-09-26T15:00:00Z");
    const times = Array.from({ length: 24 * 4 }, (_, i) => new Date(start + i * 3600e3).toISOString().slice(0, 16));
    mockFetch((url) => {
      if (url.includes("marine-api")) {
        return { hourly: {
          time: times,
          wave_height: times.map(() => 0.6),
          wave_period: times.map(() => 5),
          swell_wave_height: times.map(() => 0.2),
          swell_wave_period: times.map(() => 7),
          sea_surface_temperature: times.map(() => 21.5),
          sea_level_height_msl: times.map((_, i) => 2.5 * Math.cos((2 * Math.PI * i) / 12.42)),
        } };
      }
      if (url.includes("api.open-meteo.com")) {
        return { hourly: {
          time: times,
          wind_speed_10m: times.map(() => 3.3),
          wind_direction_10m: times.map(() => 315),
          wind_gusts_10m: times.map(() => 6),
          precipitation: times.map(() => 0),
          pressure_msl: times.map(() => 1015),
          visibility: times.map(() => 20000),
          temperature_2m: times.map(() => 20),
        } };
      }
      return null;
    });
    const spot = getSpot("sinjin-outer")!;
    const b = await getConditions(spot, 2, now);
    expect(b.sources).toEqual({ tide: "OPEN_METEO", weather: "OPEN_METEO", marine: "OPEN_METEO" });
    expect(b.hours).toHaveLength(48);
    expect(b.hours[0].time).toBe("2026-09-27T15:00:00.000Z");
    expect(b.hours[5]).toMatchObject({ windMs: 3.3, waveM: 0.6, seaTempC: 21.5, visibilityKm: 20 });
    const highs = b.tide.extremes.filter((e) => e.type === "HIGH");
    expect(highs.length).toBeGreaterThanOrEqual(3);
    expect(b.seaTempHistory.length).toBe(24);
  });
});
