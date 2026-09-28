import type { Metadata } from "next";
import { CatchLog } from "@/components/CatchLog";
import { SPECIES } from "@/data/species";
import { SPOTS } from "@/data/spots";

export const metadata: Metadata = { title: "조황 기록" };

export default function LogPage() {
  return (
    <div className="stack">
      <h1>조황 기록</h1>
      <p className="sub" style={{ margin: 0 }}>
        기록할 때 그 시각의 예측 점수를 함께 저장합니다. 쌓인 기록으로 &quot;골든타임 적중률&quot;을 확인하고 알고리즘을 보정합니다. 기록은 이 기기에만 저장됩니다.
      </p>
      <CatchLog
        spots={SPOTS.map((s) => ({ id: s.id, name: s.name, species: s.species }))}
        species={SPECIES.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
