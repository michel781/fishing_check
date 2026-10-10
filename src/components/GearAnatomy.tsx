import { termById } from "@/data/gearTerms";

/**
 * 장비 연결 그림 (설명용, 비율은 실제와 다름)
 *  A. 낚싯대와 스피닝 릴 각 부분
 *  B. 찌낚시(반유동) 채비 — 원줄부터 바늘까지 연결 순서와 '찌밑 수심'
 * 번호는 그림 아래 목록과 같고, 목록은 용어 사전 항목으로 이어진다.
 */

function Tag({ n, x, y, px, py }: { n: number; x: number; y: number; px: number; py: number }) {
  return (
    <g className="hs-tag">
      <line x1={x} y1={y} x2={px} y2={py} />
      <circle cx={px} cy={py} r={2.2} className="hs-dot" />
      <rect x={x - 12} y={y - 12} width={24} height={24} rx={5} />
      <text x={x} y={y + 5.5} textAnchor="middle">{n}</text>
    </g>
  );
}

function Legend({ items }: { items: [number, string, string?][] }) {
  return (
    <ol className="hs-legend small">
      {items.map(([n, id, label]) => (
        <li key={n}>
          <span className="hs-legend-n" aria-hidden>{n}</span>
          <a href={`#t-${id}`} className="link">{label ?? termById(id)?.name ?? id}</a>
        </li>
      ))}
    </ol>
  );
}

export const ROD_PARTS: [number, string, string?][] = [
  [1, "grip", "손잡이(그립)"],
  [2, "reelseat"],
  [3, "guide"],
  [4, "tip", "초릿대(대 끝)"],
  [5, "spool"],
  [6, "bail"],
  [7, "drag"],
  [8, "handle"],
  [9, "mainline"],
];

export const RIG_PARTS: [number, string, string?][] = [
  [10, "float-stop"],
  [11, "bead"],
  [12, "float", "구멍찌"],
  [13, "sub-float"],
  [14, "swivel"],
  [15, "leader"],
  [16, "sinker", "봉돌(작은 좁쌀봉돌)"],
  [17, "hook"],
  [18, "bait-live", "미끼"],
];

export function RodAnatomy() {
  // 대: 왼쪽 아래(손잡이) → 오른쪽 위(초릿대)
  const a = { x: 14, y: 150 };
  const b = { x: 352, y: 34 };
  const at = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const guides = [0.36, 0.5, 0.63, 0.75, 0.85, 0.93];
  return (
    <figure className="hs gear-fig" style={{ margin: 0 }}>
      <svg viewBox="0 0 360 200" role="img" aria-labelledby="ga-t1 ga-d1">
        <title id="ga-t1">낚싯대와 스피닝 릴 각 부분</title>
        <desc id="ga-d1">왼쪽 아래 손잡이부터 릴시트, 줄 고리(가이드), 오른쪽 위 초릿대까지 이어진 낚싯대와, 손잡이 앞에 매달린 스피닝 릴의 스풀·베일·드랙·핸들, 그리고 가이드를 따라 대 끝으로 나가는 원줄.</desc>
        {/* 원줄: 스풀 → 가이드 → 대 끝 → 오른쪽 아래로 */}
        <path d={`M150,148 L${at(0.36).x},${at(0.36).y + 9} ${guides.slice(1).map((t) => `L${at(t).x},${at(t).y + 6}`).join(" ")} L${b.x},${b.y} L358,196`} className="ga-line" />
        {/* 대: 손잡이(두꺼움) → 몸통 → 초릿대(가늘게, 밝은 색) */}
        <line x1={a.x} y1={a.y} x2={at(0.24).x} y2={at(0.24).y} className="ga-grip" />
        <line x1={at(0.24).x} y1={at(0.24).y} x2={at(0.8).x} y2={at(0.8).y} className="ga-blank" />
        <line x1={at(0.8).x} y1={at(0.8).y} x2={b.x} y2={b.y} className="ga-tip" />
        {/* 릴시트 */}
        <rect x={at(0.25).x - 12} y={at(0.25).y - 6} width="26" height="12" rx="3" transform={`rotate(-19 ${at(0.25).x} ${at(0.25).y})`} className="ga-seat" />
        {/* 가이드 */}
        {guides.map((t, i) => (
          <g key={t}>
            <line x1={at(t).x} y1={at(t).y} x2={at(t).x + 1} y2={at(t).y + (9 - i)} className="ga-gfoot" />
            <circle cx={at(t).x + 1} cy={at(t).y + (9 - i)} r={4.5 - i * 0.5} className="ga-guide" />
          </g>
        ))}
        {/* 스피닝 릴: 다리 + 몸통 + 스풀(대 끝 쪽) + 베일 + 드랙 + 핸들 */}
        <line x1={at(0.25).x + 2} y1={at(0.25).y + 4} x2={at(0.25).x + 2} y2={at(0.25).y + 26} className="ga-leg" />
        <rect x={at(0.25).x - 18} y={at(0.25).y + 24} width="34" height="30" rx="10" className="ga-body" />
        <rect x={at(0.25).x + 16} y={at(0.25).y + 28} width="22" height="22" rx="3" className="ga-spool" />
        <path d={`M${at(0.25).x + 14},${at(0.25).y + 26} Q${at(0.25).x + 30},${at(0.25).y + 12} ${at(0.25).x + 44},${at(0.25).y + 30}`} className="ga-bail" />
        <rect x={at(0.25).x + 38} y={at(0.25).y + 34} width="7" height="10" rx="2" className="ga-drag" />
        <line x1={at(0.25).x - 4} y1={at(0.25).y + 40} x2={at(0.25).x - 26} y2={at(0.25).y + 62} className="ga-crank" />
        <circle cx={at(0.25).x - 28} cy={at(0.25).y + 64} r="5" className="ga-knob" />

        <Tag n={1} x={22} y={112} px={at(0.1).x} py={at(0.1).y} />
        <Tag n={2} x={60} y={76} px={at(0.25).x - 2} py={at(0.25).y - 4} />
        <Tag n={3} x={170} y={56} px={at(0.5).x} py={at(0.5).y + 7} />
        <Tag n={4} x={300} y={20} px={at(0.9).x} py={at(0.9).y} />
        <Tag n={5} x={142} y={186} px={at(0.25).x + 27} py={at(0.25).y + 48} />
        <Tag n={6} x={150} y={110} px={at(0.25).x + 34} py={at(0.25).y + 19} />
        <Tag n={7} x={182} y={150} px={at(0.25).x + 45} py={at(0.25).y + 39} />
        <Tag n={8} x={24} y={186} px={at(0.25).x - 28} py={at(0.25).y + 64} />
        <Tag n={9} x={264} y={108} px={at(0.7).x} py={at(0.7).y + 5} />
      </svg>
      <Legend items={ROD_PARTS} />
    </figure>
  );
}

export function RigAnatomy() {
  const X = 120; // 채비 줄의 x
  const SEA = 92;
  return (
    <figure className="hs gear-fig" style={{ margin: 0 }}>
      <svg viewBox="0 0 360 320" role="img" aria-labelledby="ga-t2 ga-d2">
        <title id="ga-t2">찌낚시(반유동) 채비 연결 순서</title>
        <desc id="ga-d2">위에서부터 원줄, 찌멈춤 매듭, 구슬, 수면에 뜬 구멍찌, 물속의 수중찌, 도래, 목줄, 작은 봉돌, 바늘과 미끼 순서. 찌멈춤 매듭 위치가 찌부터 바늘까지의 깊이(찌밑 수심)를 정해요.</desc>
        <rect x="0" y={SEA} width="360" height={320 - SEA} fill="url(#ga-water)" />
        <defs>
          <linearGradient id="ga-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="hs-w0" />
            <stop offset="1" className="hs-w1" />
          </linearGradient>
        </defs>
        <path d={`M0,${SEA} q10,-4 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0`} className="hs-surf" />
        {/* 원줄(위) → 도래 */}
        <line x1={X} y1="0" x2={X} y2="218" className="ga-line" />
        {/* 목줄(도래 → 바늘): 조금 다른 색 */}
        <line x1={X} y1="222" x2={X} y2="282" className="ga-leader" />
        {/* 찌멈춤 매듭 */}
        <rect x={X - 6} y="28" width="12" height="5" rx="2" className="ga-knot" />
        {/* 구슬 */}
        <circle cx={X} cy="48" r="5" className="ga-bead" />
        {/* 구멍찌: 수면에 반쯤 잠김 */}
        <ellipse cx={X} cy={SEA} rx="13" ry="20" className="ga-float" />
        <path d={`M${X - 13},${SEA} A13,20 0 0 1 ${X + 13},${SEA} Z`} className="ga-float-top" />
        {/* 수중찌 */}
        <rect x={X - 5} y="150" width="10" height="20" rx="5" className="ga-sub" />
        {/* 도래 */}
        <circle cx={X} cy="214" r="4" className="ga-swivel" />
        <circle cx={X} cy="223" r="4" className="ga-swivel" />
        {/* 좁쌀봉돌 */}
        <circle cx={X} cy="248" r="4" className="ga-sinker" />
        {/* 바늘 + 미끼(크릴) */}
        <path d={`M${X},282 L${X},294 Q${X},304 ${X + 9},302 Q${X + 14},299 ${X + 12},292`} className="ga-hook" />
        <path d={`M${X + 4},292 q8,-6 14,2 q-4,8 -12,6 z`} className="ga-bait" />

        {/* 구간 표시: 원줄 / 목줄 / 찌밑 수심 */}
        <g className="ga-bracket">
          <path d={`M${X - 34},4 L${X - 40},4 L${X - 40},214 L${X - 34},214`} />
          <text x={X - 46} y="112" textAnchor="end">원줄</text>
          <path d={`M${X - 34},222 L${X - 40},222 L${X - 40},298 L${X - 34},298`} />
          <text x={X - 46} y="264" textAnchor="end">목줄</text>
          <path d={`M${X + 150},${SEA} L${X + 156},${SEA} L${X + 156},298 L${X + 150},298`} className="depth" />
          <text x={X + 162} y="196" className="depth">찌밑</text>
          <text x={X + 162} y="212" className="depth">수심</text>
        </g>
        <text x="8" y={SEA - 8} className="hs-lbl">수면</text>

        <Tag n={10} x={176} y={22} px={X + 6} py={30} />
        <Tag n={11} x={204} y={50} px={X + 5} py={48} />
        <Tag n={12} x={176} y={82} px={X + 13} py={SEA - 2} />
        <Tag n={13} x={176} y={150} px={X + 5} py={160} />
        <Tag n={14} x={204} y={204} px={X + 4} py={218} />
        <Tag n={15} x={204} y={232} px={X} py={236} />
        <Tag n={16} x={176} y={258} px={X + 4} py={248} />
        <Tag n={17} x={176} y={306} px={X + 2} py={300} />
        <Tag n={18} x={210} y={284} px={X + 16} py={294} />
      </svg>
      <Legend items={RIG_PARTS} />
      <p className="small muted" style={{ margin: 0 }}>
        찌멈춤 매듭(10)을 위로 올리면 찌밑 수심이 깊어져 미끼가 바닥 쪽으로, 내리면 얕아져요. 목줄(15)은 원줄보다 가늘게 — 걸렸을 때 목줄이 먼저 끊어져 찌를 지켜요.
      </p>
    </figure>
  );
}
