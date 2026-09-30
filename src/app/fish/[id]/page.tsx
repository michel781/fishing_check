import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/AppHead";
import { FishArt } from "@/components/art/FishArt";
import { SceneArt } from "@/components/art/SceneArt";
import { IcPin } from "@/components/icons";
import { RigDiagram } from "@/components/RigDiagram";
import { SpeciesGuide } from "@/components/SpeciesGuide";
import { ShareButton } from "@/components/SpotClient";
import { Tabs } from "@/components/Tabs";
import { activeTime, metaOf, seasonLabel } from "@/data/fishMeta";
import { getGuide } from "@/data/guides";
import { getRigSpec } from "@/data/rigSpecs";
import { getSpecies } from "@/data/species";
import { SEA_LABEL, SPOT_TYPE_LABEL, SPOTS } from "@/data/spots";
import { isClosedSeason } from "@/lib/engine/score";
import { isBeginner, regionOf } from "@/lib/regions";
import { og } from "@/lib/site";
import type { SpotType } from "@/lib/types";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = getSpecies((await params).id);
  if (!s) return {};
  const title = `${s.name} 낚는 법·채비·시즌`;
  const description = `${s.name} 입질 모습, 채비 그림, 따라 하는 순서, 영상, 제철과 금어기.`;
  return { title, description, ...og(`${title} · 피싱체크`, description, `/fish/${s.id}`) };
}

export default async function FishDetail({ params }: { params: Params }) {
  const s = getSpecies((await params).id);
  if (!s) notFound();
  const now = new Date();
  const month = Number(new Date(now.getTime() + 9 * 3600e3).toISOString().slice(5, 7));
  const closed = isClosedSeason(s, now);
  const meta = metaOf(s.id);
  const guide = getGuide(s.id);
  const rig = getRigSpec(s.id);
  const spots = SPOTS.filter((p) => p.species.includes(s.id)).sort((a, b) => (s.spot[b.type] ?? 0) - (s.spot[a.type] ?? 0));
  const typeRank = (Object.entries(s.spot) as [SpotType, number][]).sort((a, b) => b[1] - a[1]);
  const peak = Math.max(...s.season);

  const info = (
    <>
      {s.regulation && (
        <div className={closed ? "alert" : "alert caution"}>
          <strong>{closed ? "⛔ 지금은 잡으면 안 되는 기간(금어기)이에요" : "꼭 지켜야 할 규칙"}</strong>
          <p style={{ margin: "4px 0 0" }} className="small">
            {s.regulation.closed?.map((c) => `금어기 ${c.from.replace("-", "/")}~${c.to.replace("-", "/")}${c.region ? `(${c.region})` : ""}`).join(", ")}
            {s.regulation.closed && " · "}
            {s.regulation.minLengthCm && `금지체장 ${s.regulation.minLengthCm}cm 미만 · `}
            {s.regulation.note}{" "}
            <a href={s.regulation.sourceUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>해양수산부 공고</a>
            {!s.regulation.verified && " (원문 재확인 필요)"}
          </p>
        </div>
      )}

      <section aria-labelledby="season-h">
        <h2 id="season-h" className="info-h"><span className="dot" aria-hidden>✓</span>제철 시기</h2>
        <div className="month-grid" role="img" aria-label={`제철: ${s.season.map((v, i) => (v >= 0.5 ? `${i + 1}월` : "")).filter(Boolean).join(", ")}`}>
          {s.season.map((v, i) => (
            <span key={i} className={v >= Math.max(0.85, peak - 0.05) ? "peak" : v >= 0.5 ? "on" : undefined} style={i + 1 === month ? { textDecoration: "underline", textUnderlineOffset: 3 } : undefined}>
              {i + 1}월
            </span>
          ))}
        </div>
        <p className="small muted" style={{ margin: "8px 0 0" }}>진한 파랑: 가장 잘 잡히는 달 · 파란 테두리: 잡히는 달 · 밑줄: 이번 달</p>
      </section>

      <div className="grid-2" style={{ gap: 12 }}>
        <section className="card" aria-labelledby="act-h">
          <h2 id="act-h" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>◷</span>활동 시간</h2>
          <p style={{ margin: 0, fontWeight: 700 }}>{activeTime(s)}</p>
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            {s.tide.flood > s.tide.ebb + 0.1 ? "물이 들어올 때(들물)" : s.tide.ebb > s.tide.flood + 0.1 ? "물이 빠질 때(썰물)" : "들물·썰물 모두"} · {{ neap: "물살 약한 날", mid: "중간 물때", spring: "물살 센 날" }[s.tide.mul]}
          </p>
        </section>
        <section className="card" aria-labelledby="temp-h">
          <h2 id="temp-h" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>℃</span>적정 수온</h2>
          <p style={{ margin: 0, fontWeight: 700 }} className="num">{s.temp.min}~{s.temp.max}℃ <span className="small muted">(최적 {s.temp.opt}℃)</span></p>
          <p className="small muted" style={{ margin: "4px 0 0" }}>크기 {meta.size} · {s.seas.map((x) => SEA_LABEL[x]).join("·")}</p>
        </section>
      </div>

      <section className="card" aria-labelledby="where-h">
        <h2 id="where-h" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>⚓</span>잘 맞는 장소</h2>
        <div className="tags">{typeRank.slice(0, 3).map(([t]) => <span key={t} className="mini-chip blue">{SPOT_TYPE_LABEL[t]}</span>)}</div>
        <p className="small muted" style={{ margin: "8px 0 0" }}>{guide?.where ?? s.tips}</p>
      </section>

      {guide && (
        <section className="card" aria-labelledby="rig-h">
          <h2 id="rig-h" className="info-h" style={{ marginTop: 0 }}><span className="dot" aria-hidden>🧵</span>채비 예시 · {guide.rig.name}</h2>
          <RigDiagram kind={guide.rig.kind} title={guide.rig.name} dims={rig?.dims} variant={rig?.variant} />
          <p className="small sub" style={{ margin: "6px 0 0" }}>위에서 아래로: {guide.rig.parts.join(" → ")}</p>
          <p className="small" style={{ margin: "6px 0 0" }}><strong>미끼</strong> {s.baits.join(" · ")}</p>
          <a className="btn small" href="#how" style={{ marginTop: 10 }}>📏 실제 치수 · 🎬 움직임 영상 · 🛒 가격 보기</a>
        </section>
      )}
    </>
  );

  const how = guide ? (
    <section aria-labelledby="guide-title" className="stack">
      <h2 id="guide-title" style={{ fontSize: "1.1rem" }}>🎣 {s.name} 이렇게 낚아요</h2>
      <SpeciesGuide speciesId={s.id} name={s.name} guide={guide} />
    </section>
  ) : (
    <p className="sub">{s.tips}</p>
  );

  const where = (
    <section aria-labelledby="spots-h" className="stack" style={{ gap: 10 }}>
      <h2 id="spots-h" style={{ fontSize: "1.1rem" }}>{s.name} 잡으러 갈 곳</h2>
      <ul className="list" style={{ gap: 12 }}>
        {spots.map((p) => (
          <li key={p.id}>
            <Link href={`/spot/${p.id}?species=${s.id}`} className="spot-row">
              <span className="thumb"><SceneArt id={p.id} type={p.type} /></span>
              <span style={{ minWidth: 0 }}>
                <span className="top"><span className="nm">{p.name}</span></span>
                <span className="tags">
                  <span className="mini-chip blue">{SPOT_TYPE_LABEL[p.type]}</span>
                  <span className="mini-chip"><IcPin size={13} />{regionOf(p.area)} {p.area}</span>
                  {isBeginner({ type: p.type, toilet: !!p.toilet, parking: !!p.parking, tetrapod: !!p.tetrapod }) && <span className="mini-chip green">초보추천</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="stack" style={{ gap: 16 }}>
      <section className="fish-hero" aria-label={`${s.name} 소개`}>
        <div className="bar">
          <BackButton fallback="/fish" />
          <ShareButton title={`${s.name} 낚는 법 · 피싱체크`} text={`${s.name} 낚는 법·채비·제철`} />
        </div>
        <FishArt id={s.id} className="art" title={`${s.name} 그림`} />
        <h1>{s.name}{s.aka && <span style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.85 }}> · {s.aka}</span>}</h1>
        <div className="row" style={{ gap: 8, margin: "10px 0" }}>
          <span className="tag-dark">시즌 {seasonLabel(s)}</span>
          {meta.popular <= 4 && <span className="tag-dark">인기 어종</span>}
          {closed ? <span className="tag-dark">⛔ 금어기</span> : meta.level === "초보" ? <span className="tag-green">초보추천</span> : <span className="tag-dark">{meta.level}</span>}
        </div>
        <p style={{ margin: 0, opacity: 0.95, lineHeight: 1.6 }}>{guide?.intro ?? s.tips}</p>
      </section>

      <Tabs
        label={`${s.name} 정보`}
        tabs={[
          { id: "info", label: "기본 정보", content: info },
          { id: "how", label: "낚시 방법", content: how },
          { id: "spots", label: "추천 포인트", content: where },
        ]}
      />
    </div>
  );
}
