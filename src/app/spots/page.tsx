import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { IcCatch } from "@/components/icons";
import { SpotFinder } from "@/components/SpotFinder";
import { SEA_LABEL, SPOT_TYPE_LABEL, SPOTS } from "@/data/spots";
import { SPECIES_BY_ID } from "@/data/species";
import { simQueryString } from "@/lib/sim/mode";

export const metadata: Metadata = { title: "낚시터" };

type Search = Promise<{ sea?: string; type?: string; sim?: string; simDate?: string; simHour?: string }>;

export default async function SpotsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const simQ = simQueryString(sp);
  const list = SPOTS.map((s) => ({
    id: s.id,
    name: s.name,
    area: s.area,
    sea: s.sea,
    seaLabel: SEA_LABEL[s.sea],
    type: s.type,
    typeLabel: SPOT_TYPE_LABEL[s.type],
    lat: s.lat,
    lon: s.lon,
    toilet: !!s.toilet,
    parking: !!s.parking,
    nightOk: !!s.nightOk,
    tetrapod: !!s.tetrapod,
    species: s.species.map((id) => SPECIES_BY_ID[id]?.name ?? id),
  }));
  return (
    <div className="stack" style={{ gap: 12 }}>
      <AppHead
        title="낚시터"
        right={<Link href={`/best${simQ ? `?${simQ}` : ""}`} className="round-btn" aria-label="가장 잘 잡히는 포인트"><IcCatch size={24} /></Link>}
      />
      <SpotFinder spots={list} initialSea={sp.sea} initialType={sp.type} simQ={simQ} />
    </div>
  );
}
