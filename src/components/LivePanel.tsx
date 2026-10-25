"use client";

import { useState } from "react";
import { KIND_INFO, KIND_ORDER, LIVE_AREAS, liveLinks, remoteVerdict, type LiveArea, type RemoteAnswer } from "@/data/liveView";

const QS: { key: keyof RemoteAnswer; q: string; good: boolean }[] = [
  { key: "report", q: "최근 1~2일 삼치·방어 조황 글·영상이 있나요?", good: true },
  { key: "birds", q: "영상에서 새떼가 한곳에서 돌거나 내리꽂히나요?", good: true },
  { key: "crowd", q: "영상에서 루어꾼이 한 해변·방파제에 몰려 있나요?", good: true },
  { key: "coldWater", q: "냉수대 속보가 있거나 수온이 갑자기 떨어졌나요?", good: false },
  { key: "highWave", q: "파도가 높아 보이나요(서프루어 위험)?", good: false },
];

/** 실시간 바다 보기: 지역별 바로가기(조황·유튜브 라이브·CCTV·수온·파도) + 원격 확인 → 출발 판단 */
export function LivePanel({ initial }: { initial: LiveArea }) {
  const [area, setArea] = useState<LiveArea>(initial);
  const [ans, setAns] = useState<RemoteAnswer>({});
  const links = liveLinks(area);
  const answered = Object.keys(ans).length > 0;
  const v = remoteVerdict(ans);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="mm-sys" role="group" aria-label="지역">
        {LIVE_AREAS.map((a) => (
          <button key={a} type="button" className="chip2" aria-pressed={a === area} onClick={() => setArea(a)}>{a}</button>
        ))}
      </div>
      {KIND_ORDER.map((k) => {
        const ls = links.filter((l) => l.kind === k);
        if (!ls.length) return null;
        return (
          <div key={k}>
            <h3 className="rig-h"><span aria-hidden>{KIND_INFO[k].icon}</span> {KIND_INFO[k].label}</h3>
            <p className="small muted" style={{ margin: "0 0 4px" }}>{KIND_INFO[k].what}</p>
            <ul className="lv-links">
              {ls.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noreferrer">
                    <span>{l.title} <span aria-hidden>↗</span></span>
                    {l.note && <small>{l.note}</small>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <fieldset className="lv-check">
        <legend className="rig-h">확인한 것을 고르면 출발 여부를 정리해 줘요</legend>
        {QS.map((x) => (
          <div key={x.key} className="lv-q">
            <span className="small">{x.q}</span>
            <span className="lv-yn" role="group" aria-label={x.q}>
              {[true, false].map((val) => (
                <button key={String(val)} type="button" className="chip2" aria-pressed={ans[x.key] === val} onClick={() => setAns((a) => ({ ...a, [x.key]: val }))}>
                  {val ? "예" : "아니요"}
                </button>
              ))}
            </span>
          </div>
        ))}
      </fieldset>
      <div aria-live="polite">
        {answered && (
          <div className={`bo-res ${v.level === "go" ? "lv3" : v.level === "maybe" ? "lv2" : "lv1"}`}>
            <p style={{ margin: 0 }}><b>{v.text}</b></p>
            {v.why.length > 0 && <p className="small muted" style={{ margin: "4px 0 0" }}>근거: {v.why.join(" · ")}</p>}
          </div>
        )}
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        외부 사이트·방송이라 지연되거나 멈출 수 있어요. 출발 판단은 판단 보조(추론)이고, 조황이 가장 직접적인 신호예요. 주소는 2026년 10월 검색으로 확인했어요.
      </p>
    </div>
  );
}
