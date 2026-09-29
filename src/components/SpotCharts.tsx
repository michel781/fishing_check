import { kstHM } from "@/lib/format";
import { scoreGrade } from "@/lib/grade";
import type { HourScore, TideExtreme, TidePoint } from "@/lib/types";

/** 시간대별 낚시지수: 3시간 간격 8칸 막대 */
export function HourlyChart({ hours, sunrise, sunset, now }: { hours: HourScore[]; sunrise: string; sunset: string; now: Date | null }) {
  const cols = hours.filter((_, i) => i % 3 === 0).slice(0, 8);
  if (!cols.length) return null;
  const nowMs = now?.getTime() ?? -1;
  const rise = Date.parse(sunrise);
  const set = Date.parse(sunset);
  return (
    <div className="hourly" role="img" aria-label={`시간대별 낚시지수: ${cols.map((h) => `${kstHM(h.time)} ${h.available ? `${h.score}점` : "쉬는 시간"}`).join(", ")}`}>
      {cols.map((h) => {
        const t = Date.parse(h.time);
        const cur = nowMs >= t && nowMs < t + 3 * 3600e3;
        const day = t + 90 * 60e3 >= rise && t + 90 * 60e3 < set;
        const danger = h.safety === "DANGER";
        const sc = h.available ? h.score : 0;
        const tone = danger ? "bad" : scoreGrade(sc).tone;
        return (
          <div key={h.time} className="col" aria-hidden>
            <span className="ic">{danger ? "⚠" : day ? "☀️" : "🌙"}</span>
            <span className={h.available ? `bar tone-${tone}` : "bar"} style={{ height: `${Math.max(26, (sc / 100) * 120)}px`, ...(h.available ? {} : { background: "var(--surface-2)", color: "var(--text-secondary)" }), outline: cur ? "3px solid var(--accent)" : undefined, outlineOffset: 2 }}>
              {h.available ? sc : "-"}
            </span>
            <span className={cur ? "accent-text" : undefined} style={{ fontWeight: cur ? 800 : 600 }}>{cur ? "지금" : kstHM(h.time)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** 하루 물높이 곡선 + 만조/간조 표시 */
export function TideCurve({ series, extremes, dayStart, now }: { series: TidePoint[]; extremes: TideExtreme[]; dayStart: string; now: Date | null }) {
  const t0 = Date.parse(dayStart);
  const t1 = t0 + 24 * 3600e3;
  const pts = series.filter((p) => {
    const ms = Date.parse(p.time);
    return ms >= t0 && ms <= t1;
  });
  if (pts.length < 2) return null;
  const W = 360, H = 120, PAD = 22;
  const lo = Math.min(...pts.map((p) => p.cm));
  const hi = Math.max(...pts.map((p) => p.cm));
  const x = (ms: number) => ((ms - t0) / (t1 - t0)) * W;
  const y = (cm: number) => PAD + (1 - (cm - lo) / Math.max(1, hi - lo)) * (H - PAD * 2);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(Date.parse(p.time)).toFixed(1)},${y(p.cm).toFixed(1)}`).join(" ");
  const nowMs = now?.getTime();
  const showNow = nowMs != null && nowMs >= t0 && nowMs <= t1;
  const exs = extremes.filter((e) => Date.parse(e.time) >= t0 && Date.parse(e.time) <= t1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label={`물높이 그래프: ${exs.map((e) => `${e.type === "HIGH" ? "만조" : "간조"} ${kstHM(e.time)}`).join(", ")}`}>
      <defs>
        <linearGradient id="tide-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1a6fe0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#1a6fe0" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#tide-fill)" />
      <path d={line} fill="none" stroke="#1a6fe0" strokeWidth="2.5" />
      {exs.map((e) => {
        const ex = x(Date.parse(e.time));
        const ey = y(e.cm);
        const high = e.type === "HIGH";
        return (
          <g key={e.time}>
            <circle cx={ex} cy={ey} r="4" fill={high ? "#1560cf" : "#0ca678"} />
            <text x={Math.min(W - 30, Math.max(30, ex))} y={high ? ey - 8 : ey + 16} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="currentColor">
              {`${high ? "만조" : "간조"} ${kstHM(e.time)}`}
            </text>
          </g>
        );
      })}
      {showNow && (
        <g>
          <line x1={x(nowMs!)} x2={x(nowMs!)} y1={4} y2={H} stroke="#e8590c" strokeWidth="2" strokeDasharray="4 3" />
          <text x={Math.min(W - 14, Math.max(14, x(nowMs!)))} y={H + 14} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#e8590c">지금</text>
        </g>
      )}
      {[0, 6, 12, 18].map((hh) => (
        <text key={hh} x={x(t0 + hh * 3600e3) + 2} y={H + 14} fontSize="12" fill="currentColor" opacity="0.6">{`${hh}시`}</text>
      ))}
    </svg>
  );
}
