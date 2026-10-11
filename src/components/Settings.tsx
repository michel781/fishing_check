"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { REGIONS } from "@/lib/regions";
import { AccountCard } from "./auth/AccountCard";
import { loadPrefs, PREF_KEY, type Prefs } from "@/lib/push/client";
import { InstallApp } from "./InstallApp";
import { PushSettings } from "./PushSettings";
import { IcChevron, IcDatabase, IcHelp, IcInfo, IcMail, IcMoon, IcPalette, IcPin, IcReset, IcSun, IcTide } from "./icons";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

const DEFAULT: Prefs = { region: "", notiGolden: true, notiDanger: true };

export function Settings({ mul, theme, version }: { mul: string; theme: string; version: string }) {
  const router = useRouter();
  const [m, setM] = useState(mul);
  const [t, setT] = useState(theme === "dark" || theme === "auto" ? theme : "light");
  const [p, setP] = useState<Prefs>(DEFAULT);
  const [msg, setMsg] = useState("");

  useEffect(() => setP(loadPrefs()), []);
  const update = (patch: Partial<Prefs>) => {
    const next = { ...p, ...patch };
    setP(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {}
    return next;
  };

  const chooseMul = (v: string) => {
    setM(v);
    if (v === "auto") document.cookie = "mul=; path=/; max-age=0";
    else setCookie("mul", v);
    router.refresh();
  };
  const chooseTheme = (v: string) => {
    setT(v);
    setCookie("theme", v);
    document.documentElement.dataset.theme = v === "auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : v;
  };
  const clearAll = () => {
    if (!confirm("즐겨찾기·조과 기록·설정을 모두 지울까요? 되돌릴 수 없어요.")) return;
    try {
      localStorage.removeItem("fc:favs");
      localStorage.removeItem("fc:log");
      localStorage.removeItem(PREF_KEY);
    } catch {}
    setP(DEFAULT);
    setMsg("모두 지웠어요.");
  };

  return (
    <>
      <AccountCard next="/settings" />

      <h2 className="set-label">앱</h2>
      <div className="set-group">
        <InstallApp variant="row" />
      </div>

      <h2 className="set-label">기본 설정</h2>
      <div className="set-group">
        <label className="set-row" style={{ flexDirection: "row" }}>
          <span className="ic"><IcPin size={22} /></span>
          <span className="lb">관심 지역<small>낚시터 목록을 이 지역부터 보여줘요</small></span>
          <select value={p.region} onChange={(e) => update({ region: e.target.value })} style={{ width: "auto", minHeight: 40, border: 0, background: "transparent", color: "var(--text-secondary)", fontWeight: 700 }} aria-label="관심 지역">
            <option value="">전체</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="set-row" style={{ borderBottom: 0, cursor: "default" }}>
            <span className="ic"><IcPalette size={22} /></span>
            <span className="lb">화면 테마<small>새벽·밤낚시엔 다크가 눈이 편해요</small></span>
          </div>
          <div className="theme3" role="radiogroup" aria-label="화면 테마">
            {[["light", "라이트", <IcSun key="s" size={18} />], ["dark", "다크", <IcMoon key="m" size={18} />], ["auto", "자동", <IcSettingsMini key="a" />]].map(([v, l, ic]) => (
              <button key={v as string} type="button" role="radio" aria-checked={t === v} onClick={() => chooseTheme(v as string)}>{ic}{l}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="set-row" style={{ borderBottom: 0, cursor: "default" }}>
            <span className="ic"><IcTide size={22} /></span>
            <span className="lb">물때 계산 방식<small>7물때: 서해 관행 · 8물때: 남해 관행</small></span>
          </div>
          <div className="theme3" role="radiogroup" aria-label="물때 계산 방식">
            {[["auto", "자동"], ["7", "7물때식"], ["8", "8물때식"]].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={m === v} onClick={() => chooseMul(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <h2 className="set-label">알림 설정</h2>
      <PushSettings prefs={p} update={update} />

      <h2 className="set-label">데이터 정보</h2>
      <div className="set-group">
        <Link href="/settings#sources" className="set-row">
          <span className="ic"><IcDatabase size={22} /></span>
          <span className="lb">데이터 출처<small>국립해양조사원 · 기상청 · Open-Meteo</small></span>
          <IcChevron size={18} />
        </Link>
        <div className="set-row" style={{ cursor: "default" }}>
          <span className="ic"><IcInfo size={22} /></span>
          <span className="lb">앱 버전</span>
          <span className="val num">{version}</span>
        </div>
      </div>

      <h2 className="set-label">기타</h2>
      <div className="set-group">
        <Link href="/rigs" className="set-row">
          <span className="ic" aria-hidden style={{ fontSize: 20 }}>🪝</span>
          <span className="lb">채비 도감<small>채비 16종 구성·원리·쓰는 법·고르기</small></span>
          <IcChevron size={18} />
        </Link>
        <Link href="/gear" className="set-row">
          <span className="ic" aria-hidden style={{ fontSize: 20 }}>🎒</span>
          <span className="lb">바다낚시 장비·용어<small>낚싯대·릴·줄·채비 소품, 드랙·찌멈춤 같은 용어</small></span>
          <IcChevron size={18} />
        </Link>
        <Link href="/guide" className="set-row">
          <span className="ic"><IcHelp size={22} /></span>
          <span className="lb">도움말 · 용어 설명</span>
          <IcChevron size={18} />
        </Link>
        <Link href="/guide#faq" className="set-row">
          <span className="ic"><IcInfo size={22} /></span>
          <span className="lb">자주 묻는 질문</span>
          <IcChevron size={18} />
        </Link>
        <Link href="/terms" className="set-row">
          <span className="ic"><IcInfo size={22} /></span>
          <span className="lb">이용약관 · 개인정보 처리방침</span>
          <IcChevron size={18} />
        </Link>
        <a href="https://github.com/michel781/fishing_check/issues" target="_blank" rel="noreferrer" className="set-row">
          <span className="ic"><IcMail size={22} /></span>
          <span className="lb">문의하기 · 의견 보내기</span>
          <IcChevron size={18} />
        </a>
        <Link href="/setup" className="set-row">
          <span className="ic"><IcDatabase size={22} /></span>
          <span className="lb">운영자 설정 점검<small>회원가입·실시간 데이터 키 상태</small></span>
          <IcChevron size={18} />
        </Link>
        <button type="button" className="set-row danger" onClick={clearAll}>
          <span className="ic"><IcReset size={22} /></span>
          <span className="lb">이 기기 데이터 초기화<small>이 휴대폰의 즐겨찾기·조과 기록·설정 삭제 (계정 데이터는 남아요)</small></span>
        </button>
      </div>
      {msg && <p className="small" role="status">{msg}</p>}
    </>
  );
}

function IcSettingsMini() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  );
}
