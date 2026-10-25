import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { SimBanner } from "@/components/Badges";
import { SPOT_TYPE_LABEL } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { relativeDay } from "@/lib/format";
import { getSpecies } from "@/data/species";
import { BOIL_SPECIES } from "@/data/boil";
import { isPelagic } from "@/lib/pelagicAgent";
import { runPelagicAgent } from "@/lib/pelagicAgentRun";
import { LivePanel } from "@/components/LivePanel";
import { isLiveArea } from "@/data/liveView";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TITLE = "회유어 찾기 에이전트";
const DESC = "속초·양양·강릉 워킹 포인트에서 '들물 + 새벽 동틀 무렵 + 외해 조류가 통하는 방파제·갯바위' 조합을 예보·물때·수온으로 자동으로 찾아 순위를 매겨요(시범).";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🤖 ${TITLE} · 피싱체크`, DESC, "/agent") };

type Search = Promise<{ sim?: string; simDate?: string; simHour?: string; sp?: string; area?: string }>;
const hm = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(11, 16);

export default async function AgentPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const ctx = ctxFrom(sp);
  const simQ = simQueryString(sp);
  const today = kstDateString(ctx.now);
  const only = sp.sp && isPelagic(sp.sp) ? sp.sp : undefined;
  const run = await runPelagicAgent(ctx, 3, 5, only);
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

        <a href="#live" className="btn small">📡 실시간 바다 보기(조황·유튜브 라이브·CCTV·수온·파도)</a>
        <nav className="ag-tabs" aria-label="어종 고르기">
          <Link href={tabHref()} className="chip2" aria-current={!only ? "true" : undefined}>전체</Link>
          {BOIL_SPECIES.map((id) => (
            <Link key={id} href={tabHref(id)} className="chip2" aria-current={only === id ? "true" : undefined}>{getSpecies(id)?.name}</Link>
          ))}
        </nav>

        <section aria-labelledby="ag-top-h" className="stack" style={{ gap: 10 }}>
          <h2 id="ag-top-h" style={{ fontSize: "1.05rem", margin: 0 }}>추천 조합 TOP {run.picks.length}</h2>
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

        <section id="live" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }} aria-labelledby="ag-live-h">
          <h2 id="ag-live-h" style={{ fontSize: "1rem", margin: 0 }}>📡 실시간 바다 보기 — 차 타고 돌기 전에</h2>
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
