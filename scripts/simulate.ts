/**
 * 엔진 대량 시뮬레이션: 포인트 × 어종 × 12개월 × 기상 시나리오
 *   npm run simulate            → docs/sim/engine-report.md 생성
 * 불변식(안전·금어기·골든타임 규칙)을 검사하고 점수 분포·변별력·시즌 정합성을 통계로 낸다.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { SPECIES_BY_ID } from "../src/data/species";
import { SPOTS, SPOT_TYPE_LABEL, nearbySpots } from "../src/data/spots";
import { kstDateString } from "../src/lib/engine/astro";
import { isClosedSeason, scoreForecast } from "../src/lib/engine/score";
import { rankSpeciesForSpot } from "../src/lib/forecast";
import { SCENARIOS, scenarioBundle, type ScenarioId } from "../src/lib/sim/scenarios";
import type { ForecastResult, Species, Spot } from "../src/lib/types";

const HOUR = 3600e3;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const SCEN = Object.keys(SCENARIOS) as ScenarioId[];
const EXPOSED = new Set(["OUTER_HARBOR", "BREAKWATER_TIP", "ROCK", "SURF"]);

interface Violation { rule: string; detail: string }
const violations: Violation[] = [];
const violate = (rule: string, detail: string) => violations.push({ rule, detail });

const kstHour = (iso: string) => (new Date(iso).getUTCHours() + 9) % 24;
const dateOf = (m: number) => new Date(`2026-${String(m).padStart(2, "0")}-10T00:00:00+09:00`);

type Row = { spot: Spot; sp: Species; month: number; scen: ScenarioId; r: ForecastResult };
const rows: Row[] = [];
const t0 = performance.now();
let runs = 0;

for (const spot of SPOTS) {
  for (const month of MONTHS) {
    for (const scen of SCEN) {
      const bundle = scenarioBundle(spot, scen, dateOf(month), 7);
      for (const id of spot.species) {
        const sp = SPECIES_BY_ID[id];
        const r = scoreForecast(spot, sp, bundle, { now: dateOf(month) });
        runs++;
        rows.push({ spot, sp, month, scen, r });
      }
    }
  }
}
const elapsed = performance.now() - t0;

// ───────── 불변식 검사 ─────────
for (const { spot, sp, month, scen, r } of rows) {
  const tag = `${spot.name}/${sp.name}/${month}월/${scen}`;
  for (const h of r.hours) {
    if (!Number.isFinite(h.score) || h.score < 0 || h.score > 100) violate("I1 점수 범위", `${tag} ${h.time} ${h.score}`);
  }
  // I2 금어기
  for (const h of r.hours) {
    if (isClosedSeason(sp, new Date(h.time)) && h.score !== 0) { violate("I2 금어기 0점", `${tag} ${h.time}`); break; }
  }
  // I3 태풍 절정(4일차 = index 3)은 모든 포인트 위험
  if (scen === "typhoon" && r.days[3].verdict !== "DANGER") violate("I3 태풍일 위험 판정", `${tag} verdict=${r.days[3].verdict} best=${r.days[3].best}`);
  // I4 동해 너울: 노출 포인트 위험, 내항은 위험 아님
  if (scen === "swell" && spot.sea === "EAST") {
    const d = r.days[2];
    if (EXPOSED.has(spot.type) && d.verdict !== "DANGER") violate("I4 너울 노출 포인트 위험", `${tag} ${d.verdict}`);
    if (spot.type === "INNER_HARBOR" && d.verdict === "DANGER") violate("I4 너울 내항 과잉 차단", `${tag}`);
  }
  // I5 해무: 선상 오전 위험
  if (scen === "fog" && spot.type === "BOAT") {
    const h6 = r.hours.find((h) => kstHour(h.time) === 6)!;
    if (h6.safety !== "DANGER") violate("I5 해무 선상 위험", `${tag} ${h6.safety}`);
  }
  // I6 골든타임 규칙
  for (const d of r.days) {
    for (const g of d.golden) {
      const len = (Date.parse(g.end) - Date.parse(g.start)) / HOUR;
      if (len > 4 || len <= 0) violate("I6 골든타임 길이", `${tag} ${d.date} ${len}h`);
      const inside = r.hours.filter((h) => Date.parse(h.time) >= Date.parse(g.start) && Date.parse(h.time) < Date.parse(g.end));
      if (inside.some((h) => h.safety === "DANGER")) violate("I6 골든타임에 위험 시간", `${tag} ${d.date}`);
      if (sp.light.night < 0.3 && inside.every((h) => kstHour(h.time) >= 0 && kstHour(h.time) < 4)) {
        violate("I7 주간 어종이 한밤 골든타임", `${tag} ${d.date} ${kstHour(g.start)}시`);
      }
    }
  }
  // I9 선상 출항 시간 외 골든타임 금지
  if (spot.type === "BOAT") {
    for (const d of r.days) for (const g of d.golden) {
      if (kstHour(g.start) < 4 || kstHour(g.end) > 17 && kstHour(g.end) !== 0) violate("I9 선상 출항 시간 외 골든타임", `${tag} ${kstHour(g.start)}~${kstHour(g.end)}시`);
    }
  }
  // I8 비시즌 상한
  const season = sp.season[month - 1];
  const best = Math.max(...r.days.map((d) => d.best));
  if (season <= 0.2 && best > 50) violate("I8 비시즌 고득점", `${tag} season=${season} best=${best}`);
}

// ───────── 통계 ─────────
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "-");
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

// S1 시나리오별 판정 분포
const verdictTable = SCEN.map((scen) => {
  const days = rows.filter((x) => x.scen === scen && x.sp.season[x.month - 1] >= 0.7).flatMap((x) => x.r.days);
  const c = { GO: 0, OK: 0, SKIP: 0, DANGER: 0 } as Record<string, number>;
  for (const d of days) c[d.verdict]++;
  return `| ${scen} | ${SCENARIOS[scen]} | ${pct(c.GO, days.length)} | ${pct(c.OK, days.length)} | ${pct(c.SKIP, days.length)} | ${pct(c.DANGER, days.length)} |`;
});

// S2 하루 안 변별력 (typical, 시즌 중)
const spreads = rows
  .filter((x) => x.scen === "typical" && x.sp.season[x.month - 1] >= 0.7)
  .flatMap((x) => x.r.days.map((d) => {
    const hs = x.r.hours.filter((h) => kstDateString(new Date(h.time)) === d.date).map((h) => h.score);
    return { sea: x.spot.sea, spread: Math.max(...hs) - Math.min(...hs) };
  }));
const spreadWest = avg(spreads.filter((s) => s.sea === "WEST").map((s) => s.spread));
const spreadEast = avg(spreads.filter((s) => s.sea === "EAST").map((s) => s.spread));

// S3 어종별 월 평균 최고점 vs 시즌 정의
const seasonFit = Object.values(SPECIES_BY_ID).map((sp) => {
  const byMonth = MONTHS.map((m) => avg(rows.filter((x) => x.sp.id === sp.id && x.month === m && x.scen === "typical").map((x) => Math.max(...x.r.days.map((d) => d.best)))));
  const peakModel = byMonth.indexOf(Math.max(...byMonth)) + 1;
  const peakSeason = sp.season.indexOf(Math.max(...sp.season)) + 1;
  const low = byMonth.map((v, i) => `${i + 1}:${Math.round(v)}`).join(" ");
  return `| ${sp.name} | ${peakSeason}월 | ${peakModel}월 | ${low} |`;
});

// S4 골든타임 시작 시각 분포 (typical)
const goldenHours = Object.values(SPECIES_BY_ID).map((sp) => {
  const hist = new Array(24).fill(0);
  rows.filter((x) => x.sp.id === sp.id && x.scen === "typical").forEach((x) => x.r.days.forEach((d) => d.golden[0] && hist[kstHour(d.golden[0].start)]++));
  const total = hist.reduce((a, b) => a + b, 0);
  const bands = { "새벽(3-7)": [3, 7], "오전(7-11)": [7, 11], "낮(11-16)": [11, 16], "저녁(16-20)": [16, 20], "밤(20-3)": [20, 27] } as const;
  const cells = Object.values(bands).map(([a, b]) => {
    let n = 0;
    for (let h = a; h < b; h++) n += hist[h % 24];
    return pct(n, total);
  });
  return `| ${sp.name} | ${cells.join(" | ")} | ${total} |`;
});

// S5 기본 어종 추천 = 실제 최고점 어종 일치율 (typical)
let agree = 0, agreeN = 0;
for (const spot of SPOTS) for (const m of MONTHS) {
  const rs = rows.filter((x) => x.spot.id === spot.id && x.month === m && x.scen === "typical");
  const top = rs.sort((a, b) => b.r.days[0].best - a.r.days[0].best)[0];
  const def = rankSpeciesForSpot(spot, dateOf(m))[0];
  agreeN++;
  if (top.sp.id === def.id) agree++;
}

// S6 위험일 대체 포인트 공백 (front 2일차, 노출 포인트)
const noAlt: string[] = [];
for (const spot of SPOTS.filter((s) => EXPOSED.has(s.type))) {
  const near = nearbySpots(spot, 60);
  const safe = near.filter((n) => n.spot.type === "INNER_HARBOR" || n.spot.type === "TIDAL_FLAT");
  if (!safe.length) noAlt.push(`${spot.name}(${SPOT_TYPE_LABEL[spot.type]})`);
}

// S7 오후 3시에 앱을 열었을 때: 화면에 1순위로 보이는 골든타임(nextGolden)이 이미 끝났는가 / 남은 골든타임이 없는가
let shownPassed = 0, noneLeft = 0, pmN = 0, legacyPassed = 0;
for (const spot of SPOTS) for (const m of MONTHS) {
  const now = new Date(dateOf(m).getTime() + 15 * HOUR);
  const bundle = scenarioBundle(spot, "typical", now, 2);
  for (const id of spot.species) {
    const d0 = scoreForecast(spot, SPECIES_BY_ID[id], bundle, { now }).days[0];
    pmN++;
    if (d0.golden[0] && Date.parse(d0.golden[0].end) <= now.getTime()) legacyPassed++;
    if (!d0.nextGolden) noneLeft++;
    else if (Date.parse(d0.nextGolden.end) <= now.getTime()) shownPassed++;
  }
}
const passed = shownPassed;
const withGolden = pmN;

// S8 냉수대 반응 (동해, 7~8월, 따뜻한 물 어종)
const cold = rows.filter((x) => x.scen === "coldwater" && x.spot.sea === "EAST" && (x.month === 7 || x.month === 8) && x.sp.temp.opt >= 18);
const calmBy = new Map(rows.filter((x) => x.scen === "calm").map((x) => [`${x.spot.id}|${x.sp.id}|${x.month}`, x.r]));
const coldDrop = avg(cold.map((x) => (calmBy.get(`${x.spot.id}|${x.sp.id}|${x.month}`)?.days[3].best ?? 0) - x.r.days[3].best));

const md = `# 엔진 시뮬레이션 리포트

- 실행: 포인트 ${SPOTS.length}곳 × 포인트별 어종 × 12개월 × 시나리오 ${SCEN.length}종 × 7일 = **${runs.toLocaleString()}회 예보 / ${(runs * 7 * 24).toLocaleString()}시간 점수**
- 소요: ${(elapsed / 1000).toFixed(1)}초 (예보 1회 평균 ${(elapsed / runs).toFixed(2)}ms)
- 알고리즘: ${rows[0].r.algoVersion}

## 1. 불변식 위반 (${violations.length}건)

${violations.length === 0 ? "없음 ✅" : (() => {
  const by = new Map<string, Violation[]>();
  violations.forEach((v) => by.set(v.rule, [...(by.get(v.rule) ?? []), v]));
  return [...by].map(([rule, vs]) => `### ${rule} — ${vs.length}건\n${vs.slice(0, 8).map((v) => `- ${v.detail}`).join("\n")}${vs.length > 8 ? `\n- … 외 ${vs.length - 8}건` : ""}`).join("\n\n");
})()}

## 2. 시나리오별 일 판정 분포 (시즌 중 어종만)

| 시나리오 | 설명 | 출조 추천 | 무난 | 비추천 | 위험 |
|---|---|---|---|---|---|
${verdictTable.join("\n")}

## 3. 하루 안 변별력 (평상시·시즌 중, 시간대별 최고−최저 평균)

- 서해: **${spreadWest.toFixed(1)}점**, 동해: **${spreadEast.toFixed(1)}점** (15점 이상이면 시간대 추천이 의미 있음)

## 4. 시즌 정합성 (평상시, 월별 7일 최고점 평균)

| 어종 | 시즌 데이터 최고월 | 모델 최고월 | 월별 평균 최고점 |
|---|---|---|---|
${seasonFit.join("\n")}

## 5. 골든타임 시작 시각 분포 (평상시)

| 어종 | 새벽 3-7 | 오전 7-11 | 낮 11-16 | 저녁 16-20 | 밤 20-3 | 표본 |
|---|---|---|---|---|---|---|
${goldenHours.join("\n")}

## 6. 시즌만으로 어종을 골랐을 때의 정확도 (이전 방식)
- 시즌 순서로 고른 기본 어종이 그날 실제 최고점 어종과 일치한 비율(현재는 그날 점수로 직접 고르므로 항상 일치): **${pct(agree, agreeN)}** (${agree}/${agreeN})

## 7. 위험일 대체 포인트 공백
- 60km 안에 내항·갯벌 등 보호된 대체 포인트가 없는 노출 포인트: **${noAlt.length}곳** ${noAlt.length ? `— ${noAlt.join(", ")}` : ""}

## 8. 오후 3시에 앱을 열었을 때 (평상시)
- 이전 방식(하루 전체 1순위)으로 보면 이미 끝난 골든타임이 1순위로 보이는 비율: **${pct(legacyPassed, pmN)}**
- 현재 방식(남은 시간 기준 다음 골든타임)에서 끝난 골든타임이 보이는 비율: **${pct(passed, withGolden)}**
- 오늘 남은 골든타임이 없는 비율: ${pct(noneLeft, pmN)} (이때는 '그나마 나은 시간'과 더 좋은 날·대체 포인트를 안내)

## 9. 냉수대 반응
- 동해 7~8월, 따뜻한 물 어종: 냉수대 4일차 최고점이 같은 조건 무풍일 대비 평균 **${coldDrop.toFixed(1)}점** 낮음
`;

mkdirSync("docs/sim", { recursive: true });
writeFileSync("docs/sim/engine-report.md", md);
console.log(md);
