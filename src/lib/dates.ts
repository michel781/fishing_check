import { kstDateString } from "@/lib/engine/astro";

const DAY = 86400e3;

/** 다가오는 주말(토·일). 오늘이 토요일이면 오늘·내일, 일요일이면 오늘만 */
export function weekendDates(today: string): string[] {
  const d = new Date(`${today}T12:00:00+09:00`);
  const dow = new Date(d.getTime() + 9 * 3600e3).getUTCDay();
  const add = (n: number) => kstDateString(new Date(d.getTime() + n * DAY));
  if (dow === 6) return [today, add(1)];
  if (dow === 0) return [today];
  return [add(6 - dow), add(7 - dow)];
}

export function addDays(date: string, n: number): string {
  return kstDateString(new Date(Date.parse(`${date}T12:00:00+09:00`) + n * DAY));
}
