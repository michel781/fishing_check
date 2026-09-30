import type { Metadata } from "next";
import { AppHead } from "@/components/AppHead";
import { AccountCard } from "@/components/auth/AccountCard";
import { CatchLog } from "@/components/CatchLog";
import { SPECIES } from "@/data/species";
import { SPOTS } from "@/data/spots";

export const metadata: Metadata = { title: "내 기록" };

type Search = Promise<{ spot?: string; species?: string }>;

export default async function LogPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <AppHead title="내 기록" back={false} />
      <AccountCard next="/log" compact />
      <CatchLog
        initialSpot={sp.spot}
        initialSpecies={sp.species}
        spots={SPOTS.map((s) => ({ id: s.id, name: s.name, species: s.species }))}
        species={SPECIES.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
