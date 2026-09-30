import { SITE_URL } from "@/lib/site";

/**
 * 좌표 → "시·도 시·군·구 읍·면·동" 글자 주소.
 * 1순위 카카오 로컬 API(KAKAO_REST_API_KEY), 없으면 OpenStreetMap Nominatim(무료, 키 없음).
 * 좌표는 서버에서 주소로 바꾸는 데에만 쓰고 저장하지 않는다.
 */

const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천", 광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산",
  세종특별자치시: "세종", 경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남", 전라북도: "전북",
  전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주",
};
export const shortSido = (s: string) => SIDO_SHORT[s] ?? s.replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, "");

/** 이름 목록을 중복 없이 이어 붙인다 */
const join = (parts: (string | undefined | null)[]) => [...new Set(parts.map((p) => p?.trim()).filter(Boolean) as string[])].join(" ");

interface NominatimAddress {
  province?: string; state?: string; city?: string; county?: string; borough?: string; city_district?: string;
  town?: string; village?: string; suburb?: string; quarter?: string; neighbourhood?: string; hamlet?: string;
}

export function formatNominatim(a: NominatimAddress | undefined): string | null {
  if (!a) return null;
  const sido = a.province ?? a.state ?? a.city ?? "";
  const sigungu = a.city && a.city !== sido ? a.city : a.county;
  const gu = a.borough ?? a.city_district;
  const dong = a.suburb ?? a.quarter ?? a.town ?? a.village ?? a.neighbourhood ?? a.hamlet;
  const label = join([sido ? shortSido(sido) : null, sigungu, gu, dong]);
  return label || null;
}

interface KakaoRegion { region_type: "B" | "H"; region_1depth_name: string; region_2depth_name: string; region_3depth_name: string }
export function formatKakao(docs: KakaoRegion[] | undefined): string | null {
  const d = docs?.find((x) => x.region_type === "H") ?? docs?.[0];
  if (!d) return null;
  return join([shortSido(d.region_1depth_name), d.region_2depth_name, d.region_3depth_name]) || null;
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ label: string; source: "kakao" | "osm" } | null> {
  const kakao = process.env.KAKAO_REST_API_KEY;
  if (kakao) {
    try {
      const r = await fetch(`https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lon}&y=${lat}`, {
        headers: { Authorization: `KakaoAK ${kakao}` },
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const label = formatKakao(((await r.json()) as { documents?: KakaoRegion[] }).documents);
        if (label) return { label, source: "kakao" };
      }
    } catch {}
  }
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&accept-language=ko`, {
      headers: { "User-Agent": `fishing-check/1.5 (${SITE_URL})`, "Accept-Language": "ko" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const label = formatNominatim(((await r.json()) as { address?: NominatimAddress }).address);
    return label ? { label, source: "osm" } : null;
  } catch {
    return null;
  }
}
