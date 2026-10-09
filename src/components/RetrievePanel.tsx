import { ACT_INFO, SPEED_LABEL, type RetrievePlan } from "@/data/retrieve";
import { STYLE, type Feeding } from "@/data/feeding";
import { activeTps, adjustFor, cycleSec, mid, playSteps, type Conditions } from "@/lib/retrieve";
import type { Species } from "@/lib/types";
import { ReelCoach } from "./ReelCoach";

const fmtSec = (r: [number, number]) => {
  const f = (s: number) => (s >= 60 ? `${Math.round((s / 60) * 10) / 10}분` : `${s}초`);
  return r[0] === r[1] ? f(r[0]) : `${f(r[0])}~${f(r[1])}`;
};
const fmtRange = (r: [number, number], unit: string) => (r[0] === r[1] ? `${r[0]}${unit}` : `${r[0]}~${r[1]}${unit}`);

/** 리듬 막대: 짧은 동작도 보이도록 칸 너비는 시간의 제곱근에 비례 */
function Rhythm({ plan }: { plan: RetrievePlan }) {
  const w = plan.cycle.map((s) => Math.sqrt(Math.max(1, mid(s.sec))));
  const total = w.reduce((a, b) => a + b, 0);
  return (
    <div className="reel-rhythm" role="img" aria-label={`한 주기: ${plan.cycle.map((s) => `${s.act} ${fmtSec(s.sec)}`).join(", ")} → 반복`}>
      <div className="reel-bar">
        {plan.cycle.map((s, i) => (
          <span key={i} className={`seg s${ACT_INFO[s.act].slot}`} style={{ flexGrow: w[i] / total }} />
        ))}
        <span className="reel-repeat" aria-hidden>↻</span>
      </div>
      <div className="reel-labels" aria-hidden>
        {plan.cycle.map((s, i) => (
          <span key={i} style={{ flexGrow: w[i] / total }}>
            <b>{s.act}</b>
            <span className="num">{fmtSec(s.sec)}</span>
          </span>
        ))}
        <span className="reel-repeat-l" />
      </div>
    </div>
  );
}

/** 어종별 릴 감기: 한 주기 리듬, 속도 등급, 단계, 이유(먹이 습성), 입질 뒤, 조건 보정, 따라하기 */
export function RetrievePanel({ s, plan, feeding, cond }: { s: Species; plan: RetrievePlan; feeding?: Feeding; cond?: Conditions }) {
  const cyc = cycleSec(plan);
  const tps = activeTps(plan);
  const adj = cond ? adjustFor(plan, s, cond) : null;
  const steps = playSteps(plan, adj ?? undefined);
  const activeNow = tps ? Math.round(mid(tps) * (adj?.speed ?? 1) * 100) / 100 : null;
  const hooked = plan.hooked.tps ? mid(plan.hooked.tps) : null;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <section className="card stack" style={{ gap: 10 }} aria-labelledby="reel-h">
        <h2 id="reel-h" className="info-h" style={{ marginTop: 0 }}>
          <span className="dot" aria-hidden>↻</span>릴 감는 주기·속도
        </h2>
        <p style={{ margin: 0, fontWeight: 700 }}>{plan.method}</p>
        <div className="reel-speed" aria-label={`속도 등급: ${SPEED_LABEL[plan.speed]}`}>
          {SPEED_LABEL.map((l, i) => (
            <span key={l} className={i === plan.speed ? "on" : i < plan.speed ? "lo" : undefined}>{l}</span>
          ))}
        </div>
        <Rhythm plan={plan} />
        <p className="small muted" style={{ margin: 0 }}>
          한 주기 약 {fmtSec(cyc)} → 반복. 칸 너비는 짧은 동작도 보이게 줄여 그렸어요(시간에 정비례하지 않음).
        </p>
        <ol className="reel-steps">
          {plan.cycle.map((st, i) => (
            <li key={i}>
              <span className={`reel-chip s${ACT_INFO[st.act].slot}`}>{st.act}</span>
              <span className="small">
                <b className="num">{fmtSec(st.sec)}</b>
                {st.tps && <> · 핸들 <b className="num">{fmtRange(st.tps, "바퀴/초")}</b></>}
                {st.turns && <> · 핸들 <b className="num">{fmtRange(st.turns, "바퀴")}</b></>} — {st.note}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card stack" style={{ gap: 6 }} aria-labelledby="reel-why">
        <h3 id="reel-why" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>?</span>왜 이 속도인가</h3>
        <p className="small" style={{ margin: 0 }}>{plan.why}</p>
        {feeding && (
          <p className="small muted" style={{ margin: 0 }}>
            먹는 방식: <b>{STYLE[feeding.style].label}</b> — {STYLE[feeding.style].desc}
          </p>
        )}
      </section>

      <section className="card stack" style={{ gap: 6 }} aria-labelledby="reel-hook">
        <h3 id="reel-hook" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>🎣</span>입질 뒤 감는 법</h3>
        <p className="small" style={{ margin: 0 }}>
          {plan.hooked.text}
          {plan.hooked.tps && <> (핸들 약 <b className="num">{fmtRange(plan.hooked.tps, "바퀴/초")}</b>)</>}
        </p>
        <p className="small" style={{ margin: 0 }}>⚠ 자주 하는 실수: {plan.mistake}</p>
      </section>

      <section className="card stack" style={{ gap: 6 }} aria-labelledby="reel-adj">
        <h3 id="reel-adj" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>⇅</span>{adj ? "지금 조건에 맞춘 조절" : "조건에 따라 바꾸기"}</h3>
        {adj ? (
          adj.reasons.length ? (
            <ul className="reel-adj">
              {adj.reasons.map((r) => (
                <li key={r.text}><span aria-hidden>{r.effect < 0 ? "🐢" : r.effect > 0 ? "✅" : "↔"}</span> <span className="small">{r.text}</span></li>
              ))}
            </ul>
          ) : (
            <p className="small" style={{ margin: 0 }}>지금은 특별히 바꿀 조건이 없어요. 기본 속도로 시작하세요.</p>
          )
        ) : (
          <ul className="reel-adj small">
            <li><span aria-hidden>🐢</span> 물 온도가 적정 범위({s.temp.min}~{s.temp.max}℃)를 벗어나면 물고기가 덜 움직여요 → 감기는 느리게, 멈춤은 길게.</li>
            {plan.lure && <li><span aria-hidden>↔</span> 물살을 거슬러 감을 땐 물속 속도가 빨라지니 핸들을 느리게, 물살을 따라 감을 땐 빠르게.</li>}
            {plan.lure && s.light.night < 0.8 && <li><span aria-hidden>🌙</span> 밤엔 루어를 보기 어려워요 → 조금 느리게.</li>}
            {plan.bottom && <li><span aria-hidden>↔</span> 물살이 세면 채비가 밀려요 → 바닥을 더 자주 확인.</li>}
            {plan.float && <li><span aria-hidden>↔</span> 바람이 세면 줄이 밀려요 → 늘어진 줄을 자주 감아 찌와 일직선으로.</li>}
            <li><span aria-hidden>👀</span> 입질이 없으면 속도를 한 단계 바꿔 보고, 입질이 오던 속도를 기억해 두세요.</li>
          </ul>
        )}
        {adj && (adj.speed !== 1 || adj.pause !== 1) && (
          <p className="small" style={{ margin: 0 }}>
            적용: 감는 속도 ×{adj.speed}, 멈춤·기다림 ×{adj.pause} (아래 따라하기에 반영)
          </p>
        )}
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="reel-coach">
        <h3 id="reel-coach" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>▶</span>내 릴로 계산 · 따라하기</h3>
        <ReelCoach steps={steps.map(({ act, secMid, tpsMid, turns, note }) => ({ act, secMid, tpsMid, turns, note }))} activeTps={activeNow} hookedTps={hooked} />
      </section>
      <p className="small muted" style={{ margin: 0 }}>
        현장에서 흔히 쓰는 기준이에요(연구로 정한 값이 아님). 릴 크기·기어비·수심·물살에 따라 같은 바퀴 수라도 물속 속도가 달라지니, 입질이 오는 속도를 찾아 기억하세요.
      </p>
    </div>
  );
}
