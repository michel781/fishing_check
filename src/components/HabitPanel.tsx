import Link from "next/link";
import { EVIDENCE, FACT_LABEL, MOVE_INFO, factEvidence, type Habit } from "@/data/habits";
import { closedRow, seasonRow, spawnRow } from "@/lib/habits";
import { josa } from "@/lib/push/plan";
import type { Species } from "@/lib/types";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function Ev({ h, src }: { h: Habit; src: number[] | Parameters<typeof factEvidence>[1] }) {
  const ev = factEvidence(h, src);
  const info = EVIDENCE[ev];
  return (
    <span className="hb-ev">
      <span className={`mini-chip ${info.tone}`} title={info.desc}>{info.label}</span>
      {Array.isArray(src) &&
        src.map((i) => (
          <a key={i} href={`#hb-src-${i}`} className="hb-ref" aria-label={`출처 ${i + 1}: ${h.src[i][0]}`}>
            [{i + 1}]
          </a>
        ))}
    </span>
  );
}

/** 한 해 달력: 제철 · 산란(출산) · 금어기 — 같은 달에 겹치는지 한눈에 */
export function HabitCalendar({ s, h, month }: { s: Species; h?: Habit; month: number }) {
  const season = seasonRow(s);
  const spawn = spawnRow(h);
  const closed = closedRow(s.regulation);
  const spawnName = h?.spawn?.label ?? "산란";
  const hasClosed = closed.some(Boolean);
  return (
    <div className="hb-cal-wrap">
      <table className="hb-cal">
        <caption className="vh">{s.name} 한 해 달력 — 제철, {spawnName}, 금어기</caption>
        <thead>
          <tr>
            <th scope="col"><span className="vh">구분</span></th>
            {MONTHS.map((m) => (
              <th key={m} scope="col" className={m === month ? "now" : undefined} aria-current={m === month ? "date" : undefined}>
                {m}
                <span className="vh">월{m === month ? " (이번 달)" : ""}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">제철</th>
            {season.map((v, i) => (
              <td key={i} className={`hb-c season ${v ?? ""}${i + 1 === month ? " now" : ""}`}>
                <span className="vh">{v === "peak" ? "가장 잘 잡힘" : v === "on" ? "잡힘" : "-"}</span>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">{spawnName}</th>
            {spawn.map((v, i) => (
              <td key={i} className={`hb-c spawn ${v ?? ""}${i + 1 === month ? " now" : ""}`}>
                <span className="vh">{v === "main" ? `주 ${spawnName}기` : v === "on" ? `${spawnName}기` : v === "maybe" ? `${spawnName} 추정` : "-"}</span>
              </td>
            ))}
          </tr>
          {hasClosed && (
            <tr>
              <th scope="row">금어기</th>
              {closed.map((v, i) => (
                <td key={i} className={`hb-c closed ${v?.kind ?? ""}${i + 1 === month ? " now" : ""}`} title={v?.text}>
                  <span className="vh">{v ? `금어기 ${v.text}` : "-"}</span>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      <p className="hb-legend small muted">
        <span><i className="hb-k season peak" aria-hidden />가장 잘 잡힘</span>
        <span><i className="hb-k season on" aria-hidden />잡힘</span>
        {h?.spawn?.main && <span><i className="hb-k spawn main" aria-hidden />주 {spawnName}기</span>}
        {h?.spawn && h.spawn.sure !== false && <span><i className="hb-k spawn on" aria-hidden />{spawnName}기</span>}
        {h?.spawn?.sure === false && <span><i className="hb-k spawn maybe" aria-hidden />간접 근거로 어림</span>}
        {hasClosed && <span><i className="hb-k closed full" aria-hidden />금어기(빗금: 달의 일부)</span>}
      </p>
    </div>
  );
}

/** 어종 습성: 사실 카드 → 한 해 달력 → 그래서 이렇게 낚아요 → 출처 */
export function HabitPanel({ s, h, month }: { s: Species; h: Habit; month: number }) {
  const sp = h.spawn;
  const spawnName = sp?.label ?? "산란";
  const closed = closedRow(s.regulation).filter(Boolean);
  const overlap = sp ? sp.m.filter((m) => closedRow(s.regulation)[m - 1]) : [];
  return (
    <section className="card stack hb" style={{ gap: 12 }} aria-labelledby="hb-h">
      <h2 id="hb-h" className="info-h" style={{ marginTop: 0 }}>
        <span className="dot" aria-hidden>🧬</span>
        {josa(s.name, "은", "는")} 이렇게 살아요
      </h2>
      <div className="feed-chips">
        {h.move && (
          <span className="feed-chip">
            <small>움직임{factEvidence(h, h.move.src) === "추론" ? " (추론)" : ""}</small>
            <b>{h.move.kind}</b>
          </span>
        )}
        {h.trait && (
          <span className="feed-chip">
            <small>번식 특징</small>
            <b>{h.trait}</b>
          </span>
        )}
        <span className="feed-chip">
          <small>{spawnName}기</small>
          <b>{sp ? `${sp.m.map((m) => `${m}월`).join("·")}${sp.sure === false ? " (어림)" : ""}` : "미확인"}</b>
        </span>
      </div>
      {h.move && <p className="small muted" style={{ margin: 0 }}>{h.move.kind}: {MOVE_INFO[h.move.kind]}</p>}

      <ul className="hb-facts">
        {h.facts.map(([k, text, src, vary], i) => (
          <li key={i}>
            <span className="hb-k-l"><span aria-hidden>{FACT_LABEL[k].icon}</span> {FACT_LABEL[k].label}</span>
            <span className="hb-v">
              {text} <Ev h={h} src={src} />
              {vary && <span className="hb-vary">⚖ 자료마다 다름 — {vary}</span>}
            </span>
          </li>
        ))}
      </ul>

      <div className="stack" style={{ gap: 6 }}>
        <h3 className="st-sub" style={{ margin: 0 }}>한 해 달력 — 제철 · {spawnName} · 금어기</h3>
        <HabitCalendar s={s} h={h} month={month} />
        {sp?.vary && <p className="small muted" style={{ margin: 0 }}>⚖ {spawnName}기 자료마다 다름: {sp.vary}</p>}
        {overlap.length > 0 && (
          <p className="small" style={{ margin: 0 }}>
            🛡 {spawnName}기({overlap.map((m) => `${m}월`).join("·")})가 금어기와 겹쳐요 — 금어기는 알을 낳는 어미를 지키려고 정해요.
          </p>
        )}
        {closed.length > 0 && overlap.length === 0 && sp && (
          <p className="small muted" style={{ margin: 0 }}>금어기와 {spawnName}기가 달력상 겹치지 않아요. 금어기는 해역·어업 실정에 맞춰 정해져 있어요.</p>
        )}
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <h3 className="st-sub" style={{ margin: 0 }}>그래서 이렇게 낚아요</h3>
        <ol className="hb-so">
          {h.so.map(([because, so]) => (
            <li key={because}>
              <span className="hb-because">{because}</span>
              <span className="hb-arrow" aria-hidden>→</span>
              <span className="hb-then">{so}</span>
            </li>
          ))}
        </ol>
        <p className="small muted" style={{ margin: 0 }}>왼쪽은 위 사실, 오른쪽은 그 사실을 낚시에 연결한 요령이에요. &lsquo;추론&rsquo;·&lsquo;현장 요령&rsquo;은 자료로 확인한 사실이 아니에요.</p>
      </div>

      {h.note && <p className="small" style={{ margin: 0 }}>📌 {h.note}</p>}

      <details className="tide-more">
        <summary>출처 {h.src.length}개 · 근거 수준 보기</summary>
        <ol className="hb-src small">
          {h.src.map(([title, url, ev], i) => (
            <li key={url + i} id={`hb-src-${i}`}>
              <span className={`mini-chip ${EVIDENCE[ev].tone}`}>{EVIDENCE[ev].label}</span>{" "}
              <a href={url} target="_blank" rel="noreferrer" className="link">{title}</a>
            </li>
          ))}
        </ol>
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          출처는 웹 검색으로 확인한 요약이에요(원문 일부 미열람). 해역·연도·조사 방법에 따라 값이 다를 수 있어요. 학명 <i>{h.sci}</i>. 습성 전체 비교는 <Link href="/habits" className="link">어종 습성 한눈에</Link>.
        </p>
      </details>
    </section>
  );
}
