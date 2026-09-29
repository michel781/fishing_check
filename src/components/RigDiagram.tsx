import type { RigKind } from "@/data/guides";

/** 채비 모양을 한눈에 보여주는 단순 그림 (물 위 → 바닥) */
export function RigDiagram({ kind, title }: { kind: RigKind; title: string }) {
  const W = 220;
  const H = 260;
  const cx = 110;
  const water = 34;
  const bed = 236;
  const line = "var(--text-secondary)";
  const hook = (x: number, y: number, key?: string) => (
    <path key={key} d={`M${x},${y} v10 a5,5 0 0 1 -10,0`} fill="none" stroke="var(--text-primary)" strokeWidth={2} strokeLinecap="round" />
  );
  const sinker = (y: number) => <path d={`M${cx - 7},${y} L${cx + 7},${y} L${cx + 4},${y + 16} L${cx - 4},${y + 16} Z`} fill="var(--text-muted)" />;
  const branch = (y: number, key: string) => (
    <g key={key}>
      <line x1={cx} y1={y} x2={cx + 28} y2={y + 6} stroke={line} strokeWidth={1.5} />
      {hook(cx + 28, y + 6)}
    </g>
  );

  let body: React.ReactNode = null;
  let bottomY = bed - 20;
  switch (kind) {
    case "bottom":
      body = (
        <>
          {branch(120, "b1")}
          {branch(168, "b2")}
          {sinker(bed - 20)}
          <text x={cx - 12} y={bed - 8} textAnchor="end">봉돌</text>
          <text x={cx + 44} y={140}>바늘</text>
        </>
      );
      break;
    case "downshot":
      body = (
        <>
          <line x1={cx} y1={150} x2={cx + 22} y2={150} stroke={line} strokeWidth={1.5} />
          <path d={`M${cx + 22},150 q14,-4 26,4`} stroke="var(--good)" strokeWidth={5} fill="none" strokeLinecap="round" />
          {sinker(bed - 20)}
          <text x={cx + 52} y={146}>웜(바늘)</text>
          <text x={cx - 12} y={bed - 8} textAnchor="end">봉돌</text>
          <text x={cx - 12} y={196} textAnchor="end">30~50cm</text>
        </>
      );
      break;
    case "float":
      bottomY = 196;
      body = (
        <>
          <rect x={cx - 3} y={water - 22} width={6} height={3} fill="var(--warning)" />
          <text x={cx - 10} y={water - 16} textAnchor="end">찌멈춤</text>
          <ellipse cx={cx} cy={water} rx={9} ry={12} fill="var(--critical)" />
          <ellipse cx={cx} cy={water + 6} rx={9} ry={6} fill="#fff" />
          <text x={cx + 14} y={water + 4}>찌</text>
          <rect x={cx - 4} y={96} width={8} height={14} rx={2} fill="var(--text-muted)" />
          <text x={cx + 12} y={108}>수중찌</text>
          <circle cx={cx} cy={170} r={3} fill="var(--text-muted)" />
          {hook(cx, bottomY)}
          <text x={cx + 12} y={bottomY + 6}>바늘 + 미끼</text>
          <text x={cx - 12} y={150} textAnchor="end">목줄</text>
        </>
      );
      break;
    case "egi":
      body = (
        <>
          <line x1={cx} y1={170} x2={cx + 24} y2={176} stroke={line} strokeWidth={1.5} />
          <path d={`M${cx + 24},170 q22,-6 34,6 q-14,10 -34,6 z`} fill="var(--warning)" />
          <path d={`M${cx + 58},176 l8,-4 m-8,4 l8,4`} stroke="var(--text-primary)" strokeWidth={1.5} />
          <text x={cx + 34} y={160}>에기(애기)</text>
          {sinker(bed - 20)}
          <text x={cx - 12} y={bed - 8} textAnchor="end">봉돌(배에서)</text>
        </>
      );
      break;
    case "jighead":
      bottomY = 150;
      body = (
        <>
          <circle cx={cx} cy={bottomY} r={6} fill="var(--text-muted)" />
          <path d={`M${cx + 5},${bottomY} q16,-2 28,6`} stroke="var(--good)" strokeWidth={6} fill="none" strokeLinecap="round" />
          <text x={cx + 12} y={bottomY - 14}>지그헤드 + 웜</text>
          <path d={`M${cx - 30},${bottomY + 40} q20,-14 30,-30`} stroke="var(--text-muted)" strokeDasharray="3 4" fill="none" />
          <text x={cx - 34} y={bottomY + 58} textAnchor="middle">천천히 감기</text>
        </>
      );
      break;
    case "sabiki":
      body = (
        <>
          {[90, 120, 150, 180].map((y, i) => (
            <g key={y}>
              <line x1={cx} y1={y} x2={cx + (i % 2 ? -18 : 18)} y2={y + 4} stroke={line} strokeWidth={1.2} />
              <circle cx={cx + (i % 2 ? -18 : 18)} cy={y + 4} r={3} fill="var(--warning)" />
              {hook(cx + (i % 2 ? -18 : 18), y + 6)}
            </g>
          ))}
          <text x={cx + 26} y={124}>반짝이 바늘</text>
          <rect x={cx - 8} y={bed - 26} width={16} height={20} rx={3} fill="var(--text-muted)" />
          <text x={cx - 14} y={bed - 12} textAnchor="end">밑밥통·봉돌</text>
        </>
      );
      break;
    case "tairaba":
      body = (
        <>
          <circle cx={cx} cy={bed - 50} r={10} fill="var(--critical)" />
          {[-6, -2, 2, 6].map((d) => (
            <path key={d} d={`M${cx + d},${bed - 42} q${d},12 ${d * 2},22`} stroke="var(--warning)" strokeWidth={2} fill="none" />
          ))}
          {hook(cx + 8, bed - 30)}
          <text x={cx - 16} y={bed - 54} textAnchor="end">타이라바</text>
          <text x={cx - 16} y={bed - 38} textAnchor="end">(머리+치마)</text>
          <text x={cx - 16} y={120} textAnchor="end">쇼크리더</text>
        </>
      );
      bottomY = bed - 60;
      break;
  }

  return (
    <svg className="viz rig" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} 채비 그림`} style={{ maxWidth: 320 }}>
      <title>{`${title} 채비 그림`}</title>
      <rect x={0} y={water} width={W} height={bed - water} fill="var(--tide)" opacity={0.08} />
      <path d={`M0,${water} q27,-6 55,0 t55,0 t55,0 t55,0`} stroke="var(--tide)" strokeWidth={2} fill="none" />
      <text x={6} y={water - 8}>물 위</text>
      <path d={`M0,${bed} q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0`} fill="var(--surface-2)" stroke="var(--border)" />
      <text x={6} y={H - 6}>바닥</text>
      <line x1={cx} y1={0} x2={cx} y2={kind === "float" ? water - 10 : water} stroke={line} strokeWidth={1.5} />
      {kind !== "float" && <line x1={cx} y1={water} x2={cx} y2={bottomY} stroke={line} strokeWidth={1.5} />}
      {kind === "float" && <line x1={cx} y1={water + 12} x2={cx} y2={bottomY} stroke={line} strokeWidth={1.5} />}
      <text x={cx + 6} y={14}>낚싯줄</text>
      {body}
    </svg>
  );
}
