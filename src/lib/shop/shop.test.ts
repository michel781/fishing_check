import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RIG_SPECS } from "@/data/rigSpecs";
import { GUIDES } from "@/data/guides";
import { coupangAuthorization, coupangDatetime, coupangSearchUrl, parseCoupang, parseNaver } from "./index";

describe("쿠팡 파트너스 서명", () => {
  const now = new Date("2026-09-30T03:04:05Z");
  it("시각 형식 yyMMdd'T'HHmmss'Z'", () => {
    expect(coupangDatetime(now)).toBe("260930T030405Z");
  });
  it("HMAC-SHA256(시각+메서드+경로+쿼리)", () => {
    const path = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
    const query = `keyword=${encodeURIComponent("우럭 채비")}&limit=5`;
    const h = coupangAuthorization("GET", path, query, "AK", "SK", now);
    const sig = createHmac("sha256", "SK").update(`260930T030405ZGET${path}${query}`).digest("hex");
    expect(h).toBe(`CEA algorithm=HmacSHA256, access-key=AK, signed-date=260930T030405Z, signature=${sig}`);
  });
});

describe("응답 해석", () => {
  it("쿠팡: 가격·링크가 있는 상품만", () => {
    const r = parseCoupang({
      rCode: "0",
      data: {
        landingUrl: "https://link.coupang.com/a/xyz",
        productData: [
          { productName: "우럭 채비 3개입", productPrice: 5900, productImage: "https://img/1.jpg", productUrl: "https://link.coupang.com/re/1", isRocket: true },
          { productName: "가격 없음", productUrl: "https://link.coupang.com/re/2" },
          { productName: "이상한 링크", productPrice: 100, productUrl: "javascript:alert(1)" },
        ],
      },
    });
    expect(r.offers).toHaveLength(1);
    expect(r.offers[0]).toMatchObject({ price: 5900, rocket: true, mall: "쿠팡" });
    expect(r.moreUrl).toBe("https://link.coupang.com/a/xyz");
  });
  it("쿠팡: 오류 코드면 예외", () => {
    expect(() => parseCoupang({ rCode: "400", rMessage: "bad" })).toThrow();
  });
  it("네이버: 태그 제거·숫자 가격", () => {
    const o = parseNaver({ items: [{ title: "<b>우럭</b> 채비 &amp; 봉돌", link: "https://shop/1", lprice: "4500", mallName: "낚시몰" }] });
    expect(o[0]).toMatchObject({ title: "우럭 채비 & 봉돌", price: 4500, mall: "낚시몰" });
  });
  it("검색 링크", () => {
    expect(coupangSearchUrl("봉돌 80호")).toBe("https://www.coupang.com/np/search?q=%EB%B4%89%EB%8F%8C%2080%ED%98%B8");
  });
});

describe("채비 규격 데이터", () => {
  it("가이드가 있는 모든 어종에 규격·준비물이 있다", () => {
    for (const id of Object.keys(GUIDES)) {
      const s = RIG_SPECS[id];
      expect(s, id).toBeTruthy();
      expect(s.parts.length, id).toBeGreaterThanOrEqual(3);
      expect(s.gear.some((g) => g.essential), id).toBe(true);
      for (const g of s.gear) expect(g.priceRange[0], `${id}/${g.id}`).toBeLessThanOrEqual(g.priceRange[1]);
      expect(new Set(s.gear.map((g) => g.id)).size, id).toBe(s.gear.length);
    }
  });
});
