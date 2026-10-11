"use client";

import { useState } from "react";
import { pickRigs, type Layer, type Place } from "@/data/rigs";

const PLACES: Place[] = ["방파제·갯바위", "백사장", "배"];
const LAYERS: Layer[] = ["바닥", "중층", "표층"];
const BAITS = ["생미끼", "루어"] as const;
const LEVEL = ["", "쉬움", "보통", "어려움"];

function Row<T extends string>({ label, opts, v, set }: { label: string; opts: readonly T[]; v: T | undefined; set: (x: T | undefined) => void }) {
  return (
    <div className="rig-q" role="group" aria-label={label}>
      <span className="small muted">{label}</span>
      <div className="chips">
        <button type="button" className="chip2" aria-pressed={!v} onClick={() => set(undefined)}>상관없음</button>
        {opts.map((o) => (
          <button key={o} type="button" className="chip2" aria-pressed={v === o} onClick={() => set(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

/** 채비 고르기: 어디서 · 어느 깊이 · 어떤 미끼 → 맞는 채비 (쉬운 순) */
export function RigPicker() {
  const [place, setPlace] = useState<Place | undefined>();
  const [layer, setLayer] = useState<Layer | undefined>();
  const [bait, setBait] = useState<(typeof BAITS)[number] | undefined>();
  const list = pickRigs({ place, layer, bait });
  return (
    <div className="stack" style={{ gap: 8 }}>
      <Row label="어디서" opts={PLACES} v={place} set={setPlace} />
      <Row label="노리는 깊이" opts={LAYERS} v={layer} set={setLayer} />
      <Row label="미끼" opts={BAITS} v={bait} set={setBait} />
      <p className="small" style={{ margin: 0 }} aria-live="polite">
        <b>{list.length}개</b> 채비가 맞아요{list.length ? " (쉬운 것부터)" : " — 조건을 하나 풀어 보세요"}.
      </p>
      <ol className="rig-pick">
        {list.map((r) => (
          <li key={r.id}>
            <a href={`#rig-${r.id}`} className="link"><b>{r.name}</b></a>
            <span className="small muted"> · {LEVEL[r.level]} · {r.layer.join("·")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
