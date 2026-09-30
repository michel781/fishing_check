/**
 * 포인트 근처 낚시점(낚시용품점) 찾기.
 * 1순위 카카오 로컬 키워드 검색(KAKAO_REST_API_KEY, 좌표·반경 검색), 2순위 네이버 지역 검색(NAVER_CLIENT_ID/SECRET).
 * 키가 없으면 빈 목록 + 지도 검색 링크만 준다.
 */
import { distanceKm } from "@/data/spots";

export interface Shop {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  km: number | null;
  url: string | null;
  lat: number | null;
  lon: number | null;
}

const clean = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
/** 낚시터·실내낚시·카페는 빼고 "가게"만 */
const isShop = (name: string, category: string) =>
  /낚시/.test(`${name} ${category}`) && !/낚시터|실내낚시|낚시카페|낚시공원|유료낚시|좌대/.test(`${name} ${category}`);

interface KakaoDoc { id: string; place_name: string; category_name: string; phone: string; road_address_name: string; address_name: string; x: string; y: string; distance: string; place_url: string }
export function parseKakao(docs: KakaoDoc[] | undefined): Shop[] {
  return (docs ?? [])
    .filter((d) => isShop(d.place_name, d.category_name))
    .map((d) => ({
      id: `k:${d.id}`,
      name: d.place_name,
      phone: d.phone || null,
      address: d.road_address_name || d.address_name || null,
      km: d.distance ? Math.round(Number(d.distance) / 100) / 10 : null,
      url: /^https?:\/\//.test(d.place_url) ? d.place_url.replace(/^http:/, "https:") : null,
      lat: Number(d.y) || null,
      lon: Number(d.x) || null,
    }));
}

interface NaverItem { title: string; category: string; telephone: string; roadAddress: string; address: string; mapx: string; mapy: string; link: string }
export function parseNaver(items: NaverItem[] | undefined, from: { lat: number; lon: number }): Shop[] {
  return (items ?? [])
    .map((i) => {
      const name = clean(i.title);
      // 2023년 이후 네이버 지역검색 좌표는 WGS84 × 10^7 정수
      const lon = Number(i.mapx) / 1e7;
      const lat = Number(i.mapy) / 1e7;
      const ok = lat > 30 && lat < 40 && lon > 120 && lon < 135;
      return {
        id: `n:${name}:${i.roadAddress || i.address}`,
        name,
        category: i.category ?? "",
        phone: i.telephone || null,
        address: i.roadAddress || i.address || null,
        km: ok ? Math.round(distanceKm(from.lat, from.lon, lat, lon) * 10) / 10 : null,
        url: /^https:\/\//.test(i.link ?? "") ? i.link : null,
        lat: ok ? lat : null,
        lon: ok ? lon : null,
      };
    })
    .filter((s) => isShop(s.name, s.category) && (s.km == null || s.km <= 20))
    .map(({ category: _c, ...s }) => s)
    .sort((a, b) => (a.km ?? 99) - (b.km ?? 99));
}

export const shopProvider = () => (process.env.KAKAO_REST_API_KEY ? "kakao" : process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET ? "naver" : null);

export async function findShops(lat: number, lon: number, area: string): Promise<Shop[]> {
  const p = shopProvider();
  if (p === "kakao") {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent("낚시")}&x=${lon}&y=${lat}&radius=15000&sort=distance&size=15`,
      { headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` }, signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) throw new Error(`kakao ${r.status}`);
    return parseKakao(((await r.json()) as { documents?: KakaoDoc[] }).documents).slice(0, 6);
  }
  if (p === "naver") {
    const r = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(`${area} 낚시점`)}&display=5&sort=random`, {
      headers: { "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!, "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET! },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`naver ${r.status}`);
    return parseNaver(((await r.json()) as { items?: NaverItem[] }).items, { lat, lon });
  }
  return [];
}

/** 키가 없어도 쓸 수 있는 지도 검색 링크 */
export const mapSearchLinks = (area: string, spotName: string) => ({
  kakao: `https://map.kakao.com/?q=${encodeURIComponent(`${area} 낚시점`)}`,
  naver: `https://map.naver.com/p/search/${encodeURIComponent(`${spotName} 근처 낚시점`)}`,
});
