/** 시·군 → 광역 지역 (낚시터 목록 지역 칩) */
const MAP: Record<string, string> = {
  "안산·시흥": "경기",
  화성: "경기",
  옹진: "인천",
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
};

export const REGIONS = ["경기", "인천", "충남", "전북", "강원", "경북"] as const;

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
