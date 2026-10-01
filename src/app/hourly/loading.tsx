/** 시간대별 점수를 계산하는 동안 */
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="시간대별 추천 불러오는 중">
      <div className="skeleton" style={{ height: 88 }} />
      <div className="skeleton" style={{ height: 44 }} />
      <div className="skeleton" style={{ height: 50 }} />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 76 }} />
      ))}
      <p className="small muted" style={{ textAlign: "center" }}>전국 포인트의 시간별 점수를 비교하는 중…</p>
    </div>
  );
}
