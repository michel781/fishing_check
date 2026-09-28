import { HomeClient } from "@/components/HomeClient";
import { SPOTS, SPOT_TYPE_LABEL } from "@/data/spots";

export default function Home() {
  const spots = SPOTS.map((s) => ({ id: s.id, name: s.name, area: s.area, sea: s.sea, type: SPOT_TYPE_LABEL[s.type], lat: s.lat, lon: s.lon }));
  return (
    <div className="stack">
      <section className="stack" style={{ gap: 4 }}>
        <h1>언제, 어디서, 무엇을 낚을까</h1>
        <p className="sub" style={{ margin: 0 }}>
          물때·만조/간조·바람·파도·수온·포인트·어종 습성을 합쳐 출조 골든타임을 알려드립니다.
        </p>
      </section>
      <HomeClient spots={spots} />
    </div>
  );
}
