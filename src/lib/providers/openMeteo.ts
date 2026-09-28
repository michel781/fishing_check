import type { TidePoint } from "@/lib/types";
import { fetchJson } from "./http";

/**
 * Open-Meteo (키 불필요, 전 세계 모델). 공공 API 키가 없을 때의 1차 폴백.
 * - forecast: 바람·기압·강수·시정
 * - marine: 파고·파주기·너울·수온·해수면(조석 포함 모델값)
 * 시각은 timezone=GMT 로 받아 ISO(UTC)로 다룬다.
 */

interface ForecastResp {
  hourly: {
    time: string[];
    wind_speed_10m?: (number | null)[];
    wind_direction_10m?: (number | null)[];
    wind_gusts_10m?: (number | null)[];
    precipitation?: (number | null)[];
    pressure_msl?: (number | null)[];
    visibility?: (number | null)[];
    temperature_2m?: (number | null)[];
  };
}

interface MarineResp {
  hourly: {
    time: string[];
    wave_height?: (number | null)[];
    wave_period?: (number | null)[];
    swell_wave_height?: (number | null)[];
    swell_wave_period?: (number | null)[];
    sea_surface_temperature?: (number | null)[];
    sea_level_height_msl?: (number | null)[];
  };
}

export interface OMWeatherHour {
  time: string;
  windMs: number | null;
  windDir: number | null;
  gustMs: number | null;
  precipMm: number | null;
  pressureHpa: number | null;
  visibilityKm: number | null;
  airTempC: number | null;
}

export interface OMMarineHour {
  time: string;
  waveM: number | null;
  wavePeriodS: number | null;
  swellM: number | null;
  swellPeriodS: number | null;
  seaTempC: number | null;
  seaLevelCm: number | null;
}

const iso = (t: string) => new Date(`${t}:00Z`).toISOString();
const at = <T,>(arr: (T | null)[] | undefined, i: number): T | null => (arr ? (arr[i] ?? null) : null);

export async function omWeather(lat: number, lon: number, days: number): Promise<OMWeatherHour[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,pressure_msl,visibility,temperature_2m` +
    `&wind_speed_unit=ms&timezone=GMT&past_days=1&forecast_days=${Math.min(16, days + 1)}`;
  const r = await fetchJson<ForecastResp>(url, 1800);
  const h = r.hourly;
  return h.time.map((t, i) => ({
    time: iso(t),
    windMs: at(h.wind_speed_10m, i),
    windDir: at(h.wind_direction_10m, i),
    gustMs: at(h.wind_gusts_10m, i),
    precipMm: at(h.precipitation, i),
    pressureHpa: at(h.pressure_msl, i),
    visibilityKm: (() => {
      const v = at(h.visibility, i);
      return v == null ? null : v / 1000;
    })(),
    airTempC: at(h.temperature_2m, i),
  }));
}

export async function omMarine(lat: number, lon: number, days: number): Promise<OMMarineHour[]> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,sea_surface_temperature,sea_level_height_msl` +
    `&cell_selection=sea&timezone=GMT&past_days=1&forecast_days=${Math.min(16, days + 1)}`;
  const r = await fetchJson<MarineResp>(url, 1800);
  const h = r.hourly;
  return h.time.map((t, i) => {
    const sl = at(h.sea_level_height_msl, i);
    return {
      time: iso(t),
      waveM: at(h.wave_height, i),
      wavePeriodS: at(h.wave_period, i),
      swellM: at(h.swell_wave_height, i),
      swellPeriodS: at(h.swell_wave_period, i),
      seaTempC: at(h.sea_surface_temperature, i),
      seaLevelCm: sl == null ? null : Math.round(sl * 100),
    };
  });
}

/** 해수면 모델값을 조위 시계열로 (MSL 기준 → 최저값을 0으로 이동) */
export function seaLevelToTide(rows: OMMarineHour[]): TidePoint[] {
  const pts = rows.filter((r) => r.seaLevelCm != null) as (OMMarineHour & { seaLevelCm: number })[];
  if (pts.length < 24) return [];
  const range = Math.max(...pts.map((p) => p.seaLevelCm)) - Math.min(...pts.map((p) => p.seaLevelCm));
  // 조석 신호가 거의 없으면(연안 격자 밖 등) 사용하지 않는다
  if (range < 5) return [];
  const min = Math.min(...pts.map((p) => p.seaLevelCm));
  return pts.map((p) => ({ time: p.time, cm: p.seaLevelCm - min }));
}
