import Link from "next/link";
import { TIDE_GROUPS, TIDE_TERMS, TWELFTHS, type TideGroup } from "@/data/tideTerms";

/**
 * 물 단계 그림: 간조 → 만조 → 간조 한 바퀴(약 12시간 25분)를 그리고,
 * 앱이 쓰는 규칙 그대로(만조·간조 앞뒤 40분 = 정조, 그 사이를 셋으로 나눠 초·중·끝) 구간을 칠한다.
 * 아래 막대는 12분의 1 법칙(1·2·3·3·2·1)으로 본 1시간마다의 물 높이 변화 = 물살 세기의 어림.
 */
const HALF = 6.21; // 간조→만조 (시간)
const SLACK = 40 / 60;
const H0 = -0.9;
const H1 = 2 * HALF + 0.9;
const X0 = 16;
const XW = 328;
const x = (h: number) => X0 + ((h - H0) / (H1 - H0)) * XW;
const Y_HI = 44;
const Y_LO = 136;
const y = (h: number) => (Y_HI + Y_LO) / 2 + ((Y_LO - Y_HI) / 2) * Math.cos((Math.PI * h) / HALF);

type Seg = { from: number; to: number; kind: "up" | "down" | "slack"; mark: string; stage: string };
const third = HALF / 3;
const SEGS: Seg[] = [
  { from: H0, to: SLACK, kind: "slack", mark: "정조", stage: "간조" },
  { from: SLACK, to: third, kind: "up", mark: "초", stage: "초들물" },
  { from: third, to: 2 * third, kind: "up", mark: "중", stage: "중들물" },
  { from: 2 * third, to: HALF - SLACK, kind: "up", mark: "끝", stage: "끝들물" },
  { from: HALF - SLACK, to: HALF + SLACK, kind: "slack", mark: "정조", stage: "만조" },
  { from: HALF + SLACK, to: HALF + third, kind: "down", mark: "초", stage: "초썰물" },
  { from: HALF + third, to: HALF + 2 * third, kind: "down", mark: "중", stage: "중썰물" },
  { from: HALF + 2 * third, to: 2 * HALF - SLACK, kind: "down", mark: "끝", stage: "끝썰물" },
  { from: 2 * HALF - SLACK, to: H1, kind: "slack", mark: "정조", stage: "간조" },
];

export function TideStages({ current }: { current?: string }) {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const h = H0 + ((H1 - H0) * i) / 120;
    pts.push(`${i ? "L" : "M"}${x(h).toFixed(1)},${y(h).toFixed(1)}`);
  }
  const hour = HALF / 6;
  return (
    <figure className="tst" style={{ margin: 0 }}>
      <svg viewBox="0 0 360 252" role="img" aria-labelledby="tst-t tst-d">
        <title id="tst-t">물 단계 한 바퀴: 간조 → 들물 → 만조 → 썰물 → 간조</title>
        <desc id="tst-d">
          간조와 만조 앞뒤 40분은 물 흐름이 거의 멈추는 정조예요. 간조에서 만조까지 약 6시간 12분인 들물을 셋으로 나눠 초들물·중들물·끝들물, 만조에서 간조까지 썰물을 초썰물·중썰물·끝썰물이라 불러요. 1시간마다 변하는 물 높이는 1, 2, 3, 3, 2, 1 비율이라 중들물·중썰물에 물살이 가장 세요.
          {current ? ` 지금은 ${current}이에요.` : ""}
        </desc>
        {SEGS.map((s, i) => {
          const on = current === s.stage;
          return (
            <g key={i} className={`tst-seg ${s.kind}${on ? " on" : ""}`}>
              <rect x={x(s.from)} y={26} width={x(s.to) - x(s.from)} height={150} />
              <text x={(x(s.from) + x(s.to)) / 2} y={s.kind === "slack" ? 166 : 168} textAnchor="middle" className={s.kind === "slack" ? "tst-slack" : "tst-mark"}>
                {s.mark}
              </text>
            </g>
          );
        })}
        <path d={pts.join(" ")} className="tst-curve" />
        {/* 만조·간조 이름 */}
        <g className="tst-ex">
          <text x={x(0)} y={18} textAnchor="middle">간조</text>
          <text x={x(HALF)} y={18} textAnchor="middle">만조</text>
          <text x={x(2 * HALF)} y={18} textAnchor="middle">간조</text>
        </g>
        <circle cx={x(0)} cy={y(0)} r={4} className="tst-dot" />
        <circle cx={x(HALF)} cy={y(HALF)} r={4} className="tst-dot" />
        <circle cx={x(2 * HALF)} cy={y(2 * HALF)} r={4} className="tst-dot" />
        {/* 들물·썰물 구간 */}
        <g className="tst-span">
          <path d={`M${x(0)},182 v6 H${x(HALF)} v-6`} />
          <path d={`M${x(HALF)},182 v6 H${x(2 * HALF)} v-6`} />
          <text x={x(HALF / 2)} y={202} textAnchor="middle">들물(밀물) ↑ 약 6시간</text>
          <text x={x(HALF * 1.5)} y={202} textAnchor="middle">썰물(날물) ↓ 약 6시간</text>
        </g>
        {/* 12분의 1 법칙 막대 */}
        {[0, 1].map((half) =>
          TWELFTHS.map((v, i) => {
            const cx = x(half * HALF + (i + 0.5) * hour);
            return <rect key={`${half}-${i}`} x={cx - 7} y={246 - v * 10} width={14} height={v * 10} rx={2} className={`tst-bar ${half ? "down" : "up"}`} />;
          }),
        )}
      </svg>
      <figcaption className="small muted">
        <span className="tst-key up" aria-hidden /> 들물 <span className="tst-key down" aria-hidden /> 썰물 <span className="tst-key slack" aria-hidden /> 정조(물 멈춤) · 아래 막대: 1시간마다 변하는 물 높이(12분의 1 법칙, 약 8·17·25·25·17·8%) — 가운데(중들물·중썰물)가 가장 커서 물살이 가장 세요.
      </figcaption>
    </figure>
  );
}

/** 물때 용어 목록 (그룹별). compact면 단계·흐름만 한 줄씩 */
export function TideTermList({ groups, compact = false }: { groups?: TideGroup[]; compact?: boolean }) {
  const gs = TIDE_GROUPS.filter((g) => !groups || groups.includes(g.id));
  return (
    <div className="stack tst-terms" style={{ gap: 10 }}>
      {gs.map((g) => (
        <section key={g.id} aria-labelledby={`tg-${g.id}`} className="stack" style={{ gap: 6 }}>
          <h3 id={`tg-${g.id}`} className="st-sub" style={{ margin: 0 }}>
            {g.label} <span className="small muted" style={{ fontWeight: 400 }}>— {g.desc}</span>
          </h3>
          <dl className={compact ? "tst-dl compact" : "tst-dl"}>
            {TIDE_TERMS.filter((t) => t.group === g.id).map((t) => (
              <div key={t.id} id={compact ? undefined : `tt-${t.id}`}>
                <dt>
                  {t.name}
                  {t.aka && <span className="small muted"> · {t.aka}</span>}
                </dt>
                <dd>
                  {t.role}
                  {!compact && <span className="tst-why"> {t.why}</span>}
                  {!compact && t.tip && <span className="tst-tip"><b>요령</b> {t.tip}</span>}
                  {!compact && t.link && (
                    <>
                      {" "}
                      <Link href={t.link.href} className="link">{t.link.label} ›</Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

