/**
 * 자체 회원 기능 E2E 점검 (Supabase 없이).
 *   npm run build
 *   FC_AUTH_STORE=memory FC_MAIL_TEST=1 npx next start -p 3200   # 서버 계정 + 이메일 인증
 *   FC_MAIL_TEST=1 npx next start -p 3201                        # 이 기기 계정 + 이메일 인증
 *   npx next start -p 3202                                       # 아무 설정 없음 (인증 없이 가입)
 *   node scripts/account-e2e.mjs
 */
import { chromium } from "playwright";

const SERVER = process.env.SERVER_URL ?? "http://localhost:3200";
const LOCAL = process.env.LOCAL_URL ?? "http://localhost:3201";
const PLAIN = process.env.PLAIN_URL ?? "http://localhost:3202";
const VERIFY = { [SERVER]: true, [LOCAL]: true, [PLAIN]: false };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 테스트 메일함(FC_MAIL_TEST=1)에서 가장 최근 인증번호 */
async function lastCode(base, email) {
  for (let i = 0; i < 20; i++) {
    const j = await fetch(`${base}/api/verify/outbox?to=${encodeURIComponent(email)}`).then((r) => r.json());
    const m = j.mails?.at(-1)?.subject.match(/(\d{6})/);
    if (m) return m[1];
    await sleep(200);
  }
  throw new Error("인증 메일 없음");
}
async function verifyEmail(page, base, email) {
  const before = await mailCount(base, email);
  await page.getByRole("button", { name: /인증번호 받기/ }).click();
  await page.getByPlaceholder("인증번호 6자리").waitFor();
  for (let i = 0; i < 25 && (await mailCount(base, email)) <= before; i++) await sleep(200);
  await page.getByPlaceholder("인증번호 6자리").fill(await lastCode(base, email));
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await page.getByText("이메일 인증 완료").waitFor();
}
const mailCount = async (base, email) => (await fetch(`${base}/api/verify/outbox?to=${encodeURIComponent(email)}`).then((r) => r.json())).mails?.length ?? 0;
const results = [];
// 서버 메모리 저장소가 이전 실행 계정을 기억하므로 실행마다 다른 이메일
const RUN = Date.now().toString(36);
const E = (name) => `${name}-${RUN}@test.com`;
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const phone = { viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true };

async function signup(page, base, email, nick = "우럭왕") {
  await page.goto(`${base}/signup`);
  await page.getByLabel("닉네임").fill(nick);
  await page.getByLabel("이메일").fill(email);
  if (VERIFY[base]) {
    await sleep(2100); // 같은 주소 재요청 간격(테스트 모드 2초)
    await verifyEmail(page, base, email);
  }
  await page.getByLabel("비밀번호", { exact: true }).fill("fish1234");
  await page.getByLabel("비밀번호 확인").fill("fish1234");
  await page.getByText("전체 동의").click();
  await page.getByRole("button", { name: "가입하기" }).click();
}
async function login(page, base, email, pw = "fish1234") {
  await page.goto(`${base}/login`);
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(pw);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
}
const dialogs = (page) => page.on("dialog", (d) => d.accept());

// ───────── 1. 서버 계정 방식 ─────────
{
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  dialogs(page);
  await page.goto(SERVER);
  const pill = page.locator(".auth-pill");
  await pill.waitFor();
  check("홈(휴대폰) 상단에 로그인·가입 버튼", await pill.isVisible(), await pill.innerText());
  await pill.click();
  await page.waitForURL(/\/login/);
  const cta = page.locator(".signup-cta");
  check("로그인 화면에 회원가입 버튼", await cta.isVisible());
  // 가입 전에 이 기기에 즐겨찾기가 있던 상황
  await page.evaluate(() => localStorage.setItem("fc:favs", JSON.stringify(["sinjin-outer"])));
  await cta.click();
  await page.waitForURL(/\/signup/);
  await page.getByRole("button", { name: "가입하기" }).waitFor();
  check("가입 화면에 '이 기기' 안내 없음(서버 방식)", (await page.locator(".device-note").count()) === 0);

  await page.getByRole("button", { name: "가입하기" }).click();
  check("빈 입력이면 오류 표시", (await page.locator(".field-err").count()) > 0);

  // 이메일 인증 없이 가입 시도 → 화면과 서버 모두에서 막힘
  const nov = E("noverify");
  await page.getByLabel("닉네임").fill("인증안함");
  await page.getByLabel("이메일").fill(nov);
  await page.getByLabel("비밀번호", { exact: true }).fill("fish1234");
  await page.getByLabel("비밀번호 확인").fill("fish1234");
  await page.getByText("전체 동의").click();
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByText("이메일 인증을 완료해 주세요").waitFor();
  check("[인증] 인증 안 하면 가입 버튼이 막힘", true);
  const bypass = await page.evaluate((email) =>
    fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: "fish1234", nickname: "우회", agree: true }) }).then(async (r) => [r.status, (await r.json()).code]),
  nov);
  check("[인증] 화면을 건너뛰고 서버에 바로 보내도 막힘", bypass[0] === 400 && bypass[1] === "email_not_verified", JSON.stringify(bypass));
  // 틀린 번호
  await page.getByRole("button", { name: /인증번호 받기/ }).click();
  await page.getByPlaceholder("인증번호 6자리").fill("000000");
  await page.getByRole("button", { name: "확인", exact: true }).click();
  const wrongOk = await page.getByText(/인증번호가 맞지 않아요|유효시간/).first().waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
  const code = await lastCode(SERVER, nov);
  check("[인증] 틀린 번호 안내 (남은 횟수)", wrongOk || code === "000000");
  const subject = (await fetch(`${SERVER}/api/verify/outbox?to=${encodeURIComponent(nov)}`).then((r) => r.json())).mails.at(-1).subject;
  check("[인증] 인증 메일 제목에 번호", /\[피싱체크\] 회원가입 인증번호 \d{6}/.test(subject), subject);

  await signup(page, SERVER, E("Fish").replace("@test", "@Test"));
  await page.waitForURL(/\/account/, { timeout: 15000 });
  await page.getByText("가입을 환영해요").waitFor();
  check("가입 → 내 계정 화면 + 환영 문구", true);
  check("닉네임 표시", await page.locator("main").getByText("우럭왕 님").isVisible());
  const sess = (await ctx.cookies()).find((c) => c.name === "fc_sess");
  check("로그인 쿠키는 httpOnly", !!sess?.httpOnly);
  await page.getByText(/즐겨찾기 1곳/).waitFor({ timeout: 10000 });
  const data = await page.evaluate(() => fetch("/api/auth/data").then((r) => r.json()));
  check("기기 즐겨찾기가 계정에 올라감", JSON.stringify(data.favs) === '["sinjin-outer"]');

  await page.getByRole("button", { name: /닉네임/ }).click();
  await page.getByLabel("새 닉네임").fill("감성돔왕");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.locator("main").getByText("감성돔왕 님").waitFor();
  check("닉네임 변경", true);

  await page.goto(`${SERVER}/settings`);
  await page.locator(".profile-card").getByText("감성돔왕 님").waitFor();
  check("설정 화면에 로그인 상태 + 로그아웃 버튼", await page.locator(".profile-card").getByRole("button", { name: "로그아웃" }).isVisible());

  await page.locator(".profile-card").getByRole("button", { name: "로그아웃" }).click();
  await page.locator(".profile-card").getByRole("link", { name: "회원가입" }).waitFor();
  const favsAfter = await page.evaluate(() => localStorage.getItem("fc:favs"));
  check("로그아웃 → 가입·로그인 카드로 바뀜, 기기 기록 정리", favsAfter === "[]", favsAfter ?? "");
  const me = await page.evaluate(() => fetch("/api/auth/me").then((r) => r.json()));
  check("서버 세션도 끝남", me.user === null);

  await login(page, SERVER, E("fish"), "wrong1234");
  await page.getByText("이메일 또는 비밀번호가 맞지 않아요.").waitFor();
  check("틀린 비밀번호 안내", true);

  // 다른 기기(새 브라우저)에서 로그인 → 즐겨찾기 복원
  const ctx2 = await browser.newContext(phone);
  const p2 = await ctx2.newPage();
  dialogs(p2);
  await login(p2, SERVER, E("fish").toUpperCase());
  await p2.waitForURL(/\/account/);
  await p2.getByText(/즐겨찾기 1곳/).waitFor({ timeout: 10000 });
  const f2 = await p2.evaluate(() => localStorage.getItem("fc:favs"));
  check("다른 기기 로그인 → 즐겨찾기 복원", f2 === '["sinjin-outer"]', f2 ?? "");
  await p2.goto(SERVER);
  await p2.getByRole("link", { name: "내 계정" }).first().waitFor();
  check("로그인 후 홈 상단은 내 계정 아이콘", (await p2.locator(".auth-pill").count()) === 0);

  await p2.goto(`${SERVER}/auth/update-password`);
  await p2.getByLabel("지금 비밀번호").fill("fish1234");
  await p2.getByLabel("새 비밀번호", { exact: true }).fill("bream5678");
  await p2.getByLabel("새 비밀번호 확인").fill("bream5678");
  await p2.getByRole("button", { name: "비밀번호 바꾸기" }).click();
  await p2.getByText("비밀번호를 바꿨어요.").waitFor();
  check("비밀번호 변경", true);

  const ctx3 = await browser.newContext(phone);
  const p3 = await ctx3.newPage();
  await signup(p3, SERVER, E("fish"));
  await p3.getByText("이미 가입된 이메일이에요").waitFor();
  check("같은 이메일 중복 가입 막기", true);

  // 비밀번호 찾기: 이메일 인증번호 → 새 비밀번호 (다른 기기에서)
  await p3.goto(`${SERVER}/auth/reset`);
  await p3.getByLabel("가입한 이메일").fill(E("fish"));
  await sleep(2100);
  await verifyEmail(p3, SERVER, E("fish"));
  await p3.getByLabel("새 비밀번호", { exact: true }).fill("trout9012");
  await p3.getByLabel("새 비밀번호 확인").fill("trout9012");
  await p3.getByRole("button", { name: "비밀번호 바꾸기" }).click();
  await p3.getByText("비밀번호를 바꿨어요.").waitFor();
  check("[인증] 비밀번호 찾기 → 새 비밀번호 → 바로 로그인", true);
  const p2me = await p2.evaluate(() => fetch("/api/auth/me").then((r) => r.json()));
  check("[인증] 재설정하면 다른 기기 로그인은 풀림", p2me.user === null);
  await ctx3.close();
  await login(p2, SERVER, E("fish"), "trout9012");
  await p2.waitForURL(/\/account/);

  await p2.goto(`${SERVER}/account`);
  await p2.getByRole("button", { name: /회원 탈퇴/ }).click();
  await p2.getByLabel("확인을 위해 비밀번호를 입력해 주세요").fill("trout9012");
  await p2.getByRole("button", { name: "탈퇴하기" }).click();
  await p2.waitForURL(`${SERVER}/`);
  await login(p2, SERVER, E("fish"), "trout9012");
  await p2.getByText("이메일 또는 비밀번호가 맞지 않아요.").waitFor();
  check("탈퇴 후 로그인 불가", true);

  const forged = await fetch(`${SERVER}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ email: "a@b.cd", password: "x" }),
  });
  check("다른 사이트에서 보낸 요청 막기", forged.status === 403);
  await ctx.close();
  await ctx2.close();
}

// ───────── 2. 이 기기 계정 방식 (저장소 없음) ─────────
{
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  dialogs(page);
  await page.goto(`${LOCAL}/signup`);
  await page.locator(".device-note").waitFor();
  check("[기기] 가입 화면 표시 + 이 기기 안내", true);
  await signup(page, LOCAL, E("local"), "갯바위");
  await page.waitForURL(/\/account/, { timeout: 15000 });
  await page.locator("main").getByText("갯바위 님").waitFor();
  check("[기기] 가입 → 내 계정", true);
  const stored = await page.evaluate(() => localStorage.getItem("fc:accounts"));
  check("[기기] 비밀번호 원문 저장 안 함", !!stored && !stored.includes("fish1234"));
  await page.goto(`${LOCAL}/settings`);
  await page.locator(".profile-card").getByRole("button", { name: "로그아웃" }).click();
  await page.locator(".profile-card").getByRole("link", { name: "회원가입" }).waitFor();
  check("[기기] 로그아웃", true);
  await login(page, LOCAL, E("local"), "nope12345");
  await page.getByText("이메일 또는 비밀번호가 맞지 않아요.").waitFor();
  await login(page, LOCAL, E("local"));
  await page.waitForURL(/\/account/);
  await page.locator("main").getByText("갯바위 님").waitFor();
  check("[기기] 다시 로그인", true);
  await page.goto(`${LOCAL}/settings`);
  await page.locator(".profile-card").getByRole("button", { name: "로그아웃" }).click();
  await page.locator(".profile-card").getByRole("link", { name: "회원가입" }).waitFor();
  await page.goto(`${LOCAL}/auth/reset`);
  await page.getByLabel("가입한 이메일").fill(E("local"));
  await sleep(2100);
  await verifyEmail(page, LOCAL, E("local"));
  await page.getByLabel("새 비밀번호", { exact: true }).fill("fish1234x");
  await page.getByLabel("새 비밀번호 확인").fill("fish1234x");
  await page.getByRole("button", { name: "비밀번호 바꾸기" }).click();
  await page.getByText("비밀번호를 바꿨어요.").waitFor();
  check("[기기] 이메일 인증으로 비밀번호 찾기", true);
  await page.getByRole("button", { name: /회원 탈퇴/ }).click();
  await page.getByLabel("확인을 위해 비밀번호를 입력해 주세요").fill("fish1234x");
  await page.getByRole("button", { name: "탈퇴하기" }).click();
  await page.waitForURL(`${LOCAL}/`);
  const left = await page.evaluate(() => localStorage.getItem("fc:accounts"));
  check("[기기] 탈퇴하면 계정 삭제", left === "{}", left ?? "");
  await ctx.close();
}

// ───────── 3. 메일 설정이 없으면 인증 없이 가입 ─────────
{
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await signup(page, PLAIN, E("plain"), "설정없음");
  await page.waitForURL(/\/account/, { timeout: 15000 });
  check("[설정 없음] 인증 칸 없이 가입", (await page.getByRole("button", { name: /인증번호 받기/ }).count()) === 0);
  await ctx.close();
}

// ───────── 4. 데스크톱 상단 ─────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(SERVER);
  await page.locator(".topbar").getByRole("link", { name: "회원가입" }).waitFor();
  check("데스크톱 상단에 로그인 + 회원가입", await page.locator(".topbar").getByRole("link", { name: "로그인" }).isVisible());
  await ctx.close();
}

await browser.close();
const bad = results.filter((x) => !x).length;
console.log(`\n${results.length - bad}/${results.length} 통과`);
process.exit(bad ? 1 : 0);
