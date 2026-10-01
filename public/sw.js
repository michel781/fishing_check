// 피싱체크 서비스워커: 앱 셸은 캐시 우선, 예보 API·페이지는 네트워크 우선(오프라인 시 마지막 값)
const VERSION = "fc-v10";
// 첫 방문 때 무거운 페이지(랭킹 계산)를 미리 받지 않는다 — 화면 로딩과 경쟁해 오히려 느려짐
const SHELL = ["/logo.png", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 시뮬레이션·캘린더 파일은 캐시하지 않는다
  if (url.searchParams.has("sim") || url.pathname.startsWith("/api/ics")) return;
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }
  // 네트워크 우선이지만, 4초 넘게 걸리고 저장된 화면이 있으면 그걸 먼저 보여준다 (약한 신호·바닷가 대비)
  const net = fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
    }
    return res;
  });
  e.respondWith(
    new Promise((resolve) => {
      let done = false;
      const finish = (r) => {
        if (!done && r) {
          done = true;
          resolve(r);
        }
      };
      const timer = setTimeout(() => caches.match(req).then(finish), 4000);
      net
        .then((res) => {
          clearTimeout(timer);
          finish(res);
        })
        .catch(() => {
          clearTimeout(timer);
          caches.match(req).then((hit) => (hit ? finish(hit) : caches.match("/").then((r) => finish(r || Response.error()))));
        });
    }),
  );
});

// ───────── 앱 푸시 알림 ─────────
self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.title || "피싱체크", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      data: { url: d.url || "/" },
      lang: "ko",
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      // 이미 열린 피싱체크 창이 있으면 그 창에서 열기
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          w.navigate(url).catch(() => {});
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

// 브라우저가 구독을 바꾸면(만료 등) 새 구독을 서버에 다시 알린다
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    (async () => {
      const old = e.oldSubscription;
      const opts = old && old.options ? old.options : null;
      if (!opts) return;
      const sub = await self.registration.pushManager.subscribe(opts);
      await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sub: sub.toJSON(), resubscribe: true }) });
      if (old) await fetch("/api/push/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: old.endpoint }) });
    })().catch(() => {}),
  );
});
