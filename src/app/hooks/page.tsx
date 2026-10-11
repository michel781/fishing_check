import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { HookAnatomy, HookShapes } from "@/components/HookAnatomy";
import { HOOKS, hookSpec, lineSpec, SIZE_RULES, type HookKind, type Mouth } from "@/data/hooks";
import { rigForSpecies } from "@/data/rigs";
import { SPECIES } from "@/data/species";
import { og } from "@/lib/site";

const TITLE = "바늘 고르기";
const DESC = "바늘 각 부분 이름, 호수 읽는 법(계열마다 기준이 달라요), 크기를 정하는 6가지 이유, 어종별 바늘과 줄·낚시 방법의 균형을 정리했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🪝 ${TITLE} · 피싱체크`, DESC, "/hooks") };

const MOUTHS: Mouth[] = ["작음", "보통", "큼"];
const KINDS: HookKind[] = ["생미끼 바늘", "루어 바늘", "갈고리(에기·뿔)"];

export default function HooksPage() {
  const rows = SPECIES.filter((s) => HOOKS[s.id]);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🪝 바늘 고르기" />
      <p style={{ margin: 0 }}>
        바늘은 <b>어종의 입</b>, <b>미끼</b>, <b>낚시 방법(낚싯대·줄)</b>에 맞춰 골라요. 같은 고기라도 찌낚시와 원투에서 바늘이 달라지고, 바늘이 줄·낚싯대와 균형이 맞아야 걸린 고기를 놓치지 않아요.
      </p>
      <nav className="chips" aria-label="이 화면 목차">
        <a href="#h-parts" className="chip2">부분 이름</a>
        <a href="#h-size" className="chip2">호수 읽는 법</a>
        <a href="#h-rules" className="chip2">크기를 정하는 이유</a>
        <a href="#h-mouth" className="chip2">입 크기별</a>
        <a href="#h-table" className="chip2">어종별 바늘·줄</a>
      </nav>

      <section id="h-parts" aria-labelledby="h-parts-h" className="card stack" style={{ gap: 10, scrollMarginTop: 80 }}>
        <h2 id="h-parts-h" style={{ fontSize: "1.05rem", margin: 0 }}>1. 바늘 각 부분 이름</h2>
        <HookAnatomy />
        <h3 className="st-sub">모양에 따라 쓰임이 달라요</h3>
        <HookShapes />
      </section>

      <section id="h-size" aria-labelledby="h-size-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-size-h" style={{ fontSize: "1.05rem", margin: 0 }}>2. 호수 읽는 법</h2>
        <ul className="st-why">
          <li><b>같은 계열 안에서만 비교해요.</b> &lsquo;감성돔 바늘 2호&rsquo;와 &lsquo;우럭 바늘 17호&rsquo;는 기준이 달라서 숫자로 크기를 비교할 수 없어요. 포장에 적힌 바늘 이름(계열)을 먼저 보세요.</li>
          <li><b>우리나라·일본식 바늘</b>은 같은 계열에서 호수가 클수록 커요.</li>
          <li><b>서양식 바늘</b>은 반대예요. #10보다 #2가 크고, #1 다음은 1/0, 2/0, 3/0… 으로 클수록 커져요(광어 다운샷 3/0, 갈치 1/0~2/0).</li>
          <li><b>지그헤드</b>는 바늘과 봉돌이 붙어 있어 무게(g)로, <b>에기</b>는 몸통 크기(호)로 골라요.</li>
          <li>같은 호수라도 회사마다 조금 달라요. 처음엔 어종 이름이 적힌 전용 바늘·완성 채비가 가장 안전해요.</li>
        </ul>
      </section>

      <section id="h-rules" aria-labelledby="h-rules-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-rules-h" style={{ fontSize: "1.05rem", margin: 0 }}>3. 바늘 크기를 정하는 6가지 이유</h2>
        <ol className="hk-rules">
          {SIZE_RULES.map((r, i) => (
            <li key={r.title} className="card">
              <b>{i + 1}. {r.title}</b>
              <p className="small" style={{ margin: "4px 0 0" }}>{r.desc}</p>
              <p className="small gear-tip" style={{ margin: "6px 0 0" }}>{r.example}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="h-mouth" aria-labelledby="h-mouth-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-mouth-h" style={{ fontSize: "1.05rem", margin: 0 }}>4. 입 크기로 보는 바늘 크기 방향</h2>
        <p className="small muted" style={{ margin: 0 }}>왼쪽일수록 작은 바늘, 오른쪽일수록 큰 바늘 쪽이에요. 에기·뿔(갈고리)은 크기 대신 에기 호수로 골라요.</p>
        <div className="hk-mouth">
          {MOUTHS.map((m) => (
            <div key={m}>
              <h3>입 {m}</h3>
              {KINDS.map((k) => {
                const list = rows.filter((s) => HOOKS[s.id].mouth === m && HOOKS[s.id].kind === k);
                if (!list.length) return null;
                return (
                  <p key={k} className="small" style={{ margin: "4px 0 0" }}>
                    <span className="muted">{k}: </span>
                    {list.map((s, i) => (
                      <span key={s.id}>
                        {i > 0 && ", "}
                        <a href={`#hk-${s.id}`} className="link">{s.name}</a>
                      </span>
                    ))}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section id="h-table" aria-labelledby="h-table-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="h-table-h" style={{ fontSize: "1.05rem", margin: 0 }}>5. 어종별 바늘과 줄·낚시 방법</h2>
        <p className="small muted" style={{ margin: 0 }}>규격은 각 어종 화면의 &lsquo;실제 치수&rsquo;와 같은 값이에요. 바늘과 줄 굵기를 한 세트로 보세요.</p>
        <ul className="hk-list">
          {rows.map((s) => {
            const h = HOOKS[s.id];
            const rig = rigForSpecies(s.id);
            return (
              <li key={s.id} id={`hk-${s.id}`} className="card stack" style={{ gap: 6 }}>
                <div className="between">
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>{s.name}</h3>
                  <span className="tags">
                    <span className="mini-chip">입 {h.mouth}</span>
                    <span className="mini-chip blue">{h.kind}</span>
                  </span>
                </div>
                <dl className="st-dl">
                  <dt>바늘</dt>
                  <dd>{hookSpec(s.id).map((p) => `${p.name}: ${p.spec}`).join(" · ") || "-"}</dd>
                  <dt>줄</dt>
                  <dd>{lineSpec(s.id).map((p) => `${p.name} ${p.spec}`).join(" · ") || "-"}</dd>
                  <dt>방법</dt>
                  <dd>
                    {rig ? <Link href={`/rigs#rig-${rig.id}`} className="link">{rig.name}</Link> : null} — {h.method}
                  </dd>
                  <dt>왜</dt>
                  <dd>{h.why}</dd>
                </dl>
                <Link href={`/fish/${s.id}#how`} className="small link">{s.name} 채비 실제 치수·장비 가격 ›</Link>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="small muted" style={{ margin: 0 }}>
        바늘 규격은 입문용 기준이에요. 지역·시즌·고기 크기에 따라 낚시점이나 선장님이 권하는 크기를 따르세요. 용어는 <Link href="/gear#t-hook" className="link">장비·용어</Link>, 채비 구성은 <Link href="/rigs" className="link">채비 도감</Link>에 있어요.
      </p>
    </div>
  );
}
