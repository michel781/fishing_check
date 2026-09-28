import type { Metadata } from "next";
import Link from "next/link";
import { SPECIES } from "@/data/species";
import { SEA_LABEL } from "@/data/spots";
import { isClosedSeason, seasonFactor } from "@/lib/engine/score";

export const metadata: Metadata = { title: "어종" };
export const dynamic = "force-dynamic";

export default function FishPage() {
  const now = new Date();
  const sorted = [...SPECIES].sort((a, b) => seasonFactor(b, now) - seasonFactor(a, now));
  const month = Number(new Date(now.getTime() + 9 * 3600e3).toISOString().slice(5, 7));
  return (
    <div className="stack">
      <h1>어종</h1>
      <p className="sub" style={{ margin: 0 }}>{month}월 제철 순으로 정렬했습니다.</p>
      <ul className="list">
        {sorted.map((s) => {
          const season = seasonFactor(s, now);
          const closed = isClosedSeason(s, now);
          return (
            <li key={s.id}>
              <Link href={`/fish/${s.id}`} className="card card-link stack" style={{ gap: 6 }}>
                <div className="between">
                  <strong>{s.name}{s.aka && <span className="sub"> · {s.aka}</span>}</strong>
                  {closed ? (
                    <span className="badge g-DANGER">⛔ 금어기</span>
                  ) : (
                    <span className={`badge ${season >= 0.85 ? "g-GOOD" : season >= 0.5 ? "g-FAIR" : "g-BAD"}`}>
                      {season >= 0.85 ? "제철" : season >= 0.5 ? "시즌" : "비시즌"}
                    </span>
                  )}
                </div>
                <div className="small muted">{s.seas.map((x) => SEA_LABEL[x]).join("·")} · 적정 수온 {s.temp.min}~{s.temp.max}℃</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
