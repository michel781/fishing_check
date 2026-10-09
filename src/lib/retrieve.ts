import type { RetrievePlan, Step } from "@/data/retrieve";
import { tempFit } from "@/lib/engine/score";
import type { Species } from "@/lib/types";

/**
 * 릴 감기 계산 (순수 함수, 테스트 대상).
 *  - 한 주기 시간, 감는 속도(바퀴/초 → cm/초)
 *  - 오늘 조건(수온·밤·물살·바람)에 맞춘 보정: 수온 반응은 점수 엔진과 같은 tempFit을 쓴다
 */

export const mid = (r: [number, number]) => (r[0] + r[1]) / 2;

export function cycleSec(plan: RetrievePlan): [number, number] {
  return plan.cycle.reduce<[number, number]>((a, s) => [a[0] + s.sec[0], a[1] + s.sec[1]], [0, 0]);
}

/** 주기 안에서 실제로 핸들을 계속 돌리는 동작의 속도 (없으면 null) */
export function activeTps(plan: RetrievePlan): [number, number] | null {
  const s = plan.cycle.find((x) => x.tps);
  return s?.tps ?? null;
}

/** 핸들 1회전당 감기는 길이(cm) × 회전수 → cm/초 */
export const cmPerSec = (tps: number, cmPerTurn: number) => Math.round(tps * cmPerTurn);

/** 한 주기 동안 감는 줄 길이(m) — 감기·끌기·저킹·흘림의 회전 수 합 */
export function metersPerCycle(plan: RetrievePlan, cmPerTurn: number): [number, number] {
  let lo = 0;
  let hi = 0;
  for (const s of plan.cycle) {
    if (s.turns) {
      lo += s.turns[0];
      hi += s.turns[1];
    } else if (s.tps) {
      lo += s.tps[0] * s.sec[0];
      hi += s.tps[1] * s.sec[1];
    }
  }
  return [Math.round((lo * cmPerTurn) / 10) / 10, Math.round((hi * cmPerTurn) / 10) / 10];
}

export interface Conditions {
  seaTempC?: number | null;
  night?: boolean;
  /** 지금 물살이 그날 가장 센 축에 드는가 (물 높이 표의 '물살 셈') */
  strongCurrent?: boolean;
  windMs?: number | null;
}

export interface Adjustment {
  /** 감는 속도 배수 */
  speed: number;
  /** 멈춤·기다림 시간 배수 */
  pause: number;
  reasons: { text: string; effect: -1 | 0 | 1 }[];
}

export function adjustFor(plan: RetrievePlan, species: Pick<Species, "name" | "temp" | "light">, c: Conditions): Adjustment {
  let speed = 1;
  let pause = 1;
  const reasons: Adjustment["reasons"] = [];
  if (c.seaTempC != null) {
    const T = c.seaTempC;
    const f = tempFit(species, T);
    if (f < 0.5) {
      speed *= 0.75;
      pause *= 1.5;
      reasons.push({
        text: `물 온도 ${T.toFixed(1)}℃ — ${species.name}에게 ${T < species.temp.opt ? "차가워서" : "따뜻해서"} 덜 움직여요. 평소보다 느리게, 멈춤은 길게.`,
        effect: -1,
      });
    } else if (f >= 0.8) {
      reasons.push({ text: `물 온도 ${T.toFixed(1)}℃ — 딱 좋은 수온이라 기본 속도 그대로.`, effect: 1 });
    } else {
      reasons.push({ text: `물 온도 ${T.toFixed(1)}℃ — 보통이라 기본 속도에서 시작해 반응을 보며 조절.`, effect: 0 });
    }
  }
  if (c.night && plan.lure && species.light.night < 0.8) {
    speed *= 0.85;
    reasons.push({ text: "밤이라 루어를 보기 어려워요. 조금 느리게 감아 따라올 시간을 줘요.", effect: -1 });
  }
  if (c.strongCurrent) {
    if (plan.lure) reasons.push({ text: "물살이 세요. 물살을 거슬러 감을 땐 물속 속도가 빨라지니 핸들을 느리게, 물살을 따라 감을 땐 빠르게.", effect: 0 });
    if (plan.bottom) {
      pause *= 0.7;
      reasons.push({ text: "물살이 세서 채비가 밀려요. 바닥을 더 자주 확인하고 기다리는 시간을 줄여요.", effect: 0 });
    }
    if (plan.float) {
      pause *= 0.7;
      reasons.push({ text: "물살이 세서 찌가 밑밥 띠를 빨리 벗어나요. 걷어서 다시 던지는 주기를 짧게.", effect: 0 });
    }
  }
  if (plan.float && (c.windMs ?? 0) >= 6) {
    reasons.push({ text: `바람 ${c.windMs!.toFixed(0)}m/s — 줄이 바람에 밀려요. 늘어진 줄을 더 자주 감아 찌와 일직선을 유지해요.`, effect: 0 });
  }
  return { speed: Math.round(speed * 100) / 100, pause: Math.round(pause * 100) / 100, reasons };
}

const PAUSE_ACTS = new Set(["멈춤", "기다림", "흘림"]);

/** 보정을 적용한 한 주기 (따라하기용: 중간값 초) */
export function playSteps(plan: RetrievePlan, adj: Pick<Adjustment, "speed" | "pause"> = { speed: 1, pause: 1 }): (Step & { secMid: number; tpsMid: number | null })[] {
  return plan.cycle.map((s) => {
    const base = mid(s.sec);
    const secMid = Math.round((PAUSE_ACTS.has(s.act) ? base * adj.pause : base) * 10) / 10;
    const tpsMid = s.tps ? Math.round(mid(s.tps) * adj.speed * 100) / 100 : null;
    return { ...s, secMid, tpsMid };
  });
}
