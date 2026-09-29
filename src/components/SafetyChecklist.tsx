import type { Spot } from "@/lib/types";

/** 포인트 유형·상황별 안전 수칙 */
export function SafetyChecklist({ spot, level }: { spot: Spot; level: "OK" | "CAUTION" | "DANGER" }) {
  const items: string[] = ["구명조끼 착용 (갯바위·방파제·선상 공통)", "혼자보다는 2인 이상, 출조 위치를 가족에게 공유"];
  if (spot.tetrapod) items.push("테트라포드 위 이동 금지 — 추락 시 자력 탈출이 어렵습니다");
  if (spot.type === "ROCK") items.push("갯바위 진입 전 들물 시각 확인, 퇴로 확보. 미끄럼 방지 신발");
  if (spot.type === "TIDAL_FLAT") items.push("간조 후 물이 들어오는 속도는 사람 걸음보다 빠릅니다. 만조 2시간 전 철수");
  if (spot.sea === "EAST" && spot.type !== "INNER_HARBOR") items.push("맑은 날에도 먼바다 너울이 갑자기 덮칠 수 있습니다. 파도가 닿은 자국이 있는 곳은 피하기");
  if (spot.type === "BOAT") items.push("출항 여부는 선장·해경 판단을 따르고, 멀미약은 출항 30분 전 복용");
  if (level !== "OK") items.unshift(level === "DANGER" ? "⚠ 지금 조건에서는 출조를 미루는 것이 안전합니다" : "주의 조건입니다. 바다에서 먼 안쪽 자리를 고르세요");
  return (
    <div className={level === "DANGER" ? "alert" : level === "CAUTION" ? "alert caution" : "card"}>
      <h2 style={{ marginBottom: 6 }}>안전 수칙</h2>
      <ul className="checklist small">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <p className="small muted" style={{ margin: "6px 0 0" }}>긴급 신고: 해양경찰 122 (휴대폰 긴급통화 가능)</p>
    </div>
  );
}
