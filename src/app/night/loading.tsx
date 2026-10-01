/** 오늘 밤 예보를 모으는 동안 */
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="밤낚시 추천 불러오는 중">
      <div className="skeleton" style={{ height: 96 }} />
      <div className="skeleton" style={{ height: 44 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton" style={{ height: 150 }} />
      ))}
      <p className="small muted" style={{ textAlign: "center" }}>오늘 밤 물때·바람·파도를 모으는 중…</p>
    </div>
  );
}
