import type { Metadata } from "next";
import Link from "next/link";
import { SEA_LABEL, SPOT_TYPE_LABEL, SPOTS } from "@/data/spots";
import { SPECIES_BY_ID } from "@/data/species";
import type { Sea, SpotType } from "@/lib/types";

export const metadata: Metadata = { title: "포인트" };

type Search = Promise<{ sea?: string; type?: string }>;

export default async function SpotsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const sea = sp.sea === "WEST" || sp.sea === "EAST" ? (sp.sea as Sea) : undefined;
  const type = sp.type && sp.type in SPOT_TYPE_LABEL ? (sp.type as SpotType) : undefined;
  const list = SPOTS.filter((s) => (!sea || s.sea === sea) && (!type || s.type === type));
  const href = (o: { sea?: string; type?: string }) => {
    const u = new URLSearchParams();
    const nsea = "sea" in o ? o.sea : sea;
    const ntype = "type" in o ? o.type : type;
    if (nsea) u.set("sea", nsea);
    if (ntype) u.set("type", ntype);
    const q = u.toString();
    return q ? `/spots?${q}` : "/spots";
  };
  return (
    <div className="stack">
      <h1>포인트</h1>
      <nav className="tabs" aria-label="해역">
        <Link className="tab" href={href({ sea: undefined })} aria-current={!sea ? "true" : undefined}>전체</Link>
        {(["WEST", "EAST"] as Sea[]).map((s) => (
          <Link key={s} className="tab" href={href({ sea: s })} aria-current={sea === s ? "true" : undefined}>{SEA_LABEL[s]}</Link>
        ))}
      </nav>
      <nav className="tabs" aria-label="포인트 유형">
        <Link className="tab" href={href({ type: undefined })} aria-current={!type ? "true" : undefined}>모든 유형</Link>
        {(Object.keys(SPOT_TYPE_LABEL) as SpotType[]).map((t) => (
          <Link key={t} className="tab" href={href({ type: t })} aria-current={type === t ? "true" : undefined}>{SPOT_TYPE_LABEL[t]}</Link>
        ))}
      </nav>
      <p className="small muted" style={{ margin: 0 }}>{list.length}곳 · 좌표와 시설 정보는 베타 검증 중입니다.</p>
      <ul className="list">
        {list.map((s) => (
          <li key={s.id}>
            <Link href={`/spot/${s.id}`} className="card card-link stack" style={{ gap: 6 }}>
              <div className="between">
                <strong>{s.name}</strong>
                <span className="chip">{SEA_LABEL[s.sea]} · {SPOT_TYPE_LABEL[s.type]}</span>
              </div>
              <div className="small muted">{s.area} · {s.species.map((id) => SPECIES_BY_ID[id]?.name).join(", ")}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
