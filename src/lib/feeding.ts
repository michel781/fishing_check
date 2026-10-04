import { FEEDING, FOOD, type Feeding, type FoodKind } from "@/data/feeding";
import { SPECIES } from "@/data/species";
import { lightFit, tempFit } from "@/lib/engine/score";
import type { Species } from "@/lib/types";

/**
 * 먹이 습성 화면 계산 (순수 함수, 테스트 대상).
 * 시간대·수온 반응은 점수 엔진과 같은 식(lightFit·tempFit)을 써서 화면과 점수가 어긋나지 않게 한다.
 */

const HOUR = 3600e3;

export function dietRows(f: Feeding): { kind: FoodKind; share: number }[] {
  return (Object.entries(f.diet) as [FoodKind, number][])
    .filter(([, v]) => v > 0)
    .map(([kind, share]) => ({ kind, share }))
    .sort((a, b) => b.share - a.share);
}

/** 미끼 이름 → 흉내 내는 자연 먹이 (밑밥처럼 먹이가 아닌 것은 따로). 크릴은 새우이자 플랑크톤이라 둘 다 센다 */
const BAIT_RULES: [RegExp, FoodKind[], string][] = [
  [/갯지렁이|혼무시/, ["worm"], "갯지렁이 그대로"],
  [/에기|애기|타이라바/, ["crustacean"], "도망치는 새우·게 흉내"],
  [/크릴/, ["crustacean", "plankton"], "작은 새우(크릴) 그대로"],
  [/새우/, ["crustacean"], "새우 그대로"],
  [/게/, ["crustacean"], "게 그대로"],
  [/오징어살/, ["cephalopod"], "오징어 살"],
  [/오징어 뿔/, ["fish"], "불빛 아래 작은 먹이 흉내"],
  [/성게|소라|조개/, ["shellfish"], "껍데기 있는 먹이 그대로"],
  [/미꾸라지|꽁치|전어|멸치|고등어살/, ["fish"], "물고기 살·통마리"],
  [/미노우|메탈지그|웜|섀드/, ["fish"], "헤엄치는 작은 물고기 흉내"],
  [/식빵|빵|떡밥/, ["detritus"], "부드러운 유기물 흉내"],
];

export interface BaitFit {
  bait: string;
  /** 가장 비중이 큰 흉내 먹이 */
  kind: FoodKind | null;
  how: string;
  /** 그 먹이가 자연 먹이에서 차지하는 비중(%) */
  share: number;
  fit: "잘 맞음" | "보통" | "약함" | "집어용";
}

export function baitFits(baits: string[], f: Feeding): BaitFit[] {
  return baits.map((bait) => {
    if (/밑밥|집어제/.test(bait)) return { bait, kind: null, how: "물고기를 한곳에 모으는 용도", share: 0, fit: "집어용" as const };
    const rule = BAIT_RULES.find(([re]) => re.test(bait));
    if (!rule) return { bait, kind: null, how: "", share: 0, fit: "보통" as const };
    const kinds = rule[1];
    const share = kinds.reduce((a, k) => a + (f.diet[k] ?? 0), 0);
    const kind = [...kinds].sort((a, b) => (f.diet[b] ?? 0) - (f.diet[a] ?? 0))[0];
    return { bait, kind, how: rule[2], share, fit: share >= 25 ? "잘 맞음" : share >= 10 ? "보통" : "약함" };
  });
}

/** 24시간 먹이 활동 (KST 0~23시, 각 시각 30분 기준). 달빛은 보통(반달)로 가정 */
export function activityByHour(s: Pick<Species, "light">, dayStartMs: number, sunrise: number, sunset: number): number[] {
  return Array.from({ length: 24 }, (_, h) => Math.round(lightFit(s, dayStartMs + (h + 0.5) * HOUR, sunrise, sunset, 0.5) * 100) / 100);
}

/** 수온 0~32℃ 먹이 활동 곡선 */
export function tempCurve(s: Pick<Species, "temp">, from = 0, to = 32, step = 1): { c: number; v: number }[] {
  const out: { c: number; v: number }[] = [];
  for (let c = from; c <= to; c += step) out.push({ c, v: Math.round(tempFit(s, c) * 100) / 100 });
  return out;
}

/** 먹이 구성이 비슷한 어종 (코사인 유사도) */
export function similarDiet(id: string, n = 3): { id: string; name: string; sim: number; shared: FoodKind }[] {
  const me = FEEDING[id];
  if (!me) return [];
  const kinds = Object.keys(FOOD) as FoodKind[];
  const vec = (f: Feeding) => kinds.map((k) => f.diet[k] ?? 0);
  const a = vec(me);
  const norm = (v: number[]) => Math.sqrt(v.reduce((x, y) => x + y * y, 0)) || 1;
  return SPECIES.filter((s) => s.id !== id && FEEDING[s.id])
    .map((s) => {
      const b = vec(FEEDING[s.id]);
      const sim = a.reduce((x, v, i) => x + v * b[i], 0) / (norm(a) * norm(b));
      // 둘 다 많이 먹는 먹이
      const shared = kinds.reduce((best, k, i) => (Math.min(a[i], b[i]) > Math.min(a[kinds.indexOf(best)], b[kinds.indexOf(best)]) ? k : best), kinds[0]);
      return { id: s.id, name: s.name, sim: Math.round(sim * 100) / 100, shared };
    })
    .sort((x, y) => y.sim - x.sim)
    .slice(0, n);
}

/** 활동 값 → 말 */
export const activityLabel = (v: number) => (v >= 0.8 ? "왕성" : v >= 0.55 ? "보통" : v >= 0.3 ? "약함" : "쉼");
