"use client";

import { useEffect, useRef, useState } from "react";
import type { GearResponse } from "@/app/api/gear/route";
import type { GearItem } from "@/data/rigSpecs";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  return m < 1 ? "방금" : m < 60 ? `${m}분 전` : `${Math.round(m / 60)}시간 전`;
};

/** 채비 준비물 + 가격 (쿠팡 실시간, 없으면 예시 가격대). 화면에 보일 때만 불러온다. */
export function GearPrices({ speciesId, name, items }: { speciesId: string; name: string; items: GearItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const [data, setData] = useState<GearResponse | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const load = () => {
      setState("loading");
      fetch(`/api/gear?species=${encodeURIComponent(speciesId)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j: GearResponse) => {
          setData(j);
          setState("done");
        })
        .catch(() => setState("error"));
    };
    if (!("IntersectionObserver" in window)) return load();
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect();
        load();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [speciesId]);

  const live = data?.provider ?? null;
  const byId = new Map(data?.items.map((i) => [i.id, i]) ?? []);
  const essentials = items.filter((g) => g.essential);
  const liveTotal = essentials.every((g) => byId.get(g.id)?.offer) ? essentials.reduce((a, g) => a + byId.get(g.id)!.offer!.price, 0) : null;
  const rangeTotal = essentials.reduce((a, g) => [a[0] + g.priceRange[0], a[1] + g.priceRange[1]], [0, 0]);

  return (
    <section ref={ref} className="stack" style={{ gap: 10 }} aria-labelledby={`gear-${speciesId}`}>
      <div className="between">
        <h3 id={`gear-${speciesId}`} style={{ margin: 0 }}>🛒 {name} 채비 준비물 · 가격</h3>
        <span className="small muted" role="status">
          {state === "loading" ? "가격 확인 중…" : live && data?.fetchedAt ? `${live === "coupang" ? "쿠팡" : "네이버 쇼핑"} · ${ago(data.fetchedAt)} 가격` : "예시 가격대"}
        </span>
      </div>
      <ul className="gear-list">
        {items.map((g) => {
          const it = byId.get(g.id);
          const o = it?.offer ?? null;
          const href = o?.url ?? it?.moreUrl ?? `https://www.coupang.com/np/search?q=${encodeURIComponent(g.keyword)}`;
          const sponsored = live === "coupang";
          return (
            <li key={g.id} className="gear-row">
              <span className="gear-thumb" aria-hidden>
                {o?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt="" loading="lazy" referrerPolicy="no-referrer" width={64} height={64} />
                ) : (
                  <span>🎣</span>
                )}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="gear-name">
                  {g.name} {g.essential ? <span className="mini-chip blue">필수</span> : <span className="mini-chip">있으면 좋아요</span>}
                </span>
                <span className="small muted" style={{ display: "block" }}>{g.spec} · {g.qty}</span>
                {o && <span className="small gear-title">{o.title}</span>}
              </span>
              <span className="gear-price">
                {o ? (
                  <>
                    <strong className="num">{won(o.price)}</strong>
                    {o.rocket && <span className="mini-chip blue">로켓배송</span>}
                  </>
                ) : (
                  <span className="small muted num">약 {g.priceRange[0].toLocaleString("ko-KR")}~{won(g.priceRange[1])}</span>
                )}
                <a className="btn small" href={href} target="_blank" rel={sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}>
                  {o ? `${o.mall}에서 보기` : "쿠팡에서 찾기"}
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="gear-total">
        <span>필수 준비물 합계</span>
        <strong className="num">{liveTotal != null ? `약 ${won(liveTotal)}` : `약 ${won(rangeTotal[0])} ~ ${won(rangeTotal[1])}`}</strong>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        {live
          ? "표시된 가격은 확인 시점 기준이며 판매처에서 바뀔 수 있어요. 실제 가격·배송비는 판매처 화면을 확인하세요."
          : "지금은 실시간 가격 연결 전이라 대략적인 예시 가격대를 보여줘요. 버튼을 누르면 쿠팡 검색 결과로 이동해요."}
        {" "}낚싯대·릴은 배낚시라면 배에서 빌릴 수 있어요.
      </p>
      {live === "coupang" && (
        <p className="small muted" style={{ margin: 0 }}>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
      )}
    </section>
  );
}
