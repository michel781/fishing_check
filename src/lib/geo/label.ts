import { distanceKm, SPOTS } from "@/data/spots";
import { regionOf } from "@/lib/regions";

/**
 * (브라우저) 좌표 → "경북 울진군 후포면" 같은 글자 주소.
 * 주소 서비스가 안 되면 가장 가까운 포인트의 지역 이름("경북 울진")으로 대신한다.
 */
export async function placeLabel(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(`/api/geo/reverse?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`);
    const j = (await r.json()) as { label?: string | null };
    if (j.label) return j.label;
  } catch {}
  const near = [...SPOTS].sort((a, b) => distanceKm(lat, lon, a.lat, a.lon) - distanceKm(lat, lon, b.lat, b.lon))[0];
  return near ? `${regionOf(near.area)} ${near.area}` : "내 위치";
}
