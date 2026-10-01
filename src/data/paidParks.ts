/**
 * 수도권 24시간 유료 바다낚시터 (밤낚시 초보·가족용).
 * 방류 어종을 가두리·좌대에서 잡는 곳이라 물때 점수 대신 "오늘 밤 날씨 쾌적도"로 안내한다.
 * 정확한 위치는 지도 앱 검색으로 연결하고(좌표를 추정하지 않음), 날씨는 가까운 포인트 예보를 쓴다.
 * 입어료·운영 시간·방류 일정은 자주 바뀌므로 화면에서 '방문 전 전화 확인'을 안내한다.
 */
export interface PaidPark {
  id: string;
  name: string;
  area: string;
  kind: string;
  open24h: boolean;
  facilities: string[];
  /** 방류 어종(안내용) */
  species: string[];
  good: string;
  caution?: string;
  /** 날씨를 가져올 가까운 포인트 */
  weatherSpot: string;
  mapQuery: string;
  family: boolean;
}

export const PAID_PARKS: PaidPark[] = [
  {
    id: "jeongseong",
    name: "정성바다낚시터",
    area: "인천 중구",
    kind: "방갈로형 바다낚시터",
    open24h: true,
    facilities: ["방갈로", "편의점", "화장실"],
    species: ["우럭", "참돔", "돗돔"],
    good: "시설 관리가 잘 되어 있어 여성·가족 동반에게 인기. 방갈로가 깔끔하고 편의점이 붙어 있어 밤낚시가 편해요.",
    weatherSpot: "sammok-wharf",
    mapQuery: "정성바다낚시터",
    family: true,
  },
  {
    id: "seonjae",
    name: "선재낚시공원",
    area: "인천",
    kind: "대형 방갈로 낚시공원",
    open24h: true,
    facilities: ["개인 방갈로", "화장실"],
    species: ["방류 어종 (방문 전 확인)"],
    good: "수도권 유료 낚시터 중 규모·시설이 가장 큰 곳 중 하나. 개인 방갈로에서 밤바람을 피하며 찌낚시를 즐길 수 있어요.",
    caution: "입어료가 다소 높은 편이에요.",
    weatherSpot: "yeongheung-jindu",
    mapQuery: "선재낚시공원",
    family: true,
  },
  {
    id: "manjeong",
    name: "만정바다좌대낚시터",
    area: "인천 중구",
    kind: "바다 좌대",
    open24h: true,
    facilities: ["좌대"],
    species: ["방류 어종 (방문 전 확인)"],
    good: "노지가 부담스러운 초보에게 좋은 좌대형. 가두리 주변을 노리면 밤에도 묵직한 손맛을 볼 수 있어요.",
    caution: "바람이 강하면 좌대 운영이 바뀔 수 있어요.",
    weatherSpot: "sammok-wharf",
    mapQuery: "만정바다좌대낚시터",
    family: false,
  },
];
