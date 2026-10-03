import Link from "next/link";
import { kstHM } from "@/lib/format";
import { josa } from "@/lib/push/plan";
import { tideSummary, tideTable, type TideRow } from "@/lib/tideTable";
import type { SourceKind, TideExtreme, TidePoint } from "@/lib/types";

const SOURCE: Record<SourceKind, string> = {
  KHOA: "국립해양조사원 조석예보",
  OPEN_METEO: "해양모델(Open-Meteo) 해수면",
  ESTIMATE: "천문 추정 모델 (참고용)",
  KMA: "기상청",
  DEMO: "데모",
};

const STAGE_TIP: Record<string, string> = {
  간조: "물이 가장 많이 빠짐 · 물 흐름 멈춤",
  만조: "물이 가장 높음 · 물 흐름 멈춤",
  초들물: "물이 들기 시작 · 입질이 살아나는 때",
  중들물: "물이 가장 빠르게 들어옴",
  끝들물: "만조 직전 · 연안에 고기가 붙음",
  초썰물: "물이 빠지기 시작",
  중썰물: "물이 가장 빠르게 빠짐",
  끝썰물: "간조 직전 · 갯벌·갯바위 고립 주의",
};

type HourBite = { time: string; score: number; available: boolean };
const GOOD = 65;

function Row({ r, min, max, now, bite, cut }: { r: TideRow; min: number; max: number; now: boolean; bite?: HourBite; cut: number }) {
  const pct = max > min ? Math.max(4, Math.round(((r.cm - min) / (max - min)) * 100)) : 50;
  const rising = r.stage.includes("들물");
  return (
    <li className={`tide-row${now ? " now" : ""}${r.extreme ? " ex" : ""}`}>
      <span className="tide-time num">
        {kstHM(r.time).slice(0, 2)}시{now && <b className="tide-now">지금</b>}
      </span>
      <span className="tide-bar" aria-hidden>
        <i className={rising ? "up" : r.stage === "만조" || r.stage === "간조" ? "slack" : "down"} style={{ width: `${pct}%` }} />
      </span>
      <span className="tide-cm num">{r.cm}cm</span>
      <span className={`tide-delta num ${r.delta > 0 ? "up" : r.delta < 0 ? "down" : ""}`}>
        {r.delta > 0 ? "▲" : r.delta < 0 ? "▼" : "–"} {Math.abs(r.delta)}
      </span>
      <span className="tide-stage">
        <b>{r.stage}</b>
        {r.strong && <span className="mini-chip orange">물살 셈</span>}
        {bite && bite.available && bite.score >= cut && <span className="mini-chip green tide-good">입질 {bite.score}</span>}
        {r.extreme && (
          <span className="small">
            {r.extreme.type === "HIGH" ? "만조" : "간조"} {kstHM(r.extreme.time)} {Math.round(r.extreme.cm)}cm
          </span>
        )}
      </span>
    </li>
  );
}

/** 시간대별 물 높이: 매시 물 높이·1시간 변화·물 단계 (오늘이면 지금 시각부터) */
export function TideTable({
  series,
  extremes,
  dayStart,
  now,
  stationName,
  source,
  approx,
  bites,
  speciesName,
  tideHref,
}: {
  series: TidePoint[];
  extremes: TideExtreme[];
  dayStart: string;
  now: Date | null;
  stationName: string;
  source: SourceKind;
  approx?: boolean;
  /** 고른 어종의 시간별 점수 (있으면 좋은 시간에 '입질' 표시) */
  bites?: HourBite[];
  speciesName?: string;
  /** 7일 물때표로 가는 주소 */
  tideHref?: string;
}) {
  const start = Date.parse(dayStart);
  const rows = tideTable(series, extremes, start);
  if (!rows.length) return null;
  const { today, rangeCm } = tideSummary(extremes, start);
  const min = Math.min(...rows.map((r) => r.cm));
  const max = Math.max(...rows.map((r) => r.cm));
  const nowHour = now ? Math.floor(now.getTime() / 3600e3) * 3600e3 : null;
  const isNow = (r: TideRow) => nowHour != null && Date.parse(r.time) === nowHour;
  // 오늘이면 지금부터 12시간을 먼저, 나머지는 펼쳐 보기
  const from = nowHour != null ? Math.max(0, rows.findIndex((r) => Date.parse(r.time) >= nowHour)) : 0;
  const first = rows.slice(from, from + 12);
  const rest = [...rows.slice(0, from), ...rows.slice(from + 12)];
  const stages = [...new Set(first.map((r) => r.stage))];
  const biteAt = new Map((bites ?? []).map((b) => [Math.floor(Date.parse(b.time) / 3600e3), b]));
  const bOf = (r: TideRow) => biteAt.get(Math.floor(Date.parse(r.time) / 3600e3));
  // 앞으로 남은 시간 중 고른 어종 점수가 가장 높은 시간과 그때의 물 단계
  const pick = rows
    .filter((r) => nowHour == null || Date.parse(r.time) >= nowHour)
    .map((r) => ({ r, b: bOf(r) }))
    .filter((x) => x.b?.available)
    .sort((a, b) => b.b!.score - a.b!.score)[0];
  // 표에는 가장 좋은 시간대만 표시 (최고점에서 8점 안, 65점 이상)
  const cut = Math.max(GOOD, (pick?.b?.score ?? 0) - 8);

  return (
    <section aria-labelledby="tide-table-title" className="card stack" style={{ gap: 10 }} id="tide-table">
      <h2 id="tide-table-title" style={{ fontSize: "1rem", margin: 0 }}>시간대별 물 높이</h2>
      <div className="tide-sum">
        {today.map((e) => (
          <span key={e.time} className={`tide-ex ${e.type === "HIGH" ? "hi" : "lo"}`}>
            <small>{e.type === "HIGH" ? "만조" : "간조"}</small>
            <b className="num">{kstHM(e.time)}</b>
            <span className="num">{Math.round(e.cm)}cm</span>
          </span>
        ))}
        {rangeCm != null && (
          <span className="tide-ex">
            <small>조차</small>
            <b className="num">{(rangeCm / 100).toFixed(1)}m</b>
            <span>{rangeCm >= 500 ? "물 차이 큼" : rangeCm >= 150 ? "보통" : "작음"}</span>
          </span>
        )}
      </div>
      {pick && speciesName && (
        <p className="small tide-pick">
          🎣 {josa(speciesName, "은", "는")} <b>{kstHM(pick.r.time).slice(0, 2)}시 {pick.r.stage}</b> 무렵이 가장 좋아요 (<b className="num">{pick.b!.score}점</b>
          {pick.b!.score >= GOOD ? "" : " · 특별히 좋은 시간은 없음"}).
          {pick.b!.score >= GOOD && (
            <>
              {" "}표의 <span className="mini-chip green tide-good">입질</span> 표시는 남은 시간 중 가장 좋은 시간대({cut}점 이상)예요.
            </>
          )}
        </p>
      )}
      <ol className="tide-list" aria-label="매시 물 높이">
        <li className="tide-head" aria-hidden>
          <span>시각</span>
          <span>물 높이</span>
          <span />
          <span>1시간 변화</span>
          <span>물 단계</span>
        </li>
        {first.map((r) => (
          <Row key={r.time} r={r} min={min} max={max} now={isNow(r)} bite={bOf(r)} cut={cut} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="tide-more">
          <summary>{nowHour != null ? "지난 시간·늦은 시간도 보기" : "나머지 시간 보기"} ({rest.length}시간)</summary>
          <ol className="tide-list">
            {rest.map((r) => (
              <Row key={r.time} r={r} min={min} max={max} now={isNow(r)} bite={bOf(r)} cut={cut} />
            ))}
          </ol>
        </details>
      )}
      {rangeCm != null && rangeCm < 60 && (
        <p className="small" style={{ margin: 0 }}>
          🌊 이곳은 하루 물 높이 차이가 {rangeCm}cm로 아주 작아요(동해·먼 섬). 물때보다 <b>바람·너울·수온</b>이 입질에 더 중요해요.
        </p>
      )}
      <ul className="tide-tips small">
        {stages.map((s) => (
          <li key={s}>
            <b>{s}</b> — {STAGE_TIP[s]}
          </li>
        ))}
      </ul>
      <p className="small muted" style={{ margin: 0 }}>
        기준: {stationName} 조위관측소 · {SOURCE[source]}. 물 높이는 바다 기준면(약최저저조면)에서 잰 값이에요.
        {approx ? " 이 포인트는 가장 가까운 관측소 값이라 현장과 시각이 10~30분 다를 수 있어요." : ""}
      </p>
      {tideHref && (
        <Link href={tideHref} className="btn small">🌊 날짜별 물때표 · 한 달 사리·조금 보기</Link>
      )}
    </section>
  );
}
