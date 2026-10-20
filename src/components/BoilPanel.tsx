"use client";

import { useState } from "react";
import { BOIL_SIGNS, BOIL_SRC, BOIL_TIPS, PHASE_INFO, PHASE_SRC, SCAN, SPECIES_NOTE, type PhaseId } from "@/data/boil";

const LEVEL = ["", "약함", "있음", "아주 높음"];
const EV = { 현장: { t: "현장 경험", c: "orange" }, 사실: { t: "사실(백과)", c: "green" }, 추론: { t: "추론", c: "" } } as const;
const PHASES: PhaseId[] = ["am", "day", "pm"];

function Refs({ src }: { src: number[] }) {
  return (
    <>
      {src.map((i) => (
        <a key={i} href={BOIL_SRC[i][1]} target="_blank" rel="noreferrer" className="hb-ref" aria-label={`출처: ${BOIL_SRC[i][0]}`}>[{i + 1}]</a>
      ))}
    </>
  );
}

/** 회유어 신호 판독: 관찰 순서 → 지금 보이는 신호 → 시간대별 길목 → 물때 궁합 */
export function BoilPanel({ speciesId, name }: { speciesId: string; name: string }) {
  const [id, setId] = useState<string | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const sel = BOIL_SIGNS.find((s) => s.id === id);
  const toggle = (i: number) => setDone((d) => { const n = new Set(d); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <section className="card stack bo" style={{ gap: 14 }} aria-labelledby="bo-h">
      <h2 id="bo-h" className="info-h" style={{ marginTop: 0 }}>
        <span className="dot" aria-hidden>👀</span>{name}, 들어왔는지 먼저 확인해요
      </h2>
      <p className="small" style={{ margin: 0 }}>
        {name}처럼 떼 지어 돌아다니는 회유어는 늘 연안에 있지 않아요. <b>하늘(새)</b>, <b>수면(보일링·라이징)</b>, <b>먹잇감(멸치 떼)</b>, <b>지형(포말·조경 띠)</b>을 함께 보고, <b>시간대·물때</b>를 맞춰야 만나요.
      </p>

      <div>
        <h3 className="rig-h">1. 도착하면 먼저 — 관찰 순서</h3>
        <ul className="bo-scan">
          {SCAN.map((t, i) => (
            <li key={t}>
              <label>
                <input type="checkbox" checked={done.has(i)} onChange={() => toggle(i)} /> {t}
              </label>
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ margin: "4px 0 0" }}>{done.size}/{SCAN.length} 확인 <Refs src={[10]} /></p>
      </div>

      <fieldset className="bo-pick">
        <legend className="rig-h">2. 지금 바다에 뭐가 보이나요?</legend>
        {BOIL_SIGNS.map((s) => (
          <label key={s.id} className={id === s.id ? "on" : undefined}>
            <input type="radio" name="bo" value={s.id} checked={id === s.id} onChange={() => setId(s.id)} />
            <span aria-hidden>{s.icon}</span>
            <span><span className="small muted">{s.group} · </span>{s.see}</span>
          </label>
        ))}
      </fieldset>
      <div aria-live="polite">
        {sel && (
          <div className={`bo-res lv${sel.level}`}>
            <p style={{ margin: 0 }}>
              <b>{name} 가능성 {LEVEL[sel.level]}</b> <span className={`mini-chip ${EV[sel.ev].c}`}>{EV[sel.ev].t}</span> <Refs src={sel.src} />
            </p>
            <p className="small" style={{ margin: "4px 0 0" }}>{sel.means}</p>
            <p className="small" style={{ margin: "4px 0 0" }}><b>지금 할 일</b> {sel.act}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="rig-h">3. 시간대별 길목 <Refs src={PHASE_SRC} /></h3>
        <ul className="bo-phases">
          {PHASES.map((p) => (
            <li key={p}>
              <b>{PHASE_INFO[p].label}</b> <span className="small muted">{PHASE_INFO[p].when}</span>
              <span className="small"><b>어디로</b> {PHASE_INFO[p].where}</span>
              <span className="small muted">{PHASE_INFO[p].why}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="rig-h">4. 물때를 겹쳐요 <Refs src={[11, 12]} /></h3>
        <ul className="st-why">
          <li><b>가장 좋음</b> — 중들물~끝들물. 물이 세게 밀려들며 회유어가 물살을 타고 연안으로 붙어요.</li>
          <li><b>좋음</b> — 초들물·만조·초썰물·중썰물. 물이 움직이는 동안이에요(만조 정점의 물 멈춤 동안은 잠시 뜸할 수 있어요).</li>
          <li><b>어려움</b> — 끝썰물·간조. 물이 빠져 연안에서 보기 힘들어요.</li>
        </ul>
        <p className="small" style={{ margin: "4px 0 0" }}>
          가장 확률 높은 조합: <b>오전 피딩 + 들물 후반 + 물살이 잘 통하는 방파제·갯바위</b>. 포인트 화면에서 {name}을(를) 고르면 그날 실제 시각과 물때로 계산해 줘요.
        </p>
        <p className="small muted" style={{ margin: "4px 0 0" }}>동해처럼 물 높이 차이가 작은 곳은 물때보다 시간대·수온·새떼를 먼저 보세요.</p>
      </div>

      {SPECIES_NOTE[speciesId] && <p className="small" style={{ margin: 0 }}>📌 {SPECIES_NOTE[speciesId]}</p>}

      {speciesId === "spanishmackerel" && (
        <ul className="st-why">
          {BOIL_TIPS.map((t) => (
            <li key={t.text}>{t.text} <Refs src={t.src} /></li>
          ))}
        </ul>
      )}

      <p className="small muted" style={{ margin: 0 }}>
        앱은 새떼·보일링을 직접 볼 수 없어요. 시간·장소·물때는 확률을 높여 줄 뿐이고, 현장 신호가 가장 정확해요. 출처는 낚시 매체·블로그(사용자 제공 포함)·백과 검색 요약이에요(원문 미열람).
      </p>
      <details className="tide-more">
        <summary>출처 {BOIL_SRC.length}개</summary>
        <ol className="hb-src small">
          {BOIL_SRC.map(([t, u]) => (
            <li key={u}><a href={u} target="_blank" rel="noreferrer" className="link">{t}</a></li>
          ))}
        </ol>
      </details>
    </section>
  );
}
