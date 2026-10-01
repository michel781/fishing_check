import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { Settings } from "@/components/Settings";
import { simEnabled } from "@/lib/sim/mode";
import { SCENARIOS, type ScenarioId } from "@/lib/sim/scenarios";

export const metadata: Metadata = { title: "설정" };

const APP_VERSION = "v1.10.1";

/** 시나리오별로 가장 잘 드러나는 화면 */
const SIM_LINKS: [ScenarioId, string, string][] = [
  ["typhoon", "/", "태풍 주간 홈"],
  ["swell", "/spot/hajodae-rock?simHour=9", "동해 너울 · 갯바위"],
  ["front", "/spot/sinjin-outer?simHour=10", "강풍 · 서해 외항"],
  ["fog", "/spot/ocheon-boat?simHour=6", "해무 · 선상"],
  ["coldwater", "/spot/jumunjin?simDate=2026-08-05", "냉수대 · 동해 여름"],
  ["calm", "/spot/sinjin-outer?simHour=15", "잔잔 · 오후 3시 현장"],
];

export default async function SettingsPage() {
  const c = await cookies();
  return (
    <div className="stack" style={{ gap: 4 }}>
      <AppHead title="설정" />
      <Settings mul={c.get("mul")?.value ?? "auto"} theme={c.get("theme")?.value ?? "light"} version={APP_VERSION} />

      <section id="sources" className="card stack" style={{ gap: 6, marginTop: 18, scrollMarginTop: 80 }}>
        <h2 style={{ fontSize: "1rem" }}>데이터 출처</h2>
        <p className="small sub" style={{ margin: 0 }}>
          국립해양조사원(조석예보·물높이), 기상청(단기예보), Open-Meteo(파도·수온 모델). 연결이 안 되면 추정·데모 값으로 바꿔 보여주고 화면에 표시해요.
        </p>
        <p className="small sub" style={{ margin: 0 }}>
          점수는 참고용 예측이에요. 출항·출입 여부는 해양경찰·선장·현장 안내를 따르세요.
        </p>
      </section>

      {simEnabled() && (
        <div className="card stack" style={{ gap: 8, marginTop: 12 }}>
          <h2 style={{ fontSize: "1rem" }}>🧪 시뮬레이션 (개발·검수용)</h2>
          <p className="small muted" style={{ margin: 0 }}>가상 기상 상황으로 화면을 확인합니다. 운영에서는 FISHING_SIM_ENABLED=1 일 때만 보입니다.</p>
          <ul className="list">
            {SIM_LINKS.map(([sim, path, label]) => (
              <li key={sim}>
                <Link className="card card-link between" style={{ padding: 12 }} href={`${path}${path.includes("?") ? "&" : "?"}sim=${sim}`}>
                  <span><strong>{label}</strong> <span className="small muted">{SCENARIOS[sim]}</span></span>
                  <span aria-hidden>›</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
