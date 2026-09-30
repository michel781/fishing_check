"use client";

import { useEffect, useState } from "react";
import { authConfigured } from "@/lib/auth/client";

interface Status {
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
  const allAuth = envOk && sb.serviceKey && tablesOk && authConfigured;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className={`card ${allAuth ? "" : "soft"}`}>
        <strong style={{ fontSize: "1.1rem" }}>{allAuth ? "✅ 회원가입·로그인이 켜져 있어요" : "회원가입·로그인 켜기"}</strong>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          키 값은 보여주지 않고, 넣었는지와 연결되는지만 확인해요. 단계를 마치면 <b>다시 확인</b>을 눌러 주세요.
        </p>
      </div>

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
