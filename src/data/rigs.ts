import type { RigKind } from "./guides";

/**
 * 채비 도감: 종류별 구성(위 → 아래)·원리·쓰는 법·장단점·실수·대표 어종.
 * 원리: 고기가 먹는 '층(깊이)'과 '장소(바닥 재질·물살)', 그리고 미끼 종류가 채비 모양을 정한다.
 * 어종 연결은 어종 화면의 채비(guides.ts rig.kind)와 맞춘다 — 테스트로 확인.
 */

export type Family = "바닥" | "찌" | "여러 바늘" | "루어" | "오징어·문어";
export type Layer = "바닥" | "중층" | "표층";
export type Place = "방파제·갯바위" | "백사장" | "배";

export interface Rig {
  id: string;
  name: string;
  aka?: string;
  family: Family;
  diagram: { kind: RigKind; variant?: "boat" | "cast" | "shallow" | "free" | "single" | "squid" };
  layer: Layer[];
  place: Place[];
  bait: "생미끼" | "루어" | "둘 다";
  /** 1 쉬움 · 2 보통 · 3 어려움 */
  level: 1 | 2 | 3;
  /** 밑걸림 위험 1 낮음 · 2 보통 · 3 높음 */
  snag: 1 | 2 | 3;
  /** 위 → 아래 구성. term: 장비·용어 사전 항목 id */
  parts: { name: string; term?: string }[];
  /** 왜 이렇게 생겼나 */
  principle: string;
  how: string[];
  pros: string[];
  cons: string[];
  mistakes: string[];
  /** 어종 id (어종 화면 채비와 같은 종류) */
  species: string[];
  /** 대표 어종이 없을 때 응용 예 */
  useFor?: string;
}

export const FAMILY_INFO: Record<Family, { icon: string; desc: string }> = {
  바닥: { icon: "⬇", desc: "봉돌로 미끼를 바닥에 두거나 바닥 가까이 띄워요. 바닥에 사는 고기용." },
  찌: { icon: "🎈", desc: "찌가 미끼를 일정한 깊이에 매달고 입질을 눈으로 보여줘요. 중층·표층 고기용." },
  "여러 바늘": { icon: "🎏", desc: "바늘 여러 개로 떼 지어 다니는 고기를 한 번에 노려요." },
  루어: { icon: "🐟", desc: "가짜 미끼를 감거나 쳐올려 움직임으로 고기를 속여요." },
  "오징어·문어": { icon: "🦑", desc: "새우 모양 에기·뿔로 다리로 감싸 잡는 두족류를 노려요. 바늘에 미늘이 없어요." },
};

export const RIGS: Rig[] = [
  // ───────── 바닥 ─────────
  {
    id: "surf-branch",
    name: "바닥 가지채비 (원투·짧은 원투)",
    aka: "편대채비, 가자미 채비",
    family: "바닥",
    diagram: { kind: "bottom", variant: "cast" },
    layer: ["바닥"],
    place: ["백사장", "방파제·갯바위"],
    bait: "생미끼",
    level: 1,
    snag: 2,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "도래", term: "swivel" },
      { name: "가지바늘 2~3개(편대로 벌림)", term: "spreader" },
      { name: "봉돌(맨 아래)", term: "sinker" },
    ],
    principle: "무거운 봉돌을 맨 아래에 달아 멀리 던지고 바닥에 고정해요. 바늘을 위쪽 가지에 여러 개 달아 냄새가 넓게 퍼지고, 가지가 원줄에서 떨어져 있어 엉킴이 적어요.",
    how: ["모래 바닥 쪽으로 멀리 던져요(쥐노래미처럼 발 앞 돌 틈을 노리면 가벼운 봉돌로 짧게).", "봉돌이 바닥에 닿으면 줄을 살짝 팽팽하게 하고 대를 받침대에 세워요.", "몇 분마다 1~2바퀴 천천히 끌어 자리를 옮겨요(돌 틈은 1~2분마다 반 바퀴).", "초릿대가 투둑거리면 들어 올리고 일정하게 감아요."],
    pros: ["가장 쉬운 채비", "넓은 바닥을 노림", "대 여러 대를 세워 둘 수 있음"],
    cons: ["바위 바닥에서는 밑걸림", "무거운 대·릴이 필요"],
    mistakes: ["줄을 느슨하게 둬서 입질을 못 봄", "바위 쪽으로 던져 계속 걸림"],
    species: ["righteye", "dodari", "goby", "conger", "greenling"],
  },
  {
    id: "sliding-sinker",
    name: "유동 봉돌 외바늘 채비",
    aka: "구멍봉돌 채비, 처넣기",
    family: "바닥",
    diagram: { kind: "bottom", variant: "single" },
    layer: ["바닥"],
    place: ["방파제·갯바위"],
    bait: "생미끼",
    level: 1,
    snag: 2,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "구멍봉돌(줄이 구멍을 지나감)", term: "sinker" },
      { name: "도래(봉돌 멈춤)", term: "swivel" },
      { name: "목줄", term: "leader" },
      { name: "바늘 1개 + 미끼", term: "hook" },
    ],
    principle: "원줄이 봉돌 구멍을 자유롭게 지나가서, 고기가 미끼를 물고 당길 때 봉돌 무게가 덜 느껴져 뱉지 않아요. 바늘이 하나라 바위 근처에서도 덜 걸려요.",
    how: ["물속 바위 옆 바닥에 던져요.", "대를 받침대에 세우고 줄을 팽팽하게 해요.", "톡톡 쪼는 작은 입질에는 기다려요.", "쾅 끌려가면 대를 세우고, 바위로 파고들기 전에 감아 들여요."],
    pros: ["예민한 고기도 이물감 적음", "구조가 단순하고 덜 엉킴"],
    cons: ["바늘이 하나라 노리는 범위가 좁음"],
    mistakes: ["목줄을 너무 짧게 해 이물감 효과가 없음"],
    species: ["rockbream"],
  },
  {
    id: "boat-bottom",
    name: "선상 바닥 채비",
    aka: "우럭 채비, 외수질",
    family: "바닥",
    diagram: { kind: "bottom" },
    layer: ["바닥"],
    place: ["배"],
    bait: "생미끼",
    level: 1,
    snag: 3,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "도래", term: "swivel" },
      { name: "가지바늘 1~2개", term: "hook" },
      { name: "봉돌(맨 아래, 선장이 정해 준 무게)", term: "sinker" },
    ],
    principle: "봉돌이 바닥에 닿은 뒤 1~2바퀴 감아 띄우면, 위쪽 가지바늘이 암초 위 고기 눈높이에 떠요. 바닥에 끌고 다니지 않아 밑걸림을 줄여요.",
    how: ["봉돌을 바닥까지 내려요('툭').", "1~2바퀴 감아 봉돌을 살짝 띄워요.", "대를 천천히 위아래로 움직이고, 30초마다 바닥을 다시 찍어요.", "입질 후 1~2초 기다렸다 들어 올리며 감아요."],
    pros: ["배가 고기 있는 곳으로 데려감", "장비를 빌릴 수 있음"],
    cons: ["암초 지대라 밑걸림이 잦음", "봉돌 무게를 배 전체가 맞춰야 함(엉킴 방지)"],
    mistakes: ["봉돌을 바닥에 계속 끌기", "선장이 정한 것과 다른 무게 쓰기 — 옆 사람과 엉킴"],
    species: ["rockfish"],
  },
  {
    id: "downshot",
    name: "다운샷 채비",
    family: "바닥",
    diagram: { kind: "downshot" },
    layer: ["바닥"],
    place: ["배", "방파제·갯바위"],
    bait: "루어",
    level: 2,
    snag: 2,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "바늘(웜) — 가지로 매듭", term: "hook" },
      { name: "아래로 늘어진 목줄", term: "leader" },
      { name: "맨 아래 봉돌", term: "sinker" },
    ],
    principle: "봉돌이 바닥에 닿아 있는 동안 웜은 봉돌 위 일정한 높이에 떠 있어요. 바닥에 숨어 위를 보는 광어 눈앞에 웜을 계속 두는 구조예요.",
    how: ["봉돌을 바닥까지 내려요.", "대 끝으로 바닥을 '톡톡' 쳐 웜이 춤추게 해요.", "잠깐 멈추고, 줄이 비스듬해지면 바닥을 다시 확인해요.", "묵직하면 채고 일정하게 감아요."],
    pros: ["웜 높이를 정확히 유지", "바닥 고기에 강함"],
    cons: ["봉돌이 바닥에서 떨어지면 효과가 없음"],
    mistakes: ["봉돌을 띄운 채 오래 두기"],
    species: ["flatfish"],
  },

  // ───────── 찌 ─────────
  {
    id: "half-float",
    name: "반유동 찌채비",
    family: "찌",
    diagram: { kind: "float" },
    layer: ["중층", "바닥"],
    place: ["방파제·갯바위"],
    bait: "생미끼",
    level: 2,
    snag: 2,
    parts: [
      { name: "원줄(플로팅·세미플로팅)", term: "mainline" },
      { name: "찌멈춤 매듭", term: "float-stop" },
      { name: "구슬", term: "bead" },
      { name: "구멍찌", term: "float" },
      { name: "수중찌", term: "sub-float" },
      { name: "도래", term: "swivel" },
      { name: "목줄(카본)", term: "leader" },
      { name: "좁쌀봉돌", term: "sinker" },
      { name: "바늘 + 미끼", term: "hook" },
    ],
    principle: "찌멈춤 매듭이 찌가 올라갈 위치를 정해, 미끼가 원하는 깊이(찌밑 수심)에서 멈춰요. 그 깊이를 밑밥과 같이 흘려 고기 앞에 미끼를 보내요.",
    how: ["바닥 깊이를 재고, 미끼가 바닥 바로 위에 오도록 찌멈춤 매듭 위치를 맞춰요.", "밑밥을 뿌린 곳에 던져 같이 흘려요.", "늘어진 줄만 감아 찌와 일직선을 유지해요.", "찌가 쏙 잠기면 대를 세워요."],
    pros: ["깊이를 정확히 노림", "입질이 눈에 보임"],
    cons: ["깊이 맞추기·밑밥 등 익힐 게 많음", "바람에 약함"],
    mistakes: ["찌밑 수심을 바닥보다 깊게 맞춰 계속 걸림", "찌보다 무거운 봉돌을 달아 찌가 가라앉음"],
    species: ["blackporgy", "hairtail"],
  },
  {
    id: "full-float",
    name: "전유동 찌채비",
    family: "찌",
    diagram: { kind: "float", variant: "free" },
    layer: ["중층", "표층"],
    place: ["방파제·갯바위"],
    bait: "생미끼",
    level: 3,
    snag: 1,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "구멍찌(찌멈춤 매듭 없음)", term: "float" },
      { name: "도래", term: "swivel" },
      { name: "목줄", term: "leader" },
      { name: "바늘 + 미끼", term: "hook" },
    ],
    principle: "찌멈춤 매듭이 없어서 미끼가 밑밥처럼 천천히 계속 가라앉으며 여러 깊이를 훑어요. 고기가 어느 층에 떠 있는지 모를 때, 밑밥에 떠오르는 고기에 좋아요.",
    how: ["밑밥을 조금씩 자주 뿌려 고기를 띄워요.", "밑밥과 같이 흘리며, 미끼가 밑밥과 같은 속도로 가라앉게 해요.", "찌가 아니라 원줄이 쭉 끌려가는 것으로도 입질을 봐요.", "움직임이 보이면 바로 채요."],
    pros: ["여러 깊이를 자연스럽게 탐색", "예민한 고기에 강함"],
    cons: ["입질 파악이 어려워 초보에게 어려움"],
    mistakes: ["줄을 너무 감아 미끼가 끌려옴"],
    species: ["opaleye"],
  },
  {
    id: "stick-float",
    name: "막대찌 채비(얕은 찌)",
    aka: "고정찌",
    family: "찌",
    diagram: { kind: "float", variant: "shallow" },
    layer: ["표층"],
    place: ["방파제·갯바위"],
    bait: "생미끼",
    level: 1,
    snag: 1,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "막대찌(얕게 고정)", term: "float" },
      { name: "목줄", term: "leader" },
      { name: "작은 바늘 + 작은 미끼", term: "hook" },
    ],
    principle: "찌밑 수심을 얕게(수십 cm~1m) 고정해 수면 가까이 떼로 다니는 고기를 노려요. 막대찌는 작은 입질도 잘 보여요.",
    how: ["밑밥을 조금씩 뿌려 떼를 모아요.", "미끼를 작게 달고 밑밥 띠 안에 던져요.", "찌가 움직이면 바로 채요(학꽁치) 또는 잠기면 채요(숭어)."],
    pros: ["가장 쉬운 찌낚시", "입질이 잘 보임"],
    cons: ["깊은 곳 고기는 못 노림"],
    mistakes: ["미끼를 크게 달아 입 작은 고기가 못 삼킴"],
    species: ["halfbeak", "mullet"],
  },

  // ───────── 여러 바늘 ─────────
  {
    id: "sabiki",
    name: "카드채비",
    aka: "사비키",
    family: "여러 바늘",
    diagram: { kind: "sabiki" },
    layer: ["중층", "표층"],
    place: ["방파제·갯바위", "배"],
    bait: "둘 다",
    level: 1,
    snag: 2,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "반짝이 바늘 여러 개(카드)", term: "hook" },
      { name: "밑밥통 또는 봉돌", term: "chum" },
    ],
    principle: "반짝이(가짜 미끼)가 달린 작은 바늘 여러 개를 층층이 달아, 떼 지어 다니는 고기가 한 번에 여러 마리 물게 해요. 밑밥통으로 바늘 근처에 밑밥 구름을 만들어요.",
    how: ["밑밥통에 크릴을 채우고 떼가 있는 깊이까지 내려요.", "대를 천천히 들었다 내려 반짝이를 흔들어요.", "투두둑 오면 몇 초 기다려 더 걸리게 한 뒤 천천히 감아요."],
    pros: ["초보도 마릿수 조과", "고등어·전어 떼에 최고"],
    cons: ["바늘이 많아 엉키기 쉬움", "떼가 없으면 소용없음"],
    mistakes: ["빨리 감아 바늘끼리 엉킴", "엉킨 채비를 무리하게 풀다 손 찔림"],
    species: ["mackerel", "gizzardshad"],
  },

  // ───────── 루어 ─────────
  {
    id: "jighead",
    name: "지그헤드 + 웜",
    family: "루어",
    diagram: { kind: "jighead" },
    layer: ["중층", "표층"],
    place: ["방파제·갯바위"],
    bait: "루어",
    level: 1,
    snag: 2,
    parts: [
      { name: "원줄(가는 합사·나일론)", term: "mainline" },
      { name: "쇼크리더(목줄)", term: "shock" },
      { name: "지그헤드(봉돌+바늘 일체)", term: "sinker" },
      { name: "웜", term: "lure" },
    ],
    principle: "봉돌과 바늘이 하나로 붙어 있어 구조가 단순하고, 무게(g)로 가라앉는 속도와 깊이를 정해요. 천천히 감으면 웜이 작은 먹이처럼 헤엄쳐요.",
    how: ["던지고 숫자를 세며 가라앉혀 층을 정해요.", "1초에 반 바퀴 정도로 아주 천천히 감아요.", "잠깐 멈추면 웜이 살짝 가라앉으며 입질이 와요.", "톡 오면 가볍게 채요."],
    pros: ["가볍고 간단한 루어 입문", "밤 볼락에 강함"],
    cons: ["가벼워서 바람·물살에 약함"],
    mistakes: ["빨리 감기", "매번 다른 숫자로 세어 층을 놓침"],
    species: ["bolak"],
  },
  {
    id: "nosinker",
    name: "노싱커 채비",
    family: "루어",
    diagram: { kind: "nosinker" },
    layer: ["표층", "중층"],
    place: ["방파제·갯바위"],
    bait: "둘 다",
    level: 2,
    snag: 1,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "목줄", term: "leader" },
      { name: "바늘 + 미끼(웜·생미끼), 봉돌 없음", term: "nosinker" },
    ],
    principle: "봉돌이 없어 미끼가 아주 천천히, 자연스럽게 가라앉아요. 경계심이 큰 고기가 이물감 없이 물어요.",
    how: ["가까운 곳에 살짝 던져요.", "줄을 보며 천천히 가라앉게 둬요.", "줄이 갑자기 움직이거나 멈추면 채요."],
    pros: ["가장 자연스러운 움직임", "밑걸림 적음"],
    cons: ["멀리 못 던짐", "바람·물살에 쉽게 밀림"],
    mistakes: ["물살 센 날 쓰기 — 미끼가 원하는 곳에 머물지 않음"],
    species: [],
    useFor: "물살이 약한 내항에서 예민한 볼락·감성돔을 노릴 때 응용해요. 어종 화면의 기본 채비가 안 통할 때 시도해 보세요.",
  },
  {
    id: "minnow",
    name: "미노우(플러그)",
    family: "루어",
    diagram: { kind: "lure" },
    layer: ["표층", "중층"],
    place: ["방파제·갯바위", "백사장"],
    bait: "루어",
    level: 2,
    snag: 1,
    parts: [
      { name: "합사 원줄", term: "pe" },
      { name: "쇼크리더", term: "shock" },
      { name: "스냅", term: "swivel" },
      { name: "미노우(작은 물고기 모양)", term: "lure" },
    ],
    principle: "작은 물고기 모양 루어가 감는 동안 몸을 흔들며 헤엄쳐요. 감는 속도로 깊이와 움직임을 정하고, 가끔 대를 툭 쳐 약한 먹이처럼 비틀거리게 해요.",
    how: ["포말·물살 부딪히는 곳 너머로 던져요.", "떨어지자마자 천천히 일정하게 감아요.", "가끔 대를 툭(트위치).", "무게가 오면 대를 세워 채요."],
    pros: ["넓은 범위를 빠르게 탐색", "밑걸림 적음"],
    cons: ["루어 값이 비쌈", "바닥 고기는 못 노림"],
    mistakes: ["포말 밖 먼 곳만 빠르게 감기"],
    species: ["seabass"],
  },
  {
    id: "metaljig",
    name: "메탈지그",
    aka: "쇼어지깅·선상 지깅",
    family: "루어",
    diagram: { kind: "lure" },
    layer: ["표층", "중층", "바닥"],
    place: ["방파제·갯바위", "배"],
    bait: "루어",
    level: 2,
    snag: 2,
    parts: [
      { name: "합사 원줄", term: "pe" },
      { name: "쇼크리더(굵게)", term: "shock" },
      { name: "스냅·어시스트훅", term: "swivel" },
      { name: "메탈지그(금속, 빨리 가라앉음)", term: "lure" },
    ],
    principle: "무거운 금속이라 멀리 날아가고 빨리 가라앉아, 원하는 깊이까지 보낸 뒤 빠르게 감거나 쳐올려 도망치는 작은 물고기처럼 보이게 해요.",
    how: ["원하는 깊이까지 가라앉혀요(숫자 세기, 선상은 바닥까지).", "빠르게 등속으로 감거나(캐스팅), 대를 한 번 칠 때 핸들 1바퀴(원피치 저크).", "무게가 오면 멈추지 말고 감아요."],
    pros: ["멀리·깊이 빠르게", "회유어에 강함"],
    cons: ["체력 소모가 큼", "바닥까지 내리면 밑걸림"],
    mistakes: ["느리게 감기", "저킹과 감기 박자가 어긋나 줄이 늘어짐"],
    species: ["spanishmackerel", "yellowtail"],
  },
  {
    id: "tairaba",
    name: "타이라바",
    family: "루어",
    diagram: { kind: "tairaba" },
    layer: ["바닥", "중층"],
    place: ["배"],
    bait: "루어",
    level: 2,
    snag: 2,
    parts: [
      { name: "합사 원줄", term: "pe" },
      { name: "쇼크리더", term: "shock" },
      { name: "타이라바 머리(추)", term: "sinker" },
      { name: "스커트·넥타이 + 바늘 2개", term: "hook" },
    ],
    principle: "둥근 추 아래 스커트가 하늘거리며 새우·게처럼 보여요. 바닥에서 일정한 속도로 감아 올리면 참돔이 따라오다 물어요.",
    how: ["바닥까지 내려요.", "닿자마자 1초에 1바퀴로 10~15m 감아올려요.", "다시 내려 반복해요.", "입질이 와도 같은 속도로 감다가 대가 크게 휘면 세워요."],
    pros: ["단순한 동작으로 큰 참돔", "바닥 걸림 적은 편"],
    cons: ["속도 유지가 핵심이라 익숙해질 때까지 놓침"],
    mistakes: ["입질에 멈추거나 챔질하기"],
    species: ["redseabream"],
  },

  // ───────── 오징어·문어 ─────────
  {
    id: "eging",
    name: "에깅(에기 단독)",
    family: "오징어·문어",
    diagram: { kind: "egi", variant: "cast" },
    layer: ["바닥", "중층"],
    place: ["방파제·갯바위"],
    bait: "루어",
    level: 2,
    snag: 2,
    parts: [
      { name: "합사 원줄", term: "pe" },
      { name: "쇼크리더", term: "shock" },
      { name: "스냅", term: "swivel" },
      { name: "에기(새우 모양, 미늘 없는 갈고리)", term: "barb" },
    ],
    principle: "에기를 쳐올리면 새우가 튀어 도망치는 것처럼 보이고, 가라앉는 순간 오징어가 다리로 감싸 안아요. 갈고리에 미늘이 없어 줄을 팽팽하게 유지해야 해요.",
    how: ["멀리 던져 바닥 근처까지 가라앉혀요.", "대를 휙휙 2~3번 쳐올려요.", "다시 가라앉게 두며 줄을 봐요.", "줄 변화가 보이면 크게 채고 일정하게 감아요."],
    pros: ["채비가 단순", "가을 무늬오징어 시즌에 강함"],
    cons: ["입질 보기가 어려움", "에기 값"],
    mistakes: ["저킹만 하고 폴링을 짧게 끊기"],
    species: ["squid-bigfin"],
  },
  {
    id: "egi-sinker",
    name: "봉돌 + 에기(애기)",
    aka: "주꾸미·갑오징어·문어 채비",
    family: "오징어·문어",
    diagram: { kind: "egi" },
    layer: ["바닥"],
    place: ["배", "방파제·갯바위"],
    bait: "루어",
    level: 1,
    snag: 3,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "에기(애기) 1~2개 — 가지", term: "lure" },
      { name: "맨 아래 봉돌", term: "sinker" },
    ],
    principle: "봉돌로 바닥에 붙여 두고 에기를 바닥 바로 위에서 흔들어요. 바닥에 사는 주꾸미·갑오징어·문어가 에기에 올라타요.",
    how: ["봉돌을 바닥까지 내려요.", "대 끝만 톡톡 흔들어요.", "3~10초 멈춰 올라타게 해요.", "살짝 들어 묵직하면 멈추지 말고 감아요."],
    pros: ["초보도 쉬운 동작", "가을 주꾸미 배낚시 인기"],
    cons: ["바닥에 붙여 쓰니 밑걸림이 잦음"],
    mistakes: ["멈춤 없이 계속 흔들기", "속초시 수역에서 문어 낚시(조례로 금지)"],
    species: ["webfoot", "cuttlefish", "octopus"],
  },
  {
    id: "squid-jig",
    name: "오징어 뿔채비",
    family: "오징어·문어",
    diagram: { kind: "sabiki", variant: "squid" },
    layer: ["중층", "표층"],
    place: ["배"],
    bait: "루어",
    level: 1,
    snag: 1,
    parts: [
      { name: "원줄", term: "mainline" },
      { name: "오징어 뿔 여러 개(미늘 없음)", term: "barb" },
      { name: "봉돌", term: "sinker" },
    ],
    principle: "밤에 배 불빛으로 떠오른 오징어 떼 속에 뿔 여러 개를 내려, 천천히 오르내리는 뿔을 먹이로 알고 감싸게 해요.",
    how: ["선장이 알려준 깊이까지 내려요.", "대를 천천히 들었다 내려요.", "무게가 오면 같은 속도로 감아요(멈추면 빠짐)."],
    pros: ["한 번에 여러 마리"],
    cons: ["밤 선상 전용", "먹물"],
    mistakes: ["감는 중간에 멈추기"],
    species: ["squid"],
  },
];

export const rigById = (id: string) => RIGS.find((r) => r.id === id);

/** 어종 → 채비 도감 항목 */
export function rigForSpecies(speciesId: string): Rig | undefined {
  return RIGS.find((r) => r.species.includes(speciesId));
}

/** 채비 고르기: 조건에 맞는 채비 (조건이 비면 그 조건은 따지지 않음), 쉬운 순 */
export function pickRigs(q: { place?: Place; layer?: Layer; bait?: "생미끼" | "루어" }): Rig[] {
  return RIGS.filter(
    (r) =>
      (!q.place || r.place.includes(q.place)) &&
      (!q.layer || r.layer.includes(q.layer)) &&
      (!q.bait || r.bait === q.bait || r.bait === "둘 다"),
  ).sort((a, b) => a.level - b.level || a.snag - b.snag);
}
