"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

/** 데스크톱 상단: 로그인 / 닉네임 */
export function AccountLink() {
  const { configured, user, nickname, loading } = useAuth();
  if (!configured || loading) return null;
  return user ? (
    <Link href="/account" className="btn small">{nickname ?? "내 계정"} 님</Link>
  ) : (
    <Link href="/login" className="btn small">로그인</Link>
  );
}
