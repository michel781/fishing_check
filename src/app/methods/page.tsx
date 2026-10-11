import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { CHOOSER, METHODS, methodById, type Method } from "@/data/methods";
import { RIGS } from "@/data/rigs";
import { getSpecies } from "@/data/species";
import { og } from "@/lib/site";

const TITLE = "낚시 방법 고르기";
const DESC = "원투·루어·찌낚시·선상·대낚시(민장대)가 각각 어떤 원리로 고기를 낚는지, 활동량·비용·난이도와 대표 어종, '이런 분께' 추천까지. 훌치기의 규정과 위험도 사실대로 정리했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🎣 ${TITLE} · 피싱체크`, DESC, "/methods") };

const MAIN = METHODS.filter((m) => m.id !== "snag");
const SNAG = methodById("snag")!;
const LV = ["", "적음", "보통", "많음"];
const COST = ["", "적게", "보통", "많이"];
const DIFF = ["", "쉬움", "보통", "어려움"];
const dots = (n: number) => "●".repeat(n) + "○".repeat(3 - n);

function Meter({ label, n, words }: { label: string; n: number; words: string[] }) {
  return (
    <span className="mt-meter">
      <small>{label}</small>
      <b><span aria-hidden className="mt-dots">{dots(n)}</span> {words[n]}</b>
    </span>
  );
}

function MethodCard({ m }: { m: Method }) {
  const rigs = m.rigs.map((id) => RIGS.find((r) => r.id === id)!).filter(Boolean);
  return (
    <li id={`m-${m.id}`} className="card stack mt-card" style={{ gap: 10 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}><span aria-hidden>{m.icon}</span> {m.name}</h3>
        <p className="small muted" style={{ margin: "2px 0 0" }}>{m.aka}</p>
        {m.badge && <span className={`mini-chip ${m.badge.tone}`} style={{ marginTop: 6 }}>{m.badge.text}</span>}
      </div>
      <p style={{ margin: 0 }}>{m.one}</p>
      <div className="mt-meters">
        <Meter label="활동량" n={m.effort} words={LV} />
        <Meter label="비용" n={m.cost} words={COST} />
        <Meter label="난이도" n={m.level} words={DIFF} />
      </div>
      <div>
        <h4 className="rig-h">왜 물까 — 원리</h4>
        <p className="small" style={{ margin: 0 }}>{m.principle}</p>
      </div>
      <div>
        <h4 className="rig-h">이렇게 해요</h4>
        <ol className="rig-how small">{m.how.map((h) => <li key={h}>{h}</li>)}</ol>
      </div>
      <p className="small" style={{ margin: 0 }}><b>미끼</b> {m.bait} · <b>장소</b> {m.place}</p>
      <div className="mt-fit">
        <div>
          <h4 className="rig-h">이런 분께</h4>
          <ul className="small">{m.fits.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
        <div>
          <h4 className="rig-h">이런 분은 다른 방법을</h4>
          <p className="small" style={{ margin: 0 }}>{m.notFor}</p>
        </div>
      </div>
      <div>
        <h4 className="rig-h">이 방법으로 낚는 고기</h4>
        <ul className="hb-names">
          {m.species.map((sp) => (
            <li key={sp}>
              <Link href={`/fish/${sp}#how`} className="mini-chip blue">{getSpecies(sp)?.name ?? sp}</Link>
            </li>
          ))}
        </ul>
        {m.notes && (
          <ul className="small mt-notes">
            {Object.entries(m.notes).map(([sp, t]) => (
              <li key={sp}><b>{getSpecies(sp)?.name}</b> — {t}</li>
            ))}
          </ul>
        )}
        {m.others && <p className="small muted" style={{ margin: "4px 0 0" }}>{m.others}</p>}
      </div>
      {rigs.length > 0 && (
        <div>
          <h4 className="rig-h">쓰는 채비</h4>
          <ul className="hb-names">
            {rigs.map((r) => (
              <li key={r.id}>
                <Link href={`/rigs#rig-${r.id}`} className="mini-chip">🪝 {r.name}</Link>
              </li>
            ))}
            {m.genre && (
              <li>
                <Link href="/gear#g-genre" className="mini-chip">🎒 장비 조합</Link>
              </li>
            )}
          </ul>
        </div>
      )}
      {m.safety && <p className="small gear-miss" style={{ margin: 0 }}><b>안전</b> {m.safety}</p>}
    </li>
  );
}

export default function MethodsPage() {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🎣 낚시 방법 고르기" />
      <p style={{ margin: 0 }}>
        낚시 방법은 <b>고기가 어디서 무엇을 먹는지</b>에 맞춰 나뉘어요. 바닥 고기는 바닥에 두고(원투), 쫓는 고기는 움직여서(루어), 중층 고기는 깊이를 맞춰(찌), 먼 곳 고기는 배로 찾아가요(선상).
      </p>
      <nav className="chips" aria-label="이 화면 목차">
        <a href="#m-choose" className="chip2">이런 분께</a>
        <a href="#m-compare" className="chip2">한눈에 비교</a>
        {METHODS.map((m) => (
          <a key={m.id} href={`#m-${m.id}`} className="chip2">{m.name}</a>
        ))}
      </nav>

      <section id="m-choose" aria-labelledby="m-choose-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="m-choose-h" style={{ fontSize: "1.05rem", margin: 0 }}>이런 분께 이런 낚시</h2>
        <ul className="mt-choose">
          {CHOOSER.map((c) => {
            const m = methodById(c.id)!;
            return (
              <li key={c.id}>
                <a href={`#m-${c.id}`}>
                  <span className="small muted">{c.want}</span>
                  <b><span aria-hidden>{m.icon}</span> {m.name}</b>
                  <span className="small">{c.why}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="m-compare" aria-labelledby="m-compare-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="m-compare-h" style={{ fontSize: "1.05rem", margin: 0 }}>한눈에 비교</h2>
        <div className="st-table-wrap" role="region" aria-label="낚시 방법 비교 표 (옆으로 밀어서 보기)" tabIndex={0}>
          <table className="st-table">
            <thead>
              <tr>
                <th scope="col">방법</th><th scope="col">활동량</th><th scope="col">비용</th><th scope="col">난이도</th><th scope="col">미끼</th><th scope="col">장소</th>
              </tr>
            </thead>
            <tbody>
              {MAIN.map((m) => (
                <tr key={m.id}>
                  <th scope="row"><a href={`#m-${m.id}`} className="link">{m.name}</a></th>
                  <td>{LV[m.effort]}</td>
                  <td>{COST[m.cost]}</td>
                  <td>{DIFF[m.level]}</td>
                  <td>{m.bait}</td>
                  <td>{m.place}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ul className="mt-list">
        {MAIN.map((m) => <MethodCard key={m.id} m={m} />)}
      </ul>

      <section id={`m-${SNAG.id}`} aria-labelledby="m-snag-h" className="card stack mt-card" style={{ gap: 10, scrollMarginTop: 80 }}>
        <div>
          <h2 id="m-snag-h" style={{ margin: 0, fontSize: "1.1rem" }}><span aria-hidden>{SNAG.icon}</span> {SNAG.name}</h2>
          <p className="small muted" style={{ margin: "2px 0 0" }}>{SNAG.aka}</p>
          {SNAG.badge && <span className={`mini-chip ${SNAG.badge.tone}`} style={{ marginTop: 6 }}>{SNAG.badge.text}</span>}
        </div>
        <p style={{ margin: 0 }}>{SNAG.one}</p>
        <p className="small" style={{ margin: 0 }}>{SNAG.principle}</p>
        <h3 className="rig-h" style={{ margin: 0 }}>규정과 위험 (확인한 것 / 못 한 것)</h3>
        <ul className="st-why">
          {SNAG.facts!.map((f) => (
            <li key={f.text}>
              {f.text}
              {f.src.map(([t, u]) => (
                <span key={u} className="mt-src small">
                  출처: <a href={u} target="_blank" rel="noreferrer" className="link">{t}</a>
                </span>
              ))}
            </li>
          ))}
        </ul>
        <p className="small gear-miss" style={{ margin: 0 }}><b>피싱체크 입장</b> {SNAG.notFor}</p>
      </section>

      <p className="small muted" style={{ margin: 0 }}>
        어종마다 맞는 방법은 어종 화면의 &lsquo;낚시 방법&rsquo; 탭에, 채비 그림은 <Link href="/rigs" className="link">채비 도감</Link>에, 고기의 사는 곳·산란기는 <Link href="/habits" className="link">어종 습성 한눈에</Link>에 있어요. 대낚시(민물)와 앱에 없는 어종(메기·장어·배스·쏘가리·꺽지·붕어·잉어·향어·대구)은 참고로만 적었어요.
      </p>
    </div>
  );
}
