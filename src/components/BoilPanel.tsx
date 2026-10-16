"use client";

import { useState } from "react";
import { BOIL_SIGNS, BOIL_SRC, BOIL_TIPS } from "@/data/boil";

const LEVEL = ["", "약함", "있음", "아주 높음"];

/** 새떼·보일링 판독: 지금 보이는 신호를 고르면 뜻과 할 일 */
export function BoilPanel() {
  const [id, setId] = useState<string | null>(null);
  const sel = BOIL_SIGNS.find((s) => s.id === id);
  return (
    <section className="card stack bo" style={{ gap: 12 }} aria-labelledby="bo-h">
      <h2 id="bo-h" className="info-h" style={{ marginTop: 0 }}>
        <span className="dot" aria-hidden>👀</span>새떼·보일링부터 찾아요
      </h2>
      <p className="small" style={{ margin: 0 }}>
        삼치는 수면 가까이에서 멸치 같은 작은 고기 떼를 쫓아 먹어요. 그래서 <b>갈매기 떼</b>와 <b>보일링</b>(수면이 끓듯 튀는 것)이 삼치가 있는 곳을 알려 주는 가장 확실한 신호예요.
      </p>
      <fieldset className="bo-pick">
        <legend className="small"><b>지금 바다에 뭐가 보이나요?</b></legend>
        {BOIL_SIGNS.map((s) => (
          <label key={s.id} className={id === s.id ? "on" : undefined}>
            <input type="radio" name="bo" value={s.id} checked={id === s.id} onChange={() => setId(s.id)} />
            <span aria-hidden>{s.icon}</span> {s.see}
          </label>
        ))}
      </fieldset>
      <div aria-live="polite">
        {sel && (
          <div className={`bo-res lv${sel.level}`}>
            <p style={{ margin: 0 }}>
              <b>삼치 가능성 {LEVEL[sel.level]}</b> <span className={`mini-chip ${sel.ev === "현장" ? "orange" : ""}`}>{sel.ev === "현장" ? "현장 경험" : "추론"}</span>
            </p>
            <p className="small" style={{ margin: "4px 0 0" }}>{sel.means}</p>
            <p className="small" style={{ margin: "4px 0 0" }}><b>지금 할 일</b> {sel.act}</p>
          </div>
        )}
      </div>
      <ul className="st-why">
        {BOIL_TIPS.map((t) => (
          <li key={t.text}>
            {t.text}{" "}
            {t.src.map((i) => (
              <a key={i} href={BOIL_SRC[i][1]} target="_blank" rel="noreferrer" className="hb-ref" aria-label={`출처: ${BOIL_SRC[i][0]}`}>[{i + 1}]</a>
            ))}
          </li>
        ))}
      </ul>
      <p className="small muted" style={{ margin: 0 }}>
        앱은 새떼·보일링을 직접 볼 수 없어요. 포인트 화면의 &lsquo;살필 시간&rsquo;에 맞춰 도착해 먼저 바다를 둘러보세요. 출처는 낚시 매체·커뮤니티 검색 요약이에요(원문 미열람).
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
