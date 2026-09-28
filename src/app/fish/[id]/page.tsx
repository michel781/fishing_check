import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecies } from "@/data/species";
import { SEA_LABEL, SPOT_TYPE_LABEL, SPOTS } from "@/data/spots";
import { isClosedSeason } from "@/lib/engine/score";
import type { SpotType } from "@/lib/types";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = getSpecies((await params).id);
  return s ? { title: `${s.name} 시즌·물때·채비` } : {};
}

const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default async function FishDetail({ params }: { params: Params }) {
  const s = getSpecies((await params).id);
  if (!s) notFound();
  const now = new Date();
  const month = Number(new Date(now.getTime() + 9 * 3600e3).toISOString().slice(5, 7));
  const closed = isClosedSeason(s, now);
  const spots = SPOTS.filter((p) => p.species.includes(s.id))
    .sort((a, b) => (s.spot[b.type] ?? 0) - (s.spot[a.type] ?? 0));
  const typeRank = (Object.entries(s.spot) as [SpotType, number][]).sort((a, b) => b[1] - a[1]);
  return (
    <div className="stack">
      <p className="sub" style={{ margin: 0 }}><Link href="/fish">어종</Link> ›</p>
      <h1>{s.name}{s.aka && <span className="sub"> · {s.aka}</span>}</h1>
      <p className="sub" style={{ margin: 0 }}>{s.tips}</p>

      {s.regulation && (
        <div className={closed ? "alert" : "alert caution"}>
          <strong>{closed ? "⛔ 지금은 금어기입니다" : "법규 확인"}</strong>
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

      <div className="card">
        <h2>월별 시즌</h2>
        <svg className="viz" viewBox="0 0 360 120" role="img" aria-label={`월별 시즌 지수: ${s.season.map((v, i) => `${i + 1}월 ${Math.round(v * 100)}`).join(", ")}`}>
          {[0, 0.5, 1].map((v) => <line key={v} className="grid" x1={0} x2={360} y1={96 - v * 84} y2={96 - v * 84} />)}
          {s.season.map((v, i) => (
            <g key={i}>
              <rect x={i * 30 + 5} y={96 - Math.max(0.03, v) * 84} width={20} height={Math.max(0.03, v) * 84} rx={4}
                fill={i + 1 === month ? "var(--seq-5)" : "var(--seq-3)"} opacity={i + 1 === month ? 1 : 0.75}>
                <title>{`${i + 1}월 ${Math.round(v * 100)}`}</title>
              </rect>
              <text x={i * 30 + 15} y={114} textAnchor="middle" style={i + 1 === month ? { fill: "var(--text-primary)", fontWeight: 700 } : undefined}>{MONTHS[i]}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>습성</h2>
          <div className="kv num">
            <div><div className="k">해역</div><div className="v">{s.seas.map((x) => SEA_LABEL[x]).join("·")}</div></div>
            <div><div className="k">적정 수온</div><div className="v">{s.temp.opt}℃</div></div>
            <div><div className="k">활동 범위</div><div className="v">{s.temp.min}~{s.temp.max}℃</div></div>
            <div><div className="k">선호 물때</div><div className="v">{{ neap: "조금 쪽", mid: "중간", spring: "사리 쪽" }[s.tide.mul]}</div></div>
            <div><div className="k">선호 물흐름</div><div className="v">{s.tide.flood > s.tide.ebb + 0.1 ? "들물" : s.tide.ebb > s.tide.flood + 0.1 ? "썰물" : "상관없음"}</div></div>
            <div><div className="k">시간대</div><div className="v">{s.light.night >= 0.9 ? "야간" : s.light.dawnDusk >= 0.95 ? "해뜰·해질녘" : "주간"}</div></div>
          </div>
          <p className="small" style={{ marginBottom: 0 }}>
            <strong>잘 맞는 포인트</strong> {typeRank.slice(0, 3).map(([t]) => SPOT_TYPE_LABEL[t]).join(" › ")}
          </p>
        </div>
        <div className="card">
          <h2>채비·미끼</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {s.rigs.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="small" style={{ marginBottom: 0 }}><strong>미끼</strong> {s.baits.join(" · ")}</p>
        </div>
      </div>

      <section className="stack">
        <h2>{s.name} 포인트</h2>
        <ul className="list">
          {spots.map((p) => (
            <li key={p.id}>
              <Link href={`/spot/${p.id}?species=${s.id}`} className="card card-link between">
                <span><strong>{p.name}</strong> <span className="sub">{p.area}</span></span>
                <span className="chip">{SEA_LABEL[p.sea]} · {SPOT_TYPE_LABEL[p.type]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
