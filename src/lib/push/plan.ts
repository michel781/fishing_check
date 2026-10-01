import { kstHM } from "@/lib/format";
import type { DaySummary } from "@/lib/types";

/**
 * 어떤 알림을 보낼지 정한다 (순수 함수, 테스트 대상).
 *  - digest: 아침 요약 (하루 한 번) — 즐겨찾기 포인트의 오늘 황금타임 + 위험 경보
 *  - soon  : "곧 황금타임" — 시작 30~90분 전 (자주 도는 예약 작업이 있을 때)
 */

export interface PushPrefs {
  /** 황금타임 알림 (아침 요약 + 시작 전 알림) */
  golden: boolean;
  /** 기상 악화(위험) 알림 */
  danger: boolean;
}

export interface SpotDay {
  spotId: string;
  spotName: string;
  speciesId: string;
  speciesName: string;
  day: DaySummary;
  /** 이번 주에 오늘보다 나은 날 (오늘 황금타임이 없을 때 안내) */
  nextGood?: { date: string; score: number } | null;
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
/** 받침에 따라 조사 고르기 (예: 내일이 / 모레가, 신진도는 / 외항은) */
export const josa = (word: string, withB: string, withoutB: string) => {
  const c = word.trim().charCodeAt(word.trim().length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
  return word + (has ? withB : withoutB);
};
const dayLabel = (date: string, today: string) => {
  const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400e3);
  return diff === 1 ? "내일" : diff === 2 ? "모레" : `${WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()]}요일`;
};

export interface PushMsg {
  title: string;
  body: string;
  url: string;
  /** 같은 tag 알림은 휴대폰에서 하나로 합쳐진다 */
  tag: string;
  /** 같은 알림을 두 번 보내지 않기 위한 열쇠 */
  key: string;
}

const spotUrl = (s: SpotDay) => `/spot/${s.spotId}?species=${s.speciesId}&day=${s.day.date}`;
const block = (s: SpotDay) => s.day.nextGolden ?? s.day.golden[0] ?? null;
const range = (b: { start: string; end: string }) => `${kstHM(b.start)}–${kstHM(b.end)}`;

/** 아침 요약: 위험한 즐겨찾기가 있으면 경보 1통, 황금타임 요약 1통 (최대 2통) */
export function digestMessages(items: SpotDay[], prefs: PushPrefs, date: string): PushMsg[] {
  const out: PushMsg[] = [];
  const today = items.filter((s) => s.day.date === date);
  if (prefs.danger) {
    const bad = today.filter((s) => s.day.verdict === "DANGER");
    if (bad.length) {
      const names = bad.slice(0, 2).map((s) => s.spotName).join(", ");
      out.push({
        title: "⚠️ 오늘은 바다가 위험해요",
        body: `${names}${bad.length > 2 ? ` 외 ${bad.length - 2}곳` : ""}: 강풍·높은 파도 예보. 출조를 미루거나 안쪽 포인트를 골라 주세요.`,
        url: spotUrl(bad[0]),
        tag: `danger-${date}`,
        key: `danger:${date}`,
      });
    }
  }
  if (prefs.golden) {
    const good = today
      .filter((s) => s.day.verdict !== "DANGER" && block(s))
      .sort((a, b) => (block(b)?.avg ?? 0) - (block(a)?.avg ?? 0));
    if (good.length) {
      const top = good[0];
      const b = block(top)!;
      const rest = good.slice(1, 3).map((s) => `${s.spotName} ${range(block(s)!)}`);
      out.push({
        title: `🎣 오늘 황금타임 ${range(b)}`,
        body: `${top.spotName} ${top.speciesName} ${b.avg}점${rest.length ? ` · ${rest.join(" · ")}` : ""}`,
        url: spotUrl(top),
        tag: `digest-${date}`,
        key: `digest:${date}`,
      });
    } else {
      // 오늘은 황금타임이 없으면: 조용히 넘기지 말고 이번 주 더 나은 날을 알려 준다
      const later = today
        .filter((s) => s.nextGood)
        .sort((a, b) => a.nextGood!.date.localeCompare(b.nextGood!.date) || b.nextGood!.score - a.nextGood!.score)[0];
      if (later) {
        const g = later.nextGood!;
        out.push({
          title: `🎣 오늘보다 ${josa(dayLabel(g.date, date), "이", "가")} 좋아요`,
          body: `오늘은 황금타임이 없어요. ${josa(later.spotName, "은", "는")} ${dayLabel(g.date, date)} ${g.score}점 예상이에요.`,
          url: `/spot/${later.spotId}?species=${later.speciesId}&day=${g.date}`,
          tag: `digest-${date}`,
          key: `digest:${date}`,
        });
      }
    }
  }
  return out;
}

/** 곧 황금타임: 시작까지 fromMin~toMin 분 남은 블록 (밤 10시~새벽 4시 시작은 조용히) */
export function soonMessages(items: SpotDay[], prefs: PushPrefs, nowMs: number, fromMin = 30, toMin = 90): PushMsg[] {
  if (!prefs.golden) return [];
  const out: (PushMsg & { avg: number })[] = [];
  for (const s of items) {
    if (s.day.verdict === "DANGER") continue;
    const blocks = [...s.day.golden, ...(s.day.nextGolden ? [s.day.nextGolden] : [])];
    for (const b of blocks) {
      const mins = (Date.parse(b.start) - nowMs) / 60000;
      if (mins < fromMin || mins > toMin) continue;
      const kstHour = (new Date(b.start).getUTCHours() + 9) % 24;
      if (kstHour >= 22 || kstHour < 4) continue;
      out.push({
        title: `⏰ ${Math.round(mins / 10) * 10}분 뒤 황금타임 · ${s.spotName}`,
        body: `${range(b)} ${s.speciesName} ${b.avg}점. 지금 준비하면 딱 맞아요.`,
        url: spotUrl(s),
        tag: `soon-${s.spotId}`,
        key: `soon:${s.spotId}:${b.start}`,
        avg: b.avg,
      });
      break;
    }
  }
  // 한 번에 너무 많이 울리지 않게 점수 높은 2곳만
  return out
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 2)
    .map(({ avg: _avg, ...m }) => m);
}
