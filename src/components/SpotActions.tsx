"use client";

import Link from "next/link";
import { useState } from "react";
import { useFavorites } from "./favorites";

export function SpotActions({ spotId, title, text, logHref, howToLabel }: { spotId: string; title: string; text: string; logHref?: string; howToLabel?: string }) {
  const [favs, toggle] = useFavorites();
  const [copied, setCopied] = useState(false);
  const on = favs.includes(spotId);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  };
  return (
    <div className="row">
      <button className="btn" aria-pressed={on} onClick={() => toggle(spotId)}>
        {on ? "★ 저장됨" : "☆ 저장"}
      </button>
      <button className="btn" onClick={share}>{copied ? "링크 복사됨" : "공유"}</button>
      {howToLabel && <a className="btn" href="#how-to">{howToLabel}</a>}
      {logHref && <Link className="btn" href={logHref}>📝 조황 기록</Link>}
    </div>
  );
}
