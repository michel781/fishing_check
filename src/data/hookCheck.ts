/**
 * 어종별 바늘 크기 점검 (출처 대조).
 *  - 채비 치수(rigSpecs·moreSpecies)의 바늘 규격 문자열은 여기 hookText()로 만든다 → 한 곳에서만 고친다.
 *  - 호수는 바늘 계열(포장에 적힌 이름) 안에서만 비교한다. 같은 숫자라도 계열이 다르면 크기가 다르다.
 *  - 상태: 확인(출처와 맞음) · 보완(범위·예외를 고침) · 수정(틀린 값을 바로잡음) · 엇갈림(자료마다 다름) · 미확인(호수 출처를 못 찾음)
 *  - 출처는 웹 검색 요약(원문 미열람). 대부분 낚시 매체·커뮤니티·판매처라 '현장 기준'이다.
 */

export type CheckStatus = "확인" | "보완" | "수정" | "엇갈림" | "미확인";

export const STATUS_INFO: Record<CheckStatus, { tone: "green" | "blue" | "orange" | "red" | ""; desc: string }> = {
  확인: { tone: "green", desc: "앱의 값이 찾은 자료와 맞아요" },
  보완: { tone: "blue", desc: "범위나 예외(씨알·상황)를 자료에 맞춰 넓히거나 고쳤어요" },
  수정: { tone: "red", desc: "앱의 값이 틀려서 자료에 맞게 바로잡았어요" },
  엇갈림: { tone: "orange", desc: "자료마다 권하는 호수가 달라 가운데 값을 쓰고 차이를 적었어요" },
  미확인: { tone: "", desc: "호수를 적은 자료를 찾지 못했어요. 낚시점에서 확인하세요" },
};

export type HookUnit = "호" | "/0" | "에기 호";

export interface HookCheck {
  /** 바늘 계열 이름 (포장에 적힌 이름) */
  series: string;
  /** 숫자로 비교할 수 있는 범위 */
  range?: { min: number; max: number; unit: HookUnit; base?: number };
  /** 숫자 비교가 어려운 경우의 규격 글 */
  text?: string;
  /** 범위를 벗어나도 되는 경우 */
  beyond?: string;
  status: CheckStatus;
  /** 고치기 전 값 */
  was?: string;
  /** 자료마다 다른 점 */
  note?: string;
  src: [string, string][];
}

const S = {
  fsGam: ["낚시춘추 · 감성돔낚시용 바늘의 선택('감성돔 3호'가 만능은 아니다)", "https://m.fishingseasons.co.kr/news_Detail.asp?b_no=1362"],
  ybadaVote: ["바다낚시 커뮤니티 · 감성돔 낚시 사용하는 바늘 호수(설문)", "http://www.ybada.co.kr/technote6/board.php?board=fvote&page=2&command=body&no=231"],
  chaebi: ["채비도감 · 낚시 바늘 호수와 어종 매칭표", "https://chaebidogam.com/guides/hook-size/"],
  seiko: ["세이코 바늘의 뜻과 어떤 바늘인지(개인 블로그)", "https://worldofjin.com/%EC%84%B8%EC%9D%B4%EC%BD%94-%EB%B0%94%EB%8A%98%EC%9D%98-%EB%9C%BB%EA%B3%BC-%EC%96%B4%EB%96%A4-%EB%B0%94%EB%8A%98%EC%9D%B8%EC%A7%80-%EC%95%8C%EC%95%84%EB%B4%85%EC%8B%9C%EB%8B%A4/"],
} satisfies Record<string, [string, string]>;

export const HOOK_CHECK: Record<string, HookCheck> = {
  rockfish: {
    series: "우럭 바늘",
    range: { min: 15, max: 20, unit: "호" },
    beyond: "먼바다에서 대구와 함께 노리면 28~30호처럼 훨씬 큰 바늘을 써요.",
    status: "보완",
    was: "17~19호",
    note: "다른 계열 기준으로 10~12호를 권하는 자료도 있어요 — 같은 숫자라도 계열이 다르면 크기가 달라요.",
    src: [
      ["선상 우럭 외줄낚시 채비·미끼(블로그) — 근해 우럭바늘 15~20호", "https://soodalsoo.b1code.co.kr/entry/%EC%84%A0%EC%83%81-%EC%9A%B0%EB%9F%AD-%EC%99%B8%EC%A4%84%EB%82%9A%EC%8B%9C-%EC%B1%84%EB%B9%84-%EB%AF%B8%EB%81%BC-%EB%82%9A%EC%8B%AF%EB%8C%80"],
      ["낚시 바늘 종류·사이즈 완벽 이해하기(BFG)", "https://www.bfg-fishing.com/beginner-guide/fishing-hook-guide"],
    ],
  },
  greenling: {
    series: "세이코 바늘",
    range: { min: 10, max: 12, unit: "호" },
    status: "수정",
    was: "세이코 또는 감성돔 바늘 10~12호",
    note: "감성돔 바늘은 보통 1~5호로 나와서 '감성돔 바늘 10~12호'는 맞지 않는 표기였어요. 노래미 전용 수치는 찾지 못해 세이코 일반 기준(작은 고기 12호 이하, 방파제 12~16호)에 맞췄어요.",
    src: [S.seiko, S.fsGam],
  },
  flatfish: {
    series: "다운샷 바늘(스트레이트·와이드갭)",
    range: { min: 3, max: 4, unit: "/0" },
    beyond: "5인치보다 큰 웜을 쓰면 4/0~5/0까지 키워요.",
    status: "보완",
    was: "3/0",
    src: [
      ["안면도 진하호 · 광어 다운샷 방법 — 3/0·4/0 스트레이트훅, 웜 4인치 내외", "https://jinhaho.com/index.php?mid=fish&mode=view&wr_uid=194583"],
      ["광어 다운샷 채비 방법(블로그) — 4/0~5/0", "https://picjjang.com/1038011/"],
    ],
  },
  blackporgy: {
    series: "감성돔 바늘",
    range: { min: 2, max: 4, unit: "호", base: 3 },
    beyond: "입질이 아주 예민하면 1호, 미끼가 크면 바늘 끝이 미끼 밖으로 나오도록 4~5호.",
    status: "보완",
    was: "1~3호",
    src: [S.fsGam, S.ybadaVote],
  },
  redseabream: {
    series: "타이라바 전용 바늘",
    text: "타이라바 전용 교체형 바늘 2개",
    status: "미확인",
    note: "제품마다 전용 바늘이 달려 나와 호수를 따로 고를 일이 적어요.",
    src: [],
  },
  webfoot: {
    series: "주꾸미 에기",
    range: { min: 2, max: 2.5, unit: "에기 호" },
    status: "미확인",
    note: "주꾸미 에기 호수를 비교한 자료는 찾지 못했어요. 갑오징어용 '왕눈이' 에기를 쓴다는 글은 있어요.",
    src: [["바다낚수 카페 · 호래기·무늬오징어·주꾸미용 에기의 차이점", "https://m.cafe.daum.net/badanaksu/AiXM/306?listURI=%2Fbadanaksu%2FAiXM"]],
  },
  cuttlefish: {
    series: "갑오징어 에기",
    range: { min: 2.5, max: 3.5, unit: "에기 호", base: 3 },
    status: "보완",
    was: "2.5~3.0호",
    note: "갑오징어용은 가라앉지 않고 중층에 머무는(서스펜드) 에기를 많이 쓴다고 해요.",
    src: [["갑오징어 에기 추천(블로그) — 3.0호 중심, 2.5·3.5호 추가", "https://www.sano.co.kr/%EA%B0%91%EC%98%A4%EC%A7%95%EC%96%B4-%EC%97%90%EA%B8%B0-%EC%B6%94%EC%B2%9C-%EC%9D%B4%EA%B2%83%EB%A7%8C-%EC%B1%99%EA%B8%B0%EB%A9%B4-%EA%B0%80%EC%9D%84-%EC%8B%9C%EC%A6%8C-%EC%B2%AB-%EA%B0%91%EC%98%A4"]],
  },
  halfbeak: {
    series: "학꽁치 바늘",
    range: { min: 4, max: 7, unit: "호" },
    beyond: "씨알이 잘고 입질이 예민하면 가장 작은 호수로 내려요.",
    status: "수정",
    was: "학꽁치 전용 1~3호",
    src: [
      ["낚시춘추 · 학꽁치 '1타2수' — 학꽁치 전용 바늘 4~7호", "https://fishingseasons.co.kr/contents_view_detail.asp?b_no=12991"],
      ["요산요수 카페 · 학꽁치 낚시 채비", "https://m.cafe.daum.net/ysysu/MujX/22?listURI=%2Fysysu%2FMujX"],
    ],
  },
  mackerel: {
    series: "고등어 카드채비",
    range: { min: 8, max: 10, unit: "호" },
    status: "확인",
    note: "새벽엔 밝은 털이 달린 9호 어피 카드가 좋았다는 현장 글이 있어요(서해 기준).",
    src: [["은빛비늘낚시 카페 · 고등어 낚시 채비법", "https://m.cafe.daum.net/ldgix3379/73Qs/27?listURI=%2Fldgix3379%2F73Qs"]],
  },
  bolak: {
    series: "볼락 지그헤드",
    text: "0.5~2g(기본 1g 안팎), 바늘 #8~#4",
    beyond: "중·상층에 떠 있으면 0.5~0.8g, 깊은 곳·먼 거리는 1.5~2g. 2~3g은 너무 빨리 가라앉아 입질이 줄 수 있어요.",
    status: "보완",
    was: "지그헤드 0.8~2g",
    note: "지그헤드 바늘은 서양식 번호라 숫자가 작을수록 커요(#4가 #8보다 큼). 작은 볼락은 가는 바늘, 큰 볼락은 굵은 바늘.",
    src: [
      ["낚시춘추 · 입문자를 위한 볼락루어 지침 ② 지그헤드 고르기", "https://m.fishingseasons.co.kr/news_Detail.asp?b_no=3327"],
      ["낚시춘추 · 0.8g 지그헤드 추천", "http://fishingseasons.co.kr/contents_view_detail.asp?b_no=9242"],
    ],
  },
  righteye: {
    series: "세이코 바늘",
    range: { min: 12, max: 16, unit: "호" },
    beyond: "입이 작은 돌가자미나 잔 씨알은 12호, 큰 참가자미는 14~16호.",
    status: "수정",
    was: "가자미 바늘 10~12호",
    note: "입문 자료는 10~13호를 권하기도 해요.",
    src: [
      ["KL피싱 · 돌가자미 낚시 채비 — 세이코 14~16호, 돌가자미는 12호", "http://klfishing.com/talk_new/bbs/board.php?bo_table=fishing_lecture_5&wr_id=1764&sca=가자미"],
      ["낚시춘추 · [입문자 교실] 가자미낚시", "https://m.fishingseasons.co.kr/news_Detail.asp?b_no=18335"],
    ],
  },
  "squid-bigfin": {
    series: "무늬오징어 에기",
    range: { min: 3, max: 3.5, unit: "에기 호" },
    beyond: "얕은 곳은 낮은 호수, 깊고 물살 센 곳·큰 개체는 4호까지.",
    status: "확인",
    src: [["무늬오징어 에기 추천, 제대로 선택하는 방법(블로그)", "https://fishquest.yatnll.com/entry/%EB%AC%B4%EB%8A%AC%EC%98%A4%EC%A7%95%EC%96%B4-%EC%97%90%EA%B8%B0-%EC%B6%94%EC%B2%9C-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EC%84%A0%ED%83%9D%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95"]],
  },
  hairtail: {
    series: "갈치 바늘",
    range: { min: 1, max: 2, unit: "/0" },
    beyond: "선상은 3/0까지 써요.",
    status: "확인",
    src: [S.chaebi, ["통큰낚시 · CK 내만 갈치 바늘(1/0·1·2 규격)", "https://tkfishing.co.kr/product/ck-%EB%82%B4%EB%A7%8C-%EA%B0%88%EC%B9%98-%EB%B0%94%EB%8A%98-%EB%8D%95%EC%9A%A9-50%EA%B0%9C%EC%9E%85-%EA%B0%88%EC%B9%98-%ED%85%90%EB%B9%88-%EC%B1%84%EB%B9%84/1852/"]],
  },
  seabass: {
    series: "루어에 달린 세발바늘",
    text: "미노우·바이브레이션에 달린 세발바늘",
    status: "미확인",
    note: "루어에 맞춰 달려 나와요. 녹슬거나 무뎌지면 같은 크기로 바꿔요.",
    src: [],
  },
  opaleye: {
    series: "벵에돔 바늘",
    range: { min: 4, max: 6, unit: "호" },
    beyond: "40~50cm급 큰 벵에돔은 7~8호.",
    status: "확인",
    note: "활성도가 좋으면 크게, 나쁘면 작게가 기본이에요.",
    src: [
      ["벵에돔 낚시 채비·미끼·목줄 운영법(블로그) — 30cm 전후 5~6호, 40~50cm 7~8호", "https://today.blogkor.com/1986"],
      ["팀피쉬 카페 · 바늘을 알고 사용하면 조과가 다르다", "https://m.cafe.daum.net/GOFISHING/LkDV/5?listURI=/GOFISHING/LkDV"],
    ],
  },
  spanishmackerel: {
    series: "메탈지그 바늘",
    text: "메탈지그에 달린 바늘(어시스트훅·세발바늘)",
    status: "미확인",
    src: [],
  },
  yellowtail: {
    series: "지깅 어시스트훅",
    text: "솔리드링 + 굵은 어시스트훅",
    status: "미확인",
    src: [],
  },
  mullet: {
    series: "감성돔 바늘",
    range: { min: 1, max: 2, unit: "호" },
    status: "수정",
    was: "숭어 바늘 6~8호",
    note: "숭어는 입이 작고 입질이 예민해 감성돔용 가장 작은 쪽(1~2호)을 많이 써요. 목줄도 1.2~1.5호로 가늘게.",
    src: [
      ["바다타임 · 숭어 찌낚시 채비", "https://www.badatime.com/gearing/14"],
      ["읽나바 카페 · 숭어용 바늘은 감성돔용 1~2호", "https://m.cafe.daum.net/readandchange/aS05/843?listURI=/readandchange/aS05"],
    ],
  },
  gizzardshad: {
    series: "전어 카드채비",
    range: { min: 3, max: 4, unit: "호" },
    status: "수정",
    was: "4~6호",
    src: [["요산요수 카페 · 전어, 숭어 낚시 채비 — 카드 3~4호", "https://m.cafe.daum.net/ysysu/MujX/48"]],
  },
  dodari: {
    series: "세이코 바늘",
    range: { min: 12, max: 14, unit: "호" },
    status: "엇갈림",
    was: "가자미·도다리 바늘 10~12호",
    note: "채비도감은 도다리 원투 9~13호, 남해 도다리 원투 자료는 세이코 14~16호를 적어요. 잔 씨알이면 작은 쪽으로.",
    src: [S.chaebi, ["KL피싱 · 돌가자미 낚시 채비(남해 도다리 원투 세이코 14~16호)", "http://klfishing.com/talk_new/bbs/board.php?bo_table=fishing_lecture_5&wr_id=1764&sca=가자미"]],
  },
  octopus: {
    series: "문어 전용 에기",
    range: { min: 3.5, max: 3.5, unit: "에기 호" },
    status: "확인",
    note: "판매되는 문어 전용 에기는 3.5호(약 23g·14cm)가 많아요. 더 큰 호수와 비교한 자료는 못 찾았어요.",
    src: [["다나와 · UST 문어 전용 에기 3.5호 사양", "https://prod.danawa.com/info/?pcode=15909002"]],
  },
  conger: {
    series: "붕장어 바늘",
    range: { min: 12, max: 14, unit: "호" },
    status: "보완",
    was: "13~15호",
    src: [S.chaebi],
  },
  rockbream: {
    series: "돌돔 바늘",
    range: { min: 13, max: 15, unit: "호" },
    beyond: "민장대는 12~13호, 원투는 14~15호.",
    status: "확인",
    src: [
      ["낚시춘추 · 최강의 보라성게용 채비를 찾아라 — 13~14호 선호", "http://fishingseasons.co.kr/contents_view_detail.asp?b_no=1352"],
      ["KL피싱 · 돌돔낚시 방법·채비·미끼", "https://klfishing.com/talk_new/bbs/board.php?bo_table=fishing_lecture_3&wr_id=152"],
    ],
  },
  squid: {
    series: "오징어 뿔",
    text: "오징어 뿔 5~10개",
    status: "미확인",
    src: [],
  },
  goby: {
    series: "망둥어 바늘",
    range: { min: 8, max: 10, unit: "호" },
    status: "미확인",
    was: "망둥어 바늘 8~10호 (감성돔 3~4호)",
    note: "호수를 적은 자료를 찾지 못했어요. 다른 계열 값(감성돔 3~4호)은 근거가 없어 지웠어요. 우럭 바늘처럼 큰 바늘도 쓴다는 글이 있을 만큼 먹성이 좋아요.",
    src: [["읽나바 카페 · 초보자·어린이도 쉽게 하는 망둥어 낚시", "https://m.cafe.daum.net/readandchange/aS05/211?listURI=/readandchange/aS05"]],
  },
};

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** "2~4호", "3/0~4/0", "2.5~3.5호" */
export function rangeText(r: NonNullable<HookCheck["range"]>): string {
  if (r.unit === "/0") return r.min === r.max ? `${r.min}/0` : `${r.min}/0~${r.max}/0`;
  // 에기는 2.0·2.5·3.0호처럼 소수 한 자리로 부른다
  const f = r.unit === "에기 호" ? (n: number) => n.toFixed(1) : num;
  return r.min === r.max ? `${f(r.min)}호` : `${f(r.min)}~${f(r.max)}호`;
}

/** 채비 치수에 쓰는 바늘 규격 글 */
export function hookText(id: string): string {
  const c = HOOK_CHECK[id];
  if (!c) return "";
  if (!c.range) return c.text ?? c.series;
  return `${c.series} ${rangeText(c.range)}`;
}

export type Verdict = "작음" | "적당" | "큼";

/** 내가 가진 바늘(같은 계열)의 호수가 권장 범위에 드는지 */
export function judgeHook(id: string, n: number): { verdict: Verdict; msg: string } | null {
  const c = HOOK_CHECK[id];
  if (!c?.range || !Number.isFinite(n)) return null;
  const { min, max } = c.range;
  const r = rangeText(c.range);
  if (n < min)
    return { verdict: "작음", msg: `권장 ${r}보다 작아요. 입에는 잘 들어가지만 큰 씨알이 물면 펴지거나 빠지기 쉽고, 미끼 끝에 바늘 끝이 묻혀 헛챔질이 날 수 있어요.` };
  if (n > max)
    return { verdict: "큼", msg: `권장 ${r}보다 커요. 입보다 큰 바늘은 삼키지 못해 입질만 오고 안 걸리기 쉬워요. 미끼도 부자연스러워져요.` };
  return { verdict: "적당", msg: `권장 ${r} 안이에요. 그날 입질에 따라 한 호수씩 올리고 내려 보세요.` };
}

/** 현장에서 보는 증상 → 바늘 조정 */
export const SYMPTOMS: { sign: string; fix: string; why: string }[] = [
  { sign: "입질(톡톡)은 오는데 걸리지 않고 미끼만 없어져요", fix: "한 호수 작게, 미끼도 작게", why: "입에 다 들어가지 않아 바늘 끝이 입 밖에서 놀아요. 볼락 루어라면 지그헤드를 먼저 가볍게." },
  { sign: "입질이 거의 없어요(고기는 있는데)", fix: "한 호수 작게·가늘게", why: "작고 가는 바늘이 미끼를 자연스럽게 해 경계심을 줄여요(활성도가 낮은 날)." },
  { sign: "큰 고기가 걸렸다가 바늘이 펴지거나 부러졌어요", fix: "한두 호수 크게·굵은 바늘", why: "작은 바늘은 대물의 힘을 버티지 못해요." },
  { sign: "미끼가 커서 바늘 끝이 미끼 속에 묻혀요", fix: "미끼에 맞춰 한두 호수 크게", why: "바늘 끝이 미끼 밖으로 나와야 박혀요." },
  { sign: "잔챙이·잡어만 계속 물어요", fix: "한 단계 크게", why: "작은 입은 큰 바늘을 못 삼켜 큰 씨알이 먼저 걸려요." },
  { sign: "바늘을 깊이 삼켜 빼기 어려워요", fix: "축이 긴 바늘로, 입질 뒤 조금 빨리 챔질", why: "긴 축은 집게로 잡기 쉽고 깊이 들어가기 전에 걸려요." },
];
