"use client";

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

/** 서버 저장소가 없어 계정을 이 기기에 만드는 경우 알려 준다 */
export function DeviceNote() {
  return (
    <p className="small device-note" style={{ margin: 0 }}>
      📱 지금은 계정이 <b>이 휴대폰(브라우저)</b>에 만들어져요. 즐겨찾기·조과 기록도 이 기기에 안전하게 저장돼요.
    </p>
  );
}

/** 회원 기능을 불러오는 동안 */
export function AuthLoading({ title }: { title: string }) {
  return (
    <AuthShell title={title}>
      <p className="sub" role="status">불러오는 중…</p>
    </AuthShell>
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
