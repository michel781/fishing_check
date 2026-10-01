import { getSpecies, SPECIES_BY_ID } from "@/data/species";
import { getSpot, nearbySpots, SPOTS } from "@/data/spots";
import { kstDateString, type MulddaeSystem } from "@/lib/engine/astro";
import { isClosedSeason, scoreForecast, seasonFactor } from "@/lib/engine/score";
import { getConditions } from "@/lib/providers";
import { persist } from "@/lib/persist";
import { memo } from "@/lib/providers/http";
import { scenarioBundle, type ScenarioId } from "@/lib/sim/scenarios";
import { SLOTS, slotRange, slotTop, type HourlyCandidate, type HourlyEntry } from "@/lib/hourly";
import type { ConditionsBundle, DaySummary, ForecastResult, Sea, Species, Spot } from "@/lib/types";

export const DEFAULT_DAYS = 7;

/** 요청 맥락: 기준 시각과(선택) 시뮬레이션 시나리오 */
export interface Ctx {
  now: Date;
  sim?: ScenarioId;
  mulddae?: MulddaeSystem;
}

export const liveCtx = (): Ctx => ({ now: new Date() });

export async function conditionsFor(spot: Spot, ctx: Ctx, days = DEFAULT_DAYS): Promise<ConditionsBundle> {
  return ctx.sim ? scenarioBundle(spot, ctx.sim, ctx.now, days) : getConditions(spot, days, ctx.now);
}

/** 시즌만으로 본 어종 순서 (데이터가 없을 때의 기본값) */
export function rankSpeciesForSpot(spot: Spot, date = new Date()): Species[] {
  return spot.species
    .map((id) => SPECIES_BY_ID[id])
    .filter((s): s is Species => !!s)
    .map((s) => ({
      s,
      k: (isClosedSeason(s, date) ? -1 : seasonFactor(s, date)) * (0.5 + 0.5 * (s.spot[spot.type] ?? 0.3)),
    }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.s);
}

/** 날짜별 판단 점수: 오늘은 남은 시간 기준, 그 외는 하루 최고점 */
export function dayScore(d: DaySummary): number {
  return d.remainingBest ?? d.best;
}

export interface SpeciesScore {
  species: Species;
  result: ForecastResult;
}

export interface SpotForecast {
  spot: Spot;
  species: Species;
  result: ForecastResult;
  /** 선택한 날짜 기준 어종별 점수 (높은 순) */
  ranking: { species: Species; score: number; closed: boolean; danger: boolean }[];
  all: SpeciesScore[];
  /** 외부 응답이 늦어 일부 대체 값으로 계산했는지 */
  partial: boolean;
}

function scoreAll(spot: Spot, bundle: ConditionsBundle, ctx: Ctx): SpeciesScore[] {
  return spot.species
    .map((id) => SPECIES_BY_ID[id])
    .filter(Boolean)
    .map((sp) => ({ species: sp, result: scoreForecast(spot, sp, bundle, { mulddaeSystem: ctx.mulddae, now: ctx.now }) }));
}

/** 포인트의 모든 어종 점수 (10분 버킷 캐시 — 랭킹·대체 포인트·상세가 같은 계산을 공유) */
async function scoredSpot(spot: Spot, ctx: Ctx): Promise<{ bundle: ConditionsBundle; all: SpeciesScore[] }> {
  const bucket = Math.floor(ctx.now.getTime() / (10 * 60 * 1000));
  return memo(`scored:${spot.id}:${ctx.sim ?? "live"}:${ctx.mulddae ?? "auto"}:${bucket}`, (v: { bundle: ConditionsBundle }) => (v.bundle.partial ? 60 : 600), async () => {
    const bundle = await conditionsFor(spot, ctx);
    return { bundle, all: scoreAll(spot, bundle, ctx) };
  });
}

function rankForDate(all: SpeciesScore[], date: string) {
  return all
    .map(({ species, result }) => {
      const d = result.days.find((x) => x.date === date) ?? result.days[0];
      return { species, score: dayScore(d), closed: isClosedSeason(species, new Date(`${d.date}T12:00:00+09:00`)), danger: d.verdict === "DANGER" };
    })
    .sort((a, b) => Number(a.closed) - Number(b.closed) || b.score - a.score);
}

export async function getForecast(
  spotId: string,
  speciesId: string | undefined,
  ctx: Ctx,
  date?: string,
): Promise<SpotForecast | null> {
  const spot = getSpot(spotId);
  if (!spot) return null;
  const { all, bundle } = await scoredSpot(spot, ctx);
  const targetDate = date ?? kstDateString(ctx.now);
  const ranking = rankForDate(all, targetDate);
  const chosen =
    (speciesId && all.find((a) => a.species.id === speciesId)) ||
    all.find((a) => a.species.id === ranking[0]?.species.id) ||
    all[0];
  return { spot, species: chosen.species, result: chosen.result, ranking, all, partial: !!bundle.partial };
}

/** 포인트의 날짜별 최고 어종 요약 (홈 카드·랭킹용) */
export async function getSpotOverview(spotId: string, ctx: Ctx) {
  const spot = getSpot(spotId);
  if (!spot) return null;
  const { bundle, all } = await scoredSpot(spot, ctx);
  const byDay = all[0].result.days.map((_, i) => {
    const ranked = all
      .map((p) => ({ species: p.species, day: p.result.days[i] }))
      .filter((x) => !isClosedSeason(x.species, new Date(`${x.day.date}T12:00:00+09:00`)))
      .sort((a, b) => dayScore(b.day) - dayScore(a.day));
    const top = ranked[0] ?? { species: all[0].species, day: all[0].result.days[i] };
    return { date: top.day.date, top, ranked };
  });
  return { spot, byDay, sources: bundle.sources, notes: bundle.notes, partial: !!bundle.partial };
}

export interface RankedSpot {
  spot: Spot;
  species: Species;
  day: DaySummary;
  score: number;
}

/**
 * 랭킹 공유 캐시: 52곳 × 모든 어종 계산을 10분에 한 번만 (모든 방문자가 같은 결과를 바로 받음).
 * 시뮬레이션·물때 방식 직접 지정·과거/미래 시각이면 바로 계산한다.
 */
// 일부 대체 값으로 만든 랭킹은 공유 캐시에 넣지 않는다 (unstable_cache 는 예외를 저장하지 않음 → 이전 값 유지)
const partialRanks = new WeakSet<RankedSpot[]>();
/** 외부 응답이 늦어 일부 대체 값이 섞인 랭킹인지 (CDN 캐시를 짧게) */
export const isPartialRanking = (r: RankedSpot[]) => partialRanks.has(r);
class PartialRank extends Error {
  readonly partialRank = true;
  constructor(public ranked: RankedSpot[]) {
    super("partial ranking");
  }
}

const sharedRank = persist(
  async (date: string, sea: Sea | "ALL") => {
    const r = await rankSpots({ now: new Date() }, date, sea === "ALL" ? undefined : sea);
    if (isPartialRanking(r)) throw new PartialRank(r);
    return r;
  },
  "rank-v1",
  600,
);

export async function rankSpotsCached(ctx: Ctx, date: string, sea?: Sea): Promise<RankedSpot[]> {
  if (ctx.sim || ctx.mulddae || Math.abs(ctx.now.getTime() - Date.now()) > 5 * 60e3) return rankSpots(ctx, date, sea);
  try {
    return await sharedRank(date, sea ?? "ALL");
  } catch (e) {
    if (!e || typeof e !== "object" || (e as { partialRank?: boolean }).partialRank !== true) throw e;
    const r = (e as PartialRank).ranked;
    partialRanks.add(r);
    return r;
  }
}

/** 해역 전체 포인트 랭킹 (지정 날짜) */
export async function rankSpots(ctx: Ctx, date: string, sea?: Sea): Promise<RankedSpot[]> {
  const spots = SPOTS.filter((s) => !sea || s.sea === sea);
  let partial = false;
  const res = await Promise.all(
    spots.map(async (s) => {
      const o = await getSpotOverview(s.id, ctx);
      if (o?.partial) partial = true;
      const d = o?.byDay.find((x) => x.date === date);
      return d ? { spot: s, species: d.top.species, day: d.top.day, score: dayScore(d.top.day) } : null;
    }),
  );
  const out = res
    .filter((x): x is RankedSpot => !!x)
    .sort((a, b) => Number(a.day.verdict === "DANGER") - Number(b.day.verdict === "DANGER") || b.score - a.score);
  if (partial) partialRanks.add(out);
  return out;
}

/** 대체 포인트 계산에 쓸 근처 포인트 데이터를 미리(동시에) 받아 둔다 — 상세 화면이 두 번 기다리지 않게 */
export function warmNearby(spot: Spot, ctx: Ctx) {
  for (const n of nearbySpots(spot, 60).slice(0, 6)) void getSpotOverview(n.spot.id, ctx).catch(() => {});
}

export interface Alternative {
  spot: Spot;
  km: number;
  species: Species;
  day: DaySummary;
}

/**
 * 같은 해역 인근의 대체 포인트. 워킹 낚시꾼에게는 워킹 포인트를, 선상에는 선상을 먼저 권한다.
 * 위험일이면 파도를 막아주는 내항을 우선한다.
 */
export async function findAlternatives(spot: Spot, date: string, ctx: Ctx, limit = 3): Promise<Alternative[]> {
  const boat = spot.type === "BOAT";
  const near = nearbySpots(spot, 60)
    .filter((n) => (boat ? true : n.spot.type !== "BOAT"))
    .slice(0, 6);
  const results = await Promise.all(
    near.map(async ({ spot: s, km }) => {
      const o = await getSpotOverview(s.id, ctx);
      const d = o?.byDay.find((x) => x.date === date);
      return d ? { spot: s, km, species: d.top.species, day: d.top.day } : null;
    }),
  );
  const origin = await getSpotOverview(spot.id, ctx);
  const originDay = origin?.byDay.find((x) => x.date === date)?.top.day;
  const originScore = originDay ? dayScore(originDay) : 0;
  return results
    .filter((x): x is Alternative => !!x && x.day.verdict !== "DANGER" && dayScore(x.day) > originScore)
    .sort((a, b) => {
      const sameKind = (x: Alternative) => Number((x.spot.type === "BOAT") === boat);
      return sameKind(b) - sameKind(a) || dayScore(b.day) - dayScore(a.day);
    })
    .slice(0, limit);
}

export { getSpecies };

// ───────── 하루 시간대별 추천 ─────────
export interface HourlyBoard {
  date: string;
  slots: Record<string, HourlyEntry[]>;
  partial: boolean;
}

/** 모든 포인트 × 어종의 시간 점수에서 시간대별 상위 목록을 만든다 (오늘이면 지난 시간 제외) */
export async function buildHourlyBoard(ctx: Ctx, date: string, sea?: Sea): Promise<HourlyBoard> {
  const spots = SPOTS.filter((s) => !sea || s.sea === sea);
  let partial = false;
  const cands = (
    await Promise.all(
      spots.map(async (s) => {
        const f = await getForecast(s.id, undefined, ctx, date);
        if (!f) return null;
        if (f.partial) partial = true;
        return {
          spot: s,
          species: f.all
            .filter((a) => !isClosedSeason(a.species, new Date(`${date}T12:00:00+09:00`)))
            .map((a) => ({ id: a.species.id, name: a.species.name, hours: a.result.hours })),
        };
      }),
    )
  ).filter((x): x is HourlyCandidate & { spot: Spot } => !!x);
  const now = kstDateString(ctx.now) === date ? ctx.now.getTime() : undefined;
  const slots: Record<string, HourlyEntry[]> = {};
  for (const sl of SLOTS) slots[sl.id] = slotTop(cands, slotRange(date, sl), 8, now);
  return { date, slots, partial };
}

class PartialBoard extends Error {
  readonly partialBoard = true;
  constructor(public board: HourlyBoard) {
    super("partial board");
  }
}

// 10분 버킷: 오늘은 지난 시간이 빠져야 하므로 버킷이 키에 들어간다
const sharedHourly = persist(
  async (date: string, sea: Sea | "ALL", _bucket: number) => {
    const b = await buildHourlyBoard({ now: new Date() }, date, sea === "ALL" ? undefined : sea);
    if (b.partial) throw new PartialBoard(b);
    return b;
  },
  "hourly-v1",
  600,
);

export async function hourlyBoardCached(ctx: Ctx, date: string, sea?: Sea): Promise<HourlyBoard> {
  if (ctx.sim || ctx.mulddae || Math.abs(ctx.now.getTime() - Date.now()) > 5 * 60e3) return buildHourlyBoard(ctx, date, sea);
  try {
    return await sharedHourly(date, sea ?? "ALL", Math.floor(Date.now() / 600e3));
  } catch (e) {
    if (e && typeof e === "object" && (e as { partialBoard?: boolean }).partialBoard) return (e as PartialBoard).board;
    throw e;
  }
}
