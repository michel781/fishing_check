import type { Sea, Spot, SpotType, TideStation } from "@/lib/types";

/**
 * v1.16 전국 해안 시·군·구 커버리지 확장.
 * 바다를 낀 모든 시·군·구에 낚시가 이뤄지는 대표 항·방파제·갯바위·해변을 1~4곳씩 넣었다.
 * - 좌표는 항구 중심 부근의 대략값(approx). 길찾기는 이름 검색으로 연결한다.
 * - 조위관측소는 가장 가까운 국립해양조사원 관측소. 코드가 맞지 않으면 앱이 자동으로 해양모델·추정값으로 바꾼다.
 * - 출입 통제·낚시 금지 구역은 수시로 바뀐다 → 화면에서 '현장 안내 확인'을 늘 안내한다.
 */

export const ST2 = {
  ganghwa: { code: "DT_0032", name: "강화대교", springRangeM: 8.0, neapRangeM: 3.4, hwiHours: 5.2 },
  deokjeok: { code: "DT_0065", name: "덕적도", springRangeM: 7.0, neapRangeM: 3.0, hwiHours: 4.6 },
  heuksan: { code: "DT_0035", name: "흑산도", springRangeM: 3.0, neapRangeM: 1.3, hwiHours: 3.0 },
  chuja: { code: "DT_0021", name: "추자도", springRangeM: 2.6, neapRangeM: 1.1, hwiHours: 1.9 },
  geomun: { code: "DT_0031", name: "거문도", springRangeM: 2.6, neapRangeM: 1.1, hwiHours: 2.0 },
  goheung: { code: "DT_0026", name: "고흥발포", springRangeM: 3.2, neapRangeM: 1.4, hwiHours: 2.3 },
  gwangyang: { code: "DT_0049", name: "광양", springRangeM: 3.4, neapRangeM: 1.5, hwiHours: 2.3 },
  samcheonpo: { code: "DT_0061", name: "삼천포", springRangeM: 2.8, neapRangeM: 1.2, hwiHours: 2.1 },
  masan: { code: "DT_0062", name: "마산", springRangeM: 1.8, neapRangeM: 0.8, hwiHours: 2.0 },
  gadeok: { code: "DT_0063", name: "가덕도", springRangeM: 1.6, neapRangeM: 0.7, hwiHours: 1.8 },
  ulleung: { code: "DT_0013", name: "울릉도", springRangeM: 0.25, neapRangeM: 0.1, hwiHours: 3.0 },
} satisfies Record<string, TideStation>;

type Row = [
  id: string,
  name: string,
  area: string,
  sea: Sea,
  type: SpotType,
  lat: number,
  lon: number,
  facingDeg: number,
  station: string,
  /** t=테트라포드 n=밤낚시 p=주차 w=화장실 */
  flags: string,
  notes?: string,
];

const R: Row[] = [
  // ───── 인천·경기 ─────
  ["ganghwa-oepo", "강화 외포리선착장", "강화", "WEST", "INNER_HARBOR", 37.703, 126.372, 270, "ganghwa", "npw", "석모도 가는 배가 드나드는 곳. 배 동선을 피해서 낚시하세요."],
  ["gimpo-daemyeong", "김포 대명항", "김포", "WEST", "INNER_HARBOR", 37.654, 126.553, 270, "ganghwa", "npw", "군사 보호 구역과 가까워 통제 표지판을 꼭 확인하세요."],
  ["muui-gwangmyeong", "무의도 광명항", "인천 중구(영종도)", "WEST", "OUTER_HARBOR", 37.378, 126.422, 225, "incheon", "npw"],
  ["deokjeok-jinri", "덕적도 진리선착장", "옹진", "WEST", "OUTER_HARBOR", 37.229, 126.149, 180, "deokjeok", "npw", "배로 들어가는 섬. 마지막 배 시간을 꼭 확인하세요."],
  ["oido", "시흥 오이도 방파제", "시흥", "WEST", "OUTER_HARBOR", 37.346, 126.686, 250, "ansan", "tnpw", "수도권 전철로 가는 바다. 간조 때는 물이 멀리 빠져요."],
  ["daebu-bangameori", "대부도 방아머리 선착장", "안산", "WEST", "OUTER_HARBOR", 37.287, 126.564, 270, "ansan", "npw"],
  ["tando", "안산 탄도항", "안산", "WEST", "OUTER_HARBOR", 37.193, 126.646, 250, "ansan", "npw", "누에섬 가는 길은 물때에 따라 잠겨요. 고립 주의."],
  ["jeongok", "화성 전곡항", "화성", "WEST", "OUTER_HARBOR", 37.187, 126.651, 240, "ansan", "npw"],
  ["jebudo", "화성 제부도 방파제", "화성", "WEST", "OUTER_HARBOR", 37.166, 126.622, 260, "ansan", "tnpw", "섬으로 들어가는 바닷길이 물때에 따라 잠겨요. 통행 시간 확인 필수."],
  // ───── 충남 ─────
  ["janggo", "당진 장고항", "당진", "WEST", "OUTER_HARBOR", 37.032, 126.588, 300, "daesan", "tnpw", "봄 실치·가을 우럭으로 유명한 당진 대표 항구."],
  ["namdang", "홍성 남당항", "홍성", "WEST", "INNER_HARBOR", 36.537, 126.460, 270, "boryeong", "npw", "천수만 안쪽이라 바람 강한 날 대안."],
  ["hakampo", "태안 학암포", "태안", "WEST", "OUTER_HARBOR", 36.892, 126.205, 270, "daesan", "npw"],
  ["manripo", "태안 만리포 해변", "태안", "WEST", "SURF", 36.787, 126.142, 270, "anheung", "pw", "모래 해변 원투. 여름엔 해수욕 구역 낚시 금지."],
  ["yeongmok", "안면도 영목항", "태안", "WEST", "OUTER_HARBOR", 36.398, 126.429, 200, "boryeong", "npw"],
  ["muchangpo", "보령 무창포항", "보령", "WEST", "OUTER_HARBOR", 36.249, 126.540, 260, "boryeong", "tnpw"],
  ["maryang-seocheon", "서천 마량포구", "서천", "WEST", "OUTER_HARBOR", 36.130, 126.505, 250, "janghang", "npw"],
  // ───── 전북 ─────
  ["yamido", "군산 야미도 방파제", "군산", "WEST", "OUTER_HARBOR", 35.835, 126.505, 240, "gunsan", "tnpw", "새만금 방조제 길로 차로 가는 섬."],
  ["seonyudo", "군산 선유도", "군산", "WEST", "OUTER_HARBOR", 35.811, 126.418, 250, "gunsan", "npw"],
  ["simpo", "김제 심포항", "김제", "WEST", "INNER_HARBOR", 35.836, 126.672, 270, "gunsan", "npw", "갯벌이 넓어 들물 때 집중."],
  ["wido-pajang", "부안 위도 파장금항", "부안", "WEST", "OUTER_HARBOR", 35.616, 126.299, 260, "wido", "npw", "격포에서 배로 들어가는 섬."],
  ["mohang", "부안 모항", "부안", "WEST", "OUTER_HARBOR", 35.588, 126.530, 250, "wido", "npw"],
  ["gusipo", "고창 구시포항", "고창", "WEST", "OUTER_HARBOR", 35.432, 126.425, 260, "yeonggwang", "npw"],
  ["dongho", "고창 동호항", "고창", "WEST", "INNER_HARBOR", 35.483, 126.441, 270, "yeonggwang", "npw"],
  // ───── 전남 ─────
  ["beopseongpo", "영광 법성포", "영광", "WEST", "INNER_HARBOR", 35.360, 126.443, 300, "yeonggwang", "npw"],
  ["dorippo", "무안 도리포", "무안", "WEST", "OUTER_HARBOR", 35.153, 126.330, 300, "mokpo", "npw"],
  ["heuksan-yeri", "신안 흑산도 예리항", "신안", "WEST", "OUTER_HARBOR", 34.681, 125.430, 200, "heuksan", "npw", "먼바다 섬. 배편·기상 확인 필수."],
  ["heuksan-inner", "신안 흑산도 예리항 내항", "신안", "WEST", "INNER_HARBOR", 34.683, 125.433, 90, "heuksan", "npw", "섬 안쪽 항구. 바깥이 거칠 때 대안."],
  ["paengmok", "진도 팽목항", "진도", "SOUTH", "OUTER_HARBOR", 34.385, 126.135, 200, "jindo", "npw"],
  ["ttangkkeut", "해남 땅끝항", "해남", "SOUTH", "OUTER_HARBOR", 34.299, 126.530, 180, "wando", "npw"],
  ["cheongsan", "완도 청산도 도청항", "완도", "SOUTH", "OUTER_HARBOR", 34.180, 126.858, 180, "wando", "npw"],
  ["bogil", "완도 보길도 갯바위", "완도", "SOUTH", "ROCK", 34.153, 126.554, 180, "wando", "p", "갯바위는 너울·고립 위험. 구명조끼 필수."],
  ["maryang-gangjin", "강진 마량항", "강진", "SOUTH", "OUTER_HARBOR", 34.449, 126.820, 180, "wando", "npw"],
  ["hoejin", "장흥 회진항", "장흥", "SOUTH", "OUTER_HARBOR", 34.433, 126.970, 180, "goheung", "npw"],
  ["yulpo", "보성 율포항", "보성", "SOUTH", "OUTER_HARBOR", 34.670, 127.090, 180, "goheung", "npw"],
  ["nokdong", "고흥 녹동항", "고흥", "SOUTH", "OUTER_HARBOR", 34.523, 127.140, 200, "goheung", "tnpw"],
  ["naro", "고흥 나로도항", "고흥", "SOUTH", "OUTER_HARBOR", 34.460, 127.452, 180, "goheung", "npw"],
  ["geomundo", "여수 거문도 갯바위", "여수", "SOUTH", "ROCK", 34.028, 127.309, 180, "geomun", "p", "먼바다 갯바위 명소. 배편·기상·너울 확인 필수."],
  ["geomun-inner", "여수 거문도 거문항 내항", "여수", "SOUTH", "INNER_HARBOR", 34.030, 127.307, 90, "geomun", "npw", "세 섬이 감싼 안쪽 항구. 너울 날 대안."],
  ["mangdeok", "광양 망덕포구", "광양", "SOUTH", "INNER_HARBOR", 34.950, 127.771, 180, "gwangyang", "npw"],
  // ───── 경남 ─────
  ["noryang", "하동 노량항", "하동", "SOUTH", "OUTER_HARBOR", 34.940, 127.872, 180, "gwangyang", "npw", "물살이 아주 빠른 해협. 채비를 무겁게."],
  ["mulgeon", "남해 물건항", "남해", "SOUTH", "OUTER_HARBOR", 34.800, 128.046, 90, "samcheonpo", "tnpw"],
  ["sangju", "남해 상주은모래해변", "남해", "SOUTH", "SURF", 34.719, 127.990, 180, "samcheonpo", "pw", "여름 해수욕 구역은 낚시 금지."],
  ["samcheonpo", "사천 삼천포항", "사천", "SOUTH", "OUTER_HARBOR", 34.924, 128.069, 180, "samcheonpo", "tnpw"],
  ["dangpo-goseong", "고성 당항포", "고성(경남)", "SOUTH", "INNER_HARBOR", 35.052, 128.391, 180, "masan", "npw"],
  ["dala", "통영 달아항", "통영", "SOUTH", "OUTER_HARBOR", 34.777, 128.370, 200, "tongyeong", "npw"],
  ["yokjido", "통영 욕지도 갯바위", "통영", "SOUTH", "ROCK", 34.630, 128.270, 180, "tongyeong", "p", "배로 가는 갯바위 명소. 너울 주의."],
  ["gujora", "거제 구조라항", "거제", "SOUTH", "OUTER_HARBOR", 34.804, 128.690, 120, "geoje", "tnpw"],
  ["jangseungpo", "거제 장승포항", "거제", "SOUTH", "INNER_HARBOR", 34.866, 128.731, 90, "geoje", "npw"],
  ["jinhae-myeongdong", "창원 진해 명동 방파제", "창원", "SOUTH", "OUTER_HARBOR", 35.104, 128.721, 180, "masan", "npw"],
  // ───── 부산 ─────
  ["gadeok-daehang", "부산 가덕도 대항", "부산 강서", "SOUTH", "OUTER_HARBOR", 35.003, 128.827, 180, "gadeok", "npw"],
  ["amnam", "부산 암남공원 갯바위", "부산 서구", "SOUTH", "ROCK", 35.062, 129.019, 180, "busan", "p", "갯바위 너울·미끄럼 주의."],
  ["taejongdae", "부산 영도 감지해변 갯바위", "부산 영도", "SOUTH", "ROCK", 35.070, 129.079, 160, "busan", "p"],
  ["oryukdo", "부산 오륙도 방파제", "부산 남구", "SOUTH", "BREAKWATER_TIP", 35.100, 129.121, 150, "busan", "tp", "배로 들어가는 방파제(도선)."],
  ["minrak", "부산 민락항", "부산 수영", "SOUTH", "INNER_HARBOR", 35.155, 129.135, 150, "busan", "npw"],
  ["cheongsapo", "부산 청사포", "해운대", "SOUTH", "OUTER_HARBOR", 35.160, 129.192, 150, "busan", "npw"],
  ["hakri", "기장 학리항", "기장", "SOUTH", "OUTER_HARBOR", 35.232, 129.243, 120, "busan", "npw"],
  ["chilam", "기장 칠암항", "기장", "SOUTH", "OUTER_HARBOR", 35.303, 129.262, 110, "busan", "tnpw"],
  // ───── 울산 ─────
  ["jinha", "울주 진하해변", "울주", "EAST", "SURF", 35.385, 129.348, 110, "ulsan", "pw"],
  ["ganjeolgot", "울주 간절곶 갯바위", "울주", "EAST", "ROCK", 35.359, 129.361, 100, "ulsan", "pw"],
  ["gangdong", "울산 강동 갯바위", "울산 북구", "EAST", "ROCK", 35.616, 129.452, 90, "ulsan", "p"],
  // ───── 경북 ─────
  ["eupcheon", "경주 읍천항", "경주", "EAST", "OUTER_HARBOR", 35.692, 129.474, 90, "ulsan", "npw"],
  ["gampo", "경주 감포항", "경주", "EAST", "OUTER_HARBOR", 35.806, 129.506, 90, "pohang", "tnpw"],
  ["yangpo", "포항 양포항", "포항", "EAST", "OUTER_HARBOR", 35.881, 129.527, 90, "pohang", "tnpw"],
  ["homigot", "포항 호미곶 갯바위", "포항", "EAST", "ROCK", 36.077, 129.567, 60, "pohang", "pw"],
  ["wolpo", "포항 월포해변", "포항", "EAST", "SURF", 36.205, 129.376, 90, "pohang", "pw"],
  ["chuksan", "영덕 축산항", "영덕", "EAST", "OUTER_HARBOR", 36.508, 129.448, 90, "hupo", "tnpw"],
  ["jukbyeon", "울진 죽변항", "울진", "EAST", "OUTER_HARBOR", 37.058, 129.423, 80, "hupo", "tnpw"],
  ["ulleung-jeodong", "울릉 저동항", "울릉", "EAST", "OUTER_HARBOR", 37.498, 130.911, 90, "ulleung", "tnpw", "배로 가는 섬. 기상 악화 시 배가 안 떠요."],
  ["ulleung-inner", "울릉 저동항 내항", "울릉", "EAST", "INNER_HARBOR", 37.499, 130.908, 90, "ulleung", "npw", "방파제 안쪽. 바깥 너울 때 대안."],
  ["ulleung-dodong", "울릉 도동 갯바위", "울릉", "EAST", "ROCK", 37.483, 130.910, 120, "ulleung", "p", "해안 산책로 갯바위. 너울 주의."],
  // ───── 강원 ─────
  ["jangho", "삼척 장호항", "삼척", "EAST", "OUTER_HARBOR", 37.288, 129.318, 90, "mukho", "npw"],
  ["samcheok-port", "삼척항", "삼척", "EAST", "OUTER_HARBOR", 37.431, 129.188, 80, "mukho", "tnpw"],
  ["eodal", "동해 어달항", "동해", "EAST", "OUTER_HARBOR", 37.566, 129.117, 80, "mukho", "npw"],
  ["simgok", "강릉 심곡항", "강릉", "EAST", "ROCK", 37.677, 129.050, 80, "mukho", "p"],
  ["sacheonjin", "강릉 사천진항", "강릉", "EAST", "OUTER_HARBOR", 37.843, 128.875, 80, "mukho", "npw"],
  ["susan", "양양 수산항", "양양", "EAST", "OUTER_HARBOR", 38.080, 128.669, 80, "sokcho", "tnpw"],
  ["daepo", "속초 대포항", "속초", "EAST", "INNER_HARBOR", 38.173, 128.607, 80, "sokcho", "npw"],
  ["jangsa", "속초 장사항", "속초", "EAST", "OUTER_HARBOR", 38.223, 128.589, 80, "sokcho", "npw"],
  ["ayajin", "고성 아야진항", "고성(강원)", "EAST", "OUTER_HARBOR", 38.272, 128.556, 80, "sokcho", "tnpw"],
  ["geojin", "고성 거진항", "고성(강원)", "EAST", "OUTER_HARBOR", 38.446, 128.459, 80, "sokcho", "tnpw"],
  ["daejin-goseong", "고성 대진항", "고성(강원)", "EAST", "OUTER_HARBOR", 38.497, 128.428, 80, "sokcho", "npw", "최북단 항구. 민통선 인근 통제 구역 확인."],
  // ───── 제주 ─────
  ["iho", "제주 이호테우 방파제", "제주시", "SOUTH", "OUTER_HARBOR", 33.498, 126.453, 0, "jeju", "tnpw"],
  ["aewol", "제주 애월항", "제주시", "SOUTH", "OUTER_HARBOR", 33.465, 126.310, 330, "jeju", "tnpw"],
  ["gimnyeong", "제주 김녕항", "제주시", "SOUTH", "OUTER_HARBOR", 33.558, 126.759, 20, "jeju", "npw"],
  ["chuja-sinyang", "추자도 신양항", "제주시", "SOUTH", "OUTER_HARBOR", 33.944, 126.322, 180, "chuja", "npw", "먼바다 섬 낚시 명소. 배편·기상 확인 필수."],
  ["udo", "우도 천진항", "제주시", "SOUTH", "OUTER_HARBOR", 33.497, 126.950, 200, "seongsanpo", "npw"],
  ["seongsan-port", "제주 성산항", "서귀포", "SOUTH", "OUTER_HARBOR", 33.472, 126.932, 60, "seongsanpo", "tnpw"],
  ["wimi", "서귀포 위미항", "서귀포", "SOUTH", "OUTER_HARBOR", 33.270, 126.663, 180, "seogwipo", "npw"],
  ["jagunae", "제주 차귀도 자구내포구", "제주시", "SOUTH", "OUTER_HARBOR", 33.311, 126.165, 270, "moseulpo", "npw"],
];

/** 해역·유형별 기본 어종 (spots.ts 의 EXTRA 규칙이 계절 어종을 더한다) */
function defaultSpecies(sea: Sea, type: SpotType, lat: number): string[] {
  const jeju = lat < 34;
  if (sea === "WEST") return ["rockfish", "webfoot", "halfbeak", "greenling", ...(type === "INNER_HARBOR" ? [] : ["flatfish", "cuttlefish"])];
  if (sea === "EAST") return ["mackerel", "bolak", "greenling", "halfbeak", ...(type === "SURF" ? [] : ["squid-bigfin"])];
  if (jeju) return ["blackporgy", "halfbeak", "mackerel", "bolak", "squid-bigfin"];
  return ["blackporgy", "bolak", "mackerel", "halfbeak", ...(type === "INNER_HARBOR" ? ["cuttlefish"] : ["squid-bigfin", "cuttlefish"])];
}

export function coastSpots(stations: Record<string, TideStation>): Spot[] {
  return R.map(([id, name, area, sea, type, lat, lon, facingDeg, st, flags, notes]) => {
    const station = stations[st];
    if (!station) throw new Error(`조위관측소 없음: ${st} (${id})`);
    return {
      id,
      name,
      area,
      sea,
      type,
      lat,
      lon,
      facingDeg,
      station,
      bottom: type === "ROCK" ? "ROCK" : type === "SURF" ? "SAND" : sea === "WEST" ? "MUD" : "MIXED",
      tetrapod: flags.includes("t") || undefined,
      nightOk: flags.includes("n") || undefined,
      parking: flags.includes("p") || undefined,
      toilet: flags.includes("w") || undefined,
      species: defaultSpecies(sea, type, lat),
      notes,
      approx: true,
    };
  });
}

/** 바다를 낀 시·군·구 (커버리지 안내용) */
export const COASTAL_AREAS: Record<string, string[]> = {
  인천: ["중구", "옹진", "강화"],
  경기: ["김포", "시흥", "안산", "화성"],
  충남: ["당진", "서산", "태안", "홍성", "보령", "서천"],
  전북: ["군산", "김제", "부안", "고창"],
  전남: ["영광", "무안", "신안", "목포", "진도", "해남", "완도", "강진", "장흥", "보성", "고흥", "여수", "광양"],
  경남: ["하동", "남해", "사천", "고성", "통영", "거제", "창원"],
  부산: ["강서", "사하", "서구", "영도", "남구", "수영", "해운대", "기장"],
  울산: ["울주", "남구·동구", "북구"],
  경북: ["경주", "포항", "영덕", "울진", "울릉"],
  강원: ["삼척", "동해", "강릉", "양양", "속초", "고성"],
  제주: ["제주시", "서귀포"],
};
