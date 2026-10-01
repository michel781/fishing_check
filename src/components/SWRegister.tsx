"use client";

import { useEffect } from "react";
import { FAV_EVT } from "@/lib/localStore";

export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // 알림을 켠 기기: 즐겨찾기가 바뀌면 알림 대상 포인트를 서버에 맞춘다 (연속 변경은 2초 모아서)
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(t);
      t = setTimeout(() => void import("@/lib/push/client").then((m) => m.syncPush()).catch(() => {}), 2000);
    };
    // 앱을 열 때 하루 한 번도 맞춘다 (구독이 바뀌었거나 서버 기록이 지워진 경우 대비)
    try {
      const day = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("fc:push-synced") !== day) {
        localStorage.setItem("fc:push-synced", day);
        sync();
      }
    } catch {}
    window.addEventListener(FAV_EVT, sync);
    return () => {
      clearTimeout(t);
      window.removeEventListener(FAV_EVT, sync);
    };
  }, []);
  return null;
}
