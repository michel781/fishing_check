import { bestWindow } from "@/lib/live";
import type { HourScore, Sea, Spot, SpotType } from "@/lib/types";

/**
 * 하루 시간대별 추천 (순수 함수, 테스트 대상).
 * 하루를 낚시 활동 기준 6개 시간대로 나누고, 시간대마다 "그 안에서 가장 좋은 연속 2시간"이 높은 포인트·어종 순으로 보여준다.
 * 위험(강풍·파도·간조 고립)이나 금어기·배 안 뜨는 시간은 점수 계산에서 빠진다 (bestWindow 가 available 시간만 씀).
 */

export interface Slot {
  id: string;
  label: string;
  /** 한국시각 시작 시 (포함) */
  from: number;
  /** 한국시각 끝 시 (미포함). 다음 날로 넘어가면 24 이상 */
  to: number;
  hint: string;
}

export const SLOTS: Slot[] = [
  { id: "dawn", label: "새벽", from: 4, to: 7, hint: "해 뜰 무렵. 밤새 굶은 물고기가 먹이를 찾아 입질이 가장 활발한 때가 많아요." },
  { id: "morning", label: "오전", from: 7, to: 11, hint: "물빛이 밝아져 루어·찌낚시가 좋아요. 들물이 겹치면 더 좋아요." },
  { id: "midday", label: "한낮", from: 11, to: 15, hint: "해가 높아 연안 물고기는 깊은 곳으로 숨어요. 선상·깊은 방파제 끝이 유리해요." },
  { id: "afternoon", label: "오후", from: 15, to: 19, hint: "해 질 녘이 가까워질수록 입질이 살아나요. 피딩타임을 노리세요." },
  { id: "evening", label: "저녁", from: 19, to: 23, hint: "밤 어종(붕장어·볼락·갈치)의 시간. 헤드랜턴·구명조끼 필수." },
  { id: "night", label: "심야", from: 23, to: 28, hint: "깊은 밤. 조용한 내항·선착장에서 원투로 기다리는 낚시가 맞아요." },
];

const HOUR = 3600e3;

/** 날짜(YYYY-MM-DD, KST)의 시간대 구간 (ms) */
export function slotRange(date: string, slot: Slot): { from: number; to: number } {
  const midnight = Date.parse(`${date}T00:00:00+09:00`);
  return { from: midnight + slot.from * HOUR, to: midnight + slot.to * HOUR };
}

/** 한국시각 시(0~23)가 속한 시간대 (새벽 0~4시는 전날 '심야') */
export function slotOfHour(kstHour: number): Slot {
  const h = kstHour < 4 ? kstHour + 24 : kstHour;
  return SLOTS.find((s) => h >= s.from && h < s.to) ?? SLOTS[0];
}

export interface HourlyCandidate {
  spot: Pick<Spot, "id" | "name" | "area" | "sea" | "type">;
  species: { id: string; name: string; hours: HourScore[] }[];
}

export interface HourlyEntry {
  spotId: string;
  spotName: string;
  area: string;
  sea: Sea;
  type: SpotType;
  speciesId: string;
  speciesName: string;
  start: string;
  end: string;
  avg: number;
  /** 그 2시간 중 가장 좋은 시간의 좋은 이유 (최대 2개) */
  reasons: string[];
}

/**
 * 시간대 하나의 추천 목록. 포인트마다 가장 좋은 어종 하나만(같은 곳이 여러 번 나오지 않게), 점수 높은 순.
 * nowMs 가 주어지면 이미 지난 시간은 뺀다 (오늘).
 */
export function slotTop(cands: HourlyCandidate[], range: { from: number; to: number }, limit = 8, nowMs?: number): HourlyEntry[] {
  const from = nowMs != null ? Math.max(range.from, Math.floor(nowMs / HOUR) * HOUR) : range.from;
  if (range.to - from < 2 * HOUR) return [];
  const out: HourlyEntry[] = [];
  for (const c of cands) {
    let best: HourlyEntry | null = null;
    for (const sp of c.species) {
      const w = bestWindow(sp.hours, from, range.to, 2);
      if (!w || (best && w.avg <= best.avg)) continue;
      const peak = sp.hours
        .filter((h) => Date.parse(h.time) >= Date.parse(w.start) && Date.parse(h.time) < Date.parse(w.end))
        .sort((a, b) => b.score - a.score)[0];
      best = {
        spotId: c.spot.id,
        spotName: c.spot.name,
        area: c.spot.area,
        sea: c.spot.sea,
        type: c.spot.type,
        speciesId: sp.id,
        speciesName: sp.name,
        start: w.start,
        end: w.end,
        avg: w.avg,
        reasons: (peak?.reasons ?? []).filter((r) => r.effect > 0).map((r) => r.label).slice(0, 2),
      };
    }
    if (best) out.push(best);
  }
  return out.sort((a, b) => b.avg - a.avg).slice(0, limit);
}

/** 목록에서 자주 나오는 어종 (이 시간대에 강한 어종) */
export function strongSpecies(entries: HourlyEntry[], n = 4): { id: string; name: string; count: number }[] {
  const m = new Map<string, { id: string; name: string; count: number }>();
  for (const e of entries) {
    const x = m.get(e.speciesId) ?? { id: e.speciesId, name: e.speciesName, count: 0 };
    x.count++;
    m.set(e.speciesId, x);
  }
  return [...m.values()].sort((a, b) => b.count - a.count).slice(0, n);
}
