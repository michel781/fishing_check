import type { Spot, TideStation } from "@/lib/types";
import { coastSpots, ST2 } from "./coastSpots";

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
  // 전남·남해·부산·울산·제주 (v1.5)
  yeonggwang: { code: "DT_0003", name: "영광", springRangeM: 5.6, neapRangeM: 2.4, hwiHours: 3.9 },
  mokpo: { code: "DT_0007", name: "목포", springRangeM: 3.9, neapRangeM: 1.7, hwiHours: 3.4 },
  jindo: { code: "DT_0028", name: "진도", springRangeM: 3.2, neapRangeM: 1.4, hwiHours: 2.8 },
  wando: { code: "DT_0027", name: "완도", springRangeM: 3.3, neapRangeM: 1.4, hwiHours: 2.4 },
  yeosu: { code: "DT_0016", name: "여수", springRangeM: 3.3, neapRangeM: 1.4, hwiHours: 2.2 },
  tongyeong: { code: "DT_0014", name: "통영", springRangeM: 2.6, neapRangeM: 1.1, hwiHours: 2.0 },
  geoje: { code: "DT_0029", name: "거제도", springRangeM: 2.0, neapRangeM: 0.9, hwiHours: 1.9 },
  busan: { code: "DT_0005", name: "부산", springRangeM: 1.2, neapRangeM: 0.5, hwiHours: 1.7 },
  ulsan: { code: "DT_0020", name: "울산", springRangeM: 0.6, neapRangeM: 0.25, hwiHours: 2.2 },
  jeju: { code: "DT_0004", name: "제주", springRangeM: 2.3, neapRangeM: 1.0, hwiHours: 1.4 },
  seogwipo: { code: "DT_0010", name: "서귀포", springRangeM: 2.1, neapRangeM: 0.9, hwiHours: 1.3 },
  seongsanpo: { code: "DT_0022", name: "성산포", springRangeM: 1.9, neapRangeM: 0.8, hwiHours: 1.4 },
  moseulpo: { code: "DT_0023", name: "모슬포", springRangeM: 2.2, neapRangeM: 0.9, hwiHours: 1.3 },
} satisfies Record<string, TideStation>;

const BASE_SPOTS: Spot[] = [
  // ───────── 서해 ─────────
  {
    id: "sihwa-seawall", name: "시화방조제", area: "안산·시흥", sea: "WEST", type: "OUTER_HARBOR",
    lat: 37.305, lon: 126.62, facingDeg: 225, station: ST.ansan, bottom: "MIXED", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "flatfish", "greenling", "halfbeak", "webfoot"],
    notes: "'수도권 워킹 낚시의 성지'. 서울 한강 이남에서 40~50분. 시화나래휴게소나 방조제 중간 초소 부근에 주차 후 석축으로 내려가요. 밤에는 석축 이끼가 매우 미끄럽고(특히 2단 석축 아래), 조류가 강하고 밑걸림이 심해 채비를 넉넉히. 테트라포드 구간 추락 주의, 일부 구간 출입통제.",
  },
  {
    id: "sammok-wharf", name: "영종도 삼목선착장", area: "인천 중구(영종도)", sea: "WEST", type: "INNER_HARBOR",
    lat: 37.4986, lon: 126.4302, facingDeg: 300, station: ST.incheon, bottom: "MUD",
    nightOk: true, parking: true, toilet: true, species: ["goby", "conger", "rockfish", "webfoot"],
    notes: "밤에도 가로등이 밝고 발판이 편해 초보·가족 밤낚시에 좋아요. 가을엔 망둥어가 많고 운이 좋으면 붕장어·조기도. 선착장 끝단이나 방파제 석축 라인에서 원투. 배가 드나드는 자리는 피하세요.",
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
  {
    id: "gyema", name: "영광 계마항", area: "영광", sea: "WEST", type: "OUTER_HARBOR",
    lat: 35.357, lon: 126.35, facingDeg: 270, station: ST.yeonggwang, bottom: "MIXED", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["rockfish", "webfoot", "cuttlefish", "greenling"],
  },
  {
    id: "mokpo-boat", name: "목포 북항 선상", area: "목포", sea: "WEST", type: "BOAT",
    lat: 34.806, lon: 126.365, facingDeg: 270, station: ST.mokpo, bottom: "MUD",
    parking: true, toilet: true, species: ["webfoot", "cuttlefish", "flatfish", "rockfish"],
  },

  // ───────── 남해 (전남·경남·부산·제주) ─────────
  {
    id: "seomang", name: "진도 서망항", area: "진도", sea: "SOUTH", type: "OUTER_HARBOR",
    lat: 34.367, lon: 126.132, facingDeg: 200, station: ST.jindo, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["blackporgy", "rockfish", "bolak", "cuttlefish"],
    notes: "울돌목 쪽은 물살이 매우 빠릅니다.",
  },
  {
    id: "wando", name: "완도항 방파제", area: "완도", sea: "SOUTH", type: "BREAKWATER_TIP",
    lat: 34.312, lon: 126.758, facingDeg: 160, station: ST.wando, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["blackporgy", "bolak", "mackerel", "cuttlefish"],
  },
  {
    id: "wando-inner", name: "완도항 내항", area: "완도", sea: "SOUTH", type: "INNER_HARBOR",
    lat: 34.318, lon: 126.752, facingDeg: 180, station: ST.wando, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "바람·파도가 센 날 대안 포인트.",
  },
  {
    id: "yeosu-inner", name: "여수 국동항 내항", area: "여수", sea: "SOUTH", type: "INNER_HARBOR",
    lat: 34.731, lon: 127.727, facingDeg: 200, station: ST.yeosu, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "greenling"],
    notes: "바람·파도가 센 날 대안 포인트.",
  },
  {
    id: "dolsan-rock", name: "여수 돌산 갯바위", area: "여수", sea: "SOUTH", type: "ROCK",
    lat: 34.594, lon: 127.8, facingDeg: 160, station: ST.yeosu, bottom: "ROCK",
    parking: true, toilet: true, species: ["blackporgy", "squid-bigfin", "bolak", "greenling"],
    notes: "갯바위 이동 시 물때 확인 필수. 들물에 퇴로가 잠기는 자리가 있습니다.",
  },
  {
    id: "yeosu-boat", name: "여수 국동항 선상", area: "여수", sea: "SOUTH", type: "BOAT",
    lat: 34.728, lon: 127.724, facingDeg: 180, station: ST.yeosu, bottom: "MIXED",
    parking: true, toilet: true, species: ["redseabream", "webfoot", "cuttlefish", "rockfish"],
  },
  {
    id: "mijo", name: "남해 미조항", area: "남해", sea: "SOUTH", type: "OUTER_HARBOR",
    lat: 34.713, lon: 128.047, facingDeg: 150, station: ST.yeosu, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["blackporgy", "bolak", "mackerel", "squid-bigfin"],
  },
  {
    id: "cheokpo", name: "통영 척포 방파제", area: "통영", sea: "SOUTH", type: "BREAKWATER_TIP",
    lat: 34.78, lon: 128.4, facingDeg: 180, station: ST.tongyeong, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, species: ["blackporgy", "bolak", "squid-bigfin", "mackerel"],
  },
  {
    id: "tongyeong-boat", name: "통영항 선상", area: "통영", sea: "SOUTH", type: "BOAT",
    lat: 34.842, lon: 128.423, facingDeg: 180, station: ST.tongyeong, bottom: "MIXED",
    parking: true, toilet: true, species: ["redseabream", "rockfish", "cuttlefish", "mackerel"],
  },
  {
    id: "jisepo", name: "거제 지세포항", area: "거제", sea: "SOUTH", type: "OUTER_HARBOR",
    lat: 34.83, lon: 128.708, facingDeg: 120, station: ST.geoje, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["squid-bigfin", "blackporgy", "mackerel", "bolak"],
  },
  {
    id: "dadaepo", name: "부산 다대포항", area: "사하", sea: "SOUTH", type: "INNER_HARBOR",
    lat: 35.048, lon: 128.966, facingDeg: 180, station: ST.busan, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "blackporgy", "greenling"],
  },
  {
    id: "daebyeon", name: "부산 기장 대변항", area: "기장", sea: "SOUTH", type: "OUTER_HARBOR",
    lat: 35.225, lon: 129.23, facingDeg: 110, station: ST.busan, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "blackporgy", "squid-bigfin", "bolak", "halfbeak"],
  },
  {
    id: "dodu", name: "제주 도두항 방파제", area: "제주시", sea: "SOUTH", type: "OUTER_HARBOR",
    lat: 33.51, lon: 126.466, facingDeg: 0, station: ST.jeju, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["squid-bigfin", "mackerel", "blackporgy", "halfbeak"],
  },
  {
    id: "saeyeon", name: "서귀포 새연교 방파제", area: "서귀포", sea: "SOUTH", type: "BREAKWATER_TIP",
    lat: 33.238, lon: 126.558, facingDeg: 180, station: ST.seogwipo, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["squid-bigfin", "blackporgy", "bolak", "mackerel"],
  },
  {
    id: "hallim-inner", name: "제주 한림항 내항", area: "제주시", sea: "SOUTH", type: "INNER_HARBOR",
    lat: 33.414, lon: 126.264, facingDeg: 0, station: ST.moseulpo, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "바람이 센 날 대안 포인트.",
  },
  {
    id: "seogwipo-inner", name: "서귀포항 내항", area: "서귀포", sea: "SOUTH", type: "INNER_HARBOR",
    lat: 33.241, lon: 126.563, facingDeg: 180, station: ST.seogwipo, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "바람이 센 날 대안 포인트.",
  },
  {
    id: "seongsan-boat", name: "제주 성산포 선상", area: "서귀포", sea: "SOUTH", type: "BOAT",
    lat: 33.468, lon: 126.935, facingDeg: 90, station: ST.seongsanpo, bottom: "ROCK",
    parking: true, toilet: true, species: ["redseabream", "mackerel", "cuttlefish"],
  },
  {
    id: "moseulpo", name: "제주 모슬포항", area: "서귀포", sea: "SOUTH", type: "OUTER_HARBOR",
    lat: 33.214, lon: 126.251, facingDeg: 200, station: ST.moseulpo, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["squid-bigfin", "blackporgy", "mackerel"],
    notes: "바람이 센 곳입니다. 북서풍이 강한 날은 피하세요.",
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
    id: "seorak-inner", name: "속초 설악항 내항", area: "속초", sea: "EAST", type: "INNER_HARBOR",
    lat: 38.163, lon: 128.612, facingDeg: 270, station: ST.sokcho, bottom: "MIXED", approx: true,
    species: ["greenling", "bolak", "rockfish", "righteye", "halfbeak"],
    structures: ["seawall", "vertical", "light", "sand", "inout"],
    notes: "큰 방파제 내항·작은 방파제 쪽 평평한 발판에서. 외항 테트라포드에는 올라가지 마세요. 속초시 수역은 문어 낚시 금지(조례).",
  },
  {
    id: "mulchi-inner", name: "양양 물치항 내항", area: "양양", sea: "EAST", type: "INNER_HARBOR",
    lat: 38.136, lon: 128.621, facingDeg: 270, station: ST.sokcho, bottom: "SAND", approx: true,
    parking: true, toilet: true, species: ["righteye", "greenling", "bolak", "halfbeak"],
    structures: ["sand", "seawall", "edge", "light", "inout"],
    notes: "내항 바닥은 대부분 모래라 원투에 맞다고 소개된 곳(강도다리·황어 기록). 외항 테트라포드는 수면과 높이 차가 커서 위험.",
  },
  {
    id: "naksan-inner", name: "양양 낙산항 내항", area: "양양", sea: "EAST", type: "INNER_HARBOR",
    lat: 38.121, lon: 128.634, facingDeg: 270, station: ST.sokcho, bottom: "MIXED", approx: true,
    species: ["greenling", "bolak", "halfbeak", "mackerel", "righteye"],
    structures: ["seawall", "vertical", "light", "edge", "inout"],
    notes: "외항은 수중여가 많고 얕다고 소개됨. 내항 바닥 재질은 확인 안 됨 — 원투 전에 끌어 보며 확인하세요.",
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
  {
    id: "jeongja", name: "울산 정자항", area: "울산 북구", sea: "EAST", type: "OUTER_HARBOR",
    lat: 35.621, lon: 129.453, facingDeg: 90, station: ST.ulsan, bottom: "ROCK", tetrapod: true,
    nightOk: true, parking: true, toilet: true, species: ["mackerel", "squid-bigfin", "blackporgy", "bolak"],
  },
  {
    id: "bangeojin-inner", name: "울산 방어진항 내항", area: "울산 동구", sea: "EAST", type: "INNER_HARBOR",
    lat: 35.489, lon: 129.425, facingDeg: 270, station: ST.ulsan, bottom: "MIXED",
    nightOk: true, parking: true, toilet: true, species: ["halfbeak", "mackerel", "bolak"],
    notes: "너울이 있는 날 대안 포인트.",
  },
  {
    id: "bangeojin-boat", name: "울산 방어진항 선상", area: "울산 동구", sea: "EAST", type: "BOAT",
    lat: 35.487, lon: 129.43, facingDeg: 90, station: ST.ulsan, bottom: "SAND",
    parking: true, toilet: true, species: ["righteye", "flatfish", "mackerel"],
  },
];

/**
 * v1.6 추가 어종을 포인트 성격(해역·유형·바닥)에 맞춰 붙인다.
 * 현장 조황으로 계속 다듬을 초기 규칙이다.
 */
const EXTRA: [string, (s: Spot) => boolean][] = [
  ["hairtail", (s) => (s.sea === "SOUTH" && ["OUTER_HARBOR", "BREAKWATER_TIP", "INNER_HARBOR", "BOAT"].includes(s.type)) || s.id === "mokpo-boat"],
  ["seabass", (s) => ["ROCK", "BREAKWATER_TIP", "SURF", "OUTER_HARBOR"].includes(s.type)],
  ["opaleye", (s) => (s.sea === "SOUTH" && ["ROCK", "BREAKWATER_TIP", "OUTER_HARBOR"].includes(s.type)) || (s.sea === "EAST" && s.type === "ROCK")],
  ["spanishmackerel", (s) => s.type === "BREAKWATER_TIP" || (s.type === "OUTER_HARBOR" && s.sea !== "WEST")],
  ["yellowtail", (s) => s.sea === "SOUTH" && (s.type === "BOAT" || s.type === "ROCK")],
  ["mullet", (s) => s.type === "INNER_HARBOR" || s.type === "TIDAL_FLAT"],
  ["gizzardshad", (s) => s.type === "INNER_HARBOR" && s.sea !== "EAST"],
  ["dodari", (s) => s.type === "SURF" || (s.type === "BOAT" && s.bottom !== "ROCK")],
  ["octopus", (s) => (s.type === "BOAT" && s.sea !== "WEST" && s.bottom !== "SAND") || (s.type === "ROCK" && s.sea === "SOUTH") || (s.type === "BREAKWATER_TIP" && s.sea === "EAST")],
  ["conger", (s) => s.type === "OUTER_HARBOR" || s.type === "SURF"],
  ["goby", (s) => s.sea === "WEST" && ["INNER_HARBOR", "OUTER_HARBOR", "TIDAL_FLAT"].includes(s.type)],
  ["rockbream", (s) => s.type === "ROCK" && s.sea !== "WEST"],
  ["squid", (s) => (s.type === "BOAT" && s.sea === "EAST") || s.id === "seongsan-boat" || (s.type === "BREAKWATER_TIP" && s.sea === "EAST")],
];

// v1.16: 바다를 낀 모든 시·군·구의 대표 낚시 장소 (좌표 대략값)
const ALL_BASE: Spot[] = [...BASE_SPOTS, ...coastSpots({ ...ST, ...ST2 })];
{
  const seen = new Set<string>();
  for (const s of ALL_BASE) {
    if (seen.has(s.id)) throw new Error(`포인트 id 중복: ${s.id}`);
    seen.add(s.id);
  }
}

export const SPOTS: Spot[] = ALL_BASE.map((s) => ({
  ...s,
  species: [...s.species, ...EXTRA.filter(([id, ok]) => ok(s) && !s.species.includes(id)).map(([id]) => id)],
}));

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

export const SEA_LABEL: Record<Spot["sea"], string> = { WEST: "서해", EAST: "동해", SOUTH: "남해" };

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

/** 길찾기 링크: 좌표가 대략값이면 이름 검색, 정확하면 좌표 길찾기 */
export function navUrl(s: Pick<Spot, "name" | "area" | "lat" | "lon" | "approx">): string {
  return s.approx
    ? `https://map.kakao.com/link/search/${encodeURIComponent(s.name)}`
    : `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lon}`;
}
