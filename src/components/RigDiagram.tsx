import type { RigKind } from "@/data/guides";

/**
 * 채비 모양 + 실제 치수(길이·높이) 그림 (물 위 → 바닥).
 * dims 가 있으면 해당 구간에 치수선을 그린다. 그림은 이해를 돕기 위해 비율을 줄였다.
 */
export function RigDiagram({
  kind,
  title,
  dims = {},
  variant,
}: {
  kind: RigKind;
  title: string;
  dims?: Record<string, string>;
  variant?: "boat" | "cast" | "shallow";
}) {
  const W = 320;
  const H = 300;
  const cx = 190;
  const water = 40;
  const bed = 272;
  const line = "var(--text-secondary)";
  const ink = "var(--text-primary)";

  const hook = (x: number, y: number) => (
    <path d={`M${x},${y} v10 a5,5 0 0 1 -10,0`} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
  );
  const sinker = (y: number, label = "봉돌") => (
    <g>
      <path d={`M${cx - 8},${y} L${cx + 8},${y} L${cx + 5},${y + 18} L${cx - 5},${y + 18} Z`} fill="var(--text-muted)" />
      <text x={cx + 14} y={y + 14}>{label}</text>
    </g>
  );
  const branch = (y: number, len = 40) => (
    <g>
      <line x1={cx} y1={y} x2={cx + len} y2={y + 6} stroke={line} strokeWidth={1.5} />
      <circle cx={cx} cy={y} r={2.5} fill={ink} />
      {hook(cx + len, y + 6)}
    </g>
  );
  /** 세로 치수선: 양 끝 가로 눈금 + 화살표 + 왼쪽 글자(이름/값) */
  const vdim = (key: string, x: number, y1: number, y2: number, name: string) => {
    const v = dims[key];
    if (!v) return null;
    const mid = (y1 + y2) / 2;
    return (
      <g key={key} className="dim">
        <line x1={x - 5} x2={x + 5} y1={y1} y2={y1} />
        <line x1={x - 5} x2={x + 5} y1={y2} y2={y2} />
        <line x1={x} x2={x} y1={y1 + 2} y2={y2 - 2} markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
        <text x={x - 9} y={mid - 2} textAnchor="end" className="dim-name">{name}</text>
        <text x={x - 9} y={mid + 13} textAnchor="end" className="dim-val">{v}</text>
      </g>
    );
  };
  /** 가로 치수(가지줄 길이 등): 위쪽에 글자 */
  const hdim = (key: string, x1: number, x2: number, y: number, name: string) => {
    const v = dims[key];
    if (!v) return null;
    return (
      <g key={key} className="dim">
        <line x1={x1} x2={x2} y1={y} y2={y} markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
        <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className="dim-val">{`${name} ${v}`}</text>
      </g>
    );
  };

  let body: React.ReactNode = null;
  let lineTo = bed - 20; // 원줄이 끝나는 곳
  switch (kind) {
    case "bottom": {
      const lifted = !!dims.lift && !/닿게/.test(dims.lift);
      const sy = lifted ? bed - 56 : bed - 20; // 봉돌 윗면
      const b1 = 100;
      const b2 = 160;
      lineTo = sy;
      body = (
        <>
          {branch(b1)}
          {branch(b2)}
          {sinker(sy)}
          <text x={cx + 50} y={b1 + 26}>바늘+미끼</text>
          {hdim("branch", cx, cx + 40, b1 - 8, "가지줄")}
          {vdim("gap", cx - 16, b1, b2, "가지 간격")}
          {vdim("tail", cx - 16, b2, sy, "봉돌까지")}
          {lifted ? vdim("lift", cx - 16, sy + 18, bed - 4, "바닥에서") : dims.lift && <text x={cx - 12} y={bed - 6} textAnchor="end" className="dim-val">{dims.lift}</text>}
        </>
      );
      break;
    }
    case "downshot": {
      const sy = bed - 20;
      const hy = 170;
      lineTo = sy;
      body = (
        <>
          <line x1={cx} y1={hy} x2={cx + 34} y2={hy} stroke={line} strokeWidth={1.5} />
          <circle cx={cx} cy={hy} r={2.5} fill={ink} />
          <path d={`M${cx + 34},${hy} q16,-5 30,4`} stroke="var(--good)" strokeWidth={6} fill="none" strokeLinecap="round" />
          <text x={cx + 38} y={hy - 12}>웜(바늘)</text>
          {sinker(sy)}
          {hdim("branch", cx, cx + 34, hy + 16, "가지")}
          {vdim("tail", cx - 16, hy, sy, "봉돌~바늘")}
          {dims.lift && <text x={cx - 12} y={bed - 6} textAnchor="end" className="dim-val">{dims.lift}</text>}
        </>
      );
      break;
    }
    case "float": {
      const shallow = variant === "shallow";
      const swivel = shallow ? 58 : 118;
      const shot = shallow ? 0 : 196;
      const hy = shallow ? 120 : bed - 34;
      lineTo = hy;
      body = (
        <>
          <rect x={cx - 3} y={water - 30} width={6} height={4} fill="var(--warning)" />
          <text x={cx + 10} y={water - 24}>찌멈춤 매듭</text>
          <ellipse cx={cx} cy={water} rx={9} ry={12} fill="var(--critical)" />
          <ellipse cx={cx} cy={water + 6} rx={9} ry={6} fill="#fff" stroke="var(--border)" />
          <text x={cx + 14} y={water + 8}>찌</text>
          {!shallow && (
            <>
              <rect x={cx - 4} y={78} width={8} height={16} rx={2} fill="var(--text-muted)" />
              <text x={cx + 12} y={90}>수중찌</text>
            </>
          )}
          <circle cx={cx} cy={swivel} r={3} fill="none" stroke={ink} strokeWidth={1.5} />
          <text x={cx + 12} y={swivel + 4}>도래</text>
          {shot > 0 && <circle cx={cx} cy={shot} r={3.5} fill="var(--text-muted)" />}
          {shot > 0 && <text x={cx + 12} y={shot + 4}>좁쌀봉돌</text>}
          {hook(cx, hy)}
          <text x={cx + 12} y={hy + 10}>바늘+미끼</text>
          {vdim("stop", cx - 70, water, hy + 10, "찌밑 수심")}
          {vdim("leader", cx - 16, swivel, hy + 10, "목줄")}
          {shot > 0 && dims.shot && (
            <g className="dim">
              <line x1={cx + 70} x2={cx + 70} y1={shot} y2={hy + 10} markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
              <text x={cx + 76} y={(shot + hy) / 2 + 8} className="dim-val">{dims.shot}</text>
            </g>
          )}
          {dims.lift && !shallow && vdim("lift", cx - 16, hy + 14, bed - 4, "바닥에서")}
        </>
      );
      break;
    }
    case "egi": {
      if (variant === "cast") {
        const knot = 110;
        const ey = 200;
        lineTo = ey;
        body = (
          <>
            <circle cx={cx} cy={knot} r={3} fill={ink} />
            <text x={cx + 10} y={knot + 4}>매듭(원줄↔쇼크리더)</text>
            <path d={`M${cx},${ey} q22,-8 38,4 q-14,12 -38,6 z`} fill="var(--warning)" />
            <path d={`M${cx + 38},${ey + 4} l9,-5 m-9,5 l9,5`} stroke={ink} strokeWidth={1.5} />
            <text x={cx + 14} y={ey - 12}>에기</text>
            {vdim("leader", cx - 16, knot, ey, "쇼크리더")}
            {dims.fall && (
              <g className="dim">
                <line x1={cx + 60} x2={cx + 60} y1={ey + 10} y2={bed - 14} markerEnd="url(#dim-arrow)" strokeDasharray="4 3" />
                <text x={cx + 66} y={ey + 44} className="dim-val">가라앉기</text>
                <text x={cx + 66} y={ey + 60} className="dim-val">{dims.fall}</text>
              </g>
            )}
          </>
        );
      } else {
        const sy = bed - 20;
        const e1 = dims.gap ? 176 : 190;
        const e0 = 146;
        lineTo = sy;
        const egi = (y: number) => (
          <g>
            <line x1={cx} y1={y} x2={cx + 26} y2={y + 4} stroke={line} strokeWidth={1.5} />
            <circle cx={cx} cy={y} r={2.5} fill={ink} />
            <path d={`M${cx + 26},${y - 2} q22,-6 34,6 q-14,10 -34,6 z`} fill="var(--warning)" />
          </g>
        );
        body = (
          <>
            {dims.gap && egi(e0)}
            {egi(e1)}
            <text x={cx + 30} y={e1 - 12}>에기</text>
            {sinker(sy)}
            {hdim("branch", cx, cx + 26, e1 + 20, "가지")}
            {dims.gap && vdim("gap", cx - 16, e0, e1, "에기 간격")}
            {vdim("tail", cx - 16, e1, sy, "봉돌까지")}
            {dims.lift && <text x={cx - 12} y={bed - 6} textAnchor="end" className="dim-val">{dims.lift}</text>}
          </>
        );
      }
      break;
    }
    case "jighead": {
      const knot = 84;
      const jy = 150;
      lineTo = jy;
      body = (
        <>
          <circle cx={cx} cy={knot} r={3} fill={ink} />
          <text x={cx + 10} y={knot + 4}>매듭</text>
          <circle cx={cx} cy={jy} r={6} fill="var(--text-muted)" />
          <path d={`M${cx + 5},${jy} q16,-2 28,6`} stroke="var(--good)" strokeWidth={6} fill="none" strokeLinecap="round" />
          <text x={cx + 12} y={jy - 14}>지그헤드+웜</text>
          <path d={`M${cx + 70},${jy + 30} q-20,-6 -36,-20`} stroke="var(--text-muted)" strokeDasharray="3 4" fill="none" markerEnd="url(#dim-arrow)" className="dim" />
          <text x={cx + 44} y={jy + 48}>천천히 감기</text>
          {vdim("leader", cx - 16, knot, jy, "쇼크리더")}
          {vdim("swim", cx - 80, water, jy, "수면 아래")}
        </>
      );
      break;
    }
    case "lure": {
      const knot = 84;
      const ly = 150;
      lineTo = ly;
      body = (
        <>
          <circle cx={cx} cy={knot} r={3} fill={ink} />
          <text x={cx + 10} y={knot + 4}>매듭</text>
          <path d={`M${cx},${ly} l6,-4 h26 q8,4 0,8 h-26 z`} fill="#adb5bd" stroke="var(--text-secondary)" />
          <circle cx={cx + 26} cy={ly} r={1.8} fill={ink} />
          {hook(cx + 36, ly + 4)}
          <text x={cx + 12} y={ly - 14}>루어(미노우·메탈지그)</text>
          <path d={`M${cx + 80},${ly + 30} q-20,-6 -36,-20`} stroke="var(--text-muted)" strokeDasharray="3 4" fill="none" markerEnd="url(#dim-arrow)" className="dim" />
          <text x={cx + 44} y={ly + 48}>감기</text>
          {vdim("leader", cx - 16, knot, ly, "쇼크리더")}
          {vdim("swim", cx - 80, water, ly, "수면 아래")}
        </>
      );
      break;
    }
    case "sabiki": {
      const ys = [80, 110, 140, 170, 200];
      const by = 226;
      lineTo = by;
      body = (
        <>
          {ys.map((y, i) => (
            <g key={y}>
              <line x1={cx} y1={y} x2={cx + (i % 2 ? -20 : 20)} y2={y + 4} stroke={line} strokeWidth={1.2} />
              <circle cx={cx + (i % 2 ? -20 : 20)} cy={y + 4} r={3} fill="var(--warning)" />
              {hook(cx + (i % 2 ? -20 : 20), y + 6)}
            </g>
          ))}
          <text x={cx + 30} y={124}>반짝이 바늘</text>
          <rect x={cx - 8} y={by} width={16} height={22} rx={3} fill="var(--text-muted)" />
          <text x={cx + 14} y={by + 16}>밑밥통·봉돌</text>
          {vdim("gap", cx - 30, ys[0], ys[1], "바늘 간격")}
          {vdim("total", cx - 110, ys[0] - 6, by + 22, "채비 전체")}
          {dims.swim && <text x={8} y={water + 20} className="dim-val">{`수면 아래 ${dims.swim}`}</text>}
        </>
      );
      break;
    }
    case "tairaba": {
      const knot = 96;
      const ty = 176;
      lineTo = ty - 10;
      body = (
        <>
          <circle cx={cx} cy={knot} r={3} fill={ink} />
          <text x={cx + 10} y={knot + 4}>매듭(합사↔쇼크리더)</text>
          <circle cx={cx} cy={ty} r={10} fill="var(--critical)" />
          {[-6, -2, 2, 6].map((d) => (
            <path key={d} d={`M${cx + d},${ty + 8} q${d},12 ${d * 2},22`} stroke="var(--warning)" strokeWidth={2} fill="none" />
          ))}
          {hook(cx + 10, ty + 18)}
          <text x={cx + 18} y={ty - 6}>타이라바</text>
          {vdim("leader", cx - 16, knot, ty - 10, "쇼크리더")}
          {dims.retrieve && (
            <g className="dim">
              <line x1={cx + 80} x2={cx + 80} y1={bed - 8} y2={ty - 20} markerEnd="url(#dim-arrow)" strokeDasharray="4 3" />
              <text x={cx + 86} y={ty + 30} className="dim-val">바닥에서</text>
              <text x={cx + 86} y={ty + 46} className="dim-val">{dims.retrieve}</text>
              <text x={cx + 86} y={ty + 62} className="dim-val">감아올림</text>
            </g>
          )}
        </>
      );
      break;
    }
  }

  const label = `${title} 채비 그림${Object.keys(dims).length ? ` (치수: ${Object.values(dims).join(", ")})` : ""}`;
  return (
    <svg className="viz rig" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ maxWidth: 380 }}>
      <title>{label}</title>
      <defs>
        <marker id="dim-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent-strong)" />
        </marker>
      </defs>
      <rect x={0} y={water} width={W} height={bed - water} fill="var(--tide)" opacity={0.08} />
      <path d={`M0,${water} q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0`} stroke="var(--tide)" strokeWidth={2} fill="none" />
      <text x={6} y={water - 8}>물 위</text>
      <path d={`M0,${bed} q20,-8 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 V${H} H0 Z`} fill="var(--surface-2)" stroke="var(--border)" />
      <text x={6} y={H - 8}>바닥</text>
      {kind === "float" ? (
        <>
          <line x1={cx} y1={0} x2={cx} y2={water - 12} stroke={line} strokeWidth={1.5} />
          <line x1={cx} y1={water + 12} x2={cx} y2={lineTo} stroke={line} strokeWidth={1.5} />
        </>
      ) : (
        <line x1={cx} y1={0} x2={cx} y2={lineTo} stroke={line} strokeWidth={1.5} />
      )}
      {/* 찌 채비는 오른쪽에 찌멈춤 매듭 글자가 있어서 왼쪽에 둔다 */}
      <text x={kind === "float" ? cx - 8 : cx + 6} y={14} textAnchor={kind === "float" ? "end" : undefined}>낚싯줄</text>
      {body}
    </svg>
  );
}
