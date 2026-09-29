import type { SpotType } from "@/lib/types";

/**
 * 포인트 사진 대신 쓰는 풍경 일러스트. 유형(방파제·갯바위·항구·선상·해변·갯벌)과
 * 시간대 분위기(낮·노을·새벽)를 포인트 id 로 결정해 목록에서 서로 다르게 보이게 한다.
 */
type Mood = "day" | "sunset" | "dawn";

const SKY: Record<Mood, [string, string, string]> = {
  day: ["#5aa9e6", "#9fd0f5", "#e3f2fd"],
  sunset: ["#27406e", "#e9875a", "#ffd29a"],
  dawn: ["#1f3a68", "#6f8fc9", "#f3c7a6"],
};
const SEA: Record<Mood, [string, string]> = {
  day: ["#1f7fd6", "#0b4a9a"],
  sunset: ["#2d5d9c", "#0e2f63"],
  dawn: ["#34609e", "#12356d"],
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function SceneArt({ id, type, className, mood: moodProp }: { id: string; type: SpotType; className?: string; mood?: Mood }) {
  const h = hash(id);
  const mood: Mood = moodProp ?? (["day", "sunset", "day", "dawn"] as Mood[])[h % 4];
  const k = `sc-${id}-${mood}`;
  const [s1, s2, s3] = SKY[mood];
  const [w1, w2] = SEA[mood];
  const sunY = mood === "day" ? 46 : 118;
  const hz = 128; // 수평선
  const flip = h % 2 === 1;

  return (
    <svg className={className} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${k}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s1} />
          <stop offset="0.65" stopColor={s2} />
          <stop offset="1" stopColor={s3} />
        </linearGradient>
        <linearGradient id={`${k}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={w1} />
          <stop offset="1" stopColor={w2} />
        </linearGradient>
        <radialGradient id={`${k}-sun`}>
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.5" stopColor={mood === "day" ? "#fff3b0" : "#ffcf7a"} />
          <stop offset="1" stopColor={mood === "day" ? "#fff3b0" : "#ff9b54"} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#${k}-sky)`} />
      <circle cx={flip ? 110 : 300} cy={sunY} r={mood === "day" ? 34 : 46} fill={`url(#${k}-sun)`} />
      {mood === "day" && (
        <g fill="#fff" opacity="0.9">
          <ellipse cx={flip ? 290 : 90} cy="44" rx="42" ry="12" />
          <ellipse cx={flip ? 318 : 118} cy="36" rx="26" ry="12" />
          <ellipse cx={flip ? 180 : 230} cy="70" rx="30" ry="8" opacity="0.7" />
        </g>
      )}
      {/* 먼 산 */}
      <path d={`M0 ${hz} L0 ${hz - 26} Q60 ${hz - 58} 120 ${hz - 30} T240 ${hz - 34} T400 ${hz - 22} L400 ${hz} Z`} fill={mood === "day" ? "#5c86a8" : "#3a4f78"} opacity="0.55" />
      <path d={`M0 ${hz} Q90 ${hz - 20} 170 ${hz - 8} T400 ${hz - 10} L400 ${hz} Z`} fill={mood === "day" ? "#3f6f8e" : "#2c3d63"} opacity="0.7" />
      {/* 바다 */}
      <rect y={hz} width="400" height={260 - hz} fill={`url(#${k}-sea)`} />
      <g stroke="#fff" strokeOpacity={mood === "day" ? 0.35 : 0.25} strokeWidth="1.5" strokeLinecap="round">
        <path d={`M${flip ? 70 : 250} ${hz + 10} h40`} />
        <path d={`M${flip ? 40 : 280} ${hz + 22} h60`} />
        <path d={`M${flip ? 90 : 230} ${hz + 36} h30`} />
        <path d="M30 200 h40 M300 214 h50 M160 232 h36" />
      </g>
      {mood !== "day" && <path d={`M${flip ? 90 : 280} ${hz + 4} l40 0 l-8 70 l-24 0 Z`} fill="#ffb36b" opacity="0.18" />}
      <Foreground type={type} flip={flip} hz={hz} />
    </svg>
  );
}

function Foreground({ type, flip, hz }: { type: SpotType; flip: boolean; hz: number }) {
  const t = flip ? "translate(400 0) scale(-1 1)" : undefined;
  switch (type) {
    case "OUTER_HARBOR":
    case "BREAKWATER_TIP":
      return (
        <g transform={t}>
          {/* 테트라포드 방파제 */}
          <path d={`M0 260 L0 ${hz + 58} L210 ${hz + 20} L236 ${hz + 24} L236 ${hz + 34} L0 260 Z`} fill="#8a96a6" />
          <path d={`M0 ${hz + 58} L210 ${hz + 20} L236 ${hz + 24}`} stroke="#c9d2dd" strokeWidth="3" fill="none" />
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M${10 + i * 22} ${hz + 70 - i * 4} l10 -14 l10 14 l-10 6 Z`} fill={i % 2 ? "#6f7b8c" : "#9aa6b5"} />
          ))}
          {/* 등대 */}
          <g transform={`translate(214 ${hz - 36})`}>
            <path d="M4 58 L8 8 L18 8 L22 58 Z" fill="#fff" />
            <path d="M5.2 44 L20.8 44 L21.6 54 L4.4 54 Z M6.4 28 L19.6 28 L20.4 38 L5.6 38 Z M7.4 14 L18.6 14 L19.2 22 L6.8 22 Z" fill="#e0453a" />
            <rect x="6" y="0" width="14" height="9" rx="2" fill="#2b3345" />
            <circle cx="13" cy="4" r="2.4" fill="#ffe08a" />
          </g>
        </g>
      );
    case "ROCK":
      return (
        <g transform={t}>
          <path d={`M0 260 L0 ${hz + 40} Q30 ${hz + 18} 62 ${hz + 34} Q90 ${hz + 8} 128 ${hz + 42} Q160 ${hz + 30} 186 ${hz + 64} L220 260 Z`} fill="#3d3a3a" />
          <path d={`M40 260 Q70 ${hz + 70} 120 ${hz + 78} Q170 ${hz + 84} 230 260 Z`} fill="#2a2828" />
          <path d={`M186 ${hz + 64} q14 -6 26 2 q10 8 26 2`} stroke="#fff" strokeWidth="3" fill="none" opacity="0.8" strokeLinecap="round" />
          <path d={`M300 ${hz + 60} q20 -18 44 -4 q16 8 30 30 L300 ${hz + 92} Z`} fill="#474343" />
        </g>
      );
    case "INNER_HARBOR":
      return (
        <g transform={t}>
          <rect x="0" y={hz + 70} width="400" height="70" fill="#9aa4b1" />
          <rect x="0" y={hz + 70} width="400" height="6" fill="#c4ccd6" />
          {[40, 150, 260].map((x, i) => (
            <g key={x} transform={`translate(${x} ${hz + 30 + (i % 2) * 8})`}>
              <path d="M0 18 L70 18 L60 32 L8 32 Z" fill={["#f5f7fa", "#2f6fd1", "#e0453a"][i]} />
              <rect x="22" y="4" width="22" height="14" rx="2" fill="#e8edf3" />
              <rect x="26" y="7" width="6" height="5" fill="#5aa9e6" />
              <path d="M34 4 V-14" stroke="#e8edf3" strokeWidth="2" />
            </g>
          ))}
        </g>
      );
    case "BOAT":
      return (
        <g transform={t}>
          <g transform={`translate(150 ${hz + 34})`}>
            <path d="M0 30 L150 30 L130 58 L16 58 Z" fill="#f2f5f9" />
            <path d="M0 30 L150 30 L147 36 L2 36 Z" fill="#1e6fe0" />
            <rect x="60" y="4" width="46" height="26" rx="3" fill="#ffffff" />
            <rect x="66" y="9" width="12" height="9" fill="#5aa9e6" />
            <rect x="84" y="9" width="12" height="9" fill="#5aa9e6" />
            <path d="M84 4 V-26 M84 -22 L110 -2" stroke="#dfe6ee" strokeWidth="2.5" />
            <path d="M22 30 L6 -6" stroke="#2b3345" strokeWidth="2" />
          </g>
          <path d={`M130 ${hz + 96} q30 -8 60 0 t60 0 t60 0`} stroke="#fff" strokeOpacity="0.6" strokeWidth="2" fill="none" />
        </g>
      );
    case "SURF":
      return (
        <g transform={t}>
          <path d={`M0 260 L0 ${hz + 70} Q120 ${hz + 40} 260 ${hz + 86} Q330 ${hz + 108} 400 ${hz + 100} L400 260 Z`} fill="#e9d6ae" />
          <path d={`M0 ${hz + 70} Q120 ${hz + 40} 260 ${hz + 86} Q330 ${hz + 108} 400 ${hz + 100}`} stroke="#fff" strokeWidth="5" fill="none" opacity="0.85" />
          <g transform={`translate(300 ${hz + 60})`}>
            <path d="M0 40 L0 -6" stroke="#5b4636" strokeWidth="2" />
            <path d="M0 -6 L40 -28" stroke="#2b3345" strokeWidth="1.5" />
          </g>
        </g>
      );
    case "TIDAL_FLAT":
      return (
        <g transform={t}>
          <path d={`M0 260 L0 ${hz + 34} Q100 ${hz + 26} 200 ${hz + 40} T400 ${hz + 34} L400 260 Z`} fill="#8b7355" />
          <path d={`M40 260 Q80 ${hz + 80} 150 ${hz + 64} T300 ${hz + 90} T400 ${hz + 70}`} stroke="#4f8fd0" strokeWidth="10" fill="none" opacity="0.8" />
          <g fill="#6f5a42">
            <ellipse cx="70" cy={hz + 60} rx="12" ry="3" />
            <ellipse cx="240" cy={hz + 110} rx="16" ry="4" />
            <ellipse cx="330" cy={hz + 52} rx="10" ry="3" />
          </g>
        </g>
      );
  }
}
