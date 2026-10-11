import { getRigSpec } from "./rigSpecs";

/**
 * 바늘 고르기 (초보용).
 * - 바늘 규격 숫자는 어종 화면의 '실제 치수'(rigSpecs)를 그대로 가져와 한 곳에서만 관리한다.
 * - 여기서는 '왜 그 크기·모양인가'(입 크기·모양, 미끼, 낚시 방법, 줄 굵기 균형, 이빨·입 단단함)를 붙인다.
 * - 호수는 바늘 계열(이름)마다 기준이 달라 서로 숫자로 비교하지 않는다.
 */

export type Mouth = "작음" | "보통" | "큼";
export type HookKind = "생미끼 바늘" | "루어 바늘" | "갈고리(에기·뿔)";

export interface HookInfo {
  mouth: Mouth;
  kind: HookKind;
  /** 왜 이 크기·모양인가 */
  why: string;
  /** 낚시 방법(채비)과의 관계 */
  method: string;
}

export const HOOKS: Record<string, HookInfo> = {
  rockfish: { mouth: "큼", kind: "생미끼 바늘", why: "입이 크고 오징어살·미꾸라지처럼 큰 미끼를 써요. 암초에서 힘으로 끌어내야 해서 굵고 큰 우럭 전용 바늘을 써요.", method: "선상 바닥 채비 — 굵은 합사 원줄과 짝" },
  greenling: { mouth: "보통", kind: "생미끼 바늘", why: "입 크기가 보통이고 갯지렁이를 한 마리 꿰기 좋은 크기예요. 바닥 원투라 던질 때 미끼가 떨어지지 않아야 해요.", method: "바닥 가지채비 — 목줄 2~3호와 짝" },
  flatfish: { mouth: "큼", kind: "루어 바늘", why: "입이 아주 크고 이빨이 있어 큰 웜을 다는 서양식 큰 바늘(/0 표기)을 써요.", method: "다운샷 — 굵은 카본 목줄과 짝" },
  blackporgy: { mouth: "보통", kind: "생미끼 바늘", why: "입은 작지 않지만 경계심이 커요. 가늘고 가벼운 바늘이어야 크릴이 밑밥처럼 자연스럽게 가라앉아요.", method: "반유동 찌 — 가는 목줄(1.5~2호)과 짝, 무거운 바늘은 찌 부력을 깨요" },
  redseabream: { mouth: "보통", kind: "루어 바늘", why: "스커트 사이에 작은 바늘 2개를 숨겨, 따라오며 무는 참돔의 입 가장자리에 걸리게 해요.", method: "타이라바 — 전용 교체형 바늘" },
  webfoot: { mouth: "작음", kind: "갈고리(에기·뿔)", why: "다리로 감싸는 주꾸미를 미늘 없는 우산살 갈고리로 걸어요. 바늘 크기 대신 에기 크기(호)로 골라요.", method: "봉돌 + 에기 — 일정하게 감아야 빠지지 않아요" },
  cuttlefish: { mouth: "보통", kind: "갈고리(에기·뿔)", why: "촉완으로 감싸는 갑오징어를 미늘 없는 갈고리로 걸어요. 주꾸미보다 한 단계 큰 에기를 써요.", method: "봉돌 + 에기" },
  halfbeak: { mouth: "작음", kind: "생미끼 바늘", why: "부리 끝의 입이 아주 작아서 아주 작은 바늘에 크릴을 잘게 달아야 삼켜요.", method: "막대찌 — 가는 목줄과 짝" },
  mackerel: { mouth: "보통", kind: "생미끼 바늘", why: "떼로 경쟁하며 덥석 물어 큰 바늘이 필요 없어요. 반짝이가 달린 카드 바늘 여러 개를 써요.", method: "카드채비 — 바늘 크기는 카드 포장에 적힌 호수" },
  bolak: { mouth: "보통", kind: "루어 바늘", why: "먹이가 작은 플랑크톤·새우라 작은 웜과 바늘을 써요. 바늘과 봉돌이 붙은 지그헤드는 무게(g)로 골라요.", method: "지그헤드 — 아주 가는 원줄과 짝" },
  righteye: { mouth: "작음", kind: "생미끼 바늘", why: "입이 작고 갯지렁이를 빨아들이듯 먹어요. 갯지렁이를 길게 꿰기 좋은 가자미 전용 바늘을 써요.", method: "원투 가지채비 — 목줄 3호와 짝" },
  "squid-bigfin": { mouth: "큼", kind: "갈고리(에기·뿔)", why: "다리로 감싸 안는 무늬오징어를 미늘 없는 갈고리로 걸어요. 에기 크기(호)와 가라앉는 속도로 골라요.", method: "에깅 — 가는 합사 + 쇼크리더" },
  hairtail: { mouth: "큼", kind: "생미끼 바늘", why: "이빨이 날카로워 줄을 끊어요. 축이 긴 갈치 바늘과 와이어(또는 굵은) 목줄을 함께 써요.", method: "반유동 찌(밤) — 와이어 목줄과 짝" },
  seabass: { mouth: "큼", kind: "루어 바늘", why: "루어에 달린 세발바늘을 그대로 써요. 입이 크고 바늘털이를 해서 바늘이 녹슬거나 무뎌지면 바로 바꿔요.", method: "미노우 — 합사 + 쇼크리더" },
  opaleye: { mouth: "작음", kind: "생미끼 바늘", why: "입이 작고 경계심이 커요. 작고 가벼운 바늘에 크릴 한 마리를 달아 밑밥과 같이 가라앉게 해요.", method: "전유동 찌 — 가는 목줄(1.5호)과 짝" },
  spanishmackerel: { mouth: "큼", kind: "루어 바늘", why: "이빨이 날카로워 굵은 쇼크리더를 쓰고, 메탈지그에 달린 바늘로 빠르게 쫓는 입에 걸어요.", method: "메탈지그 캐스팅 — 굵은 쇼크리더와 짝" },
  yellowtail: { mouth: "큼", kind: "루어 바늘", why: "힘이 아주 세서 굵은 어시스트훅과 솔리드링을 써요. 바늘이 펴지거나 부러지지 않는 것이 먼저예요.", method: "선상 지깅 — 굵은 합사·쇼크리더와 짝" },
  mullet: { mouth: "작음", kind: "생미끼 바늘", why: "입이 작고 펄을 걸러 먹어요. 식빵·떡밥 같은 부드러운 미끼가 잘 붙는 작은 바늘을 써요.", method: "막대찌 — 목줄 1.2~1.5호와 짝" },
  gizzardshad: { mouth: "작음", kind: "생미끼 바늘", why: "입이 작아 작은 바늘이 달린 카드채비를 써요.", method: "카드채비" },
  dodari: { mouth: "작음", kind: "생미끼 바늘", why: "가자미와 같이 입이 작아 가자미·도다리 전용 바늘에 갯지렁이를 길게 꿰어요.", method: "원투 가지채비 — 목줄 3호와 짝" },
  octopus: { mouth: "큼", kind: "갈고리(에기·뿔)", why: "힘이 세고 바닥에 달라붙어서 크고 튼튼한 문어 에기 갈고리를 써요.", method: "봉돌 + 문어 에기 — 굵은 합사와 짝" },
  conger: { mouth: "보통", kind: "생미끼 바늘", why: "고등어살 같은 큰 미끼를 달고, 깊이 삼켜도 빼기 쉽도록 붕장어 전용 바늘을 써요.", method: "원투 — 목줄 4~5호와 짝" },
  rockbream: { mouth: "큼", kind: "생미끼 바늘", why: "성게를 깨 먹을 만큼 입과 이빨이 단단해요. 굵고 큰 돌돔 바늘과 와이어 목줄을 써요.", method: "처넣기(유동 봉돌) — 아주 굵은 원줄과 짝" },
  squid: { mouth: "보통", kind: "갈고리(에기·뿔)", why: "오징어 뿔 끝의 미늘 없는 갈고리로 걸어요. 감는 속도를 바꾸거나 멈추면 빠져요.", method: "오징어 뿔채비(선상)" },
  goby: { mouth: "보통", kind: "생미끼 바늘", why: "먹성이 좋아 갯지렁이를 짧게 꿴 보통 크기 바늘이면 돼요.", method: "원투·민장대 가지채비" },
};

const HOOK_PART = /바늘|훅|지그헤드|에기|뿔|카드채비|루어|메탈지그/;

/** 어종 화면 '실제 치수'에서 바늘(또는 루어·에기) 규격 줄을 가져온다 */
export function hookSpec(speciesId: string): { name: string; spec: string }[] {
  const parts = getRigSpec(speciesId)?.parts ?? [];
  return parts.filter((p) => HOOK_PART.test(p.name)).map((p) => ({ name: p.name, spec: p.spec }));
}

/** 같은 채비의 원줄·목줄(또는 쇼크리더) — 줄 굵기와 바늘의 균형을 보여주기 위해 */
export function lineSpec(speciesId: string): { name: string; spec: string }[] {
  const parts = getRigSpec(speciesId)?.parts ?? [];
  return parts.filter((p) => /원줄|목줄|쇼크리더/.test(p.name)).map((p) => ({ name: p.name, spec: p.spec }));
}

/** 바늘 크기를 정하는 이유 */
export const SIZE_RULES: { title: string; desc: string; example: string }[] = [
  { title: "입 크기·모양", desc: "입보다 큰 바늘은 삼키지 못하고, 너무 작으면 걸려도 쉽게 빠져요.", example: "학꽁치·벵에돔(작은 입) → 작은 바늘 / 우럭·광어(큰 입) → 큰 바늘" },
  { title: "미끼 크기", desc: "미끼가 바늘을 덮고 자연스러워야 해요. 큰 미끼엔 큰 바늘, 작은 미끼엔 작은 바늘.", example: "크릴 한 마리 → 작은 바늘 / 오징어살·고등어살 → 큰 바늘" },
  { title: "낚시 방법", desc: "찌낚시는 미끼가 자연스럽게 가라앉아야 해서 가볍고 가는 바늘, 원투·선상은 미끼가 떨어지지 않고 강하게 끌어내야 해서 튼튼한 바늘을 써요.", example: "감성돔 찌 → 가는 바늘 / 우럭 선상 → 굵은 바늘" },
  { title: "줄 굵기와 균형", desc: "가는 목줄에 굵고 큰 바늘을 달면 챔질할 때 바늘이 박히기 전에 줄이 먼저 끊어지거나 미끼가 부자연스러워요. 바늘·목줄·낚싯대를 한 세트로 맞춰요.", example: "목줄 1.5호 ↔ 작은 바늘 / 원줄 8~12호 ↔ 큰 돌돔 바늘" },
  { title: "이빨·입 단단함", desc: "이빨이 날카로우면 축이 긴 바늘과 와이어·굵은 목줄을, 입이 단단하면 굵은 바늘을 써요.", example: "갈치 → 긴 축 + 와이어 / 돌돔 → 굵은 바늘 + 와이어" },
  { title: "그날 활성도", desc: "입질이 약하고 예민한 날은 한 단계 작게, 활성이 좋고 잡어가 많으면 한 단계 크게 바꿔 봐요.", example: "같은 감성돔이라도 겨울 저수온엔 작게" },
];
