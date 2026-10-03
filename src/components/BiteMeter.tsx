"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { biteLevel, envBlocks, rankAt, type BiteTimeline } from "@/lib/bite";
import { FishArt } from "./art/FishArt";

const WD = ["일", "월", "화", "수", "목", "금", "토"];
/** ISO → 한국시각 부품 */
function kst(iso: string) {
  const d = new Date(Date.parse(iso) + 9 * 3600e3);
  return { mo: d.getUTCMonth() + 1, da: d.getUTCDate(), wd: WD[d.getUTCDay()], h: d.getUTCHours(), date: d.toISOString().slice(0, 10) };
}
const two = (n: number) => String(n).padStart(2, "0");

export interface DayMeta {
  lunarDay: number;
  mulddae: string;
}

/**
 * 어종별 입질 지수: 시간축을 옮기면 그 시각의 어종 순위가 바뀐다.
 * - 위: 시간 눈금(3시간마다 굵게) + 환경 줄(3시간 묶음)
 * - 아래: 어종 고리 그래프(점수만큼 채움), 점수순/이름순
 */
export function BiteMeter({
  t,
  spotId,
  updatedAt,
  days,
  simQ,
}: {
  t: BiteTimeline;
  spotId: string;
  updatedAt: string;
  days: Record<string, DayMeta>;
  simQ: string;
}) {
  const [i, setI] = useState(0);
  const [by, setBy] = useState<"score" | "name">("score");
  const strip = useRef<HTMLDivElement>(null);
  const blocks = useMemo(() => envBlocks(t), [t]);
  const rows = useMemo(() => rankAt(t, i, by), [t, i, by]);

  // 고른 칸을 가운데로
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [i]);

  if (!t.times.length) return <p className="sub">이 포인트의 시간별 예보를 불러오지 못했어요.</p>;
  const cur = kst(t.times[i]);
  const meta = days[cur.date];
  const env = blocks.find((b) => i >= b.from && i < b.to);
  const href = (sp: string) => `/spot/${spotId}?species=${sp}&day=${cur.date}${simQ ? `&${simQ}` : ""}`;

  return (
    <section className="bite" aria-label="어종별 입질 지수">
      <div className="bite-date">
        <strong className="num">
          {two(cur.mo)}.{two(cur.da)} {cur.wd}
        </strong>
        {meta && <span>(음 {meta.lunarDay}일 · {meta.mulddae})</span>}
        <span className="bite-upd">{updatedAt} 기준</span>
      </div>

      <div className="bite-strip" ref={strip}>
        <div className="bite-track" style={{ gridTemplateColumns: `64px repeat(${t.times.length}, 44px)` }}>
          <span className="bite-rowlabel r-time">시간</span>
          {t.times.map((iso, k) => {
            const h = kst(iso).h;
            return (
              <button
                key={iso}
                type="button"
                data-i={k}
                className={`bite-hour${k === i ? " on" : ""}${h % 3 === 0 ? " major" : ""}`}
                onClick={() => setI(k)}
                aria-label={`${kst(iso).mo}월 ${kst(iso).da}일 ${h}시`}
                aria-pressed={k === i}
              >
                {h % 3 === 0 ? two(h) : ""}
                <i aria-hidden />
              </button>
            );
          })}
          <span className="bite-rowlabel r-env">환경</span>
          {blocks.map((b) => (
            <span
              key={b.from}
              className={`bite-env lv-${b.level}${i >= b.from && i < b.to ? " on" : ""}`}
              style={{ gridColumn: `span ${b.to - b.from}` }}
            >
              {b.level}
            </span>
          ))}
        </div>
      </div>

      <label className="skip" htmlFor="bite-range">시각 선택</label>
      <input
        id="bite-range"
        className="bite-range"
        type="range"
        min={0}
        max={t.times.length - 1}
        value={i}
        onChange={(e) => setI(Number(e.target.value))}
        aria-valuetext={`${cur.mo}월 ${cur.da}일 ${cur.h}시`}
      />

      <div className="bite-bar">
        <span className="bite-pill num">
          {two(cur.mo)}.{two(cur.da)} {cur.wd} {two(cur.h)}:00{i === 0 ? " · 지금" : ""}
        </span>
        <span className={`bite-envnow lv-${env?.level ?? "보통"}`}>바다 환경 {env?.level ?? "-"}</span>
        <button type="button" className="bite-sort" onClick={() => setBy(by === "score" ? "name" : "score")} aria-label={`정렬: ${by === "score" ? "점수순" : "이름순"} (눌러서 바꾸기)`}>
          ☰ {by === "score" ? "점수순 ↓" : "이름순"}
        </button>
      </div>

      <ul className="bite-grid" aria-live="polite">
        {rows.map((r) => {
          const lv = r.closed ? "금어기" : biteLevel(r.score);
          const C = 2 * Math.PI * 44;
          return (
            <li key={r.id} className={`bite-cell lv-${lv}`}>
              <Link href={href(r.id)} aria-label={`${r.name} ${lv} ${r.score}점`}>
                <span className="bite-ring">
                  <svg viewBox="0 0 100 100" aria-hidden>
                    <circle cx="50" cy="50" r="44" className="bg" />
                    <circle cx="50" cy="50" r="44" className="fg" strokeDasharray={`${(C * r.score) / 100} ${C}`} transform="rotate(-90 50 50)" />
                  </svg>
                  <FishArt id={r.id} className="bite-fish" />
                </span>
                <span className="bite-name">{r.name}</span>
                <b className="bite-lv">{lv}</b>
                <span className="bite-score num">{r.score}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <details className="bite-help">
        <summary>입질 지수는 어떻게 계산하나요?</summary>
        <p className="small" style={{ margin: "6px 0 0" }}>
          물때(들물·썰물·조류 세기), 바람, 파도, 수온, 해 뜨고 지는 시간·달빛, 장소와 제철을 어종 습성에 맞춰 0~100으로 합친 값이에요.
          실제로 잡힐 확률을 잰 값이 아니라 조건이 얼마나 좋은지의 지수예요. 70 이상 좋음 · 50 이상 보통 · 30 이상 나쁨 · 그 아래 희박.
          위험한 시간·금어기·배가 안 뜨는 시간은 0이에요. &lsquo;환경&rsquo;은 어종과 상관없는 바다 상태(바람·파도·기압)예요.
        </p>
      </details>
    </section>
  );
}

/** 포인트 고르기 + 내 주변 (가장 가까운 포인트로) */
export function BitePicker({
  spots,
  current,
  simQ,
  explicit,
  base = "/hourly",
  storageKey = "fc:bite-spot",
}: {
  spots: { id: string; name: string; region: string; lat: number; lon: number }[];
  current: string;
  simQ: string;
  /** 주소에 포인트가 있었는지 (없으면 지난번에 고른 포인트로) */
  explicit?: boolean;
  /** 고르면 이동할 화면 (?spot= 붙음) */
  base?: string;
  storageKey?: string;
}) {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (explicit) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved !== current && spots.some((s) => s.id === saved)) window.location.replace(`${base}?spot=${saved}${simQ ? `&${simQ}` : ""}`);
    } catch {}
  }, [explicit, current, spots, simQ, base, storageKey]);
  const go = (id: string) => {
    try {
      localStorage.setItem(storageKey, id);
    } catch {}
    window.location.href = `${base}?spot=${id}${simQ ? `&${simQ}` : ""}`;
  };
  const near = () => {
    if (!navigator.geolocation) return setMsg("이 브라우저는 위치를 지원하지 않아요.");
    setMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: a, longitude: o } = p.coords;
        const d = (s: { lat: number; lon: number }) => (s.lat - a) ** 2 + ((s.lon - o) * Math.cos((a * Math.PI) / 180)) ** 2;
        const best = [...spots].sort((x, y) => d(x) - d(y))[0];
        if (best) go(best.id);
      },
      () => setMsg("위치 권한이 없어요. 목록에서 골라 주세요."),
      { timeout: 8000, maximumAge: 600000 },
    );
  };
  const regions = [...new Set(spots.map((s) => s.region))];
  return (
    <div className="bite-pick">
      <label htmlFor="bite-spot" className="skip">포인트</label>
      <select id="bite-spot" value={current} onChange={(e) => go(e.target.value)}>
        {regions.map((r) => (
          <optgroup key={r} label={r}>
            {spots
              .filter((s) => s.region === r)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <button type="button" className="btn small" onClick={near}>📍 내 주변</button>
      {msg && <span className="small muted" role="status">{msg}</span>}
    </div>
  );
}
