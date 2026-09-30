"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectInstall, externalOpenUrl, manualSteps, type InstallPlatform } from "@/lib/install";
import { IcChevron, IcPlus } from "./icons";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
declare global {
  interface Window {
    __fcBip?: BIPEvent | null;
  }
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

  const install = useCallback(async () => {
    setMsg("");
    if (bip) {
      await bip.prompt();
      const { outcome } = await bip.userChoice;
      // 한 번 쓴 설치 이벤트는 다시 쓸 수 없다
      window.__fcBip = null;
      setBip(null);
      if (outcome === "accepted") setMsg("홈 화면에 추가했어요! 이제 아이콘을 눌러 바로 열 수 있어요.");
      else setGuide(true);
      return;
    }
    setGuide(true);
  }, [bip, setBip]);

  if (!env || !platform) return null;

  if (variant === "banner") {
    if (hidden || installed || platform === "unknown") return null;
    return (
      <section className="install-card" aria-labelledby="install-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={52} height={52} />
        <span style={{ minWidth: 0 }}>
          <strong id="install-title">피싱체크를 앱처럼 쓰세요</strong>
          <span className="small muted" style={{ display: "block" }}>홈 화면에 추가하면 주소 입력 없이 아이콘 한 번으로 열려요.</span>
        </span>
        <span className="install-actions">
          <button type="button" className="btn small primary" onClick={install}>
            <IcPlus size={16} /> {platform === "kakao" || platform === "inapp" ? "브라우저로 열기" : "홈 화면에 추가"}
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
        <span className="val">{installed ? "추가됨 ✓" : "추가하기"}</span>
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
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  const ext = typeof window !== "undefined" ? externalOpenUrl(platform, os, window.location.origin + "/") : null;
  const steps = manualSteps(platform, browser, os);
  return (
    <dialog ref={ref} className="modal" aria-labelledby="install-guide-title" onClose={onClose} onCancel={onClose}>
      <div className="modal-body">
        <span className="modal-badge">{browser} · 홈 화면에 추가</span>
        <h2 id="install-guide-title">{platform === "kakao" || platform === "inapp" ? "먼저 브라우저로 열어 주세요" : "이렇게 추가해요"}</h2>
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
        {canPrompt && (
          <button type="button" className="btn primary" onClick={onPrompt}>
            설치 창 다시 띄우기
          </button>
        )}
        <p className="small muted" style={{ margin: 0 }}>
          홈 화면 앱은 앱스토어 설치 없이 쓰는 &lsquo;웹 앱&rsquo;이에요. 용량을 거의 차지하지 않고, 지우고 싶으면 아이콘을 길게 눌러 삭제하면 돼요.
        </p>
        <button type="button" className="btn" onClick={onClose} autoFocus>
          닫기
        </button>
      </div>
    </dialog>
  );
}
