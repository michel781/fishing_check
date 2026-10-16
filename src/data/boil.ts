/**
 * 새떼·보일링 판독 (삼치).
 *  - 앱은 새떼·보일링을 직접 볼 수 없다 → ① 현장에서 본 신호를 고르면 뜻과 할 일, ② 살필 시간(해 뜰·질 무렵, 추정)을 준다.
 *  - 근거는 낚시 매체·커뮤니티·기사 검색 요약(원문 미열람). 출처에 없는 연결은 '추론'으로 표시한다.
 */

export const BOIL_SPECIES = ["spanishmackerel"] as const;
export const hasBoil = (id: string) => (BOIL_SPECIES as readonly string[]).includes(id);

export type BoilEv = "현장" | "추론";

export interface BoilSign {
  id: string;
  icon: string;
  /** 보이는 것 */
  see: string;
  /** 무슨 뜻인가 */
  means: string;
  /** 지금 할 일 */
  act: string;
  /** 1(약함)~3(가장 확실) — 삼치가 가까이 있을 가능성 */
  level: 1 | 2 | 3;
  ev: BoilEv;
}

export const BOIL_SIGNS: BoilSign[] = [
  {
    id: "dive",
    icon: "🐦",
    see: "갈매기가 한곳에 모여 수면으로 내리꽂혀요",
    means: "멸치 같은 작은 고기 떼가 수면으로 몰려 있어요. 아래에서 삼치가 몰아 올리고 있을 가능성이 커요.",
    act: "새떼가 있는 곳 가장자리로 바로 멀리 던져 빠르게 감아요. 새떼가 움직이면 따라 던질 자리를 옮겨요.",
    level: 3,
    ev: "현장",
  },
  {
    id: "boil",
    icon: "💥",
    see: "수면이 끓듯 물보라가 튀어요(보일링)",
    means: "삼치가 수면 가까이에서 먹이를 쫓는 중이에요. 그 주변에 삼치와 먹잇감이 함께 있어요.",
    act: "보일링 주변을 집중해서 노려요. 금방 가라앉을 수 있으니 보이는 즉시 던져요.",
    level: 3,
    ev: "현장",
  },
  {
    id: "bait",
    icon: "🐟",
    see: "작은 고기가 튀거나 물색이 검게 뭉쳐 보여요",
    means: "먹잇감은 들어와 있지만 아직 쫓기지 않을 수 있어요.",
    act: "그 주변을 부채꼴로 넓게 던지며 기다려요. 새떼·보일링이 생기는지 계속 살펴요.",
    level: 2,
    ev: "추론",
  },
  {
    id: "rest",
    icon: "🛟",
    see: "새가 물 위에 떠서 쉬기만 해요",
    means: "먹이 활동 신호로 보기 어려워요.",
    act: "다른 신호를 찾으며, 물살이 좋은 외항·갯바위 쪽을 먼저 노려요.",
    level: 1,
    ev: "추론",
  },
  {
    id: "none",
    icon: "🌊",
    see: "아무 신호도 없어요",
    means: "삼치가 수면이 아닌 중층·바닥 쪽에 있을 수 있어요.",
    act: "던진 뒤 숫자를 세며 가라앉혀 층을 바꿔 가며 빠르게 감아요. 해 뜰·질 무렵을 기다려요.",
    level: 1,
    ev: "현장",
  },
];

/** 신호와 함께 보는 요령 (출처 번호는 BOIL_SRC) */
export const BOIL_TIPS: { text: string; src: number[] }[] = [
  { text: "포인트: 조류 흐름이 좋고 멸치 같은 먹잇감이 많은 외항·갯바위. 갈매기 떼가 모이는 곳이 가장 좋은 자리로 꼽혀요.", src: [1, 2] },
  { text: "시간: 해 뜰 무렵과 해 질 무렵. 제철엔 해 뜨기 30분쯤 전부터 입질이 시작된다는 글이 있어요.", src: [0, 3, 4] },
  { text: "루어: 연안은 메탈지그 20~40g, 배낚시 큰 삼치는 40~80g. 멀리 던져 빠르게 감는 게 기본이에요.", src: [2, 4] },
  { text: "색: 맑은 날은 은색, 흐리거나 물이 탁하면 야광·붉은 계열.", src: [2] },
  { text: "규칙: 매년 5월 1일~31일은 삼치 금어기예요.", src: [5] },
];

export const BOIL_SRC: [string, string][] = [
  ["삼치 낚시 채비 — 가을 방파제(블로그)", "https://www.sano.co.kr/%EC%82%BC%EC%B9%98-%EB%82%9A%EC%8B%9C-%EC%B1%84%EB%B9%84-%EC%B4%88%EB%B3%B4%EC%9E%90%EB%8F%84-%EA%B0%80%EC%9D%84-%EB%B0%A9%ED%8C%8C%EC%A0%9C%EC%97%90%EC%84%9C-%EC%86%90%EB%A7%9B-%EB%B3%B4%EB%8A%94"],
  ["M뉴스 · 낚시초보도 짜릿한 손맛 '삼치루어낚시'", "https://news.ff.or.kr/17/?bmode=view&idx=344159"],
  ["낚시마을 · 삼치 낚시의 계절·낚시터·준비물·방법", "https://fishingvillage.co.kr/%EC%82%BC%EC%B9%98-%EB%82%9A%EC%8B%9C-%EB%A7%A4%EB%A0%A5-%EA%B3%84%EC%A0%88-%EB%82%9A%EC%8B%9C%ED%84%B0-%EC%A4%80%EB%B9%84%EB%AC%BC-%EB%82%9A%EC%8B%9C-%EB%B0%A9%EB%B2%95/"],
  ["나무위키 · 삼치", "https://namu.wiki/w/%EC%82%BC%EC%B9%98"],
  ["요산요수 카페 · 삼치 낚시 채비", "https://m.cafe.daum.net/ysysu/MujX/12?listURI=%2Fysysu%2FMujX"],
  ["해양수산부 보도자료 · 5월부터는 삼치, 감성돔, 주꾸미 잡으면 안돼요", "https://www.mof.go.kr/doc/ko/selectDoc.do?docSeq=45789&menuSeq=971&bbsSeq=10"],
];

const MIN = 60e3;

/** 새떼·보일링을 살필 시간(앱 추정): 해 뜨기 60분 전 ~ 뜬 뒤 90분, 해 지기 90분 전 ~ 진 뒤 20분 */
export function boilWindows(sunrise: string, sunset: string): { label: string; start: number; end: number }[] {
  const sr = Date.parse(sunrise);
  const ss = Date.parse(sunset);
  return [
    { label: "아침", start: sr - 60 * MIN, end: sr + 90 * MIN },
    { label: "저녁", start: ss - 90 * MIN, end: ss + 20 * MIN },
  ];
}
