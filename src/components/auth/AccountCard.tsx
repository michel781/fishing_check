"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IcChevron } from "../icons";
import { useAuth } from "./AuthProvider";

/** 설정·내 기록 상단: 로그인 유도 또는 내 계정 바로가기 */
export function AccountCard({ next = "/settings", compact }: { next?: string; compact?: boolean }) {
  const { configured, loading, user, nickname, sync, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (configured && loading) return <div className="profile-card skeleton" style={{ height: 84 }} aria-hidden />;
  if (user) {
    const logout = async () => {
      setBusy(true);
      const ok = await signOut();
      setBusy(false);
      if (!ok) alert("일부 기록을 계정에 올리지 못해 이 기기에 남겨 두었어요.");
      router.refresh();
    };
    return (
      <div className="profile-card">
        <Link href="/account" className="profile-link">
          <span className="avatar" aria-hidden>{(nickname ?? "낚")[0]}</span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <strong>{nickname ?? "낚시인"} 님</strong>
            <span className="small muted" style={{ display: "block" }}>
              {sync.state === "running" ? "기록을 맞추는 중…" : sync.state === "error" ? "동기화 실패 · 눌러서 확인" : "내 계정 보기"}
            </span>
          </span>
          <IcChevron size={20} />
        </Link>
        <button type="button" className="btn small" onClick={logout} disabled={busy}>{busy ? "…" : "로그아웃"}</button>
      </div>
    );
  }
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="profile-card" style={{ flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "stretch" }}>
      <span style={{ flex: 1 }}>
        <strong>{configured ? "로그인하고 기록을 안전하게" : "회원가입 · 로그인"}</strong>
        <span className="small muted" style={{ display: "block" }}>휴대폰을 바꿔도 즐겨찾기·조과 기록이 그대로 남아요.</span>
      </span>
      <span className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
        <Link href={`/login${q}`} className="btn" style={{ flex: 1 }}>로그인</Link>
        <Link href={`/signup${q}`} className="btn primary" style={{ flex: 1 }}>회원가입</Link>
      </span>
    </div>
  );
}
