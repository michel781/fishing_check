"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectInstall, externalOpenUrl, iosPointer, iosSafariMajor, manualSteps, type InstallPlatform } from "@/lib/install";
import { IcChevron, IcPlus } from "./icons";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
declare global {
  interface Window {
    __fcBip?: BIPEvent | null;
  }
  interface Navigator {
    /** Web Install API (크롬 새 버전): 버튼 한 번으로 바로 설치 창 */
    install?: () => Promise<unknown>;
  }
}

/** 설치 창 이벤트가 아직 안 왔으면 잠깐 기다린다 (버튼을 누른 직후라 창을 띄울 수 있는 시간 안) */
function waitBip(ms: number): Promise<BIPEvent | null> {
  if (window.__fcBip) return Promise.resolve(window.__fcBip);
  return new Promise((ok) => {
    const done = () => {
      clearTimeout(t);
      window.removeEventListener("fc:bip", done);
      ok(window.__fcBip ?? null);
    };
    const t = setTimeout(done, ms);
    window.addEventListener("fc:bip", done);
  });
}

const DISMISS_KEY = "fc:install-dismissed";
const DONE_KEY = "fc:installed";

function useInstall() {
  const [env, setEnv] = useState<ReturnType<typeof detectInstall> | null>(null);
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    setEnv(detectInstall({ ua: navigator.userAgent, standalone, maxTouchPoints: navigator.maxTouchPoints }));
    setInstalled(standalone);
    // 레이아웃의 인라인 스크립트가 먼저 받아 둔 설치 이벤트
    if (window.__fcBip) setBip(window.__fcBip);
    const onBip = () => setBip(window.__fcBip ?? null);
    const onInstalled = () => {
      setInstalled(true);
      setBip(null);
      try {
        localStorage.setItem(DONE_KEY, "1");
      } catch {}
    };
    window.addEventListener("fc:bip", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("fc:bip", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const platform: InstallPlatform | null = env ? (installed ? "installed" : env.platform) : null;
  return { env, platform, bip, installed, setBip };
}

/**
 * 홈 화면에 앱 추가.
 * - variant="banner": 홈 화면 안내 카드 (설치했거나 '나중에'를 누르면 7일 동안 숨김)
 * - variant="row"   : 설정 화면 한 줄 (항상 보임, 설치 상태 표시)
 */
export function InstallApp({ variant }: { variant: "banner" | "row" }) {
  const { env, platform, bip, installed, setBip } = useInstall();
  const [hidden, setHidden] = useState(true);
  const [msg, setMsg] = useState("");
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (variant !== "banner") return setHidden(false);
    try {
      const d = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const done = localStorage.getItem(DONE_KEY) === "1";
      setHidden(done || Date.now() - d < 7 * 86400e3);
    } catch {
      setHidden(false);
    }
  }, [variant]);

  const [waiting, setWaiting] = useState(false);
  const done = () => setMsg("홈 화면에 추가했어요! 이제 아이콘을 눌러 바로 열 수 있어요.");

  /**
   * 버튼 한 번으로 바로 추가되는 길을 차례로 시도하고, 모두 안 될 때만 따라 하기 안내를 연다.
   *  1) 크롬·삼성 인터넷이 준 설치 창 (beforeinstallprompt)
   *  2) 아직 안 왔으면 최대 2.5초 기다렸다가 1)
   *  3) Web Install API (navigator.install) — 지원하는 브라우저에서
   */
  const install = useCallback(async () => {
    setMsg("");
    const canWait = platform === "prompt" || platform === "desktop";
    let ev = bip ?? window.__fcBip ?? null;
    // 삼성 인터넷의 설치 창은 APK 를 만들어 Play 프로텍트에 막히므로 쓰지 않는다
    if (platform === "samsung") ev = null;
    if (!ev && canWait && !navigator.install) {
      setWaiting(true);
      ev = await waitBip(2500);
      setWaiting(false);
    }
    if (ev) {
      try {
        await ev.prompt();
        const { outcome } = await ev.userChoice;
        // 한 번 쓴 설치 이벤트는 다시 쓸 수 없다
        window.__fcBip = null;
        setBip(null);
        if (outcome === "accepted") return done();
        return setGuide(true);
      } catch {
        window.__fcBip = null;
        setBip(null);
      }
    }
    if (canWait && navigator.install) {
      try {
        await navigator.install();
        return done();
      } catch (e) {
        // 이용자가 닫았으면 조용히, 그 밖의 오류는 안내로
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    setGuide(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bip, setBip, platform]);

  if (!env || !platform) return null;

  if (variant === "banner") {
    if (hidden || installed || platform === "unknown") return null;
    return (
      <section className="install-card" aria-labelledby="install-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={52} height={52} />
        <span style={{ minWidth: 0 }}>
          <strong id="install-title">피싱체크를 앱처럼 쓰세요</strong>
          <span className="small muted" style={{ display: "block" }}>
            {bip ? "버튼 한 번이면 설치 끝! 아이콘 한 번으로 바로 열려요." : "홈 화면에 추가하면 주소 입력 없이 아이콘 한 번으로 열려요."}
          </span>
        </span>
        <span className="install-actions">
          <button type="button" className="btn small primary" onClick={install}>
            <IcPlus size={16} /> {waiting ? "준비 중…" : platform === "kakao" || platform === "inapp" ? "브라우저로 열기" : platform === "samsung" ? "크롬으로 추가" : bip ? "바로 추가" : "홈 화면에 추가"}
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              try {
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
              } catch {}
              setHidden(true);
            }}
          >
            나중에
          </button>
        </span>
        {msg && <p className="small" role="status" style={{ margin: 0, gridColumn: "1 / -1" }}>✅ {msg}</p>}
        <InstallGuide open={guide} onClose={() => setGuide(false)} platform={platform} os={env.os} browser={env.browser} canPrompt={!!bip} onPrompt={install} />
      </section>
    );
  }

  return (
    <>
      <button type="button" className="set-row" onClick={installed ? undefined : install} aria-disabled={installed || undefined}>
        <span className="ic">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={24} height={24} style={{ borderRadius: 6 }} />
        </span>
        <span className="lb">
          홈 화면에 앱 추가
          <small>{installed ? "홈 화면 앱으로 쓰고 있어요" : "아이콘 한 번으로 바로 열기 · 전체 화면"}</small>
        </span>
        <span className="val">{installed ? "추가됨 ✓" : waiting ? "준비 중…" : bip ? "바로 추가" : "추가하기"}</span>
        {!installed && <IcChevron size={18} />}
      </button>
      {msg && <p className="small" role="status" style={{ margin: "6px 16px" }}>✅ {msg}</p>}
      <InstallGuide open={guide} onClose={() => setGuide(false)} platform={platform} os={env.os} browser={env.browser} canPrompt={!!bip} onPrompt={install} />
    </>
  );
}

/** 설치 창을 띄울 수 없을 때: 브라우저별 따라 하기 안내 */
function InstallGuide({
  open,
  onClose,
  platform,
  os,
  browser,
  canPrompt,
  onPrompt,
}: {
  open: boolean;
  onClose: () => void;
  platform: InstallPlatform;
  os: string;
  browser: string;
  canPrompt: boolean;
  onPrompt: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // 안내를 닫은 뒤에도 잠깐 버튼 위치를 가리켜 준다
  const [hint, setHint] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 12000);
    return () => clearTimeout(t);
  }, [hint]);
  const ext = typeof window !== "undefined" ? externalOpenUrl(platform, os, window.location.origin + "/") : null;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const steps = manualSteps(platform, browser, os, iosSafariMajor(ua));
  const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);
  const pointer = platform === "ios" ? iosPointer(ua, browser, ipad) : null;
  const close = () => {
    if (pointer) setHint(true);
    onClose();
  };
  return (
    <>
    {hint && pointer && !open && <IosPointer at={pointer} />}
    <dialog ref={ref} className="modal" aria-labelledby="install-guide-title" onClose={close} onCancel={close}>
      <div className="modal-body">
        <span className="modal-badge">{browser} · 홈 화면에 추가</span>
        <h2 id="install-guide-title">{platform === "kakao" || platform === "inapp" ? "먼저 브라우저로 열어 주세요" : platform === "samsung" ? "크롬에서 추가하면 안전해요" : "이렇게 추가해요"}</h2>
        <ol className="install-steps">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {ext && (
          <a className="big-cta" href={ext}>
            {platform === "kakao" ? "기본 브라우저로 열기" : "크롬으로 열기"}
          </a>
        )}
        {canPrompt && platform !== "samsung" && (
          <button type="button" className="btn primary" onClick={onPrompt}>
            설치 창 다시 띄우기
          </button>
        )}
        <p className="small muted" style={{ margin: 0 }}>
          홈 화면 앱은 앱스토어 설치 없이 쓰는 &lsquo;웹 앱&rsquo;이에요. 용량을 거의 차지하지 않고, 지우고 싶으면 아이콘을 길게 눌러 삭제하면 돼요.
        </p>
        <button type="button" className="btn" onClick={close} autoFocus>
          {pointer ? "닫고 따라 하기" : "닫기"}
        </button>
      </div>
      {pointer && <IosPointer at={pointer} />}
    </dialog>
    </>
  );
}

/** 아이폰: 눌러야 할 버튼(공유 ⬆︎ 또는 ⋯) 쪽을 화면 가장자리에서 가리키는 화살표 */
function IosPointer({ at }: { at: "bottom-center" | "bottom-right" | "top-right" }) {
  return (
    <span className={`ios-pointer ${at}`} aria-hidden>
      <span className="ios-pointer-label">{at === "bottom-right" ? "사파리 ⋯ 버튼" : at === "top-right" ? "주소창의 공유 ⬆︎ 버튼" : "사파리 공유 ⬆︎ 버튼"}</span>
      <span className="ios-pointer-arrow">{at === "top-right" ? "↑" : "↓"}</span>
    </span>
  );
}
