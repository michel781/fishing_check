import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { SimBanner } from "@/components/Badges";
import { BitePicker } from "@/components/BiteMeter";
import { getSpot, SPOT_TYPE_LABEL, SPOTS } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { addDays } from "@/lib/dates";
import { dayScore, getForecast } from "@/lib/forecast";
import { dateLabel, kstHM, relativeDay } from "@/lib/format";
import { regionOf } from "@/lib/regions";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";
import { floodWindows, leadingBlanks, mulCalendar, nextPhase, type MulDay } from "@/lib/tideCalendar";
import { SOURCE_LABEL } from "@/lib/providers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TITLE = "물때표";
const DESC = "포인트별 날짜별 만조·간조 시각과 물 높이, 조차, 낮 시간 들물, 그리고 한 달 물때 달력(사리·조금)을 한눈에 봐요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🌊 ${TITLE} · 피싱체크`, DESC, "/tide") };

type Search = Promise<{ spot?: string; sim?: string; simDate?: string; simHour?: string }>;
const DEFAULT_SPOT = "sihwa-seawall";
const WD = ["일", "월", "화", "수", "목", "금", "토"];

export default async function TidePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const mulCookie = (await cookies()).get("mul")?.value;
  const ctx = ctxFrom(sp, mulCookie === "7" ? 7 : mulCookie === "8" ? 8 : undefined);
  const simQ = simQueryString(sp);
  const today = kstDateString(ctx.now);
  const explicit = !!(sp.spot && getSpot(sp.spot));
  const spot = getSpot(explicit ? sp.spot! : DEFAULT_SPOT) ?? SPOTS[0];
  const system = ctx.mulddae ?? (spot.sea === "WEST" ? 7 : 8);
  const f = await getForecast(spot.id, undefined, ctx, today);
  const days = (f?.result.days ?? []).filter((d) => d.date >= today);
  const allEx = f?.result.days.flatMap((x) => x.extremes) ?? [];
  const cal = mulCalendar(today, 35, system);
  const sari = nextPhase(cal, "사리");
  const jogeum = nextPhase(cal, "조금");
  const pickList = SPOTS.map((s) => ({ id: s.id, name: s.name, region: regionOf(s.area), lat: s.lat, lon: s.lon }));
  const spotHref = (date: string, species?: string) => {
    const u = new URLSearchParams(simQ);
    if (species) u.set("species", species);
    u.set("day", date);
    return `/spot/${spot.id}?${u.toString()}#tide-table`;
  };
  const phaseText = (d: MulDay | null, kind: string) => {
    if (!d) return "한 달 안에 없음";
    if (d.date === today) {
      const end = cal.find((x) => x.date > today && x.kind !== d.kind);
      return `지금 ${kind}${end ? ` · ${relativeDay(addDays(end.date, -1), today)}까지` : ""}`;
    }
    const n = Math.round((Date.parse(d.date) - Date.parse(today)) / 86400000);
    return `${relativeDay(d.date, today)} · ${n}일 뒤 (${d.label})`;
  };

  return (
    <>
      {isSimActive(sp) && <SimBanner label={simLabel(sp)} />}
      <div className="stack" style={{ gap: 12 }}>
        <AppHead title="🌊 물때표" />
        <BitePicker spots={pickList} current={spot.id} simQ={simQ} explicit={explicit} base="/tide" storageKey="fc:tide-spot" />
        <p className="small muted" style={{ margin: 0 }}>
          <Link className="link" href={`/spot/${spot.id}${simQ ? `?${simQ}` : ""}`}>{spot.name}</Link> · {spot.area} · {SPOT_TYPE_LABEL[spot.type]} · 기준 {spot.station.name} 관측소
          {f && ` · ${SOURCE_LABEL[f.result.sources.tide] ?? f.result.sources.tide}`}
        </p>

        <div className="tc-next">
          <span className="tc-chip sari">
            <small>다음 사리</small>
            <b>{phaseText(sari, "사리")}</b>
            <span>물 차이 큼 · 물살 셈</span>
          </span>
          <span className="tc-chip jogeum">
            <small>다음 조금</small>
            <b>{phaseText(jogeum, "조금")}</b>
            <span>물 차이 작음 · 잔잔</span>
          </span>
        </div>

        <section aria-labelledby="tc-week" className="stack" style={{ gap: 8 }}>
          <h2 id="tc-week" style={{ fontSize: "1rem", margin: 0 }}>{days.length ? `${days.length}일` : "날짜별"} 만조·간조</h2>
          {!days.length && <p className="sub">물때 예보를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>}
          <ol className="tc-days">
            {days.map((d) => {
              const m = cal.find((c) => c.date === d.date);
              const d0 = Date.parse(`${d.date}T00:00:00+09:00`);
              const floods = floodWindows(allEx, Math.max(Date.parse(d.sunrise) - 3600e3, d0), Math.min(Date.parse(d.sunset) + 3600e3, d0 + 86400e3));
              const top = f!.all
                .map((a) => {
                  const x = a.result.days.find((y) => y.date === d.date);
                  return { id: a.species.id, name: a.species.name, score: x ? dayScore(x) : 0 };
                })
                .sort((a, b) => b.score - a.score)[0];
              const rangeM = d.tideRangeCm != null ? d.tideRangeCm / 100 : null;
              return (
                <li key={d.date} className={`card tc-day k-${m?.kind ?? "중간"}`}>
                  <Link href={spotHref(d.date, top?.id)} className="tc-link">
                    <div className="between">
                      <strong>
                        {relativeDay(d.date, today)}
                        {relativeDay(d.date, today) !== dateLabel(d.date) && <span className="small muted"> {dateLabel(d.date)}</span>}
                      </strong>
                      <span className="tc-mul">
                        <b>{d.mulddae}</b>
                        <span className="small muted">음 {d.lunarDay}일</span>
                      </span>
                    </div>
                    <span className="tc-spring" aria-label={`사리 정도 ${Math.round(d.springness * 100)}%`}>
                      <i style={{ width: `${Math.max(6, Math.round(d.springness * 100))}%` }} />
                    </span>
                    <ul className="tc-ex" aria-label="만조·간조">
                      {d.extremes.map((e) => (
                        <li key={e.time} className={e.type === "HIGH" ? "hi" : "lo"}>
                          <small>{e.type === "HIGH" ? "만조" : "간조"}</small>
                          <b className="num">{kstHM(e.time)}</b>
                          <span className="num">{Math.round(e.cm)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="small" style={{ margin: 0 }}>
                      {rangeM != null && <>조차 <b className="num">{rangeM.toFixed(1)}m</b> · </>}
                      해 {kstHM(d.sunrise)}–{kstHM(d.sunset)}
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {floods.length ? (
                        <>☀️ 낮 들물 {floods.map((w) => `${kstHM(w.start)}–${kstHM(w.end)}`).join(", ")}</>
                      ) : (
                        <span className="muted">낮 시간에 들물이 없어요 (썰물·정조 위주)</span>
                      )}
                    </p>
                    {top && (
                      <p className="small" style={{ margin: 0 }}>
                        {d.verdict === "DANGER" ? (
                          <span className="mini-chip red">⚠ 위험한 날 · 가지 마세요</span>
                        ) : (
                          <>🎣 이날 추천 {top.name} <b className="num">{top.score}점</b></>
                        )}
                        <span aria-hidden> ›</span>
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="tc-month" className="card stack" style={{ gap: 8 }}>
          <h2 id="tc-month" style={{ fontSize: "1rem", margin: 0 }}>한 달 물때 달력</h2>
          <p className="small muted" style={{ margin: 0 }}>
            {system}물때식 ({system === 7 ? "서해 관행" : "남·동해 관행"}) · 진할수록 사리(물 차이 큼), 옅을수록 조금.{" "}
            <Link href="/settings" className="link">물때식 바꾸기</Link>
          </p>
          <div className="tc-cal" role="list" aria-label="날짜별 물때">
            {WD.map((w) => (
              <span key={w} className="tc-wd" aria-hidden>{w}</span>
            ))}
            {Array.from({ length: leadingBlanks(today) }, (_, i) => (
              <span key={`b${i}`} aria-hidden />
            ))}
            {cal.map((c) => {
              const dd = Number(c.date.slice(8));
              return (
                <span
                  key={c.date}
                  role="listitem"
                  className={`tc-cell k-${c.kind}${c.date === today ? " today" : ""}`}
                  style={{ ["--s" as string]: c.springness }}
                  aria-label={`${dateLabel(c.date)} 음력 ${c.lunarDay}일 ${c.label}${c.kind !== "중간" ? ` ${c.kind}` : ""}`}
                >
                  <b className="num">{dd === 1 || c.date === today ? `${Number(c.date.slice(5, 7))}/${dd}` : dd}</b>
                  <span>{c.label}</span>
                </span>
              );
            })}
          </div>
          <ul className="tide-tips small">
            <li><b>사리</b> — 물 차이가 커서 물살이 세요. 고기 활성은 좋지만 갯벌·갯바위 물 들어오는 속도 주의.</li>
            <li><b>조금</b> — 물 차이가 작아 물살이 약해요. 선상·찌낚시가 편하지만 입질이 둔할 때가 많아요.</li>
            <li><b>들물</b> — 간조에서 만조로 물이 들어오는 시간. 서해·남해 연안은 대체로 이때 입질이 살아나요.</li>
          </ul>
        </section>
        {f?.partial && <p className="small muted" style={{ margin: 0 }}>일부 예보가 늦어 잠시 뒤 새로 고치면 더 정확해요.</p>}
      </div>
    </>
  );
}
