/**
 * 캐스팅·채비 동작 애니메이션 대본.
 * pose(t) 는 t초일 때 장면의 모든 위치를 돌려주는 순수 함수 → 그리기는 CastingVideo 가 한다.
 * 좌표계: 400 × 260 (SVG viewBox)
 */
import type { Motion } from "@/data/rigSpecs";

export type RigShape = "bottom" | "downshot" | "egi-boat" | "tairaba" | "float" | "jig" | "egi" | "sabiki";
export type FishShape = "fish" | "flat" | "octopus" | "squid";

export interface P {
  x: number;
  y: number;
}

export interface Pose {
  /** 낚싯대 각도(도, 0=오른쪽 수평, +위) */
  rod: number;
  /** 대 휨 0~1 */
  bend: number;
  reeling: boolean;
  /** 원줄 끝(봉돌·루어·찌) — null 이면 줄 없음 */
  anchor: P;
  /** 줄 처짐 0~1 */
  sag: number;
  /** 찌낚시: 찌 위치·기울기, 미끼 위치 */
  float?: { x: number; y: number; tilt: number };
  bait?: P;
  /** 에기·루어 기울기(도) */
  lureAngle?: number;
  fish?: { x: number; y: number; flip: boolean; hooked: boolean; scale: number; count?: number };
  splash?: { x: number; r: number; o: number };
  /** 바닥에서 모래가 튀는 효과 */
  puff?: { x: number; y: number; o: number };
  /** 치수선 (실제 높이 표시) */
  marks?: { x: number; y1: number; y2: number; label: string; side?: "l" | "r" }[];
  /** 그림 위 말풍선 */
  callout?: { x: number; y: number; text: string };
  /** 밑밥 구름 */
  chum?: { x: number; y: number; o: number };
  /** 날아간 궤적 (점선) */
  trail?: P[];
}

export interface Phase {
  at: number;
  label: string;
  caption: string;
}

export interface Script {
  scene: "shore" | "boat";
  rig: RigShape;
  fish: FishShape;
  duration: number;
  phases: Phase[];
  pose: (t: number) => Pose;
}

// ───────── 수학 도우미 ─────────
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const easeIn = (p: number) => p * p;
const osc = (t: number, hz: number) => Math.sin(t * Math.PI * 2 * hz);

// ───────── 장면 상수 ─────────
export const SHORE = { ground: 118, water: 140, shoulder: { x: 70, y: 76 }, hands: { x: 82, y: 86 }, rodLen: 78 };
export const BOAT = { water: 112, bed: 244, shoulder: { x: 150, y: 62 }, hands: { x: 164, y: 72 }, rodLen: 78 };
export const shoreBed = (x: number) => 214 + Math.max(0, x - 120) * 0.1;

/** 대 끝 위치 (휨을 반영) */
export function rodTip(scene: "shore" | "boat", rod: number, bend: number): P {
  const h = scene === "shore" ? SHORE.hands : BOAT.hands;
  const L = scene === "shore" ? SHORE.rodLen : BOAT.rodLen;
  const a = ((rod - bend * 22) * Math.PI) / 180;
  return { x: h.x + L * Math.cos(a) * (1 - bend * 0.08), y: h.y - L * Math.sin(a) * (1 - bend * 0.08) };
}

// ───────── 물가에서 던지기 (공통 앞부분) ─────────
interface CastOpts {
  landX: number;
  apex: number;
  flight: number;
}

/** 0~tLand 까지의 던지기 동작. tLand 이후에는 착수 지점만 돌려준다 */
function shoreCast(t: number, o: CastOpts): { rod: number; bend: number; rig: P; flying: boolean; landed: boolean; tLand: number; trail: P[] } {
  const tRel = 2.35;
  const tLand = tRel + o.flight;
  let rod = 55;
  let bend = 0;
  if (t < 1) rod = 55;
  else if (t < 2) rod = lerp(55, 150, ease(seg(t, 1, 2)));
  else if (t < 2.5) {
    const p = seg(t, 2, 2.5);
    rod = lerp(150, 38, easeIn(p));
    bend = Math.sin(Math.PI * p) * 0.9;
  } else rod = lerp(38, 32, seg(t, 2.5, tLand));
  const tip = rodTip("shore", rod, bend);
  const release = (() => {
    const p = seg(tRel, 2, 2.5);
    const r = lerp(150, 38, easeIn(p));
    const tp = rodTip("shore", r, Math.sin(Math.PI * p) * 0.9);
    return { x: tp.x, y: tp.y + 10 };
  })();
  const fly = (u: number): P => ({
    x: lerp(release.x, o.landX, u),
    y: lerp(release.y, SHORE.water, u) - o.apex * 4 * u * (1 - u),
  });
  if (t < tRel) {
    // 대 끝에 매달린 채비: 뒤로 젖힐 땐 뒤쪽으로 늘어진다
    const back = t > 1 && t < 2.35 ? Math.sin(Math.PI * seg(t, 1, 2.35)) * 8 : 0;
    return { rod, bend, rig: { x: tip.x - back, y: tip.y + 24 }, flying: false, landed: false, tLand, trail: [] };
  }
  if (t < tLand) {
    const u = seg(t, tRel, tLand);
    const trail = Array.from({ length: 12 }, (_, i) => fly((u * i) / 11));
    return { rod, bend, rig: fly(u), flying: true, landed: false, tLand, trail };
  }
  return { rod, bend, rig: { x: o.landX, y: SHORE.water }, flying: false, landed: true, tLand, trail: [] };
}

const CAST_PHASES = (tLand: number): Phase[] => [
  { at: 0, label: "준비", caption: "채비를 대 끝에서 30~50cm 늘어뜨리고, 뒤에 사람이 없는지 확인해요." },
  { at: 1, label: "뒤로 젖히기", caption: "대를 머리 뒤로 천천히 넘겨요. 손가락으로 줄을 걸어 잡고 있어요." },
  { at: 2, label: "던지기", caption: "앞으로 힘차게 휘두르다 대가 앞쪽 45° 쯤에서 손가락을 놓아요. 대가 휘었다 펴지며 채비가 날아가요." },
  { at: 2.35, label: "날아가기", caption: "줄이 릴에서 술술 풀리며 채비가 포물선을 그리며 날아가요." },
  { at: tLand, label: "착수", caption: "‘퐁’ 하고 물에 떨어지면 바로 줄이 더 풀리지 않게 릴 베일을 닫아요." },
];

// ───────── 대본 만들기 ─────────
export function makeScript(motion: Motion, dims: Record<string, string>, fish: FishShape): Script {
  switch (motion) {
    case "shore-float":
      return floatScript(dims, fish);
    case "shore-bottom":
    case "shore-surf":
      return bottomCastScript(motion === "shore-surf", dims, fish);
    case "shore-jighead":
      return jigScript(dims, fish);
    case "shore-egi":
      return egiCastScript(dims, fish);
    case "shore-sabiki":
      return sabikiScript(dims, fish);
    case "boat-bottom":
    case "boat-downshot":
    case "boat-egi":
    case "boat-tairaba":
      return boatScript(motion, dims, fish);
  }
}

// ───────── 찌낚시 ─────────
function floatScript(dims: Record<string, string>, fish: FishShape): Script {
  const shallow = !dims.shot; // 학꽁치처럼 얕은 찌낚시
  const o: CastOpts = { landX: shallow ? 210 : 250, apex: shallow ? 50 : 70, flight: 1.6 };
  const tLand = 2.35 + o.flight;
  const depth = shallow ? 26 : shoreBed(o.landX) - SHORE.water - 12;
  const T = { sink: tLand + 0.4, settle: tLand + 3.2, drift: tLand + 5.6, bob: tLand + 6.4, sink2: tLand + 7.2, strike: tLand + 7.9, reel: tLand + 8.5, end: tLand + 11 };
  return {
    scene: "shore",
    rig: "float",
    fish,
    duration: T.end,
    phases: [
      ...CAST_PHASES(tLand),
      { at: T.sink, label: "가라앉기", caption: `찌는 물 위에 남고, 미끼는 찌밑 수심(${dims.stop ?? "정한 깊이"})만큼 가라앉아요. 찌멈춤 매듭이 찌에 닿으면 멈춰요.` },
      { at: T.settle, label: "찌 서기", caption: "미끼가 다 가라앉으면 누워 있던 찌가 똑바로 서요. 채비가 잘 펴졌다는 신호예요." },
      { at: T.drift, label: "흘리기", caption: shallow ? "밑밥을 조금씩 뿌려 고기를 모으고 찌를 지켜봐요." : "밑밥과 함께 찌가 천천히 흘러가게 두고 찌를 계속 봐요." },
      { at: T.bob, label: "입질", caption: "찌가 까딱까딱… 고기가 미끼를 건드리는 중이에요. 아직 참아요." },
      { at: T.sink2, label: "찌 잠김", caption: shallow ? "찌가 옆으로 끌려가거나 잠기면 바로 가볍게 채요!" : "찌가 물속으로 쏙 사라지면 지금이에요!" },
      { at: T.strike, label: "챔질", caption: "대를 위로 힘있게 세워 바늘을 걸어요." },
      { at: T.reel, label: "끌어오기", caption: "대를 세운 채 버티고, 고기 힘이 빠지면 천천히 감아요." },
    ],
    pose(t) {
      const c = shoreCast(t, o);
      if (!c.landed) return { rod: c.rod, bend: c.bend, reeling: false, anchor: c.rig, sag: c.flying ? 0.15 : 0.02, float: { x: c.rig.x, y: c.rig.y - 6, tilt: 70 }, bait: { x: c.rig.x, y: c.rig.y + 14 }, trail: c.trail };
      const drift = lerp(0, 26, seg(t, T.drift, T.strike));
      const reelBack = lerp(0, o.landX + 26 - 136, ease(seg(t, T.reel, T.end)));
      const fx = o.landX + drift - reelBack;
      const sinkP = ease(seg(t, T.sink, T.settle));
      const bob = t > T.bob && t < T.sink2 ? Math.max(0, osc(t, 2.2)) * 4 : 0;
      const under = lerp(0, 16, ease(seg(t, T.sink2, T.strike)));
      const hooked = t >= T.strike;
      const floatY = SHORE.water - 4 + bob + under;
      const baitY = SHORE.water + lerp(6, depth, sinkP) + under * 0.5 - (hooked ? lerp(0, depth * 0.6, seg(t, T.reel, T.end)) : 0);
      const bait = { x: fx + lerp(4, 8, sinkP) + under * 0.4, y: baitY };
      const tilt = lerp(78, 0, ease(seg(t, T.sink + 0.8, T.settle + 0.3)));
      const fishIn = seg(t, T.drift + 0.3, T.bob);
      const f = hooked
        ? { x: bait.x + 6, y: bait.y + 4, flip: true, hooked: true, scale: 1 }
        : { x: lerp(bait.x + 90, bait.x + 10, ease(fishIn)), y: lerp(bait.y + 20, bait.y + 3, fishIn), flip: true, hooked: false, scale: 1 };
      const rod = t < T.strike ? 32 : lerp(32, 72, ease(seg(t, T.strike, T.strike + 0.4)));
      const bend = t < T.strike ? (t > T.sink2 ? 0.1 : 0) : 0.55 + osc(t, 1.4) * 0.12;
      return {
        rod,
        bend,
        reeling: t > T.reel,
        anchor: { x: fx, y: floatY - 8 },
        sag: t < T.strike ? 0.1 : 0,
        float: { x: fx, y: floatY, tilt },
        bait,
        fish: t > T.drift ? f : undefined,
        splash: t < tLand + 0.9 ? { x: o.landX, r: lerp(4, 26, seg(t, tLand, tLand + 0.9)), o: 1 - seg(t, tLand, tLand + 0.9) } : undefined,
        chum: t > T.drift - 1 && t < T.strike ? { x: fx + 10, y: SHORE.water + 14, o: 0.5 } : undefined,
        marks:
          t > T.settle && t < T.bob
            ? [{ x: fx - 16, y1: SHORE.water, y2: bait.y, label: `찌밑 수심 ${dims.stop ?? ""}`, side: "l" }]
            : undefined,
      };
    },
  };
}

// ───────── 바닥 원투 (노래미·가자미) ─────────
function bottomCastScript(far: boolean, dims: Record<string, string>, fish: FishShape): Script {
  const o: CastOpts = far ? { landX: 372, apex: 110, flight: 2.2 } : { landX: 196, apex: 44, flight: 1.3 };
  const tLand = 2.35 + o.flight;
  const bedAt = (x: number) => shoreBed(x) - 10;
  const T = { sink: tLand + 0.3, touch: tLand + 2.2, tight: tLand + 2.9, wait: tLand + 3.8, nibble: tLand + 6, pull: tLand + 7, strike: tLand + 7.6, reel: tLand + 8.2, end: tLand + 11 };
  return {
    scene: "shore",
    rig: "bottom",
    fish,
    duration: T.end,
    phases: [
      ...CAST_PHASES(tLand),
      { at: T.sink, label: "가라앉기", caption: "봉돌이 바닥까지 가라앉는 동안 줄이 느슨하게 따라 들어가요." },
      { at: T.touch, label: "바닥 닿음", caption: "줄이 더 안 풀리고 ‘툭’ 멈추면 봉돌이 바닥에 닿은 거예요." },
      { at: T.tight, label: "줄 팽팽하게", caption: "릴을 천천히 감아 느슨한 줄을 걷어 줄을 살짝 팽팽하게 해요." },
      { at: T.wait, label: "기다리기", caption: far ? "대를 받침대에 세워 두고 대 끝(초리)을 봐요. 미끼는 바닥에 닿아 있어요." : "대 끝을 보며 1~2분 기다려요. 입질이 없으면 조금씩 끌어 자리를 옮겨요." },
      { at: T.nibble, label: "입질", caption: "대 끝이 톡톡 떨려요. 아직 미끼를 맛보는 중 — 참아요." },
      { at: T.pull, label: "당김", caption: "대 끝이 ‘쭉’ 당겨지면 물고기가 미끼를 삼킨 거예요." },
      { at: T.strike, label: "챔질", caption: "대를 크게 세워 바늘을 걸어요." },
      { at: T.reel, label: "끌어오기", caption: "일정한 속도로 감아 올려요. 바닥 돌에 걸리지 않게 대를 세워요." },
    ],
    pose(t) {
      const c = shoreCast(t, o);
      if (!c.landed) return { rod: c.rod, bend: c.bend, reeling: false, anchor: c.rig, sag: c.flying ? 0.12 : 0.02, trail: c.trail };
      const sinkP = easeIn(seg(t, T.sink, T.touch));
      const reelP = ease(seg(t, T.reel, T.end));
      const x = lerp(o.landX, o.landX - 10, sinkP) - reelP * (o.landX - 130);
      const bedY = bedAt(x);
      const y = t < T.reel ? lerp(SHORE.water + 2, bedY, sinkP) : lerp(bedY, SHORE.water + 10, reelP * reelP);
      const sag = t < T.touch ? lerp(0.5, 0.9, sinkP) : t < T.tight ? lerp(0.9, 0.05, seg(t, T.touch, T.tight)) : 0.02;
      const rod = t < T.tight ? 32 : t < T.strike ? lerp(32, far ? 62 : 45, seg(t, T.tight, T.wait)) : lerp(far ? 62 : 45, 78, ease(seg(t, T.strike, T.strike + 0.4)));
      const nib = t > T.nibble && t < T.pull ? Math.max(0, osc(t, 3)) * 0.14 : 0;
      const pull = t > T.pull && t < T.strike ? lerp(0.1, 0.35, seg(t, T.pull, T.strike)) : 0;
      const bend = t >= T.strike ? 0.5 + osc(t, 1.3) * 0.1 : nib + pull;
      const hooked = t >= T.strike;
      const fishP = seg(t, T.wait + 0.5, T.nibble);
      return {
        rod,
        bend,
        reeling: (t > T.tight && t < T.wait) || t > T.reel,
        anchor: { x, y },
        sag,
        fish:
          t > T.wait
            ? hooked
              ? { x: x - 12, y: y - 12, flip: false, hooked: true, scale: 1 }
              : { x: lerp(x + 70, x - 10, ease(fishP)), y: lerp(bedY - 30, bedY - 12, fishP), flip: true, hooked: false, scale: 1 }
            : undefined,
        splash: t < tLand + 0.9 ? { x: o.landX, r: lerp(4, 24, seg(t, tLand, tLand + 0.9)), o: 1 - seg(t, tLand, tLand + 0.9) } : undefined,
        puff: t > T.touch && t < T.touch + 0.8 ? { x, y: bedY + 8, o: 1 - seg(t, T.touch, T.touch + 0.8) } : undefined,
        callout: t > T.touch && t < T.tight ? { x: x - 20, y: bedY - 26, text: "툭!" } : t > T.nibble && t < T.pull ? { x: rodTip("shore", rod, bend).x, y: rodTip("shore", rod, bend).y - 12, text: "톡톡" } : undefined,
      };
    },
  };
}

// ───────── 볼락 지그헤드 ─────────
function jigScript(dims: Record<string, string>, fish: FishShape): Script {
  const o: CastOpts = { landX: 320, apex: 60, flight: 1.8 };
  const tLand = 2.35 + o.flight;
  const swimY = SHORE.water + 40;
  const T = { count: tLand + 0.3, retrieve: tLand + 3.2, bite: tLand + 6.4, strike: tLand + 6.9, reel: tLand + 7.4, end: tLand + 10 };
  return {
    scene: "shore",
    rig: "jig",
    fish,
    duration: T.end,
    phases: [
      ...CAST_PHASES(tLand),
      { at: T.count, label: "가라앉히기", caption: `“하나, 둘, 셋…” 세면서 루어를 가라앉혀요. 볼락은 수면 아래 ${dims.swim ?? "1~3m"}에 있어요.` },
      { at: T.retrieve, label: "천천히 감기", caption: "1초에 반 바퀴, 아주 천천히 감아요. 루어가 같은 깊이로 살랑살랑 헤엄쳐요." },
      { at: T.bite, label: "입질", caption: "‘톡’ 하고 가볍게 걸리는 느낌이 와요." },
      { at: T.strike, label: "챔질", caption: "손목으로 가볍게 채요. 세게 채면 입이 찢어져요." },
      { at: T.reel, label: "끌어오기", caption: "같은 속도로 감아 올려요." },
    ],
    pose(t) {
      const c = shoreCast(t, o);
      if (!c.landed) return { rod: c.rod, bend: c.bend, reeling: false, anchor: c.rig, sag: c.flying ? 0.12 : 0.02, lureAngle: 0, trail: c.trail };
      const sinkP = seg(t, T.count, T.retrieve);
      const retP = seg(t, T.retrieve, T.end);
      const x = o.landX - retP * 190;
      const y = t < T.retrieve ? lerp(SHORE.water + 2, swimY, sinkP) : t < T.reel ? swimY + osc(t, 0.8) * 3 : lerp(swimY, SHORE.water - 10, seg(t, T.reel, T.end));
      const hooked = t >= T.strike;
      const fishP = seg(t, T.retrieve + 1, T.bite);
      const count = t > T.count && t < T.retrieve ? `${Math.min(3, Math.floor((t - T.count) / 0.9) + 1)}…` : null;
      return {
        rod: t < T.strike ? 30 : lerp(30, 58, ease(seg(t, T.strike, T.strike + 0.3))),
        bend: hooked ? 0.35 + osc(t, 1.6) * 0.08 : t > T.bite ? 0.12 : 0,
        reeling: t > T.retrieve,
        anchor: { x, y },
        sag: t < T.retrieve ? 0.35 : 0.08,
        lureAngle: t < T.retrieve ? 60 : 180,
        fish: t > T.retrieve + 1 ? (hooked ? { x: x + 8, y: y + 2, flip: true, hooked: true, scale: 0.8 } : { x: lerp(x - 30, x + 12, ease(fishP)), y: lerp(y + 50, y + 4, ease(fishP)), flip: true, hooked: false, scale: 0.8 }) : undefined,
        splash: t < tLand + 0.9 ? { x: o.landX, r: lerp(4, 18, seg(t, tLand, tLand + 0.9)), o: 1 - seg(t, tLand, tLand + 0.9) } : undefined,
        callout: count ? { x: x + 16, y: y - 8, text: count } : t > T.bite && t < T.strike ? { x: x, y: y - 16, text: "톡!" } : undefined,
        marks: t > T.retrieve && t < T.bite ? [{ x: x + 26, y1: SHORE.water, y2: swimY, label: `수면 아래 ${dims.swim ?? ""}`, side: "r" }] : undefined,
      };
    },
  };
}

// ───────── 무늬오징어 에깅 ─────────
function egiCastScript(dims: Record<string, string>, fish: FishShape): Script {
  const o: CastOpts = { landX: 350, apex: 96, flight: 2 };
  const tLand = 2.35 + o.flight;
  const nearBed = shoreBed(300) - 16;
  const T = { fall: tLand + 0.3, jerk: tLand + 3.8, fall2: tLand + 5.4, touch: tLand + 7.4, strike: tLand + 8.2, reel: tLand + 8.8, end: tLand + 11.4 };
  // 저킹: 두 번 휙휙
  const jerk = (t: number) => {
    const p = seg(t, T.jerk, T.fall2);
    const k = p < 0.5 ? Math.sin(Math.PI * (p / 0.5)) : Math.sin(Math.PI * ((p - 0.5) / 0.5));
    return Math.max(0, k);
  };
  return {
    scene: "shore",
    rig: "egi",
    fish,
    duration: T.end,
    phases: [
      ...CAST_PHASES(tLand),
      { at: T.fall, label: "가라앉히기", caption: `에기가 비스듬히 가라앉아요 (${dims.fall ?? "1m ≈ 3초"}). 바닥 가까이까지 세며 기다려요.` },
      { at: T.jerk, label: "저킹", caption: "대를 ‘휙휙’ 2~3번 쳐올리면 에기가 새우처럼 튀어 올라요." },
      { at: T.fall2, label: "다시 가라앉기", caption: "줄을 살짝 팽팽하게 두고 천천히 가라앉혀요. 오징어는 이때 올라타요. 줄을 잘 봐요!" },
      { at: T.touch, label: "입질", caption: "가라앉던 줄이 멈추거나 옆으로 가면 오징어가 안은 거예요." },
      { at: T.strike, label: "챔질", caption: "대를 위로 크게 채요." },
      { at: T.reel, label: "끌어오기", caption: "줄이 느슨해지지 않게 일정하게 감아요. 먹물 조심!" },
    ],
    pose(t) {
      const c = shoreCast(t, o);
      if (!c.landed) return { rod: c.rod, bend: c.bend, reeling: false, anchor: c.rig, sag: c.flying ? 0.12 : 0.02, lureAngle: 10, trail: c.trail };
      const fallP = seg(t, T.fall, T.jerk);
      let x = lerp(o.landX, 312, fallP);
      let y = lerp(SHORE.water + 4, nearBed, fallP);
      let ang = -20;
      const j = jerk(t);
      if (t >= T.jerk && t < T.fall2) {
        const p = seg(t, T.jerk, T.fall2);
        x = lerp(312, 286, p);
        y = nearBed - lerp(0, 34, p) - j * 14;
        ang = -35 - j * 25;
      } else if (t >= T.fall2) {
        const p = seg(t, T.fall2, T.touch);
        x = 286 - p * 10;
        y = lerp(nearBed - 34, nearBed - 16, p);
        ang = -22;
      }
      const hooked = t >= T.strike;
      const reelP = ease(seg(t, T.reel, T.end));
      if (t >= T.reel) {
        x = lerp(276, 150, reelP);
        y = lerp(nearBed - 16, SHORE.water - 4, reelP);
        ang = 180;
      }
      const sqP = seg(t, T.fall2, T.touch);
      const count = t > T.fall && t < T.jerk ? `${Math.min(10, Math.floor((t - T.fall) / 0.35) + 1)}초` : null;
      return {
        rod: t >= T.jerk && t < T.fall2 ? 32 + j * 48 : t < T.strike ? 32 : lerp(32, 80, ease(seg(t, T.strike, T.strike + 0.3))),
        bend: hooked ? 0.45 + osc(t, 1.2) * 0.1 : j * 0.3,
        reeling: t > T.reel,
        anchor: { x, y },
        sag: t < T.jerk ? 0.4 : t < T.touch ? 0.12 : t < T.strike ? 0.3 : 0.02,
        lureAngle: ang,
        fish: t > T.fall2 ? (hooked || t > T.touch ? { x: x + 10, y: y + 4, flip: true, hooked: true, scale: 1 } : { x: lerp(x + 80, x + 16, ease(sqP)), y: lerp(y + 26, y + 4, sqP), flip: true, hooked: false, scale: 1 }) : undefined,
        splash: t < tLand + 0.9 ? { x: o.landX, r: lerp(4, 22, seg(t, tLand, tLand + 0.9)), o: 1 - seg(t, tLand, tLand + 0.9) } : undefined,
        callout: count ? { x: x + 12, y: y - 10, text: count } : t >= T.jerk && t < T.fall2 ? { x: rodTip("shore", 32 + j * 48, j * 0.3).x + 6, y: 30, text: "휙휙!" } : t > T.touch && t < T.strike ? { x: x - 10, y: y - 20, text: "줄 멈춤!" } : undefined,
      };
    },
  };
}

// ───────── 카드채비 ─────────
function sabikiScript(dims: Record<string, string>, fish: FishShape): Script {
  const o: CastOpts = { landX: 226, apex: 46, flight: 1.4 };
  const tLand = 2.35 + o.flight;
  const midY = SHORE.water + 48;
  const T = { sink: tLand + 0.3, jig: tLand + 2.4, school: tLand + 4.2, bite: tLand + 6, wait: tLand + 6.8, reel: tLand + 7.6, end: tLand + 10.6 };
  return {
    scene: "shore",
    rig: "sabiki",
    fish,
    duration: T.end,
    phases: [
      ...CAST_PHASES(tLand),
      { at: T.sink, label: "가라앉히기", caption: `밑밥통이 물속 중간(수면 아래 ${dims.swim ?? "2~5m"})까지 가라앉아요. 반짝이 바늘들이 줄줄이 따라가요.` },
      { at: T.jig, label: "흔들기", caption: "대를 천천히 들었다 내려요. 밑밥이 퍼지고 반짝이가 흔들려요." },
      { at: T.school, label: "고기 떼", caption: "고기 떼가 밑밥 냄새를 맡고 몰려와요." },
      { at: T.bite, label: "입질", caption: "‘투두둑’ 여러 번 흔들려요. 바로 감지 말고…" },
      { at: T.wait, label: "기다리기", caption: "몇 초 기다리면 다른 바늘에도 더 걸려요." },
      { at: T.reel, label: "끌어오기", caption: "입이 약하니 천천히 일정하게 감아요." },
    ],
    pose(t) {
      const c = shoreCast(t, o);
      if (!c.landed) return { rod: c.rod, bend: c.bend, reeling: false, anchor: c.rig, sag: c.flying ? 0.12 : 0.02, trail: c.trail };
      const sinkP = ease(seg(t, T.sink, T.jig));
      const jigging = t > T.jig && t < T.reel ? osc(t - T.jig, 0.45) : 0;
      const reelP = ease(seg(t, T.reel, T.end));
      const x = lerp(o.landX, 214, sinkP) - reelP * 90;
      const y = t < T.reel ? lerp(SHORE.water + 4, midY, sinkP) - jigging * 12 : lerp(midY, SHORE.water - 6, reelP);
      const schoolP = seg(t, T.school, T.bite);
      const count = t >= T.bite ? (t >= T.wait ? 3 : 2) : 0;
      return {
        rod: t < T.jig ? 32 : 40 + jigging * 12 + (t > T.reel ? 14 : 0),
        bend: t > T.bite ? 0.3 + osc(t, 3) * 0.06 : 0,
        reeling: t > T.reel,
        anchor: { x, y },
        sag: t < T.jig ? 0.3 : 0.05,
        fish: t > T.school ? { x: lerp(x + 120, x - 4, ease(schoolP)), y: y - 26, flip: true, hooked: t >= T.bite, scale: 0.7, count: t >= T.bite ? count : 4 } : undefined,
        chum: t > T.jig && t < T.reel ? { x: x, y: y + 4, o: 0.55 } : undefined,
        splash: t < tLand + 0.9 ? { x: o.landX, r: lerp(4, 20, seg(t, tLand, tLand + 0.9)), o: 1 - seg(t, tLand, tLand + 0.9) } : undefined,
        callout: t > T.bite && t < T.wait ? { x: x - 20, y: y - 64, text: "투두둑!" } : undefined,
        marks: t > T.jig && t < T.school ? [{ x: x - 40, y1: SHORE.water, y2: midY, label: `수면 아래 ${dims.swim ?? ""}`, side: "l" }] : undefined,
      };
    },
  };
}

// ───────── 배낚시 (우럭·광어·주꾸미·갑오징어·참돔) ─────────
function boatScript(motion: Motion, dims: Record<string, string>, fish: FishShape): Script {
  const tipAt = (rod: number, bend: number) => rodTip("boat", rod, bend);
  const rig: RigShape = motion === "boat-bottom" ? "bottom" : motion === "boat-downshot" ? "downshot" : motion === "boat-egi" ? "egi-boat" : "tairaba";
  const sinkerH = rig === "tairaba" ? 10 : 12;
  const floorY = BOAT.bed - sinkerH;
  const T = { drop: 1, touch: 4.6, a: 5.3 };
  const drop: Phase[] = [
    { at: 0, label: "준비", caption: "배 옆으로 대를 내밀고 채비를 물 위에 늘어뜨려요. 옆 사람과 줄이 엉키지 않게 조심!" },
    { at: T.drop, label: "내리기", caption: "릴의 줄 풀림 버튼(클러치)을 눌러 채비를 내려요. 줄이 술술 풀려요." },
    { at: T.touch, label: "바닥 닿음", caption: "줄 풀리는 게 ‘툭’ 멈추면 바닥에 닿은 거예요. 바로 클러치를 잠가요." },
  ];
  let phases: Phase[] = [];
  let duration = 16;
  let pose: (t: number) => Pose;
  const base = (t: number) => {
    const p = easeIn(seg(t, T.drop, T.touch));
    const x = tipAt(18, 0).x + 6 + p * 12;
    const y = lerp(BOAT.water - 6, floorY, p);
    const depthM = Math.round(p * 30);
    return { x, y, depthM, p };
  };
  if (motion === "boat-bottom") {
    const liftPx = 20;
    const S = { lift: T.a, gopae: 7, fishIn: 8.5, bite: 10.2, wait: 11, strike: 11.8, reel: 12.4, end: 16 };
    duration = S.end;
    phases = [
      ...drop,
      { at: S.lift, label: "띄우기", caption: `릴을 1~2바퀴 감아 봉돌을 바닥에서 ${dims.lift ?? "30~50cm"} 띄워요. 바위에 걸리지 않게!` },
      { at: S.gopae, label: "고패질", caption: "대를 천천히 들었다 내려 미끼가 살아 있는 것처럼 움직여요. 30초마다 바닥을 다시 찍어요." },
      { at: S.bite, label: "입질", caption: "‘투둑’ 대 끝이 두세 번 떨려요. 1~2초 기다려요." },
      { at: S.strike, label: "챔질", caption: "대를 천천히 들어 올리며 감기 시작해요." },
      { at: S.reel, label: "올리기", caption: "일정한 속도로 감아 올려요. 멈추면 빠질 수 있어요." },
    ];
    pose = (t) => {
      const b = base(t);
      const liftP = ease(seg(t, S.lift, S.lift + 0.8));
      const g = t > S.gopae && t < S.strike ? osc(t - S.gopae, 0.35) : 0;
      const reelP = ease(seg(t, S.reel, S.end));
      const y = t < S.reel ? b.y - liftP * liftPx - g * 6 : lerp(floorY - liftPx, BOAT.water + 10, reelP);
      const hooked = t >= S.strike;
      const fp = seg(t, S.fishIn, S.bite);
      const rod = t < S.gopae ? 18 : t < S.strike ? 18 + g * 10 : lerp(18, 45, ease(seg(t, S.strike, S.strike + 0.5)));
      const bend = hooked ? 0.5 + osc(t, 1) * 0.08 : t > S.bite && t < S.wait ? Math.max(0, osc(t, 3.2)) * 0.2 : 0;
      const anchorX = b.x;
      return {
        rod, bend, reeling: (t > S.lift && t < S.lift + 0.8) || t > S.reel,
        anchor: { x: anchorX, y }, sag: t < T.touch ? 0.05 : 0,
        fish: t > S.fishIn ? (hooked ? { x: anchorX + 14, y: y - 14, flip: false, hooked: true, scale: 1.1 } : { x: lerp(anchorX + 70, anchorX + 18, ease(fp)), y: lerp(BOAT.bed - 6, y - 12, fp), flip: true, hooked: false, scale: 1.1 }) : undefined,
        puff: t > T.touch && t < T.touch + 0.8 ? { x: anchorX, y: BOAT.bed, o: 1 - seg(t, T.touch, T.touch + 0.8) } : undefined,
        callout: t < T.touch && t > T.drop ? { x: anchorX + 14, y: y, text: `${b.depthM}m` } : t > T.touch && t < S.lift ? { x: anchorX + 14, y: BOAT.bed - 20, text: "툭!" } : t > S.bite && t < S.wait ? { x: tipAt(rod, bend).x + 6, y: tipAt(rod, bend).y - 8, text: "투둑!" } : undefined,
        marks: t > S.lift + 0.8 && t < S.fishIn ? [{ x: anchorX - 14, y1: y + sinkerH, y2: BOAT.bed, label: `바닥에서 ${dims.lift ?? ""}`, side: "l" }] : undefined,
      };
    };
  } else if (motion === "boat-downshot") {
    const S = { shake: T.a, fishIn: 7.5, bite: 9.6, heavy: 10.2, strike: 10.9, reel: 11.5, end: 15.5 };
    duration = S.end;
    phases = [
      ...drop,
      { at: S.shake, label: "톡톡", caption: `봉돌은 바닥에 두고 대 끝을 살살 흔들어요. 웜이 바닥에서 ${dims.tail ?? "30~50cm"} 위에서 춤춰요.` },
      { at: S.fishIn, label: "광어 등장", caption: "모래에 숨어 있던 광어가 위로 지나가는 웜을 노려요." },
      { at: S.bite, label: "입질", caption: "대 끝이 ‘툭’ 하고 묵직해져요." },
      { at: S.strike, label: "챔질", caption: "웜이면 무게를 느끼는 순간 바로 채요." },
      { at: S.reel, label: "올리기", caption: "대를 세우고 일정하게 감아요. 뜰채로 떠요." },
    ];
    pose = (t) => {
      const b = base(t);
      const shake = t > S.shake && t < S.bite ? osc(t, 1.6) : 0;
      const reelP = ease(seg(t, S.reel, S.end));
      const y = t < S.reel ? b.y - (shake > 0.6 ? 4 : 0) : lerp(floorY, BOAT.water + 10, reelP);
      const hooked = t >= S.strike;
      const fp = seg(t, S.fishIn, S.bite);
      const rod = t < S.strike ? 18 + shake * 4 : lerp(18, 48, ease(seg(t, S.strike, S.strike + 0.5)));
      const bend = hooked ? 0.55 + osc(t, 1) * 0.08 : t > S.bite ? lerp(0.05, 0.3, seg(t, S.bite, S.strike)) : 0;
      return {
        rod, bend, reeling: t > S.reel,
        anchor: { x: b.x, y }, sag: 0.02,
        fish: t > S.fishIn - 0.5 ? (hooked ? { x: b.x + 22, y: y - 30, flip: false, hooked: true, scale: 1 } : { x: lerp(b.x + 60, b.x + 26, ease(fp)), y: lerp(BOAT.bed - 3, y - 28, easeIn(fp)), flip: true, hooked: false, scale: 1 }) : undefined,
        puff: t > T.touch && t < T.touch + 0.8 ? { x: b.x, y: BOAT.bed, o: 1 - seg(t, T.touch, T.touch + 0.8) } : undefined,
        callout: t < T.touch && t > T.drop ? { x: b.x + 14, y, text: `${b.depthM}m` } : t > S.bite && t < S.strike ? { x: tipAt(rod, bend).x + 6, y: tipAt(rod, bend).y - 8, text: "묵직!" } : undefined,
        marks: t > S.shake && t < S.fishIn ? [{ x: b.x - 14, y1: floorY - 30, y2: floorY + sinkerH, label: `봉돌~웜 ${dims.tail ?? ""}`, side: "l" }] : undefined,
      };
    };
  } else if (motion === "boat-egi") {
    const S = { tap: T.a, stay: 7, fishIn: 7.2, heavy: 9.8, lift: 10.6, reel: 11.4, end: 15.5 };
    duration = S.end;
    phases = [
      ...drop,
      { at: S.tap, label: "톡톡", caption: "봉돌은 바닥에 둔 채 대 끝을 ‘톡톡’ 흔들어 에기를 움직여요." },
      { at: S.stay, label: "멈추기", caption: "3~5초 가만히 기다려요. 이때 주꾸미·갑오징어가 에기에 올라타요." },
      { at: S.heavy, label: "무게 확인", caption: "대를 살짝 들어 보면 ‘묵직’해요. 올라탄 거예요!" },
      { at: S.lift, label: "챔질", caption: "대를 부드럽게 쭉 들어 올려요." },
      { at: S.reel, label: "올리기", caption: "멈추지 말고 일정하게 감아요. 멈추면 떨어져요." },
    ];
    pose = (t) => {
      const b = base(t);
      const tap = t > S.tap && t < S.stay ? Math.max(0, osc(t, 2.4)) : 0;
      const reelP = ease(seg(t, S.reel, S.end));
      const y = t < S.reel ? b.y - (t > S.heavy && t < S.lift ? lerp(0, 6, seg(t, S.heavy, S.lift)) : 0) : lerp(floorY, BOAT.water + 10, reelP);
      const fp = seg(t, S.fishIn, S.heavy - 0.4);
      const grabbed = t > S.heavy - 0.4;
      const rod = t < S.heavy ? 18 + tap * 5 : t < S.lift ? lerp(18, 24, seg(t, S.heavy, S.lift)) : lerp(24, 44, ease(seg(t, S.lift, S.lift + 0.6)));
      const bend = t > S.heavy ? 0.3 + (t > S.lift ? 0.1 : 0) : 0;
      return {
        rod, bend, reeling: t > S.reel,
        anchor: { x: b.x, y }, sag: 0.02,
        fish: t > S.fishIn ? (grabbed ? { x: b.x + 30, y: y - 16, flip: true, hooked: true, scale: 0.9 } : { x: lerp(b.x + 110, b.x + 32, ease(fp)), y: lerp(BOAT.bed - 6, y - 14, fp), flip: true, hooked: false, scale: 0.9 }) : undefined,
        puff: t > T.touch && t < T.touch + 0.8 ? { x: b.x, y: BOAT.bed, o: 1 - seg(t, T.touch, T.touch + 0.8) } : undefined,
        callout: t < T.touch && t > T.drop ? { x: b.x + 14, y, text: `${b.depthM}m` } : t > S.stay && t < S.heavy ? { x: b.x + 36, y: y - 40, text: `${Math.min(5, Math.floor(t - S.stay) + 1)}초…` } : t > S.heavy && t < S.lift ? { x: tipAt(rod, bend).x + 6, y: tipAt(rod, bend).y - 8, text: "묵직!" } : undefined,
        marks: t > S.tap && t < S.fishIn ? [{ x: b.x - 14, y1: floorY - 16, y2: floorY + sinkerH, label: `봉돌~에기 ${dims.tail ?? ""}`, side: "l" }] : undefined,
      };
    };
  } else {
    // 타이라바
    const top = BOAT.bed - 96;
    const S = { up: T.touch + 0.2, follow: 6.4, nibble: 8.6, bend: 10.4, strike: 11, reel: 11.6, end: 16 };
    duration = S.end;
    phases = [
      ...drop,
      { at: S.up, label: "바로 감기", caption: `바닥에 닿자마자 1초에 1바퀴씩 일정하게 감아요. 바닥에서 ${dims.retrieve ?? "10~15m"} 올라오면 다시 내려요.` },
      { at: S.follow, label: "따라오기", caption: "참돔이 올라가는 타이라바를 따라와요." },
      { at: S.nibble, label: "톡톡톡", caption: "스커트를 톡톡 쪼아요. 놀라서 멈추거나 채면 안 돼요! 같은 속도로 계속 감아요." },
      { at: S.bend, label: "대가 휨", caption: "대가 크게 휘어 들어가면 바늘에 걸린 거예요." },
      { at: S.strike, label: "대 세우기", caption: "대를 천천히 세우고 감기를 이어가요." },
      { at: S.reel, label: "올리기", caption: "드랙이 풀리면 버티고, 멈추면 다시 감아요." },
    ];
    pose = (t) => {
      const b = base(t);
      const upP = seg(t, S.up, S.bend);
      const reelP = ease(seg(t, S.reel, S.end));
      const y = t < S.up ? b.y : t < S.reel ? lerp(floorY, top, upP) : lerp(top, BOAT.water + 10, reelP);
      const hooked = t >= S.bend;
      const fp = seg(t, S.follow, S.nibble);
      const rod = t < S.strike ? 16 : lerp(16, 46, ease(seg(t, S.strike, S.strike + 0.6)));
      const nib = t > S.nibble && t < S.bend ? Math.max(0, osc(t, 3.5)) * 0.14 : 0;
      const bend = hooked ? 0.6 + osc(t, 0.9) * 0.1 : nib;
      return {
        rod, bend, reeling: t > S.up,
        anchor: { x: b.x, y }, sag: 0.02,
        fish: t > S.follow ? (hooked ? { x: b.x + 4, y: y + 18, flip: false, hooked: true, scale: 1.1 } : { x: lerp(b.x + 40, b.x + 6, ease(fp)), y: lerp(BOAT.bed - 6, y + 20, fp), flip: false, hooked: false, scale: 1.1 }) : undefined,
        puff: t > T.touch && t < T.touch + 0.8 ? { x: b.x, y: BOAT.bed, o: 1 - seg(t, T.touch, T.touch + 0.8) } : undefined,
        callout: t < T.touch && t > T.drop ? { x: b.x + 14, y, text: `${b.depthM}m` } : t > S.nibble && t < S.bend ? { x: tipAt(rod, bend).x + 6, y: tipAt(rod, bend).y - 8, text: "톡톡톡" } : undefined,
        marks: t > S.up + 1 && t < S.follow + 1.4 ? [{ x: b.x - 16, y1: y, y2: BOAT.bed, label: `바닥에서 ${dims.retrieve ?? ""}`, side: "l" }] : undefined,
      };
    };
  }
  return { scene: "boat", rig, fish, duration, phases, pose };
}

/** 어종 → 물고기 모양 */
export const FISH_SHAPE: Record<string, FishShape> = {
  flatfish: "flat",
  righteye: "flat",
  webfoot: "octopus",
  cuttlefish: "squid",
  "squid-bigfin": "squid",
};

export const FISH_COLOR: Record<string, string> = {
  rockfish: "#4a4f57",
  greenling: "#8a7648",
  flatfish: "#7a6440",
  blackporgy: "#5b6574",
  redseabream: "#e07a7a",
  webfoot: "#b98a6c",
  cuttlefish: "#8a6a4a",
  halfbeak: "#5a92c4",
  mackerel: "#3a8292",
  bolak: "#8a5a3c",
  righteye: "#8a6d4a",
  "squid-bigfin": "#d9b8a8",
};
