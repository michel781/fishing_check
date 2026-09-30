// 피싱체크 서비스워커: 앱 셸은 캐시 우선, 예보 API·페이지는 네트워크 우선(오프라인 시 마지막 값)
const VERSION = "fc-v9";
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
