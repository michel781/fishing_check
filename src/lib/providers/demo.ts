import type { Sea } from "@/lib/types";

/**
 * 데모 데이터: 외부 API 에 접근할 수 없을 때(오프라인 개발, 테스트) 쓰는 결정적 합성 값.
 * 화면에 반드시 "데모"로 표시한다. 실제 예보가 아니다.
 */

const SST: Record<Sea, number[]> = {
  WEST: [7, 6, 7, 10, 14, 18, 22, 25, 23, 19, 15, 11],
  EAST: [11, 10, 10, 12, 15, 18, 21, 24, 22, 19, 16, 13],
  SOUTH: [13, 12, 13, 15, 17, 20, 23, 26, 25, 22, 18, 15],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export interface DemoHour {
  time: string;
  windMs: number;
  windDir: number;
  gustMs: number;
  precipMm: number;
  pressureHpa: number;
  visibilityKm: number;
  airTempC: number;
  waveM: number;
  wavePeriodS: number;
  swellM: number;
  swellPeriodS: number;
  seaTempC: number;
}

export function demoHours(seed: string, sea: Sea, fromMs: number, hours: number): DemoHour[] {
  const s = hash(seed);
  const out: DemoHour[] = [];
  for (let i = 0; i < hours; i++) {
    const t = fromMs + i * 3600 * 1000;
    const d = t / (24 * 3600 * 1000);
    const kstHour = (new Date(t).getUTCHours() + 9) % 24;
    // 약 4.5일 주기로 저기압이 지나가는 패턴 + 낮에 강해지는 해풍
    const front = Math.max(0, Math.sin((2 * Math.PI * (d + s * 4.5)) / 4.5)) ** 3;
    const diurnal = 1 + 0.35 * Math.sin((2 * Math.PI * (kstHour - 9)) / 24);
    const wind = (2.5 + 7.5 * front) * diurnal;
    const month = new Date(t + 9 * 3600 * 1000).getUTCMonth();
    const swellBoost = sea === "EAST" ? 0.6 : 0.2;
    const wave = 0.25 + wind * 0.09 + swellBoost * front;
    out.push({
      time: new Date(t).toISOString(),
      windMs: Math.round(wind * 10) / 10,
      windDir: Math.round((sea === "WEST" ? 300 : 30) + 60 * Math.sin(d + s * 6)) % 360,
      gustMs: Math.round(wind * 1.5 * 10) / 10,
      precipMm: front > 0.7 ? Math.round(front * 4 * 10) / 10 : 0,
      pressureHpa: Math.round((1018 - 12 * front) * 10) / 10,
      visibilityKm: 15,
      airTempC: SST[sea][month] + 2,
      waveM: Math.round(wave * 10) / 10,
      wavePeriodS: Math.round((sea === "EAST" ? 6 + 4 * front : 4 + 2 * front) * 10) / 10,
      swellM: Math.round(swellBoost * front * 10) / 10,
      swellPeriodS: sea === "EAST" ? 9 : 6,
      seaTempC: Math.round((SST[sea][month] + 0.6 * Math.sin(d / 3 + s)) * 10) / 10,
    });
  }
  return out;
}
