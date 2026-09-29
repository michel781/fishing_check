"use client";

import { useRouter } from "next/navigation";
import { IcBack } from "./icons";

/** 화면 상단 헤더: 뒤로가기 + 제목 + 오른쪽 동작 (디자인 시스템 공통) */
export function AppHead({ title, back = true, right, fallback = "/" }: { title: string; back?: boolean; right?: React.ReactNode; fallback?: string }) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  };
  return (
    <header className="app-head">
      {back && (
        <button className="round-btn" onClick={goBack} aria-label="뒤로 가기" style={{ marginLeft: -10 }}>
          <IcBack size={26} />
        </button>
      )}
      <h1>{title}</h1>
      <span className="grow" />
      {right}
    </header>
  );
}

export function BackButton({ className = "round-btn", fallback = "/" }: { className?: string; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      aria-label="뒤로 가기"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <IcBack size={26} />
    </button>
  );
}
