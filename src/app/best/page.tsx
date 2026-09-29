import type { Metadata } from "next";
import Link from "next/link";
import { SimBanner } from "@/components/Badges";
import { SPECIES } from "@/data/species";
import { SEA_LABEL, SPOT_TYPE_LABEL } from "@/data/spots";
import { addDays, weekendDates } from "@/lib/dates";
import { kstDateString } from "@/lib/engine/astro";
import { rankSpots } from "@/lib/forecast";
import { dateLabel, kstHM, relativeDay, VERDICT_SHORT } from "@/lib/format";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";
import type { Sea } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TITLE = "가장 잘 잡히는 포인트";
const DESC = "지금 가장 잘 잡히는 바다낚시 포인트를 점수 순으로 보여드려요. 골든타임과 추천 물고기까지.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🏆 ${TITLE} · 피싱체크`, DESC, "/best") };

type Search = Promise<{ day?: string; sea?: string; kind?: string; fish?: string; sim?: string; simDate?: string; simHour?: string }>;

export default async function BestPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const ctx = ctxFrom(sp);
  const today = kstDateString(ctx.now);
  const dates = Array.from(new Set([today, addDays(today, 1), ...weekendDates(today)]));
  const date = sp.day && dates.includes(sp.day) ? sp.day : today;
  const sea: Sea | undefined = sp.sea === "WEST" || sp.sea === "EAST" ? sp.sea : undefined;
  const kind = sp.kind === "walk" || sp.kind === "boat" ? sp.kind : "all";
  const fish = SPECIES.some((s) => s.id === sp.fish) ? sp.fish : undefined;
  const simQ = simQueryString(sp);

  const all = await rankSpots(ctx, date, sea);
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

  return (
    <>
      {isSimActive(sp) && <SimBanner label={simLabel(sp)} />}
      <div className="stack">
        <section className="hero-band" aria-labelledby="best-title">
          <h1 id="best-title">🏆 가장 잘 잡히는 포인트</h1>
          <p>
            {date === today ? "지금부터 남은 시간" : `${dateLabel(date)} 하루`} 기준, 점수가 높은 순서예요. 🎯 골든타임에 맞춰 가세요.
          </p>
        </section>

        <nav className="tabs tight" aria-label="날짜">
          {dates.map((d) => (
            <Link key={d} className="pill" href={href({ day: d === today ? "" : d })} aria-current={d === date ? "true" : undefined}>
              {d === today ? "오늘" : relativeDay(d, today)}
            </Link>
          ))}
        </nav>
        <nav className="tabs tight" aria-label="바다·낚시 방법">
          {([["", "전체"], ["WEST", "서해"], ["EAST", "동해"]] as const).map(([v, l]) => (
            <Link key={l} className="pill" href={href({ sea: v })} aria-current={(sea ?? "") === v ? "true" : undefined}>{l}</Link>
          ))}
          {([["all", "워킹+선상"], ["walk", "🚶 워킹"], ["boat", "🚤 선상"]] as const).map(([v, l]) => (
            <Link key={v} className="pill" href={href({ kind: v === "all" ? "" : v })} aria-current={kind === v ? "true" : undefined}>{l}</Link>
          ))}
        </nav>
        <nav className="tabs tight" aria-label="물고기">
          <Link className="pill" href={href({ fish: "" })} aria-current={!fish ? "true" : undefined}>모든 물고기</Link>
          {SPECIES.map((s) => (
            <Link key={s.id} className="pill" href={href({ fish: s.id })} aria-current={fish === s.id ? "true" : undefined}>{s.name}</Link>
          ))}
        </nav>

        {danger > 0 && (
          <p className={danger / Math.max(1, byFish.length) > 0.5 ? "alert small" : "small g-DANGER"} style={{ margin: 0 }}>
            ⚠ 바람·파도가 위험한 {danger}곳은 목록에서 뺐어요.{danger / Math.max(1, byFish.length) > 0.5 ? " 이날은 쉬는 걸 추천해요." : ""}
          </p>
        )}

        {safe.length === 0 ? (
          <div className="card">
            <p className="sub" style={{ margin: 0 }}>조건에 맞는 추천 포인트가 없어요. 다른 날이나 바다를 골라 보세요.</p>
          </div>
        ) : (
          <ol className="list" aria-label="추천 포인트 순위">
            {safe.slice(0, 20).map((r, i) => {
              const g = r.day.nextGolden ?? (r.day.remainingBest == null ? r.day.golden[0] : null);
              return (
                <li key={r.spot.id}>
                  <Link href={spotHref(r.spot.id, r.species.id)} className="card card-link rank-card">
                    <span className={`medal${i < 3 ? ` m${i + 1}` : ""}`} aria-label={`${i + 1}위`}>{i + 1}</span>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: "block" }}>{r.spot.name}</strong>
                      <span className="small muted" style={{ display: "block" }}>
                        {SEA_LABEL[r.spot.sea]} · {r.spot.area} · {SPOT_TYPE_LABEL[r.spot.type]}
                      </span>
                      <span className="small accent-text" style={{ display: "block", fontWeight: 600 }}>
                        🐟 {r.species.name}{g ? ` · 🎯 ${kstHM(g.start)}–${kstHM(g.end)}` : ""}
                      </span>
                    </span>
                    <span className={`score-pill num v-${r.day.verdict}`} aria-label={`${r.score}점 ${VERDICT_SHORT[r.day.verdict]}`}>{r.score}</span>
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
