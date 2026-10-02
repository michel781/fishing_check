"use client";

import { useEffect, useRef } from "react";

/**
 * 전국 확장 안내 팝업 (v1.16: 바다를 낀 모든 시·군·구).
 * 처음 한 번 자동으로 뜨고, '지역 안내' 버튼으로 다시 볼 수 있다.
 */
export function RegionNotice({ open, onClose, counts }: { open: boolean; onClose: () => void; counts: readonly (readonly [string, number])[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  const total = counts.reduce((a, [, n]) => a + n, 0);
  return (
    <dialog ref={ref} className="modal" aria-labelledby="region-notice-title" onClose={onClose} onCancel={onClose}>
      <div className="modal-body">
        <span className="modal-badge">전국 {total}곳</span>
        <h2 id="region-notice-title">바다를 낀 모든 시·군·구로 넓혔어요 🌊</h2>
        <p>
          <strong>왜 처음엔 적었나요?</strong> 처음에는 점수 계산을 검증하기 쉬운 대표 포인트 50여 곳만 넣었어요. 남해·제주는 물살과 따뜻한 바닷물 영향이 커서
          남해 전용 계산 방식(조류·수온 비중, 8물때)을 먼저 만든 뒤 넣었고, 먼 섬은 조위관측소 연결을 확인한 뒤 넣으려고 미뤄 뒀어요.
        </p>
        <p>
          <strong>이번에 이렇게 채웠어요.</strong> 인천·경기부터 강원 고성, 제주까지 바다를 낀 모든 시·군·구에 대표 항구·방파제·갯바위·해변을 넣고,
          흑산도·거문도·추자도·울릉도·덕적도 같은 섬은 가장 가까운 조위관측소(흑산도·거문도·추자도·울릉도·덕적도 등)와 연결했어요.
          모든 포인트에서 <b>시간대별 물 높이</b>를 볼 수 있어요.
        </p>
        <ul className="region-counts">
          {counts.map(([r, n]) => (
            <li key={r}><b>{r}</b> {n}곳</li>
          ))}
        </ul>
        <p className="small muted" style={{ margin: 0 }}>
          새로 넣은 곳의 위치는 항구 부근 대략값이라 길찾기는 이름 검색으로 연결해요. 전국 어항(2천여 곳)을 모두 넣지는 못했어요 — 빠진 곳은 문의하기로 알려 주세요.
          낚시 금지·출입 통제 구역은 수시로 바뀌니 현장 안내를 꼭 따르세요.
        </p>
        <button type="button" className="big-cta" onClick={onClose} autoFocus>확인했어요</button>
      </div>
    </dialog>
  );
}
