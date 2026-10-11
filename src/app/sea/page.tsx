import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { TideCalc } from "@/components/TideCalc";
import { TideStages, TideTermList } from "@/components/TideStages";
import { FACTORS, SEA_CHARACTER, SEA_NAME, seaImportance, tidalRangeBySea, tideTimingPct } from "@/data/sea";
import { og } from "@/lib/site";
import type { Sea } from "@/lib/types";

const TITLE = "바다 이해하기";
const DESC = "초들물·만조·정조·사리 같은 물때 용어를 그림으로, 물때·조류·수온·바람·파도와 너울·기압·바닥·빛 — 바다를 읽는 8가지와 서해·남해·동해의 성격을 관측소 조차와 점수 기준으로 정리했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🌊 ${TITLE} · 피싱체크`, DESC, "/sea") };

const SEAS: Sea[] = ["WEST", "SOUTH", "EAST"];
const MAX_M = 9;

export default function SeaPage() {
  const ranges = tidalRangeBySea();
  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🌊 바다 이해하기" />
      <p style={{ margin: 0 }}>
        같은 채비·같은 미끼라도 <b>바다 상태</b>가 맞지 않으면 고기가 먹지 않아요. 바다를 읽는 요소 8가지와, 서해·남해·동해가 왜 다른 낚시를 하는지 정리했어요. 피싱체크의 점수도 이 요소들로 계산해요.
      </p>
      <nav className="chips" aria-label="이 화면 목차">
        <a href="#s-terms" className="chip2">물때 용어</a>
        <a href="#s-calc" className="chip2">초들물 계산</a>
        <a href="#s-factors" className="chip2">바다를 읽는 8가지</a>
        <a href="#s-seas" className="chip2">해역별 성격</a>
        <a href="#s-rhythm" className="chip2">하루·보름·계절</a>
        <a href="#s-danger" className="chip2">위험 신호</a>
      </nav>

      <section id="s-terms" aria-labelledby="s-terms-h" className="card stack" style={{ gap: 10, scrollMarginTop: 80 }}>
        <h2 id="s-terms-h" style={{ fontSize: "1.05rem", margin: 0 }}>1. 물때 용어 한눈에 — 초들물·만조·정조·사리</h2>
        <p className="small" style={{ margin: 0 }}>
          바닷물은 하루 두 번 차고(<b>만조</b>) 빠져요(<b>간조</b>). 차오르는 6시간 남짓이 <b>들물</b>, 빠지는 6시간 남짓이 <b>썰물</b>이고, 이것을 셋으로 나눠 앞에 <b>초·중·끝</b>을 붙여요. 그래서 <b>초들물</b>은 &lsquo;물이 막 들어오기 시작한 때&rsquo;예요(줄여서 &lsquo;초들&rsquo;이라고도 해요).
        </p>
        <TideStages />
        <TideTermList />
        <p className="small muted" style={{ margin: 0 }}>
          초·중·끝 나누기와 &lsquo;만조·간조 앞뒤 40분 = 정조&rsquo;는 피싱체크 물 높이 표가 쓰는 기준이에요. 현장·지역에 따라 부르는 범위가 조금씩 달라요.
        </p>
      </section>

      <section id="s-calc" aria-labelledby="s-calc-h" className="card stack" style={{ gap: 10, scrollMarginTop: 80 }}>
        <h2 id="s-calc-h" style={{ fontSize: "1.05rem", margin: 0 }}>2. 물때표로 초들물·초날물 시간 계산하기</h2>
        <ol className="st-why">
          <li>물때표에서 <b>간조(▼)</b> 시각과 그다음 <b>만조(▲)</b> 시각을 찾아요. 하루에 보통 두 번씩 있지만, 매일 약 50분씩 늦어져서 하루에 세 번만 있는 날도 있어요.</li>
          <li>두 시각의 간격을 재요. 평균은 약 <b>6시간 12분</b>이에요(달 때문에 생기는 조석 주기 12시간 25분의 절반). 날·곳마다 몇십 분씩 달라요.</li>
          <li>간격 ÷ 3 = <b>초들물</b>. 간조 시각부터 그만큼이에요. 어림으로는 &lsquo;간조 + 2시간&rsquo;.</li>
          <li>만조 시각부터 다음 간조까지도 똑같이 ÷ 3 = <b>초날물(초썰물)</b>.</li>
          <li>간조·만조 직후 40분쯤은 아직 물이 거의 안 움직이는 <b>정조</b>예요. 그동안 미끼를 갈고 채비를 넣어 두세요.</li>
        </ol>
        <TideCalc />
        <p className="small muted" style={{ margin: 0 }}>
          초들물·초날물을 &lsquo;황금 시간&rsquo;으로 꼽는 낚시인이 많지만, 어종과 장소에 따라 달라요. 동해처럼 물 높이 차이가 작은 곳은 물때보다 바람·너울·수온이 더 중요해요. 피싱체크는 포인트 물 높이 표와 물때표에 이 시간을 ⏱로 계산해 두고, 고른 어종의 시간별 점수를 함께 보여 줘요.
        </p>
      </section>

      <section id="s-factors" aria-labelledby="s-factors-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="s-factors-h" style={{ fontSize: "1.05rem", margin: 0 }}>3. 바다를 읽는 8가지</h2>
        <ul className="sea-factors">
          {FACTORS.map((f) => (
            <li key={f.id} id={`f-${f.id}`} className="card stack" style={{ gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: "1rem" }}><span aria-hidden>{f.icon}</span> {f.name}</h3>
              <p className="small" style={{ margin: 0 }}>{f.what}</p>
              <p className="small" style={{ margin: 0 }}><b>고기에게</b> {f.fish}</p>
              <p className="small muted" style={{ margin: 0 }}><b>앱에서</b> {f.read}</p>
              {f.safety && <p className="small gear-miss" style={{ margin: 0 }}><b>안전</b> {f.safety}</p>}
              {f.link && <Link href={f.link.href} className="small link">{f.link.label} ›</Link>}
            </li>
          ))}
        </ul>
      </section>

      <section id="s-seas" aria-labelledby="s-seas-h" className="stack" style={{ gap: 10, scrollMarginTop: 80 }}>
        <h2 id="s-seas-h" style={{ fontSize: "1.05rem", margin: 0 }}>4. 서해·남해·동해는 왜 다를까</h2>

        <div className="card stack" style={{ gap: 8 }}>
          <h3 className="st-sub" style={{ margin: 0 }}>사리 때 물 높이 차이(조차)</h3>
          <div className="sea-range" role="img" aria-label={SEAS.map((s) => `${SEA_NAME[s]} ${ranges[s].at(-1)?.m}~${ranges[s][0]?.m}m`).join(", ")}>
            {SEAS.map((s) => {
              const list = ranges[s];
              const lo = list.at(-1)?.m ?? 0;
              const hi = list[0]?.m ?? 0;
              return (
                <div key={s} className="sea-range-row">
                  <span className="sea-range-l">{SEA_NAME[s]}</span>
                  <span className="sea-range-track">
                    <i style={{ left: `${(lo / MAX_M) * 100}%`, width: `${Math.max(1.2, ((hi - lo) / MAX_M) * 100)}%` }} />
                  </span>
                  <b className="num sea-range-v">{lo === hi ? `${hi}m` : `${lo}~${hi}m`}</b>
                </div>
              );
            })}
            <div className="sea-range-row axis" aria-hidden>
              <span className="sea-range-l" />
              <span className="sea-range-track ticks">
                {[0, 3, 6, 9].map((t) => <span key={t} style={{ left: `${(t / MAX_M) * 100}%` }}>{t}m</span>)}
              </span>
              <span className="sea-range-v" />
            </div>
          </div>
          <details className="tide-more">
            <summary>관측소별 값 보기</summary>
            <div className="sea-stations">
              {SEAS.map((s) => (
                <p key={s} className="small" style={{ margin: 0 }}>
                  <b>{SEA_NAME[s]}</b> {ranges[s].map((x) => `${x.name} ${x.m}m`).join(" · ")}
                </p>
              ))}
            </div>
          </details>
          <p className="small muted" style={{ margin: 0 }}>
            이 서비스가 실제 조석 예보를 받지 못할 때 쓰는 추정 모델의 대략값이에요(관측소별 사리 조차). 서해는 하루에 물 높이가 수 미터씩 바뀌고, 동해는 수십 cm에 그쳐요.
          </p>
        </div>

        <ul className="sea-cards">
          {SEAS.map((s) => {
            const ch = SEA_CHARACTER[s];
            const imp = seaImportance(s);
            const top = Math.max(...imp.map((x) => x.pct));
            return (
              <li key={s} className="card stack" style={{ gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{SEA_NAME[s]}</h3>
                <p className="small" style={{ margin: 0 }}>{ch.summary}</p>
                <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                  {ch.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <div>
                  <p className="small" style={{ margin: "0 0 4px" }}><b>피싱체크 점수에서 무엇을 더 보나</b></p>
                  <ul className="sea-imp" aria-label={`${SEA_NAME[s]} 점수 비중: ${imp.map((x) => `${x.label} ${x.pct}%`).join(", ")}`}>
                    {imp.map((x) => (
                      <li key={x.key}>
                        <span>{x.label}</span>
                        <span className="sea-imp-bar" aria-hidden><i style={{ width: `${(x.pct / top) * 100}%` }} className={x.pct === top ? "top" : undefined} /></span>
                        <b className="num">{x.pct}%</b>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="small" style={{ margin: 0 }}>
                  <b>&lsquo;언제 무는가&rsquo; 판단</b>: 물 흐름 <b className="num">{tideTimingPct(s)}%</b> · 해·달(빛) <b className="num">{100 - tideTimingPct(s)}%</b>
                </p>
                <p className="small muted" style={{ margin: 0 }}>물때 세는 법: {ch.mul}</p>
              </li>
            );
          })}
        </ul>
        <p className="small muted" style={{ margin: 0 }}>
          막대는 그날 조건이 얼마나 좋은지를 볼 때의 비중이고, 물때는 여기에 더해 &lsquo;언제 무는가&rsquo;(시간대) 판단에도 따로 들어가요. 그래서 서해는 바람 비중이 커 보여도 시간을 고를 때는 물때가 가장 커요. 모두 점수 엔진의 해역별 기본값이에요(어종에 따라 조금씩 보정).
        </p>
      </section>

      <section id="s-rhythm" aria-labelledby="s-rhythm-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="s-rhythm-h" style={{ fontSize: "1.05rem", margin: 0 }}>5. 바다의 리듬: 하루 · 보름 · 계절</h2>
        <ul className="st-why">
          <li><b>하루</b> — 들물·썰물이 두 번씩, 만조·간조는 매일 약 50분씩 늦어져요. 해 뜰·질 무렵이 겹치는 물돌이가 황금타임이 되기 쉬워요. <Link href="/spots" className="link">포인트 고르기</Link></li>
          <li><b>보름</b> — 사리(물 차이 큼, 물살 셈) → 조금(물 차이 작음) → 다시 사리가 약 15일 주기로 돌아요. 물살 좋아하는 고기는 사리 쪽, 약한 물살을 좋아하는 고기는 조금 쪽. <Link href="/tide" className="link">물때 달력</Link></li>
          <li><b>계절</b> — 수온이 바뀌며 연안에 들어오는 고기가 바뀌어요. 봄 산란기, 가을 먹이 활동기가 대체로 좋은 철이에요. <Link href="/fish" className="link">어종별 제철</Link></li>
        </ul>
      </section>

      <section id="s-danger" aria-labelledby="s-danger-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="s-danger-h" style={{ fontSize: "1.05rem", margin: 0 }}>6. 이런 바다는 쉬세요</h2>
        <ul className="st-why">
          <li><b>너울이 긴 날</b> — 잔잔해 보여도 큰 물결이 몇 분 간격으로 갯바위·방파제를 덮쳐요.</li>
          <li><b>강풍·풍랑 특보</b> — 방파제 끝·갯바위 접근 금지. 배는 뜨지 않아요.</li>
          <li><b>서해 사리 날 갯벌·갯바위</b> — 물이 빠르게 차올라 길이 끊겨요.</li>
          <li><b>짙은 해무</b> — 길과 발밑이 안 보이고, 배 운항이 멈춰요.</li>
          <li><b>수온 급변(냉수대)</b> — 위험하진 않지만 고기가 입을 닫아 헛걸음하기 쉬워요.</li>
        </ul>
        <p className="small muted" style={{ margin: 0 }}>피싱체크는 바람·파고·너울·시정으로 위험한 시간을 &lsquo;위험&rsquo;으로 표시하고 점수를 낮춰요. 그래도 현장 안내·해경 통제를 먼저 따르세요.</p>
      </section>
    </div>
  );
}
