/** 시·군 → 광역 지역 (낚시터 목록 지역 칩) */
const MAP: Record<string, string> = {
  "안산·시흥": "경기",
  화성: "경기",
  옹진: "인천",
  강화: "인천",
  김포: "경기",
  시흥: "경기",
  안산: "경기",
  당진: "충남",
  홍성: "충남",
  김제: "전북",
  고창: "전북",
  무안: "전남",
  신안: "전남",
  해남: "전남",
  강진: "전남",
  장흥: "전남",
  보성: "전남",
  고흥: "전남",
  광양: "전남",
  하동: "경남",
  사천: "경남",
  "고성(경남)": "경남",
  창원: "경남",
  "부산 강서": "부산",
  "부산 서구": "부산",
  "부산 영도": "부산",
  "부산 남구": "부산",
  "부산 수영": "부산",
  해운대: "부산",
  울주: "울산",
  경주: "경북",
  울릉: "경북",
  "고성(강원)": "강원",
  "인천 중구(영종도)": "인천",
  서산: "충남",
  태안: "충남",
  보령: "충남",
  서천: "충남",
  군산: "전북",
  부안: "전북",
  속초: "강원",
  양양: "강원",
  강릉: "강원",
  동해: "강원",
  삼척: "강원",
  울진: "경북",
  영덕: "경북",
  포항: "경북",
  영광: "전남",
  목포: "전남",
  진도: "전남",
  완도: "전남",
  여수: "전남",
  남해: "경남",
  통영: "경남",
  거제: "경남",
  사하: "부산",
  기장: "부산",
  "울산 북구": "울산",
  "울산 동구": "울산",
  제주시: "제주",
  서귀포: "제주",
};

/** 해안선을 따라 서해 → 남해 → 동해 → 제주 순서 */
export const REGIONS = ["경기", "인천", "충남", "전북", "전남", "경남", "부산", "울산", "경북", "강원", "제주"] as const;

/** v1.5 에 새로 넣은 지역 (안내 팝업에 표시) */
export const NEW_REGIONS = ["전남", "경남", "부산", "울산", "제주"] as const;

export function regionOf(area: string): string {
  return MAP[area] ?? "기타";
}

/** 초보·가족: 내항이거나, 테트라포드 없이 화장실·주차가 있는 워킹 포인트 */
export const isBeginner = (s: { type: string; toilet: boolean; parking: boolean; tetrapod: boolean }) =>
  s.type === "INNER_HARBOR" || (s.toilet && s.parking && !s.tetrapod && s.type !== "ROCK" && s.type !== "BOAT" && s.type !== "TIDAL_FLAT");

/** 목록 칩용 포인트 유형 묶음 */
export const TYPE_GROUPS: { id: string; label: string; types: string[] }[] = [
  { id: "breakwater", label: "방파제", types: ["OUTER_HARBOR", "BREAKWATER_TIP"] },
  { id: "rock", label: "갯바위", types: ["ROCK"] },
  { id: "harbor", label: "항구", types: ["INNER_HARBOR"] },
  { id: "boat", label: "선상", types: ["BOAT"] },
  { id: "beach", label: "해변·갯벌", types: ["SURF", "TIDAL_FLAT"] },
];
