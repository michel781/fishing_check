import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SimBanner, SourceBadge } from "@/components/Badges";
import { SafetyChecklist } from "@/components/SafetyChecklist";
import { BackButton } from "@/components/AppHead";
import { SceneArt } from "@/components/art/SceneArt";
import { ShopSection } from "@/components/ShopSection";
import { IcPin } from "@/components/icons";
import { HourlyChart, TideCurve } from "@/components/SpotCharts";
import { FavCta, HeroActions } from "@/components/SpotClient";
import { scoreGrade } from "@/lib/grade";
import { isBeginner, regionOf } from "@/lib/regions";
import { Timeline, type TimelineHour } from "@/components/Timeline";
import { getSpot, SEA_LABEL, SPOT_TYPE_LABEL } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { isClosedSeason } from "@/lib/engine/score";
import { dayScore, findAlternatives, getForecast, type Ctx } from "@/lib/forecast";
import { dateLabel, dirLabel, fmt, kstHM, relativeDay, VERDICT_LABEL } from "@/lib/format";
import { SpeciesGuide } from "@/components/SpeciesGuide";
import { getGuide } from "@/data/guides";
import { bestWindow, durationLabel, liveStatus, type TimeWindow } from "@/lib/live";
import { SOURCE_LABEL } from "@/lib/providers";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";
import type { DaySummary, ForecastResult, GoldenBlock, Species, Spot } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type Search = Promise<{ species?: string; day?: string; sim?: string; simDate?: string; simHour?: string }>;

const EXPOSED = new Set(["OUTER_HARBOR", "BREAKWATER_TIP", "ROCK", "SURF", "TIDAL_FLAT"]);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const spot = getSpot((await params).id);
  if (!spot) return {};
  const title = `${spot.name} 물때·골든타임`;
  const description = `${spot.area} ${spot.name}(${SPOT_TYPE_LABEL[spot.type]}) 오늘·이번 주 낚시 점수, 골든타임, 만조·간조, 바람·파도·물 온도.`;
  return { title, description, ...og(`${title} · 피싱체크`, description, `/spot/${spot.id}`) };
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
  const score = dayScore(day);
  const grade = scoreGrade(score);
  const heroChips = [SPOT_TYPE_LABEL[spot.type], spot.parking ? "주차가능" : null, spot.toilet ? "화장실" : null, spot.nightOk ? "야간가능" : null].filter(Boolean) as string[];
  const beginner = isBeginner({ type: spot.type, toilet: !!spot.toilet, parking: !!spot.parking, tetrapod: !!spot.tetrapod });
  const goldenShow = live?.current ?? (isToday ? day.nextGolden : day.golden[0]) ?? null;
  const topNames = ranking.filter((r) => !r.closed && !r.danger).slice(0, 2).map((r) => r.species.name).join(", ");
  const headline = closed
    ? `⛔ ${species.name}은(는) 지금 금어기예요. 잡으면 과태료 대상이니 다른 어종을 골라 보세요.`
    : day.verdict === "DANGER"
      ? "바람·파도가 위험해요. 오늘은 쉬고 아래 대체 포인트나 다른 날을 보세요."
      : live?.current
        ? `지금이 황금타임! ${topNames} 활성이 높아요.`
        : goldenShow
          ? `${kstHM(goldenShow.start)}부터 ${topNames} 활성이 높아져요.`
          : `${grade.message}`;

  return (
    <>
      {sim && <SimBanner label={simLabel(sp)} />}
      <section className="spot-hero" aria-label={`${spot.name} 풍경`}>
        <SceneArt id={spot.id} type={spot.type} className="bg" />
        <div className="bar">
          <BackButton fallback={`/spots${simQ ? `?${simQ}` : ""}`} />
          <HeroActions spotId={spot.id} title={`${spot.name} · 피싱체크`} text={shareText} />
        </div>
        <div className="in">
          <h1>{spot.name}</h1>
          <div className="meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><IcPin size={16} /> {regionOf(spot.area)} {spot.area}</span>
            <span>{SEA_LABEL[spot.sea]}</span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {heroChips.map((c) => <span key={c} className="hero-chip">{c}</span>)}
            {beginner && <span className="hero-chip green">초보추천</span>}
          </div>
        </div>
      </section>

      <div className="sheet stack">
        <nav className="u-tabs" aria-label="날짜 선택">
          {result.days.map((d) => (
            <Link key={d.date} href={q({ day: d.date })} aria-current={d.date === day.date ? "true" : undefined}>
              {relativeDay(d.date, today)}{d.verdict === "DANGER" ? " ⚠" : ""}
            </Link>
          ))}
        </nav>

        <nav className="chips" aria-label={`${dateLabel(day.date)} 어종별 점수`}>
          {ranking.map((r) => (
            <Link key={r.species.id} className="chip2 blue" href={q({ species: r.species.id })} aria-current={r.species.id === species.id ? "true" : undefined}>
              {r.species.name}
              <span className="num" style={{ marginLeft: 6, fontWeight: 800 }}>{r.closed ? "금어기" : r.danger ? "⚠" : r.score}</span>
            </Link>
          ))}
        </nav>

        <section aria-labelledby="idx-title" className="stack" style={{ gap: 10 }}>
          <h2 id="idx-title" style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>
            {isToday ? "오늘 낚시지수" : `${dateLabel(day.date)} 낚시지수`} · {species.name}
          </h2>
          <div className="score-block">
            {day.verdict === "DANGER" && score < 20 ? (
              <>
                <span className="n g-DANGER">⚠ 위험</span>
                <span className="grade-pill tone-bad">출조 자제</span>
              </>
            ) : (
              <>
                <span aria-hidden style={{ fontSize: "2.4rem", lineHeight: 1 }}>{grade.tone === "best" || grade.tone === "good" ? "☀️" : grade.tone === "fair" ? "⛅" : "🌧️"}</span>
                <span className="n num">{score}<small>점</small></span>
                <span className={`grade-pill tone-${grade.tone}`}>{grade.label}</span>
              </>
            )}
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>{headline}</p>
          <div><SourceBadge sources={result.sources} sim={sim} /></div>
          {isToday && day.best !== score && <span className="small muted">오늘 하루 최고점은 {day.best}점이었어요. (지난 시간 포함)</span>}
        </section>

        <section aria-labelledby="hourly-title" className="stack" style={{ gap: 8 }}>
          <h2 id="hourly-title" style={{ fontSize: "1rem" }}>낚시지수 (시간대별)</h2>
          <HourlyChart hours={dayHours} sunrise={day.sunrise} sunset={day.sunset} now={isToday ? ctx.now : null} />
          {spot.type === "BOAT" && <p className="small muted" style={{ margin: 0 }}>배낚시는 배가 뜨는 04~17시 기준으로 계산해요.</p>}
        </section>

        {goldenShow ? (
          <div className="golden-box">
            <span aria-hidden style={{ fontSize: "1.8rem" }}>☀️</span>
            <span>
              <b className="num">황금타임 {kstHM(goldenShow.start)} ~ {kstHM(goldenShow.end)}</b>
              <span className="small" style={{ display: "block" }}>
                {live?.current ? `지금이 가장 좋은 시간이에요! 끝나기까지 ${durationLabel(live.current.endsInMin)}` : "물고기가 가장 잘 무는 시간이에요. 30분 전에 도착하세요."}
              </span>
            </span>
          </div>
        ) : fallback && fallback.avg >= 35 && day.verdict !== "DANGER" ? (
          <div className="golden-box">
            <span aria-hidden style={{ fontSize: "1.8rem" }}>⛅</span>
            <span>
              <b className="num">그래도 나은 시간 {kstHM(fallback.start)} ~ {kstHM(fallback.end)}</b>
              <span className="small" style={{ display: "block" }}>특별히 잘 무는 시간(65점 이상)은 없어요.</span>
            </span>
          </div>
        ) : null}

        <section aria-labelledby="tide-title" className="card stack" style={{ gap: 6 }}>
          <div className="between">
            <h2 id="tide-title" style={{ fontSize: "1rem" }}>물때 · {day.mulddae}</h2>
            {live?.nextExtreme ? (
              <span className="small accent-text" style={{ fontWeight: 800 }}>
                {live.nextExtreme.type === "HIGH" ? "만조까지" : "간조까지"} {durationLabel(live.nextExtreme.inMin)}
              </span>
            ) : (
              <Link href="/guide#mulddae" className="small link">물때가 뭐예요?</Link>
            )}
          </div>
          <TideCurve series={result.tideSeries} extremes={day.extremes} dayStart={dayStart} now={isToday ? ctx.now : null} />
          {live && (
            <p className="small muted" style={{ margin: 0 }}>
              지금은 {live.trend === "RISING" ? "↗ 물이 들어오는 중(들물)" : live.trend === "FALLING" ? "↘ 물이 빠지는 중(썰물)" : "물 흐름이 멈춘 때(정조)"}
              {live.tideCm != null ? ` · 물높이 ${live.tideCm}cm` : ""}
            </p>
          )}
        </section>

        {live && (
          <section aria-labelledby="now-title" className="stack" style={{ gap: 8 }}>
            <h2 id="now-title" style={{ fontSize: "1rem" }}>현재 해황 <span className="small muted">{kstHM(live.hour.time)} 기준</span></h2>
            <div className="sea-tiles">
              <div className="sea-tile">
                <span aria-hidden className="c-wind" style={{ fontSize: "1.5rem" }}>🌬️</span>
                <span><span className="l" style={{ display: "block" }}>바람</span><span className="v num">{fmt(live.hour.cond.windMs, 1, "m/s")}</span><span className="s" style={{ display: "block" }}>{dirLabel(live.hour.cond.windDir)}풍</span></span>
              </div>
              <div className="sea-tile">
                <span aria-hidden style={{ fontSize: "1.5rem" }}>🌊</span>
                <span><span className="l" style={{ display: "block" }}>파도</span><span className="v num">{fmt(live.hour.cond.waveM, 1, "m")}</span><span className="s" style={{ display: "block" }}>{waveWord(live.hour.cond.waveM)}</span></span>
              </div>
              <div className="sea-tile">
                <span aria-hidden style={{ fontSize: "1.5rem" }}>🌡️</span>
                <span><span className="l" style={{ display: "block" }}>수온</span><span className="v num">{fmt(live.hour.cond.seaTempC, 1, "℃")}</span><span className="s" style={{ display: "block" }}>{tempWord(live.hour.cond.seaTempC, species)}</span></span>
              </div>
            </div>
            {live.hour.safetyReasons.length > 0 && <p className={`small g-${live.hour.safety === "DANGER" ? "DANGER" : "FAIR"}`} style={{ margin: 0 }}>⚠ {live.hour.safetyReasons.join(" · ")}</p>}
          </section>
        )}

        {getGuide(species.id) && <a className="btn" href="#how-to">🎣 {species.name} 낚는 법 · 채비 · 영상 보기</a>}

        <ShopSection
          spotId={spot.id}
          spotName={spot.name}
          dayLabel={isToday ? "오늘" : relativeDay(day.date, today)}
          mulddae={day.mulddae}
          topSpecies={ranking.filter((r) => !r.closed && !r.danger).slice(0, 2).map((r) => r.species.name)}
          species={ranking.map((r) => ({ id: r.species.id, name: r.species.name }))}
        />

        <div className="grid-2">
          <VerdictCard day={day} species={species} spot={spot} closed={closed} isToday={isToday} now={ctx.now} fallback={fallback} />
          <SeaInfo day={day} />
        </div>

        {(day.verdict === "DANGER" || dayScore(day) < 50) && (
          <div className={day.verdict === "DANGER" ? "alert" : "alert caution"}>
            <strong>{day.verdict === "DANGER" ? "⚠ 이 날은 여기 가지 마세요" : isToday ? "오늘은 지금부터 조건이 좋지 않아요" : "이 날은 조건이 좋지 않아요"}</strong>
            {bestDay && bestDay.date !== day.date && (
              <p style={{ margin: "6px 0 0" }}>
                더 좋은 날:{" "}
                <Link href={q({ day: bestDay.date })} className="link">
                  {relativeDay(bestDay.date, today)} {dayScore(bestDay)}점
                  {(bestDay.nextGolden ?? bestDay.golden[0]) && ` (${kstHM((bestDay.nextGolden ?? bestDay.golden[0])!.start)}–${kstHM((bestDay.nextGolden ?? bestDay.golden[0])!.end)})`}
                </Link>
              </p>
            )}
            <Suspense fallback={<p className="small muted">가까운 다른 곳 찾는 중…</p>}>
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

        {getGuide(species.id) && (
          <section className="card stack" id="how-to" aria-labelledby="how-to-title" style={{ scrollMarginTop: 80 }}>
            <div className="between">
              <h2 id="how-to-title">🎣 {species.name} 이렇게 낚아요</h2>
              <Link href={`/fish/${species.id}`} className="sub link">더 자세히</Link>
            </div>
            <SpeciesGuide speciesId={species.id} name={species.name} guide={getGuide(species.id)!} compact />
          </section>
        )}

        {(EXPOSED.has(spot.type) || spot.type === "BOAT" || worstSafety !== "OK") && <SafetyChecklist spot={spot} level={worstSafety} />}

        <div className="grid-2">
          <SpeciesCard species={species} date={day.date} />
          <SpotInfo spot={spot} logHref={logHref} />
        </div>

        <Sources result={result} />
      </div>

      <div className="bottom-cta">
        <a className="cta-soft" href={`https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lon}`} target="_blank" rel="noreferrer">
          <IcPin size={20} /> 길찾기
        </a>
        <FavCta spotId={spot.id} />
      </div>
    </>
  );
}

const waveWord = (m: number | null | undefined) => (m == null ? "-" : m < 0.5 ? "잔잔" : m < 1 ? "보통" : m < 2 ? "높음" : "매우 높음");
const tempWord = (c: number | null | undefined, s: Species) => (c == null ? "-" : c < s.temp.min ? "낮음" : c > s.temp.max ? "높음" : "적정");

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
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div className="between">
        <h2 style={{ fontSize: "1rem" }}>잘 무는 시간 (황금타임)</h2>
        <span className={`badge v-${day.verdict}`}><span className="dot" />{VERDICT_LABEL[day.verdict]}</span>
      </div>
      {closed && <p className="g-DANGER" style={{ margin: 0 }}>⛔ {species.name} 금어기입니다. 포획하면 과태료 대상입니다.</p>}
      {upcoming.length > 0 ? (
        <div className="stack" style={{ gap: 8 }}>
          {upcoming.map((g, i) => <GoldenRow key={g.start} g={g} first={i === 0} passed={false} spot={spot} species={species} />)}
        </div>
      ) : (
        <div className="stack" style={{ gap: 6 }}>
          <p className="sub" style={{ margin: 0 }}>
            {day.verdict === "DANGER" && !fallback ? "위험해서 골든타임을 보여주지 않아요." : isToday ? "오늘은 지금부터 특별히 잘 무는 시간(65점 이상)이 없어요." : "특별히 잘 무는 시간(65점 이상)이 없어요."}
          </p>
          {fallback && fallback.avg >= 35 && (
            <p className="golden" style={{ margin: 0 }}>
              그래도 가장 나은 시간: <strong className="num">{kstHM(fallback.start)}–{kstHM(fallback.end)}</strong> <span className="sub">평균 {fallback.avg}점</span>
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
        <Link href="/guide#mulddae" className="sub link">말이 어려워요?</Link>
      </div>
      <div className="kv num">
        <div><div className="k">물때 (음력 {day.lunarDay}일)</div><div className="v">{day.mulddae}</div></div>
        <div><div className="k">물 높이 차이 (조차)</div><div className="v">{day.tideRangeCm != null ? `${(day.tideRangeCm / 100).toFixed(1)}m` : "-"}</div></div>
        <div><div className="k">물살 세기</div><div className="v">{Math.round(day.springness * 100)}%</div></div>
        <div><div className="k">해 뜨는 시간</div><div className="v">{kstHM(day.sunrise)}</div></div>
        <div><div className="k">해 지는 시간</div><div className="v">{kstHM(day.sunset)}</div></div>
        <div><div className="k">달</div><div className="v">{day.moonPhase}</div></div>
      </div>
      <ul className="list" style={{ marginTop: 12 }}>
        {day.extremes.map((e) => (
          <li key={e.time} className="between small">
            <span>{e.type === "HIGH" ? "▲ 만조 (물 가장 높음)" : "▼ 간조 (물 가장 낮음)"}</span>
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
      <p className="small" style={{ marginBottom: 0 }}><strong>채비(낚시 도구)</strong> {s.rigs.join(" · ")}<br /><strong>미끼</strong> {s.baits.join(" · ")}</p>
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
  if (!alts.length) return <p className="small muted" style={{ marginBottom: 0 }}>근처에 더 나은 곳이 없어요. 다른 날을 골라 보세요.</p>;
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
          <summary style={{ cursor: "pointer" }}>데이터 연결 상태 (개발자용)</summary>
          {fails.map((n) => <p key={n} className="note">{n}</p>)}
        </details>
      )}
      <p className="note" style={{ margin: 0 }}>
        점수는 참고용 예측입니다. 출항·출입 가능 여부는 해경·선장·현장 안내를 따르세요.
      </p>
    </section>
  );
}

