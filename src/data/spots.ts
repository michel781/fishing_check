import type { Spot, TideStation } from "@/lib/types";

/**
 * 베타 포인트.
 * - 좌표는 항·방파제 대표 지점의 대략값입니다. 베타 전 현장 검증이 필요합니다.
 * - 조위관측소 코드는 국립해양조사원 기준이며, springRange/neapRange/hwi 는
 *   API 키가 없을 때 쓰는 "추정 모델"용 근사값입니다(실제 조석예보 대체 불가).
 */
const ST = {
  incheon: { code: "DT_0001", name: "인천", springRangeM: 8.0, neapRangeM: 3.4, hwiHours: 4.9 },
  ansan: { code: "DT_0008", name: "안산", springRangeM: 7.6, neapRangeM: 3.2, hwiHours: 4.8 },
  pyeongtaek: { code: "DT_0002", name: "평택", springRangeM: 8.1, neapRangeM: 3.4, hwiHours: 5.0 },
  daesan: { code: "DT_0017", name: "대산", springRangeM: 6.3, neapRangeM: 2.7, hwiHours: 4.4 },
  anheung: { code: "DT_0067", name: "안흥", springRangeM: 5.2, neapRangeM: 2.2, hwiHours: 3.9 },
  boryeong: { code: "DT_0025", name: "보령", springRangeM: 6.1, neapRangeM: 2.6, hwiHours: 4.3 },
  janghang: { code: "DT_0024", name: "장항", springRangeM: 6.2, neapRangeM: 2.6, hwiHours: 4.3 },
  gunsan: { code: "DT_0018", name: "군산", springRangeM: 6.3, neapRangeM: 2.7, hwiHours: 4.2 },
  wido: { code: "DT_0068", name: "위도", springRangeM: 5.0, neapRangeM: 2.1, hwiHours: 3.6 },
  sokcho: { code: "DT_0012", name: "속초", springRangeM: 0.3, neapRangeM: 0.12, hwiHours: 3.0 },
  mukho: { code: "DT_0006", name: "묵호", springRangeM: 0.3, neapRangeM: 0.12, hwiHours: 3.0 },
  hupo: { code: "DT_0011", name: "후포", springRangeM: 0.25, neapRangeM: 0.1, hwiHours: 3.0 },
  pohang: { code: "DT_0091", name: "포항", springRangeM: 0.25, neapRangeM: 0.1, hwiHours: 3.0 },
} satisfies Record<string, TideStation>;

export const SPOTS: Spot[] = [
  // ───────── 서해 ─────────
  {
    id: "sihwa-seawall", name: "시화방조제", area: "안산·시흥", sea: "WEST", type: "OUTER_HARBOR",
    lat: 37.305, lon: 126.62, facingDeg: 225, station: ST.ansan, bottom: "MIXED", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "greenling", "halfbeak", "webfoot"],
    notes: "수도권 접근성 최고. 테트라포드 구간 추락 주의, 일부 구간 출입통제.",
  },
  {
    id: "yeongheung-jindu", name: "영흥도 진두선착장", area: "옹진", sea: "WEST", type: "OUTER_HARBOR",
    lat: 37.256, lon: 126.472, facingDeg: 270, station: ST.incheon, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "greenling", "webfoot", "cuttlefish"],
  },
  {
    id: "gungpyeong", name: "궁평항 방파제", area: "화성", sea: "WEST", type: "BREAKWATER_TIP",
    lat: 37.116, lon: 126.675, facingDeg: 250, station: ST.pyeongtaek, bottom: "MUD", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "halfbeak", "webfoot", "greenling"],
    notes: "조차가 매우 커서 간조 때 수심이 급감. 들물 타이밍이 핵심.",
  },
  {
    id: "samgilpo", name: "삼길포항", area: "서산", sea: "WEST", type: "INNER_HARBOR",
    lat: 37.004, lon: 126.452, facingDeg: 0, station: ST.daesan, bottom: "MUD",
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "halfbeak", "webfoot"],
    notes: "우럭 좌대낚시로 유명. 바람 강한 날 대안 포인트.",
  },
  {
    id: "sinjin-outer", name: "신진도 외항 방파제", area: "태안", sea: "WEST", type: "OUTER_HARBOR",
    lat: 36.674, lon: 126.132, facingDeg: 240, station: ST.anheung, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "greenling", "blackporgy", "halfbeak", "cuttlefish"],
  },
  {
    id: "sinjin-inner", name: "신진도 내항", area: "태안", sea: "WEST", type: "INNER_HARBOR",
    lat: 36.679, lon: 126.139, facingDeg: 90, station: ST.anheung, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "rockfish", "webfoot"],
  },
  {
    id: "sinjin-boat", name: "신진도항 선상", area: "태안", sea: "WEST", type: "BOAT",
    lat: 36.676, lon: 126.136, facingDeg: 240, station: ST.anheung, bottom: "ROCK",
    parking: true, toilet: true, species: ["rockfish", "flatfish", "redseabream", "webfoot", "cuttlefish"],
    notes: "우럭·광어·참돔 선상 출항지. 출항 여부는 선장·해경 판단을 따르세요.",
  },
  {
    id: "ocheon-boat", name: "오천항 선상", area: "보령", sea: "WEST", type: "BOAT",
    lat: 36.438, lon: 126.518, facingDeg: 250, station: ST.boryeong, bottom: "MUD",
    parking: true, toilet: true, species: ["webfoot", "cuttlefish", "rockfish", "flatfish"],
    notes: "가을 주꾸미·갑오징어 선상의 메카.",
  },
  {
    id: "daecheon", name: "대천항 방파제", area: "보령", sea: "WEST", type: "BREAKWATER_TIP",
    lat: 36.325, lon: 126.508, facingDeg: 260, station: ST.boryeong, bottom: "MIXED", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "greenling", "halfbeak", "webfoot", "blackporgy"],
  },
  {
    id: "hongwon", name: "홍원항", area: "서천", sea: "WEST", type: "OUTER_HARBOR",
    lat: 36.153, lon: 126.502, facingDeg: 250, station: ST.janghang, bottom: "MUD",
    nightOk: true, parking: true, toilet: true, species: ["webfoot", "cuttlefish", "rockfish", "halfbeak"],
  },
  {
    id: "biung-boat", name: "비응항 선상", area: "군산", sea: "WEST", type: "BOAT",
    lat: 35.941, lon: 126.527, facingDeg: 260, station: ST.gunsan, bottom: "MIXED",
    parking: true, toilet: true, species: ["redseabream", "flatfish", "rockfish", "webfoot", "cuttlefish"],
  },
  {
    id: "gyeokpo-rock", name: "격포 갯바위", area: "부안", sea: "WEST", type: "ROCK",
    lat: 35.624, lon: 126.466, facingDeg: 270, station: ST.wido, bottom: "ROCK",
    parking: true, toilet: true, species: ["blackporgy", "rockfish", "greenling", "bolak"],
    notes: "간조 때 드러나는 갯바위. 들물 고립에 특히 주의.",
  },
  {
    id: "gyeokpo-harbor", name: "격포항 방파제", area: "부안", sea: "WEST", type: "OUTER_HARBOR",
    lat: 35.628, lon: 126.47, facingDeg: 280, station: ST.wido, bottom: "MIXED", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "halfbeak", "webfoot", "cuttlefish", "blackporgy"],
  },
  {
    id: "gyeokpo-inner", name: "격포항 내항", area: "부안", sea: "WEST", type: "INNER_HARBOR",
    lat: 35.629, lon: 126.474, facingDeg: 90, station: ST.wido, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "rockfish", "webfoot", "cuttlefish"],
    notes: "바람·파도가 센 날 격포 갯바위·외항 대신 갈 수 있는 곳.",
  },
  {
    id: "baeksajang-flat", name: "안면도 백사장 갯벌", area: "태안", sea: "WEST", type: "TIDAL_FLAT",
    lat: 36.588, lon: 126.31, facingDeg: 270, station: ST.anheung, bottom: "MUD",
    parking: true, toilet: true, species: ["flatfish", "rockfish"],
    notes: "물이 들어오는 속도가 빠릅니다. 간조 전후 먼 곳까지 나가지 마세요.",
  },

  // ───────── 동해 ─────────
  {
    id: "sokcho-outer", name: "속초항 방파제", area: "속초", sea: "EAST", type: "BREAKWATER_TIP",
    lat: 38.207, lon: 128.603, facingDeg: 90, station: ST.sokcho, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "bolak", "greenling", "halfbeak", "squid-bigfin"],
  },
  {
    id: "dongmyeong-inner", name: "속초 동명항 내항", area: "속초", sea: "EAST", type: "INNER_HARBOR",
    lat: 38.212, lon: 128.598, facingDeg: 180, station: ST.sokcho, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "너울이 있는 날 대안 포인트.",
  },
  {
    id: "hajodae-rock", name: "양양 하조대 갯바위", area: "양양", sea: "EAST", type: "ROCK",
    lat: 38.024, lon: 128.72, facingDeg: 90, station: ST.sokcho, bottom: "ROCK",
    parking: true, toilet: true, species: ["blackporgy", "squid-bigfin", "bolak", "greenling"],
    notes: "너울 고립 사고 다발 지역. 파주기 8초 이상이면 진입 금지.",
  },
  {
    id: "namae", name: "양양 남애항", area: "양양", sea: "EAST", type: "OUTER_HARBOR",
    lat: 37.944, lon: 128.787, facingDeg: 90, station: ST.sokcho, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "bolak", "squid-bigfin", "blackporgy"],
  },
  {
    id: "jumunjin", name: "주문진항 방파제", area: "강릉", sea: "EAST", type: "BREAKWATER_TIP",
    lat: 37.892, lon: 128.83, facingDeg: 80, station: ST.mukho, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "bolak", "halfbeak", "squid-bigfin"],
  },
  {
    id: "jumunjin-boat", name: "주문진항 선상", area: "강릉", sea: "EAST", type: "BOAT",
    lat: 37.889, lon: 128.83, facingDeg: 80, station: ST.mukho, bottom: "SAND",
    parking: true, toilet: true, species: ["righteye", "mackerel", "flatfish"],
  },
  {
    id: "anmok-surf", name: "강릉 안목해변 원투", area: "강릉", sea: "EAST", type: "SURF",
    lat: 37.772, lon: 128.948, facingDeg: 70, station: ST.mukho, bottom: "SAND",
    parking: true, toilet: true, species: ["righteye", "flatfish"],
    notes: "이안류 주의.",
  },
  {
    id: "mukho", name: "동해 묵호항", area: "동해", sea: "EAST", type: "OUTER_HARBOR",
    lat: 37.548, lon: 129.118, facingDeg: 90, station: ST.mukho, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "bolak", "halfbeak", "greenling"],
  },
  {
    id: "mukho-inner", name: "묵호항 내항", area: "동해", sea: "EAST", type: "INNER_HARBOR",
    lat: 37.551, lon: 129.114, facingDeg: 270, station: ST.mukho, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "너울이 있는 날 대안 포인트.",
  },
  {
    id: "imwon-inner", name: "임원항 내항", area: "삼척", sea: "EAST", type: "INNER_HARBOR",
    lat: 37.23, lon: 129.342, facingDeg: 270, station: ST.mukho, bottom: "MIXED",
    nightOk: true, parking: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "너울이 있는 날 대안 포인트.",
  },
  {
    id: "imwon", name: "삼척 임원항", area: "삼척", sea: "EAST", type: "BREAKWATER_TIP",
    lat: 37.228, lon: 129.346, facingDeg: 90, station: ST.mukho, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, species: ["mackerel", "squid-bigfin", "bolak", "blackporgy"],
  },
  {
    id: "hupo", name: "울진 후포항", area: "울진", sea: "EAST", type: "OUTER_HARBOR",
    lat: 36.678, lon: 129.455, facingDeg: 90, station: ST.hupo, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "squid-bigfin", "bolak", "righteye"],
  },
  {
    id: "ganggu", name: "영덕 강구항", area: "영덕", sea: "EAST", type: "INNER_HARBOR",
    lat: 36.358, lon: 129.389, facingDeg: 90, station: ST.pohang, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
  },
  {
    id: "guryongpo", name: "포항 구룡포항", area: "포항", sea: "EAST", type: "OUTER_HARBOR",
    lat: 35.99, lon: 129.558, facingDeg: 90, station: ST.pohang, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "squid-bigfin", "blackporgy", "bolak", "righteye"],
  },
];

export const SPOTS_BY_ID: Record<string, Spot> = Object.fromEntries(SPOTS.map((s) => [s.id, s]));

export function getSpot(id: string): Spot | undefined {
  return SPOTS_BY_ID[id];
}

export const SPOT_TYPE_LABEL: Record<Spot["type"], string> = {
  INNER_HARBOR: "내항",
  OUTER_HARBOR: "외항 방파제",
  BREAKWATER_TIP: "방파제 끝",
  ROCK: "갯바위",
  SURF: "백사장 원투",
  BOAT: "선상",
  TIDAL_FLAT: "갯벌 연안",
};

export const SEA_LABEL: Record<Spot["sea"], string> = { WEST: "서해", EAST: "동해" };

/** 두 지점 사이 거리(km) */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearbySpots(spot: Spot, maxKm = 45): { spot: Spot; km: number }[] {
  return SPOTS.filter((s) => s.id !== spot.id && s.sea === spot.sea)
    .map((s) => ({ spot: s, km: distanceKm(spot.lat, spot.lon, s.lat, s.lon) }))
    .filter((x) => x.km <= maxKm)
    .sort((a, b) => a.km - b.km);
}
