import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { RigAnatomy, RodAnatomy } from "@/components/GearAnatomy";
import { GearGlossary } from "@/components/GearGlossary";
import { RigDiagram } from "@/components/RigDiagram";
import { CATS, FLOW, GENRES, TERMS, termById } from "@/data/gearTerms";
import { getSpecies } from "@/data/species";
import { og } from "@/lib/site";

const TITLE = "바다낚시 장비·용어";
const DESC = "낚싯대·릴·낚싯줄·채비 소품·미끼·안전 장비가 각각 무슨 일을 하는지, 장비 안에서 쓰는 용어(드랙·베일·찌멈춤·목줄·호수…)까지 초보 눈높이로 정리했어요.";
export const metadata: Metadata = { title: TITLE, description: DESC, ...og(`🎒 ${TITLE} · 피싱체크`, DESC, "/gear") };

const CHECK: { name: string; need: "필수" | "장르별" | "있으면 좋음"; why: string; id?: string }[] = [
  { name: "구명조끼", need: "필수", why: "물에 빠지면 몸을 띄워 줘요. 배낚시는 착용 의무.", id: "lifejacket" },
  { name: "미끄럼 방지 신발 · 헤드랜턴", need: "필수", why: "미끄러짐·어두운 발밑 사고를 막아요.", id: "shoes" },
  { name: "낚싯대 + 릴(원줄 감긴 것)", need: "필수", why: "장르에 맞게 한 세트. 처음엔 스피닝 릴이 쉬워요.", id: "rod" },
  { name: "채비(바늘·봉돌·도래·목줄 또는 완성 채비)", need: "필수", why: "어종 화면의 채비 그림대로. 완성 채비 세트가 편해요.", id: "rig" },
  { name: "미끼", need: "필수", why: "어종이 평소 먹는 먹이와 비슷한 것.", id: "bait-live" },
  { name: "집게 · 가위", need: "필수", why: "바늘 빼기, 줄 자르기. 이빨·가시에 다치지 않게.", id: "pliers" },
  { name: "찌·밑밥통·주걱", need: "장르별", why: "찌낚시·카드채비에서 필요해요.", id: "float" },
  { name: "받침대 · 방울", need: "장르별", why: "원투에서 대를 세워 두고 입질을 들어요.", id: "stand" },
  { name: "뜰채", need: "있으면 좋음", why: "큰 고기를 줄로 들다 끊어지는 걸 막아요.", id: "net" },
  { name: "두레박 · 쿨러", need: "있으면 좋음", why: "손 씻기, 고기 살려 두기·보관.", id: "bucket" },
];

export default function GearPage() {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <AppHead title="🎒 바다낚시 장비·용어" />
      <p style={{ margin: 0 }}>
        바다낚시 장비는 <b>던지고 → 가라앉히고 → 유혹하고 → 입질을 알리고 → 걸고 → 끌어올리는</b> 일을 나눠 맡아요. 각 장비가 왜 필요한지 알면, 처음 보는 용어도 &lsquo;어느 단계의 무엇&rsquo;인지 금방 보여요.
      </p>
      <nav className="chips" aria-label="이 화면 목차">
        <a href="#g-flow" className="chip2">6단계 역할</a>
        <a href="#g-parts" className="chip2">부분 이름 그림</a>
        <a href="#g-genre" className="chip2">장르별 장비</a>
        <a href="#g-dict" className="chip2">용어 사전</a>
        <a href="#g-check" className="chip2">첫 장비 체크</a>
      </nav>

      <section id="g-flow" aria-labelledby="g-flow-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="g-flow-h" style={{ fontSize: "1.05rem", margin: 0 }}>1. 물고기를 잡는 6단계와 맡는 장비</h2>
        <ol className="gear-flow">
          {FLOW.map((f, i) => (
            <li key={f.step}>
              <span className="gear-flow-n" aria-hidden>{f.icon}</span>
              <div>
                <b>{i + 1}. {f.step}</b> <span className="small muted">— {f.what}</span>
                <div className="tags" style={{ marginTop: 4 }}>
                  {f.terms.map((id) => (
                    <a key={id} href={`#t-${id}`} className="mini-chip blue">{termById(id)?.name ?? id}</a>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="g-parts" aria-labelledby="g-parts-h" className="card stack" style={{ gap: 10, scrollMarginTop: 80 }}>
        <h2 id="g-parts-h" style={{ fontSize: "1.05rem", margin: 0 }}>2. 부분 이름 — 한 그림으로</h2>
        <h3 className="st-sub">낚싯대와 릴</h3>
        <RodAnatomy />
        <h3 className="st-sub">채비 연결 순서 (찌낚시 예)</h3>
        <RigAnatomy />
        <p className="small muted" style={{ margin: 0 }}>그림은 이해를 돕기 위해 비율을 바꿨어요. 번호를 누르면 아래 용어 설명으로 가요.</p>
      </section>

      <section id="g-genre" aria-labelledby="g-genre-h" className="stack" style={{ gap: 10, scrollMarginTop: 80 }}>
        <h2 id="g-genre-h" style={{ fontSize: "1.05rem", margin: 0 }}>3. 장르별 장비 조합</h2>
        <p className="small muted" style={{ margin: 0 }}>노리는 고기가 어디서 어떻게 먹는지에 따라 장르가 정해지고, 장르가 장비를 정해요.</p>
        <ul className="gear-genres">
          {GENRES.map((g) => (
            <li key={g.id} className="card stack" style={{ gap: 8 }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>{g.name}</h3>
              <p className="small" style={{ margin: 0 }}>{g.note}</p>
              <div className="gear-genre-body">
                <div className="gear-genre-rig">
                  <RigDiagram kind={g.rig} title={g.rigTitle} variant={g.id === "boat" ? "boat" : g.id === "surf" ? "cast" : undefined} />
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <ul className="small gear-gear">
                    {g.gear.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                  <div className="tags" aria-label="이 장르의 핵심 용어">
                    {g.terms.map((id) => <a key={id} href={`#t-${id}`} className="mini-chip blue">{termById(id)?.name}</a>)}
                  </div>
                  <p className="small" style={{ margin: 0 }}>
                    <b>대표 어종</b>{" "}
                    {g.species.map((sp, i) => (
                      <span key={sp}>
                        {i > 0 && ", "}
                        <Link href={`/fish/${sp}#how`} className="link">{getSpecies(sp)?.name ?? sp}</Link>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="g-dict" aria-labelledby="g-dict-h" className="stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="g-dict-h" style={{ fontSize: "1.05rem", margin: 0 }}>4. 장비·용어 사전</h2>
        <GearGlossary terms={TERMS} cats={CATS} />
      </section>

      <section id="g-check" aria-labelledby="g-check-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="g-check-h" style={{ fontSize: "1.05rem", margin: 0 }}>5. 처음 갈 때 챙길 것</h2>
        <ul className="gear-check">
          {CHECK.map((c) => (
            <li key={c.name}>
              <span className={`mini-chip ${c.need === "필수" ? "red" : c.need === "장르별" ? "blue" : ""}`}>{c.need}</span>
              <span className="small">
                {c.id ? <a href={`#t-${c.id}`} className="link"><b>{c.name}</b></a> : <b>{c.name}</b>} — {c.why}
              </span>
            </li>
          ))}
        </ul>
        <p className="small" style={{ margin: 0 }}>
          다음 단계: <Link href="/fish" className="link">어종 고르기</Link> → 어종 화면의 채비 그림·처음 사는 장비·릴 감기 →{" "}
          <Link href="/spots" className="link">낚시터 고르기</Link> → <Link href="/structures" className="link">구조물별로 노릴 곳</Link>
        </p>
      </section>

      <p className="small muted" style={{ margin: 0 }}>
        참고: <a href="https://blog6804.tistory.com/entry/%EB%82%9A%EC%8B%9C-%EC%9E%85%EB%AC%B8%EC%9E%90%EB%A5%BC-%EC%9C%84%ED%95%9C-%EB%82%9A%EC%8B%9C-%EC%9A%A9%EC%96%B4-%EC%9E%A5%EB%B9%84%ED%8E%B8" target="_blank" rel="noreferrer" className="link">낚시 입문자를 위한 낚시 용어(장비편)</a>를 바탕으로 정리·보완했어요. 제품마다 표기와 값이 달라서 숫자는 &lsquo;커질수록 어떻다&rsquo;는 방향 위주로 적었어요.
      </p>
    </div>
  );
}
