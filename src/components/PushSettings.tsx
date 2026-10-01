"use client";

import { useEffect, useState } from "react";
import { disablePush, enablePush, currentSubscription, pushSupport, serverStatus, syncPush, testPush, type Prefs, type PushSupport, type ServerStatus } from "@/lib/push/client";
import { InstallApp } from "./InstallApp";
import { IcBell } from "./icons";

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" className="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} disabled={disabled} />;
}

/** 설정 > 알림: 앱 푸시 켜기·끄기, 종류 고르기, 시험 알림 */
export function PushSettings({ prefs, update }: { prefs: Prefs; update: (patch: Partial<Prefs>) => Prefs }) {
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [server, setServer] = useState<ServerStatus | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setSupport(pushSupport());
    void serverStatus().then(setServer);
    void currentSubscription().then((s) => setOn(!!s));
  }, []);

  const ready = support === "ok" && !!server?.enabled;

  const toggle = async (v: boolean) => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      if (v) {
        await enablePush(server!.publicKey, prefs);
        setOn(true);
        setMsg("알림을 켰어요. 아래 '시험 알림 보내기'로 확인해 보세요.");
      } else {
        await disablePush();
        setOn(false);
        setMsg("알림을 껐어요.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "처리하지 못했어요.");
      setSupport(pushSupport());
    }
    setBusy(false);
  };

  const changePref = async (patch: Partial<Prefs>) => {
    const next = update(patch);
    if (on) await syncPush(next).catch(() => setErr("설정을 서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요."));
  };

  const test = async () => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await testPush();
      setMsg("시험 알림을 보냈어요. 몇 초 안에 도착해요.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "보내지 못했어요.");
    }
    setBusy(false);
  };

  // 켤 수 없는 이유를 쉬운 말로
  const blocker =
    support === null || server === null
      ? null
      : support === "ios-install"
        ? "아이폰은 홈 화면에 추가한 피싱체크에서만 알림을 받을 수 있어요 (iOS 16.4 이상). 아래에서 먼저 홈 화면에 추가해 주세요."
        : support === "unsupported"
          ? "이 브라우저는 알림을 지원하지 않아요. 크롬·삼성 인터넷·사파리(홈 화면 앱)에서 열어 주세요."
          : support === "denied"
            ? "이 사이트 알림이 차단돼 있어요. 주소창 왼쪽 자물쇠(또는 브라우저 설정) → 사이트 설정 → 알림 → 허용으로 바꾼 뒤 새로고침해 주세요."
            : !server.enabled
              ? "알림 서버가 아직 준비 중이에요. (운영자: /setup 에서 알림 키와 서버 저장소를 연결해 주세요)"
              : null;

  return (
    <>
      <div className="set-group">
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="ic"><IcBell size={22} /></span>
          <span className="lb">
            앱 푸시 알림
            <small>{on ? "켜져 있어요 · 매일 아침 오늘의 황금타임을 알려드려요" : "휴대폰 알림으로 황금타임·위험 예보 받기"}</small>
          </span>
          <Switch on={on} onChange={toggle} label="앱 푸시 알림" disabled={!ready || busy} />
        </div>
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="ic"><IcBell size={22} /></span>
          <span className="lb">황금타임 알림<small>즐겨찾기 포인트의 오늘 황금타임{server?.cron ? " · 시작 1시간 전" : ""}</small></span>
          <Switch on={prefs.notiGolden} onChange={(v) => void changePref({ notiGolden: v })} label="황금타임 알림" />
        </div>
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="ic"><IcBell size={22} /></span>
          <span className="lb">기상 악화 알림<small>즐겨찾기 포인트에 강풍·높은 파도 예보</small></span>
          <Switch on={prefs.notiDanger} onChange={(v) => void changePref({ notiDanger: v })} label="기상 악화 알림" />
        </div>
        {on && (
          <button type="button" className="set-row" onClick={test} disabled={busy}>
            <span className="ic"><IcBell size={22} /></span>
            <span className="lb">시험 알림 보내기<small>이 휴대폰으로 알림이 오는지 확인</small></span>
          </button>
        )}
        {support === "ios-install" && <InstallApp variant="row" />}
      </div>
      {blocker && <p className="small push-note" role="note">{blocker}</p>}
      {msg && <p className="small" role="status" style={{ margin: "6px 2px 0" }}>✅ {msg}</p>}
      {err && <p className="field-err" role="alert" style={{ margin: "6px 2px 0" }}>{err}</p>}
      <p className="small muted" style={{ margin: "6px 2px 0" }}>
        즐겨찾기한 포인트 기준으로 알려드려요 (없으면 오늘 전국 추천 1곳). 밤 10시~새벽 4시에는 &lsquo;곧 황금타임&rsquo; 알림을 보내지 않아요.
      </p>
    </>
  );
}
