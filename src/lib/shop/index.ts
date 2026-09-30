import { createHmac } from "node:crypto";

/**
 * 채비 실시간 가격.
 * 1순위: 쿠팡 파트너스 Open API (COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY) — 링크가 파트너스 추적 링크가 된다.
 * 2순위: 네이버 쇼핑 검색 API (NAVER_CLIENT_ID / NAVER_CLIENT_SECRET) — 쿠팡 API 승인 전 대체용.
 * 둘 다 없으면 null → 화면은 예시 가격대 + 쿠팡 검색 링크를 보여준다.
 */

export type ShopProvider = "coupang" | "naver";

export interface Offer {
  title: string;
  price: number;
  image: string | null;
  url: string;
  rocket: boolean;
  mall: string;
}

export interface OfferResult {
  provider: ShopProvider;
  offers: Offer[];
  /** 쿠팡 검색 결과 전체 보기 (파트너스 링크) */
  moreUrl: string | null;
  fetchedAt: string;
}

// COUPANG_API_BASE 는 테스트(가짜 서버)용. 운영에서는 비워 둔다
const COUPANG_HOST = process.env.COUPANG_API_BASE || "https://api-gateway.coupang.com";
const COUPANG_SEARCH = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";

export const shopProvider = (): ShopProvider | null =>
  process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY
    ? "coupang"
    : process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET
      ? "naver"
      : null;

/** 쿠팡 서명용 시각: yyMMdd'T'HHmmss'Z' (UTC) */
export function coupangDatetime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getUTCFullYear()).slice(2)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

/** 쿠팡 파트너스 HMAC 인증 헤더 (공식 예제와 같은 방식: 시각+메서드+경로+쿼리) */
export function coupangAuthorization(method: string, path: string, query: string, accessKey: string, secretKey: string, now = new Date()): string {
  const datetime = coupangDatetime(now);
  const signature = createHmac("sha256", secretKey).update(`${datetime}${method}${path}${query}`).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

interface CoupangProduct {
  productName?: string;
  productPrice?: number;
  productImage?: string;
  productUrl?: string;
  isRocket?: boolean;
}

export function parseCoupang(j: unknown): { offers: Offer[]; moreUrl: string | null } {
  const data = (j as { rCode?: string; data?: { landingUrl?: string; productData?: CoupangProduct[] } }) ?? {};
  if (data.rCode !== "0" || !data.data) throw new Error(`coupang rCode ${data.rCode}`);
  const offers = (data.data.productData ?? [])
    .filter((p) => p.productName && typeof p.productPrice === "number" && p.productPrice > 0 && /^https:\/\//.test(p.productUrl ?? ""))
    .map((p) => ({
      title: p.productName!,
      price: p.productPrice!,
      image: /^https:\/\//.test(p.productImage ?? "") ? p.productImage! : null,
      url: p.productUrl!,
      rocket: !!p.isRocket,
      mall: "쿠팡",
    }));
  const landing = data.data.landingUrl ?? "";
  return { offers, moreUrl: /^https:\/\//.test(landing) ? landing : null };
}

export function parseNaver(j: unknown): Offer[] {
  const items = ((j as { items?: { title?: string; link?: string; image?: string; lprice?: string; mallName?: string }[] })?.items ?? []);
  return items
    .map((i) => ({
      title: (i.title ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim(),
      price: Number(i.lprice),
      image: /^https:\/\//.test(i.image ?? "") ? i.image! : null,
      url: i.link ?? "",
      rocket: false,
      mall: i.mallName || "네이버 쇼핑",
    }))
    .filter((o) => o.title && o.price > 0 && /^https:\/\//.test(o.url));
}

// 쿠팡 검색 API 는 호출 한도가 작다 → 한도 초과 응답을 받으면 잠시 쉬었다가 다시 부른다(인스턴스 단위)
let coolUntil = 0;

async function fetchCoupang(keyword: string, limit: number): Promise<{ offers: Offer[]; moreUrl: string | null }> {
  if (Date.now() < coolUntil) throw new Error("coupang cooling down");
  const sub = process.env.COUPANG_SUB_ID ? `&subId=${encodeURIComponent(process.env.COUPANG_SUB_ID)}` : "";
  const query = `keyword=${encodeURIComponent(keyword)}&limit=${limit}${sub}`;
  const auth = coupangAuthorization("GET", COUPANG_SEARCH, query, process.env.COUPANG_ACCESS_KEY!, process.env.COUPANG_SECRET_KEY!);
  const r = await fetch(`${COUPANG_HOST}${COUPANG_SEARCH}?${query}`, {
    headers: { Authorization: auth, "Content-Type": "application/json;charset=UTF-8" },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (r.status === 429) {
    coolUntil = Date.now() + 10 * 60e3;
    throw new Error("coupang rate limited");
  }
  if (!r.ok) throw new Error(`coupang ${r.status}`);
  return parseCoupang(await r.json());
}

async function fetchNaver(keyword: string, limit: number): Promise<Offer[]> {
  const r = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=${limit}&sort=sim&exclude=used:rental`, {
    headers: { "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!, "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET! },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error(`naver ${r.status}`);
  return parseNaver(await r.json());
}

/** 검색어 하나의 상품 목록. 실패하면 예외 (캐시에 실패를 남기지 않기 위해) */
export async function searchOffers(keyword: string, limit = 5): Promise<OfferResult> {
  const provider = shopProvider();
  if (!provider) throw new Error("no shop provider");
  const fetchedAt = new Date().toISOString();
  if (provider === "coupang") {
    const { offers, moreUrl } = await fetchCoupang(keyword, limit);
    return { provider, offers, moreUrl, fetchedAt };
  }
  return { provider, offers: await fetchNaver(keyword, limit), moreUrl: null, fetchedAt };
}

/** 키가 없거나 실패했을 때 보여줄 쿠팡 일반 검색 링크 (파트너스 링크 아님) */
export const coupangSearchUrl = (keyword: string) => `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
