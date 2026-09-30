"use client";

import { useEffect, useRef } from "react";
import { NEW_REGIONS } from "@/lib/regions";

/**
 * "왜 전남·경남·부산·울산·제주가 없었나요?" 안내 팝업.
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
  const added = counts.filter(([r]) => (NEW_REGIONS as readonly string[]).includes(r));
  const total = added.reduce((a, [, n]) => a + n, 0);
  return (
    <dialog ref={ref} className="modal" aria-labelledby="region-notice-title" onClose={onClose} onCancel={onClose}>
      <div className="modal-body">
        <span className="modal-badge">새 지역 {total}곳</span>
        <h2 id="region-notice-title">전국 바다로 넓혔어요 🌊</h2>
        <p>
          <strong>왜 처음엔 없었나요?</strong> 피싱체크는 먼저 <b>서해</b>(물때 차이가 커서 물때가 가장 중요)와 <b>동해</b>(너울·수온이 가장 중요) 두 바다만 계산하도록 만들었어요.
          남해·제주는 섬 사이로 <b>물살(조류)이 세고</b>, 따뜻한 바닷물 영향이 커서 같은 계산식을 쓰면 점수가 틀릴 수 있었거든요.
        </p>
        <p>
          <strong>이렇게 해결했어요.</strong> 남해 전용 계산 방식(조류·수온 비중, 8물때)을 새로 넣고, 가까운 조위관측소(목포·완도·여수·통영·거제·부산·울산·제주·서귀포 등)를 연결했어요.
        </p>
        <ul className="region-counts">
          {added.map(([r, n]) => (
            <li key={r}><b>{r}</b> {n}곳</li>
          ))}
        </ul>
        <p className="small muted" style={{ margin: 0 }}>
          울릉도·흑산도 같은 먼 섬은 배편·기상 정보를 더 확인한 뒤 추가할게요. 포인트 좌표는 대략값이라 현장 안내를 꼭 확인하세요.
        </p>
        <button type="button" className="big-cta" onClick={onClose} autoFocus>확인했어요</button>
      </div>
    </dialog>
  );
}
