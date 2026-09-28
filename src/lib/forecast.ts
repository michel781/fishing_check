import { getSpecies, SPECIES_BY_ID } from "@/data/species";
import { getSpot, nearbySpots } from "@/data/spots";
import type { MulddaeSystem } from "@/lib/engine/astro";
import { isClosedSeason, scoreForecast, seasonFactor } from "@/lib/engine/score";
import { getConditions } from "@/lib/providers";
import type { DaySummary, ForecastResult, Species, Spot } from "@/lib/types";

export const DEFAULT_DAYS = 7;

/** 포인트에서 지금 시즌에 가장 맞는 어종 순으로 정렬 */
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

export interface SpotForecast {
  spot: Spot;
  species: Species;
  result: ForecastResult;
}

export async function getForecast(
  spotId: string,
  speciesId?: string,
  opts: { days?: number; mulddae?: MulddaeSystem } = {},
): Promise<SpotForecast | null> {
  const spot = getSpot(spotId);
  if (!spot) return null;
  const species = (speciesId && spot.species.includes(speciesId) && getSpecies(speciesId)) || rankSpeciesForSpot(spot)[0];
  const bundle = await getConditions(spot, opts.days ?? DEFAULT_DAYS);
  const result = scoreForecast(spot, species, bundle, { mulddaeSystem: opts.mulddae });
  return { spot, species, result };
}

/** 포인트의 모든 어종을 계산해 날짜별 최고 어종을 고른다 */
export async function getSpotOverview(spotId: string, days = DEFAULT_DAYS) {
  const spot = getSpot(spotId);
  if (!spot) return null;
  const bundle = await getConditions(spot, days);
  const perSpecies = spot.species
    .map((id) => SPECIES_BY_ID[id])
    .filter(Boolean)
    .map((sp) => ({ species: sp, result: scoreForecast(spot, sp, bundle) }));
  const byDay = perSpecies[0]?.result.days.map((_, i) => {
    const ranked = perSpecies
      .map((p) => ({ species: p.species, day: p.result.days[i] }))
      .sort((a, b) => b.day.best - a.day.best);
    return { date: ranked[0].day.date, top: ranked[0], ranked };
  }) ?? [];
  return { spot, byDay, sources: bundle.sources, notes: bundle.notes };
}

export interface Alternative {
  spot: Spot;
  km: number;
  species: Species;
  day: DaySummary;
}

/** 같은 해역 인근 포인트 중 해당 날짜에 더 나은 곳 (위험하지 않은 곳 우선) */
export async function findAlternatives(spot: Spot, date: string, limit = 3): Promise<Alternative[]> {
  const near = nearbySpots(spot, 60).slice(0, 5);
  const results = await Promise.all(
    near.map(async ({ spot: s, km }) => {
      const sp = rankSpeciesForSpot(s)[0];
      if (!sp) return null;
      const bundle = await getConditions(s, DEFAULT_DAYS);
      const r = scoreForecast(s, sp, bundle);
      const day = r.days.find((d) => d.date === date);
      return day ? { spot: s, km, species: sp, day } : null;
    }),
  );
  return results
    .filter((x): x is Alternative => !!x && x.day.verdict !== "DANGER")
    .sort((a, b) => b.day.best - a.day.best)
    .slice(0, limit);
}
