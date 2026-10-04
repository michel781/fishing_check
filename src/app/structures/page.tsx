import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { CEPHALOPODS, HARBOR_NOTES, SOURCES, STRUCTURES, type EvidenceKind, type Structure } from "@/data/structures";
import { og } from "@/lib/site";
import { HarborSection } from "@/components/HarborSection";

const TITLE = "구조물별 서식 가이드";
const DESC = "테트라포드·석축·수직벽·선착장 그늘·모래 바닥·방파제 끝·가로등 경계마다 어떤 물고기가 왜 모이고, 민장대와 원투를 어디에 내려야 하는지 근거와 함께 정리했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🧱 ${TITLE} · 피싱체크`, DESC, "/structures") };

const KIND_CLASS: Record<EvidenceKind, string> = { 생태: "blue", 현장: "green", 추론: "orange", 규정: "red" };
const FIT_CLASS = { 적합: "green", 조건부: "blue", 부적합: "orange" } as const;

function Ev({ kind }: { kind: EvidenceKind }) {
  return <span className={`mini-chip ${KIND_CLASS[kind]}`}>{kind}</span>;
}

function SourceLinks({ ids }: { ids: string[] }) {
  if (!ids.length) return <span className="small muted">문헌 근거 없음(추론)</span>;
  return (
    <span className="small">
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && " · "}
          <a href={`#src-${id}`} className="link">[{Object.keys(SOURCES).indexOf(id) + 1}]</a>
        </span>
      ))}
    </span>
  );
}

function Card({ s, k }: { s: Structure; k: number }) {
  return (
    <li id={s.id} className="card stack st-card" style={{ gap: 8, scrollMarginTop: 80 }}>
      <h3 className="st-h">
        <span className="st-n" aria-hidden>{k}</span>
        <span aria-hidden>{s.icon}</span> {s.name}
      </h3>
      <div className="tags">
        {s.fish.map((f) =>
          f.id ? (
            <Link key={f.name} href={`/fish/${f.id}#feed`} className="mini-chip blue">{f.name}</Link>
          ) : (
            <span key={f.name} className="mini-chip">{f.name}</span>
          ),
        )}
      </div>
      <dl className="st-dl">
        <dt>상주·회유</dt><dd>{s.residency}</dd>
        <dt>모이는 이유</dt><dd>{s.why}</dd>
        <dt>수층</dt><dd>{s.layer}</dd>
        <dt>낮과 밤</dt><dd>{s.dayNight}</dd>
        <dt>민장대</dt><dd><span className={`mini-chip ${FIT_CLASS[s.pole.fit]}`}>{s.pole.fit}</span> {s.pole.how}</dd>
        <dt>원투</dt><dd><span className={`mini-chip ${FIT_CLASS[s.cast.fit]}`}>{s.cast.fit}</span> {s.cast.how}</dd>
        <dt>미끼</dt><dd>{s.bait}</dd>
        <dt>밑걸림·안전</dt><dd>{s.caution}</dd>
      </dl>
      <ul className="st-ev">
        {s.evidence.map((e, i) => (
          <li key={i}><Ev kind={e.kind} /> <span className="small">{e.text}</span></li>
        ))}
      </ul>
      <p className="small muted" style={{ margin: 0 }}>근거 <SourceLinks ids={s.sources} /></p>
    </li>
  );
}

export default function StructuresPage() {
  const srcList = Object.values(SOURCES);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🧱 구조물별 서식 가이드" />
      <p className="small muted" style={{ margin: 0 }}>
        기준: 동해 북부(속초·양양) 내항 · 초보 · 민장대 1대 + 원투 1대 · 갯지렁이·오징어 살 · 10월 초 저녁·야간. 조사일 2026-10-04.
      </p>
      <div className="tags" aria-label="근거 표시">
        <span className="small">근거 표시:</span>
        <Ev kind="생태" /><span className="small muted">공공·학술 생태 자료</span>
        <Ev kind="현장" /><span className="small muted">낚시 매체 기사</span>
        <Ev kind="추론" /><span className="small muted">자료로 확인 안 된 판단</span>
        <Ev kind="규정" /><span className="small muted">법·조례</span>
      </div>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="p1">
        <h2 id="p1" style={{ fontSize: "1.05rem", margin: 0 }}>1. 원리: 은신처 · 먹이 · 물 흐름</h2>
        <ul className="st-why">
          <li><b>🏠 은신처</b> — 쥐노래미·우럭·볼락처럼 한곳에 사는 물고기는 큰 고기·새를 피할 틈이 있는 곳을 떠나지 않아요. 테트라포드·석축·벽 기초가 그 틈이에요. 그래서 이런 물고기는 구조물 &lsquo;바로 옆&rsquo;에서만 낚여요.</li>
          <li><b>🦐 먹이</b> — 구조물 표면에는 해조·홍합·따개비·작은 게가 붙고, 모래 속에는 갯지렁이·작은 갑각류가 살아요. 먹이가 다르면 오는 물고기도 달라요(돌 → 쥐노래미, 모래 → 가자미·보리멸).</li>
          <li><b>🌊 물 흐름</b> — 고등어·전갱이·학공치 같은 회유어는 한곳에 머물지 않고 먹이 떼를 따라 다녀요. 물이 잘 통하는 방파제 끝·항구 입구가 길목이고, 먹이 떼(베이트)가 들어와야 내항까지 들어와요.</li>
        </ul>
        <HarborSection />
        <ol className="hs-legend small">
          {STRUCTURES.map((st, i) => (
            <li key={st.id}>
              <span className="hs-legend-n" aria-hidden>{i + 1}</span>
              <a href={`#${st.id}`} className="link">{st.name}</a>
            </li>
          ))}
        </ol>
        <p className="small muted" style={{ margin: 0 }}>
          일반적인 사석식 방파제(바다 쪽은 테트라포드로 덮음)와 케이슨 안벽 단면을 단순화한 그림이에요. 크기·수심 비율은 실제와 다르고, 특정 항구의 모양이 아니에요. 등대는 방파제 끝에 서 있는 모습을 뒤쪽으로 겹쳐 그렸어요.
        </p>
        <h3 style={{ fontSize: "0.95rem", margin: "6px 0 0" }}>발밑과 멀리 던진 곳의 대상어가 다른 이유</h3>
        <p className="small" style={{ margin: 0 }}>
          발밑은 방파제를 만든 돌·블록·벽 기초가 이어지는 곳이라 <b>은신처를 쓰는 정착성 물고기</b>(쥐노래미·우럭·볼락)의 자리예요.
          기초가 끝나고 바닥이 평평한 모래로 바뀌는 먼 곳은 <b>바닥을 뒤지는 물고기</b>(가자미류 등)의 자리예요. 그래서 민장대는 발밑 구조물, 원투는 멀리 모래로 역할을 나누는 게 논리적이에요.
          <Ev kind="추론" />
        </p>
      </section>

      <section aria-labelledby="p2" className="stack" style={{ gap: 10 }}>
        <h2 id="p2" style={{ fontSize: "1.05rem", margin: 0 }}>2. 구조물별 비교</h2>
        <div className="st-table-wrap" role="region" aria-label="구조물별 요약 표 (옆으로 밀어서 보기)" tabIndex={0}>
          <table className="st-table">
            <thead>
              <tr><th scope="col">구조물·바닥</th><th scope="col">대표 어종</th><th scope="col">상주·회유</th><th scope="col">민장대</th><th scope="col">원투</th></tr>
            </thead>
            <tbody>
              {STRUCTURES.map((s, i) => (
                <tr key={s.id}>
                  <th scope="row"><a href={`#${s.id}`} className="link">{i + 1}. {s.name}</a></th>
                  <td>{s.fish.map((f) => f.name).join(", ")}</td>
                  <td>{s.residency}</td>
                  <td>{s.pole.fit}</td>
                  <td>{s.cast.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ol className="st-list">
          {STRUCTURES.map((s, i) => <Card key={s.id} s={s} k={i + 1} />)}
        </ol>

        <section className="card stack" style={{ gap: 8 }} aria-labelledby="ceph">
          <h3 id="ceph" className="st-h">🐙 문어·오징어류 (물고기와 따로)</h3>
          <ul className="st-ev">
            {CEPHALOPODS.map((c) => (
              <li key={c.name} className="stack" style={{ gap: 2 }}>
                <span><b>{c.name}</b> <span className="mini-chip orange">{c.fit}</span></span>
                <span className="small">{c.why}</span>
                <span className="small"><Ev kind="규정" /> {c.rule}</span>
                <span className="small muted">근거 <SourceLinks ids={c.sources} /></span>
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section className="card stack" style={{ gap: 10 }} aria-labelledby="p3">
        <h2 id="p3" style={{ fontSize: "1.05rem", margin: 0 }}>3. 현장 적용</h2>
        <h3 className="st-sub">해질녘 전에 도착해서 순서대로</h3>
        <ol className="st-steps small">
          <li><b>밝을 때 지형부터 봐요.</b> 석축이 끝나는 선, 물색이 밝은 곳(모래)과 어두운 곳(돌·해초), 가로등 위치, 배가 대는 곳·계류줄을 확인해요. 어두워지면 안 보여요.</li>
          <li><b>원투는 내항 모래 쪽에 먼저 넣어 둬요.</b> 배 다니는 길·계류줄·다른 사람 줄과 겹치지 않는 방향으로. 던진 뒤 천천히 끌어 모래(사각사각)인지 돌(툭툭)인지 느끼고, 경계를 찾으면 바로 모래 쪽에 두고 기다려요. 미끼는 갯지렁이가 우선 — 모래 바닥 물고기의 자연 먹이와 같아요.</li>
          <li><b>민장대는 발밑 구조물을 훑어요.</b> 석축 끝선·벽 기초를 따라 바닥을 찍고 살짝 든 상태로 기다렸다가, 반응이 없으면 몇 걸음씩 옮겨요. 정착성 물고기는 은신처에서 멀리 나오지 않아서, 내가 움직여야 만나요.</li>
          <li><b>어두워지면 민장대를 불빛 경계로.</b> 수면에 불빛이 닿는 선의 어두운 쪽에서, 얕은 층부터 한 뼘씩 내려가며 볼락이 있는 층을 찾아요.</li>
          <li><b>미끼 고르기.</b> 갯지렁이는 냄새·움직임이 좋아 대부분에 맞고, 오징어 살은 질겨서 잔챙이가 많을 때나 우럭에 써요. 회유어용으로는 작게 잘라야 해요.</li>
        </ol>
        <p className="small muted" style={{ margin: 0 }}>낚싯대 길이·바늘 크기·봉돌 무게는 정해 드리지 않았어요(아직 정보가 없어요). 테트라포드 위에 올라가거나 배·계류줄을 방해하는 자리는 권하지 않아요.</p>

        <h3 className="st-sub">설악항 · 물치항 · 낙산항에서 확인된 것</h3>
        <p className="small" style={{ margin: 0 }}>세 항구의 우열을 정할 근거는 찾지 못했어요. 확인된 사실과 모르는 것을 나눠 적었어요.</p>
        {Object.entries(HARBOR_NOTES).map(([id, h]) => (
          <div key={id} className="st-harbor">
            <Link href={`/spot/${id}`} className="link"><b>{h.name}</b></Link>
            <ul className="small">
              {h.confirmed.map((c, i) => (
                <li key={i}>
                  <Ev kind={SOURCES[c.source].kind} /> {c.text} <SourceLinks ids={[c.source]} />
                </li>
              ))}
              {h.unknown.map((u) => (
                <li key={u} className="muted">❔ 미확인: {u}</li>
              ))}
            </ul>
          </div>
        ))}
        <h3 className="st-sub">현장에서 보고 고르는 법</h3>
        <ul className="st-steps small">
          <li>북동풍·너울이 있는 날은 외항 쪽이 위험해요 → 바람을 등지는 내항 발판으로.</li>
          <li>내항 바닥이 모래로 보이면(밝은 물색) 원투 비중을, 석축·벽이 길게 이어지면 민장대 비중을 높여요.</li>
          <li>가로등이 수면을 비추는 평평한 발판이 있으면 밤 볼락 자리로 좋아요.</li>
          <li>출입 금지 표지판·통제선이 있으면 그 항구는 다른 곳으로. 최신 통제 구역은 항만·지자체 공고로 확인해요.</li>
          <li>속초시(설악항)에서는 문어 낚시가 조례로 금지돼 있어요.</li>
        </ul>
      </section>

      <section className="card stack" style={{ gap: 6 }} aria-labelledby="srcs">
        <h2 id="srcs" style={{ fontSize: "1rem", margin: 0 }}>근거 자료</h2>
        <p className="small muted" style={{ margin: 0 }}>
          작성일·조행일을 확인하지 못한 기사는 그렇게 적었어요. 겨울 감성돔·여름 조과 기사는 지형 설명에만 쓰고 10월 조과 근거로 쓰지 않았어요.
          일부는 원문을 열지 못하고 검색 요약으로 확인했어요(&lsquo;원문 미열람&rsquo;).
        </p>
        <ol className="st-src small">
          {srcList.map((s) => (
            <li key={s.id} id={`src-${s.id}`}>
              <Ev kind={s.kind} /> <a href={s.url} target="_blank" rel="noreferrer" className="link">{s.title}</a>
              <span className="muted"> — {s.note}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
