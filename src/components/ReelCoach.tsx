"use client";

import { useEffect, useRef, useState } from "react";
import type { Act } from "@/data/retrieve";

export interface CoachStep {
  act: Act;
  secMid: number;
  tpsMid: number | null;
  turns?: [number, number];
  note: string;
}

const KEY = "fc:reel-cm";
const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}분 ${Math.round(s % 60)}초` : `${Math.ceil(s)}초`);

/**
 * 따라하기: 한 주기를 실제 시간으로 보여준다. 감는 단계에서는 핸들 1바퀴마다 박자(숫자)를 센다.
 * 계산기: 내 릴의 '핸들 1회전당 감기는 길이'로 cm/초를 계산한다.
 */
export function ReelCoach({ steps, activeTps, hookedTps }: { steps: CoachStep[]; activeTps: number | null; hookedTps: number | null }) {
  const [cm, setCm] = useState(75);
  const [run, setRun] = useState(false);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [beat, setBeat] = useState(0);
  const t0 = useRef(0);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(KEY));
      if (v >= 30 && v <= 200) setCm(v);
    } catch {}
  }, []);
  const saveCm = (v: number) => {
    setCm(v);
    try {
      localStorage.setItem(KEY, String(v));
    } catch {}
  };

  useEffect(() => {
    if (!run) return;
    t0.current = performance.now();
    setLeft(steps[i].secMid);
    setBeat(0);
    const id = window.setInterval(() => {
      const el = (performance.now() - t0.current) / 1000;
      const s = steps[i];
      setLeft(Math.max(0, s.secMid - el));
      if (s.tpsMid) setBeat(Math.floor(el * s.tpsMid));
      if (el >= s.secMid) setI((k) => (k + 1) % steps.length);
    }, 100);
    return () => window.clearInterval(id);
  }, [run, i, steps]);

  const cur = steps[i];
  const turnsMid = cur.turns ? (cur.turns[0] + cur.turns[1]) / 2 : null;

  return (
    <div className="reel-coach stack" style={{ gap: 10 }}>
      <div className="reel-calc">
        <label htmlFor="reel-cm" className="small reel-lbl">
          <span>
            내 릴 <b>핸들 1회전당 감기는 길이</b> (릴 상자·설명서의 &lsquo;최대 권사 길이&rsquo;)
          </span>
        </label>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <input id="reel-cm" type="number" inputMode="numeric" min={30} max={200} step={1} value={cm} onChange={(e) => saveCm(Math.max(30, Math.min(200, Number(e.target.value) || 75)))} />
          <span className="small">cm</span>
        </div>
        <p className="small" style={{ margin: 0 }}>
          {activeTps ? (
            <>
              감는 동작: 핸들 <b className="num">{activeTps}바퀴/초</b> ≈ <b className="num">{Math.round(activeTps * cm)}cm/초</b>
            </>
          ) : (
            <>이 어종은 계속 감는 동작이 없어요. 멈춤·기다림이 중심이에요.</>
          )}
          {hookedTps ? (
            <>
              {" "}· 입질 뒤: 핸들 <b className="num">{hookedTps}바퀴/초</b> ≈ <b className="num">{Math.round(hookedTps * cm)}cm/초</b>
            </>
          ) : null}
        </p>
        <p className="small muted" style={{ margin: 0 }}>모르면 75cm(흔한 2500번 스피닝 릴 정도)로 계산해요. 같은 바퀴 수라도 이 값이 크면 더 빨리 감겨요.</p>
      </div>

      <div className="reel-play" aria-live="polite">
        <div className="between">
          <strong>따라하기</strong>
          <button
            type="button"
            className={`btn small${run ? "" : " primary"}`}
            onClick={() => {
              if (!run) setI(0);
              setRun(!run);
            }}
          >
            {run ? "■ 멈추기" : "▶ 시작"}
          </button>
        </div>
        {run ? (
          <div className={`reel-now act-${cur.act}`}>
            <span className="reel-act">{cur.act}</span>
            <span className="reel-left num">{fmt(left)}</span>
            {cur.tpsMid ? (
              <span className="reel-beat">
                <i className="reel-handle" style={{ animationDuration: `${1 / cur.tpsMid}s` }} aria-hidden />
                <b className="num">{beat}</b> 바퀴 <span className="small muted">(1초에 {cur.tpsMid}바퀴)</span>
              </span>
            ) : turnsMid ? (
              <span className="small">핸들 {cur.turns![0] === cur.turns![1] ? cur.turns![0] : `${cur.turns![0]}~${cur.turns![1]}`}바퀴</span>
            ) : null}
            <span className="small">{cur.note}</span>
            <span className="small muted">
              {i + 1}/{steps.length}단계 · 다음: {steps[(i + 1) % steps.length].act}
            </span>
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>시작을 누르면 한 주기를 실제 시간대로 안내하고, 감는 단계에서는 핸들 바퀴를 세어 줘요. 화면을 켠 채 따라 해 보세요.</p>
        )}
      </div>
    </div>
  );
}
