/**
 * 어종별 채비 "실제 치수"와 준비물.
 * - 수치는 국내에서 흔히 쓰는 일반 기준이에요. 지역·물때·수심·선장 안내에 따라 달라질 수 있어요.
 * - dims 의 키는 RigDiagram 이 치수선을 그리는 위치예요 (채비 종류별로 다름).
 * - gear.keyword 로 쿠팡(또는 네이버 쇼핑)에서 실시간 가격을 찾고, 못 찾으면 priceRange(대략적인 예시 가격대)를 보여줘요.
 */

import { MORE_RIG_SPECS } from "./moreSpecies";

export type Motion =
  | "boat-bottom" // 배에서 바닥 채비 내리기 (우럭)
  | "boat-downshot" // 배에서 다운샷 (광어)
  | "boat-egi" // 배에서 봉돌+에기 (주꾸미·갑오징어)
  | "boat-tairaba" // 배에서 타이라바 (참돔)
  | "shore-bottom" // 방파제 발 앞 가볍게 던지기 (노래미)
  | "shore-surf" // 백사장 멀리 던지기 (가자미)
  | "shore-float" // 찌낚시 (감성돔·학꽁치)
  | "shore-sabiki" // 카드채비 (고등어)
  | "shore-jighead" // 가벼운 루어 (볼락)
  | "shore-egi"; // 에깅 (무늬오징어)

export interface RigPart {
  name: string;
  spec: string;
  note?: string;
}

export interface GearItem {
  id: string;
  name: string;
  /** 고를 때 볼 규격 */
  spec: string;
  /** 쇼핑 검색어 */
  keyword: string;
  qty: string;
  /** 대략적인 예시 가격대(원) — 실시간 가격을 못 받을 때만 보여줌 */
  priceRange: [number, number];
  /** 꼭 필요한 것 / 있으면 좋은 것 */
  essential: boolean;
}

export interface RigSpec {
  variant?: "boat" | "cast" | "shallow";
  parts: RigPart[];
  dims: Record<string, string>;
  /** 채비가 물속에서 놓이는 높이 (쉬운 말) */
  depth: string;
  /** 던지는 거리 또는 내리는 수심 */
  reach: string;
  motion: Motion;
  gear: GearItem[];
}

export const RIG_SPECS: Record<string, RigSpec> = {
  rockfish: {
    variant: "boat",
    parts: [
      { name: "원줄", spec: "합사(PE) 3~4호", note: "200m 이상 감아 두기" },
      { name: "기둥줄", spec: "카본 12~16호, 약 1.5m" },
      { name: "가지줄", spec: "8~10호, 길이 30~40cm × 2~3개" },
      { name: "바늘", spec: "우럭 바늘 17~19호" },
      { name: "봉돌", spec: "60~100호", note: "배마다 정해줘요 (서해는 80호가 흔해요)" },
    ],
    dims: { branch: "30~40cm", gap: "50cm", tail: "40cm", lift: "30~50cm 띄움" },
    depth: "봉돌이 바닥에 ‘툭’ 닿으면 릴을 1~2바퀴 감아 바닥에서 30~50cm 띄워요.",
    reach: "배 바로 아래로 내려요 (수심 20~60m)",
    motion: "boat-bottom",
    gear: [
      { id: "rig", name: "우럭 선상 채비 (완성품)", spec: "가지 2~3단, 바늘 17호", keyword: "우럭 선상 채비", qty: "3~5개 (바위에 걸려 잃어요)", priceRange: [3000, 8000], essential: true },
      { id: "sinker", name: "선상 봉돌", spec: "80호 (배에서 정한 무게)", keyword: "선상 봉돌 80호", qty: "3~4개", priceRange: [2500, 6000], essential: true },
      { id: "hook", name: "우럭 바늘", spec: "17~19호", keyword: "우럭 바늘 17호", qty: "1봉", priceRange: [2000, 5000], essential: false },
      { id: "line", name: "합사 원줄", spec: "PE 3호 200m", keyword: "합사 3호 200m", qty: "1개", priceRange: [12000, 35000], essential: false },
    ],
  },
  greenling: {
    parts: [
      { name: "원줄", spec: "나일론 3~4호" },
      { name: "도래", spec: "소형 도래 (줄 꼬임 방지)" },
      { name: "목줄", spec: "2~3호, 길이 20~30cm × 1~2개" },
      { name: "바늘", spec: "세이코 또는 감성돔 바늘 10~12호" },
      { name: "봉돌", spec: "5~10호", note: "파도가 세면 무겁게" },
    ],
    dims: { branch: "20~30cm", gap: "30cm", tail: "20~30cm", lift: "바닥에 닿게" },
    depth: "봉돌을 바닥에 닿게 두고, 미끼가 바닥 바로 위(0~30cm)에 오게 해요.",
    reach: "발 앞 돌 틈 근처 5~20m",
    motion: "shore-bottom",
    gear: [
      { id: "rig", name: "방파제 원투 가지채비", spec: "바늘 2개, 10~12호", keyword: "방파제 원투채비", qty: "3개", priceRange: [2000, 6000], essential: true },
      { id: "sinker", name: "구멍봉돌", spec: "8호", keyword: "구멍봉돌 8호", qty: "5개", priceRange: [2000, 5000], essential: true },
      { id: "line", name: "나일론 원줄", spec: "3호 150m", keyword: "나일론 낚시줄 3호", qty: "1개", priceRange: [4000, 12000], essential: false },
      { id: "rod", name: "짧은 원투대 세트", spec: "2.7~3.6m + 스피닝릴", keyword: "원투낚시대 세트", qty: "1세트", priceRange: [25000, 70000], essential: false },
    ],
  },
  flatfish: {
    variant: "boat",
    parts: [
      { name: "원줄", spec: "합사(PE) 1~1.5호" },
      { name: "기둥줄", spec: "카본 5~6호, 약 1m" },
      { name: "가지 목줄", spec: "카본 5호, 20~30cm" },
      { name: "바늘 + 웜", spec: "다운샷 바늘 3/0 + 섀드웜 4~5인치" },
      { name: "봉돌", spec: "20~40호", note: "수심·물살에 맞춰 선장이 알려줘요" },
    ],
    dims: { branch: "20~30cm", tail: "30~50cm", lift: "바닥을 톡톡" },
    depth: "봉돌은 바닥을 톡톡 치고, 웜은 바닥에서 30~50cm 위에서 춤춰요.",
    reach: "배 바로 아래로 내려요 (수심 15~40m)",
    motion: "boat-downshot",
    gear: [
      { id: "rig", name: "광어 다운샷 채비", spec: "가지 20~30cm", keyword: "광어 다운샷 채비", qty: "3~5개", priceRange: [3000, 8000], essential: true },
      { id: "worm", name: "섀드웜", spec: "4~5인치, 여러 색", keyword: "광어 섀드웜", qty: "1봉", priceRange: [4000, 9000], essential: true },
      { id: "sinker", name: "다운샷 봉돌", spec: "30호", keyword: "다운샷 봉돌 30호", qty: "3~4개", priceRange: [2000, 5000], essential: true },
      { id: "hook", name: "다운샷 바늘", spec: "3/0", keyword: "광어 다운샷 바늘", qty: "1봉", priceRange: [3000, 7000], essential: false },
    ],
  },
  blackporgy: {
    parts: [
      { name: "원줄", spec: "나일론(세미플로팅) 2~3호" },
      { name: "찌멈춤 매듭", spec: "면사 매듭 + 구슬", note: "여기서 찌가 멈춰 깊이가 정해져요" },
      { name: "구멍찌", spec: "0.8~1호 (파도가 세면 1.5호)" },
      { name: "수중찌", spec: "찌와 같은 호수 (예: -1호)" },
      { name: "목줄", spec: "카본 1.5~2호, 3~4m", note: "도래로 원줄과 연결" },
      { name: "좁쌀봉돌", spec: "B~2B, 바늘 위 50cm" },
      { name: "바늘", spec: "감성돔 바늘 1~3호" },
    ],
    dims: { stop: "수심 + 20~50cm", leader: "3~4m", shot: "50cm", lift: "0~30cm" },
    depth: "찌멈춤 매듭을 옮겨 미끼가 바닥에 살짝 닿거나 바로 위(0~30cm)에 오게 맞춰요.",
    reach: "밑밥을 뿌린 곳, 발 앞 10~30m",
    motion: "shore-float",
    gear: [
      { id: "float", name: "구멍찌", spec: "1호", keyword: "감성돔 구멍찌 1호", qty: "2개", priceRange: [5000, 15000], essential: true },
      { id: "sub", name: "수중찌", spec: "-1호", keyword: "수중찌 1호", qty: "2개", priceRange: [2000, 6000], essential: true },
      { id: "leader", name: "카본 목줄", spec: "1.75호 50m", keyword: "카본 목줄 1.75호", qty: "1개", priceRange: [7000, 20000], essential: true },
      { id: "hook", name: "감성돔 바늘", spec: "2호", keyword: "감성돔 바늘 2호", qty: "1봉", priceRange: [2000, 5000], essential: true },
      { id: "shot", name: "좁쌀봉돌·찌멈춤 세트", spec: "B~2B", keyword: "좁쌀봉돌 찌멈춤고무", qty: "1세트", priceRange: [3000, 8000], essential: false },
      { id: "chum", name: "감성돔 집어제(밑밥)", spec: "크릴과 섞어 쓰기", keyword: "감성돔 집어제", qty: "1~2봉", priceRange: [5000, 12000], essential: false },
    ],
  },
  redseabream: {
    variant: "boat",
    parts: [
      { name: "원줄", spec: "합사(PE) 0.8~1호, 200m 이상" },
      { name: "쇼크리더", spec: "카본 4~5호, 3~5m" },
      { name: "타이라바 머리", spec: "60~120g", note: "수심(m) × 1.5g 정도, 물살 세면 무겁게" },
      { name: "스커트·넥타이 + 바늘", spec: "전용 바늘 2개 (교체형)" },
    ],
    dims: { leader: "3~5m", retrieve: "10~15m" },
    depth: "바닥에 닿자마자 1초에 1바퀴씩 바닥에서 10~15m 높이까지 감아올려요.",
    reach: "배 바로 아래로 내려요 (수심 30~80m)",
    motion: "boat-tairaba",
    gear: [
      { id: "head", name: "타이라바", spec: "80g, 빨강·주황", keyword: "타이라바 80g", qty: "3~4개", priceRange: [5000, 12000], essential: true },
      { id: "skirt", name: "타이라바 스커트·바늘 세트", spec: "교체용", keyword: "타이라바 스커트 바늘", qty: "2세트", priceRange: [4000, 10000], essential: true },
      { id: "leader", name: "카본 쇼크리더", spec: "4호 50m", keyword: "카본 쇼크리더 4호", qty: "1개", priceRange: [8000, 20000], essential: true },
      { id: "line", name: "합사 원줄", spec: "PE 1호 200m", keyword: "합사 1호 200m", qty: "1개", priceRange: [12000, 35000], essential: false },
    ],
  },
  webfoot: {
    variant: "boat",
    parts: [
      { name: "원줄", spec: "합사(PE) 0.8~1.2호" },
      { name: "기둥줄", spec: "카본 4~5호, 1~2m" },
      { name: "에기(애기)", spec: "2.0~2.5호 1~2개, 가지줄 10~15cm" },
      { name: "봉돌", spec: "12~15호", note: "배에서 모두 같은 무게를 써야 줄이 안 엉켜요" },
    ],
    dims: { branch: "10~15cm", gap: "30cm", tail: "15~20cm", lift: "바닥에 닿게" },
    depth: "봉돌은 바닥에 닿아 있고, 에기는 바닥에서 15~20cm 위에 있어요.",
    reach: "배 아래 또는 옆으로 살짝 던져 내려요 (수심 5~20m)",
    motion: "boat-egi",
    gear: [
      { id: "egi", name: "쭈꾸미 에기", spec: "2.0~2.5호 여러 색", keyword: "쭈꾸미 에기", qty: "5~10개", priceRange: [5000, 15000], essential: true },
      { id: "sinker", name: "쭈꾸미 봉돌", spec: "12~15호", keyword: "쭈꾸미 봉돌 15호", qty: "5개", priceRange: [3000, 7000], essential: true },
      { id: "rig", name: "쭈꾸미 채비 (가지 도래)", spec: "에기 2개용", keyword: "쭈꾸미 채비", qty: "3개", priceRange: [3000, 7000], essential: true },
      { id: "rod", name: "쭈꾸미 낚싯대·베이트릴 세트", spec: "배에서 대여 가능", keyword: "쭈꾸미 낚싯대 세트", qty: "1세트", priceRange: [40000, 100000], essential: false },
    ],
  },
  cuttlefish: {
    variant: "boat",
    parts: [
      { name: "원줄", spec: "합사(PE) 0.8~1.2호" },
      { name: "기둥줄", spec: "카본 4~5호, 1~2m" },
      { name: "에기", spec: "2.5~3.0호, 가지줄 20~30cm" },
      { name: "봉돌", spec: "12~20호" },
    ],
    dims: { branch: "20~30cm", tail: "30~40cm", lift: "바닥에 닿게" },
    depth: "봉돌은 바닥에, 에기는 바닥에서 30~40cm 위에서 쉬게 해요.",
    reach: "배 아래로 내려요 (수심 5~25m)",
    motion: "boat-egi",
    gear: [
      { id: "egi", name: "갑오징어 에기", spec: "2.5~3.0호", keyword: "갑오징어 에기", qty: "4~6개", priceRange: [5000, 15000], essential: true },
      { id: "sinker", name: "봉돌", spec: "15호", keyword: "쭈꾸미 봉돌 15호", qty: "5개", priceRange: [3000, 7000], essential: true },
      { id: "rig", name: "갑오징어 채비", spec: "가지 20~30cm", keyword: "갑오징어 채비", qty: "3개", priceRange: [3000, 7000], essential: false },
    ],
  },
  halfbeak: {
    variant: "shallow",
    parts: [
      { name: "원줄", spec: "나일론 2호 (민장대면 대 길이만큼)" },
      { name: "찌", spec: "학꽁치 전용 소형 막대찌 (1~2g)" },
      { name: "목줄", spec: "1~1.5호, 30~50cm" },
      { name: "바늘", spec: "학꽁치 전용 1~3호 (아주 작은 것)" },
    ],
    dims: { stop: "30~50cm", leader: "30~50cm" },
    depth: "물 위에서 30~50cm 깊이에 미끼가 떠 있게 해요. 학꽁치는 물 위 가까이에 있어요.",
    reach: "발 앞 5~10m",
    motion: "shore-float",
    gear: [
      { id: "rig", name: "학꽁치 채비 세트", spec: "찌+목줄+바늘", keyword: "학꽁치 채비", qty: "2~3개", priceRange: [3000, 8000], essential: true },
      { id: "hook", name: "학꽁치 바늘", spec: "1~2호", keyword: "학꽁치 바늘", qty: "1봉", priceRange: [2000, 5000], essential: false },
      { id: "chum", name: "학꽁치 집어제", spec: "크릴과 섞기", keyword: "학꽁치 집어제", qty: "1봉", priceRange: [4000, 10000], essential: false },
      { id: "rod", name: "민장대", spec: "3~4.5m", keyword: "민장대 낚싯대", qty: "1개", priceRange: [10000, 30000], essential: false },
    ],
  },
  mackerel: {
    parts: [
      { name: "원줄", spec: "나일론 3~4호" },
      { name: "카드채비", spec: "바늘 6~8개(8~10호), 전체 1.5~2m" },
      { name: "밑밥통(카고) 또는 봉돌", spec: "10~15호", note: "밑밥통에 크릴을 넣으면 고기가 모여요" },
    ],
    dims: { gap: "25~30cm", total: "1.5~2m", swim: "2~5m" },
    depth: "물속 중간(수면 아래 2~5m)에 두고 천천히 흔들어요. 해질녘엔 더 얕게.",
    reach: "발 앞 10~20m 또는 바로 아래로",
    motion: "shore-sabiki",
    gear: [
      { id: "rig", name: "카드채비 (사비키)", spec: "바늘 8~10호", keyword: "고등어 카드채비", qty: "5개", priceRange: [3000, 8000], essential: true },
      { id: "cage", name: "밑밥통(카고)", spec: "10~15호", keyword: "카고 밑밥통", qty: "2개", priceRange: [3000, 8000], essential: true },
      { id: "line", name: "나일론 원줄", spec: "3호 150m", keyword: "나일론 낚시줄 3호", qty: "1개", priceRange: [4000, 12000], essential: false },
      { id: "rod", name: "바다 릴낚싯대 세트", spec: "3.6~4.5m + 2500번 릴", keyword: "바다낚시대 릴 세트", qty: "1세트", priceRange: [25000, 70000], essential: false },
    ],
  },
  bolak: {
    parts: [
      { name: "원줄", spec: "합사(PE) 0.3~0.4호 또는 에스테르 0.3호" },
      { name: "쇼크리더", spec: "카본 1.5~2호, 약 1m" },
      { name: "지그헤드", spec: "0.8~2g", note: "바람·물살 세면 무겁게" },
      { name: "웜", spec: "1.5~2인치" },
    ],
    dims: { leader: "약 1m", swim: "1~3m" },
    depth: "수면 아래 1~3m를 아주 천천히 지나가게 해요 (1초에 반 바퀴).",
    reach: "10~30m",
    motion: "shore-jighead",
    gear: [
      { id: "jig", name: "볼락 지그헤드", spec: "1g", keyword: "볼락 지그헤드 1g", qty: "1봉", priceRange: [3000, 7000], essential: true },
      { id: "worm", name: "볼락 웜", spec: "2인치", keyword: "볼락 웜 2인치", qty: "1~2봉", priceRange: [3000, 8000], essential: true },
      { id: "line", name: "합사 원줄", spec: "PE 0.4호", keyword: "합사 0.4호", qty: "1개", priceRange: [10000, 30000], essential: false },
      { id: "leader", name: "카본 쇼크리더", spec: "1.5~2호", keyword: "카본 쇼크리더 2호", qty: "1개", priceRange: [7000, 18000], essential: false },
    ],
  },
  righteye: {
    parts: [
      { name: "원줄", spec: "나일론 4~5호" },
      { name: "힘줄", spec: "12~16호, 10~15m", note: "세게 던질 때 줄이 끊어지지 않게" },
      { name: "가지채비(편대)", spec: "목줄 3호 15~20cm × 2개" },
      { name: "바늘", spec: "가자미 바늘 10~12호" },
      { name: "봉돌", spec: "20~25호 (삼각·구멍봉돌)" },
    ],
    dims: { branch: "15~20cm", gap: "30~40cm", tail: "20~30cm", lift: "바닥에 닿게" },
    depth: "봉돌을 바닥에 두고 미끼가 바닥에 닿아 있게 해요.",
    reach: "백사장에서 50~100m 멀리",
    motion: "shore-surf",
    gear: [
      { id: "rig", name: "가자미 원투 채비", spec: "바늘 2개, 10~12호", keyword: "가자미 채비", qty: "3~5개", priceRange: [3000, 8000], essential: true },
      { id: "sinker", name: "원투 봉돌", spec: "25호", keyword: "원투 봉돌 25호", qty: "3개", priceRange: [3000, 7000], essential: true },
      { id: "shock", name: "힘줄", spec: "12~16호", keyword: "원투 힘줄", qty: "1개", priceRange: [4000, 10000], essential: false },
      { id: "stand", name: "받침대 (삼각대)", spec: "대 세워 두기", keyword: "원투 삼각대 받침대", qty: "1개", priceRange: [10000, 30000], essential: false },
    ],
  },
  "squid-bigfin": {
    variant: "cast",
    parts: [
      { name: "원줄", spec: "합사(PE) 0.6~0.8호, 150m" },
      { name: "쇼크리더", spec: "카본 2~2.5호, 1.5~2m" },
      { name: "스냅", spec: "에깅 전용 소형 스냅" },
      { name: "에기", spec: "3.0~3.5호", note: "1m 가라앉는 데 약 3초" },
    ],
    dims: { leader: "1.5~2m", fall: "1m ≈ 3초" },
    depth: "바닥 가까이까지 가라앉힌 뒤, 쳐올리고 다시 가라앉히며 바닥 1~3m 위를 오르내려요.",
    reach: "20~50m",
    motion: "shore-egi",
    gear: [
      { id: "egi", name: "무늬오징어 에기", spec: "3.0~3.5호, 여러 색", keyword: "무늬오징어 에기 3.5호", qty: "3~5개", priceRange: [7000, 20000], essential: true },
      { id: "leader", name: "카본 쇼크리더", spec: "2~2.5호", keyword: "에깅 쇼크리더 2호", qty: "1개", priceRange: [7000, 18000], essential: true },
      { id: "line", name: "에깅 합사", spec: "PE 0.6~0.8호 150m", keyword: "에깅 합사 0.8호", qty: "1개", priceRange: [12000, 35000], essential: false },
      { id: "snap", name: "에깅 스냅", spec: "소형", keyword: "에깅 스냅", qty: "1봉", priceRange: [2000, 6000], essential: false },
    ],
  },
  ...MORE_RIG_SPECS,
};

export const getRigSpec = (id: string): RigSpec | undefined => RIG_SPECS[id];
