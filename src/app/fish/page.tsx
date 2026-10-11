import Link from "next/link";
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
      <Link href="/gear" className="card card-link between" style={{ padding: 12 }}>
        <span><strong>🎒 처음이라면: 장비·용어부터</strong> <span className="small muted">낚싯대·릴·줄·채비가 하는 일, 드랙·목줄·찌멈춤 뜻</span></span>
        <span aria-hidden>›</span>
      </Link>
      <div className="grid-2" style={{ gap: 8 }}>
        <Link href="/methods" className="card card-link between" style={{ padding: 12 }}>
          <span><strong>🎣 낚시 방법</strong> <span className="small muted">원투·루어·찌·선상 고르기</span></span>
          <span aria-hidden>›</span>
        </Link>
        <Link href="/habits" className="card card-link between" style={{ padding: 12 }}>
          <span><strong>🧬 습성 한눈에</strong> <span className="small muted">산란기·제철·금어기 달력</span></span>
          <span aria-hidden>›</span>
        </Link>
      </div>
      <FishList items={items} month={month} />
    </div>
  );
}
