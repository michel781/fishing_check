import { SimBanner } from "@/components/Badges";
import { HomeClient } from "@/components/HomeClient";
import { SPOTS, SPOT_TYPE_LABEL } from "@/data/spots";
import { kstDateString } from "@/lib/engine/astro";
import { ctxFrom, isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";

type Search = Promise<{ sim?: string; simDate?: string; simHour?: string }>;

/** 다가오는 주말(토·일). 오늘이 토요일이면 오늘·내일, 일요일이면 오늘만 */
function weekendDates(today: string): string[] {
  const d = new Date(`${today}T12:00:00+09:00`);
  const dow = new Date(d.getTime() + 9 * 3600e3).getUTCDay();
  const add = (n: number) => kstDateString(new Date(d.getTime() + n * 86400e3));
  if (dow === 6) return [today, add(1)];
  if (dow === 0) return [today];
  return [add(6 - dow), add(7 - dow)];
}

export default async function Home({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const ctx = ctxFrom(sp);
  const today = kstDateString(ctx.now);
  const spots = SPOTS.map((s) => ({ id: s.id, name: s.name, area: s.area, sea: s.sea, type: SPOT_TYPE_LABEL[s.type], lat: s.lat, lon: s.lon }));
  const sim = isSimActive(sp);
  return (
    <>
      {sim && <SimBanner label={simLabel(sp)} />}
      <div className="stack">
        <section className="stack" style={{ gap: 4 }}>
          <h1>언제, 어디서, 무엇을 낚을까</h1>
          <p className="sub" style={{ margin: 0 }}>
            물때·만조/간조·바람·파도·수온·포인트·어종 습성을 합쳐 출조 골든타임을 알려드립니다.
          </p>
        </section>
        <HomeClient spots={spots} today={today} weekend={weekendDates(today)} simQ={simQueryString(sp)} />
      </div>
    </>
  );
}
