import type { Metadata } from "next";
import Link from "next/link";
import { AppHead } from "@/components/AppHead";
import { IcMoon, IcTide, IcWave } from "@/components/icons";
import { Tabs } from "@/components/Tabs";
import { GRADE_LEGEND, scoreGrade } from "@/lib/grade";

export const metadata: Metadata = {
  title: "도움말",
  description: "낚시지수 읽는 법, 물때·사리·조금·들물·썰물 같은 바다낚시 용어, 안전 수칙, 자주 묻는 질문.",
};

/** 물때 용어 카드 (쉬운 말) */
const TERMS: { id: string; name: string; desc: string; icon: "tide" | "wave" | "moon" | "up" | "down" }[] = [
  { id: "mulddae", name: "물때", desc: "달 모양(음력 날짜)에 따라 바닷물이 얼마나 세게 드나드는지 나눈 이름이에요. 1물~13물, 조금으로 불러요.", icon: "moon" },
  { id: "sari", name: "사리", desc: "보름·그믐 무렵. 물이 가장 많이 들고 나서 물살이 제일 세요.", icon: "wave" },
  { id: "jogeum", name: "조금", desc: "반달 무렵. 물살이 가장 약해서 바닥 낚시가 편해요.", icon: "tide" },
  { id: "deulmul", name: "들물", desc: "바닷물이 차오르는 시간(밀물). 방파제 낚시는 들물 초반이 좋은 경우가 많아요.", icon: "up" },
  { id: "ssulmul", name: "썰물", desc: "바닷물이 빠지는 시간. 갯벌·갯바위는 길이 끊길 수 있어 조심해요.", icon: "down" },
  { id: "manjo", name: "만조", desc: "물이 가장 높이 찬 때. 하루 두 번 있어요.", icon: "up" },
  { id: "ganjo", name: "간조", desc: "물이 가장 많이 빠진 때. 서해는 바닥이 드러나기도 해요.", icon: "down" },
  { id: "muldori", name: "물돌이", desc: "만조·간조 앞뒤로 물 흐름이 멈췄다가 방향을 바꾸는 때. 이 앞뒤 1시간에 입질이 몰려요.", icon: "tide" },
  { id: "swell", name: "너울", desc: "먼바다에서 밀려오는 큰 파도. 바람 없는 맑은 날에도 갑자기 덮쳐요. 동해에서 특히 위험해요.", icon: "wave" },
];

const SAFETY = [
  "구명조끼를 꼭 입어요 (방파제·갯바위·배 모두).",
  "테트라포드(뾰족한 콘크리트 블록) 위로 올라가지 않아요.",
  "갯벌·갯바위는 물이 들어오기 2시간 전에 나와요.",
  "바닥이 젖은 자리는 파도가 닿는 곳이에요. 피해요.",
  "강풍·풍랑 특보가 있으면 가지 않아요.",
  "혼자 가지 말고, 가는 곳을 가족에게 알려요.",
  "위급할 땐 해양경찰 122에 전화해요.",
];

const FAQ: [string, string][] = [
  ["낚시지수는 어떻게 계산하나요?", "물때·물 흐름·바람·파도·물 온도·시간대(새벽·해질녘)·포인트 궁합·제철을 합쳐 0~100점으로 만들어요. 바람·파도가 위험하면 점수와 상관없이 '위험'으로 표시해요."],
  ["황금타임이 뭐예요?", "점수가 65점 이상인 시간이 이어지는 구간이에요(최대 4시간). 오늘은 지금 이후 남은 시간만 보여줘요."],
  ["점수가 높으면 꼭 잡히나요?", "아니요. 날씨·바다 예보로 계산한 '잡힐 가능성'이에요. 실제로는 채비·미끼·현장 상황에 따라 달라져요."],
  ["데이터는 어디서 오나요?", "국립해양조사원(물때·물높이), 기상청(날씨), Open-Meteo(파도·물 온도)에서 받아와요. 연결이 안 되면 추정값을 쓰고 화면에 표시해요."],
  ["배낚시(선상) 시간은 왜 새벽~오후만 나와요?", "배는 보통 새벽 4시~오후 5시에 운항해서 그 시간만 계산해요."],
  ["내 기록은 어디에 저장돼요?", "이 휴대폰(브라우저)에만 저장돼요. 다른 기기로 옮기려면 '내 기록'에서 파일로 내보내세요."],
  ["금어기는 어떻게 알 수 있나요?", "어종 화면에 금어기·금지체장을 보여줘요. 해마다 바뀔 수 있으니 해양수산부 공고도 확인하세요."],
];

function TermIcon({ icon }: { icon: (typeof TERMS)[number]["icon"] }) {
  if (icon === "moon") return <IcMoon size={22} />;
  if (icon === "wave") return <IcWave size={22} />;
  if (icon === "up") return <span aria-hidden style={{ fontWeight: 900, fontSize: "1.2rem" }}>↗</span>;
  if (icon === "down") return <span aria-hidden style={{ fontWeight: 900, fontSize: "1.2rem" }}>↘</span>;
  return <IcTide size={22} />;
}

export default function GuidePage() {
  const guide = (
    <>
      <section aria-labelledby="legend-h" className="card stack" style={{ gap: 12 }}>
        <h2 id="legend-h" style={{ fontSize: "1.05rem" }}>낚시지수란?</h2>
        <p className="small sub" style={{ margin: 0 }}>물때, 날씨, 파도, 물 온도를 합쳐 낚시하기 좋은 정도를 0~100점으로 보여줘요.</p>
        <div className="legend">
          {GRADE_LEGEND.map((g) => {
            const gr = scoreGrade(g.min);
            return (
              <div key={g.range} className="legend-row">
                <span className={`rg num tone-${gr.tone}`}>{g.range}</span>
                <span className="lb">{gr.label}</span>
                <span className="ds">{gr.message}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="terms-h" className="stack" style={{ gap: 8 }}>
        <h2 id="terms-h" style={{ fontSize: "1.05rem" }}>물때 용어 설명</h2>
        {TERMS.map((t) => (
          <div key={t.id} id={t.id} className="term" style={{ scrollMarginTop: 80 }}>
            <span className="ic"><TermIcon icon={t.icon} /></span>
            <span className="nm">{t.name}</span>
            <span className="ds">{t.desc}</span>
          </div>
        ))}
        <p className="small muted" style={{ margin: 0 }}>
          서해는 7물때식(음력 1·16일 = 7물), 남해는 8물때식을 많이 써요. <Link href="/settings" className="link">설정</Link>에서 바꿀 수 있어요.
        </p>
      </section>

      <section id="safety" aria-labelledby="safety-h" className="card stack" style={{ gap: 8, scrollMarginTop: 80 }}>
        <h2 id="safety-h" style={{ fontSize: "1.05rem" }}>안전 수칙</h2>
        <p className="small muted" style={{ margin: 0 }}>출발 전에 하나씩 체크해 보세요.</p>
        <ul className="checks">
          {SAFETY.map((s) => (
            <li key={s}><label><input type="checkbox" /> {s}</label></li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 style={{ fontSize: "1.05rem" }}>금어기·금지체장</h2>
        <p className="small sub" style={{ margin: 0 }}>
          잡으면 안 되는 기간(금어기)과 크기(금지체장)는 해마다 바뀌고 지역마다 달라요. 최신 기준은{" "}
          <a className="link" href="https://www.mof.go.kr/doc/ko/selectDoc.do?docSeq=66688&menuSeq=1009&bbsSeq=22" target="_blank" rel="noreferrer">해양수산부 공고</a>를 확인하세요.
        </p>
      </section>
    </>
  );

  const faq = (
    <div className="stack" style={{ gap: 8 }}>
      {FAQ.map(([q, a]) => (
        <details key={q} className="card">
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>{q}</summary>
          <p className="sub" style={{ margin: "8px 0 0" }}>{a}</p>
        </details>
      ))}
      <a className="btn" href="https://github.com/michel781/fishing_check/issues" target="_blank" rel="noreferrer">다른 질문 보내기</a>
    </div>
  );

  return (
    <div className="stack" style={{ gap: 12 }}>
      <AppHead title="도움말" />
      <Link href="/rigs" className="card card-link between" style={{ padding: 12 }}>
        <span><strong>🪝 채비 도감</strong> <span className="small muted">바닥·찌·카드·루어·에기 채비 16종의 구성·원리·쓰는 법</span></span>
        <span aria-hidden>›</span>
      </Link>
      <Link href="/gear" className="card card-link between" style={{ padding: 12 }}>
        <span><strong>🎒 바다낚시 장비·용어</strong> <span className="small muted">낚싯대·릴·줄·채비 소품이 하는 일과 드랙·찌멈춤·목줄 같은 용어</span></span>
        <span aria-hidden>›</span>
      </Link>
      <Link href="/structures" className="card card-link between" style={{ padding: 12 }}>
        <span><strong>🧱 구조물별 서식 가이드</strong> <span className="small muted">테트라포드·석축·모래 바닥마다 어떤 고기가 왜 모이고 어디에 내릴지</span></span>
        <span aria-hidden>›</span>
      </Link>
      <Tabs
        label="도움말"
        tabs={[
          { id: "guide", label: "이용 가이드", content: guide },
          { id: "faq", label: "자주 묻는 질문", content: faq },
        ]}
      />
    </div>
  );
}
