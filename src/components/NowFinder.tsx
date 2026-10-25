"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { relativeDay } from "@/lib/format";
import type { SpotType } from "@/lib/types";
import type { NowPick } from "@/lib/surfNow";
import type { NowRun } from "@/lib/surfNowRun";
import { LEAD_TIERS, type LeadId } from "@/data/liveView";

const TYPE: Partial<Record<SpotType, string>> = { SURF: "해변", BREAKWATER_TIP: "방파제 끝", OUTER_HARBOR: "외항 방파제", ROCK: "갯바위" };
const STEPS = ["물때·해 뜨는 시각 계산 중", "파도·바람 예보 다시 받는 중", "수온·냉수대 확인 중", "유튜브 고정 캠 방송 확인 중"];
const kst = (iso: string, from = 11, to = 16) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(from, to);
const n1 = (v: number | null, u: string) => (v == null ? "-" : `${v.toFixed(1)}${u}`);

function when(p: NowPick, today: string) {
  if (p.ongoing) return `지금 진행 중 (${kst(p.end)}까지)`;
  const h = Math.floor(p.startsInMin / 60);
  const m = p.startsInMin % 60;
  return `${relativeDay(p.date, today)} ${kst(p.start)}~${kst(p.end)} · ${h ? `${h}시간 ` : ""}${m}분 뒤`;
}

/** 에이전트 경고를 미리 아는 단계에 붙인다 (물 높이 차이 → 물때, 바람·파도 → 예보, 나머지 → 위에) */
const tierOf = (w: string): LeadId | null => (w.includes("물 높이") ? "astro" : w.includes("바람") ? "forecast" : null);

function Level({ p }: { p: NowPick }) {
  return p.surf.level === "ok" ? <span className="mini-chip green">서프루어 가능</span> : <span className="mini-chip orange">주의하며 가능</span>;
}

/** 한 번에 찾기: 버튼 한 번 → 실시간 예보·파도·바람·수온·냉수대·물때 + 유튜브 캠 → 회유어 서프루어 갈 곳 */
export function NowFinder({ simQ, auto }: { simQ: string; auto: boolean }) {
  const [run, setRun] = useState<NowRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState(false);

  const go = useCallback(async () => {
    setBusy(true);
    setErr(false);
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 1500);
    try {
      const r = await fetch(`/api/agent/now${simQ ? `?${simQ}` : ""}`);
      if (!r.ok) throw new Error(String(r.status));
      setRun(await r.json());
    } catch {
      setErr(true);
    } finally {
      clearInterval(t);
      setBusy(false);
    }
  }, [simQ]);

  useEffect(() => {
    if (auto) void go();
  }, [auto, go]);

  const today = run ? kst(run.generatedAt, 0, 10) : "";
  const [best, ...rest] = run?.picks ?? [];
  const area = best ? run?.areas.find((a) => a.area === best.area) : undefined;
  const spotQ = (p: NowPick) => {
    const u = new URLSearchParams(simQ);
    u.set("species", p.speciesId);
    u.set("day", p.date);
    return `/spot/${p.spotId}?${u.toString()}#tide-table`;
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <button type="button" className="btn primary nw-go" onClick={go} disabled={busy} aria-describedby="nw-what">
        {busy ? "찾는 중…" : run ? "🔄 다시 찾기" : "🎯 지금 회유어 서프루어 어디로? 한 번에 찾기"}
      </button>
      <p id="nw-what" className="small muted" style={{ margin: 0 }}>
        해변·방파제 끝·외항·갯바위에서 앞으로 24시간 안 갈 곳을 골라요. 미리 알 수 있는 것부터 봐요: ① 물때·해 뜨는 시각 → ② 파도·바람 → ③ 수온·냉수대 → ④ 당일 유튜브 캠 방송.
      </p>

      <div aria-live="polite" className="stack" style={{ gap: 12 }}>
        {busy && <p className="small nw-step"><span className="nw-spin" aria-hidden /> {STEPS[step]}…</p>}
        {err && !busy && <p className="small gear-miss" style={{ margin: 0 }}>조회하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.</p>}
        {run && !busy && !best && (
          <div className="bo-res lv1">
            <p style={{ margin: 0 }}><b>지금은 추천할 곳이 없어요</b></p>
            <p className="small" style={{ margin: "4px 0 0" }}>앞으로 24시간 피딩 시간대가 바람·파도 위험이거나 예보를 불러오지 못했어요. 아래 제외 이유를 확인해요.</p>
          </div>
        )}

        {run && !busy && best && (
          <article className="card stack nw-best" style={{ gap: 8 }} aria-labelledby="nw-best-h">
            <div className="between">
              <h3 id="nw-best-h" style={{ margin: 0, fontSize: "1.1rem" }}>
                <span className="ag-rank" aria-label="1순위">1</span> {best.spotName}
              </h3>
              <b className="num ag-score" aria-label={`지금 점수 ${best.nowScore}`}>{best.nowScore}</b>
            </div>
            <p style={{ margin: 0 }}>
              <b>{best.area} {TYPE[best.spotType]} · {best.speciesName} · {best.phaseLabel}</b>
              <br /><span className="small">{when(best, today)}</span>
            </p>
            {best.checks.filter((c) => c.key === "open").map((c) => <p key={c.key} className="small" style={{ margin: 0 }}>{c.ok ? "✓" : "✗"} {c.label} <span className="muted">{c.detail}</span></p>)}
            {best.warnings.filter((w) => tierOf(w) === null).map((w) => <p key={w} className="small gear-miss" style={{ margin: 0 }}>⚠ {w}</p>)}

            <ol className="nw-tiers" aria-label="미리 알 수 있는 순서대로 확인">
              {LEAD_TIERS.map((t, i) => (
                <li key={t.id}>
                  <p className="nw-th"><span className="nw-n" aria-hidden>{i + 1}</span><b>{t.label}</b> <span className="mini-chip">{t.when}</span></p>
                  {t.id === "astro" && best.checks.filter((c) => c.key === "dawn" || c.key === "flood").map((c) => <p key={c.key} className="small" style={{ margin: 0 }}>{c.ok ? "✓" : "✗"} {c.label} <span className="muted">{c.detail}</span></p>)}
                  {t.id === "forecast" && (
                    <p className="small" style={{ margin: 0 }}>
                      {best.surf.level === "ok" ? "✓" : "⚠"} 파도 최대 <b className="num">{n1(best.surf.waveM, "m")}</b>{best.surf.periodS != null && <> (간격 {best.surf.periodS.toFixed(0)}초)</>} · 바람 최대 <b className="num">{n1(best.surf.windMs, "m/s")}</b>{best.surf.wind && ` ${best.surf.wind}`} <Level p={best} />
                    </p>
                  )}
                  {t.id === "forecast" && best.surf.notes.map((w) => <p key={w} className="small gear-miss" style={{ margin: 0 }}>⚠ {w}</p>)}
                  {t.id === "temp" && (
                    <>
                      {best.checks.filter((c) => c.key === "temp").map((c) => <p key={c.key} className="small" style={{ margin: 0 }}>{c.ok ? "✓" : "✗"} {c.label} <span className="muted">{c.detail}</span></p>)}
                      <p className={`small${best.surf.coldWater ? " gear-miss" : ""}`} style={{ margin: 0 }}>
                        {best.surf.coldWater ? "⚠ 수온이 최근 3일 최고보다 2℃ 이상 낮아요 — 냉수대면 회유어가 연안에서 빠지기 쉬워요" : "✓ 수온 급강하(냉수대 신호) 없음"}
                      </p>
                    </>
                  )}
                  {best.warnings.filter((w) => tierOf(w) === t.id).map((w) => <p key={w} className="small gear-miss" style={{ margin: 0 }}>⚠ {w}</p>)}
                  {t.id === "live" && (
                    <>
                      <p className="small muted" style={{ margin: 0 }}>새떼·보일링·조황은 예보로 알 수 없어요. 오늘 조황이나 새떼가 보이면 출발해요.</p>
                      <ul className="lv-links">
                        {area?.cams.map((c) => (
                          <li key={c.url}>
                            <a href={c.url} target="_blank" rel="noreferrer">
                              <span>{c.title} <span aria-hidden>↗</span></span>
                              <small>{c.live === true ? "🔴 지금 방송 중(자동 확인)" : c.live === false ? "방송 중이 아니에요(자동 확인)" : c.url.includes("youtube.com") ? "방송 여부 확인 못 함 — 눌러서 직접 봐요" : "새떼·사람·파도 보기"}</small>
                            </a>
                          </li>
                        ))}
                        {area?.checks.map((l) => (
                          <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer"><span>{l.title} <span aria-hidden>↗</span></span>{l.note && <small>{l.note}</small>}</a></li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              ))}
            </ol>
            <div className="tags">
              <Link href={spotQ(best)} className="mini-chip blue">포인트 물때·점수 ›</Link>
              <Link href={`/fish/${best.speciesId}#boil`} className="mini-chip blue">도착하면 신호 판독 ›</Link>
              <a href="#live" className="mini-chip blue">출발 판단 질문 ›</a>
            </div>
          </article>
        )}

        {run && !busy && rest.length > 0 && (
          <div>
            <h3 className="rig-h">다른 후보</h3>
            <ol className="nw-rest">
              {rest.map((p, i) => (
                <li key={p.spotId}>
                  <Link href={spotQ(p)}>
                    <span className="ag-rank" aria-hidden>{i + 2}</span>
                    <span><b>{p.spotName}</b> <span className="small muted">{p.speciesName} · {when(p, today)}</span></span>
                    <b className="num" aria-label={`지금 점수 ${p.nowScore}`}>{p.nowScore}</b>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        {run && !busy && (
          <>
            <div>
              <h3 className="rig-h">지역별 지금 바다</h3>
              <ul className="nw-areas">
                {run.areas.map((a) => (
                  <li key={a.area}>
                    <b>{a.area}</b>
                    <span className="small">파도 {n1(a.waveM, "m")} · 바람 {n1(a.windMs, "m/s")} · 수온 {n1(a.seaTempC, "℃")}</span>
                    <span className="small">
                      {a.coldWater ? <span className="mini-chip red">냉수대 의심</span> : <span className="mini-chip">수온 급강하 없음</span>}{" "}
                      {a.cams.filter((c) => c.live != null).map((c) => <span key={c.url} className={`mini-chip ${c.live ? "green" : ""}`}>캠 {c.live ? "방송 중" : "꺼짐"}</span>)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <details className="tide-more">
              <summary>어떻게 골랐나요 · 확인한 곳 {run.checked.length}곳</summary>
              <ul className="st-why small" style={{ marginTop: 6 }}>
                <li>확인 순서는 미리 알 수 있는 순서예요: {LEAD_TIERS.map((t, i) => `${i + 1} ${t.label}(${t.when})`).join(" → ")}. 점수 비중과는 별개예요.</li>
                <li>{run.formula}. 에이전트 점수는 앱 점수 × 0.6 + 조건 일치(오전 피딩·들물·외해 소통·수온) × 40이에요.</li>
                <li>바람·파도 위험(파도 1.5m 이상 등)·금어기 시간은 빼요. 지금 점수 감점 폭은 판단 보조(추론)예요.</li>
                <li>데이터: {run.sources}{run.fetchedAt && ` · 예보 ${kst(run.fetchedAt)} 조회`}{run.partial && " · 일부 추정값"}. 유튜브 방송 여부는 영상 페이지를 읽어 확인해요(실패하면 '확인 못 함').</li>
              </ul>
              <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {run.checked.map((c) => (
                  <li key={c.id}>{c.area} {c.name}{c.why ? ` — ${c.why}` : " — 후보 있음"}</li>
                ))}
              </ul>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
