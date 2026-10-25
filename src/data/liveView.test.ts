import { describe, expect, it } from "vitest";
import { LIVE_AREAS, liveLinks, remoteVerdict } from "./liveView";

describe("실시간 바다 보기", () => {
  it("지역마다 조황·유튜브 라이브·영상·수온·파도 바로가기가 모두 있고 주소가 겹치지 않는다", () => {
    for (const a of LIVE_AREAS) {
      const ls = liveLinks(a);
      for (const k of ["report", "youtube", "cam", "temp", "wave"] as const) expect(ls.some((l) => l.kind === k), `${a} ${k}`).toBe(true);
      for (const l of ls) expect(l.url, l.title).toMatch(/^https:\/\//);
      expect(new Set(ls.map((l) => l.url)).size).toBe(ls.length);
      // 유튜브 '지금 라이브' 검색은 라이브 필터를 건다
      expect(ls.some((l) => l.url.includes("youtube.com/results") && l.url.includes("sp=EgJAAQ"))).toBe(true);
      // 지역 이름이 검색어에 들어간다
      expect(ls.filter((l) => l.kind === "report").every((l) => decodeURIComponent(l.url).includes(a))).toBe(true);
    }
  });
  it("조황이 맨 앞(가장 직접적인 신호)", () => {
    expect(liveLinks("속초")[0].kind).toBe("report");
  });
  it("출발 판단: 파도·냉수대는 보류, 조황+새떼는 출발", () => {
    expect(remoteVerdict({ report: true, birds: true, highWave: true }).level).toBe("hold");
    expect(remoteVerdict({ report: true, coldWater: true }).level).toBe("hold");
    expect(remoteVerdict({ report: true, birds: true }).level).toBe("go");
    expect(remoteVerdict({ crowd: true }).level).toBe("maybe");
    expect(remoteVerdict({}).text).toContain("정보 부족");
  });
});
