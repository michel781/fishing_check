"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NEW_REGIONS, REGIONS, TYPE_GROUPS, isBeginner, regionOf } from "@/lib/regions";
import type { SpotType } from "@/lib/types";
import { SceneArt } from "./art/SceneArt";
import { IcInfo, IcList, IcMap, IcPin, IcSearch } from "./icons";
import { RegionNotice } from "./RegionNotice";

const NOTICE_KEY = "fc:notice-regions-v116";

export interface FinderSpot {
  id: string;
  name: string;
  area: string;
  sea: "WEST" | "EAST" | "SOUTH";
  seaLabel: string;
  type: SpotType;
  typeLabel: string;
  lat: number;
  lon: number;
  toilet: boolean;
  parking: boolean;
  nightOk: boolean;
  tetrapod: boolean;
  species: string[];
}

type Score = { score: number; verdict: string; species: string };

function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function SpotFinder({ spots, initialSea, initialType, simQ }: { spots: FinderSpot[]; initialSea?: string; initialType?: string; simQ: string }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>(initialSea === "EAST" ? "강원" : "");
  const [group, setGroup] = useState<string>(TYPE_GROUPS.find((g) => g.types.includes(initialType ?? ""))?.id ?? "");
  const [beginner, setBeginner] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [geoMsg, setGeoMsg] = useState("");
  const [addr, setAddr] = useState("");
  const [notice, setNotice] = useState(false);

  // 내 위치 → "시·군·구 동" 글자 주소
  useEffect(() => {
    if (!me) return;
    let alive = true;
    fetch(`/api/geo/reverse?lat=${me.lat.toFixed(4)}&lon=${me.lon.toFixed(4)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { label?: string } | null) => {
        if (!alive) return;
        if (j?.label) return setAddr(j.label);
        // 주소 서비스가 안 되면 가장 가까운 포인트의 지역 이름으로 대신한다
        const near = [...spots].sort((a, b) => distKm(me, a) - distKm(me, b))[0];
        if (near) setAddr(`${regionOf(near.area)} ${near.area}`);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [me, spots]);

  // 새로 추가된 지역 안내 (한 번만 자동으로)
  useEffect(() => {
    try {
      if (!localStorage.getItem(NOTICE_KEY)) setNotice(true);
    } catch {}
  }, []);
  const closeNotice = () => {
    setNotice(false);
    try {
      localStorage.setItem(NOTICE_KEY, "1");
    } catch {}
  };

  useEffect(() => {
    if (!initialSea) {
      try {
        const r = JSON.parse(localStorage.getItem("fc:prefs") || "{}").region;
        if (typeof r === "string" && r) setRegion(r);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`/api/ranking?all=1&limit=60${simQ ? `&${simQ}` : ""}`)
      .then((r) => r.json())
      .then((j: { days: { top: { id: string; score: number; verdict: string; species: { name: string } }[] }[] }) => {
        const m: Record<string, Score> = {};
        for (const t of j.days[0]?.top ?? []) m[t.id] = { score: t.score, verdict: t.verdict, species: t.species.name };
        setScores(m);
      })
      .catch(() => {});
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (p.state === "granted") navigator.geolocation.getCurrentPosition((pos) => setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude }));
      })
      .catch(() => {});
  }, [simQ]);

  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("이 브라우저는 위치를 지원하지 않아요.");
    setGeoMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lon: p.coords.longitude });
        setGeoMsg("");
      },
      () => setGeoMsg("위치 권한이 없어 점수 순으로 보여드려요."),
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  const list = useMemo(() => {
    const k = q.trim().replace(/\s+/g, "");
    const types = TYPE_GROUPS.find((g) => g.id === group)?.types;
    return spots
      .filter((s) => !region || regionOf(s.area) === region)
      .filter((s) => !types || types.includes(s.type))
      .filter((s) => !beginner || isBeginner(s))
      .filter((s) => !k || `${s.name}${s.area}${regionOf(s.area)}${s.typeLabel}${s.species.join("")}`.replace(/\s+/g, "").includes(k))
      .map((s) => ({ s, km: me ? distKm(me, s) : null, sc: scores[s.id] }))
      .sort((a, b) => (a.km != null && b.km != null ? a.km - b.km : (b.sc?.score ?? -1) - (a.sc?.score ?? -1)));
  }, [spots, q, region, group, beginner, me, scores]);

  const href = (id: string) => `/spot/${id}${simQ ? `?${simQ}` : ""}`;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <label className="search-bar">
        <IcSearch size={20} />
        <span className="skip">포인트 검색</span>
        <input type="search" placeholder="지역명, 낚시터를 검색하세요" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </label>

      <div className="between" style={{ marginBottom: -4 }}>
        <span className="small muted">전국 {REGIONS.length}개 시·도 바다 · {spots.length}곳</span>
        <button type="button" className="link-btn" onClick={() => setNotice(true)}>
          <IcInfo size={16} /> 지역 안내
        </button>
      </div>
      <div className="chips" role="group" aria-label="지역">
        <button className="chip2" aria-pressed={!region} onClick={() => setRegion("")}>전체</button>
        {REGIONS.map((r) => (
          <button key={r} className="chip2" aria-pressed={region === r} onClick={() => setRegion(r)}>
            {r}
            {(NEW_REGIONS as readonly string[]).includes(r) && <span className="new-dot" aria-label="새로 추가">N</span>}
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="낚시터 유형">
        <button className="chip2 blue" aria-pressed={!group} onClick={() => setGroup("")}>전체</button>
        {TYPE_GROUPS.map((g) => (
          <button key={g.id} className="chip2 blue" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>{g.label}</button>
        ))}
        <button className="chip2 blue" aria-pressed={beginner} onClick={() => setBeginner((v) => !v)}>👨‍👩‍👧 초보·가족</button>
      </div>

      <div className="seg2" role="group" aria-label="보기 방식">
        <button aria-pressed={view === "map"} onClick={() => setView("map")}><IcMap size={18} /> 지도보기</button>
        <button aria-pressed={view === "list"} onClick={() => setView("list")}><IcList size={18} /> 목록보기</button>
      </div>

      <div className="between">
        <button className="btn small" onClick={locate}><IcPin size={16} /> {me ? "내 주변순" : "내 주변순으로 보기"}</button>
        <span className="small muted geo-status" role="status">
          {geoMsg ? (
            geoMsg
          ) : me ? (
            <>
              <IcPin size={14} />
              <span className="addr">{addr ? `${addr} 근처` : "내 위치"}</span>
              <span className="sep">· 가까운 순</span>
            </>
          ) : (
            `총 ${list.length}개의 낚시터`
          )}
        </span>
      </div>
      <RegionNotice open={notice} onClose={closeNotice} counts={REGIONS.map((r) => [r, spots.filter((s) => regionOf(s.area) === r).length] as const)} />

      {list.length === 0 && (
        <div className="card">
          <p className="sub" style={{ margin: 0 }}>조건에 맞는 낚시터가 없어요.</p>
          <button className="btn" style={{ marginTop: 8 }} onClick={() => { setQ(""); setGroup(""); setRegion(""); setBeginner(false); }}>조건 초기화</button>
        </div>
      )}

      {view === "map" ? (
        <SpotMap items={list} href={href} me={me} />
      ) : (
        <ul className="list" style={{ gap: 12 }}>
          {list.map(({ s, km, sc }) => (
            <li key={s.id}>
              <Link href={href(s.id)} className="spot-row">
                <span className="thumb"><SceneArt id={s.id} type={s.type} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="top">
                    <span className="nm">{s.name}</span>
                    {sc ? (
                      sc.verdict === "DANGER" ? <span className="score-t low" style={{ color: "var(--critical-text)" }}>⚠</span> : <span className={`score-t num${sc.score < 50 ? " low" : ""}`}>{sc.score}<small>점</small></span>
                    ) : <span className="score-t low">…</span>}
                  </span>
                  <span className="tags">
                    <span className="mini-chip blue">{s.typeLabel}</span>
                    {km != null ? <span className="mini-chip"><IcPin size={13} />{km.toFixed(0)}km</span> : <span className="mini-chip">{regionOf(s.area)} {s.area}</span>}
                    {isBeginner(s) && <span className="mini-chip green">초보추천</span>}
                  </span>
                  <span className="tags">
                    {s.species.slice(0, 3).map((n) => <span key={n} className="mini-chip">{n}</span>)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 남한 해안선 개략(경도, 위도) — 위치 감을 주기 위한 단순화 윤곽 */
const OUTLINE: [number, number][] = [
  [126.4, 37.75], [126.62, 37.45], [126.82, 37.18], [126.5, 36.93], [126.2, 36.76], [126.3, 36.5], [126.52, 36.3], [126.7, 36.02],
  [126.5, 35.72], [126.4, 35.42], [126.3, 35.02], [126.4, 34.6], [126.9, 34.42], [127.4, 34.52], [127.8, 34.7], [128.4, 34.82],
  [128.95, 35.05], [129.3, 35.3], [129.46, 35.7], [129.45, 36.1], [129.4, 36.6], [129.35, 37.1], [129.08, 37.62], [128.8, 37.95],
  [128.55, 38.32], [128.35, 38.6], [127.5, 38.3], [126.9, 38.0],
];
/** 제주도 개략 윤곽 */
const JEJU: [number, number][] = [
  [126.16, 33.3], [126.3, 33.45], [126.55, 33.53], [126.8, 33.52], [126.95, 33.46], [126.9, 33.3], [126.6, 33.22], [126.3, 33.2],
];
const px = (lon: number) => (lon - 125.8) * 100;
const py = (lat: number) => (38.8 - lat) * 125;

function SpotMap({ items, href, me }: { items: { s: FinderSpot; sc?: Score }[]; href: (id: string) => string; me: { lat: number; lon: number } | null }) {
  const color = (sc?: Score) => (!sc ? "#8b97aa" : sc.verdict === "DANGER" ? "#e03131" : sc.score >= 70 ? "#1c7ed6" : sc.score >= 50 ? "#f59f00" : "#8b97aa");
  return (
    <>
    {items.length > 14 && <p className="small muted" style={{ margin: 0 }}>점을 누르면 포인트 화면으로 가요. 지역을 고르면 이름과 점수가 함께 보여요.</p>}
    <div className="map-box">
      <svg viewBox="0 0 400 720" role="img" aria-label={`낚시터 ${items.length}곳 지도`}>
        <title>낚시터 지도 (점 색: 파랑 좋음, 노랑 보통, 빨강 위험)</title>
        <path d={`M${OUTLINE.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(" L")} Z`} fill="#f4f1e8" stroke="#b8c7d6" strokeWidth="2" />
        <text x="40" y="330" fill="#6b8bb0" fontSize="16" fontWeight="700">서해</text>
        <path d={`M${JEJU.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(" L")} Z`} fill="#f4f1e8" stroke="#b8c7d6" strokeWidth="2" />
        <text x="345" y="200" fill="#6b8bb0" fontSize="16" fontWeight="700">동해</text>
        <text x="200" y="600" fill="#6b8bb0" fontSize="16" fontWeight="700">남해</text>
        {me && <circle cx={px(me.lon)} cy={py(me.lat)} r="7" fill="#1a6fe0" stroke="#fff" strokeWidth="3" />}
        {items.map(({ s, sc }) => (
          <a key={s.id} href={href(s.id)} aria-label={`${s.name} ${sc ? `${sc.score}점` : ""}`}>
            <circle cx={px(s.lon)} cy={py(s.lat)} r="9" fill={color(sc)} stroke="#fff" strokeWidth="2.5" />
            {items.length <= 14 && <text x={px(s.lon) + (s.sea === "WEST" ? -12 : s.sea === "EAST" ? 12 : 0)} y={py(s.lat) + (s.sea === "SOUTH" ? 20 : 4)} textAnchor={s.sea === "WEST" ? "end" : s.sea === "EAST" ? "start" : "middle"} fontSize="11" fontWeight="700" fill="#0b1b3a">
              {s.name.replace(/ (방파제|선상|내항|갯바위|원투|갯벌)$/, "")}{sc && sc.verdict !== "DANGER" ? ` ${sc.score}` : ""}
            </text>}
          </a>
        ))}
      </svg>
    </div>
    </>
  );
}
