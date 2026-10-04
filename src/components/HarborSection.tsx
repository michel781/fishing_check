/**
 * 항구 단면 그림 (원리 설명용). 일반적인 사석식(경사식) 방파제와 케이슨 안벽을 단순화했다.
 * 왼쪽이 바깥 바다, 오른쪽이 내항. 번호는 구조물 비교 카드 번호와 같다.
 */

const SEA = 80; // 해수면 y
const BED = 224; // 바닥 y (대략)

/** 테트라포드: 다리 넷 중 셋이 보이는 모습 + 앞으로 나온 다리(원) */
function Tetrapod({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} className="hs-tp">
      <path d="M0,0 L-7.5,5 M0,0 L7.5,5 M0,0 L0,-8.5" />
      <circle r={3.6} />
    </g>
  );
}

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

/** 바다 쪽 경사면을 덮는 테트라포드 위치 (경사면에서 바깥으로 띄운 두 겹, 엇갈려 쌓음) */
function tetrapodLayout() {
  const a = { x: 64, y: BED + 2 };
  const b = { x: 148, y: 72 };
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  // 경사면 법선(몸체 안쪽 방향)
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const rot = [12, 75, 140, 200, 260, 320];
  const out: { x: number; y: number; r: number }[] = [];
  for (const [d, phase, shift] of [
    [7, 0, 0],
    [21, 0.5, 3],
  ] as const) {
    for (let i = 0; i < 6; i++) {
      const t = 0.08 + (i + phase) * 0.16;
      if (t > 0.97) continue;
      out.push({ x: a.x + (b.x - a.x) * t - nx * d, y: a.y + (b.y - a.y) * t - ny * d, r: rot[(i + shift) % 6] });
    }
  }
  return out;
}

export function HarborSection() {
  const tps = tetrapodLayout();
  return (
    <figure className="hs" style={{ margin: 0 }}>
      <svg viewBox="0 0 480 250" role="img" aria-labelledby="hs-t hs-d">
        <title id="hs-t">항구 단면 그림</title>
        <desc id="hs-d">
          왼쪽 바깥 바다의 암초와 해초, 테트라포드로 덮인 사석 방파제와 끝의 등대, 내항 쪽 사석 경사면, 가운데 모래 바닥과 잘피, 기둥 위 선착장과 그 아래 그늘,
          케이슨 안벽과 가로등 불빛. 번호는 아래 비교 카드 번호와 같아요.
        </desc>
        <defs>
          <linearGradient id="hs-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="hs-w0" />
            <stop offset="1" className="hs-w1" />
          </linearGradient>
          <pattern id="hs-rubble" width="22" height="14" patternUnits="userSpaceOnUse">
            <rect width="22" height="14" className="hs-rb-bg" />
            <path d="M1,6 q3,-5 8,-3 q3,4 -1,7 q-6,1 -7,-4z M11,1 q6,-2 9,2 q0,4 -5,5 q-5,-2 -4,-7z M8,10 q5,-2 8,1 q-1,4 -5,3 q-4,0 -3,-4z" className="hs-rb" />
          </pattern>
          <pattern id="hs-sandp" width="18" height="8" patternUnits="userSpaceOnUse">
            <rect width="18" height="8" className="hs-sand-bg" />
            <path d="M1,5 q4,-3 8,0 M10,3 q3,-2 6,0" className="hs-ripple" />
          </pattern>
          <pattern id="hs-concrete" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" className="hs-con-bg" />
            <circle cx="2" cy="3" r="0.6" className="hs-con-dot" />
            <circle cx="6" cy="6" r="0.5" className="hs-con-dot" />
          </pattern>
        </defs>

        {/* 바다 */}
        <rect x="0" y={SEA} width="480" height={250 - SEA} fill="url(#hs-water)" />
        {/* 수면: 바깥은 물결, 안쪽은 잔잔 */}
        <path d={`M0,${SEA} q8,-5 16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t16,0 t16,0`} className="hs-surf" />
        <path d={`M206,${SEA} L480,${SEA}`} className="hs-surf calm" />

        {/* 등대: 방파제 끝(멀리)에 서 있는 모습 */}
        <g className="hs-lh">
          <rect x="176" y="26" width="11" height="44" className="hs-lh-body" />
          <rect x="176" y="36" width="11" height="5" className="hs-lh-band" />
          <rect x="176" y="50" width="11" height="5" className="hs-lh-band" />
          <rect x="174" y="22" width="15" height="4" className="hs-lh-gal" />
          <rect x="177.5" y="14" width="8" height="8" className="hs-lh-lamp" />
          <path d="M176,14 L181.5,8 L187,14 Z" className="hs-lh-roof" />
        </g>

        {/* 바깥 암초 + 해초 */}
        <path d="M0,250 L0,206 Q8,196 18,202 Q26,186 40,197 Q50,189 60,203 L70,226 L70,250 Z" className="hs-rock" />
        <path d="M14,200 q-4,-14 2,-26 M22,195 q5,-16 -1,-30 M44,193 q-5,-12 1,-24" className="hs-kelp" />

        {/* 모래 바닥 */}
        <path d={`M60,250 L60,${BED} Q200,219 300,222 Q390,226 480,221 L480,250 Z`} fill="url(#hs-sandp)" />
        {/* 잘피 */}
        <path d="M286,222 q-3,-12 1,-22 M292,222 q3,-14 -1,-25 M298,222 q-2,-10 2,-18 M330,223 q3,-11 -1,-20 M336,223 q-3,-13 1,-23" className="hs-grass" />

        {/* 사석 방파제 몸체 */}
        <path d={`M62,${BED + 2} L148,72 L206,72 L264,${BED + 2} Z`} fill="url(#hs-rubble)" className="hs-mound" />
        {/* 바다 쪽 피복: 테트라포드 */}
        {tps.map((p, i) => (
          <Tetrapod key={i} x={p.x} y={p.y} r={p.r} s={1.7} />
        ))}
        {/* 파라펫(바다 쪽 벽)과 상판 */}
        <rect x="146" y="46" width="14" height="34" fill="url(#hs-concrete)" className="hs-con" />
        <rect x="160" y="66" width="48" height="12" fill="url(#hs-concrete)" className="hs-con" />

        {/* 선착장: 기둥 위 상판, 아래 그늘 */}
        <rect x="352" y={SEA + 1} width="60" height={BED - SEA - 3} className="hs-shade" />
        {[356, 382, 406].map((x) => (
          <rect key={x} x={x} y="76" width="4" height={BED - 76} className="hs-pile" />
        ))}
        <rect x="350" y="70" width="64" height="7" fill="url(#hs-concrete)" className="hs-con" />

        {/* 케이슨 안벽 + 기초 사석 */}
        <path d={`M396,${BED + 2} L408,210 L480,210 L480,${BED + 2} Z`} fill="url(#hs-rubble)" className="hs-mound" />
        <rect x="412" y="60" width="68" height="150" fill="url(#hs-concrete)" className="hs-con" />
        <rect x="408" y="56" width="72" height="6" className="hs-cope" />

        {/* 가로등과 불빛 */}
        <path d={`M432,20 L392,${SEA} L446,${SEA} Z`} className="hs-beam" />
        <ellipse cx="420" cy={SEA + 1} rx="26" ry="3" className="hs-glow" />
        <line x1="452" y1="56" x2="452" y2="14" className="hs-pole" />
        <path d="M452,16 Q446,12 434,16" className="hs-pole" />
        <rect x="428" y="15" width="10" height="5" rx="1.5" className="hs-lamp" />

        {/* 바깥·안쪽 표시 */}
        <text x="8" y={SEA - 10} className="hs-lbl">바깥 바다</text>
        <text x="236" y={SEA - 10} className="hs-lbl">내항</text>

        {/* 번호 (지시선 + 번호표) */}
        <Tag n={1} x={74} y={112} px={112} py={150} />
        <Tag n={2} x={258} y={128} px={238} py={166} />
        <Tag n={3} x={462} y={136} px={414} py={150} />
        <Tag n={4} x={340} y={112} px={370} py={140} />
        <Tag n={5} x={316} y={190} px={316} py={220} />
        <Tag n={6} x={16} y={166} px={30} py={198} />
        <Tag n={7} x={222} y={50} px={204} py={78} />
        <Tag n={8} x={206} y={22} px={188} py={22} />
        <Tag n={9} x={372} y={44} px={396} py={78} />
        <Tag n={10} x={252} y={200} px={264} py={224} />
      </svg>
    </figure>
  );
}
