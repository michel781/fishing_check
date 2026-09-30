"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Motion } from "@/data/rigSpecs";
import { BOAT, FISH_COLOR, FISH_SHAPE, SHORE, makeScript, rodTip, shoreBed, type FishShape, type P, type Pose, type RigShape, type Script } from "./scripts";

const W = 400;
const H = 260;
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * 채비별 "사람이 던지면 줄과 채비가 어떻게 움직이는지" 애니메이션 영상.
 * 코드로 그린 장면이라 가볍고, 단계별 자막·되감기·느리게 보기를 지원한다.
 */
export function CastingVideo({ speciesId, name, motion, dims }: { speciesId: string; name: string; motion: Motion; dims: Record<string, string> }) {
  const fish = FISH_SHAPE[speciesId] ?? "fish";
  const script = useMemo(() => makeScript(motion, dims, fish), [motion, dims, fish]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const tRef = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // 재생 루프
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const n = Math.min(script.duration, tRef.current + dt * speed);
      tRef.current = n;
      setT(n);
      if (n >= script.duration) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, script.duration]);

  // 화면에 보이면 한 번 자동 재생(움직임 줄이기 설정이면 안 함), 안 보이면 멈춤
  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current && !reduce) {
          started.current = true;
          setPlaying(true);
        } else if (!e.isIntersecting) setPlaying(false);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const seek = (v: number) => {
    tRef.current = v;
    setT(v);
  };
  const toggle = () => {
    started.current = true;
    if (!playing && tRef.current >= script.duration) seek(0);
    setPlaying((p) => !p);
  };

  const phaseIdx = script.phases.reduce((idx, p, i) => (t >= p.at ? i : idx), 0);
  const phase = script.phases[phaseIdx];
  const pose = script.pose(t);

  return (
    <div className="cast-video" ref={box}>
      <div className="cast-frame">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} 채비를 던지고(내리고) 입질을 받는 과정 애니메이션. 지금 단계: ${phase.label}`}>
          <Scene script={script} pose={pose} t={t} fishColor={FISH_COLOR[speciesId] ?? "#5b6574"} />
        </svg>
        {!playing && (t === 0 || t >= script.duration) && (
          <button type="button" className="cast-big-play" onClick={toggle} aria-label={t >= script.duration ? "처음부터 다시 보기" : "영상 재생"}>
            {t >= script.duration ? "↺" : "▶"}
          </button>
        )}
        <span className="cast-badge" aria-hidden>{phase.label}</span>
      </div>
      <div className="cast-controls">
        <button type="button" className="round-btn" onClick={toggle} aria-label={playing ? "일시정지" : "재생"}>
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M7 5l12 7-12 7z" fill="currentColor" /></svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={script.duration}
          step={0.05}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            started.current = true;
            seek(Number(e.target.value));
          }}
          aria-label="재생 위치"
          aria-valuetext={`${fmtTime(t)} / ${fmtTime(script.duration)}, ${phase.label}`}
        />
        <span className="small muted num" aria-hidden>{fmtTime(t)} / {fmtTime(script.duration)}</span>
        <button type="button" className="chip2" aria-pressed={speed === 0.5} onClick={() => setSpeed((s) => (s === 1 ? 0.5 : 1))} style={{ minHeight: 40 }}>
          {speed === 0.5 ? "느리게 0.5×" : "보통 1×"}
        </button>
      </div>
      <p className="cast-caption" aria-live={playing ? "off" : "polite"}>
        <strong>{phaseIdx + 1}. {phase.label}</strong> {phase.caption}
      </p>
      <ol className="cast-steps" aria-label="단계로 이동">
        {script.phases.map((p, i) => (
          <li key={p.label + p.at}>
            <button
              type="button"
              aria-current={i === phaseIdx ? "step" : undefined}
              onClick={() => {
                started.current = true;
                setPlaying(false);
                seek(p.at + 0.01);
              }}
            >
              {i + 1}. {p.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ───────── 그리기 ─────────

function Scene({ script, pose, t, fishColor }: { script: Script; pose: Pose; t: number; fishColor: string }) {
  const shore = script.scene === "shore";
  const waterY = shore ? SHORE.water : BOAT.water;
  const tip = rodTip(script.scene, pose.rod, pose.bend);
  const hands = shore ? SHORE.hands : BOAT.hands;
  const shoulder = shore ? SHORE.shoulder : BOAT.shoulder;
  const feetY = shore ? SHORE.ground : BOAT.water - 8;
  const wave = (t * 18) % 40;

  // 줄 모양: 대 끝 → 채비, 처짐(sag)만큼 아래로 휜 곡선
  const a = pose.anchor;
  const dist = Math.hypot(a.x - tip.x, a.y - tip.y);
  const ctrl = { x: (tip.x + a.x) / 2, y: (tip.y + a.y) / 2 + pose.sag * dist * 0.35 };
  const linePath = `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} Q${ctrl.x.toFixed(1)},${ctrl.y.toFixed(1)} ${a.x.toFixed(1)},${a.y.toFixed(1)}`;
  // 채비 방향(대 끝 쪽) 단위 벡터
  const dx = ctrl.x - a.x;
  const dy = ctrl.y - a.y;
  const dl = Math.hypot(dx, dy) || 1;
  const up = { x: dx / dl, y: dy / dl };

  // 대 모양 (휨)
  const rodMid = { x: (hands.x + tip.x) / 2, y: (hands.y + tip.y) / 2 };
  const rx = tip.x - hands.x;
  const ry = tip.y - hands.y;
  const rl = Math.hypot(rx, ry) || 1;
  const rodCtrl = { x: rodMid.x - (ry / rl) * pose.bend * -10, y: rodMid.y + (rx / rl) * pose.bend * -10 + pose.bend * 8 };

  return (
    <>
      <defs>
        <linearGradient id="cv-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8ec5ff" />
          <stop offset="1" stopColor="#dff0ff" />
        </linearGradient>
        <linearGradient id="cv-water" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2f86d0" />
          <stop offset="1" stopColor="#0b3566" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#cv-sky)" />
      <path d={`M0,${waterY - 14} q60,-22 120,-6 t140,-4 t140,-8 V${waterY} H0 Z`} fill="#9cb7cf" opacity="0.6" />
      <rect y={waterY} width={W} height={H - waterY} fill="url(#cv-water)" />

      {/* 바닥 */}
      {shore ? (
        <path d={`M104,${shoreBed(120)} ${Array.from({ length: 15 }, (_, i) => { const x = 120 + i * 20; return `L${x},${shoreBed(x) + (i % 2 ? 3 : 0)}`; }).join(" ")} L${W},${H} L104,${H} Z`} fill="#c9b27f" />
      ) : (
        <path d={`M0,${BOAT.bed + 4} ${Array.from({ length: 21 }, (_, i) => `L${i * 20},${BOAT.bed + (i % 3 === 0 ? -3 : 2)}`).join(" ")} L${W},${H} L0,${H} Z`} fill="#c9b27f" />
      )}
      {/* 바위 */}
      {shore ? (
        <>
          <ellipse cx={128} cy={shoreBed(128) - 2} rx={16} ry={9} fill="#6b6f76" />
          <ellipse cx={150} cy={shoreBed(150)} rx={10} ry={6} fill="#7b8088" />
        </>
      ) : (
        <>
          <ellipse cx={300} cy={BOAT.bed - 2} rx={20} ry={9} fill="#6b6f76" />
          <ellipse cx={330} cy={BOAT.bed} rx={12} ry={6} fill="#7b8088" />
        </>
      )}

      {/* 밑밥 */}
      {pose.chum &&
        Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={pose.chum!.x + Math.sin(i * 2.1 + t) * (8 + i * 2)} cy={pose.chum!.y + ((i * 7 + t * 10) % 30)} r={1.6} fill="#ffb27a" opacity={pose.chum!.o} />
        ))}

      {/* 물고기 */}
      {pose.fish && <Fish shape={script.fish} color={fishColor} f={pose.fish} t={t} />}

      {/* 줄 (흰 테두리 + 진한 선: 하늘·물 모두에서 잘 보이게) */}
      {pose.trail && pose.trail.length > 1 && (
        <polyline points={pose.trail.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.9" />
      )}
      <path d={linePath} fill="none" stroke="#ffffff" strokeWidth="2.6" opacity="0.8" />
      <path d={linePath} fill="none" stroke="#18253d" strokeWidth="1.1" />

      {/* 채비 (작은 부품이 잘 보이게 확대해서 그림) */}
      {script.rig === "float" ? (
        <Rig shape={script.rig} pose={pose} up={up} />
      ) : (
        <g transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) scale(1.6) translate(${(-a.x).toFixed(1)} ${(-a.y).toFixed(1)})`}>
          <Rig shape={script.rig} pose={pose} up={up} />
        </g>
      )}

      {/* 수면 (채비 위에 그려 물속 느낌) */}
      <path d={`M${-40 + wave},${waterY} ${Array.from({ length: 12 }, () => "q10,-3 20,0 t20,0").join(" ")}`} fill="none" stroke="#e6f3ff" strokeWidth="1.5" opacity="0.8" />
      {pose.splash && (
        <g opacity={pose.splash.o}>
          <ellipse cx={pose.splash.x} cy={waterY} rx={pose.splash.r} ry={pose.splash.r * 0.28} fill="none" stroke="#fff" strokeWidth="2" />
          <ellipse cx={pose.splash.x} cy={waterY} rx={pose.splash.r * 0.5} ry={pose.splash.r * 0.15} fill="none" stroke="#fff" strokeWidth="1.5" />
          {[-1, 0, 1].map((k) => <circle key={k} cx={pose.splash!.x + k * 6} cy={waterY - 6 - pose.splash!.r * 0.3 * (k === 0 ? 1.4 : 1)} r={1.8} fill="#fff" />)}
        </g>
      )}
      {pose.puff && (
        <g opacity={pose.puff.o}>
          {[-8, -3, 3, 8].map((k) => <circle key={k} cx={pose.puff!.x + k * (2 - pose.puff!.o)} cy={pose.puff!.y - 4 - Math.abs(k) * (1 - pose.puff!.o)} r={2} fill="#e8d7ad" />)}
        </g>
      )}

      {/* 땅·배 */}
      {shore ? (
        <>
          <path d={`M0,${SHORE.ground} L108,${SHORE.ground} L124,${H} L0,${H} Z`} fill="#a4acb6" />
          <path d={`M0,${SHORE.ground} L108,${SHORE.ground}`} stroke="#7d8591" strokeWidth="3" />
          {[24, 56, 88].map((x) => <rect key={x} x={x - 8} y={SHORE.ground + 16} width={16} height={10} rx={2} fill="#939ba6" />)}
        </>
      ) : (
        <>
          <path d={`M36,${BOAT.water - 12} L206,${BOAT.water - 12} L190,${BOAT.water + 8} L52,${BOAT.water + 8} Z`} fill="#f4f6f8" stroke="#8a96a3" />
          <rect x={60} y={BOAT.water - 40} width={50} height={28} rx={4} fill="#dfe6ee" stroke="#8a96a3" />
          <rect x={68} y={BOAT.water - 34} width={14} height={10} fill="#8ec5ff" />
          <rect x={88} y={BOAT.water - 34} width={14} height={10} fill="#8ec5ff" />
        </>
      )}

      {/* 사람 (구명조끼 착용) */}
      <g>
        <line x1={shoulder.x} y1={shoulder.y + 22} x2={shoulder.x - 6} y2={feetY} stroke="#2b3441" strokeWidth="4" strokeLinecap="round" />
        <line x1={shoulder.x} y1={shoulder.y + 22} x2={shoulder.x + 6} y2={feetY} stroke="#2b3441" strokeWidth="4" strokeLinecap="round" />
        <rect x={shoulder.x - 7} y={shoulder.y - 2} width={14} height={26} rx={5} fill="#f76707" />
        <line x1={shoulder.x} y1={shoulder.y + 2} x2={hands.x} y2={hands.y} stroke="#e0a577" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx={shoulder.x} cy={shoulder.y - 10} r={7.5} fill="#f1c7a1" />
        <path d={`M${shoulder.x - 8},${shoulder.y - 13} q8,-10 16,0 z`} fill="#1a6fe0" />
        <path d={`M${shoulder.x + 4},${shoulder.y - 13} h7`} stroke="#1a6fe0" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* 낚싯대 + 릴 */}
      <path d={`M${hands.x},${hands.y} Q${rodCtrl.x.toFixed(1)},${rodCtrl.y.toFixed(1)} ${tip.x.toFixed(1)},${tip.y.toFixed(1)}`} fill="none" stroke="#1f2937" strokeWidth="2.6" strokeLinecap="round" />
      <g transform={`translate(${hands.x + 2},${hands.y + 6})`}>
        <circle r={5} fill="#cfd6de" stroke="#5b6574" />
        <line x1={0} y1={0} x2={4 * Math.cos(pose.reeling ? t * 14 : 0.6)} y2={4 * Math.sin(pose.reeling ? t * 14 : 0.6)} stroke="#1f2937" strokeWidth="1.6" />
      </g>

      {/* 치수선 (실제 높이) */}
      {pose.marks?.map((m) => (
        <g key={m.label} className="cv-mark">
          <line x1={m.x} x2={m.x} y1={m.y1} y2={m.y2} stroke="#ffd43b" strokeWidth="1.6" />
          <line x1={m.x - 4} x2={m.x + 4} y1={m.y1} y2={m.y1} stroke="#ffd43b" strokeWidth="1.6" />
          <line x1={m.x - 4} x2={m.x + 4} y1={m.y2} y2={m.y2} stroke="#ffd43b" strokeWidth="1.6" />
          <Label x={m.side === "r" ? m.x + 6 : m.x - 6} y={(m.y1 + m.y2) / 2} text={m.label} anchor={m.side === "r" ? "start" : "end"} dark />
        </g>
      ))}
      {pose.callout && <Label x={pose.callout.x} y={pose.callout.y} text={pose.callout.text} anchor="start" />}
      <text x={W - 6} y={waterY + 14} textAnchor="end" fontSize="12" fill="#e6f3ff" opacity="0.9">물속</text>
    </>
  );
}

function Label({ x, y, text, anchor, dark }: { x: number; y: number; text: string; anchor: "start" | "end"; dark?: boolean }) {
  const w = Math.max(24, [...text].reduce((a, c) => a + (/[가-힣]/.test(c) ? 12 : 7), 10));
  const rx = anchor === "end" ? x - w : x;
  const cx = Math.min(W - w - 2, Math.max(2, rx));
  y = Math.min(H - 12, Math.max(12, y));
  return (
    <g>
      <rect x={cx} y={y - 10} width={w} height={19} rx={9} fill={dark ? "rgba(8,24,56,0.85)" : "#fff"} stroke={dark ? "none" : "#18253d"} strokeWidth="1" />
      <text x={cx + w / 2} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={dark ? "#ffd43b" : "#18253d"}>{text}</text>
    </g>
  );
}

function Rig({ shape, pose, up }: { shape: RigShape; pose: Pose; up: P }) {
  const a = pose.anchor;
  const perp = { x: -up.y, y: up.x };
  const along = (d: number, side = 0): P => ({ x: a.x + up.x * d + perp.x * side, y: a.y + up.y * d + perp.y * side });
  const sinker = <path d={`M${a.x - 4},${a.y} L${a.x + 4},${a.y} L${a.x + 3},${a.y + 11} L${a.x - 3},${a.y + 11} Z`} fill="#8b939e" stroke="#4b5563" strokeWidth="0.8" />;
  const hookAt = (p: P, key: string) => (
    <g key={key}>
      <path d={`M${p.x},${p.y} v4 a2.4,2.4 0 0 1 -4.8,0`} fill="none" stroke="#e9ecef" strokeWidth="1.2" />
      <circle cx={p.x - 2} cy={p.y + 5} r={2} fill="#ff8fab" />
    </g>
  );
  const branch = (d: number, key: string, side = 8) => {
    const s = along(d);
    const e = along(d, side);
    return (
      <g key={key}>
        <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#e9ecef" strokeWidth="1" />
        {hookAt(e, key + "h")}
      </g>
    );
  };
  const egiShape = (p: P, ang: number, key: string, s = 1) => (
    <g key={key} transform={`translate(${p.x},${p.y}) rotate(${ang}) scale(${s})`}>
      <path d="M0,0 q9,-4 16,1 q-7,5 -16,2 z" fill="#ff922b" stroke="#c2410c" strokeWidth="0.6" />
      <path d="M16,1 l4,-2 m-4,2 l4,2" stroke="#e9ecef" strokeWidth="0.9" />
    </g>
  );
  switch (shape) {
    case "bottom":
      return <g>{branch(12, "b1")}{branch(24, "b2", -8)}{sinker}</g>;
    case "downshot": {
      const s = along(26);
      const e = along(26, 9);
      return (
        <g>
          <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#e9ecef" strokeWidth="1" />
          <path d={`M${e.x},${e.y} q6,-3 11,1`} stroke="#51cf66" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {sinker}
        </g>
      );
    }
    case "egi-boat": {
      const s = along(14);
      const e = along(14, 10);
      return (
        <g>
          <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#e9ecef" strokeWidth="1" />
          {egiShape(e, 0, "e", 0.9)}
          {sinker}
        </g>
      );
    }
    case "tairaba":
      return (
        <g>
          <circle cx={a.x} cy={a.y + 4} r={5} fill="#e03131" stroke="#8b1a1a" strokeWidth="0.8" />
          {[-3, -1, 1, 3].map((k) => <path key={k} d={`M${a.x + k},${a.y + 8} q${k * 1.5},6 ${k * 2.5},12`} stroke="#ff922b" strokeWidth="1.3" fill="none" />)}
        </g>
      );
    case "float": {
      const f = pose.float!;
      const b = pose.bait!;
      const sub = { x: f.x + (b.x - f.x) * 0.35, y: f.y + (b.y - f.y) * 0.35 };
      const shot = { x: f.x + (b.x - f.x) * 0.82, y: f.y + (b.y - f.y) * 0.82 };
      return (
        <g>
          <line x1={f.x} y1={f.y + 6} x2={b.x} y2={b.y} stroke="#e9ecef" strokeWidth="1" />
          <rect x={sub.x - 3} y={sub.y - 6} width={6} height={12} rx={1.5} fill="#495057" />
          <circle cx={shot.x} cy={shot.y} r={2.6} fill="#495057" />
          {hookAt(b, "fh")}
          <g transform={`translate(${f.x},${f.y}) rotate(${f.tilt}) scale(1.4)`}>
            <ellipse cx={0} cy={-3} rx={4.5} ry={7} fill="#fa5252" />
            <ellipse cx={0} cy={3} rx={4.5} ry={4} fill="#fff" />
            <line x1={0} y1={-10} x2={0} y2={-15} stroke="#ffd43b" strokeWidth="2" />
          </g>
        </g>
      );
    }
    case "jig": {
      const ang = pose.lureAngle ?? 0;
      return (
        <g transform={`translate(${a.x},${a.y}) rotate(${ang})`}>
          <path d="M0,0 q8,-2 14,3" stroke="#69db7c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx={0} cy={0} r={2.8} fill="#adb5bd" stroke="#495057" strokeWidth="0.6" />
        </g>
      );
    }
    case "egi":
      return egiShape(a, pose.lureAngle ?? 0, "egi", 1.1);
    case "sabiki":
      return (
        <g>
          {[8, 16, 24, 32, 40].map((d, i) => {
            const s = along(d);
            const e = along(d, i % 2 ? -6 : 6);
            return (
              <g key={d}>
                <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#e9ecef" strokeWidth="0.9" />
                <circle cx={e.x} cy={e.y} r={1.8} fill="#fcc419" />
              </g>
            );
          })}
          <rect x={a.x - 4} y={a.y} width={8} height={11} rx={2} fill="#ffd8a8" stroke="#c2410c" strokeWidth="0.8" />
        </g>
      );
  }
}

function Fish({ shape, color, f, t }: { shape: FishShape; color: string; f: NonNullable<Pose["fish"]>; t: number }) {
  const n = f.count ?? 1;
  const wig = f.hooked ? Math.sin(t * 18) * 3 : Math.sin(t * 6) * 1.2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const ox = n > 1 ? (i % 2 ? -1 : 1) * (6 + i * 5) : 0;
        const oy = n > 1 ? i * 9 : 0;
        return (
          <g key={i} transform={`translate(${f.x + ox},${f.y + oy + (f.hooked ? wig * 0.3 : 0)}) scale(${(f.flip ? -f.scale : f.scale) * 1.3},${f.scale * 1.3}) rotate(${wig})`}>
            {shape === "fish" && (
              <>
                <path d="M-12,0 q12,-9 22,0 q-10,9 -22,0 z" fill={color} />
                <path d="M-12,0 l-7,-6 v12 z" fill={color} />
                <circle cx={6} cy={-1.5} r={1.5} fill="#fff" />
                <circle cx={6.3} cy={-1.5} r={0.8} fill="#111" />
              </>
            )}
            {shape === "flat" && (
              <>
                <ellipse cx={0} cy={0} rx={14} ry={5.5} fill={color} />
                <path d="M-14,0 l-6,-4 v8 z" fill={color} />
                <circle cx={-3} cy={-1} r={1.2} fill="#3d2e1c" />
                <circle cx={3} cy={1.5} r={1} fill="#3d2e1c" />
                <circle cx={9} cy={-2} r={1.4} fill="#fff" />
              </>
            )}
            {shape === "octopus" && (
              <>
                <ellipse cx={0} cy={-6} rx={7} ry={8} fill={color} />
                {[-6, -2, 2, 6].map((k) => <path key={k} d={`M${k * 0.8},0 q${k},8 ${k * 1.6 + Math.sin(t * 5 + k) * 2},14`} stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" />)}
                <circle cx={-2.5} cy={-5} r={1.3} fill="#fff" />
                <circle cx={2.5} cy={-5} r={1.3} fill="#fff" />
              </>
            )}
            {shape === "squid" && (
              <>
                <path d="M-14,0 q14,-8 20,0 q-6,8 -20,0 z" fill={color} />
                <path d="M-14,0 l-5,-5 v10 z" fill={color} opacity="0.8" />
                {[-2, 0, 2].map((k) => <path key={k} d={`M6,${k} q6,${k} 12,${k * 2 + Math.sin(t * 6 + k)}`} stroke={color} strokeWidth="1.6" fill="none" />)}
                <circle cx={3} cy={-1.5} r={1.4} fill="#111" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
