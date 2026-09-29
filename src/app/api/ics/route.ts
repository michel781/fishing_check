import { getSpot } from "@/data/spots";
import { getSpecies } from "@/data/species";

/** 골든타임을 캘린더 일정(.ics)으로 내려준다: /api/ics?spot=&species=&start=ISO&end=ISO */
export function GET(req: Request) {
  const u = new URL(req.url);
  const spot = getSpot(u.searchParams.get("spot") ?? "");
  const species = getSpecies(u.searchParams.get("species") ?? "");
  const start = Date.parse(u.searchParams.get("start") ?? "");
  const end = Date.parse(u.searchParams.get("end") ?? "");
  if (!spot || !species || !Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 12 * 3600e3) {
    return new Response("잘못된 요청", { status: 400 });
  }
  const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const origin = `${u.protocol}//${u.host}`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//fishing-check//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${spot.id}-${species.id}-${start}@fishing-check`,
    `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(`🎣 ${spot.name} ${species.name} 골든타임`)}`,
    `LOCATION:${esc(`${spot.area} ${spot.name}`)}`,
    `GEO:${spot.lat};${spot.lon}`,
    `DESCRIPTION:${esc(`피싱체크 예보 기준 골든타임입니다. 출발 전 최신 예보와 안전 정보를 확인하세요.\n${origin}/spot/${spot.id}?species=${species.id}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT90M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${spot.name} 골든타임 90분 전 — 출발 준비`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="fishing-${spot.id}-${fmt(start).slice(0, 8)}.ics"`,
    },
  });
}
