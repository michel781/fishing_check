"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authConfigured, callbackUrl, getSupabase, kakaoEnabled } from "@/lib/auth/client";
import { authErrorMessage, safeNext, validateEmail, validateNickname, validatePassword } from "@/lib/auth/validate";
import { AuthNotReady, AuthShell, Field, KakaoButton } from "./ui";
import { useAuth } from "./AuthProvider";

const NEXT_KEY = "fc:auth-next";

async function kakaoLogin(next: string, setErr: (s: string) => void) {
  const p = getSupabase();
  if (!p) return;
  try {
    sessionStorage.setItem(NEXT_KEY, next);
  } catch {}
  const sb = await p;
  const { error } = await sb.auth.signInWithOAuth({ provider: "kakao", options: { redirectTo: callbackUrl() } });
  if (error) setErr(authErrorMessage(error));
}

// ───────────── 로그인 ─────────────
export function LoginForm({ next: nextRaw }: { next?: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const next = safeNext(nextRaw, "/account");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  if (!authConfigured) return <AuthShell title="로그인"><AuthNotReady /></AuthShell>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateEmail(email) ?? (pw ? null : "비밀번호를 입력해 주세요.");
    if (v) return setErr(v);
    setBusy(true);
    setErr("");
    const sb = await getSupabase()!;
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error));
    router.replace(next);
  };

  return (
    <AuthShell title="로그인" desc="로그인하면 즐겨찾기와 조과 기록을 다른 기기에서도 볼 수 있어요.">
      <form className="stack" style={{ gap: 12 }} onSubmit={submit} noValidate>
        <Field label="이메일" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="fish@example.com" required />
        <Field label="비밀번호" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="field-err" role="alert" style={{ margin: 0 }}>{err}</p>}
        <button className="big-cta" disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button>
      </form>
      {kakaoEnabled && (
        <>
          <div className="divider"><span>또는</span></div>
          <KakaoButton onClick={() => kakaoLogin(next, setErr)} />
        </>
      )}
      <div className="auth-links">
        <Link href={`/signup${nextRaw ? `?next=${encodeURIComponent(next)}` : ""}`} className="link">회원가입</Link>
        <span aria-hidden>·</span>
        <Link href="/auth/reset" className="link">비밀번호 찾기</Link>
      </div>
    </AuthShell>
  );
}

// ───────────── 회원가입 ─────────────
const AGREES = [
  { id: "age", label: "만 14세 이상이에요", required: true },
  { id: "terms", label: "이용약관 동의", required: true, href: "/terms" },
  { id: "privacy", label: "개인정보 수집·이용 동의", required: true, href: "/privacy" },
  { id: "marketing", label: "새 기능·이벤트 소식 받기", required: false },
] as const;
type AgreeId = (typeof AGREES)[number]["id"];

export function SignupForm({ next: nextRaw }: { next?: string }) {
  const router = useRouter();
  const next = safeNext(nextRaw, "/account");
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState<Record<AgreeId, boolean>>({ age: false, terms: false, privacy: false, marketing: false });
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [kakaoErr, setKakaoErr] = useState("");

  if (!authConfigured) return <AuthShell title="회원가입"><AuthNotReady /></AuthShell>;

  if (sent) {
    return (
      <AuthShell title="메일을 확인해 주세요" desc={`${sent} 로 인증 메일을 보냈어요.`}>
        <div className="card stack" style={{ gap: 8 }}>
          <p style={{ margin: 0 }}>메일 속 <strong>‘이메일 인증’</strong> 버튼을 누르면 가입이 끝나요.</p>
          <p className="small muted" style={{ margin: 0 }}>메일이 안 보이면 스팸함도 확인해 주세요. 몇 분 걸릴 수 있어요.</p>
          <Link className="btn" href="/login">로그인 화면으로</Link>
        </div>
      </AuthShell>
    );
  }

  const allOn = AGREES.every((a) => agree[a.id]);
  const requiredOn = AGREES.filter((a) => a.required).every((a) => agree[a.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = {
      nick: validateNickname(nick),
      email: validateEmail(email),
      pw: validatePassword(pw),
      pw2: pw2 !== pw ? "비밀번호가 서로 달라요." : null,
    };
    setErrs(v);
    if (Object.values(v).some(Boolean)) return setErr("");
    if (!requiredOn) return setErr("필수 항목에 동의해 주세요.");
    setBusy(true);
    setErr("");
    const sb = await getSupabase()!;
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password: pw,
      options: {
        emailRedirectTo: callbackUrl(),
        data: { nickname: nick.trim(), marketing_opt_in: agree.marketing, terms_agreed_at: new Date().toISOString() },
      },
    });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error));
    // 이미 가입된 메일이면 Supabase 는 오류 대신 빈 identities 를 준다 (가입 여부 노출 방지)
    if (data.user && data.user.identities?.length === 0) return setErr("이미 가입된 이메일이에요. 로그인해 주세요.");
    if (data.session) router.replace(next);
    else setSent(email.trim());
  };

  return (
    <AuthShell title="회원가입" desc="1분이면 끝나요. 즐겨찾기·조과 기록을 계정에 안전하게 보관해요.">
      {kakaoEnabled && (
        <>
          <KakaoButton onClick={() => kakaoLogin(next, setKakaoErr)} />
          {kakaoErr && <p className="field-err" role="alert">{kakaoErr}</p>}
          <div className="divider"><span>또는 이메일로 가입</span></div>
        </>
      )}
      <form className="stack" style={{ gap: 12 }} onSubmit={submit} noValidate>
        <Field label="닉네임" autoComplete="nickname" value={nick} onChange={(e) => setNick(e.target.value)} error={errs.nick} hint="2~12자, 한글·영문·숫자" maxLength={12} required />
        <Field label="이메일" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errs.email} placeholder="fish@example.com" required />
        <Field label="비밀번호" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={errs.pw} hint="8자 이상, 영문+숫자" required />
        <Field label="비밀번호 확인" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} error={errs.pw2} required />

        <fieldset className="agree-box">
          <legend className="skip">약관 동의</legend>
          <label className="agree-all">
            <input type="checkbox" checked={allOn} onChange={(e) => setAgree({ age: e.target.checked, terms: e.target.checked, privacy: e.target.checked, marketing: e.target.checked })} />
            전체 동의
          </label>
          {AGREES.map((a) => (
            <div key={a.id} className="agree-row">
              <label>
                <input type="checkbox" checked={agree[a.id]} onChange={(e) => setAgree({ ...agree, [a.id]: e.target.checked })} />
                <span className={a.required ? "req" : "opt"}>{a.required ? "[필수]" : "[선택]"}</span> {a.label}
              </label>
              {"href" in a && <Link href={a.href} target="_blank" className="small link">보기</Link>}
            </div>
          ))}
        </fieldset>

        {err && <p className="field-err" role="alert" style={{ margin: 0 }}>{err}</p>}
        <button className="big-cta" disabled={busy}>{busy ? "가입하는 중…" : "가입하기"}</button>
      </form>
      <div className="auth-links">
        이미 계정이 있나요? <Link href={`/login${nextRaw ? `?next=${encodeURIComponent(next)}` : ""}`} className="link">로그인</Link>
      </div>
    </AuthShell>
  );
}

// ───────────── 비밀번호 찾기 ─────────────
export function ResetForm() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!authConfigured) return <AuthShell title="비밀번호 찾기"><AuthNotReady /></AuthShell>;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateEmail(email);
    if (v) return setErr(v);
    setBusy(true);
    const sb = await getSupabase()!;
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: callbackUrl("/auth/update-password") });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error));
    setDone(true);
  };
  return (
    <AuthShell title="비밀번호 찾기" desc="가입한 이메일로 새 비밀번호를 정하는 링크를 보내드려요.">
      {done ? (
        <div className="card stack" style={{ gap: 8 }}>
          <p style={{ margin: 0 }}>가입된 이메일이라면 곧 메일이 도착해요. 메일 속 링크를 눌러 새 비밀번호를 정해 주세요.</p>
          <Link className="btn" href="/login">로그인 화면으로</Link>
        </div>
      ) : (
        <form className="stack" style={{ gap: 12 }} onSubmit={submit} noValidate>
          <Field label="이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err || null} required />
          <button className="big-cta" disabled={busy}>{busy ? "보내는 중…" : "재설정 메일 보내기"}</button>
        </form>
      )}
    </AuthShell>
  );
}

// ───────────── 새 비밀번호 ─────────────
export function UpdatePasswordForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!authConfigured) return <AuthShell title="새 비밀번호"><AuthNotReady /></AuthShell>;
  if (loading) return <AuthShell title="새 비밀번호"><p className="sub">확인하는 중…</p></AuthShell>;
  if (!user)
    return (
      <AuthShell title="새 비밀번호">
        <div className="card stack" style={{ gap: 8 }}>
          <p style={{ margin: 0 }}>링크가 만료됐거나 잘못됐어요. 비밀번호 찾기를 다시 해 주세요.</p>
          <Link className="btn" href="/auth/reset">비밀번호 찾기</Link>
        </div>
      </AuthShell>
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validatePassword(pw) ?? (pw !== pw2 ? "비밀번호가 서로 달라요." : null);
    if (v) return setErr(v);
    setBusy(true);
    const sb = await getSupabase()!;
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(authErrorMessage(error));
    router.replace("/account?pw=changed");
  };
  return (
    <AuthShell title="새 비밀번호 정하기">
      <form className="stack" style={{ gap: 12 }} onSubmit={submit} noValidate>
        <Field label="새 비밀번호" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="8자 이상, 영문+숫자" required />
        <Field label="새 비밀번호 확인" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} error={err} required />
        <button className="big-cta" disabled={busy}>{busy ? "바꾸는 중…" : "비밀번호 바꾸기"}</button>
      </form>
    </AuthShell>
  );
}

// ───────────── 메일 인증·카카오 로그인 뒤 돌아오는 곳 ─────────────
export function AuthCallback({ error }: { error?: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [timeout, setTimedOut] = useState(false);
  const [hashErr, setHashErr] = useState(false);
  useEffect(() => {
    // 메일 링크 오류는 주소의 # 뒤에 붙어 온다 (예: #error=access_denied&error_code=otp_expired)
    if (/(^|[#&])error(_code)?=/.test(window.location.hash)) setHashErr(true);
  }, []);
  useEffect(() => {
    if (loading || error || hashErr) return;
    if (user) {
      let next = "/account";
      try {
        next = safeNext(sessionStorage.getItem(NEXT_KEY), "/account");
        sessionStorage.removeItem(NEXT_KEY);
      } catch {}
      router.replace(next);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [user, loading, error, hashErr, router]);
  if (error || hashErr || timeout)
    return (
      <AuthShell title="로그인하지 못했어요">
        <div className="card stack" style={{ gap: 8 }}>
          <p style={{ margin: 0 }}>{error || hashErr ? "링크가 만료됐거나 이미 사용됐어요." : "확인이 오래 걸리고 있어요."} 다시 로그인해 주세요.</p>
          <Link className="btn" href="/login">로그인</Link>
        </div>
      </AuthShell>
    );
  return <AuthShell title="로그인하는 중…" desc="잠시만 기다려 주세요."><span role="status" className="skip">로그인 확인 중</span></AuthShell>;
}
