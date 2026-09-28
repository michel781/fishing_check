/**
 * 천문 계산: 신월(삭) 시각, 음력 일자, 물때, 월령, 일출·일몰.
 * 외부 API 없이 계산 가능한 값은 모두 여기서 구한다.
 *
 * - 신월: Jean Meeus, "Astronomical Algorithms" 49장 (오차 수 분 이내)
 * - 일출/일몰: NOAA 태양 위치 근사식
 * - 음력 일자: 한국 음력은 KST 기준 삭이 든 날을 초하루로 한다.
 */

const DEG = Math.PI / 180;
const KST_OFFSET_MS = 9 * 3600 * 1000;
const DAY_MS = 86400000;
export const SYNODIC_MONTH = 29.530588861;

/** JDE(역학시) → Date. ΔT(약 70초)는 무시해도 일자 계산엔 영향 없음 */
function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * DAY_MS);
}

function dateToJd(d: Date): number {
  return d.getTime() / DAY_MS + 2440587.5;
}

/** k번째 신월(삭)의 시각. k=0 은 2000-01-06 무렵 */
export function newMoonJde(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  let jde =
    2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * DEG;
  const Mp =
    (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) * DEG;
  const F =
    (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) * DEG;
  const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) * DEG;

  jde +=
    -0.4072 * Math.sin(Mp) +
    0.17241 * E * Math.sin(M) +
    0.01608 * Math.sin(2 * Mp) +
    0.01039 * Math.sin(2 * F) +
    0.00739 * E * Math.sin(Mp - M) -
    0.00514 * E * Math.sin(Mp + M) +
    0.00208 * E * E * Math.sin(2 * M) -
    0.00111 * Math.sin(Mp - 2 * F) -
    0.00057 * Math.sin(Mp + 2 * F) +
    0.00056 * E * Math.sin(2 * Mp + M) -
    0.00042 * Math.sin(3 * Mp) +
    0.00042 * E * Math.sin(M + 2 * F) +
    0.00038 * E * Math.sin(M - 2 * F) -
    0.00024 * E * Math.sin(2 * Mp - M) -
    0.00017 * Math.sin(Om) -
    0.00007 * Math.sin(Mp + 2 * M) +
    0.00004 * Math.sin(2 * Mp - 2 * F) +
    0.00004 * Math.sin(3 * M) +
    0.00003 * Math.sin(Mp + M - 2 * F) +
    0.00003 * Math.sin(2 * Mp + 2 * F) -
    0.00003 * Math.sin(Mp + M + 2 * F) +
    0.00003 * Math.sin(Mp - M + 2 * F) -
    0.00002 * Math.sin(Mp - M - 2 * F) -
    0.00002 * Math.sin(3 * Mp + M) +
    0.00002 * Math.sin(4 * Mp);
  return jde;
}

/** 주어진 시각 직전(또는 같은)의 신월 시각 */
export function previousNewMoon(d: Date): Date {
  const jd = dateToJd(d);
  let k = Math.floor((jd - 2451550.09766) / SYNODIC_MONTH);
  while (newMoonJde(k + 1) <= jd) k++;
  while (newMoonJde(k) > jd) k--;
  return jdToDate(newMoonJde(k));
}

/** KST 달력 날짜의 일련번호 (1970-01-01 KST = 0) */
export function kstDayNumber(d: Date): number {
  return Math.floor((d.getTime() + KST_OFFSET_MS) / DAY_MS);
}

/** KST 날짜 문자열 YYYY-MM-DD */
export function kstDateString(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** KST 기준 해당 날짜 00:00 의 Date */
export function kstMidnight(d: Date): Date {
  return new Date(kstDayNumber(d) * DAY_MS - KST_OFFSET_MS);
}

/** 음력 일자(1~30). KST 기준으로 삭이 든 날이 초하루 */
export function lunarDay(d: Date): number {
  // 해당 KST 날짜의 끝(23:59:59) 이전의 신월을 찾는다 → 오늘 삭이 들면 오늘이 1일
  const endOfDay = new Date(kstMidnight(d).getTime() + DAY_MS - 1);
  const nm = previousNewMoon(endOfDay);
  return kstDayNumber(d) - kstDayNumber(nm) + 1;
}

export type MulddaeSystem = 7 | 8;

const MUL_LABELS = [
  "1물", "2물", "3물", "4물", "5물", "6물", "7물", "8물", "9물",
  "10물", "11물", "12물", "13물", "조금", "무시",
] as const;

export interface Mulddae {
  /** 0..14 (0=1물 … 12=13물, 13=조금, 14=무시) */
  index: number;
  label: string;
  /** 사리에 가까울수록 1, 조금에 가까울수록 0 (조차 크기의 상대값) */
  springness: number;
}

/**
 * 물때 계산.
 * - 7물때식(서해 관행): 음력 1·16일 = 7물, 8·23일 = 조금, 9·24일 = 무시, 10·25일 = 1물
 * - 8물때식(남해 관행): 7물때식보다 하루 앞서 셈 (음력 1일 = 8물)
 */
export function mulddae(d: Date, system: MulddaeSystem = 7): Mulddae {
  const ld = lunarDay(d);
  const offset = system === 7 ? 10 : 9;
  const index = (((ld - offset) % 15) + 15) % 15;
  return { index, label: MUL_LABELS[index], springness: springness(d) };
}

/**
 * 사리 정도(0~1). 삭·망 후 약 1.5일(조령) 뒤에 조차가 최대가 되는 것을 반영.
 */
export function springness(d: Date): number {
  const age = moonAgeDays(new Date(d.getTime() - 1.5 * DAY_MS));
  // 반달 주기(14.77일) 코사인: 0/14.77일이면 1, 7.38일이면 0
  const phase = (2 * Math.PI * age) / (SYNODIC_MONTH / 2);
  return (1 + Math.cos(phase)) / 2;
}

/** 월령(일) 0 ~ 29.53 */
export function moonAgeDays(d: Date): number {
  const nm = previousNewMoon(d);
  return (d.getTime() - nm.getTime()) / DAY_MS;
}

/** 달 밝기(조명률) 0~1 */
export function moonIllumination(d: Date): number {
  const age = moonAgeDays(d);
  return (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
}

export function moonPhaseName(d: Date): string {
  const age = moonAgeDays(d);
  if (age < 1.5 || age > 28) return "그믐·삭";
  if (age < 6.5) return "초승달";
  if (age < 9) return "상현달";
  if (age < 13.5) return "차오르는 달";
  if (age < 16.5) return "보름달";
  if (age < 21) return "기우는 달";
  if (age < 23.5) return "하현달";
  return "그믐달";
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  /** 시민박명 시작/끝 (태양고도 -6°) */
  dawn: Date;
  dusk: Date;
}

/** NOAA 근사식 기반 일출·일몰 (오차 1~2분) */
export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const noonGuess = new Date(kstMidnight(date).getTime() + 12 * 3600 * 1000);
  const n = Math.round(dateToJd(noonGuess) - 2451545.0 + 0.0008);
  const Jstar = n - lon / 360;
  const M = ((357.5291 + 0.98560028 * Jstar) % 360) * DEG;
  const C =
    1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
  const lambda = ((M / DEG + C + 180 + 102.9372) % 360) * DEG;
  const Jtransit =
    2451545.0 + Jstar + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * lambda);
  const decl = Math.asin(Math.sin(lambda) * Math.sin(23.4397 * DEG));

  const hourAngle = (alt: number) => {
    const cosH =
      (Math.sin(alt * DEG) - Math.sin(lat * DEG) * Math.sin(decl)) /
      (Math.cos(lat * DEG) * Math.cos(decl));
    return Math.acos(Math.max(-1, Math.min(1, cosH))) / DEG;
  };
  const h0 = hourAngle(-0.833);
  const h6 = hourAngle(-6);
  return {
    sunrise: jdToDate(Jtransit - h0 / 360),
    sunset: jdToDate(Jtransit + h0 / 360),
    dawn: jdToDate(Jtransit - h6 / 360),
    dusk: jdToDate(Jtransit + h6 / 360),
  };
}
