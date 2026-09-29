"use client";

import { useEffect, useMemo, useState } from "react";

interface Entry {
  id: string;
  spotId: string;
  speciesId: string;
  time: string; // ISO
  count: number;
  maxCm: number | null;
  memo: string;
  predicted: { score: number; grade: string; inGolden: boolean } | null;
}

const KEY = "fc:log";

function load(): Entry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function save(v: Entry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
}

function localInputNow() {
  const d = new Date(Date.now() + 9 * 3600e3);
  return d.toISOString().slice(0, 16);
}

export function CatchLog({
  spots,
  species,
  initialSpot,
  initialSpecies,
}: {
  spots: { id: string; name: string; species: string[] }[];
  species: { id: string; name: string }[];
  initialSpot?: string;
  initialSpecies?: string;
}) {
  const start = spots.find((s) => s.id === initialSpot) ?? spots[0];
  const [entries, setEntries] = useState<Entry[]>([]);
  const [spotId, setSpotId] = useState(start.id);
  const [speciesId, setSpeciesId] = useState(initialSpecies && start.species.includes(initialSpecies) ? initialSpecies : start.species[0]);
  const [saved, setSaved] = useState<string>("");
  const [time, setTime] = useState("");
  const [count, setCount] = useState(1);
  const [maxCm, setMaxCm] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEntries(load());
    setTime(localInputNow());
  }, []);

  const spot = spots.find((s) => s.id === spotId)!;
  const spName = (id: string) => species.find((s) => s.id === id)?.name ?? id;
  const spotName = (id: string) => spots.find((s) => s.id === id)?.name ?? id;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const iso = new Date(`${time}:00+09:00`).toISOString();
    let predicted: Entry["predicted"] = null;
    try {
      const r = await fetch(`/api/forecast?spot=${spotId}&species=${speciesId}&days=7`).then((x) => x.json());
      const t = Date.parse(iso);
      const h = (r.hours as { time: string; score: number; grade: string }[] | undefined)?.find((x) => {
        const s = Date.parse(x.time);
        return t >= s && t < s + 3600e3;
      });
      if (h) {
        const inGolden = (r.days as { golden: { start: string; end: string }[] }[]).some((d) =>
          d.golden.some((g) => t >= Date.parse(g.start) && t < Date.parse(g.end)),
        );
        predicted = { score: h.score, grade: h.grade, inGolden };
      }
    } catch {}
    const entry: Entry = {
      id: `${Date.now()}`,
      spotId, speciesId, time: iso, count,
      maxCm: maxCm ? Number(maxCm) : null,
      memo, predicted,
    };
    const next = [entry, ...entries];
    setEntries(next);
    save(next);
    setMemo("");
    setBusy(false);
    setSaved(
      predicted
        ? `저장했습니다. 그 시각 예측은 ${predicted.score}점${predicted.inGolden ? "(골든타임)" : ""}이었어요. ${count > 0 ? (predicted.score >= 65 ? "예측이 맞았네요 🎯" : "예측보다 잘 나왔어요 — 보정에 반영됩니다") : predicted.score >= 65 ? "예측과 달랐어요 — 보정에 반영됩니다" : ""}`
        : "저장했습니다. (예보 범위 밖이라 예측 점수는 없습니다)",
    );
  };

  const remove = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    save(next);
  };

  const stats = useMemo(() => {
    const withPred = entries.filter((e) => e.predicted);
    const success = withPred.filter((e) => e.count > 0);
    const hit = success.filter((e) => e.predicted!.inGolden || e.predicted!.score >= 65);
    return {
      total: entries.reduce((a, e) => a + e.count, 0),
      trips: entries.length,
      hitRate: success.length ? Math.round((hit.length / success.length) * 100) : null,
      evaluated: success.length,
    };
  }, [entries]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fishing-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack">
      <form className="card stack" onSubmit={submit} style={{ gap: 10 }}>
        <div className="grid-2" style={{ gap: 10 }}>
          <label>포인트
            <select value={spotId} onChange={(e) => { setSpotId(e.target.value); setSpeciesId(spots.find((s) => s.id === e.target.value)!.species[0]); }}>
              {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>어종
            <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
              {spot.species.map((id) => <option key={id} value={id}>{spName(id)}</option>)}
            </select>
          </label>
          <label>시각
            <input type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <label style={{ flex: 1 }}>마릿수
              <input type="number" min={0} max={999} inputMode="numeric" value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </label>
            <label style={{ flex: 1 }}>최대(cm)
              <input type="number" min={0} max={200} inputMode="decimal" value={maxCm} onChange={(e) => setMaxCm(e.target.value)} />
            </label>
          </div>
        </div>
        <label>메모 (채비·미끼·상황)
          <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={200} placeholder="예: 초들물에 청갯지렁이로 연타" />
        </label>
        <button className="btn primary" disabled={busy}>{busy ? "저장 중…" : "기록 저장"}</button>
        {saved && <p className="small" role="status" style={{ margin: 0 }}>{saved}</p>}
      </form>

      <div className="kv num">
        <div><div className="k">총 조과</div><div className="v">{stats.total}마리</div></div>
        <div><div className="k">기록 수</div><div className="v">{stats.trips}회</div></div>
        <div>
          <div className="k">골든타임 적중률</div>
          <div className="v">{stats.hitRate == null ? "-" : `${stats.hitRate}%`}</div>
          <div className="small muted">{stats.evaluated ? `조과 ${stats.evaluated}건 중 예측 65점↑` : "예보 범위 내 기록 필요"}</div>
        </div>
      </div>

      <ul className="list">
        {entries.map((e) => (
          <li key={e.id} className="card between" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>{spName(e.speciesId)} {e.count}마리</strong>{e.maxCm ? <span className="sub"> · 최대 {e.maxCm}cm</span> : null}
              <div className="small muted">{spotName(e.spotId)} · {new Date(Date.parse(e.time) + 9 * 3600e3).toISOString().slice(0, 16).replace("T", " ")}</div>
              {e.memo && <div className="small">{e.memo}</div>}
              {e.predicted && (
                <div className="small sub">예측 {e.predicted.score}점{e.predicted.inGolden ? " · 골든타임" : ""}</div>
              )}
            </div>
            <button className="btn" onClick={() => remove(e.id)} aria-label="기록 삭제">삭제</button>
          </li>
        ))}
      </ul>
      {entries.length > 0 && <button className="btn" onClick={exportJson}>JSON 내보내기</button>}
    </div>
  );
}
