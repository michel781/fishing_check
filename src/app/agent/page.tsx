import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { SimBanner } from "@/components/Badges";
import { getSpot, SPOT_TYPE_LABEL } from "@/data/spots";
import { dawnFloodPlan, type PlanCell } from "@/lib/surfPlan";
import { kstDateString } from "@/lib/engine/astro";
import { relativeDay } from "@/lib/format";
import { getSpecies } from "@/data/species";
import { BOIL_SPECIES } from "@/data/boil";
import { isPelagic } from "@/lib/pelagicAgent";
import { runPelagicAgent } from "@/lib/pelagicAgentRun";
import { LivePanel } from "@/components/LivePanel";
import { NowFinder } from "@/components/NowFinder";
import { isLiveArea } from "@/data/liveView";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TITLE = "회유어 찾기 에이전트";
const DESC = "속초·양양·강릉 워킹 포인트에서 '들물 + 새벽 동틀 무렵 + 외해 조류가 통하는 방파제·갯바위' 조합을 예보·물때·수온으로 자동으로 찾아 순위를 매겨요(시범).";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🤖 ${TITLE} · 피싱체크`, DESC, "/agent") };

type Search = Promise<{ sim?: string; simDate?: string; simHour?: string; sp?: string; area?: string; now?: string }>;
/** 2주 미리 보기 대표 포인트 (지역마다 하나) */
const PLAN_SPOTS = [
  { area: "속초", id: "sokcho-outer" },
  { area: "양양", id: "namae" },
  { area: "강릉", id: "jumunjin" },
];
const FLOOD = { best: { sym: "◎", text: "중·끝들물 겹침" }, some: { sym: "○", text: "들물 조금 겹침" }, none: { sym: "–", text: "들물 아님" } } as const;
/** 세 지역이 같으면 한 번만, 다르면 지역별로 */
function PlanCellView({ cells }: { cells: PlanCell[] }) {
  const same = cells.every((c) => c.flood === cells[0].flood);
  const one = (c: PlanCell, area?: string) => (
    <span key={area ?? "all"} className={`fl-${c.flood}`}>
      {area && <small aria-hidden>{area} </small>}
      <span aria-hidden>{FLOOD[c.flood].sym}</span>
      {c.from && <small className="num" aria-hidden> {hm(c.from)}부터</small>}
      <span className="vh">{area ? `${area} ` : ""}{FLOOD[c.flood].text}{c.from ? ` ${hm(c.from)}부터` : ""}</span>
    </span>
  );
  return <td>{same ? one(cells[0]) : cells.map((c, k) => one(c, PLAN_SPOTS[k].area))}</td>;
}
const STEPS = [
  { href: "#plan", when: "2주 전", what: "물때·해 뜨는 시각으로 날짜 고르기" },
  { href: "#top", when: "3일 전", what: "파도·바람·수온 예보를 넣은 TOP" },
  { href: "#now", when: "전날~당일", what: "한 번에 찾기(냉수대·캠 방송까지)" },
  { href: "#live", when: "출발 직전", what: "유튜브 라이브·CCTV·조황 직접 보기" },
];
const hm = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(11, 16);

export default async function AgentPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const ctx = ctxFrom(sp);
  const simQ = simQueryString(sp);
  const today = kstDateString(ctx.now);
  const only = sp.sp && isPelagic(sp.sp) ? sp.sp : undefined;
  const run = await runPelagicAgent(ctx, 3, 5, only);
  const plan = dawnFloodPlan(PLAN_SPOTS.map((x) => getSpot(x.id)!), ctx.now, 14);
  const tabHref = (id?: string) => {
    const u = new URLSearchParams(simQ);
    if (id) u.set("sp", id);
    const q = u.toString();
    return `/agent${q ? `?${q}` : ""}`;
  };
  return (
    <>
      {isSimActive(sp) && <SimBanner label={simLabel(sp)} />}
      <div className="stack" style={{ gap: 14 }}>
        <AppHead title="🤖 회유어 찾기 에이전트" />
        <section className="card stack" style={{ gap: 6 }} aria-labelledby="ag-rule-h">
          <h2 id="ag-rule-h" style={{ fontSize: "1rem", margin: 0 }}>무엇을 찾나요 <span className="mini-chip blue">{run.region} 시범 · 워킹</span></h2>
          <p style={{ margin: 0 }}><b>{run.rule}</b></p>
          <p className="small muted" style={{ margin: 0 }}>
            앞으로 3일, 워킹 포인트 {run.spots.length}곳 × 삼치·고등어·부시리 × 시간대(오전 피딩·낮·오후 피딩) {run.considered}개 후보를 예보·물때·수온으로 계산했어요. {run.formula}.
          </p>
        </section>

        <nav className="card stack" style={{ gap: 6 }} aria-labelledby="ag-order-h">
          <h2 id="ag-order-h" style={{ fontSize: "1rem", margin: 0 }}>미리 알 수 있는 순서대로</h2>
          <ol className="ag-steps">
            {STEPS.map((x, i) => (
              <li key={x.href}><a href={x.href}><span className="nw-n" aria-hidden>{i + 1}</span><span><b>{x.when}</b> {x.what}</span></a></li>
            ))}
          </ol>
          <p className="small muted" style={{ margin: 0 }}>확인하는 순서예요. 점수 계산 비중은 그대로예요.</p>
        </nav>

        <section id="plan" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }} aria-labelledby="ag-plan-h">
          <h2 id="ag-plan-h" style={{ fontSize: "1rem", margin: 0 }}>① 2주 미리 보기 — 새벽 피딩에 들물이 겹치는 날 <span className="mini-chip">천문 계산</span></h2>
          <p className="small" style={{ margin: 0 }}>
            물때와 해 뜨는 시각은 해·달 위치로 계산해서 2주 전에도 알 수 있어요. 오전 피딩(해 뜨기 30분 전~뜬 뒤 2시간)에 <b>◎ 중·끝들물</b>이 겹치는 날을 먼저 찜해 두세요.
          </p>
          <div>
            <table className="data ag-plan">
              <caption className="vh">날짜별 오전 피딩과 들물 겹침 (속초·양양·강릉 대표 포인트)</caption>
              <thead>
                <tr><th scope="col">날짜 · 오전 피딩</th><th scope="col">물때</th><th scope="col">들물 겹침</th></tr>
              </thead>
              <tbody>
                {plan.map((d) => (
                  <tr key={d.date} className={d.cells.every((c) => c.flood === "best") ? "all" : undefined}>
                    <th scope="row">{relativeDay(d.date, today)}<small className="num">{hm(d.amStart)}~{hm(d.amEnd)}</small></th>
                    <td>{d.mul}</td>
                    <PlanCellView cells={d.cells} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            ◎ 중·끝들물 겹침(시각은 피딩 안에서 들물 후반이 시작되는 때) · ○ 초들물 등 들물이 조금 겹침 · – 들물 아님. 속초·양양·강릉 대표 포인트(속초항·남애항·주문진항)가 같으면 한 번만, 다르면 지역별로 보여요. 물때 이름은 동해 관행 8물때식. 물 높이는 천문 추정 모델이라 실제 물때표와 수십 분~1시간 차이 날 수 있고, 동해는 물 높이 차이가 작아 들물 효과도 작아요. 3일 안으로 들어오면 아래 ②의 실제 예보로 다시 확인해요.
          </p>
        </section>
        <nav id="top" className="ag-tabs" aria-label="어종 고르기" style={{ scrollMarginTop: 80 }}>
          <Link href={tabHref()} className="chip2" aria-current={!only ? "true" : undefined}>전체</Link>
          {BOIL_SPECIES.map((id) => (
            <Link key={id} href={tabHref(id)} className="chip2" aria-current={only === id ? "true" : undefined}>{getSpecies(id)?.name}</Link>
          ))}
        </nav>

        <section aria-labelledby="ag-top-h" className="stack" style={{ gap: 10 }}>
          <h2 id="ag-top-h" style={{ fontSize: "1.05rem", margin: 0 }}>② 앞으로 3일 추천 조합 TOP {run.picks.length} <span className="mini-chip">예보 반영</span></h2>
          {!run.picks.length && <p className="sub">지금은 낚시할 수 있는 후보가 없어요(바람·파도 위험이거나 예보를 불러오지 못했어요).</p>}
          <ol className="ag-list">
            {run.picks.map((p, i) => {
              const u = new URLSearchParams(simQ);
              u.set("species", p.speciesId);
              u.set("day", p.date);
              return (
                <li key={`${p.spotId}${p.date}${p.phase}`} className="card stack" style={{ gap: 8 }}>
                  <div className="between">
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                      <span className="ag-rank" aria-label={`${i + 1}위`}>{i + 1}</span> {p.spotName}
                    </h3>
                    <b className="num ag-score" aria-label={`에이전트 점수 ${p.agentScore}`}>{p.agentScore}</b>
                  </div>
                  <p className="small" style={{ margin: 0 }}>
                    <b>{relativeDay(p.date, today)} {p.phaseLabel} {hm(p.start)}~{hm(p.end)}</b> · {p.speciesName} · {p.area} {SPOT_TYPE_LABEL[p.spotType]} · 앱 점수 최고 <b className="num">{p.appScore}</b>점({hm(p.bestHour)})
                  </p>
                  <ul className="ag-checks">
                    {p.checks.map((c) => (
                      <li key={c.key} className={c.ok ? "ok" : "no"}>
                        <span aria-hidden>{c.ok ? "✓" : "✗"}</span>
                        <span><b>{c.label}</b> <span className="small muted">{c.detail}</span></span>
                        <span className="vh">{c.ok ? "맞음" : "아님"}</span>
                      </li>
                    ))}
                  </ul>
                  {p.warnings.map((w) => <p key={w} className="small gear-miss" style={{ margin: 0 }}>⚠ {w}</p>)}
                  <div className="tags">
                    <Link href={`/spot/${p.spotId}?${u.toString()}#tide-table`} className="mini-chip blue">포인트 물때·점수 ›</Link>
                    <Link href={`/fish/${p.speciesId}#boil`} className="mini-chip blue">현장 신호 판독 ›</Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="now" className="card stack nw" style={{ gap: 8, scrollMarginTop: 80 }} aria-labelledby="nw-h">
          <h2 id="nw-h" style={{ fontSize: "1.05rem", margin: 0 }}>③ 🎯 한 번에 찾기 <span className="mini-chip blue">서프루어 · 앞으로 24시간</span></h2>
          <NowFinder simQ={simQ} auto={sp.now === "1"} />
        </section>

        <section id="live" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }} aria-labelledby="ag-live-h">
          <h2 id="ag-live-h" style={{ fontSize: "1rem", margin: 0 }}>④ 📡 실시간 바다 보기 — 출발 직전</h2>
          <p className="small" style={{ margin: 0 }}>
            <b>전날 밤</b> 조황·수온·파도로 갈지 정하고, <b>새벽 출발 전</b> 후보 해변 영상·유튜브 라이브로 새떼·사람·파도를 본 뒤 한 곳을 골라요. 보일링은 영상으로 거의 안 보여서 도착 후 5~10분 직접 확인해요.
          </p>
          <LivePanel initial={isLiveArea(sp.area ?? "") ? (sp.area as "속초" | "양양" | "강릉") : isLiveArea(run.picks[0]?.area ?? "") ? (run.picks[0].area as "속초" | "양양" | "강릉") : "양양"} />
        </section>

        <section className="card stack" style={{ gap: 6 }} aria-labelledby="ag-how-h">
          <h2 id="ag-how-h" style={{ fontSize: "1rem", margin: 0 }}>어떻게 계산하나요</h2>
          <ul className="st-why">
            <li><b>앱 점수</b> — 바람·파도·수온·해·달·물때·포인트·제철·안전을 합친 시간별 점수의 그 시간대 최고점. 위험·금어기 시간은 빼요.</li>
            <li><b>조건 일치</b> — 오전 피딩(해 뜨기 30분 전~뜬 뒤 2시간), 들물 겹침(중·끝들물이면 만점), 외해 조류가 통하는 포인트(방파제 끝·갯바위·외항), 적정 수온.</li>
            <li><b>동해 보정</b> — 물 높이 차이가 60cm보다 작은 날은 들물 가중치를 40%로 줄여요. 속초·양양·강릉은 대부분 여기에 해당해요.</li>
          </ul>
          <p className="small muted" style={{ margin: 0 }}>
            규칙 기반 계산이에요(별도 AI API 없음). 새떼·보일링 같은 현장 신호는 예보로 알 수 없어서, 도착하면 5~10분 바다를 먼저 살피세요. 이 결과는 Claude Code에서 <code>/pelagic-agent</code> 스킬로도 받아 계획을 세울 수 있어요.
          </p>
          <details className="tide-more">
            <summary>확인한 포인트 {run.spots.length}곳</summary>
            <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {run.spots.map((s) => (
                <li key={s.id}>
                  <Link href={`/spot/${s.id}`} className="link">{s.name}</Link> — {s.pelagic.length ? `회유어 ${s.pelagic.length}종` : "회유어 대상 아님(내항·해변 등)"}
                </li>
              ))}
            </ul>
          </details>
        </section>
        {run.partial && <p className="small muted" style={{ margin: 0 }}>일부 예보가 늦어 추정값으로 계산했어요. 잠시 뒤 새로 고치면 더 정확해요.</p>}
      </div>
    </>
  );
}
