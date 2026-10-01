"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 기준점을 서울 대신 내 위치로 (약 1km 단위로 줄여 주소에 넣는다) */
export function NightLocate({ style, active }: { style: string; active: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const go = () => {
    if (!navigator.geolocation) return setMsg("이 브라우저는 위치를 지원하지 않아요.");
    setMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMsg("");
        router.push(`/night?style=${style}&lat=${p.coords.latitude.toFixed(2)}&lon=${p.coords.longitude.toFixed(2)}`);
      },
      () => setMsg("위치 권한이 없어 서울 기준으로 보여드려요."),
      { timeout: 8000, maximumAge: 600000 },
    );
  };
  return (
    <span className="row" style={{ gap: 8, alignItems: "center" }}>
      {active ? (
        <a className="chip2" href={`/night?style=${style}`}>서울 기준으로</a>
      ) : (
        <button type="button" className="chip2" onClick={go}>📍 내 위치 기준</button>
      )}
      {msg && <span className="small muted" role="status">{msg}</span>}
    </span>
  );
}
