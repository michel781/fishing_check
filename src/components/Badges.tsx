import type { SourceKind } from "@/lib/types";

const LIVE: SourceKind[] = ["KHOA", "KMA", "OPEN_METEO"];

/** 데이터 신뢰도 배지: 공식·모델·추정·데모·시뮬레이션 */
export function SourceBadge({ sources, sim }: { sources: { tide: SourceKind; weather: SourceKind; marine: SourceKind }; sim?: boolean }) {
  let color = "var(--good)";
  let label = "공식 예보";
  if (sim) {
    color = "#8b5cf6";
    label = "시뮬레이션";
  } else if (sources.weather === "DEMO" || sources.marine === "DEMO") {
    color = "var(--critical)";
    label = "데모 데이터 · 판단에 쓰지 마세요";
  } else if (sources.tide === "ESTIMATE") {
    color = "var(--warning)";
    label = "조석 추정값";
  } else if (!(sources.tide === "KHOA" && sources.weather === "KMA")) {
    color = "var(--accent)";
    label = LIVE.includes(sources.weather) ? "예보 모델" : "추정";
  }
  return (
    <span className="src-badge" role="note" aria-label={`데이터 상태: ${label}. 화면 맨 아래에 출처가 있습니다.`}>
      <span className="dot" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

export function SimBanner({ label }: { label: string }) {
  return (
    <div className="sim-banner" role="status">
      🧪 시뮬레이션 모드 — {label}. 실제 예보가 아닙니다.
    </div>
  );
}
