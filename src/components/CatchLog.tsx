"use client";

import { useEffect, useMemo, useState } from "react";
import { FishArt } from "./art/FishArt";
import { pushLog, removeLog } from "@/lib/auth/sync";
import { LOG_EVT, readLogs, writeLogs, type LogEntry } from "@/lib/localStore";
import { IcCamera, IcPin, IcPlus } from "./icons";

type Entry = LogEntry;

function localInputNow() {
  const d = new Date(Date.now() + 9 * 3600e3);
  return d.toISOString().slice(0, 16);
}

/** 사진을 긴 변 480px JPEG로 줄인다 (저장 공간 절약) */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 480 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

const kstDate = (iso: string) => {
  const d = new Date(Date.parse(iso) + 9 * 3600e3);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
};

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
  const [open, setOpen] = useState(!!initialSpot);
  const [filter, setFilter] = useState("");
  const [spotId, setSpotId] = useState(start.id);
  const [speciesId, setSpeciesId] = useState(initialSpecies && start.species.includes(initialSpecies) ? initialSpecies : start.species[0]);
  const [saved, setSaved] = useState<string>("");
  const [time, setTime] = useState("");
  const [count, setCount] = useState(1);
  const [maxCm, setMaxCm] = useState("");
  const [memo, setMemo] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setEntries(readLogs());
    sync();
    setTime(localInputNow());
    // 로그인 직후 계정 기록과 합쳐지면 목록을 다시 읽는다
    window.addEventListener(LOG_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LOG_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const spot = spots.find((s) => s.id === spotId)!;
  const spName = (id: string) => species.find((s) => s.id === id)?.name ?? id;
  const spotName = (id: string) => spots.find((s) => s.id === id)?.name ?? id;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPhoto(await shrink(f));
    } catch {
      setSaved("사진을 읽지 못했어요. 다른 사진을 골라 주세요.");
    }
  };

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
      ...(photo ? { photo } : {}),
    };
    const next = [entry, ...entries];
    let ok = writeLogs(next);
    if (!ok && photo) {
      // 저장 공간이 부족하면 사진 없이 저장
      delete entry.photo;
      ok = writeLogs(next);
    }
    setEntries(next);
    void pushLog(entry);
    setMemo("");
    setMaxCm("");
    setPhoto("");
    setBusy(false);
    setSaved(
      (!ok ? "⚠ 저장 공간이 부족해 기록이 사라질 수 있어요. " : "") +
        (predicted
          ? `저장했어요. 그 시각 예측은 ${predicted.score}점${predicted.inGolden ? "(황금타임)" : ""}이었어요. ${count > 0 ? (predicted.score >= 65 ? "예측이 맞았네요 🎯" : "예측보다 잘 나왔어요!") : predicted.score >= 65 ? "예측과 달랐어요." : ""}`
          : "저장했어요. (예보 범위 밖이라 예측 점수는 없어요)"),
    );
  };

  const remove = (id: string) => {
    if (!confirm("이 기록을 지울까요?")) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    writeLogs(next);
    void removeLog(id);
  };

  const stats = useMemo(() => {
    const withPred = entries.filter((e) => e.predicted);
    const success = withPred.filter((e) => e.count > 0);
    const hit = success.filter((e) => e.predicted!.inGolden || e.predicted!.score >= 65);
    const maxCm = entries.reduce((m, e) => Math.max(m, e.maxCm ?? 0), 0);
    return {
      total: entries.reduce((a, e) => a + e.count, 0),
      trips: entries.length,
      maxCm,
      hitRate: success.length ? Math.round((hit.length / success.length) * 100) : null,
      evaluated: success.length,
    };
  }, [entries]);

  const kinds = useMemo(() => [...new Set(entries.map((e) => e.speciesId))], [entries]);
  const shown = filter ? entries.filter((e) => e.speciesId === filter) : entries;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fishing-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="stat3 num">
        <div><div className="k">총 출조</div><div className="v">{stats.trips}<small>회</small></div></div>
        <div><div className="k">총 조과</div><div className="v">{stats.total}<small>마리</small></div></div>
        <div><div className="k">최대어</div><div className="v">{stats.maxCm || "-"}{stats.maxCm ? <small>cm</small> : null}</div></div>
      </div>
      {stats.hitRate != null && (
        <p className="small muted" style={{ margin: 0 }}>황금타임 적중률 {stats.hitRate}% · 조과 {stats.evaluated}건 중 예측 65점 이상</p>
      )}

      <button className="big-cta" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="log-form">
        <IcPlus size={22} /> {open ? "입력 닫기" : "조과 기록 추가하기"}
      </button>

      {open && (
        <form id="log-form" className="card stack" onSubmit={submit} style={{ gap: 10 }}>
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
            <label>날짜·시각
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
            <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={200} placeholder="예: 들물 시작에 청갯지렁이로 연속 입질" />
          </label>
          <div className="row" style={{ alignItems: "center" }}>
            <label className="btn" style={{ flexDirection: "row", gap: 6, cursor: "pointer", position: "relative" }}>
              <IcCamera size={18} /> {photo ? "사진 바꾸기" : "사진 추가 (선택)"}
              <input type="file" accept="image/*" onChange={pick} aria-label="사진 추가" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", minHeight: 0, opacity: 0, cursor: "pointer" }} />
            </label>
            {photo && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="고른 사진 미리보기" width={56} height={56} style={{ objectFit: "cover", borderRadius: 10 }} />
                <button type="button" className="btn small" onClick={() => setPhoto("")}>사진 빼기</button>
              </>
            )}
          </div>
          <button className="btn primary" disabled={busy}>{busy ? "저장 중…" : "기록 저장"}</button>
          <p className="small muted" style={{ margin: 0 }}>기록과 사진은 이 휴대폰에만 저장돼요.</p>
        </form>
      )}
      {saved && <p className="small" role="status" style={{ margin: 0 }}>{saved}</p>}

      {kinds.length > 0 && (
        <div className="chips" role="group" aria-label="어종별 보기">
          <button className="chip2" aria-pressed={!filter} onClick={() => setFilter("")}>전체</button>
          {kinds.map((k) => <button key={k} className="chip2" aria-pressed={filter === k} onClick={() => setFilter(k)}>{spName(k)}</button>)}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>아직 기록이 없어요</p>
          <p className="sub" style={{ margin: "6px 0 0" }}>잡은 물고기를 적어 두면 그 시간의 예측 점수와 비교해 볼 수 있어요.</p>
        </div>
      ) : (
        <ul className="list" style={{ gap: 12 }}>
          {shown.map((e) => (
            <li key={e.id} className="rec-row">
              <span className="ph">
                {e.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.photo} alt={`${spName(e.speciesId)} 사진`} />
                ) : (
                  <FishArt id={e.speciesId} />
                )}
              </span>
              <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <strong style={{ fontSize: "1.05rem" }}>{spName(e.speciesId)} {e.count}마리</strong>
                <span className="small muted" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><IcPin size={13} /> {spotName(e.spotId)}</span>
                <span className="small muted num">{kstDate(e.time)}</span>
                <span className="tags">
                  {e.maxCm ? <span className="mini-chip blue">최대 {e.maxCm}cm</span> : null}
                  {e.predicted && <span className={`mini-chip ${e.predicted.inGolden ? "orange" : ""}`}>예측 {e.predicted.score}점{e.predicted.inGolden ? " · 황금타임" : ""}</span>}
                </span>
                {e.memo && <span className="small">{e.memo}</span>}
              </span>
              <button className="btn small" onClick={() => remove(e.id)} aria-label={`${spName(e.speciesId)} 기록 삭제`}>삭제</button>
            </li>
          ))}
        </ul>
      )}
      {entries.length > 0 && <button className="btn" onClick={exportJson}>기록 파일로 내보내기 (JSON)</button>}
    </div>
  );
}
