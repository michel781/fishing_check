import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { SimBanner } from "@/components/Badges";
import { Tabs } from "@/components/Tabs";
import { SceneArt } from "@/components/art/SceneArt";
import { SEA_LABEL, SPOT_TYPE_LABEL } from "@/data/spots";
import { addDays } from "@/lib/dates";
import { kstDateString } from "@/lib/engine/astro";
import { dateLabel, kstHM, relativeDay } from "@/lib/format";
import { hourlyBoardCached } from "@/lib/forecast";
import { scoreGrade } from "@/lib/grade";
import { SLOTS, slotOfHour, slotRange, strongSpecies, type HourlyEntry } from "@/lib/hourly";
import { og } from "@/lib/site";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";
import type { Sea } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TITLE = "시간대별 추천";
const DESC = "새벽·오전·한낮·오후·저녁·심야, 하루 시간대마다 물고기가 가장 잘 잡히는 포인트와 어종을 실시간 예보로 추천해요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`⏰ ${TITLE} · 피싱체크`, DESC, "/hourly") };

type Search = Promise<{ day?: string; sea?: string; sim?: string; simDate?: string; simHour?: string }>;
const SEAS: (Sea | undefined)[] = [undefined, "WEST", "SOUTH", "EAST"];
const hm = (a: string, b: string) => `${kstHM(a)}–${kstHM(b)}`;
const pad = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

export default async function HourlyPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const ctx = ctxFrom(sp);
  const today = kstDateString(ctx.now);
  const dates = [today, addDays(today, 1), addDays(today, 2)];
  const date = sp.day && dates.includes(sp.day) ? sp.day : today;
  const sea: Sea | undefined = sp.sea === "WEST" || sp.sea === "EAST" || sp.sea === "SOUTH" ? sp.sea : undefined;
  const simQ = simQueryString(sp);
  const isToday = date === today;
  const now = ctx.now.getTime();
  const kstHour = (ctx.now.getUTCHours() + 9) % 24;
  // 새벽 0~4시는 '어제의 심야'라 오늘 목록에서는 새벽부터
  const nowSlot = slotOfHour(kstHour);
  const initial = isToday ? (kstHour < 4 ? "dawn" : nowSlot.id) : "dawn";

  const board = await hourlyBoardCached(ctx, date, sea);

  const href = (o: { day?: string; sea?: string }, hash?: string) => {
    const u = new URLSearchParams(simQ);
    const v = { day: date === today ? undefined : date, sea, ...o };
    for (const [k, x] of Object.entries(v)) if (x) u.set(k, x);
    const q = u.toString();
    return `/hourly${q ? `?${q}` : ""}${hash ? `#${hash}` : ""}`;
  };
  const spotHref = (e: HourlyEntry) => {
    const u = new URLSearchParams(simQ);
    u.set("species", e.speciesId);
    u.set("day", date);
    return `/spot/${e.spotId}?${u.toString()}`;
  };

  // 오늘 남은 시간대 중 가장 좋은 한 곳 (상단 요약)
  const bestOfDay = SLOTS.map((s) => ({ s, e: board.slots[s.id]?.[0] }))
    .filter((x): x is { s: (typeof SLOTS)[number]; e: HourlyEntry } => !!x.e)
    .sort((a, b) => b.e.avg - a.e.avg)[0];

  const tabs = SLOTS.map((s) => {
    const r = slotRange(date, s);
    const passed = isToday && r.to <= now;
    const live = isToday && r.from <= now && now < r.to;
    const list = board.slots[s.id] ?? [];
    const strong = strongSpecies(list);
    return {
      id: s.id,
      label: live ? `• ${s.label}` : s.label,
      content: (
        <>
          <div className="slot-head">
            <strong>
              {s.label} {pad(s.from)}–{pad(s.to)}
              {s.to > 24 && <span className="small muted"> (다음 날)</span>}
              {live && <span className="mini-chip green" style={{ marginLeft: 6 }}>지금</span>}
            </strong>
            <span className="small muted">{s.hint}</span>
          </div>
          {passed ? (
            <div className="card stack" style={{ gap: 8 }}>
              <p style={{ margin: 0 }}>이미 지난 시간대예요.</p>
              <Link className="btn" href={href({ day: dates[1] }, s.id)}>내일 같은 시간대 보기</Link>
            </div>
          ) : list.length === 0 ? (
            <div className="card">
              <p style={{ margin: 0 }}>이 시간대는 추천할 곳이 없어요. 바다가 위험하거나 배가 안 뜨는 시간일 수 있어요.</p>
            </div>
          ) : (
            <>
              {strong.length > 0 && (
                <p className="small" style={{ margin: 0 }}>
                  이 시간대에 강한 물고기:{" "}
                  {strong.map((x) => (
                    <Link key={x.id} className="mini-chip blue" href={`/fish/${x.id}`} style={{ marginRight: 4 }}>{x.name}</Link>
                  ))}
                </p>
              )}
              <ol className="rank-list" aria-label={`${s.label} 추천 순위`}>
                {list.map((e, i) => {
                  const g = scoreGrade(e.avg);
                  return (
                    <li key={e.spotId}>
                      <Link href={spotHref(e)} className={`rank-row${i < 3 ? " podium" : ""}`}>
                        <span className={`rank-no${i < 3 ? ` r${i + 1}` : ""}`} aria-label={`${i + 1}위`}>{i + 1}</span>
                        <span className="rank-thumb" aria-hidden><SceneArt id={e.spotId} type={e.type} /></span>
                        <span className="rank-main">
                          <span className="rank-name">{e.spotName}</span>
                          <span className="rank-meta">{e.area} · {SEA_LABEL[e.sea]} · {SPOT_TYPE_LABEL[e.type]}</span>
                          <span className="tags">
                            <span className="mini-chip blue">{e.speciesName}</span>
                            <span className="mini-chip orange num">{hm(e.start, e.end)}</span>
                            {e.reasons[0] && <span className="mini-chip green">{e.reasons[0]}</span>}
                          </span>
                        </span>
                        <span className="rank-score" aria-label={`${e.avg}점, ${g.label}`}>
                          <span className="n num">{e.avg}<small>점</small></span>
                          <span className={`grade-pill sm tone-${g.tone}`}>{g.label}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </>
      ),
    };
  });

  return (
    <>
      {isSimActive(sp) && <SimBanner label={simLabel(sp)} />}
      <div className="stack" style={{ gap: 14 }}>
        <AppHead title="⏰ 시간대별 추천" />
        <section className="hourly-hero">
          <span className="small" style={{ opacity: 0.85 }}>
            {isToday ? "오늘 남은 시간" : `${dateLabel(date)} 하루`} · 실시간 예보 · 시간대마다 가장 좋은 2시간 기준
          </span>
          {bestOfDay ? (
            <strong>
              {isToday ? "오늘" : relativeDay(date, today)} 최고는 <span className="night-accent">{bestOfDay.s.label}</span> {hm(bestOfDay.e.start, bestOfDay.e.end)}
              <br />
              {bestOfDay.e.spotName} {bestOfDay.e.speciesName} {bestOfDay.e.avg}점
            </strong>
          ) : (
            <strong>오늘은 남은 추천 시간이 없어요</strong>
          )}
          {board.partial && <span className="small" style={{ opacity: 0.85 }}>일부 예보가 늦어 잠시 뒤 새로 고치면 더 정확해요.</span>}
        </section>

        <nav className="chips" aria-label="날짜">
          {dates.map((d) => (
            <Link key={d} className="chip2 blue" href={href({ day: d === today ? undefined : d })} aria-current={d === date ? "true" : undefined}>
              {d === today ? "오늘" : relativeDay(d, today)}
            </Link>
          ))}
        </nav>
        <nav className="chips" aria-label="바다">
          {SEAS.map((s) => (
            <Link key={s ?? "ALL"} className="chip2" href={href({ sea: s })} aria-current={s === sea ? "true" : undefined}>
              {s ? SEA_LABEL[s] : "전체 바다"}
            </Link>
          ))}
        </nav>

        <Tabs tabs={tabs} label="시간대" initial={initial} />

        <p className="small muted" style={{ margin: 0 }}>
          점수는 물때·바람·파도·수온·빛(해 뜨고 지는 시간)·어종 습성으로 계산한 참고값이에요. 위험하거나 배가 안 뜨는 시간은 빠져 있어요.{" "}
          <Link className="link" href={`/best${simQ ? `?${simQ}` : ""}`}>하루 전체 순위 보기</Link>
        </p>
      </div>
    </>
  );
}
