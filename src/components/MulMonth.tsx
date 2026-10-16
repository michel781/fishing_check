import Link from "next/link";
import type { MulddaeSystem } from "@/lib/engine/astro";
import { mulCycle, mulLabels, mulMonth } from "@/lib/tideCalendar";

const WD = ["일", "월", "화", "수", "목", "금", "토"];

/** 삭·망 아이콘 — 이모지는 기기·테마마다 색이 달라져(다크에서 삭이 흰 원으로 보임) 고정 색 그림으로 */
function MoonIcon({ kind }: { kind: "삭" | "망" }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" className="mm-moon-ic" aria-hidden>
      <circle cx="6" cy="6" r="5" fill={kind === "삭" ? "#343a40" : "#fcc419"} stroke={kind === "삭" ? "#adb5bd" : "#e67700"} strokeWidth="1.2" />
    </svg>
  );
}

/**
 * 한 달 물때 달력 (일요일 시작) — 날짜 옆에 그날 물때 이름, 삭·망(보름달) 표시.
 * 칸 색: 사리 정도(물 차이 상대값). href(ym, sys)로 달·물때식 바꾸는 링크를 만든다.
 */
export function MulMonth({ ym, system, today, href }: { ym: string; system: MulddaeSystem; today: string; href: (ym: string, sys: MulddaeSystem) => string }) {
  const m = mulMonth(ym, system);
  const weeks: (typeof m.cells[number] | null)[][] = [];
  const flat = [...Array(m.blanks).fill(null), ...m.cells];
  while (flat.length % 7) flat.push(null);
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));
  const skips = m.cells.filter((c) => c.skipped);
  const title = `${m.year}년 ${m.month}월`;
  return (
    <div className="mm stack" style={{ gap: 8 }}>
      <div className="mm-head">
        <Link href={href(m.prev, system)} className="mm-nav" aria-label={`이전 달 ${m.prev.replace("-", "년 ")}월`} scroll={false}>‹</Link>
        <h3 className="mm-title">{title}</h3>
        <Link href={href(m.next, system)} className="mm-nav" aria-label={`다음 달 ${m.next.replace("-", "년 ")}월`} scroll={false}>›</Link>
      </div>
      <div className="mm-sys" role="group" aria-label="물때 세는 방식">
        {([7, 8] as const).map((s) => (
          <Link key={s} href={href(ym, s)} className="chip2" aria-current={s === system ? "true" : undefined} scroll={false}>
            {s === 7 ? "서해 7물때식" : "남·동해 8물때식"}
          </Link>
        ))}
      </div>
      <table className="mm-cal">
        <caption className="vh">{title} 물때 달력 ({system}물때식)</caption>
        <thead>
          <tr>
            {WD.map((w, i) => (
              <th key={w} scope="col" className={i === 0 ? "sun" : i === 6 ? "sat" : undefined}>{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w, wi) => (
            <tr key={wi}>
              {w.map((c, i) =>
                c ? (
                  <td
                    key={c.date}
                    className={`k-${c.kind}${c.date === today ? " today" : ""}`}
                    style={{ ["--s" as string]: c.springness }}
                  >
                    <span className={`mm-d num${c.weekday === 0 ? " sun" : c.weekday === 6 ? " sat" : ""}`}>{c.day}</span>
                    {c.moon && <span className="mm-moon"><MoonIcon kind={c.moon} /></span>}
                    <span className="mm-l">{c.label}</span>
                    <span className="vh">
                      음력 {c.lunarDay}일{c.moon ? `, ${c.moon === "삭" ? "삭" : "보름달(망)"}` : ""}
                      {c.kind !== "중간" ? `, ${c.kind}` : ""}
                      {c.date === today ? ", 오늘" : ""}
                    </span>
                  </td>
                ) : (
                  <td key={`e${wi}-${i}`} className="empty" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hb-legend small muted">
        <span><i className="mm-k sari" aria-hidden />사리 무렵(물 차이 큼)</span>
        <span><i className="mm-k jogeum" aria-hidden />조금 무렵(물 차이 작음)</span>
        <span><MoonIcon kind="삭" /> 삭(달이 안 보이는 날)</span>
        <span><MoonIcon kind="망" /> 망(보름달)</span>
      </p>
      {skips.map((c) => (
        <p key={c.date} className="small" style={{ margin: 0 }}>
          ⏭ {m.month}월 {c.day}일: 앞 음력 달이 29일까지라 &lsquo;{c.skipped}&rsquo;을 건너뛰고 바로 {c.label}이 돼요.
        </p>
      ))}
    </div>
  );
}

/** 물때 개념: 15일 한 바퀴, 숫자와 물 세기, 두 방식, 29일 달 */
export function MulConcept({ system }: { system: MulddaeSystem }) {
  const cycle = mulCycle(system);
  const sorted = [...cycle].sort((a, b) => b.s - a.s);
  const top = sorted.slice(0, 2).map((x) => x.label).sort((a, b) => cycle.findIndex((x) => x.label === a) - cycle.findIndex((x) => x.label === b));
  const order = (l: string) => cycle.findIndex((x) => x.label === l);
  const low = sorted.slice(-2).map((x) => x.label).sort((a, b) => order(a) - order(b));
  const l7 = mulLabels(7);
  const l8 = mulLabels(8);
  const ROWS: { ld: string; i7: number; i8: number; note: string }[] = [
    { ld: "1일 · 16일", i7: 6, i8: 7, note: "삭(초하루)·보름 무렵 — 사리" },
    { ld: "7일 · 22일", i7: 12, i8: 13, note: "반달 하루 전" },
    { ld: "8일 · 23일", i7: 13, i8: 14, note: "반달 무렵 — 두 방식 모두 조금" },
    { ld: "9일 · 24일", i7: 14, i8: 0, note: "서해는 무시, 남·동해는 1물" },
    { ld: "10일 · 25일", i7: 0, i8: 1, note: "" },
  ];
  return (
    <div className="stack" style={{ gap: 10 }}>
      <ol className="st-why">
        <li><b>물때는 달력이에요.</b> 달이 바닷물을 끌어당겨 생기는 물 높이 차이(조차)는 달 모양에 따라 커졌다 작아져요. 그믐·보름 무렵 크고(사리), 반달 무렵 작아요(조금). 이 변화가 약 15일마다 되풀이돼서, 음력 날짜에 이름을 붙여 부르는 게 1물, 2물 … 조금이에요.</li>
        <li><b>숫자는 &lsquo;물 세기&rsquo;가 아니라 &lsquo;며칠째&rsquo;예요.</b> 조금 뒤 물이 다시 커지기 시작한 날을 1물로 세요. 숫자가 커질수록 물이 세지다가 그믐·보름(7·8물) 무렵을 지나면 숫자는 계속 커져도 물은 약해져서 조금으로 이어져요.</li>
        <li><b>이 앱 계산으로는</b> 물 차이가 가장 큰 날이 {top.join("·")}, 가장 작은 날이 {low.join("·")} 무렵이에요. 실제 바다는 그믐·보름보다 하루이틀 늦게 반응하기 때문이에요(아래 막대).</li>
        <li><b>29일까지인 음력 달</b>은 30일 몫의 이름 하나를 건너뛰어요. 그래서 달력에서 가끔 6물 다음이 8물처럼 숫자가 하나 빠져요.</li>
      </ol>

      <div>
        <h3 className="rig-h">물때 한 바퀴(15일)와 물 차이 — {system}물때식</h3>
        <ol className="mm-cycle" aria-label={`물때별 물 차이(상대값): ${cycle.map((x) => `${x.label} ${Math.round(x.s * 100)}`).join(", ")}`}>
          {cycle.map((x) => (
            <li key={x.label}>
              <span className="mm-cl">{x.label}</span>
              <span className="mm-cb" aria-hidden><i style={{ width: `${Math.max(3, x.s * 100)}%` }} className={x.s >= 0.8 ? "sari" : x.s <= 0.2 ? "jogeum" : undefined} /></span>
              <span className="small muted mm-ct">{x.s >= 0.8 ? "물 셈" : x.s <= 0.2 ? "물 약함" : ""}</span>
            </li>
          ))}
        </ol>
        <p className="small muted" style={{ margin: "4px 0 0" }}>2026~2027년 날마다 계산한 평균 상대값(가장 큼 = 100). 실제 물 높이 차이는 해역마다 크게 달라요(서해 수 m, 동해 수십 cm).</p>
      </div>

      <div>
        <h3 className="rig-h">서해 7물때식 vs 남·동해 8물때식</h3>
        <div className="st-table-wrap" role="region" aria-label="물때 세는 방식 비교 (옆으로 밀어서 보기)" tabIndex={0}>
          <table className="st-table">
            <thead>
              <tr><th scope="col">음력</th><th scope="col">서해(7물때식)</th><th scope="col">남·동해(8물때식)</th><th scope="col">달 모양</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.ld}>
                  <th scope="row">{r.ld}</th>
                  <td>{l7[r.i7]}</td>
                  <td>{l8[r.i8]}</td>
                  <td>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small" style={{ margin: "6px 0 0" }}>
          같은 날이라도 남·동해식은 번호가 하나 커요. 조금은 두 방식 모두 음력 8·23일로 같고, 서해식은 조금 다음 날을 &lsquo;무시&rsquo;, 남·동해식은 &lsquo;1물&rsquo;로 불러요(남·동해식엔 무시가 없고 조금 전날이 14물). 물이 다른 게 아니라 이름만 달라요.
        </p>
      </div>
    </div>
  );
}
