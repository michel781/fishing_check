import { SimBanner } from "@/components/Badges";
import { HomeClient } from "@/components/HomeClient";
import { isSimActive, simLabel, simQueryString } from "@/lib/sim/mode";

export const dynamic = "force-dynamic";

type Search = Promise<{ sim?: string; simDate?: string; simHour?: string }>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  return (
    <>
      {isSimActive(sp) && <SimBanner label={simLabel(sp)} />}
      <HomeClient simQ={simQueryString(sp)} />
    </>
  );
}
