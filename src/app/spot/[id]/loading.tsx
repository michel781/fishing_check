/** 외부 예보를 모으는 동안 보여줄 뼈대 화면 */
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="예보 불러오는 중">
      <div className="skeleton" style={{ height: 72 }} />
      <div className="skeleton" style={{ height: 44 }} />
      <div className="skeleton" style={{ height: 96 }} />
      <div className="skeleton" style={{ height: 220 }} />
      <p className="small muted" style={{ textAlign: "center" }}>기상청·해양조사원 예보를 모으는 중…</p>
    </div>
  );
}
