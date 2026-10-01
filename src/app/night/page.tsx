import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { NightLocate } from "@/components/NightLocate";
import { PAID_PARKS } from "@/data/paidParks";
import { getSpot } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { kstHM } from "@/lib/format";
import { getForecast } from "@/lib/forecast";
import { evaluateNight, NIGHT_RADIUS_KM, nightCandidates, nightWeather, nightWindow, parkComfort, SEOUL, STYLE_LABEL, VERDICT_LABEL, type NightPick, type NightStyle } from "@/lib/night";
import { ctxFrom } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const metadata: Metadata = {
  title: "오늘 밤 밤낚시 추천",
  description: "서울 근처 바다 밤낚시 포인트와 24시간 유료 낚시터를 오늘 밤 물때·바람·파도·체감온도로 실시간 추천해요.",
};

type Search = Promise<{ style?: string; lat?: string; lon?: string; sim?: string; simDate?: string; simHour?: string }>;
const STYLES: NightStyle[] = ["all", "cast", "lure", "family"];
const range = (w: { start: string; end: string }) => `${kstHM(w.start)}–${kstHM(w.end)}`;

export default async function NightPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const style: NightStyle = STYLES.includes(sp.style as NightStyle) ? (sp.style as NightStyle) : "all";
  const lat = Number(sp.lat);
  const lon = Number(sp.lon);
  const mine = Number.isFinite(lat) && Number.isFinite(lon) && !!sp.lat && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  const base = mine ? { lat, lon, label: "내 위치" } : SEOUL;
  const ctx = ctxFrom(sp);
  const now = ctx.now.getTime();
  const today = kstDateString(ctx.now);
  // 새벽 3시 전이면 '어젯밤'이 아직 진행 중
  const kstHour = (ctx.now.getUTCHours() + 9) % 24;
  const lateNight = kstHour < 3;

  const cands = nightCandidates(base);
  const evaluated = await Promise.all(
    cands.map(async ({ spot, km }) => {
      const f = await getForecast(spot.id, undefined, ctx, today);
      const day = f?.result.days.find((d) => d.date === today);
      if (!f || !day) return null;
      const win = lateNight ? { from: now, to: Date.parse(`${today}T03:00:00+09:00`) } : nightWindow(day, now);
      if (!win) return null;
      const extremes = f.result.days.flatMap((d) => d.extremes);
      const pick = evaluateNight(
        spot,
        km,
        f.all.map((a) => ({ speciesId: a.species.id, speciesName: a.species.name, hours: a.result.hours })),
        extremes,
        win,
        style,
      );
      return pick ? { pick, day, win } : null;
    }),
  );
  const ok = evaluated.filter((x): x is NonNullable<typeof x> => !!x);
  const picks = ok.map((x) => x.pick).sort((a, b) => b.rank - a.rank);
  const head = ok[0];
  const safe = picks.filter((p) => p.verdict !== "DANGER");

  // 유료 낚시터: 오늘 밤 날씨 쾌적도
  const parks = await Promise.all(
    PAID_PARKS.map(async (p) => {
      const ws = getSpot(p.weatherSpot);
      const f = ws ? await getForecast(ws.id, undefined, ctx, today) : null;
      const day = f?.result.days.find((d) => d.date === today);
      const win = day ? (lateNight ? { from: now, to: Date.parse(`${today}T03:00:00+09:00`) } : nightWindow(day, now)) : null;
      const w = f && win ? nightWeather(f.result.hours, win.from, win.to) : null;
      return { p, w, comfort: w ? parkComfort(w) : null };
    }),
  );
  const parksSorted = style === "family" ? [...parks].sort((a, b) => Number(b.p.family) - Number(a.p.family)) : parks;
  const coldest = Math.min(...picks.map((p) => p.weather.feelsMin ?? 99));
  const rainy = picks.some((p) => p.weather.rainMm >= 1);
  const q = (s: NightStyle) => `/night?style=${s}${mine ? `&lat=${sp.lat}&lon=${sp.lon}` : ""}`;

  const parksBlock = (
    <section className="stack" style={{ gap: 10 }} aria-labelledby="parks-title">
      <h2 id="parks-title" className="set-label" style={{ marginTop: 6 }}>🎣 몸만 가도 되는 24시간 유료 바다낚시터</h2>
      <p className="small muted" style={{ margin: 0 }}>화장실·매점·방갈로가 있어 가족·연인·초보에게 편해요. 방류 어종을 가두리·좌대에서 낚아요.</p>
      {parksSorted.map(({ p, w, comfort }) => (
        <article key={p.id} className="card stack night-card" style={{ gap: 8 }}>
          <div className="between" style={{ gap: 8, alignItems: "flex-start" }}>
            <span style={{ minWidth: 0 }}>
              <strong style={{ fontSize: "1.05rem" }}>{p.name}</strong>
              <span className="small muted" style={{ display: "block" }}>{p.area} · {p.kind}{p.open24h ? " · 24시간" : ""}</span>
            </span>
            {comfort && <span className={`night-badge c-${comfort.level}`}>오늘 밤 {comfort.level}</span>}
          </div>
          <p className="small" style={{ margin: 0 }}>{p.good}</p>
          <span className="tags">
            {p.facilities.map((f) => <span key={f} className="mini-chip">{f}</span>)}
            {p.species.map((s) => <span key={s} className="mini-chip blue">{s}</span>)}
          </span>
          {comfort && w && (
            <p className="small muted" style={{ margin: 0 }}>
              {comfort.note} · 바람 최대 {w.windMax ?? "-"}m/s{w.feelsMin != null ? ` · 체감 ${w.feelsMin}℃` : ""}{w.rainMm >= 1 ? ` · 비 ${w.rainMm}mm` : ""}
            </p>
          )}
          {p.caution && <p className="small" style={{ margin: 0 }}>⚠️ {p.caution}</p>}
          <div className="row" style={{ gap: 8 }}>
            <a className="btn small" href={`https://map.kakao.com/link/search/${encodeURIComponent(p.mapQuery)}`} target="_blank" rel="noreferrer">🧭 카카오맵에서 보기</a>
            <a className="btn small" href={`https://map.naver.com/p/search/${encodeURIComponent(p.mapQuery)}`} target="_blank" rel="noreferrer">네이버 지도</a>
          </div>
          <p className="small muted" style={{ margin: 0 }}>입어료·운영 시간·방류 일정은 자주 바뀌어요. 출발 전 전화로 확인하세요.</p>
        </article>
      ))}
    </section>
  );

  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🌙 오늘 밤 밤낚시" />

      <section className="night-hero">
        <p className="small" style={{ margin: 0, opacity: 0.85 }}>{base.label} 기준 {NIGHT_RADIUS_KM}km 안 {cands.length}곳 · 지금 예보로 실시간 계산</p>
        <strong style={{ fontSize: "1.25rem" }}>
          {!safe[0] ? (
            "오늘 밤은 바다가 거칠어요 · 유료 낚시터를 추천해요"
          ) : safe[0].verdict === "GOOD" ? (
            <>오늘 밤엔 <span className="night-accent">{safe[0].spot.name}</span> {safe[0].speciesName} {safe[0].score}점</>
          ) : (
            <>오늘 밤은 조건이 아쉬워요 · 그나마 <span className="night-accent">{safe[0].spot.name}</span> {safe[0].speciesName}</>
          )}
        </strong>
        {head && (
          <span className="small" style={{ opacity: 0.9 }}>
            {lateNight ? "새벽 3시까지" : `일몰 ${kstHM(head.day.sunset)} ~ 새벽 3시`} · {head.day.moonPhase}(밝기 {Math.round(head.day.moonIllumination * 100)}%) · {head.day.mulddae}
          </span>
        )}
      </section>

      <nav className="chips" aria-label="낚시 방식">
        {STYLES.map((s) => (
          <Link key={s} href={q(s)} className="chip2" aria-current={s === style ? "true" : undefined}>{STYLE_LABEL[s]}</Link>
        ))}
      </nav>
      <NightLocate style={style} active={mine} />

      {style === "family" && parksBlock}

      <section className="stack" style={{ gap: 10 }} aria-labelledby="wild-title">
        <h2 id="wild-title" className="set-label" style={{ marginTop: 6 }}>🌊 자연 속 노지 밤낚시 (방조제·선착장)</h2>
        {picks.length === 0 && <p className="sub">{base.label} 근처 {NIGHT_RADIUS_KM}km 안에 밤낚시 포인트가 없어요. 서울 기준으로 다시 보세요.</p>}
        {picks.map((p, i) => <NightCard key={p.spot.id} p={p} rankNo={i + 1} today={today} from={mine ? "내 위치" : "서울"} />)}
      </section>

      {style !== "family" && parksBlock}

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="tips-title">
        <h2 id="tips-title" style={{ fontSize: "1rem", margin: 0 }}>💡 서해 밤낚시 성공 팁 (오늘 밤 기준)</h2>
        <ol className="install-steps">
          <li><b>물때:</b> 서해는 물 높이 차이가 커요. 간조를 지나 만조로 가는 <b>들물</b>에 고기가 연안으로 붙어요. 각 포인트의 &lsquo;들물&rsquo; 시간에 집중하세요.</li>
          <li><b>안전 장비:</b> 밤의 방조제·선착장은 생각보다 훨씬 어두워요. 밝은 헤드랜턴, 미끄럼 방지 신발(펠트화), 구명조끼는 필수예요.</li>
          <li>
            <b>방한:</b> 바다 밤바람은 도심보다 훨씬 차가워요.
            {Number.isFinite(coldest) && coldest < 99 ? ` 오늘 밤 체감 최저 ${coldest}℃ — ${coldest <= 5 ? "두꺼운 겉옷·장갑·핫팩까지 챙기세요." : coldest <= 12 ? "겉옷을 든든히, 따뜻한 음료도 준비하세요." : "얇은 겉옷 하나는 챙기세요."}` : " 겉옷과 따뜻한 음료를 준비하세요."}
          </li>
          {rainy && <li><b>비:</b> 오늘 밤 비 예보가 있는 곳이 있어요. 우비와 미끄럼 주의.</li>}
        </ol>
        <p className="small muted" style={{ margin: 0 }}>점수는 예보로 계산한 참고값이에요. 출입 통제·현장 안내를 꼭 따르세요.</p>
      </section>
    </div>
  );
}

function NightCard({ p, rankNo, today, from }: { p: NightPick; rankNo: number; today: string; from: string }) {
  return (
    <article className={`card stack night-card v-${p.verdict}`} style={{ gap: 8 }}>
      <div className="between" style={{ gap: 8, alignItems: "flex-start" }}>
        <span style={{ minWidth: 0 }}>
          <span className="small muted">{rankNo}위 · {p.spot.area} · {from}에서 직선 {p.km}km</span>
          <strong style={{ display: "block", fontSize: "1.1rem" }}>{p.spot.name}</strong>
        </span>
        <span className={`night-badge v-${p.verdict}`}>{VERDICT_LABEL[p.verdict]}</span>
      </div>
      {p.verdict === "DANGER" ? (
        <p className="small" style={{ margin: 0 }}>⚠️ 오늘 밤 대부분 시간이 위험(강풍·높은 파도·간조 고립 등)으로 예보돼요. 다른 곳이나 유료 낚시터를 고르세요.</p>
      ) : (
        <div className="night-grid">
          <span><small>추천 어종</small><b>{p.speciesName} {p.score}점</b></span>
          <span><small>가장 좋은 2시간</small><b>{p.best ? range(p.best) : "-"}</b></span>
          <span><small>들물</small><b>{p.flood.length ? p.flood.map(range).join(", ") : "밤엔 썰물"}</b></span>
          <span><small>바람·파도</small><b>{p.weather.windMax ?? "-"}m/s · {p.weather.waveMax ?? "-"}m</b></span>
        </div>
      )}
      {(p.pros.length > 0 || p.cons.length > 0) && (
        <span className="tags">
          {p.pros.map((x) => <span key={x} className="mini-chip green">{x}</span>)}
          {p.cons.map((x) => <span key={x} className="mini-chip red">{x}</span>)}
        </span>
      )}
      {p.spot.notes && <p className="small muted" style={{ margin: 0 }}>{p.spot.notes}</p>}
      <div className="row" style={{ gap: 8 }}>
        <Link className="btn small primary" href={`/spot/${p.spot.id}?species=${p.speciesId}&day=${today}`}>시간별 자세히</Link>
        <Link className="btn small" href={`/fish/${p.speciesId}`}>{p.speciesName} 채비 보기</Link>
        <a className="btn small" href={`https://map.kakao.com/link/to/${encodeURIComponent(p.spot.name)},${p.spot.lat},${p.spot.lon}`} target="_blank" rel="noreferrer">🧭 길찾기</a>
      </div>
    </article>
  );
}
