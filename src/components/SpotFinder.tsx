"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface FinderSpot {
  id: string;
  name: string;
  area: string;
  sea: "WEST" | "EAST";
  seaLabel: string;
  type: string;
  typeLabel: string;
  lat: number;
  lon: number;
  toilet: boolean;
  parking: boolean;
  nightOk: boolean;
  tetrapod: boolean;
  species: string[];
}

type Perk = "beginner" | "toilet" | "parking" | "night";
const PERKS: { id: Perk; label: string }[] = [
  { id: "beginner", label: "👨‍👩‍👧 초보·가족" },
  { id: "toilet", label: "화장실" },
  { id: "parking", label: "주차" },
  { id: "night", label: "야간 가능" },
];
const TYPES = [
  ["INNER_HARBOR", "내항"],
  ["OUTER_HARBOR", "외항 방파제"],
  ["BREAKWATER_TIP", "방파제 끝"],
  ["ROCK", "갯바위"],
  ["SURF", "백사장 원투"],
  ["BOAT", "선상"],
  ["TIDAL_FLAT", "갯벌 연안"],
] as const;

function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 초보·가족: 내항이거나, 테트라포드 없이 화장실·주차가 있는 워킹 포인트 */
const isBeginner = (s: FinderSpot) => s.type === "INNER_HARBOR" || (s.toilet && s.parking && !s.tetrapod && s.type !== "ROCK" && s.type !== "BOAT" && s.type !== "TIDAL_FLAT");

export function SpotFinder({ spots, initialSea, initialType, simQ }: { spots: FinderSpot[]; initialSea?: string; initialType?: string; simQ: string }) {
  const [q, setQ] = useState("");
  const [sea, setSea] = useState<string>(initialSea === "WEST" || initialSea === "EAST" ? initialSea : "ALL");
  const [type, setType] = useState<string>(initialType ?? "");
  const [perks, setPerks] = useState<Perk[]>([]);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");

  const togglePerk = (p: Perk) => setPerks((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));
  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("이 브라우저는 위치를 지원하지 않습니다.");
    setGeoMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lon: p.coords.longitude });
        setGeoMsg("가까운 순으로 정렬했습니다.");
      },
      () => setGeoMsg("위치 권한이 없어 정렬할 수 없습니다."),
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  const list = useMemo(() => {
    const k = q.trim().replace(/\s+/g, "");
    return spots
      .filter((s) => sea === "ALL" || s.sea === sea)
      .filter((s) => !type || s.type === type)
      .filter((s) => !k || `${s.name}${s.area}${s.typeLabel}${s.species.join("")}`.replace(/\s+/g, "").includes(k))
      .filter((s) => perks.every((p) => (p === "beginner" ? isBeginner(s) : p === "toilet" ? s.toilet : p === "parking" ? s.parking : s.nightOk)))
      .map((s) => ({ s, km: me ? distKm(me, s) : null }))
      .sort((a, b) => (a.km != null && b.km != null ? a.km - b.km : 0));
  }, [spots, q, sea, type, perks, me]);

  const href = (id: string) => `/spot/${id}${simQ ? `?${simQ}` : ""}`;

  return (
    <div className="stack">
      <label className="search">
        <span className="skip">포인트 검색</span>
        <input type="search" placeholder="항구·지역·어종 검색 (예: 태안, 주꾸미)" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </label>
      <div className="row">
        <button className="btn" onClick={locate}>📍 가까운 순</button>
        {geoMsg && <span className="small muted" role="status">{geoMsg}</span>}
      </div>
      <nav className="tabs" aria-label="해역">
        {[["ALL", "전체"], ["WEST", "서해"], ["EAST", "동해"]].map(([v, l]) => (
          <button key={v} className="tab" aria-current={sea === v ? "true" : undefined} onClick={() => setSea(v)}>{l}</button>
        ))}
      </nav>
      <nav className="tabs" aria-label="편의 조건">
        {PERKS.map((p) => (
          <button key={p.id} className="tab" aria-pressed={perks.includes(p.id)} aria-current={perks.includes(p.id) ? "true" : undefined} onClick={() => togglePerk(p.id)}>{p.label}</button>
        ))}
      </nav>
      <nav className="tabs" aria-label="포인트 유형">
        <button className="tab" aria-current={!type ? "true" : undefined} onClick={() => setType("")}>모든 유형</button>
        {TYPES.map(([v, l]) => (
          <button key={v} className="tab" aria-current={type === v ? "true" : undefined} onClick={() => setType(v)}>{l}</button>
        ))}
      </nav>
      <p className="small muted" style={{ margin: 0 }} role="status">{list.length}곳 · 좌표와 시설 정보는 베타 검증 중입니다.</p>
      {list.length === 0 && (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}>조건에 맞는 포인트가 없습니다.</p>
          <button className="btn" style={{ marginTop: 8 }} onClick={() => { setQ(""); setType(""); setPerks([]); setSea("ALL"); }}>조건 초기화</button>
        </div>
      )}
      <ul className="list">
        {list.map(({ s, km }) => (
          <li key={s.id}>
            <Link href={href(s.id)} className="card card-link stack" style={{ gap: 6 }}>
              <div className="between">
                <strong>{s.name}</strong>
                <span className="chip">{s.seaLabel} · {s.typeLabel}</span>
              </div>
              <div className="small muted">
                {s.area}{km != null ? ` · ${km.toFixed(0)}km` : ""} · {s.species.join(", ")}
              </div>
              <div className="row small">
                {isBeginner(s) && <span className="chip pos">초보·가족</span>}
                {s.toilet && <span className="chip">화장실</span>}
                {s.parking && <span className="chip">주차</span>}
                {s.nightOk && <span className="chip">야간</span>}
                {s.tetrapod && <span className="chip neg">테트라포드</span>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
