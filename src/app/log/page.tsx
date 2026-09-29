import type { Metadata } from "next";
import { CatchLog } from "@/components/CatchLog";
import { SPECIES } from "@/data/species";
import { SPOTS } from "@/data/spots";

export const metadata: Metadata = { title: "조황 기록" };

type Search = Promise<{ spot?: string; species?: string }>;

export default async function LogPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  return (
    <div className="stack">
      <h1>내 낚시 기록</h1>
      <p className="sub" style={{ margin: 0 }}>
        잡은 물고기(조황)를 적어 두세요. 그 시간의 예측 점수도 같이 저장돼서, 점수가 얼마나 잘 맞았는지 볼 수 있어요. 기록은 이 휴대폰에만 저장돼요.
      </p>
      <CatchLog
        initialSpot={sp.spot}
        initialSpecies={sp.species}
        spots={SPOTS.map((s) => ({ id: s.id, name: s.name, species: s.species }))}
        species={SPECIES.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
