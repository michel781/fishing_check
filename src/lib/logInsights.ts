import type { LogEntry } from "@/lib/localStore";

/** 조과 기록에서 "나에게 잘 맞는 어종·시간대·포인트"를 뽑는다 (순수 함수) */
export const SLOTS = [
  { id: "dawn", label: "새벽", from: 4, to: 7 },
  { id: "morning", label: "아침", from: 7, to: 11 },
  { id: "day", label: "낮", from: 11, to: 16 },
  { id: "dusk", label: "해질녘", from: 16, to: 20 },
  { id: "night", label: "밤", from: 20, to: 28 },
] as const;

export function slotOf(iso: string): (typeof SLOTS)[number] {
  const h = (new Date(iso).getUTCHours() + 9) % 24;
  const hh = h < 4 ? h + 24 : h;
  return SLOTS.find((s) => hh >= s.from && hh < s.to) ?? SLOTS[4];
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);

export interface Insights {
  trips: number;
  topSpecies: { id: string; count: number } | null;
  bestSlot: { label: string; avg: number; trips: number } | null;
  topSpot: { id: string; count: number } | null;
  golden: { inAvg: number; outAvg: number; inTrips: number; outTrips: number } | null;
  zeroTrips: number;
}

export function insights(entries: LogEntry[]): Insights {
  const sum = (key: (e: LogEntry) => string) => {
    const m = new Map<string, number>();
    for (const e of entries) m.set(key(e), (m.get(key(e)) ?? 0) + e.count);
    const top = [...m].sort((a, b) => b[1] - a[1])[0];
    return top && top[1] > 0 ? { id: top[0], count: top[1] } : null;
  };
  const bySlot = new Map<string, number[]>();
  for (const e of entries) {
    const s = slotOf(e.time).label;
    bySlot.set(s, [...(bySlot.get(s) ?? []), e.count]);
  }
  const slot = [...bySlot].map(([label, xs]) => ({ label, avg: avg(xs), trips: xs.length })).sort((a, b) => b.avg - a.avg || b.trips - a.trips)[0];
  const pred = entries.filter((e) => e.predicted);
  const inG = pred.filter((e) => e.predicted!.inGolden).map((e) => e.count);
  const outG = pred.filter((e) => !e.predicted!.inGolden).map((e) => e.count);
  return {
    trips: entries.length,
    topSpecies: sum((e) => e.speciesId),
    bestSlot: slot && slot.avg > 0 ? slot : null,
    topSpot: sum((e) => e.spotId),
    golden: inG.length && outG.length ? { inAvg: avg(inG), outAvg: avg(outG), inTrips: inG.length, outTrips: outG.length } : null,
    zeroTrips: entries.filter((e) => e.count === 0).length,
  };
}
