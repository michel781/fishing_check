"use client";

import Link from "next/link";
import { IcChevron } from "../icons";
import { useAuth } from "./AuthProvider";

/** 설정·내 기록 상단: 로그인 유도 또는 내 계정 바로가기 */
export function AccountCard({ next = "/settings", compact }: { next?: string; compact?: boolean }) {
  const { configured, loading, user, nickname, sync } = useAuth();
  if (!configured || loading) return null;
  if (user) {
    return (
      <Link href="/account" className="profile-card">
        <span className="avatar" aria-hidden>{(nickname ?? "낚")[0]}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <strong>{nickname ?? "낚시인"} 님</strong>
          <span className="small muted" style={{ display: "block" }}>
            {sync.state === "running" ? "기록을 맞추는 중…" : sync.state === "error" ? "동기화 실패 · 눌러서 확인" : "기록이 계정에 저장되고 있어요"}
          </span>
        </span>
        <IcChevron size={20} />
      </Link>
    );
  }
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="profile-card" style={{ flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "stretch" }}>
      <span style={{ flex: 1 }}>
        <strong>로그인하고 기록을 안전하게</strong>
        <span className="small muted" style={{ display: "block" }}>휴대폰을 바꿔도 즐겨찾기·조과 기록이 그대로 남아요.</span>
      </span>
      <span className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
        <Link href={`/login${q}`} className="btn" style={{ flex: 1 }}>로그인</Link>
        <Link href={`/signup${q}`} className="btn primary" style={{ flex: 1 }}>회원가입</Link>
      </span>
    </div>
  );
}
