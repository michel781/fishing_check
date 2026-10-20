/**
 * 회유어(삼치·고등어·방어류) 신호 판독과 길목·시간.
 *  - 앱은 새떼·보일링을 직접 볼 수 없다 → ① 현장에서 본 신호를 고르면 뜻과 할 일,
 *    ② 그날 해 뜨고 지는 시각 + 물때 단계로 시간대별 길목을 계산한다.
 *  - 근거: 낚시 매체·블로그(사용자 제공 포함, 원문 미열람)와 백과. 출처에 없는 연결은 '추론'.
 *  - 바로잡은 것: '새가 다이빙하면 100% 포식어' → 가능성이 아주 높음(갈매기). 가마우지는 스스로 물속을 쫓는 새라 포식어 신호가 아님.
 */
import type { TideStage } from "@/lib/tideTable";

export const BOIL_SPECIES = ["spanishmackerel", "mackerel", "yellowtail"] as const;
export const hasBoil = (id: string) => (BOIL_SPECIES as readonly string[]).includes(id);

export type BoilEv = "현장" | "사실" | "추론";

export interface BoilSign {
  id: string;
  icon: string;
  group: "하늘" | "수면" | "먹잇감" | "지형" | "없음";
  see: string;
  means: string;
  act: string;
  /** 1(약함)~3(가장 확실) — 회유어가 가까이 있을 가능성 */
  level: 1 | 2 | 3;
  ev: BoilEv;
  src: number[];
}

export const BOIL_SIGNS: BoilSign[] = [
  {
    id: "dive", icon: "🐦", group: "하늘", level: 3, ev: "현장", src: [7, 1],
    see: "갈매기가 수면 위를 낮게 날며 물속으로 내리꽂혀요 ('새가 꼬인다')",
    means: "먹잇감이 수면까지 몰려 있어요. 아래에서 포식어가 몰아붙이고 있을 가능성이 아주 커요(100%는 아니에요).",
    act: "새떼가 있는 곳 가장자리로 바로 멀리 던져 빠르게 감아요. 새떼가 움직이면 따라 옮겨요.",
  },
  {
    id: "cormorant", icon: "🦆", group: "하늘", level: 2, ev: "사실", src: [6],
    see: "가마우지가 물에 떠 있다가 잠수해요",
    means: "가마우지는 물속까지 쫓아 들어가 스스로 사냥하는 새예요. 먹잇감이 있다는 뜻이지, 포식어가 몰아 올렸다는 증거는 아니에요.",
    act: "먹잇감이 있는 곳으로 보고 주변을 넓게 탐색해요. 보일링·라이징이 함께 보이면 그때 집중해요.",
  },
  {
    id: "boil", icon: "💥", group: "수면", level: 3, ev: "현장", src: [8, 9, 0],
    see: "수면이 끓듯 파르르 떨리거나 뒤집혀요 (보일링)",
    means: "포식어가 멸치 같은 작은 고기를 수면 쪽으로 몰아 사냥하는 중이에요. 아주 가까이 와 있다는 가장 확실한 신호예요.",
    act: "보이는 즉시 그 주변에 던져요. 금방 가라앉을 수 있어요.",
  },
  {
    id: "rise", icon: "🐟", group: "수면", level: 3, ev: "현장", src: [8, 9],
    see: "고기가 먹이를 쫓아 수면 위로 번쩍 튀어 올라요 (라이징)",
    means: "사냥에 흥분한 포식어가 바로 그 자리에 있어요.",
    act: "튄 자리의 진행 방향 앞쪽으로 던져 빠르게 감아요(추론).",
  },
  {
    id: "flee", icon: "🌀", group: "먹잇감", level: 3, ev: "현장", src: [7],
    see: "검푸른 고기 무리(베이트볼)가 쫓기듯 급하게 방향을 틀어요",
    means: "작은 고기 떼가 공처럼 뭉쳐 도망치는 중이에요. 무리 아래나 가장자리에 포식어가 붙어 있을 가능성이 커요.",
    act: "무리 가장자리를 노리고, 루어를 무리 밑까지 가라앉혔다 빠르게 올려요.",
  },
  {
    id: "bait", icon: "🫧", group: "먹잇감", level: 2, ev: "현장", src: [10],
    see: "멸치가 튀는 소리가 나거나 무리가 조용히 뭉쳐 있어요",
    means: "먹잇감은 들어와 있어요. 아직 쫓기지 않을 수 있어요.",
    act: "주변을 부채꼴로 넓게 던지며 새·보일링이 생기는지 계속 살펴요.",
  },
  {
    id: "edge", icon: "〰", group: "지형", level: 2, ev: "현장", src: [13],
    see: "포말이 이는 곳, 잔잔한 띠(조경지대), 여 주변 물돌이가 보여요",
    means: "먹잇감이 모이고 회유어가 지나가는 길목으로 꼽히는 곳이에요.",
    act: "신호가 없어도 이런 곳부터 노려요. 조경 띠는 띠를 따라 가로지르게 던져요(추론).",
  },
  {
    id: "rest", icon: "🛟", group: "하늘", level: 1, ev: "추론", src: [],
    see: "새가 물 위에 떠서 쉬기만 해요",
    means: "먹이 활동 신호로 보기 어려워요.",
    act: "다른 신호를 찾으며 물살이 좋은 외항·갯바위 쪽을 먼저 노려요.",
  },
  {
    id: "none", icon: "🌊", group: "없음", level: 1, ev: "현장", src: [2],
    see: "아무 신호도 없어요",
    means: "수면이 아닌 중층·바닥 쪽에 있거나, 아직 연안에 안 들어왔을 수 있어요.",
    act: "숫자를 세며 가라앉혀 층을 바꿔 가며 빠르게 감아요. 아래 '시간대별 길목'에 맞춰 자리를 옮겨요.",
  },
];

/** 도착하면 먼저 하는 관찰 순서 */
export const SCAN: string[] = [
  "바로 던지지 말고 편광 선글라스를 끼고 5~10분 수면을 넓게 봐요",
  "하늘: 새가 낮게 날며 내리꽂히는 곳이 있나요?",
  "수면: 보일링·라이징·울렁이는 곳이 있나요?",
  "귀: 멸치가 튀는 소리가 들리나요?",
  "물결: 포말·잔잔한 띠(조경지대)·여 주변 물돌이가 어디인가요?",
  "물때표: 지금이 들물 후반(중들물~만조)인가요?",
];

/** 회유어가 좋아하는 물때 단계 — 2: 가장 좋음, 1: 좋음(물이 움직임), 0: 연안에서 어려움 */
export const TIDE_FIT: Record<TideStage, 0 | 1 | 2> = {
  초들물: 1, 중들물: 2, 끝들물: 2, 만조: 1, 초썰물: 1, 중썰물: 1, 끝썰물: 0, 간조: 0,
};

export type PhaseId = "am" | "day" | "pm";

/** 하루 일과: 시간대마다 어디로, 왜 (사용자 제공 자료 정리, 현장 경험) */
export const PHASE_INFO: Record<PhaseId, { label: string; when: string; where: string; why: string }> = {
  am: {
    label: "🌅 오전 피딩",
    when: "해 뜨기 30분 전 ~ 해 뜬 뒤 2시간",
    where: "연안 급심(브레이크라인), 방파제 외항 석축 바로 앞",
    why: "밤새 먼바다에 있던 회유어가 동틀 무렵 먹잇감을 연안 얕은 곳으로 몰아붙여요. 보일링이 가장 잦은 시간이에요.",
  },
  day: {
    label: "☀️ 낮",
    when: "오전 10시 ~ 오후 4시",
    where: "물살 센 곶부리, 외해를 마주한 갯바위 끝, 깊은 쪽",
    why: "해가 높으면 물이 맑아 몸이 드러나고 수면 수온도 올라, 깊거나 물살 센 바깥쪽으로 빠져요. 멀리 던지고 깊게 가라앉혀요.",
  },
  pm: {
    label: "🌇 오후 피딩",
    when: "해 지기 2시간 전 ~ 해 진 뒤 30분",
    where: "다시 연안, 와류가 생기는 홈통 입구",
    why: "해 지기 전 마지막 사냥이에요. 오전만큼 폭발적이진 않아도 꾸준해요. 어두워지면 먼바다로 빠져요.",
  },
};

/** 어종별 덧붙임 */
export const SPECIES_NOTE: Record<string, string> = {
  spanishmackerel: "삼치는 해가 지면 잘 안 무는 낮 고기로 봐요. 메탈지그 20~40g을 멀리 던져 빠르게 감아요.",
  mackerel: "고등어는 떼로 다니고 밤에도 불빛 아래에서 잘 물어요(앱 활동 시간 데이터). 해 진 뒤 가로등 주변도 기회예요.",
  yellowtail: "부시리 같은 방어류(잿방어 포함)도 같은 신호로 찾아요. 힘이 세서 굵은 줄과 큰 루어를 써요.",
};

/** 삼치 요령 (출처 번호는 BOIL_SRC) */
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
  ["위키백과 · 가마우지(잠수해 물고기를 잡는 새)", "https://ko.wikipedia.org/wiki/%EA%B0%80%EB%A7%88%EC%9A%B0%EC%A7%80"],
  ["블로그 · 회유어 징후(보일링·베이트볼·새) — 사용자 제공", "https://m.blog.naver.com/assafishing/221130245679"],
  ["블로그 · 보일링과 라이징 — 사용자 제공", "https://m.blog.naver.com/echoheim/50182873233"],
  ["블로그 · 보일링·라이징 — 사용자 제공", "https://blog.naver.com/woodak1204/90174925016"],
  ["블로그 · 피딩 타임과 관찰 요령 — 사용자 제공", "https://m.blog.naver.com/jehwu/220457290707"],
  ["블로그 · 회유어와 물때 — 사용자 제공", "https://m.blog.naver.com/assafishing/221303633501"],
  ["블로그 · 회유어와 물때 — 사용자 제공", "https://blog.naver.com/devilangel666/221589733983?viewType=pc"],
  ["블로그 · 포말·조경지대 — 사용자 제공", "https://blog.naver.com/ji3817/223486962139"],
];

/** 하루 일과 출처 */
export const PHASE_SRC = [10, 11, 12, 3];

const MIN = 60e3;

/** 그날 시간대별 구간 (해 뜨고 지는 시각 기준). 낮은 오전·오후 피딩과 겹치지 않게 자른다 */
export function pelagicPhases(sunrise: string, sunset: string): { id: PhaseId; start: number; end: number }[] {
  const sr = Date.parse(sunrise);
  const ss = Date.parse(sunset);
  const day0 = Date.parse(`${new Date(sr + 9 * 3600e3).toISOString().slice(0, 10)}T00:00:00+09:00`);
  const am = { id: "am" as const, start: sr - 30 * MIN, end: sr + 120 * MIN };
  const pm = { id: "pm" as const, start: ss - 120 * MIN, end: ss + 30 * MIN };
  const day = { id: "day" as const, start: Math.max(day0 + 10 * 3600e3, am.end), end: Math.min(day0 + 16 * 3600e3, pm.start) };
  return day.end > day.start ? [am, day, pm] : [am, pm];
}

/** 구간 안의 물때 단계와 궁합: 가장 좋은 단계가 겹치는 시각 */
export function phaseTide(rows: { time: string; stage: TideStage }[], start: number, end: number) {
  const inWin = rows.filter((r) => Date.parse(r.time) + 3600e3 > start && Date.parse(r.time) < end);
  const fit = inWin.length ? Math.max(...inWin.map((r) => TIDE_FIT[r.stage])) : null;
  const stages = [...new Set(inWin.map((r) => r.stage))];
  const best = inWin.filter((r) => fit != null && TIDE_FIT[r.stage] === fit).map((r) => r.time);
  return { fit, stages, best };
}
