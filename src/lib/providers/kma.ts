import { fetchJson } from "./http";

/**
 * 기상청 단기예보 조회서비스 (공공데이터포털, VilageFcstInfoService_2.0)
 * 격자(nx, ny) 단위 1시간 예보, 글피까지. 바다 격자는 WAV(파고)도 제공.
 */

/** 위경도 → 기상청 LCC 격자 (기상청 공개 변환식) */
export function toKmaGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const D = Math.PI / 180;
  const re = RE / GRID;
  const slat1 = SLAT1 * D;
  const slat2 = SLAT2 * D;
  const olon = OLON * D;
  const olat = OLAT * D;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * D * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * D - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/** 가장 최근 발표 시각 (02,05,…,23시 발표, 약 10분 뒤 제공) */
export function latestBaseTime(now: Date): { baseDate: string; baseTime: string } {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000 - 15 * 60 * 1000);
  const hours = [2, 5, 8, 11, 14, 17, 20, 23];
  let h = kst.getUTCHours();
  let day = kst;
  const base = [...hours].reverse().find((x) => x <= h);
  if (base == null) {
    day = new Date(kst.getTime() - 24 * 3600 * 1000);
    h = 23;
  } else h = base;
  const ymd = day.toISOString().slice(0, 10).replace(/-/g, "");
  return { baseDate: ymd, baseTime: `${String(h).padStart(2, "0")}00` };
}

interface KmaItem {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
}
interface KmaResp {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: { items?: { item?: KmaItem[] } };
  };
}

export interface KmaHour {
  time: string;
  windMs: number | null;
  windDir: number | null;
  precipMm: number | null;
  airTempC: number | null;
  waveM: number | null;
  pop: number | null;
}

/** PCP 문자열 → mm ("강수없음", "1mm 미만", "1.0mm", "30.0~50.0mm", "50.0mm 이상") */
export function parsePcp(v: string): number {
  if (!v || v.includes("없음")) return 0;
  if (v.includes("미만")) return 0.5;
  const nums = v.match(/[\d.]+/g)?.map(Number) ?? [];
  if (!nums.length) return 0;
  return nums.length === 2 ? (nums[0] + nums[1]) / 2 : nums[0];
}

export async function kmaShortForecast(
  serviceKey: string,
  lat: number,
  lon: number,
  now = new Date(),
): Promise<KmaHour[]> {
  const { nx, ny } = toKmaGrid(lat, lon);
  const { baseDate, baseTime } = latestBaseTime(now);
  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
    `?serviceKey=${encodeURIComponent(serviceKey)}&pageNo=1&numOfRows=1500&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;
  const r = await fetchJson<KmaResp>(url, 1800);
  if (r.response.header.resultCode !== "00") {
    throw new Error(`KMA ${r.response.header.resultCode} ${r.response.header.resultMsg}`);
  }
  const items = r.response.body?.items?.item ?? [];
  const byTime = new Map<string, KmaHour>();
  for (const it of items) {
    const time = new Date(
      `${it.fcstDate.slice(0, 4)}-${it.fcstDate.slice(4, 6)}-${it.fcstDate.slice(6, 8)}T${it.fcstTime.slice(0, 2)}:00:00+09:00`,
    ).toISOString();
    let h = byTime.get(time);
    if (!h) {
      h = { time, windMs: null, windDir: null, precipMm: null, airTempC: null, waveM: null, pop: null };
      byTime.set(time, h);
    }
    const num = Number(it.fcstValue);
    const valid = Number.isFinite(num) && num > -900;
    switch (it.category) {
      case "WSD": if (valid) h.windMs = num; break;
      case "VEC": if (valid) h.windDir = num; break;
      case "TMP": if (valid) h.airTempC = num; break;
      case "WAV": if (valid) h.waveM = num; break;
      case "POP": if (valid) h.pop = num; break;
      case "PCP": h.precipMm = parsePcp(it.fcstValue); break;
    }
  }
  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}
