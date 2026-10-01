import { getSpot } from "@/data/spots";
import type { KV } from "@/lib/auth/server/store";
import { kstDateString } from "@/lib/engine/astro";
import { dayScore, getForecast, liveCtx, rankSpotsCached } from "@/lib/forecast";
import { digestMessages, soonMessages, type SpotDay } from "./plan";
import { allSubs, firstTime, removeSub, sendPush } from "./server";

export type PushKind = "digest" | "soon";

/** 예약 작업이 부르는 본체: 모든 구독자에게 해당 종류의 알림을 계산해 보낸다 */
export async function runPush(kv: KV, kind: PushKind, now = new Date()) {
  const subs = await allSubs(kv);
  const ctx = { ...liveCtx(), now };
  const today = kstDateString(now);
  const spotDays = new Map<string, Promise<SpotDay | null>>();
  const spotDay = (id: string) => {
    if (!spotDays.has(id))
      spotDays.set(
        id,
        (async () => {
          const spot = getSpot(id);
          if (!spot) return null;
          const f = await getForecast(id, undefined, ctx, today).catch(() => null);
          const day = f?.result.days.find((d) => d.date === today);
          if (!f || !day) return null;
          // 이번 주 오늘 이후 가장 먼저 오는 좋은 날 (65점 이상, 위험 아님)
          const good = f.all
            .flatMap((a) => a.result.days.filter((d) => d.date > today && d.verdict !== "DANGER" && dayScore(d) >= 65).map((d) => ({ date: d.date, score: dayScore(d) })))
            .sort((a, b) => a.date.localeCompare(b.date) || b.score - a.score)[0];
          return { spotId: id, spotName: spot.name, speciesId: f.species.id, speciesName: f.species.name, day, nextGood: good ?? null };
        })(),
      );
    return spotDays.get(id)!;
  };
  // 즐겨찾기가 없는 구독자: 오늘 전국 1위 포인트로 요약
  let topId: string | null | undefined;
  const fallback = async () => {
    if (topId === undefined) topId = (await rankSpotsCached(ctx, today)).find((r) => r.day.verdict !== "DANGER")?.spot.id ?? null;
    return topId ? [topId] : [];
  };

  let sent = 0;
  let gone = 0;
  let errors = 0;
  for (let i = 0; i < subs.length; i += 20) {
    await Promise.all(
      subs.slice(i, i + 20).map(async (rec) => {
        const ids = rec.favs.length ? rec.favs : kind === "digest" ? await fallback() : [];
        const items = (await Promise.all(ids.map(spotDay))).filter((x): x is SpotDay => !!x);
        const msgs = kind === "digest" ? digestMessages(items, rec.prefs, today) : soonMessages(items, rec.prefs, now.getTime());
        for (const m of msgs) {
          if (!(await firstTime(kv, rec.id, m.key))) continue;
          const r = await sendPush(rec, m);
          if (r === "ok") sent++;
          else if (r === "gone") {
            gone++;
            await removeSub(kv, rec.id);
            break;
          } else errors++;
        }
      }),
    );
  }
  return { kind, subs: subs.length, sent, gone, errors };
}
