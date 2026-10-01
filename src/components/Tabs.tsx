"use client";

import { useEffect, useState } from "react";

/** 밑줄 탭 (디자인 시스템 u-tabs). 모든 패널은 HTML에 렌더되고 선택된 것만 보인다. */
export function Tabs({ tabs, label, initial }: { tabs: { id: string; label: string; content: React.ReactNode }[]; label: string; initial?: string }) {
  const [cur, setCur] = useState(initial && tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id);
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === h)) setCur(h);
    };
    read();
    // 같은 화면 안의 #탭 링크를 눌렀을 때도 탭을 바꾼다
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [tabs]);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="u-tabs" role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={cur === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={cur === t.id ? 0 : -1}
            onClick={() => {
              setCur(t.id);
              history.replaceState(null, "", `#${t.id}`);
            }}
            onKeyDown={(e) => {
              const i = tabs.findIndex((x) => x.id === t.id);
              const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -99;
              if (n === -99) return;
              const next = tabs[(n + tabs.length) % tabs.length];
              setCur(next.id);
              document.getElementById(`tab-${next.id}`)?.focus();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={cur !== t.id} className="stack" style={{ gap: 12 }}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
