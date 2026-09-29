import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpot } from "@/data/spots";
import { khoaTideExtremes, parseTideItems, resolveTypes } from "./khoa";
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

describe("해양조사원 조석예보 파싱 (공공데이터포털)", () => {
  it("포털 표준 응답의 고·저조를 KST→UTC 로 변환하고 요청 파라미터를 맞춘다", async () => {
    const urls: string[] = [];
    mockFetch((url) => {
      urls.push(url);
      return { response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: { items: { item: [
          { predcDt: "2026-09-28 05:56:00", predcTdlvVl: "548", extrSe: "고조" },
          { predcDt: "2026-09-28 12:07:00", predcTdlvVl: "33", extrSe: "저조" },
        ] } },
      } };
    });
    const r = await khoaTideExtremes("k+/=", "DT_0067", ["2026-09-28"]);
    expect(r).toEqual([
      { time: "2026-09-27T20:56:00.000Z", cm: 548, type: "HIGH" },
      { time: "2026-09-28T03:07:00.000Z", cm: 33, type: "LOW" },
    ]);
    expect(urls[0]).toContain("apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService");
    expect(urls[0]).toContain("serviceKey=k%2B%2F%3D");
    expect(urls[0]).toContain("obsCode=DT_0067");
    expect(urls[0]).toContain("reqDate=20260928");
  });

  it("고·저조 구분값이 숫자 코드여도 앞뒤 비교로 판정, 단일 item 객체도 처리", () => {
    const rows = parseTideItems({ response: { header: { resultCode: "00" }, body: { items: { item: { predcDt: "202609281207", tdlvHgt: 40, extrSe: "2" } } } } });
    expect(rows).toEqual([{ time: "2026-09-28T03:07:00.000Z", cm: 40, type: null }]);
    const typed = resolveTypes([
      { time: "2026-09-27T20:56:00.000Z", cm: 548, type: null },
      { time: "2026-09-28T03:07:00.000Z", cm: 33, type: null },
      { time: "2026-09-28T09:20:00.000Z", cm: 530, type: null },
    ]);
    expect(typed.map((t) => t.type)).toEqual(["HIGH", "LOW", "HIGH"]);
  });

  it("오류 코드는 예외", () => {
    expect(() => parseTideItems({ response: { header: { resultCode: "30", resultMsg: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" } } })).toThrow(/30/);
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

describe("키 하나로 조석까지", () => {
  it("DATA_GO_KR_SERVICE_KEY 만 있어도 조석 소스가 KHOA", async () => {
    process.env.DATA_GO_KR_SERVICE_KEY = "only-one-key";
    mockFetch((url) => {
      if (url.includes("tideFcstHghLw")) {
        const d = url.match(/reqDate=(\d{8})/)![1];
        const ymd = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        return { response: { header: { resultCode: "00" }, body: { items: { item: [
          { predcDt: `${ymd} 04:00:00`, predcTdlvVl: "600", extrSe: "고조" },
          { predcDt: `${ymd} 10:10:00`, predcTdlvVl: "50", extrSe: "저조" },
          { predcDt: `${ymd} 16:30:00`, predcTdlvVl: "620", extrSe: "고조" },
          { predcDt: `${ymd} 22:45:00`, predcTdlvVl: "40", extrSe: "저조" },
        ] } } } };
      }
      return null; // 기상청·Open-Meteo 실패 → 날씨는 데모
    });
    const b = await getConditions(getSpot("daecheon")!, 2, new Date("2026-10-05T03:00:00Z"));
    expect(b.sources.tide).toBe("KHOA");
    expect(b.tide.extremes.length).toBeGreaterThanOrEqual(8);
  });
});
