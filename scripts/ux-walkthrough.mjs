/**
 * UX 시뮬레이션: 페르소나별 사용 흐름을 실제 브라우저(모바일 360·390px, 데스크톱)로 실행하고
 * 레이아웃·접근성·흐름 마찰을 자동 점검한다.
 *
 *   BASE_URL=http://localhost:3100 OUT=docs/sim node scripts/ux-walkthrough.mjs
 *   (시뮬레이션 모드 흐름은 서버를 FISHING_SIM_ENABLED=1 로 띄워야 동작)
 *
 * 필요: devDependencies 의 playwright, axe-core. 브라우저는 PW_CHROMIUM(실행 파일 경로) 또는 playwright 기본.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = process.env.OUT ?? "docs/sim";
const LABEL = process.env.LABEL ?? "current";
const SHOTS = path.join(OUT, `shots-${LABEL}`);
mkdirSync(SHOTS, { recursive: true });
const AXE = require.resolve("axe-core/axe.min.js");

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

const findings = []; // { persona, severity, area, text }
const metrics = []; // { page, width, ms, overflowX, smallTaps, tinyText, axe }
const note = (persona, severity, area, text) => findings.push({ persona, severity, area, text });

async function audit(page, name, width) {
  const r = await page.evaluate(() => {
    const vw = window.innerWidth;
    const overflowX = document.scrollingElement.scrollWidth - vw;
    const visible = (el) => {
      const b = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return b.width > 0 && b.height > 0 && b.right > 0 && b.left < vw && st.visibility !== "hidden" && st.display !== "none";
    };
    const taps = [...document.querySelectorAll("a, button, [role=button], select, input")].filter(visible);
    const small = taps
      .map((el) => ({ el, b: el.getBoundingClientRect() }))
      .filter(({ b }) => b.height < 40 || b.width < 40)
      .map(({ el, b }) => `${el.tagName.toLowerCase()}「${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 18)}」${Math.round(b.width)}×${Math.round(b.height)}`);
    const tiny = [...document.querySelectorAll("body *")]
      .filter((el) => el.children.length === 0 && el.textContent.trim() && visible(el))
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12).length;
    const clipped = [...document.querySelectorAll("body *")]
      .filter((el) => visible(el) && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === "hidden").length;
    return { overflowX, small, tiny, clipped };
  });
  await page.addScriptTag({ path: AXE });
  const axe = await page.evaluate(async () => {
    const res = await window.axe.run(document, { resultTypes: ["violations"], runOnly: ["wcag2a", "wcag2aa"] });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, target: String(v.nodes[0]?.target?.[0] ?? "").slice(0, 40) }));
  });
  metrics.push({ page: name, width, overflowX: r.overflowX, smallTaps: r.small.length, smallList: r.small.slice(0, 6), tinyText: r.tiny, clipped: r.clipped, axe });
  return r;
}

async function newPage(width, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 700 ? 800 : 900 },
    deviceScaleFactor: 2,
    isMobile: width < 700,
    hasTouch: width < 700,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    ...opts,
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && page.errors.push(m.text()));
  return page;
}

async function visit(page, url, name) {
  const t0 = Date.now();
  const res = await page.goto(BASE + url, { waitUntil: "networkidle" });
  const ms = Date.now() - t0;
  metrics.push({ page: name, width: page.viewportSize().width, ms, status: res?.status() });
  return { ms, status: res?.status() };
}

const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const text = (page) => page.evaluate(() => document.body.innerText);
const aboveFold = (page, re) =>
  page.evaluate((src) => {
    const rx = new RegExp(src);
    const h = window.innerHeight;
    return [...document.querySelectorAll("body *")].some((el) => el.children.length === 0 && rx.test(el.textContent) && el.getBoundingClientRect().top < h && el.getBoundingClientRect().bottom > 0);
  }, re.source);

// ───────────── P1 민수: 수도권 주말 워킹꾼 (태안) ─────────────
{
  const P = "P1 주말 워킹꾼(태안·우럭)";
  const page = await newPage(390, { geolocation: { latitude: 36.67, longitude: 126.14 }, permissions: ["geolocation"] });
  await visit(page, "/", "home");
  await page.waitForTimeout(800);
  await audit(page, "home", 390);
  await shot(page, "p1-home");
  const btn = page.getByRole("button", { name: /내 주변/ });
  if (await btn.count()) {
    await btn.click();
    await page.waitForTimeout(1500);
    const t = await text(page);
    if (!/신진도|안흥|태안/.test(t)) note(P, "높음", "홈", "위치 기반 추천에 가장 가까운 태안 포인트가 보이지 않음");
  } else note(P, "높음", "홈", "'내 주변' 진입 버튼 없음");
  await page.waitForTimeout(1500);
  if (!(await aboveFold(page, /주말|^토|^일|\(토\)|\(일\)/))) note(P, "중간", "홈", "첫 화면에 '이번 주말' 판단이 없음 — 주말 출조가 핵심 사용 순간");
  await visit(page, "/spot/sinjin-outer", "spot");
  await page.waitForTimeout(500);
  await audit(page, "spot", 390);
  await shot(page, "p1-spot");
  if (!(await aboveFold(page, /골든타임|🎯|\d{2}:\d{2} – \d{2}:\d{2}/))) note(P, "높음", "포인트", "첫 화면(스크롤 없이)에서 골든타임이 보이지 않음");
  const t = await text(page);
  if (!/지금|현재/.test(t)) note(P, "높음", "포인트", "현장에서 필요한 '지금 물때 상황(들물/썰물, 다음 만조까지)'이 없음");
  const hasGolden = await page.locator(".golden:not(.passed) .time").count();
  if (hasGolden && !(await page.locator("a[href*='/api/ics']").count())) note(P, "낮음", "포인트", "골든타임을 캘린더·알림으로 저장할 방법이 없음");
  if (page.errors.length) note(P, "높음", "오류", page.errors.slice(0, 3).join(" / "));
  await page.context().close();
}

// ───────────── P2 지은: 가족 입문자 (학꽁치, 안전·편의) ─────────────
{
  const P = "P2 가족 입문자(학꽁치)";
  const page = await newPage(360);
  await visit(page, "/fish", "fish-list");
  await audit(page, "fish-list", 360);
  await page.getByRole("link", { name: /학꽁치/ }).first().click();
  await page.waitForLoadState("networkidle");
  await audit(page, "fish-detail", 360);
  await shot(page, "p2-fish");
  await visit(page, "/spots", "spots");
  await audit(page, "spots", 360);
  await shot(page, "p2-spots");
  const t = await text(page);
  if (!(await page.locator("input[type=search], input[placeholder*='검색']").count())) note(P, "중간", "포인트 목록", "포인트 검색창이 없음 (항구명으로 찾기 불가)");
  if (!/화장실|가족|초보/.test(t)) note(P, "중간", "포인트 목록", "화장실·주차·초보 추천 같은 편의 필터가 없음");
  const g = await (await fetch(BASE + "/spot/sinjin-inner")).text();
  if (!/물때|사리|조금/.test(g) || !/용어|도움말|\?/.test(g)) note(P, "중간", "용어", "물때·사리·조금·들물 등 용어 설명이 없음 — 입문자 이탈 요인");
  if (page.errors.length) note(P, "높음", "오류", page.errors.slice(0, 3).join(" / "));
  await page.context().close();
}

// ───────────── P3 정호: 선상 주꾸미 (오천항) ─────────────
{
  const P = "P3 선상 주꾸미(오천항)";
  const page = await newPage(390);
  await visit(page, "/spot/ocheon-boat?species=webfoot", "spot-boat");
  await shot(page, "p3-boat");
  const t = await text(page);
  const goldenTimes = await page.locator(".golden .time").allInnerTexts();
  if (goldenTimes.some((g) => /(^|\s)(0[0-3]|1[7-9]|2[0-3]):\d{2} –/.test(g))) note(P, "높음", "엔진", `선상 포인트에 출항 시간 외 골든타임이 표시됨 (${goldenTimes.join(", ")})`);
  const tabs = await page.locator("nav[aria-label*='어종'] a").allInnerTexts();
  if (!tabs.some((x) => /\d/.test(x))) note(P, "중간", "포인트", "어종 탭에 점수가 없어 어떤 어종이 오늘 좋은지 비교 불가");
  if (page.errors.length) note(P, "높음", "오류", page.errors.slice(0, 3).join(" / "));
  await page.context().close();
}

// ───────────── P4 태윤: 동해 너울 (시뮬레이션) ─────────────
{
  const P = "P4 동해 루어꾼(너울)";
  const page = await newPage(390);
  const r = await visit(page, "/spot/hajodae-rock?sim=swell&simHour=9", "spot-swell");
  await shot(page, "p4-swell");
  const t = await text(page);
  if (!/시뮬레이션/.test(t)) note(P, "정보", "시뮬레이션", "시뮬레이션 모드 미지원 버전 — 위험 시나리오 화면 점검 불가");
  else {
    if (!/위험/.test(t)) note(P, "높음", "안전", "너울 시나리오인데 위험 표시가 없음");
    if (!/대신|대체/.test(t)) note(P, "높음", "안전", "위험일에 대체 포인트 제안이 없음");
    if (!/구명조끼|안전 수칙/.test(t)) note(P, "중간", "안전", "위험·주의 상황에서 안전 수칙 안내가 없음");
  }
  if (page.errors.length) note(P, "높음", "오류", page.errors.slice(0, 3).join(" / "));
  await page.context().close();
}

// ───────────── P5 현장: 오후 3시 방파제 위 ─────────────
{
  const P = "P5 현장 사용자(오후 3시)";
  const page = await newPage(390);
  await visit(page, "/spot/sinjin-outer?simHour=15", "spot-15h");
  await shot(page, "p5-15h");
  const t = await text(page);
  const passed = await page.evaluate(() => {
    const el = document.querySelector(".golden .time");
    return el ? el.textContent : "";
  });
  if (passed && /^🎯?\s*(0\d|1[0-4]):/.test(passed.trim()) && !/지남|지난/.test(t)) note(P, "높음", "포인트", `이미 지난 골든타임(${passed.trim()})이 1순위로 표시됨`);
  if (!/만조까지|간조까지/.test(t)) note(P, "높음", "포인트", "다음 만조·간조까지 남은 시간이 없음");
  await page.context().close();
}

// ───────────── P6 태풍 주간 홈 ─────────────
{
  const P = "P6 태풍 주간";
  const page = await newPage(390);
  await visit(page, "/?sim=typhoon", "home-typhoon");
  await page.waitForTimeout(1200);
  await shot(page, "p6-typhoon");
  const t = await text(page);
  if (/시뮬레이션/.test(t) && !/위험|⚠/.test(t)) note(P, "높음", "홈", "태풍 시나리오에서 홈에 위험 경고가 없음");
  await page.context().close();
}

// ───────────── P7 조황 기록 흐름 ─────────────
{
  const P = "P7 조황 기록";
  const page = await newPage(390);
  await visit(page, "/spot/sinjin-outer", "spot-for-log");
  const hasLogLink = await page.locator("main a[href*='/log']").count();
  if (!hasLogLink) note(P, "중간", "포인트", "포인트 화면에서 바로 조황 기록으로 가는 버튼이 없음 (탭바 → 포인트 재선택 필요)");
  await visit(page, "/log?spot=sinjin-outer&species=rockfish", "log");
  await audit(page, "log", 390);
  const sel = await page.locator("select").first().inputValue().catch(() => "");
  if (sel !== "sinjin-outer") note(P, "낮음", "기록", "기록 화면이 진입한 포인트를 미리 선택하지 않음");
  await page.context().close();
}

// ───────────── 데스크톱 ─────────────
{
  const page = await newPage(1280);
  await visit(page, "/spot/jumunjin", "spot-desktop");
  await audit(page, "spot-desktop", 1280);
  await shot(page, "desktop-spot");
  await page.context().close();
}

// ───────────── PWA ─────────────
{
  const man = await (await fetch(BASE + "/manifest.webmanifest")).json();
  const png = (man.icons ?? []).filter((i) => /png/.test(i.type ?? i.src));
  if (!png.some((i) => /192/.test(i.sizes)) || !png.some((i) => /512/.test(i.sizes))) note("PWA", "중간", "설치", "manifest 에 192·512px PNG 아이콘이 없어 일부 안드로이드·iOS에서 홈 화면 설치 품질 저하");
  const html = await (await fetch(BASE + "/")).text();
  if (!/apple-touch-icon[^>]+png/.test(html)) note("PWA", "낮음", "설치", "apple-touch-icon PNG 없음 (iOS 홈 화면 아이콘)");
}

await browser.close();

// ───────────── 리포트 ─────────────
const sevOrder = { 높음: 0, 중간: 1, 낮음: 2, 정보: 3 };
findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
const audits = metrics.filter((m) => m.axe);
const loads = metrics.filter((m) => m.ms != null);
const md = `# UX 시뮬레이션 리포트 (${LABEL})

- 대상: ${BASE} · 페르소나 7종 + 데스크톱 + PWA 점검
- 발견 사항: **${findings.length}건** (높음 ${findings.filter((f) => f.severity === "높음").length} · 중간 ${findings.filter((f) => f.severity === "중간").length} · 낮음 ${findings.filter((f) => f.severity === "낮음").length})

## 1. 흐름 점검 결과

| 심각도 | 페르소나 | 영역 | 내용 |
|---|---|---|---|
${findings.map((f) => `| ${f.severity} | ${f.persona} | ${f.area} | ${f.text} |`).join("\n") || "| - | - | - | 없음 |"}

## 2. 레이아웃·접근성 자동 점검

| 페이지 | 폭 | 가로 넘침(px) | 40px 미만 터치 대상 | 12px 미만 글자 | 접근성 위반(axe) |
|---|---|---|---|---|---|
${audits.map((m) => `| ${m.page} | ${m.width} | ${m.overflowX > 0 ? `⚠ ${m.overflowX}` : "0"} | ${m.smallTaps}${m.smallList.length ? ` (${m.smallList.slice(0, 3).join(", ")})` : ""} | ${m.tinyText} | ${m.axe.map((a) => `${a.id}(${a.impact}, ${a.n}: \`${a.target}\`)`).join(", ") || "없음"} |`).join("\n")}

## 3. 페이지 응답 시간

| 페이지 | 폭 | 상태 | 로드(ms) |
|---|---|---|---|
${loads.map((m) => `| ${m.page} | ${m.width} | ${m.status} | ${m.ms} |`).join("\n")}

스크린샷: \`${SHOTS}/\`
`;
writeFileSync(path.join(OUT, `ux-report-${LABEL}.md`), md);
console.log(md);
