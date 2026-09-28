"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { kstHM, relativeDay, VERDICT_LABEL } from "@/lib/format";
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

const FEATURED = ["sinjin-outer", "ocheon-boat", "jumunjin", "sokcho-outer"];

function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function todayKst() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
}

export function HomeClient({ spots }: { spots: SpotLite[] }) {
  const [favs, , ready] = useFavorites();
  const [near, setNear] = useState<string[] | null>(null);
  const [geoMsg, setGeoMsg] = useState<string>("");
  const [data, setData] = useState<Record<string, SummaryItem>>({});
  const [loading, setLoading] = useState(false);
  const requested = useRef(new Set<string>());

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
    fetch(`/api/summary?ids=${missing.join(",")}`)
      .then((r) => r.json())
      .then((j: { items: SummaryItem[] }) => {
        setData((d) => ({ ...d, ...Object.fromEntries(j.items.map((i) => [i.id, i])) }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ids, ready]);

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

  const today = todayKst();
  const items = ids.map((id) => data[id]).filter(Boolean);
  const weekBest = items
    .flatMap((it) => it.days.map((d) => ({ it, d })))
    .filter(({ d }) => d.verdict !== "DANGER")
    .sort((a, b) => b.d.best - a.d.best)[0];

  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={locate}>📍 내 주변 포인트</button>
        <Link className="btn" href="/spots">전체 포인트</Link>
      </div>
      {geoMsg && <p className="small muted" style={{ margin: 0 }}>{geoMsg}</p>}

      {items.some((it) => it.sources.weather === "DEMO" || it.sources.marine === "DEMO") && (
        <p className="alert caution small" style={{ margin: 0 }}>
          ⚠ 지금은 외부 예보에 연결되지 않아 <strong>데모 날씨</strong>로 계산한 점수입니다. 실제 출조 판단에 쓰지 마세요.
        </p>
      )}
      {items.some((it) => it.sources.tide === "ESTIMATE") && (
        <p className="note" style={{ margin: 0 }}>조석은 천문 추정 모델 값입니다. 해양조사원 API 키를 연결하면 공식 조석예보로 계산합니다.</p>
      )}

      {weekBest && (
        <Link href={`/spot/${weekBest.it.id}?species=${weekBest.d.species.id}&day=${weekBest.d.date}`} className="card card-link hero">
          <span className="sub">이번 주 최고의 출조 ({favs.length ? "즐겨찾기" : "추천 포인트"} 중)</span>
          <div className="between">
            <strong style={{ fontSize: "1.2rem" }}>{relativeDay(weekBest.d.date, today)} · {weekBest.it.name}</strong>
            <span className="big num" style={{ fontSize: "2.2rem" }}>{weekBest.d.best}</span>
          </div>
          <span className="sub">
            {weekBest.d.species.name} · {weekBest.d.mulddae}
            {weekBest.d.golden && ` · 골든타임 ${kstHM(weekBest.d.golden.start)}–${kstHM(weekBest.d.golden.end)}`}
          </span>
        </Link>
      )}

      <section className="stack" aria-busy={loading}>
        <div className="between">
          <h2>{favs.length ? "즐겨찾기" : "추천 포인트"}</h2>
          {!favs.length && <span className="small muted">포인트 화면에서 ☆를 눌러 추가하세요</span>}
        </div>
        {ids.map((id) => {
          const it = data[id];
          const s = spots.find((x) => x.id === id);
          if (!s) return null;
          if (!it) {
            return (
              <div key={id} className="card" aria-hidden>
                <strong>{s.name}</strong>
                <p className="small muted" style={{ margin: "4px 0 0" }}>예보 계산 중…</p>
              </div>
            );
          }
          const d0 = it.days[0];
          return (
            <Link key={id} href={`/spot/${id}?species=${d0.species.id}`} className="card card-link stack" style={{ gap: 10 }}>
              <div className="between">
                <div>
                  <strong>{it.name}</strong>
                  <div className="small muted">{it.area} · {it.type}</div>
                </div>
                <span className={`badge v-${d0.verdict}`}><span className="dot" />{VERDICT_LABEL[d0.verdict].split(" ")[0]} <span className="num">{d0.best}</span></span>
              </div>
              <div className="sub">
                오늘 {d0.species.name} · {d0.mulddae}
                {d0.golden ? ` · 🎯 ${kstHM(d0.golden.start)}–${kstHM(d0.golden.end)}` : ""}
              </div>
              <div className="days" style={{ gridAutoColumns: "minmax(52px, 1fr)" }}>
                {it.days.map((d) => (
                  <div key={d.date} className="day" style={{ padding: "6px 4px" }} title={`${d.species.name} ${d.best}점`}>
                    <span className="small muted">{relativeDay(d.date, today).replace(/\(.\)/, "")}</span>
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
