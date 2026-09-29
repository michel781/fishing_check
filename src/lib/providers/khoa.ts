import type { TideExtreme } from "@/lib/types";
import { fetchJson } from "./http";

/**
 * 국립해양조사원 조석예보(고·저조) — 공공데이터포털 이전 버전
 *   GET https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService
 *   ?serviceKey&obsCode=DT_0001&reqDate=YYYYMMDD&type=json&pageNo=1&numOfRows=20
 * 공공데이터포털 인증키(DATA_GO_KR_SERVICE_KEY) 하나로 호출한다. (옛 바다누리 oceangrid 키는 필요 없음)
 *
 * 응답은 포털 표준 { response: { header, body: { items: { item } } } } 형식이며
 * 시각(predcDt)은 오프셋 없는 KST 문자열, 높이는 predcTdlvVl(cm)이다.
 * 기관이 필드를 바꿔도 버티도록 이름 후보를 여러 개 받고, 고·저조 구분이 애매하면 앞뒤 값 비교로 판정한다.
 */

type Raw = Record<string, unknown>;

interface PortalResp {
  response?: PortalBody;
  header?: PortalBody["header"];
  body?: PortalBody["body"];
}
interface PortalBody {
  header?: { resultCode?: string; resultMsg?: string };
  body?: { items?: { item?: Raw | Raw[] } | Raw[] | "" };
}

const DEFAULT_URL = "https://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService";

const TIME_KEYS = ["predcDt", "tphTime", "tph_time", "predDt"];
const LEVEL_KEYS = ["predcTdlvVl", "tdlvHgt", "tphLevel", "tph_level", "predcTdlv"];
const TYPE_KEYS = ["extrSe", "hlCode", "hl_code", "extrSeNm"];

function pick(o: Raw, keys: string[]): unknown {
  for (const k of keys) if (o[k] != null && o[k] !== "") return o[k];
  return undefined;
}

/** "2026-09-28 05:33:00" / "202609280533" / "2026-09-28T05:33" → UTC ISO (KST 가정) */
export function kstToIso(v: string): string | null {
  const s = v.trim();
  const m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})[ T]?(\d{2}):?(\d{2})(?::?(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  const t = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${se ?? "00"}+09:00`);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function classify(v: unknown): "HIGH" | "LOW" | null {
  if (v == null) return null;
  const s = String(v);
  if (/고|high|^H$/i.test(s)) return "HIGH";
  if (/저|low|^L$/i.test(s)) return "LOW";
  return null;
}

export function parseTideItems(resp: PortalResp): { time: string; cm: number; type: "HIGH" | "LOW" | null }[] {
  const root = resp.response ?? resp;
  const code = root.header?.resultCode;
  if (code && code !== "00" && code !== "0") {
    throw new Error(`KHOA ${code} ${root.header?.resultMsg ?? ""}`.trim());
  }
  const items = root.body?.items;
  const list: Raw[] = !items
    ? []
    : Array.isArray(items)
      ? items
      : Array.isArray(items.item)
        ? items.item
        : items.item
          ? [items.item]
          : [];
  const out: { time: string; cm: number; type: "HIGH" | "LOW" | null }[] = [];
  for (const it of list) {
    const t = pick(it, TIME_KEYS);
    const lv = Number(pick(it, LEVEL_KEYS));
    const iso = t == null ? null : kstToIso(String(t));
    if (!iso || !Number.isFinite(lv)) continue;
    out.push({ time: iso, cm: lv, type: classify(pick(it, TYPE_KEYS)) });
  }
  return out;
}

/** 고·저조 구분이 없는 항목은 앞뒤 값과 비교해 판정 (고·저조는 번갈아 나온다) */
export function resolveTypes(rows: { time: string; cm: number; type: "HIGH" | "LOW" | null }[]): TideExtreme[] {
  const sorted = [...rows].sort((a, b) => a.time.localeCompare(b.time));
  return sorted.map((r, i) => {
    if (r.type) return { time: r.time, cm: r.cm, type: r.type };
    const prev = sorted[i - 1]?.cm;
    const next = sorted[i + 1]?.cm;
    const ref = prev ?? next;
    const isHigh = ref == null ? r.cm > 0 : r.cm > (prev != null && next != null ? (prev + next) / 2 : ref);
    return { time: r.time, cm: r.cm, type: isHigh ? "HIGH" : "LOW" };
  });
}

export async function khoaTideExtremes(
  serviceKey: string,
  stationCode: string,
  dates: string[], // YYYY-MM-DD (KST)
): Promise<TideExtreme[]> {
  const base = process.env.KHOA_TIDE_URL || DEFAULT_URL;
  const all = await Promise.all(
    dates.map(async (d) => {
      const url =
        `${base}?serviceKey=${encodeURIComponent(serviceKey)}&obsCode=${stationCode}` +
        `&reqDate=${d.replace(/-/g, "")}&type=json&pageNo=1&numOfRows=20`;
      return parseTideItems(await fetchJson<PortalResp>(url, 12 * 3600));
    }),
  );
  const uniq = new Map(all.flat().map((e) => [e.time, e]));
  return resolveTypes([...uniq.values()]);
}
