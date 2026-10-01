"use client";

import { useEffect, useState } from "react";
import { authConfigured } from "@/lib/auth/client";

interface Status {
  accounts?: { store: boolean; reachable: boolean | null };
  mail?: "gmail" | "brevo" | "resend" | "test" | null;
  push?: { keys: boolean; cron: boolean };
  supabase: { url: boolean; anonKey: boolean; serviceKey: boolean; kakaoLogin: boolean; reachable: boolean | null; tables: Record<string, "ok" | "missing" | "error"> | null };
  data: { publicData: boolean };
  extras: { kakaoRest: boolean; coupang: boolean; naver: boolean; operator: boolean };
}

const SQL_URL = "https://github.com/michel781/fishing_check/blob/main/supabase/schema.sql";

function Item({ ok, warn, title, children }: { ok: boolean; warn?: boolean; title: string; children?: React.ReactNode }) {
  return (
    <li className={`setup-item ${ok ? "ok" : warn ? "warn" : "todo"}`}>
      <span className="setup-mark" aria-hidden>{ok ? "✓" : warn ? "!" : "·"}</span>
      <span style={{ minWidth: 0 }}>
        <strong>{title}</strong> <span className="small">{ok ? "완료" : warn ? "확인 필요" : "할 일"}</span>
        {!ok && children && <span className="small muted setup-how">{children}</span>}
      </span>
    </li>
  );
}

/** 회원가입(Supabase)을 켜는 단계를 실제 서버 상태로 하나씩 확인한다 */
export function SetupChecklist() {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState(false);
  const load = () => {
    setS(null);
    setErr(false);
    fetch("/api/setup-status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setS)
      .catch(() => setErr(true));
  };
  useEffect(load, []);

  if (err) return <p className="alert">상태를 불러오지 못했어요. 새로고침해 주세요.</p>;
  if (!s) return <p className="sub" role="status">서버 설정을 확인하는 중…</p>;

  const sb = s.supabase;
  const tablesOk = !!sb.tables && Object.values(sb.tables).every((v) => v === "ok");
  const missing = sb.tables ? Object.entries(sb.tables).filter(([, v]) => v !== "ok").map(([k]) => k) : [];
  const envOk = sb.url && sb.anonKey;

  const acc = s.accounts ?? { store: false, reachable: null };
  const serverOk = acc.store && acc.reachable === true;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className={`card ${authConfigured || serverOk ? "" : "soft"}`}>
        <strong style={{ fontSize: "1.1rem" }}>
          {authConfigured ? "✅ 회원가입·로그인: Supabase 로 동작 중" : serverOk ? "✅ 회원가입·로그인: 서버 계정으로 동작 중" : "✅ 회원가입·로그인: 이 기기 계정으로 동작 중"}
        </strong>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          {authConfigured || serverOk
            ? "여러 기기에서 같은 계정으로 로그인하고 즐겨찾기·조과 기록이 맞춰져요."
            : "지금도 가입·로그인은 되지만 계정이 각 휴대폰(브라우저)에만 저장돼요. 아래 1단계를 하면 서버 계정으로 바뀌어요."}{" "}
          키 값은 보여주지 않고, 넣었는지와 연결되는지만 확인해요.
        </p>
      </div>

      <h2 className="set-label">회원가입 이메일 인증 켜기 (무료)</h2>
      <ol className="setup-list">
        <Item ok={!!s.mail} title={s.mail ? `이메일 인증 사용 중 (${s.mail === "gmail" ? "Gmail" : s.mail === "brevo" ? "Brevo" : s.mail === "resend" ? "Resend" : "테스트"})` : "1. Gmail 앱 비밀번호 만들기"}>
          인증 메일을 보낼 Gmail 계정(운영용으로 새로 만드는 것을 추천)에서 <b>구글 계정 → 보안 → 2단계 인증</b>을 켠 뒤 <b>앱 비밀번호</b>를 만들어요(16자리).
          Vercel → Settings → Environment Variables 에 <code>GMAIL_USER</code>(그 Gmail 주소), <code>GMAIL_APP_PASSWORD</code>(16자리)를 넣고 Redeploy. 하루 약 500통까지 무료예요.
        </Item>
      </ol>

      <h2 className="set-label">앱 푸시 알림 켜기 (무료)</h2>
      <ol className="setup-list">
        <Item ok={acc.reachable === true} title="1. 서버 저장소 연결 (아래 '서버 계정 켜기'와 같음)">알림을 받을 기기 목록을 저장해요. Upstash Redis 를 연결해 주세요.</Item>
        <Item ok={!!s.push?.keys} title="2. 알림 서명 키 넣기">
          아래 <b>키 만들기</b>를 눌러 나온 두 값을 Vercel 환경변수 <code>VAPID_PUBLIC_KEY</code>, <code>VAPID_PRIVATE_KEY</code> 로 넣고 Redeploy. 한 번 넣은 키는 바꾸지 마세요(바꾸면 모두 다시 알림을 켜야 해요).
          <VapidMaker />
        </Item>
        <Item ok={!!s.push?.cron} title="3. 매일 아침 알림 예약 (Vercel Cron)">
          Vercel 환경변수 <code>CRON_SECRET</code> 에 아무 긴 무작위 문자열(위 키 만들기에 함께 나옴)을 넣으면, 매일 새벽 5시 반에 오늘의 황금타임·위험 알림이 나가요.
        </Item>
        <Item ok={false} warn={false} title="4. (선택) 황금타임 1시간 전 알림">
          GitHub 저장소 → Settings → Secrets and variables → Actions 에 <code>FC_SITE_URL</code>(사이트 주소), <code>FC_CRON_SECRET</code>(3단계와 같은 값)을 넣으면 30분마다 확인해 보내요. (여기서는 확인할 수 없어요)
        </Item>
      </ol>

      <h2 className="set-label">서버 계정 켜기 (가장 쉬운 방법 · 무료)</h2>
      <ol className="setup-list">
        <Item ok={acc.store} title="1. Vercel 에서 Upstash Redis 연결">
          Vercel → 프로젝트 → <b>Storage</b> → <b>Create Database</b> → <b>Upstash for Redis</b>(Free) → 지역 Tokyo 또는 Seoul → <b>Connect</b>. KV_REST_API_URL·KV_REST_API_TOKEN 이 자동으로 들어가요. 테이블·SQL 작업은 필요 없어요.
        </Item>
        <Item ok={acc.reachable === true} warn={acc.store && acc.reachable === false} title="2. 다시 배포 후 연결 확인">
          {acc.store && acc.reachable === false ? "키는 있지만 연결되지 않아요. Upstash 대시보드에서 데이터베이스가 켜져 있는지 확인해 주세요." : "Vercel → Deployments → 최신 배포 ⋯ → Redeploy 를 누른 뒤 이 화면에서 다시 확인을 눌러 주세요."}
        </Item>
      </ol>

      <details className="card">
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 800 }}>고급: Supabase 로 켜기 (메일 인증·비밀번호 찾기 메일·카카오 로그인)</summary>
      <ol className="setup-list">
        <Item ok={sb.url && sb.anonKey} title="1. Supabase 프로젝트 만들고 키 넣기">
          <b>가장 쉬운 방법:</b> Vercel → 프로젝트 → Storage → Create Database → Supabase 를 고르면 계정 연결과 키 입력(NEXT_PUBLIC_SUPABASE_URL 등)이 자동으로 돼요.
          직접 하려면: supabase.com → New project(지역 Seoul) → Project Settings → API 에서 Project URL 과 anon(publishable) 키를 복사 → Vercel → Settings → Environment Variables 에
          NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 로 넣기
        </Item>
        <Item ok={sb.serviceKey} title="2. 서버 전용 키 넣기 (회원 탈퇴용)">
          같은 화면의 service_role(또는 secret) 키를 SUPABASE_SERVICE_ROLE_KEY 로 넣기. 이름 앞에 NEXT_PUBLIC_ 을 붙이지 마세요.
        </Item>
        <Item ok={tablesOk} warn={envOk && sb.reachable === false} title="3. 테이블 만들기 (SQL 한 번 실행)">
          {!envOk ? "1단계를 먼저 해 주세요." : sb.reachable === false ? "Supabase 주소에 연결되지 않아요. URL 을 다시 확인해 주세요." : (
            <>Supabase → SQL Editor → <a className="link" href={SQL_URL} target="_blank" rel="noreferrer">schema.sql</a> 내용을 붙여넣고 Run. 없는 테이블: {missing.join(", ")}</>
          )}
        </Item>
        <Item ok={authConfigured} warn={envOk && !authConfigured} title="4. 다시 배포 (Redeploy)">
          {envOk ? "서버에는 키가 있지만 화면 코드에는 아직 없어요. Vercel → Deployments → 최신 배포 ⋯ → Redeploy 를 눌러 주세요." : "키를 넣은 뒤 Vercel 에서 Redeploy 를 눌러야 화면에 반영돼요."}
        </Item>
      </ol>
      <p className="small muted" style={{ margin: 0 }}>
        <b>5. 로그인 주소 등록</b>(여기서는 확인할 수 없어요): Supabase → Authentication → URL Configuration 에서 Site URL 을 사이트 주소로, Redirect URLs 에
        <code> /auth/callback</code>, <code>/auth/update-password</code> 를 추가해 주세요.
      </p>

      </details>

      <h2 className="set-label">선택 기능</h2>
      <ol className="setup-list">
        <Item ok={s.data.publicData} title="실시간 물때·날씨 (공공데이터포털 키)">DATA_GO_KR_SERVICE_KEY</Item>
        <Item ok={s.extras.kakaoRest} title="근처 낚시점·정확한 주소 (카카오 REST 키)">developers.kakao.com → 앱 키 → REST API 키 → KAKAO_REST_API_KEY</Item>
        <Item ok={sb.kakaoLogin} title="카카오 로그인 버튼">Supabase 에서 Kakao 로그인을 켠 뒤 NEXT_PUBLIC_AUTH_KAKAO=1</Item>
        <Item ok={s.extras.coupang || s.extras.naver} title="채비 실시간 가격 (쿠팡 또는 네이버)">COUPANG_ACCESS_KEY·COUPANG_SECRET_KEY 또는 NAVER_CLIENT_ID·NAVER_CLIENT_SECRET</Item>
        <Item ok={s.extras.operator} title="약관·개인정보에 운영자 정보">OPERATOR_NAME, CONTACT_EMAIL</Item>
      </ol>

      <button type="button" className="big-cta" onClick={load}>다시 확인</button>
    </div>
  );
}

/** 알림 서명 키(VAPID) 만들기 — 이 브라우저 안에서만 만들고 어디에도 보내지 않는다 */
function VapidMaker() {
  const [keys, setKeys] = useState<{ pub: string; priv: string; cron: string } | null>(null);
  const [err, setErr] = useState("");
  const b64 = (b: ArrayBuffer | Uint8Array) =>
    btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const make = async () => {
    try {
      const k = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
      const pub = b64(await crypto.subtle.exportKey("raw", k.publicKey));
      const jwk = await crypto.subtle.exportKey("jwk", k.privateKey);
      setKeys({ pub, priv: jwk.d ?? "", cron: b64(crypto.getRandomValues(new Uint8Array(24))) });
    } catch {
      setErr("이 브라우저에서는 만들 수 없어요. 최신 크롬으로 열어 주세요.");
    }
  };
  return (
    <span className="stack" style={{ gap: 6, marginTop: 6 }}>
      <button type="button" className="btn small" onClick={make} style={{ alignSelf: "flex-start" }}>키 만들기</button>
      {err && <span className="field-err">{err}</span>}
      {keys && (
        <span className="vapid-out">
          <b>VAPID_PUBLIC_KEY</b>
          <code>{keys.pub}</code>
          <b>VAPID_PRIVATE_KEY</b> (남에게 보여주지 마세요)
          <code>{keys.priv}</code>
          <b>CRON_SECRET</b>
          <code>{keys.cron}</code>
        </span>
      )}
    </span>
  );
}
