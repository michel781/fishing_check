"use client";

import { useState } from "react";
import { TWELFTHS } from "@/data/tideTerms";
import { splitStages } from "@/lib/tideTable";

const M = 60e3;
const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
};
const hm = (ms: number) => {
  const t = Math.round(ms / M);
  const d = ((t % 1440) + 1440) % 1440;
  return `${String(Math.floor(d / 60)).padStart(2, "0")}:${String(d % 60).padStart(2, "0")}${t >= 1440 ? "(다음날)" : ""}`;
};
const dur = (min: number) => `${Math.floor(min / 60)}시간${min % 60 ? ` ${min % 60}분` : ""}`;

/** 물때표 계산기: 간조(만조)와 다음 만조(간조) 시각으로 초·중·끝과 정조, 1/12 법칙 비율을 계산 */
export function TideCalc() {
  const [rising, setRising] = useState(true);
  const [a, setA] = useState("06:00");
  const [b, setB] = useState("12:12");
  const s0 = toMin(a);
  let e0 = toMin(b);
  if (e0 <= s0) e0 += 1440;
  const gapMin = e0 - s0;
  const ok = Number.isFinite(gapMin) && gapMin >= 180 && gapMin <= 540;
  const st = ok ? splitStages(s0 * M, e0 * M, rising) : null;
  const first = rising ? "간조" : "만조";
  const second = rising ? "만조" : "간조";
  const exact = st ? st.thirds[0] : null;
  const diff = exact ? Math.round((exact.end - st!.rough[1]) / M) : 0;
  const total = TWELFTHS.reduce((x, y) => x + y, 0);

  return (
    <div className="tcalc stack" style={{ gap: 10 }}>
      <div className="tcalc-mode" role="group" aria-label="계산할 물">
        <button type="button" className="chip2" aria-pressed={rising} onClick={() => setRising(true)}>들물 (간조 → 만조)</button>
        <button type="button" className="chip2" aria-pressed={!rising} onClick={() => setRising(false)}>날물 (만조 → 간조)</button>
      </div>
      <div className="tcalc-in">
        <label>
          <span>{first} 시각</span>
          <input type="time" value={a} onChange={(e) => setA(e.target.value)} />
        </label>
        <span aria-hidden className="tcalc-arrow">→</span>
        <label>
          <span>다음 {second} 시각</span>
          <input type="time" value={b} onChange={(e) => setB(e.target.value)} />
        </label>
      </div>
      {!ok || !st ? (
        <p className="small" role="status" style={{ margin: 0 }}>두 시각의 간격이 3~9시간이 아니에요. 물때표에서 {first} 다음에 오는 {second} 시각을 넣어 주세요.</p>
      ) : (
        <div className="stack" style={{ gap: 8 }} aria-live="polite">
          <p className="small" style={{ margin: 0 }}>간격 <b className="num">{dur(st.gapMin)}</b> ÷ 3 = 한 단계 <b className="num">{dur(Math.round(st.gapMin / 3))}</b></p>
          <ol className="tcalc-out">
            <li className="slack"><b>정조</b><span className="num">{hm(st.slackStart[0])}~{hm(st.slackStart[1])}</span><span className="small muted">{first} 앞뒤 — 물이 거의 안 움직여요</span></li>
            {st.thirds.map((t, i) => (
              <li key={t.stage} className={rising ? "up" : "down"}>
                <b>{t.stage}{!rising && ` (${["초", "중", "끝"][i]}날물)`}</b>
                <span className="num">{hm(t.start)}~{hm(t.end)}</span>
                <span className="small muted">{["물이 움직이기 시작 — 많은 낚시인이 꼽는 시간", "물살이 가장 셈 — 채비를 무겁게", `${second} 직전 — 흐름이 다시 느려져요`][i]}</span>
              </li>
            ))}
            <li className="slack"><b>정조</b><span className="num">{hm(st.slackEnd[0])}~{hm(st.slackEnd[1])}</span><span className="small muted">{second} 앞뒤</span></li>
          </ol>
          <p className="small" style={{ margin: 0 }}>
            어림셈 &lsquo;{first} + 2시간&rsquo;이면 <b className="num">{hm(st.rough[0])}~{hm(st.rough[1])}</b>, 실제 간격으로 나누면 <b className="num">{hm(exact!.start)}~{hm(exact!.end)}</b>
            {diff !== 0 ? ` (${Math.abs(diff)}분 ${diff > 0 ? "더 길어요" : "더 짧아요"})` : " (같아요)"}.
          </p>
          <div>
            <p className="small" style={{ margin: "0 0 4px" }}><b>12분의 1 법칙</b> — 간격을 6칸으로 나눴을 때 칸마다 바뀌는 물 높이(어림)</p>
            <ol className="tcalc-12">
              {TWELFTHS.map((v, i) => {
                const s1 = s0 * M + ((gapMin * M) / 6) * i;
                return (
                  <li key={i}>
                    <span className="num">{hm(s1)}~</span>
                    <span className="tcalc-bar" aria-hidden><i className={rising ? "up" : "down"} style={{ width: `${(v / 3) * 100}%` }} /></span>
                    <b className="num">{Math.round((v / total) * 100)}%</b>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
