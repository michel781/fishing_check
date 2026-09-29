/**
 * 어종 일러스트 (사진 대신). 몸 모양(일반 어형·납작·문어·오징어·갑오징어)과 색·무늬를 어종별로 정의.
 */
type Kind = "fish" | "flat" | "octopus" | "squid" | "cuttle";

interface Look {
  kind: Kind;
  body: string; // 등 색
  belly: string; // 배 색
  fin: string;
  pattern?: "blotch" | "bars" | "waves" | "dots" | "stripe";
  patternColor?: string;
  slim?: boolean; // 가늘고 긴 몸
  beak?: boolean; // 학꽁치 부리
  bigEye?: boolean;
  deep?: boolean; // 체고가 높은 몸 (돔류)
}

const LOOKS: Record<string, Look> = {
  rockfish: { kind: "fish", body: "#3e4148", belly: "#8d9097", fin: "#2e3036", pattern: "blotch", patternColor: "#25272c", bigEye: true },
  greenling: { kind: "fish", body: "#7a6a45", belly: "#c9b98e", fin: "#5c4f33", pattern: "blotch", patternColor: "#5a4b2f", slim: true },
  flatfish: { kind: "flat", body: "#6b5634", belly: "#8a7248", fin: "#56442a", pattern: "dots", patternColor: "#3f3120" },
  blackporgy: { kind: "fish", body: "#4b5563", belly: "#b8c0cb", fin: "#2f3540", pattern: "bars", patternColor: "#3a4250", deep: true },
  redseabream: { kind: "fish", body: "#e07a7a", belly: "#f6c8c0", fin: "#d4605f", pattern: "dots", patternColor: "#6fb7ea", deep: true },
  webfoot: { kind: "octopus", body: "#b98a6c", belly: "#e2c4ae", fin: "#9b6f53" },
  cuttlefish: { kind: "cuttle", body: "#7a5a3e", belly: "#c7a887", fin: "#a47f5b", pattern: "stripe", patternColor: "#4f3a27" },
  halfbeak: { kind: "fish", body: "#4f86b8", belly: "#e6eef5", fin: "#3a6a96", slim: true, beak: true },
  mackerel: { kind: "fish", body: "#2f6f7e", belly: "#dfe7ea", fin: "#285c68", pattern: "waves", patternColor: "#16404a", slim: true },
  bolak: { kind: "fish", body: "#8a5a3c", belly: "#d5b391", fin: "#6d452c", pattern: "blotch", patternColor: "#5e3b25", bigEye: true },
  righteye: { kind: "flat", body: "#8a6d4a", belly: "#a8895f", fin: "#6f5638", pattern: "dots", patternColor: "#5a452c" },
  "squid-bigfin": { kind: "squid", body: "#e3b8a4", belly: "#f4ddd2", fin: "#d39b86", pattern: "dots", patternColor: "#b8735a" },
};

export function FishArt({ id, className, title }: { id: string; className?: string; title?: string }) {
  const L = LOOKS[id] ?? LOOKS.rockfish;
  const k = `fa-${id}`;
  return (
    <svg className={className} viewBox="0 0 200 120" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`${k}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L.body} />
          <stop offset="0.62" stopColor={L.body} />
          <stop offset="1" stopColor={L.belly} />
        </linearGradient>
      </defs>
      {L.kind === "fish" && <Fish L={L} k={k} />}
      {L.kind === "flat" && <Flat L={L} k={k} />}
      {L.kind === "octopus" && <Octopus L={L} k={k} />}
      {L.kind === "squid" && <Squid L={L} k={k} />}
      {L.kind === "cuttle" && <Cuttle L={L} k={k} />}
    </svg>
  );
}

function Fish({ L, k }: { L: Look; k: string }) {
  const h = L.deep ? 36 : L.slim ? 20 : 28; // 반 체고
  const top = 60 - h;
  const bot = 60 + h;
  const body = `M${L.beak ? 34 : 26} 60 C 40 ${top - 4}, 110 ${top - 2}, 150 ${60 - h * 0.45} L 150 ${60 + h * 0.45} C 110 ${bot + 2}, 40 ${bot + 4}, ${L.beak ? 34 : 26} 60 Z`;
  return (
    <g>
      {/* 꼬리 */}
      <path d={`M148 60 L182 ${60 - h - 6} Q172 60 182 ${60 + h + 6} Z`} fill={L.fin} />
      {/* 등·배 지느러미 */}
      <path d={`M62 ${top + 4} Q80 ${top - (L.deep ? 22 : 18)} 118 ${top + 2} Z`} fill={L.fin} />
      {L.deep && <path d={`M70 ${top + 2} l4 -18 m8 18 l4 -20 m8 20 l4 -19 m8 19 l4 -17`} stroke={L.fin} strokeWidth="2" />}
      <path d={`M88 ${bot - 4} Q104 ${bot + 12} 122 ${bot - 4} Z`} fill={L.fin} />
      <path d={body} fill={`url(#${k}-g)`} />
      {L.pattern === "blotch" && (
        <g fill={L.patternColor} opacity="0.55">
          <ellipse cx="70" cy={60 - h * 0.4} rx="9" ry="6" />
          <ellipse cx="98" cy={60 - h * 0.35} rx="11" ry="6" />
          <ellipse cx="124" cy={60 - h * 0.25} rx="7" ry="5" />
          <ellipse cx="84" cy={60 + h * 0.1} rx="6" ry="4" />
        </g>
      )}
      {L.pattern === "bars" && (
        <g stroke={L.patternColor} strokeWidth="4" opacity="0.5">
          {[68, 86, 104, 122].map((x) => <path key={x} d={`M${x} ${top + 8} L${x - 3} ${bot - 10}`} />)}
        </g>
      )}
      {L.pattern === "waves" && (
        <g stroke={L.patternColor} strokeWidth="2" fill="none" opacity="0.85">
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${56 + i * 18} ${top + 6} q5 6 0 12 q-5 6 0 10`} />)}
        </g>
      )}
      {L.pattern === "dots" && (
        <g fill={L.patternColor}>
          {[[70, 50], [88, 46], [104, 52], [120, 48], [80, 62], [98, 60], [132, 56]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" />)}
        </g>
      )}
      {/* 옆줄·아가미 */}
      <path d={`M50 58 Q100 ${60 - h * 0.15} 146 60`} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
      <path d={`M52 ${60 - h * 0.6} Q46 60 52 ${60 + h * 0.6}`} stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
      <path d="M58 64 q10 10 22 6" fill={L.fin} opacity="0.8" />
      {/* 눈·입 */}
      <circle cx={L.beak ? 46 : 40} cy={58 - h * 0.18} r={L.bigEye ? 6 : 4.5} fill="#f4f1e6" />
      <circle cx={L.beak ? 46.6 : 40.6} cy={58 - h * 0.18} r={L.bigEye ? 3.4 : 2.6} fill="#111" />
      {L.beak ? <path d="M34 61 L12 64 L34 64 Z" fill={L.fin} /> : <path d="M26 60 q5 3 10 2" stroke="#1d1d1d" strokeWidth="1.5" fill="none" />}
    </g>
  );
}

function Flat({ L, k }: { L: Look; k: string }) {
  return (
    <g>
      <path d="M150 60 L182 40 Q174 60 182 80 Z" fill={L.fin} />
      <ellipse cx="94" cy="60" rx="66" ry="40" fill={L.fin} />
      <ellipse cx="92" cy="60" rx="58" ry="33" fill={`url(#${k}-g)`} />
      <g fill={L.patternColor} opacity="0.6">
        {[[70, 50], [96, 44], [118, 56], [84, 70], [108, 72], [60, 64], [128, 44]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" />)}
      </g>
      <circle cx="46" cy="50" r="4" fill="#f4f1e6" />
      <circle cx="46.5" cy="50" r="2.2" fill="#111" />
      <circle cx="52" cy="60" r="4" fill="#f4f1e6" />
      <circle cx="52.5" cy="60" r="2.2" fill="#111" />
      <path d="M34 64 q4 3 8 1" stroke="#1d1d1d" strokeWidth="1.5" fill="none" />
    </g>
  );
}

function Octopus({ L }: { L: Look; k: string }) {
  return (
    <g>
      {[[-44, 34], [-28, 44], [-12, 50], [6, 50], [22, 46], [38, 38], [50, 26], [-54, 22]].map(([dx, len], i) => (
        <path key={i} d={`M100 62 q${dx * 0.6} ${len * 0.5} ${dx} ${len} q${dx * 0.1} 8 ${dx * 0.2 + (i % 2 ? 6 : -6)} 10`} stroke={L.body} strokeWidth="7" fill="none" strokeLinecap="round" />
      ))}
      <ellipse cx="100" cy="42" rx="26" ry="28" fill={L.body} />
      <ellipse cx="94" cy="34" rx="10" ry="8" fill={L.belly} opacity="0.45" />
      <circle cx="90" cy="58" r="4" fill="#f4f1e6" />
      <circle cx="110" cy="58" r="4" fill="#f4f1e6" />
      <rect x="88" y="57" width="4" height="2" fill="#111" />
      <rect x="108" y="57" width="4" height="2" fill="#111" />
    </g>
  );
}

function Squid({ L, k }: { L: Look; k: string }) {
  return (
    <g>
      <path d="M40 60 Q60 18 150 30 Q170 60 150 90 Q60 102 40 60 Z" fill={L.fin} opacity="0.75" />
      <path d="M50 60 Q60 36 150 44 L150 76 Q60 84 50 60 Z" fill={`url(#${k}-g)`} />
      <g fill={L.patternColor} opacity="0.6">
        {[[80, 52], [100, 50], [120, 54], [90, 66], [112, 68], [136, 60]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" />)}
      </g>
      {[-8, -4, 0, 4, 8].map((d, i) => (
        <path key={i} d={`M150 ${60 + d} q18 ${d} 34 ${d * 2}`} stroke={L.body} strokeWidth="3" fill="none" strokeLinecap="round" />
      ))}
      <circle cx="150" cy="54" r="4" fill="#f4f1e6" />
      <circle cx="150.5" cy="54" r="2.2" fill="#111" />
    </g>
  );
}

function Cuttle({ L, k }: { L: Look; k: string }) {
  return (
    <g>
      <ellipse cx="92" cy="60" rx="62" ry="34" fill={L.fin} />
      <ellipse cx="92" cy="60" rx="54" ry="27" fill={`url(#${k}-g)`} />
      <g stroke={L.patternColor} strokeWidth="2.5" opacity="0.55" fill="none">
        {[60, 76, 92, 108, 124].map((x) => <path key={x} d={`M${x} 38 q-4 22 0 44`} />)}
      </g>
      {[-8, -4, 0, 4, 8].map((d, i) => (
        <path key={i} d={`M150 ${60 + d} q14 ${d} 28 ${d * 1.8}`} stroke={L.body} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ))}
      <circle cx="146" cy="54" r="4.5" fill="#f4f1e6" />
      <path d="M143 54 q3 -3 6 0" stroke="#111" strokeWidth="2" fill="none" />
    </g>
  );
}
