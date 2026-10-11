import { describe, expect, it } from "vitest";
import type { TideExtreme, TidePoint } from "@/lib/types";
import { HALF_TIDE_MS, earlyWindows, splitStages, tideStage, tideSummary, tideTable } from "./tideTable";

const H = 3600e3;
const day0 = Date.parse("2026-10-02T00:00:00+09:00");
// 반일주조: 간조 02:00(50cm) → 만조 08:12(750cm) → 간조 14:24(80cm) → 만조 20:36(720cm)
const ex: TideExtreme[] = [
  { time: new Date(day0 + 2 * H).toISOString(), cm: 50, type: "LOW" },
  { time: new Date(day0 + 8.2 * H).toISOString(), cm: 750, type: "HIGH" },
  { time: new Date(day0 + 14.4 * H).toISOString(), cm: 80, type: "LOW" },
  { time: new Date(day0 + 20.6 * H).toISOString(), cm: 720, type: "HIGH" },
];
const series: TidePoint[] = Array.from({ length: 26 * 6 }, (_, i) => {
  const t = day0 - H + i * 10 * 60e3;
  const ph = ((t - (day0 + 2 * H)) / (12.4 * H)) * 2 * Math.PI;
  return { time: new Date(t).toISOString(), cm: 400 - 350 * Math.cos(ph) };
});

describe("물 단계", () => {
  it("만조·간조 앞뒤 40분은 만조/간조, 그 사이는 셋으로 나눔", () => {
    expect(tideStage(day0 + 2.5 * H, ex).stage).toBe("간조");
    expect(tideStage(day0 + 3.5 * H, ex).stage).toBe("초들물");
    expect(tideStage(day0 + 5 * H, ex).stage).toBe("중들물");
    expect(tideStage(day0 + 7 * H, ex).stage).toBe("끝들물");
    expect(tideStage(day0 + 10 * H, ex).stage).toBe("초썰물");
    expect(tideStage(day0 + 5 * H, ex).sinceH).toBe(3);
  });
});

describe("시간대별 물 높이 표", () => {
  const rows = tideTable(series, ex, day0);
  it("24시간, 들물이면 +, 썰물이면 −", () => {
    expect(rows).toHaveLength(24);
    expect(rows[5].delta).toBeGreaterThan(0);
    expect(rows[11].delta).toBeLessThan(0);
  });
  it("만조·간조가 든 시간 표시, 물살 센 시간은 중간 물때", () => {
    expect(rows[8].extreme?.type).toBe("HIGH");
    expect(rows[2].extreme?.type).toBe("LOW");
    const strong = rows.filter((r) => r.strong).map((r) => r.stage);
    expect(strong.every((s) => s.startsWith("중") || s.startsWith("초") || s.startsWith("끝"))).toBe(true);
    expect(strong.some((s) => s.startsWith("중"))).toBe(true);
  });
  it("요약: 조차 = 가장 높은 만조 − 가장 낮은 간조", () => {
    expect(tideSummary(ex, day0).rangeCm).toBe(700);
  });
});


describe("초들물·초날물 구간", () => {
  const t0 = Date.parse("2026-10-11T00:00:00+09:00");
  const ex = [
    { type: "LOW" as const, time: new Date(t0 + 6 * H).toISOString(), cm: 50 },
    { type: "HIGH" as const, time: new Date(t0 + 12.2 * H).toISOString(), cm: 650 },
    { type: "LOW" as const, time: new Date(t0 + 18.5 * H).toISOString(), cm: 60 },
  ];
  it("간조·만조 시각부터 다음 만조·간조까지 간격의 3분의 1", () => {
    const w = earlyWindows(ex, t0, t0 + 24 * H);
    expect(w.map((x) => x.stage)).toEqual(["초들물", "초썰물", "초들물"]);
    expect(Date.parse(w[0].start)).toBe(t0 + 6 * H);
    expect(Date.parse(w[0].end)).toBe(t0 + 6 * H + (6.2 * H) / 3);
    expect(Date.parse(w[1].end)).toBe(t0 + 12.2 * H + (6.3 * H) / 3);
    expect(Date.parse(w[0].slackEnd)).toBe(t0 + 6 * H + 40 * 60e3);
    expect(w[0].approx).toBe(false);
    // 마지막 간조는 다음 만조를 몰라 평균 간격(6시간 12분 30초)으로 어림
    expect(w[2].approx).toBe(true);
    expect(Date.parse(w[2].end) - Date.parse(w[2].start)).toBe(HALF_TIDE_MS / 3);
  });
  it("범위 밖 구간은 빼고, 범위에 걸치면 넣는다", () => {
    expect(earlyWindows(ex, t0 + 13 * H, t0 + 17 * H).map((x) => x.stage)).toEqual(["초썰물"]);
    expect(earlyWindows(ex, t0 + 15 * H, t0 + 17 * H)).toHaveLength(0);
  });
  it("계산기: 6시간 12분 → 한 단계 2시간 4분, 어림셈은 +2시간", () => {
    const s = splitStages(0, (6 * 60 + 12) * 60e3, true);
    expect(s.gapMin).toBe(372);
    expect(s.thirds.map((x) => x.stage)).toEqual(["초들물", "중들물", "끝들물"]);
    expect(s.thirds[0].end).toBe(124 * 60e3);
    expect(s.rough[1]).toBe(120 * 60e3);
    expect(s.slackStart[1]).toBe(40 * 60e3);
    expect(splitStages(0, 6 * 3600e3, false).thirds[0].stage).toBe("초썰물");
  });
});
