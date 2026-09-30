import type { Guide } from "@/data/guides";
import { youtubeSearch } from "@/data/guides";
import { getRigSpec, type RigSpec } from "@/data/rigSpecs";
import { CastingVideo } from "./cast/CastingVideo";
import { GearPrices } from "./GearPrices";
import { RigDiagram } from "./RigDiagram";
import { VideoEmbed } from "./VideoEmbed";

/** 채비 실제 치수표: 부품별 규격 + 물속 높이 */
export function RigSpecTable({ spec }: { spec: RigSpec }) {
  return (
    <>
      <p className="depth-note"><span aria-hidden>📏</span><span>{spec.depth}<span className="small muted" style={{ display: "block", fontWeight: 500 }}>던지는 곳: {spec.reach}</span></span></p>
      <table className="spec-table">
        <caption className="skip">채비 부품별 규격</caption>
        <tbody>
          {spec.parts.map((p) => (
            <tr key={p.name}>
              <th scope="row">{p.name}</th>
              <td>{p.spec}{p.note && <small>{p.note}</small>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small muted" style={{ margin: 0 }}>흔히 쓰는 기준이에요. 물살·수심·배 안내에 따라 바꿔 쓰세요. 그림은 이해를 돕기 위해 길이 비율을 줄였어요.</p>
    </>
  );
}

/** 어종별 "이렇게 낚아요" 가이드 (쉬운 말) */
export function SpeciesGuide({ speciesId, name, guide, compact }: { speciesId: string; name: string; guide: Guide; compact?: boolean }) {
  const spec = getRigSpec(speciesId);
  return (
    <div className="stack guide">
      <p style={{ margin: 0 }}>{guide.intro}</p>

      <div className="grid-2">
        <div className="card soft">
          <h3>🐟 어떻게 미끼를 먹나요?</h3>
          <p className="sub">{guide.howItEats}</p>
          <h3>🎣 언제 낚아채요?</h3>
          <p className="sub" style={{ marginBottom: 4 }}><strong>신호:</strong> {guide.bite.signal}</p>
          <p className="sub" style={{ margin: 0 }}><strong>이때 채요:</strong> {guide.bite.when}</p>
        </div>
        <div className="card soft">
          <h3>🧵 채비: {guide.rig.name}</h3>
          <RigDiagram kind={guide.rig.kind} title={guide.rig.name} dims={spec?.dims} variant={spec?.variant} />
          <p className="small sub" style={{ margin: "6px 0 0" }}>위에서 아래로: {guide.rig.parts.join(" → ")}</p>
        </div>
      </div>

      {spec && (
        <div className="card soft stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>📏 채비 실제 길이·높이</h3>
          <RigSpecTable spec={spec} />
        </div>
      )}

      {spec && (
        <div className="card soft stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>🎬 {spec.motion.startsWith("boat") ? "채비를 내리면" : "던지면"} 줄과 채비는 이렇게 움직여요</h3>
          <CastingVideo speciesId={speciesId} name={name} motion={spec.motion} dims={spec.dims} />
        </div>
      )}

      <div className="card soft">
        <h3>👣 이렇게 따라 하세요</h3>
        <ol className="steps">
          {guide.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </div>

      {!compact && (
        <div className="grid-2">
          <div className="card soft">
            <h3>📍 어디에 있나요?</h3>
            <p className="sub" style={{ margin: 0 }}>{guide.where}</p>
            <h3 style={{ marginTop: 12 }}>🛒 처음 준비물</h3>
            <ul className="checklist small">{guide.starter.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="card soft">
            <h3>⚠️ 초보가 자주 하는 실수</h3>
            <ul className="checklist small">{guide.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
            <h3 style={{ marginTop: 12 }}>🧤 안전·주의</h3>
            <p className="sub small" style={{ margin: 0 }}>{guide.safety}</p>
          </div>
        </div>
      )}

      {spec && (
        <div className="card soft">
          <GearPrices speciesId={speciesId} name={name} items={spec.gear} />
        </div>
      )}

      <div className="card soft">
        <h3>▶️ 실제 영상 찾아보기 (YouTube)</h3>
        {guide.videos?.length ? (
          <div className="grid-2">
            {guide.videos.map((v) => <VideoEmbed key={v.youtubeId} id={v.youtubeId} title={v.title} />)}
          </div>
        ) : null}
        <div className="row" style={{ marginTop: guide.videos?.length ? 10 : 0 }}>
          {guide.videoTopics.map((t) => (
            <a key={t.q} className="btn small" href={youtubeSearch(t.q)} target="_blank" rel="noreferrer">
              ▶ {name} {t.label}
            </a>
          ))}
        </div>
        <p className="small muted" style={{ margin: "8px 0 0" }}>YouTube에서 관련 영상을 찾아 보여줘요. 영상 속 채비·장소는 다를 수 있어요.</p>
      </div>
    </div>
  );
}
