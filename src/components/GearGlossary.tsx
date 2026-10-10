"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GearCat, Term } from "@/data/gearTerms";

type Cat = { id: GearCat; label: string; icon: string; summary: string };

/** 장비·용어 사전: 검색 + 분류 칩. 항목 안의 '함께 쓰는 용어'는 그 항목으로 이동한다. */
export function GearGlossary({ terms, cats }: { terms: Term[]; cats: Cat[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<GearCat | "all">("all");
  const byId = useMemo(() => new Map(terms.map((t) => [t.id, t])), [terms]);

  // 다른 곳(그림 번호·관련 용어)에서 #t-xxx 로 오면 필터를 풀어 항목이 보이게
  useEffect(() => {
    const open = () => {
      if (window.location.hash.startsWith("#t-")) {
        setQ("");
        setCat("all");
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();
  const nq = norm(q);
  const shown = terms.filter(
    (t) => (cat === "all" || t.cat === cat) && (!nq || norm(`${t.name}${t.aka ?? ""}${t.role}`).includes(nq)),
  );

  return (
    <div className="stack" style={{ gap: 10 }}>
      <label htmlFor="gear-q" className="skip">용어 찾기</label>
      <input id="gear-q" type="search" className="gear-q" placeholder="용어 찾기 (예: 드랙, 목줄, 찌멈춤)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips gear-cats" role="group" aria-label="분류">
        <button type="button" className="chip2" aria-pressed={cat === "all"} onClick={() => setCat("all")}>전체 {terms.length}</button>
        {cats.map((c) => (
          <button key={c.id} type="button" className="chip2" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            <span aria-hidden>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>
      <p className="small muted" style={{ margin: 0 }} aria-live="polite">{shown.length}개 용어</p>
      {cats
        .filter((c) => shown.some((t) => t.cat === c.id))
        .map((c) => (
          <section key={c.id} aria-labelledby={`gc-${c.id}`} className="stack" style={{ gap: 8 }}>
            <h3 id={`gc-${c.id}`} className="gear-cat-h">
              <span aria-hidden>{c.icon}</span> {c.label}
              <span className="small muted"> — {c.summary}</span>
            </h3>
            <ul className="gear-list">
              {shown
                .filter((t) => t.cat === c.id)
                .map((t) => (
                  <li key={t.id} id={`t-${t.id}`} className="card gear-term">
                    <h4>
                      {t.name}
                      {t.aka && <span className="small muted"> · {t.aka}</span>}
                    </h4>
                    <p className="gear-role">{t.role}</p>
                    <p className="small" style={{ margin: 0 }}>{t.why}</p>
                    {t.tip && <p className="small gear-tip"><b>요령</b> {t.tip}</p>}
                    {t.mistake && <p className="small gear-miss"><b>실수</b> {t.mistake}</p>}
                    {t.related && t.related.length > 0 && (
                      <div className="tags" aria-label="함께 쓰는 용어">
                        {t.related.map((r) => byId.get(r)).filter((r): r is Term => !!r).map((r) => (
                          <a key={r.id} href={`#t-${r.id}`} className="mini-chip blue">{r.name}</a>
                        ))}
                      </div>
                    )}
                    {t.link && (
                      <Link href={t.link.href} className="small link">{t.link.label} ›</Link>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      {!shown.length && <p className="sub">찾는 용어가 없어요. 다른 말로 찾아보세요.</p>}
    </div>
  );
}
