/**
 * 회원 기능 E2E 점검 (가짜 Supabase 서버 사용).
 *
 *   1) 가짜 서버 주소로 빌드:
 *      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon NEXT_PUBLIC_AUTH_KAKAO=1 npm run build
 *   2) 서버 실행: SUPABASE_SERVICE_ROLE_KEY=eyJtest NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon npx next start -p 3100
 *   3) node scripts/auth-e2e.mjs
 *
 * 가입 → 메일 인증 안내 → 로그인 → 기기 즐겨찾기 업로드 → 닉네임 변경 → 로그아웃(기기 정리) → 재로그인 복원 → 탈퇴 순서로 확인한다.
 * 끝나면 반드시 환경변수 없이 다시 빌드할 것 (빌드 결과에 가짜 주소가 들어가 있음).
 */
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const PORT = 54321;

// ───────── 가짜 Supabase ─────────
const users = new Map(); // email → user
const tokens = new Map(); // token → user id
const profiles = new Map(); // id → { nickname }
const favorites = new Set(); // `${uid}|${spot}`
const logs = new Map(); // `${uid}|${id}` → data
const calls = [];
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (u) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const pub = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: u.confirmed, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: u.meta, identities: [{ id: u.id, provider: "email" }], created_at: u.created });
const session = (u) => {
  const access_token = jwt(u);
  tokens.set(access_token, u.id);
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: `r-${u.id}-${Date.now()}`, user: pub(u) };
};
const eq = (q, k) => q.get(k)?.replace(/^eq\./, "");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let body = "";
  for await (const c of req) body += c;
  const json = body ? JSON.parse(body) : null;
  calls.push(`${req.method} ${url.pathname}`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  const send = (code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(obj === undefined ? "" : JSON.stringify(obj));
  };
  if (req.method === "OPTIONS") return send(204);
  const uid = tokens.get((req.headers.authorization ?? "").replace(/^Bearer /, ""));
  const p = url.pathname;

  if (p === "/__state") return send(200, { favorites: [...favorites], profiles: Object.fromEntries(profiles), users: [...users.keys()], logs: logs.size });
  if (p === "/auth/v1/signup" && req.method === "POST") {
    if (users.has(json.email)) return send(200, { id: "00000000-0000-0000-0000-000000000000", email: json.email, identities: [], user_metadata: {} });
    const u = { id: crypto.randomUUID(), email: json.email, password: json.password, meta: json.data ?? {}, created: new Date().toISOString(), confirmed: null };
    users.set(json.email, u);
    profiles.set(u.id, { nickname: u.meta.nickname });
    return send(200, pub(u)); // 메일 인증이 필요한 설정: 세션 없이 사용자만
  }
  if (p === "/auth/v1/token") {
    const g = url.searchParams.get("grant_type");
    if (g === "password") {
      const u = users.get(json.email);
      if (!u || u.password !== json.password) return send(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
      u.confirmed ??= new Date().toISOString(); // 테스트에서는 메일 인증을 마친 것으로 본다
      return send(200, session(u));
    }
    if (g === "refresh_token") {
      const id = json.refresh_token.split("-").slice(1, 6).join("-");
      const u = [...users.values()].find((x) => x.id === id);
      return u ? send(200, session(u)) : send(400, { error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
    }
  }
  if (p === "/auth/v1/user" && req.method === "GET") {
    const u = [...users.values()].find((x) => x.id === uid);
    return u ? send(200, pub(u)) : send(401, { msg: "invalid JWT" });
  }
  if (p === "/auth/v1/logout") return send(204);
  if (p === "/auth/v1/recover") return send(200, {});
  if (p.startsWith("/auth/v1/admin/users/") && req.method === "DELETE") {
    if (!(req.headers.apikey ?? "").startsWith("eyJ")) return send(401, { msg: "not admin" });
    const id = p.split("/").pop();
    for (const [e, u] of users) if (u.id === id) users.delete(e);
    profiles.delete(id);
    for (const k of [...favorites]) if (k.startsWith(id)) favorites.delete(k);
    return send(200, {});
  }
  if (p.startsWith("/rest/v1/")) {
    if (!uid) return send(401, { message: "JWT required" });
    const table = p.split("/").pop();
    const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    if (table === "profiles") {
      if (req.method === "GET") {
        const row = eq(url.searchParams, "id") === uid ? profiles.get(uid) : null;
        return single ? (row ? send(200, row) : send(406, { code: "PGRST116" })) : send(200, row ? [row] : []);
      }
      if (req.method === "PATCH") {
        profiles.set(uid, { ...profiles.get(uid), nickname: json.nickname });
        return send(204);
      }
    }
    if (table === "favorites") {
      if (req.method === "GET") return send(200, [...favorites].filter((k) => k.startsWith(uid)).map((k) => ({ spot_id: k.split("|")[1] })));
      if (req.method === "POST") {
        for (const r of [json].flat()) if (r.user_id === uid) favorites.add(`${uid}|${r.spot_id}`);
        return send(201);
      }
      if (req.method === "DELETE") {
        favorites.delete(`${uid}|${eq(url.searchParams, "spot_id")}`);
        return send(204);
      }
    }
    if (table === "catch_logs") {
      if (req.method === "GET") return send(200, [...logs].filter(([k]) => k.startsWith(uid)).map(([, data]) => ({ data })));
      if (req.method === "POST") {
        for (const r of [json].flat()) if (r.user_id === uid) logs.set(`${uid}|${r.id}`, r.data);
        return send(201);
      }
      if (req.method === "DELETE") {
        logs.delete(`${uid}|${eq(url.searchParams, "id")}`);
        return send(204);
      }
    }
  }
  send(404, { msg: `mock: ${req.method} ${p}` });
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ───────── 시나리오 ─────────
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? ` — ${extra}` : ""}`);
};
const state = async () => (await fetch(`http://127.0.0.1:${PORT}/__state`)).json();

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const AXE = require.resolve("axe-core/axe.min.js");
const axe = async (name) => {
  await page.addScriptTag({ path: AXE });
  const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id}(${x.nodes.length})`));
  check(`접근성 위반 없음: ${name}`, v.length === 0, v.join(", "));
};

try {
  // 1. 가입 전 이 기기에 즐겨찾기 1개
  await page.goto(`${BASE}/`);
  await page.evaluate(() => localStorage.setItem("fc:favs", JSON.stringify(["sinjin-outer"])));

  // 2. 가입 폼 검사
  await page.goto(`${BASE}/signup`);
  await axe("가입");
  check("카카오 버튼 표시", (await page.getByRole("button", { name: "카카오로 시작하기" }).count()) === 1);
  await page.getByRole("button", { name: "가입하기" }).click();
  check("빈 칸 오류 안내", (await page.getByText("닉네임을 입력해 주세요.").count()) === 1 && (await page.getByText("이메일을 입력해 주세요.").count()) === 1);
  await page.getByLabel("닉네임").fill("우럭왕");
  await page.getByLabel("이메일").fill("fish@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("gofish2026");
  await page.getByLabel("비밀번호 확인").fill("gofish2026");
  await page.getByRole("button", { name: "가입하기" }).click();
  check("필수 동의 없으면 막힘", (await page.getByText("필수 항목에 동의해 주세요.").count()) === 1);
  await page.getByLabel("전체 동의").check();
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByText("메일을 확인해 주세요").waitFor({ timeout: 8000 });
  check("가입 후 메일 인증 안내", true);
  const s1 = await state();
  check("가입 정보·닉네임 저장", s1.users.includes("fish@example.com") && Object.values(s1.profiles).some((p) => p.nickname === "우럭왕"));

  // 3. 같은 메일 재가입
  await page.goto(`${BASE}/signup`);
  await page.getByLabel("닉네임").fill("우럭왕2");
  await page.getByLabel("이메일").fill("fish@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("gofish2026");
  await page.getByLabel("비밀번호 확인").fill("gofish2026");
  await page.getByLabel("전체 동의").check();
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByText("이미 가입된 이메일이에요").waitFor({ timeout: 8000 });
  check("중복 가입 안내", true);

  // 4. 틀린 비밀번호
  await page.goto(`${BASE}/login?next=/log`);
  await axe("로그인");
  await page.getByLabel("이메일").fill("fish@example.com");
  await page.getByLabel("비밀번호").fill("wrongpass1");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.getByText("이메일 또는 비밀번호가 맞지 않아요.").waitFor({ timeout: 8000 });
  check("틀린 비밀번호 안내", true);

  // 5. 로그인 → next 로 이동, 기기 즐겨찾기 업로드
  await page.getByLabel("비밀번호").fill("gofish2026");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL(/\/log$/, { timeout: 8000 });
  check("로그인 후 원래 화면(/log)으로", true);
  await page.locator("main").getByText("우럭왕 님").first().waitFor({ timeout: 8000 });
  check("내 기록 화면에 계정 카드", true);
  await page.waitForTimeout(800);
  const s2 = await state();
  check("기기 즐겨찾기가 계정에 올라감", s2.favorites.some((f) => f.endsWith("|sinjin-outer")), JSON.stringify(s2.favorites));

  // 5-1. 조과 기록 → 서버 반영
  await page.getByRole("button", { name: "조과 기록 추가하기" }).click();
  await page.getByRole("button", { name: "기록 저장" }).click();
  await page.getByText(/저장했어요/).waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);
  check("조과 기록이 계정에 저장", (await state()).logs === 1);

  // 6. 즐겨찾기 추가 → 서버 반영
  await page.goto(`${BASE}/spot/jumunjin`);
  await page.getByRole("button", { name: "즐겨찾기 추가" }).click();
  await page.waitForTimeout(800);
  check("로그인 중 즐겨찾기가 바로 저장", (await state()).favorites.some((f) => f.endsWith("|jumunjin")));

  // 7. 내 계정: 닉네임 변경
  await page.goto(`${BASE}/account`);
  await axe("내 계정");
  await page.getByRole("button", { name: /닉네임/ }).click();
  await page.getByLabel("새 닉네임").fill("광어왕");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.locator("main").getByText("광어왕 님").first().waitFor({ timeout: 8000 });
  check("닉네임 변경", Object.values((await state()).profiles).some((p) => p.nickname === "광어왕"));

  // 8. 로그아웃 → 기기 데이터 정리
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 8000 });
  const localAfter = await page.evaluate(() => localStorage.getItem("fc:favs"));
  check("로그아웃하면 이 기기 즐겨찾기 정리", localAfter === "[]", localAfter ?? "null");

  // 9. 다시 로그인 → 복원
  await page.goto(`${BASE}/login`);
  await page.getByLabel("이메일").fill("fish@example.com");
  await page.getByLabel("비밀번호").fill("gofish2026");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL(/\/account$/, { timeout: 8000 });
  await page.waitForTimeout(800);
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("fc:favs") || "[]"));
  check("다시 로그인하면 즐겨찾기 복원", restored.includes("sinjin-outer") && restored.includes("jumunjin"), JSON.stringify(restored));
  const logsBack = await page.evaluate(() => JSON.parse(localStorage.getItem("fc:log") || "[]").length);
  check("다시 로그인하면 조과 기록 복원", logsBack === 1, String(logsBack));

  // 10. 탈퇴
  await page.getByRole("button", { name: /회원 탈퇴/ }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 8000 });
  const s3 = await state();
  check("탈퇴하면 계정·데이터 삭제", !s3.users.includes("fish@example.com") && s3.favorites.length === 0);

  check("페이지 오류 없음", errors.length === 0, errors.slice(0, 3).join(" / "));
} catch (e) {
  check("시나리오 진행", false, String(e).slice(0, 300));
  await page.screenshot({ path: path.join(os.tmpdir(), "auth-e2e-fail.png") }).catch(() => {});
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} 통과`);
process.exit(failed ? 1 : 0);
