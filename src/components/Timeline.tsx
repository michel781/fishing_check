"use client";

import { useMemo, useState } from "react";
import type { HourScore, TideExtreme, TidePoint } from "@/lib/types";
import { dirLabel, fmt, GRADE_ICON, kstHM, kstHour } from "@/lib/format";

export type TimelineHour = Pick<
  HourScore,
  "time" | "score" | "grade" | "safety" | "safetyReasons" | "reasons" | "tideCm" | "tidePhase" | "sub"
> & {
  windMs: number | null;
  windDir: number | null;
  waveM: number | null;
  wavePeriodS: number | null;
  seaTempC: number | null;
  precipMm: number | null;
};

interface Props {
  hours: TimelineHour[];
  tide: TidePoint[];
  extremes: TideExtreme[];
  sunrise: string;
  sunset: string;
  dayStart: string; // ISO (KST 00:00)
  initialIndex: number;
  /** 오늘이면 현재 시각(ISO). 지난 시간은 흐리게, "지금" 선 표시 */
  now?: string;
}

const GRADE_LABEL = { BEST: "최고", GOOD: "좋음", FAIR: "보통", POOR: "나쁨", BAD: "비추천", DANGER: "위험" } as const;
const SUB_LABEL: Record<keyof TimelineHour["sub"], string> = {
  tide: "물때·물흐름",
  wind: "바람",
  wave: "파도",
  temp: "수온",
  light: "시간대",
  pressure: "기압",
  spot: "포인트 궁합",
};
const PHASE_LABEL = { FLOOD: "들물(밀물)", EBB: "썰물", SLACK: "물돌이(정조)" } as const;

const W = 400;
const PADL = 26;
const PADR = 6;
const BAR_H = 96;
const TIDE_TOP = BAR_H + 50;
const TIDE_H = 70;
const H = TIDE_TOP + TIDE_H + 34;

function seqColor(score: number): string {
  if (score >= 80) return "var(--seq-5)";
  if (score >= 65) return "var(--seq-4)";
  if (score >= 50) return "var(--seq-3)";
  if (score >= 35) return "var(--seq-2)";
  return "var(--seq-1)";
}

export function Timeline({ hours, tide, extremes, sunrise, sunset, dayStart, initialIndex, now }: Props) {
  const [sel, setSel] = useState(initialIndex);
  const [table, setTable] = useState(false);
  const start = Date.parse(dayStart);
  const span = 24 * 3600 * 1000;
  const x = (t: number) => PADL + ((t - start) / span) * (W - PADL - PADR);
  const slot = (W - PADL - PADR) / 24;

  const tidePts = useMemo(() => tide.filter((p) => {
    const t = Date.parse(p.time);
    return t >= start && t <= start + span;
  }), [tide, start, span]);
  const tMin = tidePts.length ? Math.min(...tidePts.map((p) => p.cm)) : 0;
  const tMax = tidePts.length ? Math.max(...tidePts.map((p) => p.cm)) : 1;
  const ty = (cm: number) => TIDE_TOP + TIDE_H - ((cm - tMin) / Math.max(1, tMax - tMin)) * TIDE_H;
  const tidePath = tidePts.map((p, i) => `${i ? "L" : "M"}${x(Date.parse(p.time)).toFixed(1)},${ty(p.cm).toFixed(1)}`).join("");
  const tideArea = tidePts.length
    ? `${tidePath}L${x(Date.parse(tidePts[tidePts.length - 1].time)).toFixed(1)},${TIDE_TOP + TIDE_H}L${x(Date.parse(tidePts[0].time)).toFixed(1)},${TIDE_TOP + TIDE_H}Z`
    : "";

  const nowMs = now ? Date.parse(now) : null;
  const nowIn = nowMs != null && nowMs >= start && nowMs < start + span;
  const sr = Date.parse(sunrise);
  const ss = Date.parse(sunset);
  const h = hours[sel];
  const cursorX = h ? x(Date.parse(h.time)) + slot / 2 : 0;
  const dayEx = extremes.filter((e) => {
    const t = Date.parse(e.time);
    return t >= start && t < start + span;
  });

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setSel((s) => Math.min(hours.length - 1, s + 1));
    if (e.key === "ArrowLeft") setSel((s) => Math.max(0, s - 1));
  };

  return (
    <div className="stack">
      <div className="between">
        <h2>시간대별 점수 · 조위</h2>
        <button className="btn" onClick={() => setTable((v) => !v)} aria-pressed={table}>
          {table ? "차트로 보기" : "표로 보기"}
        </button>
      </div>

      {table ? (
        <div style={{ overflowX: "auto" }}>
          <table className="data num">
            <thead>
              <tr><th>시각</th><th>점수</th><th>물</th><th>조위</th><th>바람</th><th>파고</th><th>수온</th></tr>
            </thead>
            <tbody>
              {hours.map((r, i) => (
                <tr key={r.time} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
                  <td>{kstHM(r.time)}</td>
                  <td className={`g-${r.grade}`}>{GRADE_ICON[r.grade]} {r.score}</td>
                  <td>{r.tidePhase ? PHASE_LABEL[r.tidePhase] : "-"}</td>
                  <td>{fmt(r.tideCm, 0, "cm")}</td>
                  <td>{dirLabel(r.windDir)} {fmt(r.windMs, 0, "m/s")}</td>
                  <td>{fmt(r.waveM, 1, "m")}</td>
                  <td>{fmt(r.seaTempC, 1, "℃")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <svg
            className="viz"
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label="시간대별 낚시 점수 막대와 조위 곡선. 좌우 화살표로 시간 이동"
            tabIndex={0}
            onKeyDown={onKey}
          >
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--critical)" opacity="0.35" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--critical)" strokeWidth="3" />
              </pattern>
            </defs>

            {/* 야간 음영 */}
            {sr > start && <rect className="night" x={PADL} y={0} width={Math.max(0, x(sr) - PADL)} height={H - 18} />}
            {ss < start + span && <rect className="night" x={x(ss)} y={0} width={Math.max(0, W - PADR - x(ss))} height={H - 18} />}

            {/* 점수 축 */}
            {[0, 50, 100].map((v) => (
              <g key={v}>
                <line className="grid" x1={PADL} x2={W - PADR} y1={BAR_H - (v / 100) * BAR_H} y2={BAR_H - (v / 100) * BAR_H} />
                <text x={PADL - 6} y={BAR_H - (v / 100) * BAR_H + 4} textAnchor="end">{v}</text>
              </g>
            ))}

            {hours.map((r, i) => {
              const bx = x(Date.parse(r.time)) + 1;
              const bh = Math.max(3, (r.score / 100) * BAR_H);
              const danger = r.safety === "DANGER";
              const past = nowIn && Date.parse(r.time) + 3600e3 <= nowMs!;
              return (
                <g
                  key={r.time}
                  className="hourbtn"
                  onClick={() => setSel(i)}
                  onMouseEnter={() => setSel(i)}
                  opacity={past ? 0.35 : 1}
                >
                  <title>{`${kstHM(r.time)} ${r.score}점 ${GRADE_LABEL[r.grade]}${past ? " (지난 시간)" : ""}`}</title>
                  <rect className="hit" x={bx - 1} y={0} width={slot} height={H - 18} fill="transparent" />
                  <rect
                    x={bx}
                    y={danger ? 0 : BAR_H - bh}
                    width={Math.max(2, slot - 2)}
                    height={danger ? BAR_H : bh}
                    rx={4}
                    fill={danger ? "url(#hatch)" : seqColor(r.score)}
                    opacity={i === sel ? 1 : 0.85}
                  />
                </g>
              );
            })}

            {/* 조위 */}
            <text x={PADL} y={BAR_H + 30} style={{ fill: "var(--text-secondary)" }}>조위</text>
            <line className="grid" x1={PADL} x2={W - PADR} y1={TIDE_TOP + TIDE_H} y2={TIDE_TOP + TIDE_H} />
            {tideArea && <path className="tide-area" d={tideArea} />}
            {tidePath && <path className="tide-line" d={tidePath} />}
            {dayEx.map((e) => (
              <g key={e.time}>
                <circle cx={x(Date.parse(e.time))} cy={ty(e.cm)} r={4} fill="var(--tide)" stroke="var(--surface-1)" strokeWidth={2} />
                <text
                  x={x(Date.parse(e.time))}
                  y={e.type === "HIGH" ? ty(e.cm) - 8 : ty(e.cm) + 14}
                  textAnchor="middle"
                  style={{ fill: "var(--text-secondary)", fontWeight: 600 }}
                >
                  {e.type === "HIGH" ? "▲" : "▼"}{kstHM(e.time)}
                </text>
              </g>
            ))}

            {/* 시간 축 */}
            {[0, 6, 12, 18, 24].map((hh) => (
              <text key={hh} x={x(start + hh * 3600e3)} y={H - 4} textAnchor="middle">{String(hh).padStart(2, "0")}</text>
            ))}
            {sr > start && sr < start + span && <text x={x(sr)} y={BAR_H + 16} textAnchor="middle">☀ {kstHM(sunrise)}</text>}
            {ss > start && ss < start + span && <text x={x(ss)} y={BAR_H + 16} textAnchor="middle">☾ {kstHM(sunset)}</text>}

            {nowIn && (
              <g>
                <line x1={x(nowMs!)} x2={x(nowMs!)} y1={0} y2={H - 18} stroke="var(--critical)" strokeWidth={2} />
                <text x={x(nowMs!) + 3} y={11} style={{ fill: "var(--critical-text)", fontWeight: 700 }}>지금</text>
              </g>
            )}
            {h && <line className="cursor" x1={cursorX} x2={cursorX} y1={0} y2={H - 18} />}
          </svg>
          <div className="legend" aria-hidden>
            <span><i style={{ background: "var(--seq-1)" }} />낮음</span>
            <span><i style={{ background: "var(--seq-3)" }} />보통</span>
            <span><i style={{ background: "var(--seq-5)" }} />높음</span>
            <span><i style={{ background: "repeating-linear-gradient(45deg, var(--critical) 0 3px, transparent 3px 6px)" }} />⚠ 위험</span>
            <span><i style={{ background: "var(--tide)" }} />조위</span>
            <span><i style={{ background: "var(--text-primary)", opacity: 0.1 }} />야간</span>
            {nowIn && <span><i style={{ background: "var(--critical)", width: 3 }} />지금</span>}
          </div>
        </div>
      )}

      {h && <HourDetail h={h} />}
    </div>
  );
}

function HourDetail({ h }: { h: TimelineHour }) {
  const hr = kstHour(h.time);
  return (
    <div className="card" style={{ background: "var(--surface-2)" }} aria-live="polite">
      <div className="between">
        <strong className="num">{String(hr).padStart(2, "0")}:00 – {String((hr + 1) % 24).padStart(2, "0")}:00</strong>
        <span className={`badge g-${h.grade}`}>
          <span aria-hidden>{GRADE_ICON[h.grade]}</span> {GRADE_LABEL[h.grade]} <span className="num">{h.score}</span>
        </span>
      </div>
      {h.safetyReasons.length > 0 && (
        <p className={`small g-${h.safety === "DANGER" ? "DANGER" : "FAIR"}`} style={{ margin: "8px 0 0" }}>
          ⚠ {h.safetyReasons.join(" · ")}
        </p>
      )}
      <div className="kv num" style={{ marginTop: 10 }}>
        <div><div className="k">물</div><div className="v">{h.tidePhase ? PHASE_LABEL[h.tidePhase] : "-"}</div></div>
        <div><div className="k">조위</div><div className="v">{fmt(h.tideCm, 0, "cm")}</div></div>
        <div><div className="k">바람</div><div className="v">{dirLabel(h.windDir)} {fmt(h.windMs, 0, "m/s")}</div></div>
        <div><div className="k">파고·주기</div><div className="v">{fmt(h.waveM, 1, "m")} · {fmt(h.wavePeriodS, 0, "s")}</div></div>
        <div><div className="k">수온</div><div className="v">{fmt(h.seaTempC, 1, "℃")}</div></div>
        <div><div className="k">강수</div><div className="v">{fmt(h.precipMm, 1, "mm")}</div></div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        {h.reasons.map((r) => (
          <span key={r.label} className={`chip ${r.effect > 0 ? "pos" : r.effect < 0 ? "neg" : ""}`}>{r.label}</span>
        ))}
      </div>
      <details style={{ marginTop: 10 }}>
        <summary className="sub" style={{ cursor: "pointer" }}>점수 구성 보기</summary>
        <ul className="list" style={{ marginTop: 8 }}>
          {(Object.keys(SUB_LABEL) as (keyof TimelineHour["sub"])[]).map((k) => (
            <li key={k} className="row small" style={{ flexWrap: "nowrap" }}>
              <span style={{ width: 84, flex: "none" }} className="sub">{SUB_LABEL[k]}</span>
              <span style={{ flex: 1, height: 8, background: "var(--surface-1)", borderRadius: 4, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${Math.round(h.sub[k] * 100)}%`, background: "var(--seq-3)", borderRadius: 4 }} />
              </span>
              <span className="num" style={{ width: 32, textAlign: "right" }}>{Math.round(h.sub[k] * 100)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
