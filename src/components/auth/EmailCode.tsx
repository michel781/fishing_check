"use client";

import { useEffect, useId, useState } from "react";
import { validateEmail } from "@/lib/auth/validate";

type Purpose = "signup" | "reset";

async function post<T>(action: string, body: object): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api/verify/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("인터넷 연결이 불안정해요. 잠시 후 다시 시도해 주세요.");
  }
  const j = (await r.json().catch(() => ({}))) as T & { message?: string };
  if (!r.ok) throw new Error(j.message ?? "처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
  return j;
}

/** 서버에 메일 보내기 설정이 되어 있는지 (없으면 인증 없이 가입) */
export function useVerifyEnabled(skip: boolean): boolean | null {
  const [on, setOn] = useState<boolean | null>(skip ? false : null);
  useEffect(() => {
    if (skip) return setOn(false);
    setOn(null);
    let alive = true;
    fetch("/api/verify/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { enabled?: boolean }) => alive && setOn(j.enabled === true))
      .catch(() => alive && setOn(false));
    return () => {
      alive = false;
    };
  }, [skip]);
  return on;
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * 이메일 인증번호 받기 → 6자리 입력 → 확인.
 * 확인되면 onVerified(proof) 를 부른다. 이메일을 바꾸면 부모가 proof 를 지운다.
 */
export function EmailCode({ email, purpose, verified, onVerified }: { email: string; purpose: Purpose; verified: boolean; onVerified: (proof: string) => void }) {
  const id = useId();
  const [token, setToken] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "check" | null>(null);
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(0);
  const [cool, setCool] = useState(0);

  // 남은 시간 표시
  useEffect(() => {
    if (!token || verified) return;
    const t = setInterval(() => {
      setLeft((v) => Math.max(0, v - 1));
      setCool((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [token, verified]);

  // 주소를 바꾸면 처음부터
  useEffect(() => {
    if (token && email.trim().toLowerCase() !== sentTo) {
      setToken(null);
      setCode("");
      setErr("");
    }
  }, [email, sentTo, token]);

  if (verified) return <p className="verify-ok" role="status">✅ 이메일 인증 완료</p>;

  const send = async () => {
    const bad = validateEmail(email);
    if (bad) return setErr(bad);
    setBusy("send");
    setErr("");
    try {
      const j = await post<{ token: string; minutes: number }>("send", { email: email.trim(), purpose });
      setToken(j.token);
      setSentTo(email.trim().toLowerCase());
      setLeft(j.minutes * 60);
      setCool(60);
      setCode("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "보내지 못했어요.");
    }
    setBusy(null);
  };

  const check = async () => {
    if (!token) return;
    if (!/^\d{6}$/.test(code)) return setErr("메일로 받은 6자리 숫자를 입력해 주세요.");
    setBusy("check");
    setErr("");
    try {
      const j = await post<{ proof: string }>("check", { email: email.trim(), code, token, purpose });
      onVerified(j.proof);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "확인하지 못했어요.");
    }
    setBusy(null);
  };

  return (
    <div className="verify-box">
      {!token ? (
        <button type="button" className="btn" onClick={send} disabled={busy !== null}>
          {busy === "send" ? "보내는 중…" : "📧 인증번호 받기"}
        </button>
      ) : (
        <>
          <p className="small" style={{ margin: 0 }}>
            <b>{sentTo}</b> 로 6자리 인증번호를 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.
          </p>
          <div className="verify-row">
            <label htmlFor={id} className="skip">인증번호 6자리</label>
            <input
              id={id}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="인증번호 6자리"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void check();
                }
              }}
              aria-describedby={`${id}-time`}
            />
            <button type="button" className="btn primary" onClick={check} disabled={busy !== null}>
              {busy === "check" ? "확인 중…" : "확인"}
            </button>
          </div>
          <div className="between small">
            <span id={`${id}-time`} className={left < 60 ? "field-err" : "muted"}>
              {left > 0 ? `남은 시간 ${mmss(left)}` : "시간이 지났어요. 다시 받아 주세요."}
            </span>
            <button type="button" className="link-btn" onClick={send} disabled={busy !== null || cool > 0}>
              {cool > 0 ? `다시 받기 (${cool}초)` : "다시 받기"}
            </button>
          </div>
        </>
      )}
      {err && <p className="field-err" role="alert" style={{ margin: 0 }}>{err}</p>}
    </div>
  );
}
