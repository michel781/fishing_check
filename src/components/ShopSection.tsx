"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { addTip, deleteTip, listTips, TIP_DAYS, validateTip, type ShopTip } from "@/lib/auth/tips";
import type { Shop } from "@/lib/shops";
import { useAuth } from "./auth/AuthProvider";
import { IcChevron, IcPin } from "./icons";

interface ShopsResponse {
  provider: "kakao" | "naver" | null;
  error: boolean;
  shops: Shop[];
  links: { kakao: string; naver: string };
}

const ago = (d: string) => {
  const days = Math.floor((Date.now() - Date.parse(`${d}T12:00:00+09:00`)) / 86400e3);
  return days <= 0 ? "오늘" : days === 1 ? "어제" : `${days}일 전`;
};
const todayKst = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

/**
 * 근처 낚시점 + 사장님 조황.
 * 낚시점은 채비·미끼만 파는 곳이 아니라 "요즘 어디서 뭐가 잘 나오는지" 가장 빠르게 아는 곳이다.
 * 1) 가까운 가게와 전화 버튼 2) 전화할 때 물어볼 말(자동 작성) 3) 이용자들이 사장님께 들은 최근 조황 공유
 */
export function ShopSection({
  spotId,
  spotName,
  dayLabel,
  mulddae,
  topSpecies,
  species,
}: {
  spotId: string;
  spotName: string;
  dayLabel: string;
  mulddae: string;
  topSpecies: string[];
  species: { id: string; name: string }[];
}) {
  const ref = useRef<HTMLElement>(null);
  const [data, setData] = useState<ShopsResponse | null>(null);
  const [tips, setTips] = useState<ShopTip[] | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTips = useCallback(() => {
    listTips(spotId)
      .then((t) => setTips(t ?? []))
      .catch(() => setTips([]));
  }, [spotId]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const load = () => {
      fetch(`/api/shops?spot=${encodeURIComponent(spotId)}`)
        .then((r) => r.json())
        .then((j: ShopsResponse) => setData(j))
        .catch(() => {});
      loadTips();
    };
    if (!("IntersectionObserver" in window)) return load();
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect();
        load();
      }
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [spotId, loadTips]);

  const fish = topSpecies.slice(0, 2).join("·") || "요즘 고기";
  const script = [
    `안녕하세요! ${dayLabel} ${spotName} 쪽으로 낚시 가려고 하는데요.`,
    `1) 요즘 ${fish} 잘 나와요? 다른 건 뭐가 나와요?`,
    `2) 어느 자리가 좋아요? (방파제 끝·안쪽·갯바위 등)`,
    `3) 채비랑 미끼는 뭘 쓰면 돼요? 가게에서 살 수 있나요?`,
    `4) ${mulddae}인데 물 들어올 때·빠질 때 중 언제가 좋아요?`,
    `5) 가게는 몇 시에 여세요?`,
  ].join("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const shops = data?.shops ?? [];
  return (
    <section ref={ref} className="card stack shop-section" style={{ gap: 12 }} aria-labelledby="shop-title">
      <div>
        <h2 id="shop-title" style={{ fontSize: "1.05rem" }}>🏪 근처 낚시점 · 사장님 조황</h2>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          낚시점 사장님은 매일 손님들 조과를 듣는 &lsquo;현장 정보통&rsquo;이에요. 채비·미끼를 사면서 요즘 잘 나오는 자리를 물어보세요.
        </p>
      </div>

      {/* 1. 가까운 가게 */}
      {!data ? (
        <p className="small muted" role="status" style={{ margin: 0 }}>근처 낚시점을 찾는 중…</p>
      ) : shops.length ? (
        <ul className="shop-list">
          {shops.map((s) => (
            <li key={s.id} className="shop-row">
              <span className="shop-ic" aria-hidden>🎣</span>
              <span style={{ minWidth: 0 }}>
                <span className="shop-name">{s.name}</span>
                <span className="small muted shop-addr">
                  {s.km != null && <><IcPin size={12} /> {s.km}km · </>}
                  {s.address ?? "주소 정보 없음"}
                </span>
              </span>
              <span className="shop-actions">
                {s.phone ? (
                  <a className="btn small primary" href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}>📞 전화</a>
                ) : (
                  <span className="small muted">번호 없음</span>
                )}
                {s.url && (
                  <a className="btn small" href={s.url} target="_blank" rel="noopener noreferrer">지도</a>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          <p className="small" style={{ margin: 0 }}>
            {data.provider ? "15km 안에서 낚시점을 찾지 못했어요. 지도에서 넓게 찾아보세요." : "지도 앱에서 이 근처 낚시점을 바로 찾아볼 수 있어요."}
          </p>
          <div className="row" style={{ gap: 8 }}>
            <a className="btn small" href={data.links.kakao} target="_blank" rel="noopener noreferrer">카카오맵에서 찾기</a>
            <a className="btn small" href={data.links.naver} target="_blank" rel="noopener noreferrer">네이버지도에서 찾기</a>
          </div>
        </div>
      )}
      {data && shops.length > 0 && (
        <p className="small muted" style={{ margin: 0 }}>
          {data.provider === "kakao" ? "카카오맵" : "네이버"} 정보 기준이에요. 문 닫은 가게가 있을 수 있으니 전화로 확인하세요.
        </p>
      )}

      {/* 2. 전화할 때 물어볼 말 */}
      <details className="ask-box">
        <summary>📋 전화·방문할 때 이렇게 물어보세요</summary>
        <pre className="ask-script">{script}</pre>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn small" onClick={copy}>{copied ? "복사했어요 ✓" : "문장 복사"}</button>
          <span className="small muted">미끼·채비를 사면서 물어보면 더 자세히 알려줘요.</span>
        </div>
      </details>

      {/* 3. 사장님께 들은 최근 조황 */}
      <TipBoard spotId={spotId} tips={tips} shops={shops} species={species} onChange={loadTips} />
    </section>
  );
}

function TipBoard({ spotId, tips, shops, species, onChange }: { spotId: string; tips: ShopTip[] | null; shops: Shop[]; species: { id: string; name: string }[]; onChange: () => void }) {
  const { user, nickname, mode } = useAuth();
  const [open, setOpen] = useState(false);
  const [shop, setShop] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [heard, setHeard] = useState(todayKst());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 이 기기 계정 방식은 서버가 없어 다른 사람과 조황을 나눌 수 없다
  if (mode === "local") {
    return (
      <div className="tip-empty">
        <strong>사장님 조황 모아보기</strong>
        <p className="small muted" style={{ margin: "4px 0 0" }}>서버 저장소가 연결되면 다른 낚시인들이 사장님께 들은 최근 조황을 이곳에서 볼 수 있어요.</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateTip({ shop_name: shop, content });
    if (v) return setErr(v);
    setBusy(true);
    try {
      await addTip({ spot_id: spotId, shop_name: shop.trim(), species: picked, content: content.trim(), heard_on: heard, nickname });
      setContent("");
      setPicked([]);
      setOpen(false);
      setErr(null);
      onChange();
    } catch {
      setErr("올리지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    if (!confirm("이 조황을 지울까요?")) return;
    await deleteTip(spotId, id).catch(() => {});
    onChange();
  };

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="between">
        <h3 style={{ margin: 0, fontSize: "1rem" }}>🗣 사장님께 들은 최근 조황</h3>
        <span className="small muted">최근 {TIP_DAYS}일</span>
      </div>
      {tips === null ? (
        <p className="small muted" style={{ margin: 0 }}>불러오는 중…</p>
      ) : tips.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>아직 공유된 조황이 없어요. 낚시점에 들렀다면 첫 소식을 남겨 주세요!</p>
      ) : (
        <ul className="tip-list">
          {tips.map((t) => (
            <li key={t.id} className="tip-row">
              <div className="between" style={{ gap: 8 }}>
                <strong className="tip-shop">{t.shop_name} 사장님</strong>
                <span className={`mini-chip ${ago(t.heard_on) === "오늘" || ago(t.heard_on) === "어제" ? "green" : ""}`}>{ago(t.heard_on)}</span>
              </div>
              {t.species.length > 0 && (
                <span className="tags">{t.species.map((s) => <span key={s} className="mini-chip blue">{species.find((x) => x.id === s)?.name ?? s}</span>)}</span>
              )}
              <p style={{ margin: 0 }}>&ldquo;{t.content}&rdquo;</p>
              <span className="small muted">
                {t.nickname ?? "낚시인"} 님이 전해 줬어요
                {user?.id === t.author && (
                  <button type="button" className="link-btn" style={{ minHeight: 32, marginLeft: 6 }} onClick={() => remove(t.id)}>지우기</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!user ? (
        <Link className="btn" href={`/login?next=${encodeURIComponent(`/spot/${spotId}`)}`}>로그인하고 들은 조황 공유하기 <IcChevron size={16} /></Link>
      ) : !open ? (
        <button type="button" className="btn primary" onClick={() => setOpen(true)}>✍️ 사장님께 들은 조황 공유하기</button>
      ) : (
        <form className="stack tip-form" style={{ gap: 10 }} onSubmit={submit} noValidate>
          <label>
            어느 낚시점이에요?
            <input list={`shops-${spotId}`} value={shop} onChange={(e) => setShop(e.target.value)} maxLength={40} placeholder="예: 신진도낚시" />
            <datalist id={`shops-${spotId}`}>{shops.map((s) => <option key={s.id} value={s.name} />)}</datalist>
          </label>
          <div className="chips" role="group" aria-label="어종 (여러 개 선택)">
            {species.map((s) => (
              <button key={s.id} type="button" className="chip2 blue" aria-pressed={picked.includes(s.id)} onClick={() => setPicked((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}>
                {s.name}
              </button>
            ))}
          </div>
          <label>
            사장님이 뭐라고 하셨어요?
            <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={300} rows={3} placeholder="예: 요즘 방파제 끝에서 해질녘 들물에 우럭이 잘 나온대요. 미끼는 청갯지렁이." />
          </label>
          <label>
            들은 날
            <input type="date" value={heard} max={todayKst()} onChange={(e) => setHeard(e.target.value)} />
          </label>
          {err && <p className="field-err" role="alert">{err}</p>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary" disabled={busy}>{busy ? "올리는 중…" : "공유하기"}</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>취소</button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>개인 연락처·비방은 적지 말아 주세요. 틀린 정보일 수 있으니 참고용으로 봐 주세요.</p>
        </form>
      )}
    </div>
  );
}
