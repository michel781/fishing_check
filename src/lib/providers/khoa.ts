import type { TideExtreme } from "@/lib/types";
import { fetchJson } from "./http";

/**
 * 국립해양조사원 바다누리 OpenAPI — 조석예보(고·저조) tideObsPreTab.
 * 응답 예: { result: { data: [{ tph_time: "2026-09-28 04:12:00", tph_level: "712", hl_code: "고조" }] } }
 * 기관 API 개편 가능성이 있어 기본 URL 을 환경변수(KHOA_TIDE_URL)로 바꿀 수 있게 둔다.
 */
interface KhoaResp {
  result?: {
    data?: { tph_time: string; tph_level: string; hl_code: string }[];
    error?: string;
  };
}

const DEFAULT_URL = "https://www.khoa.go.kr/api/oceangrid/tideObsPreTab/search.do";

export async function khoaTideExtremes(
  serviceKey: string,
  stationCode: string,
  dates: string[], // YYYY-MM-DD (KST)
): Promise<TideExtreme[]> {
  const base = process.env.KHOA_TIDE_URL || DEFAULT_URL;
  const all = await Promise.all(
    dates.map(async (d) => {
      const url = `${base}?ServiceKey=${encodeURIComponent(serviceKey)}&ObsCode=${stationCode}&Date=${d.replace(/-/g, "")}&ResultType=json`;
      const r = await fetchJson<KhoaResp>(url, 12 * 3600);
      if (r.result?.error) throw new Error(`KHOA ${r.result.error}`);
      return (r.result?.data ?? []).map<TideExtreme>((x) => ({
        time: new Date(`${x.tph_time.replace(" ", "T")}+09:00`).toISOString(),
        cm: Number(x.tph_level),
        type: x.hl_code.includes("고") ? "HIGH" : "LOW",
      }));
    }),
  );
  const flat = all.flat().filter((e) => Number.isFinite(e.cm));
  const uniq = new Map(flat.map((e) => [e.time, e]));
  return [...uniq.values()].sort((a, b) => a.time.localeCompare(b.time));
}
