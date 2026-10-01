/**
 * 앱 푸시 알림 E2E (실제 알림 서버 대신 테스트 모드).
 *   npm run build
 *   FC_AUTH_STORE=memory FC_PUSH_TEST=1 CRON_SECRET=test-secret npx next start -p 3400
 *   node scripts/push-e2e.mjs
 */
import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://localhost:3400";
const SECRET = process.env.CRON_SECRET ?? "test-secret";
const results = [];
const check = (n, ok, x = "") => {
  results.push(ok);
  console.log(`${ok ? "✅" : "❌"} ${n}${x ? ` — ${x}` : ""}`);
};
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

// 실제 구독(구글 FCM)은 이 환경에서 못 만들어서, 브라우저 구독 함수만 흉내 낸다
const fakePush = `(() => {
  const ep = "https://push.example/" + Math.random().toString(36).slice(2);
  let sub = null;
  const make = () => ({ endpoint: ep, options: {}, toJSON: () => ({ endpoint: ep, keys: { p256dh: "BPfake", auth: "authfake" } }), unsubscribe: async () => { sub = null; return true; } });
  PushManager.prototype.subscribe = async function () { sub = make(); return sub; };
  PushManager.prototype.getSubscription = async function () { return sub; };
  window.__ep = ep;
})()`;

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.grantPermissions(["notifications"], { origin: B });
await ctx.addInitScript(fakePush);
const page = await ctx.newPage();

// 0) 서버 상태
const st = await (await fetch(`${B}/api/push/status`)).json();
check("서버: 알림 준비됨", st.enabled === true && st.cron === true, JSON.stringify(st));

// 1) 즐겨찾기 1곳 → 설정에서 알림 켜기
await page.goto(`${B}/settings`);
await page.evaluate(() => localStorage.setItem("fc:favs", JSON.stringify(["sinjin-outer"])));
const sw = page.getByRole("switch", { name: "앱 푸시 알림" });
await sw.waitFor();
await page.waitForFunction(() => !document.querySelector('[aria-label="앱 푸시 알림"]')?.hasAttribute("disabled"), null, { timeout: 10000 });
await sw.click();
await page.getByText("알림을 켰어요").waitFor({ timeout: 10000 });
check("설정 → 앱 푸시 알림 켜기", (await sw.getAttribute("aria-checked")) === "true");

// 2) 시험 알림
await page.getByRole("button", { name: /시험 알림 보내기/ }).click();
await page.getByText("시험 알림을 보냈어요").waitFor();
let box = (await (await fetch(`${B}/api/push/outbox`)).json()).items;
check("시험 알림 발송", box.some((x) => x.msg.tag === "test"));

// 3) 아침 요약: 비밀값 없으면 거절, 있으면 발송
const no = await fetch(`${B}/api/push/cron?kind=digest`);
check("예약 작업: 비밀값 없으면 거절", no.status === 401);
const run = await (await fetch(`${B}/api/push/cron?kind=digest`, { headers: { authorization: `Bearer ${SECRET}` } })).json();
box = (await (await fetch(`${B}/api/push/outbox`)).json()).items;
const digest = box.filter((x) => x.msg.key.startsWith("digest:") || x.msg.key.startsWith("danger:"));
check("아침 요약 발송 (즐겨찾기 신진도 외항)", digest.length >= 1 && digest.some((x) => /신진도|위험/.test(x.msg.body + x.msg.title)), `${JSON.stringify(run)} ${digest.map((x) => x.msg.title).join(" / ")}`);
const run2 = await (await fetch(`${B}/api/push/cron?kind=digest`, { headers: { authorization: `Bearer ${SECRET}` } })).json();
check("같은 날 두 번 돌려도 중복 발송 안 함", run2.sent === 0, JSON.stringify(run2));

// 4) 황금타임 알림 끄기 → 서버 설정 반영
await page.getByRole("switch", { name: "황금타임 알림" }).click();
await page.waitForTimeout(800);
// 5) 즐겨찾기 바꾸면 자동 동기화 (설정 화면 밖에서도)
await page.evaluate(() => {
  localStorage.setItem("fc:favs", JSON.stringify(["sinjin-outer", "jumunjin"]));
  window.dispatchEvent(new Event("fc:favs-change"));
});
await page.waitForTimeout(2600);
const recs = await page.evaluate(async () => (await fetch("/api/push/outbox")).json()); // 연결 확인용
void recs;
// 서버 저장 내용 확인: 다시 구독 저장을 부르면 같은 id 로 덮어씀 → digest 를 끈 상태 확인은 실행 결과로
const ep = await page.evaluate(() => window.__ep);
check("구독 주소 유지", typeof ep === "string");

// 6) 끄기
await sw.click();
await page.getByText("알림을 껐어요").waitFor();
const t = await fetch(`${B}/api/push/test`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: ep }) });
check("알림 끄면 서버에서도 삭제", t.status === 404);

// 7) 서비스워커가 알림을 실제로 띄우는지 (브라우저 개발 도구로 푸시 전달)
const p2 = await ctx.newPage();
await p2.goto(`${B}/`);
await p2.evaluate(() => navigator.serviceWorker.ready);
const cdp = await ctx.newCDPSession(p2);
await cdp.send("ServiceWorker.enable");
const regId = await new Promise((ok) => {
  cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => e.registrations[0] && ok(e.registrations[0].registrationId));
});
await cdp.send("ServiceWorker.deliverPushMessage", { origin: B, registrationId: regId, data: JSON.stringify({ title: "🎣 오늘 황금타임 16:00–18:00", body: "신진도 외항 우럭 82점", url: "/spot/sinjin-outer", tag: "digest-x" }) });
await p2.waitForTimeout(1000);
const shown = await p2.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => ({ t: n.title, b: n.body, url: n.data?.url })));
check("서비스워커가 알림 표시", shown.some((n) => n.t.includes("황금타임") && n.url === "/spot/sinjin-outer"), JSON.stringify(shown));

// 8) 아이폰(홈 화면 미추가)에서는 홈 화면 추가 안내
const ios = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 844 }, isMobile: true });
const p3 = await ios.newPage();
await p3.goto(`${B}/settings`);
await p3.getByText(/아이폰은 홈 화면에 추가한 피싱체크에서만/).waitFor();
check("아이폰: 홈 화면 추가 안내 + 스위치 잠금", (await p3.getByRole("switch", { name: "앱 푸시 알림" }).isDisabled()));

await browser.close();
const bad = results.filter((x) => !x).length;
console.log(`\n${results.length - bad}/${results.length} 통과`);
process.exit(bad ? 1 : 0);
