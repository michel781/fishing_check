"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dateLabel, dirLabel, fmt, kstHM, relativeDay } from "@/lib/format";
import type { DaySummary, GoldenBlock, SpotType } from "@/lib/types";
import { SceneArt } from "./art/SceneArt";
import { useFavorites } from "./favorites";
import { placeLabel } from "@/lib/geo/label";
import { useAuth } from "./auth/AuthProvider";
import { IcCatch, IcChevron, IcPin, IcSearch, IcSun, IcUser } from "./icons";

interface Lite {
  id: string;
  name: string;
  area: string;
  type: SpotType;
  typeLabel: string;
  species: { id: string; name: string };
  score: number;
  verdict: DaySummary["verdict"];
  golden: GoldenBlock | null;
  km: number | null;
}
interface HomeData {
  today: string;
  hero: (Lite & { danger: boolean }) | null;
  conditions: {
    nextExtreme: { type: "HIGH" | "LOW"; time: string; cm: number; inMin: number } | null;
    windMs: number | null;
    windDir: number | null;
    waveM: number | null;
    waveLabel: string;
    seaTempC: number | null;
    tempLabel: string;
    airTempC: number | null;
    current: GoldenBlock | null;
  } | null;
  popular: { mine: boolean; items: Lite[] };
  recommended: Lite[];
  weekend: { date: string; danger: number; total: number; top: Lite[] }[];
  dangerToday: number;
  total: number;
}

const hourLabel = (iso: string) => {
  const h = (new Date(iso).getUTCHours() + 9) % 24;
  return h < 12 ? `오전 ${h === 0 ? 12 : h}시` : `오후 ${h === 12 ? 12 : h - 12}시`;
};

export function HomeClient({ simQ }: { simQ: string }) {
  const [favs, , ready] = useFavorites();
  const [data, setData] = useState<HomeData | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const { user } = useAuth();
  const [place, setPlace] = useState("");
  const q = (extra: string) => [extra, simQ].filter(Boolean).join("&");

  const load = useCallback(() => {
    const u = new URLSearchParams(simQ);
    if (loc) {
      u.set("lat", String(loc.lat));
      u.set("lon", String(loc.lon));
    }
    if (favs.length) u.set("favs", favs.join(","));
    fetch(`/api/home?${u.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [simQ, loc, favs]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  // 이미 위치 권한을 준 사용자는 조용히 위치 반영
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        if (p.state === "granted") navigator.geolocation.getCurrentPosition((pos) => setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }));
      })
      .catch(() => {});
  }, []);

  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("이 브라우저는 위치를 지원하지 않아요.");
    setGeoMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLoc({ lat, lon });
        setGeoMsg("");
        setPlace("");
        setPlace(await placeLabel(lat, lon));
      },
      () => setGeoMsg("위치 권한이 없어 전체 추천을 보여드려요."),
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  const h = data?.hero;
  const c = data?.conditions;
  const spotHref = (id: string, species?: string, day?: string) =>
    `/spot/${id}?${q([species && `species=${species}`, day && `day=${day}`].filter(Boolean).join("&"))}`;
  const good = h && !h.danger && h.score >= 70;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="app-head">
        <Link href="/" className="logo-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          피싱체크
        </Link>
        <span className="grow" />
        {h && c?.airTempC != null && <span className="weather-chip">{h.area} · {Math.round(c.airTempC)}℃</span>}
        <Link href={user ? "/account" : "/login?next=/"} className="round-btn" aria-label={user ? "내 계정" : "로그인 · 회원가입"}>
          <IcUser size={24} />
        </Link>
        <Link href={`/best${simQ ? `?${simQ}` : ""}`} className="round-btn" aria-label="가장 잘 잡히는 포인트">
          <IcCatch size={24} />
        </Link>
      </header>

      <p className="hello">
        오늘 어디로 가볼까요?
        <strong>
          {!h ? "좋은 낚시 타이밍을 찾는 중이에요" : h.danger ? "오늘은 바다가 위험해요" : good ? <>지금이 좋은 <span className="accent-text">낚시 타이밍</span>이에요!</> : "오늘은 조건이 조금 아쉬워요"}
        </strong>
      </p>

      {data && data.weekend.length > 0 && (
        <nav className="weekend-strip" aria-label="이번 주말 요약">
          <span className="wk-label">🗓 이번 주말</span>
          {data.weekend.map((d) => {
            const top = d.top[0];
            const rest = d.danger / Math.max(1, d.total) > 0.5;
            return rest || !top ? (
              <a key={d.date} href="#wk-title" className="wk-chip warn">{dateLabel(d.date)} · 쉬어가요</a>
            ) : (
              <Link key={d.date} href={spotHref(top.id, top.species.id, d.date)} className="wk-chip">
                {dateLabel(d.date)} · {top.name.replace(/ (방파제|선상|내항|갯바위)$/, "")} <b className="num">{top.score}</b>
              </Link>
            );
          })}
        </nav>
      )}

      {!h ? (
        <div className="skeleton" style={{ height: 330, borderRadius: 24 }} aria-hidden />
      ) : (
        <Link href={spotHref(h.id, h.species.id)} className="hero-card" aria-label={`지금 추천: ${h.name} ${h.score}점`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="bg" src="/hero.jpg" alt="" style={{ objectPosition: "26% 50%" }} />
          {h.km != null && <span className="dist-chip"><IcPin size={16} /> {h.km.toFixed(0)}km</span>}
          <div className="in">
            <span className="tag-now2">{h.danger ? "주의" : "지금 추천"}</span>
            <span className="name">{h.name}</span>
            <div className="hero-score">
              <span className="n num">{h.score}<small>점</small></span>
              <span>
                <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>오늘 낚시지수 · {h.species.name}</span>
                <span className="gauge" aria-hidden><i style={{ width: `${Math.max(4, h.score)}%` }} /></span>
              </span>
            </div>
            <div className="golden-strip">
              <IcSun size={34} className="c-temp" />
              <span className="t">
                {c?.current ? (
                  <>지금이 <b>황금타임</b>이에요!<br />{hourLabel(c.current.start)} ~ {hourLabel(c.current.end)}</>
                ) : h.golden ? (
                  <>다음 <b>황금타임</b><br />{hourLabel(h.golden.start)} ~ {hourLabel(h.golden.end)}</>
                ) : (
                  <>오늘 남은 황금타임이 없어요<br />주말 예보를 확인하세요</>
                )}
              </span>
              <span className="go" aria-hidden><IcChevron size={22} /></span>
            </div>
          </div>
        </Link>
      )}

      <div className="mini-tiles" aria-label="현재 해황">
        <div className="mt">
          <span className="l c-tide">물때</span>
          <span className="v">{c?.nextExtreme ? (c.nextExtreme.type === "HIGH" ? "만조" : "간조") : "-"}</span>
          <span className="s num accent-text" style={{ fontWeight: 700 }}>{c?.nextExtreme ? kstHM(c.nextExtreme.time) : ""}</span>
        </div>
        <div className="mt">
          <span className="l c-wind">바람</span>
          <span className="v num">{fmt(c?.windMs, 1)}<small>m/s</small></span>
          <span className="s">{c ? `${dirLabel(c.windDir)}풍` : ""}</span>
        </div>
        <div className="mt">
          <span className="l c-wave">파도</span>
          <span className="v num">{fmt(c?.waveM, 1)}<small>m</small></span>
          <span className="s">{c?.waveLabel ?? ""}</span>
        </div>
        <div className="mt">
          <span className="l c-temp">수온</span>
          <span className="v num">{fmt(c?.seaTempC, 1)}<small>℃</small></span>
          <span className="s">{c?.tempLabel ?? ""}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button className="btn" onClick={locate}><IcPin size={18} /> 내 주변 포인트</button>
        <Link className="btn" href={`/spots${simQ ? `?${simQ}` : ""}`}><IcSearch size={18} /> 포인트 찾기</Link>
        <Link className="btn primary" href={`/best${simQ ? `?${simQ}` : ""}`} style={{ gridColumn: "1 / -1" }}><IcCatch size={18} /> 가장 잘 잡히는 포인트</Link>
      </div>
      {(geoMsg || loc) && (
        <p className="small muted" style={{ margin: 0 }} role="status">
          {geoMsg ||
            (!place
              ? "📍 내 위치를 확인하고 있어요…"
              : data?.hero?.km != null
                ? `📍 ${place} 근처 포인트로 바꿨어요.`
                : `📍 ${place} 근처 포인트를 찾는 중…`)}
        </p>
      )}

      <section aria-labelledby="pop-title">
        <div className="sec-title">
          <h2 id="pop-title">{data?.popular.mine ? "내가 저장한 포인트" : "최근 많이 가는 포인트"}</h2>
          <Link href={`/spots${simQ ? `?${simQ}` : ""}`} aria-label="포인트 더 보기"><IcChevron size={20} /></Link>
        </div>
        <div className="photo-row">
          {(data?.popular.items ?? []).map((p) => (
            <Link key={p.id} href={spotHref(p.id, p.species.id)} className="photo-card">
              <SceneArt id={p.id} type={p.type} />
              <span className="cap">
                <b>{p.name}</b>
                <span className="sc num">{p.verdict === "DANGER" ? "⚠" : p.score}{p.verdict !== "DANGER" && <small>점</small>}</span>
              </span>
            </Link>
          ))}
          {!data && [0, 1, 2].map((i) => <div key={i} className="skeleton photo-card" aria-hidden />)}
        </div>
      </section>

      <section aria-labelledby="rec-title" className="stack" style={{ gap: 10 }}>
        <div className="sec-title">
          <h2 id="rec-title">오늘의 추천 포인트</h2>
          <Link href={`/best${simQ ? `?${simQ}` : ""}`} aria-label="추천 포인트 전체 보기"><IcChevron size={20} /></Link>
        </div>
        {data?.dangerToday ? <p className="small g-DANGER" style={{ margin: 0 }}>⚠ 오늘 위험한 {data.dangerToday}곳은 추천에서 뺐어요.</p> : null}
        {(data?.recommended ?? []).map((r) => (
          <Link key={r.id} href={spotHref(r.id, r.species.id)} className="spot-row">
            <span className="thumb"><SceneArt id={r.id} type={r.type} /></span>
            <span style={{ minWidth: 0 }}>
              <span className="top"><span className="nm">{r.name}</span><span className="score-t num">{r.score}<small>점</small></span></span>
              <span className="tags">
                <span className="mini-chip blue">{r.typeLabel}</span>
                {r.km != null ? <span className="mini-chip"><IcPin size={13} />{r.km.toFixed(0)}km</span> : <span className="mini-chip">{r.area}</span>}
              </span>
              <span className="tags">
                <span className="mini-chip">{r.species.name}</span>
                {r.golden && <span className="mini-chip orange">🎯 {kstHM(r.golden.start)}~{kstHM(r.golden.end)}</span>}
              </span>
            </span>
          </Link>
        ))}
        {!data && [0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 132 }} aria-hidden />)}
      </section>

      {data && data.weekend.length > 0 && (
        <section className="card stack" style={{ gap: 10 }} aria-labelledby="wk-title">
          <h2 id="wk-title">이번 주말 {data.weekend.map((d) => dateLabel(d.date)).join(" · ")}</h2>
          <div className="grid-2">
            {data.weekend.map((d) => (
              <div key={d.date} className="stack" style={{ gap: 6 }}>
                <strong>{relativeDay(d.date, data.today)}</strong>
                {d.danger / Math.max(1, d.total) > 0.5 && (
                  <p className="alert small" style={{ margin: 0, padding: "8px 12px" }}>⚠ {d.total}곳 중 {d.danger}곳이 위험해요 — 쉬는 걸 추천해요</p>
                )}
                {d.top.length === 0 ? (
                  <p className="small muted" style={{ margin: 0 }}>추천할 곳이 없어요.</p>
                ) : (
                  d.top.map((r, i) => (
                    <Link key={r.id} href={spotHref(r.id, r.species.id, d.date)} className="between" style={{ minHeight: 48 }}>
                      <span><span className="muted num">{i + 1}</span> <strong>{r.name}</strong> <span className="small muted">{r.species.name}</span></span>
                      <span className="score-t num" style={{ fontSize: "1.15rem" }}>{r.score}<small>점</small></span>
                    </Link>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <details className="card soft howto">
        <summary><strong>처음이세요? 30초 사용법</strong></summary>
        <ol className="steps small" style={{ marginTop: 8 }}>
          <li><strong>낚시지수</strong>는 100점 만점이에요. <strong>70점 이상이면 좋은 날</strong>, 50점 아래면 아쉬운 날이에요.</li>
          <li><strong>🎯 황금타임</strong>은 물고기가 가장 잘 무는 시간이에요. 이 시간에 맞춰 도착하세요.</li>
          <li><strong>⚠ 위험</strong>이 보이면 바람·파도가 센 날이에요. 가지 말거나 안내하는 안전한 곳으로 가세요.</li>
          <li>포인트를 누르면 <strong>무슨 물고기를, 어떤 도구로, 어떻게 낚는지</strong> 그림과 영상으로 알려줘요.</li>
        </ol>
      </details>
    </div>
  );
}
