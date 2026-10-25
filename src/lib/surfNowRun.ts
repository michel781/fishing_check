import { SPOTS } from "@/data/spots";
import { fixedCams, isLiveArea, LIVE_AREAS, quickChecks, ytId, type LiveArea, type LiveLink } from "@/data/liveView";
import { getForecast, type Ctx } from "@/lib/forecast";
import { isPelagic, isPilotWalkSpot, picksFor, PILOT_LABEL } from "@/lib/pelagicAgent";
import { SOURCE_LABEL } from "@/lib/providers";
import { NOW_HORIZON_MS, parseLiveNow, rankNow, SURF_TYPES, surfCheck, toNowPick, windowHours, type NowPick } from "@/lib/surfNow";
import type { HourScore } from "@/lib/types";

export interface Cam extends LiveLink {
  /** 유튜브 고정 캠만: true 방송 중 · false 방송 안 함 · null 확인 못 함 */
  live: boolean | null;
}

export interface AreaNow {
  area: LiveArea;
  /** 지금 시각 기준 지역 포인트들의 최댓값·평균 */
  waveM: number | null;
  windMs: number | null;
  seaTempC: number | null;
  coldWater: boolean;
  cams: Cam[];
  checks: LiveLink[];
}

export interface NowRun {
  region: string;
  generatedAt: string;
  fetchedAt: string | null;
  formula: string;
  sources: string;
  picks: NowPick[];
  areas: AreaNow[];
  checked: { id: string; name: string; area: string; why?: string }[];
  partial: boolean;
}

const HOUR = 3600e3;
const nearest = (hours: HourScore[], t: number) => hours.find((h) => Math.abs(Date.parse(h.time) - t) < HOUR / 2) ?? null;

async function ytLiveNow(id: string): Promise<boolean | null> {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=ko`, {
      signal: AbortSignal.timeout(3500),
      headers: { "accept-language": "ko-KR,ko;q=0.9", "user-agent": "Mozilla/5.0 (compatible; fishing-check)" },
      next: { revalidate: 300 },
    });
    return r.ok ? parseLiveNow(await r.text()) : null;
  } catch {
    return null;
  }
}

/**
 * 한 번에 찾기 — 속초·양양·강릉 해변·방파제 끝·외항·갯바위의 최신 예보(파도·바람·수온·냉수대)·물때·해 뜨는 시각을 다시 받아
 * 앞으로 24시간 안 회유어 서프루어 후보를 고르고, 유튜브 고정 캠 방송 상태를 확인한다. 새떼·보일링·조황은 자동으로 알 수 없어 확인 링크를 붙인다.
 */
export async function runSurfNow(ctx: Ctx, limit = 4): Promise<NowRun> {
  const spots = SPOTS.filter((s) => isPilotWalkSpot(s) && SURF_TYPES.includes(s.type));
  const now = ctx.now.getTime();
  const camList = LIVE_AREAS.flatMap((a) => fixedCams(a).map((c) => ({ a, c })));
  const [fcs, lives] = await Promise.all([
    Promise.all(spots.map((s) => getForecast(s.id, undefined, ctx).catch((e) => {
      console.error("[now] forecast failed", s.id, e instanceof Error ? e.message : e);
      return null;
    }))),
    // 시뮬레이션은 외부 방송을 보지 않는다
    Promise.all(camList.map(({ c }) => { const id = ytId(c.url); return id && !ctx.sim ? ytLiveNow(id) : Promise.resolve(null); })),
  ]);

  const all: NowPick[] = [];
  const checked: NowRun["checked"] = [];
  const cur: Record<string, { waveM: number[]; windMs: number[]; seaTempC: number[]; cold: boolean }> = {};
  spots.forEach((spot, i) => {
    const f = fcs[i];
    if (!f) return void checked.push({ id: spot.id, name: spot.name, area: spot.area, why: "예보를 불러오지 못했어요" });
    const pel = f.all.filter((a) => isPelagic(a.species.id));
    const ref = (pel[0] ?? f.all[0])?.result;
    const h = ref ? nearest(ref.hours, now) : null;
    const c = (cur[spot.area] ??= { waveM: [], windMs: [], seaTempC: [], cold: false });
    if (h) {
      if (h.cond.waveM != null) c.waveM.push(h.cond.waveM);
      if (h.cond.windMs != null) c.windMs.push(h.cond.windMs);
      if (h.cond.seaTempC != null) c.seaTempC.push(h.cond.seaTempC);
      if (surfCheck(spot, [h]).coldWater) c.cold = true;
    }
    if (!pel.length) return void checked.push({ id: spot.id, name: spot.name, area: spot.area, why: "앱 자료상 회유어 대상이 아니에요(원투·바닥 어종 위주)" });
    const before = all.length;
    for (const a of pel) {
      for (const p of picksFor(f.spot, a.species, a.result, ctx.now, 2)) {
        if (Date.parse(p.start) > now + NOW_HORIZON_MS) continue;
        all.push(toNowPick(p, surfCheck(f.spot, windowHours(a.result, p, ctx.now)), ctx.now));
      }
    }
    const danger = ref?.hours.some((x) => x.safety === "DANGER" && Date.parse(x.time) >= now && Date.parse(x.time) < now + NOW_HORIZON_MS);
    checked.push({ id: spot.id, name: spot.name, area: spot.area, why: all.length > before ? undefined : danger ? "앞으로 24시간 피딩 시간대가 바람·파도 위험이에요" : "앞으로 24시간 낚시할 수 있는 시간대가 없어요" });
  });

  const avg = (v: number[]) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null);
  const areas: AreaNow[] = LIVE_AREAS.map((area) => {
    const c = cur[area];
    return {
      area,
      waveM: c?.waveM.length ? Math.max(...c.waveM) : null,
      windMs: c?.windMs.length ? Math.max(...c.windMs) : null,
      seaTempC: c ? avg(c.seaTempC) : null,
      coldWater: !!c?.cold,
      cams: camList.flatMap((x, i) => (x.a === area ? [{ ...x.c, live: lives[i] }] : [])),
      checks: quickChecks(area),
    };
  });

  const ok = fcs.filter((f) => f != null);
  const src = ok[0]?.all[0]?.result.sources;
  const fetched = ok.map((f) => f.all[0]?.result.fetchedAt).filter((x): x is string => !!x).sort()[0] ?? null;
  return {
    region: PILOT_LABEL,
    generatedAt: ctx.now.toISOString(),
    fetchedAt: fetched,
    formula: "지금 점수 = 에이전트 점수 − 파도·바람 주의 8 − 앞바람(5m/s 이상) 5 − 냉수대 15",
    sources: src ? `날씨 ${SOURCE_LABEL[src.weather]} · 파도·수온 ${SOURCE_LABEL[src.marine]} · 물때 ${SOURCE_LABEL[src.tide]}` : "예보 없음",
    picks: rankNow(all, limit).filter((p) => isLiveArea(p.area)),
    areas,
    checked,
    partial: ok.some((f) => f.partial),
  };
}
