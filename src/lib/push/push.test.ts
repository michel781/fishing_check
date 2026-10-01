import { describe, expect, it } from "vitest";
import webpush from "web-push";
import type { DaySummary, GoldenBlock } from "@/lib/types";
import { digestMessages, josa, soonMessages, type SpotDay } from "./plan";
import { cleanSub } from "./server";

const gb = (start: string, end: string, avg: number): GoldenBlock => ({ start, end, avg, peak: avg + 5, reasons: [] });
const day = (over: Partial<DaySummary>): DaySummary =>
  ({ date: "2026-10-01", verdict: "GO", golden: [], nextGolden: null, best: 80, remainingBest: null, ...over }) as DaySummary;
const sd = (id: string, d: DaySummary): SpotDay => ({ spotId: id, spotName: id, speciesId: "rockfish", speciesName: "우럭", day: d });
const all = { golden: true, danger: true };

describe("아침 요약 알림", () => {
  it("위험 경보 1통 + 가장 좋은 황금타임 요약 1통", () => {
    const m = digestMessages(
      [
        sd("A", day({ verdict: "DANGER" })),
        sd("B", day({ golden: [gb("2026-10-01T07:00:00Z", "2026-10-01T09:00:00Z", 72)] })),
        sd("C", day({ golden: [gb("2026-10-01T09:00:00Z", "2026-10-01T11:00:00Z", 85)] })),
      ],
      all,
      "2026-10-01",
    );
    expect(m).toHaveLength(2);
    expect(m[0].title).toContain("위험");
    expect(m[0].body).toContain("A");
    expect(m[1].title).toContain("18:00–20:00"); // 한국시각
    expect(m[1].body).toMatch(/^C 우럭 85점 · B 16:00–18:00$/);
    expect(m[1].url).toBe("/spot/C?species=rockfish&day=2026-10-01");
  });
  it("설정을 끄면 보내지 않음", () => {
    const items = [sd("A", day({ verdict: "DANGER" })), sd("B", day({ golden: [gb("2026-10-01T07:00:00Z", "2026-10-01T09:00:00Z", 72)] }))];
    expect(digestMessages(items, { golden: false, danger: false }, "2026-10-01")).toEqual([]);
    expect(digestMessages(items, { golden: true, danger: false }, "2026-10-01").map((x) => x.key)).toEqual(["digest:2026-10-01"]);
  });
});

describe("곧 황금타임 알림", () => {
  const now = Date.parse("2026-10-01T06:00:00Z"); // 15:00 KST
  it("30~90분 뒤 시작만, 점수 높은 순 최대 2곳", () => {
    const m = soonMessages(
      [
        sd("A", day({ golden: [gb("2026-10-01T07:00:00Z", "2026-10-01T09:00:00Z", 70)] })), // 60분 뒤
        sd("B", day({ golden: [gb("2026-10-01T06:10:00Z", "2026-10-01T08:00:00Z", 90)] })), // 10분 뒤 → 제외
        sd("C", day({ golden: [gb("2026-10-01T07:20:00Z", "2026-10-01T09:00:00Z", 88)] })), // 80분 뒤
        sd("D", day({ golden: [gb("2026-10-01T06:50:00Z", "2026-10-01T09:00:00Z", 75)] })), // 50분 뒤
        sd("E", day({ verdict: "DANGER", golden: [gb("2026-10-01T07:00:00Z", "2026-10-01T09:00:00Z", 95)] })),
      ],
      all,
      now,
    );
    expect(m.map((x) => x.key.split(":")[1])).toEqual(["C", "D"]);
    expect(m[0].title).toContain("80분 뒤");
  });
  it("밤 10시~새벽 4시 시작은 조용히", () => {
    const late = Date.parse("2026-10-01T12:00:00Z"); // 21:00 KST
    expect(soonMessages([sd("A", day({ golden: [gb("2026-10-01T13:00:00Z", "2026-10-01T14:00:00Z", 80)] }))], all, late)).toEqual([]);
  });
});

describe("구독 정보 검사", () => {
  it("https 알림 서버와 키가 있어야 함", () => {
    expect(cleanSub({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "a", auth: "b" } })).not.toBeNull();
    expect(cleanSub({ endpoint: "http://evil/x", keys: { p256dh: "a", auth: "b" } })).toBeNull();
    expect(cleanSub({ endpoint: "https://x" })).toBeNull();
  });
});

describe("설정 화면에서 만든 알림 서명 키", () => {
  it("웹 푸시 라이브러리가 그대로 쓸 수 있다", async () => {
    const b64 = (b: ArrayBuffer) => Buffer.from(b).toString("base64url");
    const k = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const pub = b64(await crypto.subtle.exportKey("raw", k.publicKey));
    const priv = (await crypto.subtle.exportKey("jwk", k.privateKey)).d!;
    const ua = webpush.generateVAPIDKeys(); // 받는 쪽(브라우저) 키 흉내
    const r = webpush.generateRequestDetails(
      { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: ua.publicKey, auth: Buffer.from("1234567890123456").toString("base64url") } },
      "hello",
      { vapidDetails: { subject: "mailto:a@b.cd", publicKey: pub, privateKey: priv } },
    );
    expect(r.headers.Authorization).toMatch(/^vapid t=/);
  });
});

describe("오늘 황금타임이 없는 날", () => {
  it("조용히 넘기지 않고 이번 주 더 나은 날 안내", () => {
    const m = digestMessages([{ ...sd("A", day({ golden: [] })), nextGood: { date: "2026-10-03", score: 81 } }], all, "2026-10-01");
    expect(m).toHaveLength(1);
    expect(m[0].title).toBe("🎣 오늘보다 모레가 좋아요");
    expect(m[0].url).toContain("day=2026-10-03");
  });
});

describe("조사", () => {
  it("받침에 맞게", () => {
    expect(josa("내일", "이", "가")).toBe("내일이");
    expect(josa("모레", "이", "가")).toBe("모레가");
    expect(josa("토요일", "이", "가")).toBe("토요일이");
    expect(josa("신진도", "은", "는")).toBe("신진도는");
    expect(josa("주문진항", "은", "는")).toBe("주문진항은");
  });
});
