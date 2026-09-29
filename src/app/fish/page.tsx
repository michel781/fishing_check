import type { Metadata } from "next";
import { AppHead } from "@/components/AppHead";
import { FishList, type FishItem } from "@/components/FishList";
import { metaOf, seasonIds, seasonLabel } from "@/data/fishMeta";
import { SPECIES } from "@/data/species";
import { isClosedSeason, seasonFactor } from "@/lib/engine/score";

export const metadata: Metadata = { title: "어종" };
export const dynamic = "force-dynamic";

export default function FishPage() {
  const now = new Date();
  const month = Number(new Date(now.getTime() + 9 * 3600e3).toISOString().slice(5, 7));
  const items: FishItem[] = SPECIES.map((s) => ({
    id: s.id,
    name: s.name,
    aka: s.aka,
    seasonLabel: seasonLabel(s),
    seasonIds: seasonIds(s),
    temp: `${s.temp.min}~${s.temp.max}℃`,
    level: metaOf(s.id).level,
    popular: metaOf(s.id).popular,
    inSeason: seasonFactor(s, now),
    closed: isClosedSeason(s, now),
  }));
  return (
    <div className="stack" style={{ gap: 12 }}>
      <AppHead title="어종" back={false} />
      <FishList items={items} month={month} />
    </div>
  );
}
