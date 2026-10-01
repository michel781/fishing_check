/** 전국 포인트 순위를 계산하는 동안 보여줄 뼈대 화면 (누르자마자 화면이 바뀌게) */
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="순위 불러오는 중">
      <div className="skeleton" style={{ height: 56 }} />
      <div className="skeleton" style={{ height: 44 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton" style={{ height: 84 }} />
      ))}
      <p className="small muted" style={{ textAlign: "center" }}>전국 포인트 점수를 비교하는 중…</p>
    </div>
  );
}
