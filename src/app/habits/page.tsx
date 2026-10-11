import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { EVIDENCE, HABITS, MOVE_INFO, type Evidence, type Move } from "@/data/habits";
import { metaOf } from "@/data/fishMeta";
import { SPECIES } from "@/data/species";
import { closedRow, seasonRow, spawnRow } from "@/lib/habits";
import { og } from "@/lib/site";

const TITLE = "어종 습성 한눈에";
const DESC = "25종의 사는 곳·움직임(정착·계절 이동·회유)·산란기·번식 특징을 출처와 함께 정리하고, 제철·산란기·금어기를 한 해 달력으로 비교했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🧬 ${TITLE} · 피싱체크`, DESC, "/habits") };
// '이번 달'을 요청 시각 기준으로
export const dynamic = "force-dynamic";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const MOVES: Move[] = ["정착", "계절 이동", "회유"];

const FIVE: { n: string; habit: string; decides: string; href: string; label: string }[] = [
  { n: "🪨", habit: "사는 곳(바닥·깊이)", decides: "어디에 내릴지 — 바위 고기는 바위 옆, 모래 고기는 모래 위", href: "/structures", label: "구조물별 서식" },
  { n: "🧭", habit: "움직임(정착·회유)", decides: "언제 올지 — 회유 고기는 들어오는 철에만, 정착 고기는 자리를 찾으면 오래", href: "#h-move", label: "움직임별 어종" },
  { n: "🕒", habit: "활동 시간(낮·밤·물때)", decides: "몇 시에 갈지 — 밤 고기는 밤에, 물 흐름 따라 먹는 고기는 물돌이에", href: "/tide", label: "물때표" },
  { n: "🍽", habit: "먹이", decides: "무엇을 달지 — 평소 먹는 것과 닮은 미끼·루어", href: "/fish/rockfish#feed", label: "먹이 습성 예시" },
  { n: "🥚", habit: "번식(산란기)", decides: "시즌과 규칙 — 산란 전후로 연안에 붙고, 금어기는 어미를 지키는 기간", href: "#h-year", label: "한 해 달력" },
];

export default function HabitsPage() {
  const month = Number(new Date(Date.now() + 9 * 3600e3).toISOString().slice(5, 7));
  const list = [...SPECIES].sort((a, b) => metaOf(a.id).popular - metaOf(b.id).popular);
  const rows = list.map((s) => ({ s, h: HABITS[s.id], season: seasonRow(s), spawn: spawnRow(HABITS[s.id]), closed: closedRow(s.regulation) }));
  const nowSeason = rows.filter((r) => r.season[month - 1] === "peak");
  const nowSpawn = rows.filter((r) => r.spawn[month - 1]);
  const nowClosed = rows.filter((r) => r.closed[month - 1]);
  const evCount = (Object.keys(EVIDENCE) as Evidence[]).filter((e) => e !== "추론").map((e) => ({ e, n: Object.values(HABITS).reduce((a, h) => a + h.src.filter((x) => x[2] === e).length, 0) }));

  const names = (rs: typeof rows, extra?: (r: (typeof rows)[number]) => string) =>
    rs.length ? (
      <ul className="hb-names">
        {rs.map((r) => (
          <li key={r.s.id}>
            <Link href={`/fish/${r.s.id}#feed`} className="mini-chip blue">
              {r.s.name}
              {extra && extra(r) && <span className="hb-names-x">{extra(r)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    ) : (
      <p className="small muted" style={{ margin: 0 }}>없어요</p>
    );

  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🧬 어종 습성 한눈에" />
      <p style={{ margin: 0 }}>
        고기의 <b>습성</b>을 알면 &lsquo;어디서·언제·무엇으로&rsquo;가 정해져요. 25종의 사는 곳·움직임·산란기를 <b>출처와 근거 수준</b>을 붙여 정리했어요. 자료마다 다른 값은 하나로 고르지 않고 함께 적었어요.
      </p>
      <nav className="chips" aria-label="이 화면 목차">
        <a href="#h-five" className="chip2">습성 → 낚시</a>
        <a href="#h-now" className="chip2">{month}월에는</a>
        <a href="#h-year" className="chip2">한 해 달력</a>
        <a href="#h-move" className="chip2">움직임별</a>
        <a href="#h-trait" className="chip2">번식 특징</a>
        <Link href="/methods" className="chip2">낚시 방법 ›</Link>
      </nav>

      <section id="h-five" aria-labelledby="h-five-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-five-h" style={{ fontSize: "1.05rem", margin: 0 }}>1. 습성 다섯 가지가 낚시를 정해요</h2>
        <ul className="hb-five">
          {FIVE.map((f) => (
            <li key={f.habit}>
              <span className="n" aria-hidden>{f.n}</span>
              <span className="small">
                <b>{f.habit}</b> → {f.decides}{" "}
                {f.href.startsWith("#") ? <a href={f.href} className="link">{f.label}</a> : <Link href={f.href} className="link">{f.label} ›</Link>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="h-now" aria-labelledby="h-now-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-now-h" style={{ fontSize: "1.05rem", margin: 0 }}>2. 이번 달({month}월)에는</h2>
        <div className="hb-now">
          <div>
            <h3>🎣 가장 잘 잡히는 철</h3>
            {names(nowSeason)}
          </div>
          <div>
            <h3>🥚 산란·출산 무렵</h3>
            {names(nowSpawn, (r) => (r.spawn[month - 1] === "maybe" ? "(어림)" : ""))}
            <p className="small muted" style={{ margin: "6px 0 0" }}>알을 밴 큰 개체는 놓아 주면 다음 해 자원에 도움이 돼요.</p>
          </div>
          <div>
            <h3>⛔ 금어기가 걸린 달</h3>
            {names(nowClosed, (r) => `(${r.closed[month - 1]!.text})`)}
            <p className="small muted" style={{ margin: "6px 0 0" }}>지역 예외·최신 공고는 어종 화면에서 확인하세요.</p>
          </div>
        </div>
      </section>

      <section id="h-year" aria-labelledby="h-year-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-year-h" style={{ fontSize: "1.05rem", margin: 0 }}>3. 한 해 달력 — 제철 · 산란 · 금어기</h2>
        <p className="small muted" style={{ margin: 0 }}>칸 색: 제철(진할수록 잘 잡힘) · 가운데 점: 산란·출산기 · 아래 빨간 줄: 금어기. 이름을 누르면 어종 습성으로 가요.</p>
        <div className="st-table-wrap" role="region" aria-label="어종별 한 해 달력 (옆으로 밀어서 보기)" tabIndex={0}>
          <table className="hb-mx">
            <caption className="vh">어종별 월별 제철·산란기·금어기</caption>
            <colgroup>
              <col className="hb-mx-name" />
              <col span={12} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col"><span className="vh">어종</span></th>
                {MONTHS.map((m) => (
                  <th key={m} scope="col" className={m === month ? "now" : undefined}>
                    {m}
                    <span className="vh">월</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, season, spawn, closed }) => (
                <tr key={s.id}>
                  <th scope="row">
                    <Link href={`/fish/${s.id}#feed`}>{s.name}</Link>
                  </th>
                  {MONTHS.map((m, i) => {
                    const sr = [
                      season[i] === "peak" ? "제철 절정" : season[i] === "on" ? "제철" : "",
                      spawn[i] === "main" ? "주 산란기" : spawn[i] === "on" ? "산란기" : spawn[i] === "maybe" ? "산란 어림" : "",
                      closed[i] ? `금어기 ${closed[i]!.text}` : "",
                    ].filter(Boolean).join(", ");
                    return (
                      <td key={m} className={`${season[i] ?? ""}${m === month ? " now" : ""}`}>
                        {spawn[i] && <i className={`hb-dot ${spawn[i] === "main" ? "" : spawn[i]}`} aria-hidden />}
                        {closed[i] && <i className={`hb-bar ${closed[i]!.kind === "part" ? "part" : ""}`} aria-hidden />}
                        <span className="vh">{sr || "-"}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hb-legend small muted">
          <span><i className="hb-k season on" aria-hidden />잡힘</span>
          <span><i className="hb-k season peak" aria-hidden />가장 잘 잡힘</span>
          <span><i className="hb-k spawn main" aria-hidden style={{ borderRadius: "50%", width: 10, height: 10 }} />주 산란기</span>
          <span><i className="hb-k spawn on" aria-hidden style={{ borderRadius: "50%", width: 10, height: 10 }} />산란기</span>
          <span><i className="hb-dot-k" aria-hidden />간접 근거로 어림</span>
          <span><i className="hb-k closed full" aria-hidden style={{ height: 4 }} />금어기(점선: 달의 일부)</span>
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          제철은 피싱체크 점수의 월별 시즌 값, 산란기는 아래 출처, 금어기는 해양수산부 공고 기준 데이터예요. 가자미·부시리는 우리 바다 산란 자료를 찾지 못해 비워 두었어요.
        </p>
      </section>

      <section id="h-move" aria-labelledby="h-move-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-move-h" style={{ fontSize: "1.05rem", margin: 0 }}>4. 움직임으로 나누면</h2>
        <ul className="hb-groups">
          {MOVES.map((mv) => {
            const g = rows.filter((r) => r.h?.move?.kind === mv);
            return (
              <li key={mv} className="card stack" style={{ gap: 6 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>{mv}</h3>
                <p className="small muted" style={{ margin: 0 }}>{MOVE_INFO[mv]}</p>
                {names(g, (r) => (r.h?.move?.src === "추론" ? "(추론)" : ""))}
                <p className="small" style={{ margin: 0 }}>
                  {mv === "정착" && "→ 자리(바위·석축)를 찾으면 오래 노릴 수 있어요. 입질이 없으면 바위 줄기를 따라 옮겨요."}
                  {mv === "계절 이동" && "→ 철 따라 얕은 곳·깊은 곳이 바뀌어요. 같은 장소라도 계절마다 노릴 깊이가 달라요."}
                  {mv === "회유" && "→ 떼가 들어온 철에만 잘 잡혀요. 들어왔다는 소식(조황)과 수온을 먼저 확인해요."}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="small muted" style={{ margin: 0 }}>
          나머지 어종은 움직임을 분명히 적은 자료를 찾지 못해 분류하지 않았어요. &lsquo;(추론)&rsquo;은 사는 곳 자료로부터 앱이 분류한 것이에요.
        </p>
      </section>

      <section id="h-trait" aria-labelledby="h-trait-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-trait-h" style={{ fontSize: "1.05rem", margin: 0 }}>5. 알아 두면 좋은 번식 특징</h2>
        <ul className="st-why">
          {rows
            .filter((r) => r.h?.trait)
            .map((r) => (
              <li key={r.s.id}>
                <Link href={`/fish/${r.s.id}#feed`} className="link"><b>{r.s.name}</b></Link> — {r.h!.trait}
              </li>
            ))}
        </ul>
        <p className="small" style={{ margin: 0 }}>
          새끼를 낳거나(난태생) 알을 지키는 고기, 1년만 사는 오징어·문어류는 산란기에 어미를 많이 잡으면 다음 해 자원이 크게 줄어요. 그래서 금어기·금지체장이 정해져 있어요.
        </p>
      </section>

      <section aria-labelledby="h-ev-h" className="card stack" style={{ gap: 6 }}>
        <h2 id="h-ev-h" style={{ fontSize: "1rem", margin: 0 }}>근거 수준 표시</h2>
        <ul className="st-why">
          {(Object.keys(EVIDENCE) as Evidence[]).map((e) => (
            <li key={e}>
              <span className={`mini-chip ${EVIDENCE[e].tone}`}>{EVIDENCE[e].label}</span> {EVIDENCE[e].desc}
              {e !== "추론" && <span className="muted"> · 출처 {evCount.find((x) => x.e === e)?.n ?? 0}개</span>}
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ margin: 0 }}>
          출처는 웹 검색으로 확인한 요약이에요(원문 일부 미열람). 해역·연도·조사 방법에 따라 값이 다를 수 있어요. 틀린 내용을 보시면 도움말의 &lsquo;다른 질문 보내기&rsquo;로 알려 주세요.
        </p>
      </section>
    </div>
  );
}
