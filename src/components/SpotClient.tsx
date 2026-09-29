"use client";

import { useState } from "react";
import { useFavorites } from "./favorites";
import { IcHeart, IcShare } from "./icons";

/** 사진 헤더 오른쪽: 공유 + 하트(저장) */
export function HeroActions({ spotId, title, text }: { spotId: string; title: string; text: string }) {
  const [favs, toggle] = useFavorites();
  const [msg, setMsg] = useState("");
  const on = favs.includes(spotId);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setMsg("링크를 복사했어요");
        setTimeout(() => setMsg(""), 1800);
      }
    } catch {}
  };
  return (
    <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {msg && <span className="small" role="status" style={{ background: "rgba(8,24,56,.7)", padding: "4px 8px", borderRadius: 8 }}>{msg}</span>}
      <button className="round-btn" onClick={share} aria-label="공유하기"><IcShare size={24} /></button>
      <button className="round-btn" onClick={() => toggle(spotId)} aria-pressed={on} aria-label={on ? "저장 취소" : "저장하기"}>
        <IcHeart size={24} filled={on} />
      </button>
    </span>
  );
}

/** 공유 버튼만 (어종 상세 등) */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setMsg("링크를 복사했어요");
        setTimeout(() => setMsg(""), 1800);
      }
    } catch {}
  };
  return (
    <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {msg && <span className="small" role="status" style={{ background: "rgba(8,24,56,.7)", padding: "4px 8px", borderRadius: 8 }}>{msg}</span>}
      <button className="round-btn" onClick={share} aria-label="공유하기"><IcShare size={24} /></button>
    </span>
  );
}

/** 하단 고정 버튼: 즐겨찾기 추가/해제 */
export function FavCta({ spotId }: { spotId: string }) {
  const [favs, toggle] = useFavorites();
  const on = favs.includes(spotId);
  return (
    <button className="cta-main" onClick={() => toggle(spotId)} aria-pressed={on}>
      <IcHeart size={20} filled={on} /> {on ? "즐겨찾기 됨" : "즐겨찾기 추가"}
    </button>
  );
}
