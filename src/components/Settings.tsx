"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function Settings({ mul, theme }: { mul: string; theme: string }) {
  const router = useRouter();
  const [m, setM] = useState(mul);
  const [t, setT] = useState(theme);
  const [cleared, setCleared] = useState(false);

  const chooseMul = (v: string) => {
    setM(v);
    if (v === "auto") document.cookie = "mul=; path=/; max-age=0";
    else setCookie("mul", v);
    router.refresh();
  };
  const chooseTheme = (v: string) => {
    setT(v);
    setCookie("theme", v);
    document.documentElement.dataset.theme = v;
  };
  const clearAll = () => {
    if (!confirm("즐겨찾기와 조황 기록을 모두 지울까요?")) return;
    try {
      localStorage.removeItem("fc:favs");
      localStorage.removeItem("fc:log");
    } catch {}
    setCleared(true);
  };

  return (
    <>
      <div className="card stack" style={{ gap: 10 }}>
        <h2>물때 계산 방식</h2>
        <div className="row" role="radiogroup" aria-label="물때 계산 방식">
          {[["auto", "자동 (서해 7물·그 외 8물)"], ["7", "7물때식"], ["8", "8물때식"]].map(([v, l]) => (
            <button key={v} className="btn" role="radio" aria-checked={m === v} aria-pressed={m === v} onClick={() => chooseMul(v)}>{l}</button>
          ))}
        </div>
        <p className="small muted" style={{ margin: 0 }}>7물때식: 음력 1·16일이 7물(서해 관행). 8물때식: 하루 앞서 음력 1일이 8물(남해 관행).</p>
      </div>
      <div className="card stack" style={{ gap: 10 }}>
        <h2>화면</h2>
        <div className="row" role="radiogroup" aria-label="테마">
          {[["dark", "다크 (새벽용)"], ["light", "라이트"]].map(([v, l]) => (
            <button key={v} className="btn" role="radio" aria-checked={t === v} aria-pressed={t === v} onClick={() => chooseTheme(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="card stack" style={{ gap: 10 }}>
        <h2>데이터</h2>
        <button className="btn" onClick={clearAll}>{cleared ? "삭제했습니다" : "즐겨찾기·기록 모두 삭제"}</button>
      </div>
    </>
  );
}
