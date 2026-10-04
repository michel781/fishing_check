import Link from "next/link";
import { FOOD, STYLE, type Feeding } from "@/data/feeding";
import type { Guide } from "@/data/guides";
import { kstDateString, sunTimes } from "@/lib/engine/astro";
import { josa } from "@/lib/push/plan";
import { activityByHour, activityLabel, baitFits, dietRows, similarDiet, tempCurve } from "@/lib/feeding";
import type { Species } from "@/lib/types";

const HOUR = 3600e3;
const two = (h: number) => String(h).padStart(2, "0");
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** 연속된 높은 시간대를 "05~08시" 꼴로 */
function peakRanges(v: number[], cut: number): string[] {
  const out: string[] = [];
  let s = -1;
  for (let h = 0; h <= 24; h++) {
    const on = h < 24 && v[h] >= cut;
    if (on && s < 0) s = h;
    if (!on && s >= 0) {
      out.push(`${two(s)}~${two(h)}시`);
      s = -1;
    }
  }
  // 자정을 넘기는 구간은 하나로 (예: 18~24시 + 00~07시 → 18~07시)
  if (out.length > 1 && out[0].startsWith("00~") && out[out.length - 1].endsWith("~24시")) {
    const last = out.pop()!;
    out[0] = `${last.slice(0, 2)}~${out[0].slice(3)} (밤새)`;
  }
  return out;
}

/**
 * 어종 먹이 습성: 무엇을(먹이 구성) · 어디서(먹는 깊이) · 언제(하루 활동·수온) · 어떻게(먹는 방식) → 미끼 궁합.
 * 하루 활동과 수온 곡선은 점수 엔진과 같은 식이라 포인트 점수와 어긋나지 않는다.
 */
export function FeedingPanel({ s, f, guide, now }: { s: Species; f: Feeding; guide?: Guide; now: Date }) {
  const rows = dietRows(f);
  const style = STYLE[f.style];
  const date = kstDateString(now);
  const d0 = Date.parse(`${date}T00:00:00+09:00`);
  // 어종 화면은 포인트가 없어서 중부 해안(태안 부근) 해 뜨고 지는 시각을 쓴다
  const sun = sunTimes(new Date(`${date}T12:00:00+09:00`), 36.6, 126.3);
  const sr = sun.sunrise.getTime();
  const ss = sun.sunset.getTime();
  const act = activityByHour(s, d0, sr, ss);
  const nowH = new Date(now.getTime() + 9 * HOUR).getUTCHours();
  const peakCut = Math.max(0.6, Math.max(...act) - 0.1);
  const peaks = peakRanges(act, peakCut);
  const curve = tempCurve(s);
  const fits = baitFits(s.baits, f);
  const sim = similarDiet(s.id);
  const month = new Date(now.getTime() + 9 * HOUR).getUTCMonth();
  const season = s.season[month];

  // 하루 활동 막대 좌표
  const W = 336;
  const H = 120;
  const bw = W / 24;
  const srH = (sr - d0) / HOUR;
  const ssH = (ss - d0) / HOUR;
  // 수온 곡선 좌표
  const tx = (c: number) => 8 + (c / 32) * (W - 16);
  const ty = (v: number) => 100 - v * 80;
  const line = curve.map((p, i) => `${i ? "L" : "M"}${tx(p.c).toFixed(1)},${ty(p.v).toFixed(1)}`).join(" ");

  return (
    <div className="stack feed" style={{ gap: 14 }}>
      <section className="card stack" style={{ gap: 8 }} aria-labelledby="feed-sum">
        <h2 id="feed-sum" className="info-h" style={{ marginTop: 0 }}>
          <span className="dot" aria-hidden>🍽</span>
          {josa(s.name, "은", "는")} 이렇게 먹어요
        </h2>
        <div className="feed-chips">
          <span className="feed-chip"><small>먹는 방식</small><b>{style.label}</b></span>
          <span className="feed-chip"><small>주식</small><b>{FOOD[rows[0].kind].icon} {FOOD[rows[0].kind].label}</b></span>
          <span className="feed-chip"><small>지금({two(nowH)}시)</small><b>{activityLabel(act[nowH] * (0.35 + 0.65 * season))}</b></span>
        </div>
        <p className="small" style={{ margin: 0 }}>{style.desc}</p>
        <p className="small muted" style={{ margin: 0 }}>
          사냥터: {f.cover} · 먹이 찾는 감각: {f.senses}
        </p>
        <p className="small muted" style={{ margin: 0 }}>
          &lsquo;지금&rsquo;은 시간대 활동({pct(act[nowH])})에 이번 달 제철 정도({pct(season)})를 곱한 값이에요. 실제 물때·바람·수온은 포인트 화면 점수에 반영돼요.
        </p>
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="feed-diet">
        <h2 id="feed-diet" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>🥢</span>무엇을 먹나 · 먹이 구성</h2>
        <ul className="feed-diet">
          {rows.map((r) => (
            <li key={r.kind}>
              <span className="lb">
                <span aria-hidden>{FOOD[r.kind].icon}</span> {FOOD[r.kind].label}
              </span>
              <span className="bar" aria-hidden title={`${FOOD[r.kind].label} ${r.share}%`}>
                <i style={{ width: `${r.share}%` }} />
              </span>
              <b className="num">{r.share}%</b>
              <span className="ex small muted">{FOOD[r.kind].examples}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="feed-layer">
        <h2 id="feed-layer" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>↧</span>어디서 먹나 · 먹는 깊이</h2>
        <div className="feed-layer">
          <svg viewBox="0 0 200 150" role="img" aria-label={`먹는 깊이: 표층 ${pct(f.layer.top)}, 중층 ${pct(f.layer.mid)}, 바닥 ${pct(f.layer.bottom)}`}>
            <rect x="0" y="10" width="200" height="140" className="sea" />
            <path d="M0,12 q12,-6 25,0 t25,0 t25,0 t25,0 t25,0 t25,0 t25,0 t25,0" className="surf" />
            <path d="M0,150 L0,128 Q30,118 60,126 T120,122 T200,124 L200,150 Z" className="bed" />
            {(["top", "mid", "bottom"] as const).map((k, i) => {
              const y = [36, 76, 112][i];
              const v = f.layer[k];
              return (
                <g key={k} opacity={0.18 + 0.82 * v}>
                  <text x={100} y={y + 6} textAnchor="middle" className="fish" fontSize={v >= 0.7 ? 26 : 20}>
                    🐟
                  </text>
                </g>
              );
            })}
            <line x1="0" y1="56" x2="200" y2="56" className="div" />
            <line x1="0" y1="96" x2="200" y2="96" className="div" />
          </svg>
          <ul className="feed-layer-l">
            {(["top", "mid", "bottom"] as const).map((k) => (
              <li key={k}>
                <span>{{ top: "표층 (수면 가까이)", mid: "중층", bottom: "바닥" }[k]}</span>
                <span className="bar" aria-hidden><i style={{ width: `${f.layer[k] * 100}%` }} /></span>
                <b>{f.layer[k] >= 0.7 ? "주로 먹음" : f.layer[k] >= 0.35 ? "가끔" : "거의 안 감"}</b>
              </li>
            ))}
          </ul>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {f.layer.bottom >= 0.7 && f.layer.top < 0.35
            ? "미끼가 바닥에 닿아 있어야 해요. 채비가 떠 있으면 입질이 거의 없어요."
            : f.layer.top >= 0.7 && f.layer.bottom < 0.35
              ? "수면 가까이에서 먹어요. 찌 밑 수심을 얕게, 루어는 위쪽을 감아 오세요."
              : "층을 옮겨 다녀요. 입질이 없으면 수심을 바꿔 가며 찾으세요."}
        </p>
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="feed-day">
        <h2 id="feed-day" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>◷</span>언제 먹나 · 하루 먹이 활동</h2>
        <p style={{ margin: 0, fontWeight: 700 }}>가장 활발: {peaks.join(", ") || "-"}</p>
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="feed-day" role="img" aria-label={`시간별 먹이 활동: ${act.map((v, h) => `${h}시 ${activityLabel(v)}`).join(", ")}`}>
          <rect x={0} y={0} width={(srH / 24) * W} height={H} className="night" />
          <rect x={(ssH / 24) * W} y={0} width={W - (ssH / 24) * W} height={H} className="night" />
          {act.map((v, h) => (
            <rect key={h} x={h * bw + 1} y={H - Math.max(2, v * (H - 8))} width={bw - 2} height={Math.max(2, v * (H - 8))} rx={3} className={`b${v >= peakCut ? " pk" : ""}`}>
              <title>{`${h}시 ${activityLabel(v)} (${pct(v)})`}</title>
            </rect>
          ))}
          <line x1={((nowH + 0.5) / 24) * W} x2={((nowH + 0.5) / 24) * W} y1={0} y2={H} className="now" />
          {[0, 6, 12, 18].map((h) => (
            <text key={h} x={h * bw + 2} y={H + 16} className="ax">{two(h)}시</text>
          ))}
        </svg>
        <p className="small muted" style={{ margin: 0 }}>
          회색 바탕은 밤 (오늘 해 {two(Math.floor(srH))}:{two(Math.round((srH % 1) * 60))} 뜨고 {two(Math.floor(ssH))}:{two(Math.round((ssH % 1) * 60))} 짐, 중부 해안 기준) · 세로선은 지금 · 진한 막대가 가장 활발한 때
        </p>
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="feed-temp">
        <h2 id="feed-temp" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>℃</span>물 온도에 따른 먹이 활동</h2>
        <svg viewBox={`0 0 ${W} 120`} className="feed-temp" role="img" aria-label={`수온 ${s.temp.min}도 아래와 ${s.temp.max}도 위에서는 거의 안 먹고, ${s.temp.opt}도에서 가장 잘 먹어요`}>
          <rect x={tx(s.temp.min)} y={18} width={tx(s.temp.max) - tx(s.temp.min)} height={82} className="ok" />
          <path d={`${line} L${tx(32)},100 L${tx(0)},100 Z`} className="area" />
          <path d={line} className="ln" />
          <line x1={tx(s.temp.opt)} x2={tx(s.temp.opt)} y1={18} y2={100} className="opt" />
          <text x={tx(s.temp.opt)} y={13} textAnchor="middle" className="lb">최적 {s.temp.opt}℃</text>
          {[0, 10, 20, 30].map((c) => (
            <text key={c} x={tx(c)} y={116} textAnchor="middle" className="ax">{c}℃</text>
          ))}
        </svg>
        <p className="small muted" style={{ margin: 0 }}>
          옅은 칸({s.temp.min}~{s.temp.max}℃)이 먹이를 먹는 수온이에요. 하루 이틀 새 2℃ 넘게 떨어지면 범위 안이어도 입을 닫아요(냉수대).
        </p>
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="feed-bait">
        <h2 id="feed-bait" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>🪝</span>미끼 궁합</h2>
        <ul className="feed-bait">
          {fits.map((b) => (
            <li key={b.bait}>
              <b>{b.bait}</b>
              <span className={`mini-chip ${b.fit === "잘 맞음" ? "green" : b.fit === "약함" ? "orange" : "blue"}`}>{b.fit}</span>
              <span className="small muted">
                {b.kind ? `${FOOD[b.kind].label} · ${b.how}${b.share ? ` (자연 먹이의 ${b.share}%)` : ""}` : b.how}
              </span>
            </li>
          ))}
        </ul>
        <p className="small" style={{ margin: 0 }}>💡 {style.tip}</p>
      </section>

      {guide && (
        <section className="card stack" style={{ gap: 6 }} aria-labelledby="feed-bite">
          <h2 id="feed-bite" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>〰</span>입질 모습</h2>
          <p className="small" style={{ margin: 0 }}>{guide.howItEats}</p>
          <p className="small" style={{ margin: 0 }}><b>신호</b> {guide.bite.signal}</p>
          <p className="small" style={{ margin: 0 }}><b>챔질</b> {guide.bite.when}</p>
        </section>
      )}

      <section className="card stack" style={{ gap: 6 }} aria-labelledby="feed-season">
        <h2 id="feed-season" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>🗓</span>철마다 먹성</h2>
        <p className="small" style={{ margin: 0 }}>{f.notes}</p>
      </section>

      {sim.length > 0 && (
        <section className="card stack" style={{ gap: 6 }} aria-labelledby="feed-sim">
          <h2 id="feed-sim" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>⇄</span>먹이가 비슷한 어종</h2>
          <p className="small muted" style={{ margin: 0 }}>같은 미끼·같은 자리에서 함께 낚일 수 있어요.</p>
          <ul className="feed-sim">
            {sim.map((x) => (
              <li key={x.id}>
                <Link href={`/fish/${x.id}#feed`} className="chip2 blue">
                  {x.name}
                  <span className="small" style={{ marginLeft: 6 }}>{FOOD[x.shared].icon} {FOOD[x.shared].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="small muted" style={{ margin: 0 }}>먹이 비중은 위 내용물·생태 자료를 바탕으로 한 대략값이에요. 지역·크기·계절에 따라 달라요.</p>
    </div>
  );
}

