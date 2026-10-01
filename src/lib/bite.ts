import type { HourScore } from "@/lib/types";

/**
 * 어종별 입질 지수 타임라인 (순수 함수, 테스트 대상).
 * 한 포인트의 어종별 시간 점수(0~100)를 시간축으로 펼쳐, 화면에서 시간을 옮기면 그 시각의 어종 순위를 보여준다.
 * 점수는 물때·바람·파도·수온·빛·어종 습성으로 계산한 '지수'이며 실제 확률을 잰 값은 아니다.
 */

export type BiteLevel = "좋음" | "보통" | "나쁨" | "희박";

/** 점수 → 4단계 말 (70·50·30 기준) */
export function biteLevel(score: number): BiteLevel {
  return score >= 70 ? "좋음" : score >= 50 ? "보통" : score >= 30 ? "나쁨" : "희박";
}

export interface BiteSpecies {
  id: string;
  name: string;
  /** 시간 칸마다 점수 (위험·금어기·배 안 뜨는 시간은 0) */
  scores: number[];
  closed: boolean;
}

export interface BiteTimeline {
  /** 시간 칸 시작 시각 (ISO, 1시간 간격) */
  times: string[];
  /** 시간 칸마다 어종과 무관한 바다 환경 (0~100) — 바람·파도·기압, 위험이면 0 */
  env: number[];
  danger: boolean[];
  species: BiteSpecies[];
}

const HOUR = 3600e3;

/**
 * fromMs(정시로 내림)부터 hours 시간 동안의 타임라인.
 * input: 어종별 시간 점수 (같은 포인트라 시간 칸이 같다)
 */
export function buildBite(input: { id: string; name: string; closed: boolean; hours: HourScore[] }[], fromMs: number, hours = 48): BiteTimeline {
  const start = Math.floor(fromMs / HOUR) * HOUR;
  const end = start + hours * HOUR;
  const ref = input[0]?.hours ?? [];
  const slots = ref.filter((h) => {
    const t = Date.parse(h.time);
    return t >= start && t < end;
  });
  const times = slots.map((h) => h.time);
  const idx = new Map(times.map((t, i) => [t, i]));
  // 안전 판정은 어종과 무관하지만, 어느 한 어종 계산에서라도 위험이면 위험으로 본다
  const dangerAt = new Set(input.flatMap((s) => s.hours.filter((h) => h.safety === "DANGER").map((h) => h.time)));
  const env = slots.map((h) => {
    if (dangerAt.has(h.time)) return 0;
    // 바람·파도·기압은 어종과 거의 무관한 바다 상태
    const v = (h.sub.wind + h.sub.wave + h.sub.pressure) / 3;
    return Math.round(Math.max(0, Math.min(1, v)) * (h.safety === "CAUTION" ? 85 : 100));
  });
  const danger = slots.map((h) => dangerAt.has(h.time));
  const species = input.map((s) => {
    const scores = new Array<number>(times.length).fill(0);
    for (const h of s.hours) {
      const i = idx.get(h.time);
      if (i != null) scores[i] = s.closed || dangerAt.has(h.time) ? 0 : h.score;
    }
    return { id: s.id, name: s.name, closed: s.closed, scores };
  });
  return { times, env, danger, species };
}

/** 3시간 묶음 환경 (화면의 '환경' 줄) */
export function envBlocks(t: BiteTimeline, size = 3): { from: number; to: number; level: BiteLevel | "위험"; avg: number }[] {
  const out: { from: number; to: number; level: BiteLevel | "위험"; avg: number }[] = [];
  for (let i = 0; i < t.times.length; i += size) {
    const vs = t.env.slice(i, i + size);
    const avg = Math.round(vs.reduce((a, v) => a + v, 0) / vs.length);
    const anyDanger = t.danger.slice(i, i + size).some(Boolean);
    out.push({ from: i, to: Math.min(i + size, t.times.length), level: anyDanger ? "위험" : biteLevel(avg), avg });
  }
  return out;
}

/** 선택한 시간 칸의 어종 순위 (점수 높은 순, 같으면 이름순) */
export function rankAt(t: BiteTimeline, i: number, by: "score" | "name" = "score") {
  const rows = t.species.map((s) => ({ id: s.id, name: s.name, closed: s.closed, score: s.scores[i] ?? 0 }));
  return rows.sort((a, b) => (by === "name" ? a.name.localeCompare(b.name, "ko") : b.score - a.score || a.name.localeCompare(b.name, "ko")));
}
