"use client";

import Link from "next/link";
import { useId } from "react";

/** 인증 화면 공통 틀: 로고 + 제목 + 설명 */
export function AuthShell({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={56} height={56} />
        <h1>{title}</h1>
        {desc && <p className="sub" style={{ margin: 0 }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  ...input
}: { label: string; error?: string | null; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const desc = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={desc} {...input} />
      {error ? (
        <p id={`${id}-err`} className="field-err" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

/** 운영자가 회원 기능을 아직 켜지 않았을 때 */
export function AuthNotReady() {
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <strong>회원가입·로그인은 준비 중이에요</strong>
      <p className="sub" style={{ margin: 0 }}>
        지금은 로그인 없이 모든 기능을 쓸 수 있어요. 즐겨찾기와 조과 기록은 이 휴대폰에 저장돼요.
      </p>
      <Link className="btn" href="/">홈으로</Link>
    </div>
  );
}

export function KakaoButton({ onClick, busy }: { onClick: () => void; busy?: boolean }) {
  return (
    <button type="button" className="kakao-btn" onClick={onClick} disabled={busy}>
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path fill="#000" d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
      </svg>
      카카오로 시작하기
    </button>
  );
}
