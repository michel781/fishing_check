"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FishArt } from "./art/FishArt";
import { IcChevron, IcSearch } from "./icons";

export interface FishItem {
  id: string;
  name: string;
  aka?: string;
  seasonLabel: string;
  seasonIds: string[];
  temp: string;
  level: "초보" | "중급" | "고급";
  popular: number;
  inSeason: number; // 이번 달 시즌 점수 0~1
  closed: boolean;
}

const FILTERS = [
  { id: "", label: "전체" },
  { id: "popular", label: "인기" },
  { id: "spring", label: "봄" },
  { id: "summer", label: "여름" },
  { id: "autumn", label: "가을" },
  { id: "winter", label: "겨울" },
];

export function FishList({ items, month }: { items: FishItem[]; month: number }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("");
  const list = useMemo(() => {
    const k = q.trim().replace(/\s+/g, "");
    let out = items.filter((s) => !k || `${s.name}${s.aka ?? ""}`.replace(/\s+/g, "").includes(k));
    if (f === "popular") out = [...out].sort((a, b) => a.popular - b.popular);
    else if (f) out = out.filter((s) => s.seasonIds.includes(f));
    if (f !== "popular") out = [...out].sort((a, b) => b.inSeason - a.inSeason || a.popular - b.popular);
    return out;
  }, [items, q, f]);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <label className="search-bar">
        <IcSearch size={20} />
        <span className="skip">어종 검색</span>
        <input type="search" placeholder="어종 이름을 검색하세요" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
      </label>
      <div className="chips" role="group" aria-label="계절">
        {FILTERS.map((x) => (
          <button key={x.id} className="chip2" aria-pressed={f === x.id} onClick={() => setF(x.id)}>{x.label}</button>
        ))}
      </div>
      <p className="small muted" style={{ margin: 0 }} role="status">
        {f === "popular" ? "낚시인들이 많이 찾는 순서예요." : `${month}월에 잘 잡히는 순서예요.`} 누르면 낚는 법·채비·영상을 볼 수 있어요.
      </p>
      {list.length === 0 && <p className="sub">찾는 어종이 없어요.</p>}
      <ul className="list" style={{ gap: 0 }}>
        {list.map((s, i) => (
          <li key={s.id}>
            <Link href={`/fish/${s.id}`} className="fish-row">
              <span className={`rk${i < 3 ? ` r${i + 1}` : ""}`} aria-label={`${i + 1}위`}>{i + 1}</span>
              <span className="art"><FishArt id={s.id} /></span>
              <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <span className="nm">{s.name}</span>
                <span className="ss">시즌: {s.seasonLabel}</span>
                <span className="tags">
                  <span className="mini-chip blue">수온 {s.temp}</span>
                  {s.closed ? <span className="mini-chip red">금어기</span> : s.inSeason >= 0.85 ? <span className="mini-chip orange">제철</span> : null}
                  {s.popular <= 4 && <span className="mini-chip orange">인기</span>}
                  <span className={`mini-chip ${s.level === "초보" ? "green" : ""}`}>{s.level === "초보" ? "초보추천" : s.level}</span>
                </span>
              </span>
              <IcChevron size={20} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
