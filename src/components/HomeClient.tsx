"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { dateLabel, kstHM, relativeDay, VERDICT_LABEL } from "@/lib/format";
import type { DaySummary, GoldenBlock } from "@/lib/types";
import { useFavorites } from "./favorites";

interface SpotLite {
  id: string;
  name: string;
  area: string;
  sea: "WEST" | "EAST";
  type: string;
  lat: number;
  lon: number;
}

interface SummaryItem {
  id: string;
  name: string;
  area: string;
  type: string;
  sources: { tide: string; weather: string; marine: string };
  days: {
    date: string;
    species: { id: string; name: string };
    best: number;
    verdict: DaySummary["verdict"];
    mulddae: string;
    golden: GoldenBlock | null;
  }[];
}

interface RankItem {
  id: string;
  name: string;
  area: string;
  type: string;
  species: { id: string; name: string };
  score: number;
  verdict: DaySummary["verdict"];
  mulddae: string;
  golden: GoldenBlock | null;
}
interface RankDay { date: string; danger: number; total: number; top: RankItem[] }

type SeaFilter = "ALL" | "WEST" | "EAST";
const FEATURED = ["sinjin-outer", "ocheon-boat", "jumunjin", "sokcho-outer"];
const SEA_KEY = "fc:sea";

function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function HomeClient({ spots, today, weekend, simQ }: { spots: SpotLite[]; today: string; weekend: string[]; simQ: string }) {
  const [favs, , ready] = useFavorites();
  const [sea, setSea] = useState<SeaFilter>("ALL");
  const [near, setNear] = useState<string[] | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [data, setData] = useState<Record<string, SummaryItem>>({});
  const [rank, setRank] = useState<Record<string, RankDay[]>>({});
  const [loading, setLoading] = useState(false);
  const [pick, setPick] = useState(today);
  const requested = useRef(new Set<string>());
  const sq = simQ ? `&${simQ}` : "";

  useEffect(() => {
    try {
      const v = localStorage.getItem(SEA_KEY);
      if (v === "WEST" || v === "EAST" || v === "ALL") setSea(v);
    } catch {}
  }, []);
  const chooseSea = (v: SeaFilter) => {
    setSea(v);
    try {
      localStorage.setItem(SEA_KEY, v);
    } catch {}
  };

  // 랭킹: 오늘 + 주말
  const dates = useMemo(() => Array.from(new Set([today, ...weekend])), [today, weekend]);
  useEffect(() => {
    if (rank[sea]) return;
    fetch(`/api/ranking?sea=${sea}&limit=5&dates=${dates.join(",")}${sq}`)
      .then((r) => r.json())
      .then((j: { days: RankDay[] }) => setRank((x) => ({ ...x, [sea]: j.days })))
      .catch(() => {});
  }, [sea, dates, sq, rank]);

  const ids = useMemo(() => {
    const base = favs.length ? favs : FEATURED;
    return Array.from(new Set([...(near ?? []), ...base])).slice(0, 8);
  }, [favs, near]);

  useEffect(() => {
    if (!ready) return;
    const missing = ids.filter((id) => !requested.current.has(id));
    if (!missing.length) return;
    missing.forEach((id) => requested.current.add(id));
    setLoading(true);
    fetch(`/api/summary?ids=${missing.join(",")}${sq}`)
      .then((r) => r.json())
      .then((j: { items: SummaryItem[] }) => setData((d) => ({ ...d, ...Object.fromEntries(j.items.map((i) => [i.id, i])) })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ids, ready, sq]);

  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("이 브라우저는 위치를 지원하지 않습니다.");
    setGeoMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const sorted = [...spots].sort((a, b) => distKm(me, a) - distKm(me, b)).slice(0, 3);
        setNear(sorted.map((s) => s.id));
        setGeoMsg(`가까운 포인트: ${sorted.map((s) => `${s.name}(${distKm(me, s).toFixed(0)}km)`).join(", ")}`);
      },
      () => setGeoMsg("위치 권한이 없어 기본 포인트를 보여드립니다."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  const items = ids.map((id) => data[id]).filter(Boolean);
  const rankDays = rank[sea];
  const picked = rankDays?.find((d) => d.date === pick);
  const spotHref = (id: string, species?: string, day?: string) => {
    const u = new URLSearchParams(simQ);
    if (species) u.set("species", species);
    if (day) u.set("day", day);
    const s = u.toString();
    return `/spot/${id}${s ? `?${s}` : ""}`;
  };
  const demo = items.some((it) => it.sources.weather === "DEMO" || it.sources.marine === "DEMO") && !simQ;

  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={locate}>📍 내 주변 포인트</button>
        <Link className="btn" href={`/spots${simQ ? `?${simQ}` : ""}`}>포인트 찾기</Link>
      </div>
      {geoMsg && <p className="small muted" style={{ margin: 0 }} role="status">{geoMsg}</p>}
      {demo && (
        <p className="alert caution small" style={{ margin: 0 }}>
          ⚠ 지금은 외부 예보에 연결되지 않아 <strong>데모 날씨</strong>로 계산한 점수입니다. 실제 출조 판단에 쓰지 마세요.
        </p>
      )}

      <nav className="tabs" aria-label="해역 선택">
        {(["ALL", "WEST", "EAST"] as SeaFilter[]).map((v) => (
          <button key={v} className="tab" aria-current={sea === v ? "true" : undefined} onClick={() => chooseSea(v)}>
            {v === "ALL" ? "전체" : v === "WEST" ? "서해" : "동해"}
          </button>
        ))}
      </nav>

      <section className="card stack" style={{ gap: 10 }} aria-busy={!rankDays} aria-labelledby="rank-title">
        <div className="between">
          <h2 id="rank-title">어디 갈까</h2>
          <span className="small muted">{sea === "ALL" ? "전체" : sea === "WEST" ? "서해" : "동해"} {spots.filter((s) => sea === "ALL" || s.sea === sea).length}곳 중</span>
        </div>
        <div className="seg" role="tablist" aria-label="날짜">
          {dates.map((d) => {
            const rd = rankDays?.find((x) => x.date === d);
            const bad = rd && rd.danger / Math.max(1, rd.total) > 0.5;
            return (
              <button key={d} role="tab" aria-selected={pick === d} onClick={() => setPick(d)}>
                {d === today ? "오늘" : relativeDay(d, today)}{bad ? " ⚠" : ""}
              </button>
            );
          })}
        </div>
        {!picked ? (
          <div className="skeleton" style={{ height: 180 }} aria-hidden />
        ) : (
          <div role="tabpanel" className="stack" style={{ gap: 8 }}>
            {picked.danger / Math.max(1, picked.total) > 0.5 ? (
              <p className="alert small" style={{ margin: 0, padding: "8px 12px" }}>⚠ 포인트 {picked.danger}/{picked.total}곳이 위험 — 출조 자제를 권합니다</p>
            ) : picked.danger > 0 ? (
              <p className="small g-DANGER" style={{ margin: 0 }}>⚠ 위험 판정 {picked.danger}곳은 목록에서 제외했습니다</p>
            ) : null}
            {picked.top.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>{pick === today ? "오늘 남은 시간에는 추천할 곳이 없습니다." : "추천할 곳이 없습니다."}</p>
            ) : (
              <ol className="list">
                {picked.top.map((r, i) => <RankRow key={r.id} r={r} i={i} href={spotHref(r.id, r.species.id, picked.date)} />)}
              </ol>
            )}
            <p className="small muted" style={{ margin: 0 }}>{pick === today ? "오늘은 지금 이후 남은 시간 기준입니다." : `${dateLabel(pick)} 하루 최고점 기준입니다.`}</p>
          </div>
        )}
      </section>

      <section className="stack" aria-busy={loading}>
        <div className="between">
          <h2>{favs.length ? "즐겨찾기" : "추천 포인트"}</h2>
          {!favs.length && <span className="small muted">포인트 화면에서 ☆로 추가</span>}
        </div>
        {ids.map((id) => {
          const it = data[id];
          const s = spots.find((x) => x.id === id);
          if (!s) return null;
          if (!it) return <div key={id} className="skeleton" style={{ height: 150 }} aria-hidden />;
          const d0 = it.days.find((d) => d.date === today) ?? it.days[0];
          return (
            <Link key={id} href={spotHref(id, d0.species.id)} className="card card-link stack" style={{ gap: 10 }}>
              <div className="between">
                <div>
                  <strong>{it.name}</strong>
                  <div className="small muted">{it.area} · {it.type}</div>
                </div>
                <span className={`badge v-${d0.verdict}`}>
                  <span className="dot" />
                  {d0.verdict === "DANGER" ? "위험" : VERDICT_LABEL[d0.verdict].split(" ")[0]} <span className="num">{d0.best}</span>
                </span>
              </div>
              <div className="sub">
                오늘 {d0.species.name} · {d0.mulddae}
                {d0.golden ? ` · 🎯 ${kstHM(d0.golden.start)}–${kstHM(d0.golden.end)}` : " · 남은 골든타임 없음"}
              </div>
              <div className="days mini" aria-label="7일 점수">
                {it.days.slice(0, 7).map((d) => (
                  <div key={d.date} className="day" title={`${dateLabel(d.date)} ${d.species.name} ${d.best}점`}>
                    <span className="small muted">{d.date === today ? "오늘" : dateLabel(d.date).slice(-2, -1)}</span>
                    <span className={`num v-${d.verdict}`} style={{ fontWeight: 800 }}>{d.verdict === "DANGER" ? "⚠" : d.best}</span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function RankRow({ r, i, href, compact }: { r: RankItem; i: number; href: string; compact?: boolean }) {
  return (
    <li>
      <Link href={href} className="between" style={{ minHeight: 48, gap: 10 }}>
        <span className="row" style={{ flexWrap: "nowrap", gap: 10 }}>
          <span className="num muted" style={{ width: 16, textAlign: "right" }}>{i + 1}</span>
          <span>
            <strong>{r.name}</strong>
            <span className="small muted" style={{ display: "block" }}>
              {r.species.name}{!compact && ` · ${r.type}`}
              {r.golden ? ` · ${kstHM(r.golden.start)}–${kstHM(r.golden.end)}` : ""}
            </span>
          </span>
        </span>
        <span className={`badge v-${r.verdict} num`}>{r.score}</span>
      </Link>
    </li>
  );
}
