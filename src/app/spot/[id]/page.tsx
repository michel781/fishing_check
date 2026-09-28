import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SpotActions } from "@/components/SpotActions";
import { Timeline, type TimelineHour } from "@/components/Timeline";
import { getSpot, SEA_LABEL, SPOT_TYPE_LABEL } from "@/data/spots";
import { getSpecies } from "@/data/species";
import { kstDateString } from "@/lib/engine/astro";
import { isClosedSeason } from "@/lib/engine/score";
import { findAlternatives, getForecast, rankSpeciesForSpot } from "@/lib/forecast";
import { dateLabel, kstHM, relativeDay, VERDICT_LABEL } from "@/lib/format";
import { SOURCE_LABEL } from "@/lib/providers";
import type { DaySummary, Spot } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type Search = Promise<{ species?: string; day?: string }>;

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
  const f = await getForecast(id, sp.species, { mulddae: mul === "7" ? 7 : mul === "8" ? 8 : undefined });
  if (!f) notFound();
  const { species, result } = f;
  const today = kstDateString(new Date());
  const day = result.days.find((d) => d.date === sp.day) ?? result.days[0];
  const dayStart = new Date(`${day.date}T00:00:00+09:00`).toISOString();
  const dayHours = result.hours.filter((h) => kstDateString(new Date(h.time)) === day.date);
  const timelineHours: TimelineHour[] = dayHours.map((h) => ({
    time: h.time, score: h.score, grade: h.grade, safety: h.safety, safetyReasons: h.safetyReasons,
    reasons: h.reasons, tideCm: h.tideCm, tidePhase: h.tidePhase, sub: h.sub,
    windMs: h.cond.windMs, windDir: h.cond.windDir, waveM: h.cond.waveM, wavePeriodS: h.cond.wavePeriodS,
    seaTempC: h.cond.seaTempC, precipMm: h.cond.precipMm,
  }));
  const nowHourIdx = day.date === today ? dayHours.findIndex((h) => Date.parse(h.time) + 3600e3 > Date.now()) : -1;
  const bestIdx = dayHours.reduce((bi, h, i, arr) => (h.safety !== "DANGER" && h.score > (arr[bi]?.score ?? -1) ? i : bi), 0);
  const initialIdx = nowHourIdx >= 0 && day.golden.length === 0 ? nowHourIdx : bestIdx;
  const bestDay = [...result.days].filter((d) => d.verdict !== "DANGER").sort((a, b) => b.best - a.best)[0];
  const ranked = rankSpeciesForSpot(spot);
  const closed = isClosedSeason(species, new Date(`${day.date}T12:00:00+09:00`));
  const g0 = day.golden[0];
  const shareText = g0
    ? `${spot.name} ${dateLabel(day.date)} ${species.name} 골든타임 ${kstHM(g0.start)}–${kstHM(g0.end)} (${g0.peak}점)`
    : `${spot.name} ${dateLabel(day.date)} ${species.name} ${VERDICT_LABEL[day.verdict]}`;
  const q = (o: { species?: string; day?: string }) => {
    const u = new URLSearchParams();
    u.set("species", o.species ?? species.id);
    u.set("day", o.day ?? day.date);
    return `/spot/${spot.id}?${u.toString()}`;
  };

  return (
    <div className="stack">
      <div className="stack" style={{ gap: 8 }}>
        <p className="sub" style={{ margin: 0 }}>
          <Link href="/spots">포인트</Link> › {SEA_LABEL[spot.sea]} · {spot.area}
        </p>
        <div className="between" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>{spot.name}</h1>
            <p className="sub" style={{ margin: "2px 0 0" }}>
              {SPOT_TYPE_LABEL[spot.type]} · 조위관측소 {spot.station.name}
            </p>
          </div>
        </div>
        <SpotActions spotId={spot.id} title={`${spot.name} · 피싱체크`} text={shareText} />
      </div>

      <nav className="tabs" aria-label="어종 선택">
        {ranked.map((s) => (
          <Link key={s.id} className="tab" href={q({ species: s.id })} aria-current={s.id === species.id ? "true" : undefined}>
            {s.name}
          </Link>
        ))}
      </nav>

      <nav className="days" aria-label="날짜 선택">
        {result.days.map((d) => (
          <Link key={d.date} className="day" href={q({ day: d.date })} aria-current={d.date === day.date ? "true" : undefined}>
            <span className="sub">{relativeDay(d.date, today)}</span>
            <span className="score num">{d.verdict === "DANGER" ? "⚠" : d.best}</span>
            <span className={`small v-${d.verdict}`}>{VERDICT_LABEL[d.verdict].split(" ")[0]}</span>
            <span className="small muted">{d.mulddae}</span>
          </Link>
        ))}
      </nav>

      <div className="grid-2">
        <VerdictCard day={day} speciesName={species.name} closed={closed} />
        <div className="card">
          <h2>{dateLabel(day.date)} 바다 정보</h2>
          <div className="kv num">
            <div><div className="k">물때 (음력 {day.lunarDay}일)</div><div className="v">{day.mulddae}</div></div>
            <div><div className="k">조차</div><div className="v">{day.tideRangeCm != null ? `${(day.tideRangeCm / 100).toFixed(1)}m` : "-"}</div></div>
            <div><div className="k">달</div><div className="v">{day.moonPhase}</div></div>
            <div><div className="k">일출</div><div className="v">{kstHM(day.sunrise)}</div></div>
            <div><div className="k">일몰</div><div className="v">{kstHM(day.sunset)}</div></div>
            <div><div className="k">사리 정도</div><div className="v">{Math.round(day.springness * 100)}%</div></div>
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
      </div>

      {(day.verdict === "DANGER" || day.verdict === "SKIP") && (
        <div className={day.verdict === "DANGER" ? "alert" : "alert caution"}>
          <strong>{day.verdict === "DANGER" ? "⚠ 이 날은 이 포인트 출조를 권하지 않습니다" : "이 날은 조건이 좋지 않습니다"}</strong>
          {bestDay && bestDay.date !== day.date && (
            <p style={{ margin: "6px 0 0" }}>
              더 좋은 날: <Link href={q({ day: bestDay.date })} style={{ textDecoration: "underline" }}>
                {relativeDay(bestDay.date, today)} {bestDay.best}점
                {bestDay.golden[0] && ` (${kstHM(bestDay.golden[0].start)}–${kstHM(bestDay.golden[0].end)})`}
              </Link>
            </p>
          )}
          <Suspense fallback={<p className="small muted">인근 대체 포인트 계산 중…</p>}>
            <Alternatives spot={spot} date={day.date} />
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
          initialIndex={initialIdx}
        />
      </div>

      <div className="grid-2">
        <SpeciesCard speciesId={species.id} date={day.date} />
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
          <p className="small muted" style={{ marginBottom: 0 }}>
            좌표 {spot.lat.toFixed(3)}, {spot.lon.toFixed(3)} (대략값) ·{" "}
            <a href={`https://map.kakao.com/link/map/${encodeURIComponent(spot.name)},${spot.lat},${spot.lon}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>카카오맵</a>
          </p>
        </div>
      </div>

      <Sources result={result} />
    </div>
  );
}

function VerdictCard({ day, speciesName, closed }: { day: DaySummary; speciesName: string; closed: boolean }) {
  return (
    <div className="card hero">
      <div className="between">
        <span className={`badge v-${day.verdict}`}><span className="dot" />{VERDICT_LABEL[day.verdict]}</span>
        <span className="sub">{speciesName}</span>
      </div>
      <div className="row" style={{ alignItems: "baseline" }}>
        <span className="big num">{day.best}</span>
        <span className="sub">/ 100 최고점</span>
      </div>
      {closed && <p className="g-DANGER" style={{ margin: 0 }}>⛔ {speciesName} 금어기입니다. 포획하면 과태료 대상입니다.</p>}
      {day.golden.length > 0 ? (
        <div className="stack" style={{ gap: 8 }}>
          {day.golden.map((g, i) => (
            <div key={g.start} className="golden">
              <div className="between">
                <span className="time num">{i === 0 ? "🎯 " : ""}{kstHM(g.start)} – {kstHM(g.end)}</span>
                <span className="num sub">평균 {g.avg} · 최고 {g.peak}</span>
              </div>
              <div className="row" style={{ marginTop: 6 }}>
                {g.reasons.map((r) => <span key={r.label} className="chip pos">{r.label}</span>)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sub" style={{ margin: 0 }}>
          {day.verdict === "DANGER" ? "안전 조건 때문에 골든타임을 표시하지 않습니다." : "뚜렷한 골든타임이 없습니다. 아래 시간대별 점수를 참고하세요."}
        </p>
      )}
    </div>
  );
}

function SpeciesCard({ speciesId, date }: { speciesId: string; date: string }) {
  const s = getSpecies(speciesId)!;
  const reg = s.regulation;
  return (
    <div className="card">
      <div className="between">
        <h2>{s.name}{s.aka ? <span className="sub"> · {s.aka}</span> : null}</h2>
        <Link href={`/fish/${s.id}`} className="sub" style={{ textDecoration: "underline" }}>자세히</Link>
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
          <a href={reg.sourceUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>해양수산부 공고</a>
          {!reg.verified && " · 원문 확인 필요"}
        </p>
      )}
    </div>
  );
}

async function Alternatives({ spot, date }: { spot: Spot; date: string }) {
  const alts = await findAlternatives(spot, date);
  if (!alts.length) return <p className="small muted" style={{ marginBottom: 0 }}>인근에 더 나은 포인트가 없습니다. 다른 날을 추천합니다.</p>;
  return (
    <div style={{ marginTop: 8 }}>
      <p className="small" style={{ margin: "0 0 6px" }}>대신 이곳은 어때요?</p>
      <ul className="list">
        {alts.map((a) => (
          <li key={a.spot.id}>
            <Link className="card card-link between" style={{ padding: 12 }} href={`/spot/${a.spot.id}?species=${a.species.id}&day=${date}`}>
              <span>
                <strong>{a.spot.name}</strong> <span className="sub">{SPOT_TYPE_LABEL[a.spot.type]} · {a.km.toFixed(0)}km · {a.species.name}</span>
              </span>
              <span className={`badge v-${a.day.verdict} num`}>{a.day.best}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sources({ result }: { result: { sources: Record<string, string>; notes: string[]; fetchedAt: string; algoVersion: string } }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <p className="small muted" style={{ margin: 0 }}>
        데이터: 조석 {SOURCE_LABEL[result.sources.tide as keyof typeof SOURCE_LABEL]} · 날씨 {SOURCE_LABEL[result.sources.weather as keyof typeof SOURCE_LABEL]} · 해양 {SOURCE_LABEL[result.sources.marine as keyof typeof SOURCE_LABEL]} · 알고리즘 {result.algoVersion} · {kstHM(result.fetchedAt)} 갱신
      </p>
      {result.notes.filter((n) => !n.includes("실패")).map((n) => <p key={n} className="note" style={{ margin: 0 }}>{n}</p>)}
      {result.notes.some((n) => n.includes("실패")) && (
        <details className="small muted">
          <summary style={{ cursor: "pointer" }}>연결 상태 상세</summary>
          {result.notes.filter((n) => n.includes("실패")).map((n) => <p key={n} className="note">{n}</p>)}
        </details>
      )}
      <p className="note" style={{ margin: 0 }}>
        점수는 참고용 예측입니다. 출항·출입 가능 여부는 해경·선장·현장 안내를 따르세요. 갯바위·테트라포드에서는 구명조끼를 꼭 착용하세요.
      </p>
    </div>
  );
}

