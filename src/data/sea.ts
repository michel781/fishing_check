import { SEA_TIDE_TIMING, SEA_WEIGHTS } from "@/lib/engine/score";
import type { Sea, Weights } from "@/lib/types";
import { SPOTS } from "./spots";

/**
 * 바다 이해하기 (초보용).
 *  - 바다를 읽는 8가지 요소: 무엇인지 → 고기에게 왜 중요한지 → 앱에서 어디서 보는지 → 안전
 *  - 해역별 성격: 관측소 조차는 이 서비스가 조석 추정에 쓰는 근사값, 중요도는 점수 엔진의 실제 가중치
 */

export interface SeaFactor {
  id: string;
  name: string;
  icon: string;
  what: string;
  fish: string;
  read: string;
  safety?: string;
  link?: { href: string; label: string };
}

export const FACTORS: SeaFactor[] = [
  {
    id: "tide",
    name: "물때(조석)",
    icon: "🌕",
    what: "달과 해가 바닷물을 끌어당겨 하루 두 번씩 물이 들고(들물) 빠져요(썰물). 만조·간조 시각은 매일 약 50분씩 늦어지고, 보름(약 15일)마다 물 차이가 큰 사리와 작은 조금이 번갈아 와요.",
    fish: "물이 움직일 때 먹이가 흘러 다녀 입질이 살아나요. 물이 멈추는 만조·간조 무렵(정조)엔 뜸하다가, 물이 다시 움직이는 물돌이 직후(초들물·초날물)에 입질이 살아나는 경우가 많아요.",
    read: "포인트 화면 '시간대별 물 높이'의 초·중·끝 들물·썰물, 물때표의 사리·조금 달력.",
    safety: "서해 갯벌·갯바위는 물이 빠르게 차올라 고립될 수 있어요. 만조 시각을 먼저 확인하세요.",
    link: { href: "/tide", label: "물때표 보기" },
  },
  {
    id: "current",
    name: "조류(물살)",
    icon: "〰",
    what: "물이 들고 빠지며 생기는 흐름이에요. 사리 때, 그리고 들물·썰물 중간(중들물·중썰물)에 가장 세고, 섬 사이·방파제 끝·곶에서 더 빨라져요.",
    fish: "적당한 물살은 먹이를 실어 오고 고기를 움직이게 해요. 너무 세면 채비가 떠오르고 고기도 바위 뒤로 숨어요.",
    read: "물 높이 표의 '물살 셈' 표시, 채비 화면의 봉돌 무게 조절.",
    safety: "물살이 센 곳에서는 무거운 봉돌이 필요하고, 빠지면 떠밀려요.",
  },
  {
    id: "temp",
    name: "수온",
    icon: "🌡",
    what: "바닷물 온도는 계절·해역·깊이에 따라 달라요. 여름 동해는 차가운 물이 솟는 냉수대가 생기기도 해요.",
    fish: "어종마다 잘 먹는 수온 범위가 있어요. 범위 안이라도 하루 이틀 새 2℃ 넘게 떨어지면 입을 닫아요.",
    read: "포인트 화면 현재 해황의 수온, 어종 화면 '습성·먹이' 탭의 '수온별 먹이 활동' 곡선.",
    link: { href: "/fish/rockfish#feed", label: "수온 곡선 예시" },
  },
  {
    id: "wind",
    name: "바람",
    icon: "🌬",
    what: "포인트가 바라보는 바다 쪽에서 부는 바람이 '맞바람'이에요. 등 뒤에서 부는 바람은 바다를 잔잔하게 해요.",
    fish: "맞바람은 파도를 키우고 채비를 밀어 낚시를 어렵게 해요. 약한 바람과 잔물결은 고기의 경계심을 낮추기도 해요.",
    read: "포인트 점수의 이유(맞바람·바람 약함), 시간대별 낚시지수.",
    safety: "강풍 예보 날 방파제 끝·갯바위는 피하세요.",
  },
  {
    id: "wave",
    name: "파도·너울",
    icon: "🌊",
    what: "파도는 그 자리 바람이 만든 짧은 물결, 너울은 먼 바다 바람이 만든 길고 느린 물결이에요. 너울은 바람이 없어도 오고, 주기가 길수록 힘이 세요.",
    fish: "약간의 파도·포말은 물속을 가려 농어·감성돔의 경계심을 낮춰요. 너무 크면 고기도 깊은 곳으로 피해요.",
    read: "포인트 해황의 파고·파주기, 안전 판정.",
    safety: "잔잔해 보여도 몇 분 간격으로 큰 너울이 덮쳐요. 파주기가 긴 날 갯바위·테트라포드는 위험해요.",
    link: { href: "/guide", label: "안전 수칙" },
  },
  {
    id: "pressure",
    name: "기압·날씨 변화",
    icon: "⛅",
    what: "날씨가 바뀌기 전 기압이 떨어지고, 비가 오면 물색이 흐려져요.",
    fish: "기압이 떨어지기 시작할 때 고기가 활발해지는 경우가 많아요. 약한 비·흐린 물은 경계심을 낮추지만, 큰비 뒤 흙탕물은 입질을 끊기도 해요.",
    read: "포인트 점수의 이유(날씨 바뀌기 전 활발, 비 많이 옴).",
  },
  {
    id: "bottom",
    name: "바닥 지형",
    icon: "🪨",
    what: "모래·펄·자갈·암초·해초, 그리고 방파제·테트라포드 같은 구조물이 바닥을 이뤄요.",
    fish: "암초·구조물에는 숨어 사는 고기(우럭·노래미·볼락), 모래에는 바닥을 뒤지는 고기(가자미·보리멸)가 있어요. 경계선에 먹이가 모여요.",
    read: "구조물별 서식 가이드, 포인트 화면 '구조물별 노릴 곳'.",
    link: { href: "/structures", label: "구조물별 서식" },
  },
  {
    id: "light",
    name: "빛(해·달)",
    icon: "🌗",
    what: "해 뜰 무렵·해 질 무렵, 낮·밤, 그리고 달빛 밝기가 하루와 보름마다 바뀌어요.",
    fish: "많은 고기가 해 뜰·질 무렵 가장 활발해요. 볼락·갈치처럼 밤에 먹는 고기는 어두운 밤을, 오징어류는 불빛 주변을 좋아해요.",
    read: "어종 화면 '습성·먹이' 탭의 '하루 먹이 활동', 밤낚시 추천.",
    link: { href: "/night", label: "오늘 밤 밤낚시" },
  },
];

export const SEA_NAME: Record<Sea, string> = { WEST: "서해", SOUTH: "남해", EAST: "동해" };

export const SEA_CHARACTER: Record<Sea, { summary: string; points: string[]; mul: string }> = {
  WEST: {
    summary: "물 차이(조차)가 아주 크고 갯벌·모래 바닥이 넓어요. 물이 탁한 편이에요.",
    points: ["물때가 ‘언제 낚을지’를 가장 크게 좌우 — 들물·썰물에 따라 포인트가 드러나고 잠겨요", "갯벌 고립 주의", "우럭·광어·주꾸미·갑오징어·망둥어"],
    mul: "7물때식(서해 관행)",
  },
  SOUTH: {
    summary: "섬과 암초가 많고 섬 사이 물살이 세요. 따뜻한 해류 영향으로 수온이 높은 편이에요.",
    points: ["물살과 수온이 함께 중요", "갯바위 찌낚시·선상이 발달", "감성돔·벵에돔·참돔·볼락·갈치"],
    mul: "8물때식(남해 관행)",
  },
  EAST: {
    summary: "물 차이가 아주 작고, 수심이 깊고 맑아요. 너울과 수온 변화가 커요.",
    points: ["물때보다 바람·너울·수온이 중요", "여름 냉수대·겨울 북동풍 너울 주의", "가자미·고등어·학꽁치·무늬오징어·오징어"],
    mul: "8물때식이 흔함(설정에서 바꿀 수 있어요)",
  },
};

/** 해역별 관측소 대조 조차(m) — 이 서비스의 조석 추정용 근사값 */
export function tidalRangeBySea(): Record<Sea, { name: string; m: number }[]> {
  const out: Record<Sea, Map<string, number>> = { WEST: new Map(), SOUTH: new Map(), EAST: new Map() };
  for (const s of SPOTS) out[s.sea].set(s.station.name, s.station.springRangeM);
  const toList = (m: Map<string, number>) => [...m].map(([name, v]) => ({ name, m: v })).sort((a, b) => b.m - a.m);
  return { WEST: toList(out.WEST), SOUTH: toList(out.SOUTH), EAST: toList(out.EAST) };
}

const W_LABEL: [keyof Weights, string][] = [
  ["tide", "물때·물살"],
  ["wind", "바람"],
  ["wave", "파도"],
  ["temp", "수온"],
  ["spot", "장소 궁합"],
  ["pressure", "기압"],
];

/** 점수 엔진이 해역별로 각 요소에 주는 비중(%) — 합 100 */
export function seaImportance(sea: Sea): { key: keyof Weights; label: string; pct: number }[] {
  const w = SEA_WEIGHTS[sea];
  const sum = W_LABEL.reduce((a, [k]) => a + w[k], 0);
  return W_LABEL.map(([key, label]) => ({ key, label, pct: Math.round((w[key] / sum) * 100) }));
}

/** '언제 무는가'(시간대 판단)에서 물 흐름이 차지하는 비중(%) — 나머지는 해·달(빛) */
export const tideTimingPct = (sea: Sea) => Math.round(SEA_TIDE_TIMING[sea] * 100);
