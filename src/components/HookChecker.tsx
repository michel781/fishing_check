"use client";

import { useEffect, useState } from "react";
import { HOOK_CHECK, STATUS_INFO, judgeHook, rangeText } from "@/data/hookCheck";

const KEY = "fc:hook-check";

/** 내 바늘 체크: 어종을 고르고 가진 바늘(같은 계열)의 호수를 넣으면 권장 범위와 비교한다 */
export function HookChecker({ species }: { species: { id: string; name: string }[] }) {
  const list = species.filter((s) => HOOK_CHECK[s.id]?.range);
  const [id, setId] = useState(list.find((s) => s.id === "blackporgy")?.id ?? list[0]?.id);
  const c = HOOK_CHECK[id];
  const r = c?.range;
  const [n, setN] = useState<number>(r?.base ?? r?.min ?? 1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && HOOK_CHECK[saved]?.range) setId(saved);
    } catch {}
  }, []);
  useEffect(() => {
    const rr = HOOK_CHECK[id]?.range;
    if (rr) setN(rr.base ?? rr.min);
  }, [id]);

  if (!c || !r) return null;
  const step = r.unit === "에기 호" ? 0.5 : 1;
  const res = judgeHook(id, n);
  const tone = res?.verdict === "적당" ? "green" : res?.verdict === "작음" ? "blue" : "orange";
  const shown = r.unit === "/0" ? `${n}/0` : `${r.unit === "에기 호" ? n.toFixed(1) : n}호`;

  return (
    <div className="hk-check stack" style={{ gap: 10 }}>
      <div className="hk-check-row">
        <label htmlFor="hk-sp">어종</label>
        <select
          id="hk-sp"
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            try {
              localStorage.setItem(KEY, e.target.value);
            } catch {}
          }}
        >
          {list.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <p className="small" style={{ margin: 0 }}>
        권장: <b>{c.series} {rangeText(r)}</b>
        {r.base != null && <> (기본 {r.base}호)</>}{" "}
        <span className={`mini-chip ${STATUS_INFO[c.status].tone}`}>출처 {c.status}</span>
      </p>
      <p className="small muted" style={{ margin: 0 }}>가진 바늘 포장의 이름이 &lsquo;{c.series}&rsquo;일 때만 숫자로 비교할 수 있어요. 계열이 다르면 같은 숫자라도 크기가 달라요.</p>
      <div className="hk-check-row">
        <span id="hk-n-l">내 바늘</span>
        <div className="hk-step" role="group" aria-labelledby="hk-n-l">
          <button type="button" onClick={() => setN((v) => Math.max(step, +(v - step).toFixed(1)))} aria-label="한 호수 작게">−</button>
          <output aria-live="polite" className="num">{shown}</output>
          <button type="button" onClick={() => setN((v) => +(v + step).toFixed(1))} aria-label="한 호수 크게">＋</button>
        </div>
      </div>
      {res && (
        <p className={`hk-verdict ${tone}`} style={{ margin: 0 }} aria-live="polite">
          <b>{res.verdict === "적당" ? "✓ 적당해요" : res.verdict === "작음" ? "▼ 작아요" : "▲ 커요"}</b> {res.msg}
        </p>
      )}
      {c.beyond && <p className="small" style={{ margin: 0 }}><b>예외</b> {c.beyond}</p>}
    </div>
  );
}
