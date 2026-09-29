import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SimBanner, SourceBadge } from "@/components/Badges";
import { SafetyChecklist } from "@/components/SafetyChecklist";
import { SpotActions } from "@/components/SpotActions";
import { Timeline, type TimelineHour } from "@/components/Timeline";
import { getSpot, SEA_LABEL, SPOT_TYPE_LABEL } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { isClosedSeason } from "@/lib/engine/score";
import { dayScore, findAlternatives, getForecast, type Ctx } from "@/lib/forecast";
import { dateLabel, dirLabel, fmt, GRADE_ICON, kstHM, relativeDay, VERDICT_LABEL } from "@/lib/format";
import { bestWindow, durationLabel, liveStatus, type LiveStatus, type TimeWindow } from "@/lib/live";
import { SOURCE_LABEL } from "@/lib/providers";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";
import type { DaySummary, ForecastResult, GoldenBlock, Species, Spot } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type Search = Promise<{ species?: string; day?: string; sim?: string; simDate?: string; simHour?: string }>;

const GRADE_LABEL = { BEST: "최고", GOOD: "좋음", FAIR: "보통", POOR: "나쁨", BAD: "비추천", DANGER: "위험" } as const;
const EXPOSED = new Set(["OUTER_HARBOR", "BREAKWATER_TIP", "ROCK", "SURF", "TIDAL_FLAT"]);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const spot = getSpot((await params).id);
  if (!spot) return {};
  return {
    title: `${spot.name} 물때·골든타임`,
    description: `${spot.area} ${spot.name}(${SPOT_TYPE_LABEL[spot.type]}) 오늘·이번 주 바다낚시 점수, 만조·간조, 바람·파도·수온.`,
  };
}

export default async function SpotPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { id } = await params;
  const sp = await searchParams;
  const spot = getSpot(id);
  if (!spot) notFound();
  const mul = (await cookies()).get("mul")?.value;
  const ctx = ctxFrom(sp, mul === "7" ? 7 : mul === "8" ? 8 : undefined);
  const today = kstDateString(ctx.now);
  const f = await getForecast(id, sp.species, ctx, sp.day ?? today);
  if (!f) notFound();
  const { species, result, ranking } = f;
  const day = result.days.find((d) => d.date === sp.day) ?? result.days.find((d) => d.date === today) ?? result.days[0];
  const isToday = day.date === today;
  const sim = isSimActive(sp);
  const simQ = simQueryString(sp);

  const q = (o: { species?: string; day?: string }) => {
    const u = new URLSearchParams(simQ);
    u.set("species", o.species ?? species.id);
    u.set("day", o.day ?? day.date);
    return `/spot/${spot.id}?${u.toString()}`;
  };

  const dayStart = new Date(`${day.date}T00:00:00+09:00`).toISOString();
  const dayHours = result.hours.filter((h) => kstDateString(new Date(h.time)) === day.date);
  const timelineHours: TimelineHour[] = dayHours.map((h) => ({
    time: h.time, score: h.score, grade: h.grade, safety: h.safety, safetyReasons: h.safetyReasons,
    reasons: h.reasons, tideCm: h.tideCm, tidePhase: h.tidePhase, sub: h.sub,
    windMs: h.cond.windMs, windDir: h.cond.windDir, waveM: h.cond.waveM, wavePeriodS: h.cond.wavePeriodS,
    seaTempC: h.cond.seaTempC, precipMm: h.cond.precipMm,
  }));
  const nowIdx = isToday ? dayHours.findIndex((h) => Date.parse(h.time) + 3600e3 > ctx.now.getTime()) : -1;
  const bestIdx = dayHours.reduce((bi, h, i, arr) => (h.available && h.score > (arr[bi]?.score ?? -1) ? i : bi), 0);
  const live = isToday ? liveStatus(result, ctx.now) : null;
  const fallback = bestWindow(dayHours, isToday ? ctx.now.getTime() : 0, Date.parse(dayStart) + 24 * 3600e3);
  const closed = isClosedSeason(species, new Date(`${day.date}T12:00:00+09:00`));
  const bestDay = [...result.days].filter((d) => d.verdict !== "DANGER" && dayScore(d) > 0).sort((a, b) => dayScore(b) - dayScore(a))[0];
  const primary = isToday ? day.nextGolden : day.golden[0];
  const shareText = primary
    ? `${spot.name} ${dateLabel(day.date)} ${species.name} 골든타임 ${kstHM(primary.start)}–${kstHM(primary.end)} (${primary.peak}점)`
    : `${spot.name} ${dateLabel(day.date)} ${species.name} ${VERDICT_LABEL[day.verdict]}`;
  const worstSafety = dayHours.some((h) => h.safety === "DANGER") ? "DANGER" : dayHours.some((h) => h.safety === "CAUTION") ? "CAUTION" : "OK";
  const logHref = `/log?spot=${spot.id}&species=${species.id}`;

  return (
    <>
      {sim && <SimBanner label={simLabel(sp)} />}
      <div className="stack">
        <div className="stack" style={{ gap: 6 }}>
          <p className="sub crumb" style={{ margin: 0 }}>
            <Link href={`/spots${simQ ? `?${simQ}` : ""}`}>포인트</Link> › {SEA_LABEL[spot.sea]} · {spot.area}
          </p>
          <div className="between" style={{ alignItems: "flex-start" }}>
            <div>
              <h1>{spot.name}</h1>
              <p className="sub" style={{ margin: "2px 0 0" }}>
                {SPOT_TYPE_LABEL[spot.type]} · 조위관측소 {spot.station.name}
              </p>
            </div>
            <SourceBadge sources={result.sources} sim={sim} />
          </div>
          <SpotActions spotId={spot.id} title={`${spot.name} · 피싱체크`} text={shareText} logHref={logHref} />
        </div>

        <nav className="tabs" aria-label={`${dateLabel(day.date)} 어종별 점수`} tabIndex={0}>
          {ranking.map((r) => (
            <Link key={r.species.id} className="tab" href={q({ species: r.species.id })} aria-current={r.species.id === species.id ? "true" : undefined}>
              {r.species.name}
              <span className="num" style={{ marginLeft: 6, fontWeight: 800 }}>{r.closed ? "금어기" : r.danger ? "⚠" : r.score}</span>
            </Link>
          ))}
        </nav>

        <nav className="days" aria-label="날짜 선택" tabIndex={0}>
          {result.days.map((d) => (
            <Link key={d.date} className="day" href={q({ day: d.date })} aria-current={d.date === day.date ? "true" : undefined}>
              <span className="sub">{relativeDay(d.date, today)}</span>
              <span className="score num">{d.verdict === "DANGER" ? "⚠" : dayScore(d)}</span>
              <span className={`small v-${d.verdict}`}>{d.date === today ? "남은 시간" : VERDICT_LABEL[d.verdict].split(" ")[0]}</span>
              <span className="small muted">{d.mulddae}</span>
            </Link>
          ))}
        </nav>

        {live && <LiveCard live={live} spot={spot} />}

        <div className="grid-2">
          <VerdictCard day={day} species={species} spot={spot} closed={closed} isToday={isToday} now={ctx.now} fallback={fallback} />
          <SeaInfo day={day} />
        </div>

        {(day.verdict === "DANGER" || dayScore(day) < 50) && (
          <div className={day.verdict === "DANGER" ? "alert" : "alert caution"}>
            <strong>{day.verdict === "DANGER" ? "⚠ 이 날은 이 포인트 출조를 권하지 않습니다" : isToday ? "오늘 남은 시간은 조건이 좋지 않습니다" : "이 날은 조건이 좋지 않습니다"}</strong>
            {bestDay && bestDay.date !== day.date && (
              <p style={{ margin: "6px 0 0" }}>
                더 좋은 날:{" "}
                <Link href={q({ day: bestDay.date })} className="link">
                  {relativeDay(bestDay.date, today)} {dayScore(bestDay)}점
                  {(bestDay.nextGolden ?? bestDay.golden[0]) && ` (${kstHM((bestDay.nextGolden ?? bestDay.golden[0])!.start)}–${kstHM((bestDay.nextGolden ?? bestDay.golden[0])!.end)})`}
                </Link>
              </p>
            )}
            <Suspense fallback={<p className="small muted">인근 대체 포인트 계산 중…</p>}>
              <Alternatives spot={spot} date={day.date} ctx={ctx} simQ={simQ} />
            </Suspense>
          </div>
        )}

        <div className="card">
          <Timeline
            key={`${species.id}-${day.date}`}
            hours={timelineHours}
            tide={result.tideSeries.filter((t) => {
              const ms = Date.parse(t.time);
              return ms >= Date.parse(dayStart) - 3600e3 && ms <= Date.parse(dayStart) + 25 * 3600e3;
            })}
            extremes={day.extremes}
            sunrise={day.sunrise}
            sunset={day.sunset}
            dayStart={dayStart}
            initialIndex={nowIdx >= 0 ? nowIdx : bestIdx}
            now={isToday ? ctx.now.toISOString() : undefined}
          />
        </div>

        {(EXPOSED.has(spot.type) || spot.type === "BOAT" || worstSafety !== "OK") && <SafetyChecklist spot={spot} level={worstSafety} />}

        <div className="grid-2">
          <SpeciesCard species={species} date={day.date} />
          <SpotInfo spot={spot} logHref={logHref} />
        </div>

        <Sources result={result} />
      </div>
    </>
  );
}

function LiveCard({ live, spot }: { live: LiveStatus; spot: Spot }) {
  const h = live.hour;
  const ex = live.nextExtreme;
  return (
    <section className="card live stack" style={{ gap: 10 }} aria-label="지금 상황">
      <div className="between">
        <h2>지금 <span className="tag-now">{kstHM(new Date(Date.parse(h.time)).toISOString())}대</span></h2>
        <span className={`badge g-${h.grade}`}><span aria-hidden>{GRADE_ICON[h.grade]}</span> {GRADE_LABEL[h.grade]} <span className="num">{h.score}</span></span>
      </div>
      <div className="kv num">
        <div>
          <div className="k">물 흐름</div>
          <div className="v">{live.trend === "RISING" ? "↗ 들물" : live.trend === "FALLING" ? "↘ 썰물" : "-"}</div>
          {live.tideCm != null && <div className="small muted">조위 {live.tideCm}cm</div>}
        </div>
        <div>
          <div className="k">{ex ? (ex.type === "HIGH" ? "만조까지" : "간조까지") : "다음 물돌이"}</div>
          <div className="v">{ex ? durationLabel(ex.inMin) : "-"}</div>
          {ex && <div className="small muted">{kstHM(ex.time)} · {Math.round(ex.cm)}cm</div>}
        </div>
        <div>
          <div className="k">바람·파도</div>
          <div className="v">{dirLabel(h.cond.windDir)} {fmt(h.cond.windMs, 0, "m/s")}</div>
          <div className="small muted">파고 {fmt(h.cond.waveM, 1, "m")} · 수온 {fmt(h.cond.seaTempC, 1, "℃")}</div>
        </div>
      </div>
      {live.current ? (
        <p className="golden" style={{ margin: 0 }}>
          <strong>🎯 골든타임 진행 중</strong> · {kstHM(live.current.start)}–{kstHM(live.current.end)} · 끝나기까지 {durationLabel(live.current.endsInMin)}
        </p>
      ) : live.next ? (
        <p className="golden" style={{ margin: 0 }}>
          <strong>다음 골든타임</strong> {kstHM(live.next.start)}–{kstHM(live.next.end)} ({durationLabel(live.next.startsInMin)} 후, 최고 {live.next.peak}점)
        </p>
      ) : (
        <p className="sub" style={{ margin: 0 }}>예보 기간(7일) 안에 뚜렷한 골든타임이 없습니다.</p>
      )}
      {h.safetyReasons.length > 0 && <p className={`small g-${h.safety === "DANGER" ? "DANGER" : "FAIR"}`} style={{ margin: 0 }}>⚠ {h.safetyReasons.join(" · ")}</p>}
      {spot.type === "BOAT" && <p className="small muted" style={{ margin: 0 }}>선상은 04~17시 출항 기준으로 계산합니다.</p>}
    </section>
  );
}

function GoldenRow({ g, first, passed, spot, species }: { g: GoldenBlock; first: boolean; passed: boolean; spot: Spot; species: Species }) {
  const ics = `/api/ics?spot=${spot.id}&species=${species.id}&start=${encodeURIComponent(g.start)}&end=${encodeURIComponent(g.end)}`;
  return (
    <div className={`golden${passed ? " passed" : ""}`}>
      <div className="between">
        <span className="time num">{first && !passed ? "🎯 " : ""}{kstHM(g.start)} – {kstHM(g.end)}</span>
        <span className="num sub">평균 {g.avg} · 최고 {g.peak}</span>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        {g.reasons.map((r) => <span key={r.label} className="chip pos">{r.label}</span>)}
      </div>
      {!passed && (
        <a className="btn small" style={{ marginTop: 8 }} href={ics} download>📅 캘린더에 추가 (90분 전 알림)</a>
      )}
    </div>
  );
}

function VerdictCard({ day, species, spot, closed, isToday, now, fallback }: { day: DaySummary; species: Species; spot: Spot; closed: boolean; isToday: boolean; now: Date; fallback: TimeWindow | null }) {
  const nowMs = now.getTime();
  const blocks = [...day.golden].sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = isToday ? (day.nextGolden ? [day.nextGolden, ...blocks.filter((b) => Date.parse(b.start) > Date.parse(day.nextGolden!.end))] : []) : blocks;
  const passed = isToday ? blocks.filter((b) => Date.parse(b.end) <= nowMs) : [];
  const score = dayScore(day);
  return (
    <div className="card hero">
      <div className="between">
        <span className={`badge v-${day.verdict}`}><span className="dot" />{VERDICT_LABEL[day.verdict]}</span>
        <span className="sub">{species.name}</span>
      </div>
      {day.verdict === "DANGER" && score < 20 ? (
        <div className="row" style={{ alignItems: "baseline" }}>
          <span className="big g-DANGER">⚠ 위험</span>
          <span className="sub">안전 조건 미충족</span>
        </div>
      ) : (
        <div className="row" style={{ alignItems: "baseline" }}>
          <span className="big num">{score}</span>
          <span className="sub">/ 100 {isToday ? "남은 시간 최고점" : "최고점"}</span>
        </div>
      )}
      {isToday && day.best !== score && <span className="small muted">오늘 하루 최고점은 {day.best}점이었습니다.</span>}
      {closed && <p className="g-DANGER" style={{ margin: 0 }}>⛔ {species.name} 금어기입니다. 포획하면 과태료 대상입니다.</p>}
      {upcoming.length > 0 ? (
        <div className="stack" style={{ gap: 8 }}>
          {upcoming.map((g, i) => <GoldenRow key={g.start} g={g} first={i === 0} passed={false} spot={spot} species={species} />)}
        </div>
      ) : (
        <div className="stack" style={{ gap: 6 }}>
          <p className="sub" style={{ margin: 0 }}>
            {day.verdict === "DANGER" && !fallback ? "안전 조건 때문에 골든타임을 표시하지 않습니다." : isToday ? "오늘 남은 시간에는 뚜렷한 골든타임(65점 이상)이 없습니다." : "뚜렷한 골든타임(65점 이상)이 없습니다."}
          </p>
          {fallback && fallback.avg >= 35 && (
            <p className="golden" style={{ margin: 0 }}>
              그나마 나은 시간: <strong className="num">{kstHM(fallback.start)}–{kstHM(fallback.end)}</strong> <span className="sub">평균 {fallback.avg}점</span>
            </p>
          )}
        </div>
      )}
      {passed.map((g) => <GoldenRow key={g.start} g={g} first={false} passed spot={spot} species={species} />)}
    </div>
  );
}

function SeaInfo({ day }: { day: DaySummary }) {
  return (
    <div className="card">
      <div className="between">
        <h2>{dateLabel(day.date)} 바다</h2>
        <Link href="/guide#mulddae" className="sub link">용어 도움말</Link>
      </div>
      <div className="kv num">
        <div><div className="k">물때 (음력 {day.lunarDay}일)</div><div className="v">{day.mulddae}</div></div>
        <div><div className="k">조차</div><div className="v">{day.tideRangeCm != null ? `${(day.tideRangeCm / 100).toFixed(1)}m` : "-"}</div></div>
        <div><div className="k">사리 정도</div><div className="v">{Math.round(day.springness * 100)}%</div></div>
        <div><div className="k">일출</div><div className="v">{kstHM(day.sunrise)}</div></div>
        <div><div className="k">일몰</div><div className="v">{kstHM(day.sunset)}</div></div>
        <div><div className="k">달</div><div className="v">{day.moonPhase}</div></div>
      </div>
      <ul className="list" style={{ marginTop: 12 }}>
        {day.extremes.map((e) => (
          <li key={e.time} className="between small">
            <span>{e.type === "HIGH" ? "▲ 만조" : "▼ 간조"}</span>
            <span className="num">{kstHM(e.time)} · {Math.round(e.cm)}cm</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpeciesCard({ species: s, date }: { species: Species; date: string }) {
  const reg = s.regulation;
  return (
    <div className="card">
      <div className="between">
        <h2>{s.name}{s.aka ? <span className="sub"> · {s.aka}</span> : null}</h2>
        <Link href={`/fish/${s.id}`} className="sub link">어종 정보</Link>
      </div>
      <p className="sub" style={{ marginTop: 0 }}>{s.tips}</p>
      <div className="row small">
        <span className="chip">적정 수온 {s.temp.min}~{s.temp.max}℃</span>
        <span className="chip">{{ neap: "조금 쪽 물때", mid: "중간 물때", spring: "사리 쪽 물때" }[s.tide.mul]}</span>
      </div>
      <p className="small" style={{ marginBottom: 0 }}><strong>채비</strong> {s.rigs.join(" · ")}<br /><strong>미끼</strong> {s.baits.join(" · ")}</p>
      {reg && (
        <p className="note" style={{ marginBottom: 0 }}>
          {isClosedSeason(s, new Date(`${date}T12:00:00+09:00`)) ? "⛔ 금어기 · " : ""}
          {reg.note} {reg.minLengthCm ? `(금지체장 ${reg.minLengthCm}cm 미만)` : ""}{" "}
          <a href={reg.sourceUrl} target="_blank" rel="noreferrer" className="link">해양수산부 공고</a>
          {!reg.verified && " · 원문 확인 필요"}
        </p>
      )}
    </div>
  );
}

function SpotInfo({ spot, logHref }: { spot: Spot; logHref: string }) {
  return (
    <div className="card">
      <h2>포인트 정보</h2>
      <div className="row">
        <span className="chip">{SPOT_TYPE_LABEL[spot.type]}</span>
        <span className="chip">바닥 {({ MUD: "뻘", SAND: "모래", ROCK: "암반", MIXED: "혼합" } as const)[spot.bottom]}</span>
        {spot.nightOk && <span className="chip">야간 가능</span>}
        {spot.parking && <span className="chip">주차</span>}
        {spot.toilet && <span className="chip">화장실</span>}
        {spot.tetrapod && <span className="chip neg">테트라포드</span>}
      </div>
      {spot.notes && <p className="sub">{spot.notes}</p>}
      <div className="row">
        <a className="btn small" href={`https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lon}`} target="_blank" rel="noreferrer">🧭 길찾기 (카카오맵)</a>
        <Link className="btn small" href={logHref}>📝 조황 기록</Link>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>좌표 {spot.lat.toFixed(3)}, {spot.lon.toFixed(3)} (대략값)</p>
    </div>
  );
}

async function Alternatives({ spot, date, ctx, simQ }: { spot: Spot; date: string; ctx: Ctx; simQ: string }) {
  const alts = await findAlternatives(spot, date, ctx);
  if (!alts.length) return <p className="small muted" style={{ marginBottom: 0 }}>인근에 더 나은 포인트가 없습니다. 다른 날을 추천합니다.</p>;
  return (
    <div style={{ marginTop: 8 }}>
      <p className="small" style={{ margin: "0 0 6px" }}>대신 이곳은 어때요?</p>
      <ul className="list">
        {alts.map((a) => (
          <li key={a.spot.id}>
            <Link className="card card-link between" style={{ padding: 12 }} href={`/spot/${a.spot.id}?species=${a.species.id}&day=${date}${simQ ? `&${simQ}` : ""}`}>
              <span>
                <strong>{a.spot.name}</strong> <span className="sub">{SPOT_TYPE_LABEL[a.spot.type]} · {a.km.toFixed(0)}km · {a.species.name}</span>
              </span>
              <span className={`badge v-${a.day.verdict} num`}>{dayScore(a.day)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sources({ result }: { result: ForecastResult }) {
  const fails = result.notes.filter((n) => n.includes("실패"));
  return (
    <section id="sources" className="stack" style={{ gap: 6, scrollMarginTop: 80 }}>
      <p className="small muted" style={{ margin: 0 }}>
        데이터: 조석 {SOURCE_LABEL[result.sources.tide]} · 날씨 {SOURCE_LABEL[result.sources.weather]} · 해양 {SOURCE_LABEL[result.sources.marine]} · 알고리즘 {result.algoVersion} · {kstHM(result.fetchedAt)} 갱신
      </p>
      {result.notes.filter((n) => !n.includes("실패")).map((n) => <p key={n} className="note" style={{ margin: 0 }}>{n}</p>)}
      {fails.length > 0 && (
        <details className="small muted">
          <summary style={{ cursor: "pointer" }}>연결 상태 상세</summary>
          {fails.map((n) => <p key={n} className="note">{n}</p>)}
        </details>
      )}
      <p className="note" style={{ margin: 0 }}>
        점수는 참고용 예측입니다. 출항·출입 가능 여부는 해경·선장·현장 안내를 따르세요.
      </p>
    </section>
  );
}

