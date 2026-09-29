import type { Guide } from "@/data/guides";
import { youtubeSearch } from "@/data/guides";
import { RigDiagram } from "./RigDiagram";
import { VideoEmbed } from "./VideoEmbed";

/** 어종별 "이렇게 낚아요" 가이드 (쉬운 말) */
export function SpeciesGuide({ name, guide, compact }: { name: string; guide: Guide; compact?: boolean }) {
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
          <RigDiagram kind={guide.rig.kind} title={guide.rig.name} />
          <p className="small sub" style={{ margin: "6px 0 0" }}>위에서 아래로: {guide.rig.parts.join(" → ")}</p>
        </div>
      </div>

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

      <div className="card soft">
        <h3>▶️ 영상으로 보기</h3>
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
