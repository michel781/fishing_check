/** 서해 · 동해 · 남해(전남 남해안·경남·부산·제주) */
export type Sea = "WEST" | "EAST" | "SOUTH";

export type SpotType =
  | "INNER_HARBOR" // 내항
  | "OUTER_HARBOR" // 외항 방파제
  | "BREAKWATER_TIP" // 방파제 끝(등대)
  | "ROCK" // 갯바위
  | "SURF" // 백사장·서프 원투
  | "BOAT" // 선상 (출항지 기준)
  | "TIDAL_FLAT"; // 갯벌·간척지 연안

export interface TideStation {
  /** 국립해양조사원 조위관측소 코드 (예: DT_0001) */
  code: string;
  name: string;
  /** 추정 모델용: 대조 조차(m), 소조 조차(m), 평균고조간격(시간) */
  springRangeM: number;
  neapRangeM: number;
  hwiHours: number;
}

export interface Spot {
  id: string;
  name: string;
  area: string; // 시·군
  sea: Sea;
  type: SpotType;
  lat: number;
  lon: number;
  /** 낚시하는 사람이 바라보는 바다 방향(°, 북=0). 이 방향에서 부는 바람이 맞바람 */
  facingDeg: number;
  station: TideStation;
  bottom: "MUD" | "SAND" | "ROCK" | "MIXED";
  tetrapod?: boolean;
  nightOk?: boolean;
  parking?: boolean;
  toilet?: boolean;
  species: string[];
  notes?: string;
}

export type MonthlyScores = [
  number, number, number, number, number, number,
  number, number, number, number, number, number,
];

export interface Regulation {
  /** 금어기 (MM-DD) */
  closed?: { from: string; to: string; region?: string }[];
  /** 포획 금지체장 (cm 미만 금지) */
  minLengthCm?: number;
  note?: string;
  sourceUrl: string;
  /** 공식 공고 원문으로 확인했는지 */
  verified: boolean;
}

export interface Species {
  id: string;
  name: string;
  aka?: string;
  seas: Sea[];
  /** 월별 시즌 점수(1~12월) 0~1 */
  season: MonthlyScores;
  temp: { min: number; opt: number; max: number };
  tide: {
    /** 선호 물때: 조금 쪽 / 중간 물때 / 사리 쪽 */
    mul: "neap" | "mid" | "spring";
    /** 선호 조류 세기 0(정조)~1(최강) */
    current: number;
    flood: number; // 들물 선호 0~1
    ebb: number; // 썰물 선호 0~1
  };
  light: { dawnDusk: number; day: number; night: number; moon: "dark" | "neutral" | "bright" };
  spot: Partial<Record<SpotType, number>>;
  /** 너무 잔잔한 것보다 약간의 파도(포말)를 선호 */
  likesSurf?: boolean;
  /** 해역 가중치에 곱하는 보정 */
  weightBoost?: Partial<Record<keyof Weights, number>>;
  rigs: string[];
  baits: string[];
  tips: string;
  regulation?: Regulation;
}

export interface Weights {
  tide: number;
  wind: number;
  wave: number;
  temp: number;
  light: number;
  pressure: number;
  spot: number;
}

/** 한 시간 단위의 정규화된 환경 값 */
export interface HourConditions {
  time: string; // ISO (UTC)
  windMs: number | null;
  windDir: number | null;
  gustMs: number | null;
  precipMm: number | null;
  pressureHpa: number | null;
  visibilityKm: number | null;
  airTempC: number | null;
  waveM: number | null;
  wavePeriodS: number | null;
  swellM: number | null;
  swellPeriodS: number | null;
  seaTempC: number | null;
}

export interface TidePoint {
  time: string;
  cm: number;
}

export interface TideExtreme extends TidePoint {
  type: "HIGH" | "LOW";
}

export type SourceKind = "KHOA" | "KMA" | "OPEN_METEO" | "ESTIMATE" | "DEMO";

export interface ConditionsBundle {
  hours: HourConditions[];
  /** 과거 24시간 수온(수온 변화 계산용). 없으면 빈 배열 */
  seaTempHistory: { time: string; c: number }[];
  tide: { series: TidePoint[]; extremes: TideExtreme[] };
  sources: { tide: SourceKind; weather: SourceKind; marine: SourceKind };
  notes: string[];
  fetchedAt: string;
}

export type SafetyLevel = "OK" | "CAUTION" | "DANGER";

export interface Reason {
  label: string;
  effect: 1 | 0 | -1;
}

export interface SubScores {
  tide: number;
  wind: number;
  wave: number;
  temp: number;
  light: number;
  pressure: number;
  spot: number;
}

export interface HourScore {
  time: string;
  score: number;
  grade: Grade;
  safety: SafetyLevel;
  safetyReasons: string[];
  sub: SubScores;
  season: number;
  reasons: Reason[];
  tideCm: number | null;
  tidePhase: "FLOOD" | "EBB" | "SLACK" | null;
  /** 골든타임 후보가 될 수 있는 시간인가 (위험·금어기·선상 출항 시간 외는 false) */
  available: boolean;
  cond: HourConditions;
}

export type Grade = "BEST" | "GOOD" | "FAIR" | "POOR" | "BAD" | "DANGER";

export interface GoldenBlock {
  start: string;
  end: string;
  avg: number;
  peak: number;
  reasons: Reason[];
}

export interface DaySummary {
  date: string; // YYYY-MM-DD (KST)
  lunarDay: number;
  mulddae: string;
  springness: number;
  moonPhase: string;
  moonIllumination: number;
  sunrise: string;
  sunset: string;
  best: number;
  verdict: "GO" | "OK" | "SKIP" | "DANGER";
  golden: GoldenBlock[];
  /** 오늘이면 지금 이후 남은 시간 기준 최고점·다음 골든타임. 미래 날짜는 null(전체 golden 사용), 지난 날은 remainingBest=0 */
  remainingBest: number | null;
  nextGolden: GoldenBlock | null;
  dangerHours: number;
  extremes: TideExtreme[];
  tideRangeCm: number | null;
}

export interface ForecastResult {
  spotId: string;
  speciesId: string;
  algoVersion: string;
  hours: HourScore[];
  days: DaySummary[];
  tideSeries: TidePoint[];
  sources: ConditionsBundle["sources"];
  notes: string[];
  fetchedAt: string;
}
