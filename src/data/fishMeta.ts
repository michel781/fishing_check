import type { Species } from "@/lib/types";
import { MORE_META } from "./moreSpecies";

/** 어종 목록·상세 화면용 보조 정보 (난이도·인기 순위·크기) */
export const FISH_META: Record<string, { level: "초보" | "중급" | "고급"; popular: number; size: string }> = {
  rockfish: { level: "초보", popular: 1, size: "20~40cm" },
  webfoot: { level: "초보", popular: 3, size: "10~20cm" },
  flatfish: { level: "중급", popular: 4, size: "35~60cm" },
  blackporgy: { level: "고급", popular: 5, size: "25~45cm" },
  mackerel: { level: "초보", popular: 6, size: "20~35cm" },
  cuttlefish: { level: "초보", popular: 9, size: "15~30cm" },
  "squid-bigfin": { level: "중급", popular: 10, size: "20~40cm" },
  halfbeak: { level: "초보", popular: 11, size: "20~35cm" },
  bolak: { level: "초보", popular: 12, size: "15~25cm" },
  righteye: { level: "초보", popular: 15, size: "20~35cm" },
  greenling: { level: "초보", popular: 18, size: "20~35cm" },
  redseabream: { level: "고급", popular: 22, size: "30~60cm" },
  ...MORE_META,
};

export const metaOf = (id: string) => FISH_META[id] ?? { level: "중급" as const, popular: 99, size: "-" };

export const SEASONS = [
  { id: "spring", label: "봄", months: [3, 4, 5] },
  { id: "summer", label: "여름", months: [6, 7, 8] },
  { id: "autumn", label: "가을", months: [9, 10, 11] },
  { id: "winter", label: "겨울", months: [12, 1, 2] },
] as const;

/** 시즌 점수 0.7 이상인 달이 있는 계절 */
export function seasonIds(s: Species): string[] {
  return SEASONS.filter((se) => se.months.some((m) => s.season[m - 1] >= 0.7)).map((se) => se.id);
}

export function seasonLabel(s: Species): string {
  const ids = seasonIds(s);
  if (ids.length === 4) return "사계절";
  if (!ids.length) return "-";
  return SEASONS.filter((se) => ids.includes(se.id)).map((se) => se.label).join("·");
}

/** 잘 무는 시간대 */
export function activeTime(s: Species): string {
  const out: string[] = [];
  if (s.light.dawnDusk >= 0.7) out.push("새벽·해질녘");
  if (s.light.day >= 0.7) out.push("낮");
  if (s.light.night >= 0.7) out.push("밤");
  return out.length ? out.join(" · ") : "새벽·해질녘";
}
