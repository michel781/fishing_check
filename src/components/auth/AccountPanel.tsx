"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { validateNickname } from "@/lib/auth/validate";
import { setOwner, writeFavs, writeLogs } from "@/lib/localStore";
import { IcChevron, IcReset } from "../icons";
import { useAuth } from "./AuthProvider";
import { AuthShell, DeviceNote, Field } from "./ui";

const PROVIDER: Record<string, string> = { email: "이메일", kakao: "카카오", device: "이메일 (이 기기)" };
const kstDate = (iso: string) => new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 10).replaceAll("-", ".");

export function AccountPanel({ pwChanged, welcome }: { pwChanged?: boolean; welcome?: boolean }) {
  const router = useRouter();
  const { user, nickname, loading, sync, refreshProfile, signOut, backend } = useAuth();
  const [nick, setNick] = useState("");
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState(pwChanged ? "비밀번호를 바꿨어요." : welcome ? "가입을 환영해요! 이제 즐겨찾기·조과 기록이 계정에 저장돼요." : "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [deleting, setDeleting] = useState(false);
  // 로그아웃·탈퇴로 나가는 중에는 "로그인 화면으로" 보내지 않는다
  const leaving = useRef(false);

  useEffect(() => {
    if (!loading && backend && !user && !leaving.current) router.replace("/login?next=/account");
  }, [loading, user, backend, router]);

  if (loading || !user || !backend) return <p className="sub" role="status">불러오는 중…</p>;

  const saveNick = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateNickname(nick);
    if (v) return setErr(v);
    setBusy(true);
    const { error } = await backend.setNickname(user.id, nick);
    setBusy(false);
    if (error) return setErr(error);
    setErr(null);
    setEditing(false);
    setMsg("닉네임을 바꿨어요.");
    await refreshProfile();
  };

  const logout = async () => {
    leaving.current = true;
    setBusy(true);
    const flushed = await signOut();
    setBusy(false);
    if (!flushed) alert("일부 기록을 계정에 올리지 못해 이 기기에 남겨 두었어요. 다음에 로그인하면 다시 올라가요.");
    router.replace("/");
  };

  const withdraw = async () => {
    if (backend.needsCurrentPassword && !deleting) return setDeleting(true);
    if (backend.needsCurrentPassword && !delPw) return setErr("비밀번호를 입력해 주세요.");
    if (!confirm("정말 탈퇴할까요?\n계정과 계정에 저장된 즐겨찾기·조과 기록이 모두 지워지고 되돌릴 수 없어요.")) return;
    leaving.current = true;
    setBusy(true);
    const { error } = await backend.deleteAccount(delPw);
    if (error) {
      setBusy(false);
      leaving.current = false;
      return setErr(error);
    }
    writeFavs([]);
    writeLogs([]);
    setOwner(null);
    await refreshProfile();
    setBusy(false);
    alert("탈퇴했어요. 그동안 이용해 주셔서 고마워요.");
    router.replace("/");
  };

  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="profile-card">
        <span className="avatar" aria-hidden>{(nickname ?? "낚")[0]}</span>
        <span style={{ minWidth: 0 }}>
          <strong style={{ fontSize: "1.2rem" }}>{nickname ?? "낚시인"} 님</strong>
          <span className="small muted" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email ?? "이메일 없음"}</span>
        </span>
      </div>
      {msg && <p className="small" role="status" style={{ margin: "8px 2px 0" }}>✅ {msg}</p>}
      {backend.mode === "local" && <div style={{ marginTop: 8 }}><DeviceNote /></div>}

      <h2 className="set-label">계정 정보</h2>
      <div className="set-group">
        {editing ? (
          <form className="stack" style={{ gap: 8, padding: 16 }} onSubmit={saveNick} noValidate>
            <Field label="새 닉네임" value={nick} onChange={(e) => setNick(e.target.value)} error={err} hint="2~12자, 한글·영문·숫자" maxLength={12} autoFocus />
            <div className="row">
              <button className="btn primary" disabled={busy}>저장</button>
              <button type="button" className="btn" onClick={() => { setEditing(false); setErr(null); }}>취소</button>
            </div>
          </form>
        ) : (
          <button type="button" className="set-row" onClick={() => { setNick(nickname ?? ""); setEditing(true); setMsg(""); }}>
            <span className="lb">닉네임</span>
            <span className="val">{nickname ?? "-"}</span>
            <IcChevron size={18} />
          </button>
        )}
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="lb">로그인 방법</span>
          <span className="val">{PROVIDER[user.provider] ?? user.provider}</span>
        </div>
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="lb">가입일</span>
          <span className="val num">{kstDate(user.createdAt)}</span>
        </div>
        {(user.provider === "email" || user.provider === "device") && (
          <Link href="/auth/update-password" className="set-row">
            <span className="lb">비밀번호 바꾸기</span>
            <IcChevron size={18} />
          </Link>
        )}
      </div>

      <h2 className="set-label">내 데이터</h2>
      <div className="set-group">
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="lb">
            {backend.data ? "기기 간 동기화" : "저장 위치"}
            <small>
              {!backend.data
                ? "이 기기(브라우저)에 저장돼요"
                : sync.state === "running"
                ? "맞추는 중…"
                : sync.state === "error"
                  ? "동기화하지 못했어요. 인터넷 연결을 확인해 주세요."
                  : sync.state === "done"
                    ? `즐겨찾기 ${sync.favs}곳 · 조과 기록 ${sync.logs}건이 계정에 저장돼 있어요`
                    : "로그인한 기기끼리 자동으로 맞춰져요"}
            </small>
          </span>
        </div>
        <Link href="/log" className="set-row"><span className="lb">내 조과 기록 보기</span><IcChevron size={18} /></Link>
      </div>

      <h2 className="set-label">기타</h2>
      <div className="set-group">
        <Link href="/terms" className="set-row"><span className="lb">이용약관</span><IcChevron size={18} /></Link>
        <Link href="/privacy" className="set-row"><span className="lb">개인정보 처리방침</span><IcChevron size={18} /></Link>
        <button type="button" className="set-row" onClick={logout} disabled={busy}><span className="lb">로그아웃</span></button>
        <button type="button" className="set-row danger" onClick={withdraw} disabled={busy}>
          <span className="ic"><IcReset size={22} /></span>
          <span className="lb">회원 탈퇴<small>계정과 저장된 데이터를 모두 지워요</small></span>
        </button>
        {deleting && (
          <form className="stack" style={{ gap: 8, padding: 16 }} onSubmit={(e) => { e.preventDefault(); void withdraw(); }} noValidate>
            <Field label="확인을 위해 비밀번호를 입력해 주세요" type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} autoFocus />
            <div className="row">
              <button className="btn danger-btn" disabled={busy}>탈퇴하기</button>
              <button type="button" className="btn" onClick={() => { setDeleting(false); setDelPw(""); setErr(null); }}>취소</button>
            </div>
          </form>
        )}
      </div>
      {err && !editing && <p className="field-err" role="alert">{err}</p>}
    </div>
  );
}
