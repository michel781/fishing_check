import type { Metadata } from "next";
import Link from "next/link";
import { SimBanner } from "@/components/Badges";
import { SPECIES } from "@/data/species";
import { SEA_LABEL, SPOT_TYPE_LABEL } from "@/data/spots";
import { addDays, weekendDates } from "@/lib/dates";
import { kstDateString } from "@/lib/engine/astro";
import { rankSpotsCached } from "@/lib/forecast";
import { dateLabel, kstHM, relativeDay } from "@/lib/format";
import { BackButton } from "@/components/AppHead";
import { SceneArt } from "@/components/art/SceneArt";
import { IcCatch } from "@/components/icons";
import { scoreGrade } from "@/lib/grade";
import { regionOf } from "@/lib/regions";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";
import type { Sea } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TITLE = "가장 잘 잡히는 포인트";
const DESC = "지금 가장 잘 잡히는 바다낚시 포인트를 점수 순으로 보여드려요. 골든타임과 추천 물고기까지.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🎣 ${TITLE} · 피싱체크`, DESC, "/best") };

type Search = Promise<{ day?: string; sea?: string; kind?: string; fish?: string; sim?: string; simDate?: string; simHour?: string }>;

export default async function BestPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const ctx = ctxFrom(sp);
  const today = kstDateString(ctx.now);
  const dates = Array.from(new Set([today, addDays(today, 1), ...weekendDates(today)]));
  const date = sp.day && dates.includes(sp.day) ? sp.day : today;
  const sea: Sea | undefined = sp.sea === "WEST" || sp.sea === "EAST" || sp.sea === "SOUTH" ? sp.sea : undefined;
  const kind = sp.kind === "walk" || sp.kind === "boat" ? sp.kind : "all";
  const fish = SPECIES.some((s) => s.id === sp.fish) ? sp.fish : undefined;
  const simQ = simQueryString(sp);

  const all = await rankSpotsCached(ctx, date, sea);
  const byKind = all.filter((r) => kind === "all" || (kind === "boat" ? r.spot.type === "BOAT" : r.spot.type !== "BOAT"));
  const byFish = fish ? byKind.filter((r) => r.spot.species.includes(fish)) : byKind;
  const safe = byFish.filter((r) => r.day.verdict !== "DANGER");
  const danger = byFish.length - safe.length;

  const href = (o: Partial<{ day: string; sea: string; kind: string; fish: string }>) => {
    const u = new URLSearchParams(simQ);
    const v = { day: date === today ? undefined : date, sea: sea, kind: kind === "all" ? undefined : kind, fish, ...o };
    for (const [k, x] of Object.entries(v)) if (x) u.set(k, x);
    const q = u.toString();
    return `/best${q ? `?${q}` : ""}`;
  };
  const spotHref = (id: string, species: string) => {
    const u = new URLSearchParams(simQ);
    u.set("species", species);
    u.set("day", date);
    return `/spot/${id}?${u.toString()}`;
  };

  const top = safe[0];
  const dayWord = date === today ? "오늘" : relativeDay(date, today);
  const chip = (label: string, current: boolean, to: string, key?: string) => (
    <Link key={key ?? label} className="chip2 blue" href={to} aria-current={current ? "true" : undefined}>{label}</Link>
  );

  return (
    <>
      {isSimActive(sp) && <SimBanner label={simLabel(sp)} />}
      <div className="stack" style={{ gap: 14 }}>
        <section className="best-hero" aria-labelledby="best-title">
          <div className="best-hero-top">
            <BackButton className="round-btn" fallback="/" />
          </div>
          <div className="best-title-row">
            <span className="best-icon" aria-hidden><IcCatch size={34} /></span>
            <h1 id="best-title">가장 잘 잡히는<br />포인트</h1>
          </div>
          <p>{date === today ? "지금부터 남은 시간" : `${dateLabel(date)} 하루`} 기준 · 점수가 높은 순서</p>
          <div className="best-stats">
            <span><b className="num">{safe.length}</b>곳 추천</span>
            {top && <span className="ellip">1위 <b>{top.spot.name}</b> <b className="num">{top.score}</b>점</span>}
            {danger > 0 && <span>위험 <b className="num">{danger}</b>곳 제외</span>}
          </div>
        </section>

        <nav className="u-tabs" aria-label="날짜">
          {dates.map((d) => (
            <Link key={d} href={href({ day: d === today ? "" : d })} aria-current={d === date ? "true" : undefined}>
              {d === today ? "오늘" : relativeDay(d, today)}
            </Link>
          ))}
        </nav>

        <div className="filter-box">
          <div className="filter-row">
            <span className="filter-label">바다</span>
            <nav className="chips" aria-label="바다">
              {([["", "전체"], ["WEST", "서해"], ["SOUTH", "남해"], ["EAST", "동해"]] as const).map(([v, l]) => chip(l, (sea ?? "") === v, href({ sea: v })))}
            </nav>
          </div>
          <div className="filter-row">
            <span className="filter-label">방법</span>
            <nav className="chips" aria-label="낚시 방법">
              {([["all", "전체"], ["walk", "방파제·갯바위"], ["boat", "배낚시"]] as const).map(([v, l]) => chip(l, kind === v, href({ kind: v === "all" ? "" : v })))}
            </nav>
          </div>
          <div className="filter-row">
            <span className="filter-label">어종</span>
            <nav className="chips" aria-label="물고기">
              {chip("전체", !fish, href({ fish: "" }))}
              {SPECIES.map((sp2) => chip(sp2.name, fish === sp2.id, href({ fish: sp2.id }), sp2.id))}
            </nav>
          </div>
        </div>

        {danger > 0 && danger / Math.max(1, byFish.length) > 0.5 && (
          <p className="alert small" style={{ margin: 0 }}>⚠ 바람·파도가 위험한 곳이 많아요({danger}곳 제외). {dayWord}은 쉬는 걸 추천해요.</p>
        )}

        {safe.length === 0 ? (
          <div className="card">
            <p className="sub" style={{ margin: 0 }}>조건에 맞는 추천 포인트가 없어요. 다른 날이나 바다를 골라 보세요.</p>
          </div>
        ) : (
          <ol className="rank-list" aria-label="추천 포인트 순위">
            {safe.slice(0, 20).map((r, i) => {
              const g = r.day.nextGolden ?? (r.day.remainingBest == null ? r.day.golden[0] : null);
              const grade = scoreGrade(r.score);
              return (
                <li key={r.spot.id}>
                  <Link href={spotHref(r.spot.id, r.species.id)} className={`rank-row${i < 3 ? " podium" : ""}`}>
                    <span className={`rank-no${i < 3 ? ` r${i + 1}` : ""}`} aria-label={`${i + 1}위`}>{i + 1}</span>
                    <span className="rank-thumb" aria-hidden><SceneArt id={r.spot.id} type={r.spot.type} /></span>
                    <span className="rank-main">
                      <span className="rank-name">{r.spot.name}</span>
                      <span className="rank-meta">{regionOf(r.spot.area)} {r.spot.area} · {SPOT_TYPE_LABEL[r.spot.type]}</span>
                      <span className="tags">
                        <span className="mini-chip blue">{r.species.name}</span>
                        {g && <span className="mini-chip orange num">황금타임 {kstHM(g.start)}~{kstHM(g.end)}</span>}
                      </span>
                    </span>
                    <span className="rank-score" aria-label={`${r.score}점, ${grade.label}`}>
                      <span className="n num">{r.score}<small>점</small></span>
                      <span className={`grade-pill sm tone-${grade.tone}`}>{grade.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        <p className="note" style={{ margin: 0 }}>점수는 물때·바람·파도·물 온도·시간대·장소·제철을 합친 예측이에요. 출발 전 현장 안전을 꼭 확인하세요.</p>
      </div>
    </>
  );
}
