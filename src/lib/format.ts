import type { DaySummary, Grade } from "@/lib/types";

const KST = 9 * 3600 * 1000;
const WD = ["일", "월", "화", "수", "목", "금", "토"];

export function kstHM(iso: string): string {
  return new Date(Date.parse(iso) + KST).toISOString().slice(11, 16);
}

export function kstHour(iso: string): number {
  return new Date(Date.parse(iso) + KST).getUTCHours();
}

/** "9/28(월)" */
export function dateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00+09:00`);
  const k = new Date(d.getTime() + KST);
  return `${k.getUTCMonth() + 1}/${k.getUTCDate()}(${WD[k.getUTCDay()]})`;
}

export function relativeDay(date: string, today: string): string {
  const diff = Math.round((Date.parse(date) - Date.parse(today)) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === 2) return "모레";
  return dateLabel(date);
}

const DIRS = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동", "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
export function dirLabel(deg: number | null): string {
  if (deg == null) return "-";
  return DIRS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

export const VERDICT_LABEL: Record<DaySummary["verdict"], string> = {
  GO: "가기 좋아요",
  OK: "괜찮아요",
  SKIP: "별로예요",
  DANGER: "위험해요 · 가지 마세요",
};

/** 좁은 칸용 짧은 판정 */
export const VERDICT_SHORT: Record<DaySummary["verdict"], string> = {
  GO: "좋아요",
  OK: "괜찮음",
  SKIP: "별로",
  DANGER: "위험",
};

export const GRADE_ICON: Record<Grade, string> = {
  BEST: "◎",
  GOOD: "○",
  FAIR: "△",
  POOR: "▽",
  BAD: "×",
  DANGER: "⚠",
};

export function fmt(v: number | null | undefined, digits = 1, unit = ""): string {
  if (v == null || !Number.isFinite(v)) return "-";
  return `${v.toFixed(digits)}${unit}`;
}
