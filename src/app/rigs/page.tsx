import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { RigDiagram } from "@/components/RigDiagram";
import { RigPicker } from "@/components/RigPicker";
import { termById } from "@/data/gearTerms";
import { FAMILY_INFO, RIGS, type Family, type Rig } from "@/data/rigs";
import { getSpecies } from "@/data/species";
import { og } from "@/lib/site";

const TITLE = "채비 도감";
const DESC = "바닥 가지채비·유동 봉돌·선상·다운샷·반유동·전유동·막대찌·카드·지그헤드·노싱커·미노우·메탈지그·타이라바·에깅·봉돌+에기·오징어 뿔까지, 채비 16종의 구성·원리·쓰는 법·장단점을 그림으로 정리했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🪝 ${TITLE} · 피싱체크`, DESC, "/rigs") };

const FAMILIES: Family[] = ["바닥", "찌", "여러 바늘", "루어", "오징어·문어"];
const SLUG: Record<Family, string> = { 바닥: "bottom", 찌: "float", "여러 바늘": "multi", 루어: "lure", "오징어·문어": "cephalopod" };
const LEVEL = ["", "쉬움", "보통", "어려움"];
const SNAG = ["", "낮음", "보통", "높음"];
const dots = (n: number) => "●".repeat(n) + "○".repeat(3 - n);

function RigCard({ r }: { r: Rig }) {
  return (
    <li id={`rig-${r.id}`} className="card stack rig-card" style={{ gap: 10 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{r.name}</h3>
        {r.aka && <p className="small muted" style={{ margin: "2px 0 0" }}>{r.aka}</p>}
      </div>
      <div className="tags">
        <span className="mini-chip">{r.layer.join("·")}</span>
        <span className="mini-chip">{r.place.join(" / ")}</span>
        <span className="mini-chip">{r.bait}</span>
        <span className={`mini-chip ${r.level === 1 ? "green" : r.level === 3 ? "orange" : "blue"}`} aria-label={`난이도 ${LEVEL[r.level]}`}>난이도 {LEVEL[r.level]}</span>
        <span className="mini-chip" aria-label={`밑걸림 ${SNAG[r.snag]}`}>밑걸림 {SNAG[r.snag]}</span>
      </div>
      <div className="rig-body">
        <div className="rig-fig">
          <RigDiagram kind={r.diagram.kind} title={r.name} variant={r.diagram.variant} />
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <div>
            <h4 className="rig-h">구성 (위 → 아래)</h4>
            <ol className="rig-parts">
              {r.parts.map((p) => (
                <li key={p.name}>
                  {p.term && termById(p.term) ? <Link href={`/gear#t-${p.term}`} className="link">{p.name}</Link> : p.name}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h4 className="rig-h">왜 이렇게 생겼나</h4>
            <p className="small" style={{ margin: 0 }}>{r.principle}</p>
          </div>
        </div>
      </div>
      <div>
        <h4 className="rig-h">쓰는 법</h4>
        <ol className="rig-how small">
          {r.how.map((h) => <li key={h}>{h}</li>)}
        </ol>
      </div>
      <div className="rig-pc">
        <div>
          <h4 className="rig-h">좋은 점</h4>
          <ul className="small">{r.pros.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <h4 className="rig-h">아쉬운 점</h4>
          <ul className="small">{r.cons.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
      <p className="small gear-miss" style={{ margin: 0 }}><b>자주 하는 실수</b> {r.mistakes.join(" · ")}</p>
      {r.species.length > 0 ? (
        <p className="small" style={{ margin: 0 }}>
          <b>이 채비로 낚는 어종</b>{" "}
          {r.species.map((sp, i) => (
            <span key={sp}>
              {i > 0 && " · "}
              <Link href={`/fish/${sp}#how`} className="link">{getSpecies(sp)?.name ?? sp}</Link>
            </span>
          ))}
          <span className="muted"> — 어종 화면에서 실제 치수·릴 감기·장비 가격까지</span>
        </p>
      ) : (
        r.useFor && <p className="small" style={{ margin: 0 }}><b>언제 쓰나</b> {r.useFor}</p>
      )}
    </li>
  );
}

export default function RigsPage() {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🪝 채비 도감" />
      <p style={{ margin: 0 }}>
        채비 모양은 <b>고기가 먹는 깊이(층)</b>, <b>장소(바닥 재질·물살)</b>, <b>미끼 종류</b>가 정해요. 바닥 고기는 봉돌로 바닥에, 중층 고기는 찌로 그 깊이에, 떼 고기는 바늘 여러 개로, 쫓는 고기는 움직이는 루어로 노려요.
      </p>
      <nav className="chips" aria-label="이 화면 목차">
        <a href="#rig-pick" className="chip2">채비 고르기</a>
        <a href="#rig-table" className="chip2">한눈에 비교</a>
        {FAMILIES.map((f) => (
          <a key={f} href={`#fam-${SLUG[f]}`} className="chip2">{FAMILY_INFO[f].icon} {f}</a>
        ))}
      </nav>

      <section id="rig-pick" aria-labelledby="rig-pick-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="rig-pick-h" style={{ fontSize: "1.05rem", margin: 0 }}>채비 고르기</h2>
        <RigPicker />
      </section>

      <section id="rig-table" aria-labelledby="rig-table-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="rig-table-h" style={{ fontSize: "1.05rem", margin: 0 }}>한눈에 비교 ({RIGS.length}종)</h2>
        <div className="st-table-wrap" role="region" aria-label="채비 비교 표 (옆으로 밀어서 보기)" tabIndex={0}>
          <table className="st-table">
            <thead>
              <tr>
                <th scope="col">채비</th><th scope="col">층</th><th scope="col">장소</th><th scope="col">미끼</th><th scope="col">난이도</th><th scope="col">밑걸림</th><th scope="col">대표 어종</th>
              </tr>
            </thead>
            <tbody>
              {RIGS.map((r) => (
                <tr key={r.id}>
                  <th scope="row"><a href={`#rig-${r.id}`} className="link">{r.name}</a></th>
                  <td>{r.layer.join("·")}</td>
                  <td>{r.place.join(", ")}</td>
                  <td>{r.bait}</td>
                  <td><span aria-hidden>{dots(r.level)} </span>{LEVEL[r.level]}</td>
                  <td><span aria-hidden>{dots(r.snag)} </span>{SNAG[r.snag]}</td>
                  <td>{r.species.map((s) => getSpecies(s)?.name).join(", ") || "응용"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {FAMILIES.map((f) => (
        <section key={f} id={`fam-${SLUG[f]}`} aria-labelledby={`fam-h-${SLUG[f]}`} className="stack" style={{ gap: 10, scrollMarginTop: 80 }}>
          <h2 id={`fam-h-${SLUG[f]}`} style={{ fontSize: "1.05rem", margin: 0 }}>
            <span aria-hidden>{FAMILY_INFO[f].icon}</span> {f} 채비
          </h2>
          <p className="small muted" style={{ margin: 0 }}>{FAMILY_INFO[f].desc}</p>
          <ul className="rig-list">
            {RIGS.filter((r) => r.family === f).map((r) => <RigCard key={r.id} r={r} />)}
          </ul>
        </section>
      ))}

      <p className="small muted" style={{ margin: 0 }}>
        그림은 이해를 돕기 위해 비율을 줄였어요. 실제 줄 굵기·바늘·봉돌 크기는 어종 화면의 &lsquo;실제 치수&rsquo;를 보세요. 부품 이름을 누르면 <Link href="/gear" className="link">장비·용어</Link> 설명으로 가요.
      </p>
    </div>
  );
}
