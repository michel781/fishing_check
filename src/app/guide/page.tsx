import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "용어·도움말",
  description: "물때, 사리, 조금, 들물·썰물, 물돌이, 너울 등 바다낚시 용어와 피싱체크 점수 읽는 법, 안전 수칙.",
};

const TERMS: [string, string, string][] = [
  ["mulddae", "물때", "음력 날짜에 따라 바닷물이 드나드는 세기를 나눈 이름입니다. 1물~13물, 조금, 무시로 부르며 보름·그믐 무렵이 사리, 상현·하현 무렵이 조금입니다. 서해는 7물때식(음력 1·16일 = 7물), 남해는 8물때식(하루 앞서 셈)을 많이 씁니다. 설정에서 바꿀 수 있습니다."],
  ["sari", "사리 (대조)", "달과 해가 일직선이 되는 보름·그믐 1~2일 뒤. 만조와 간조의 차이(조차)가 가장 크고 물살이 셉니다. 선상 바닥낚시는 채비 운용이 어렵지만, 참돔처럼 조류를 좋아하는 어종에는 유리합니다."],
  ["jogeum", "조금 · 무시", "상현·하현 무렵으로 조차와 물살이 가장 약합니다. 주꾸미·우럭 선상처럼 바닥을 차분히 노릴 때 좋습니다. 무시는 조금 다음 날입니다."],
  ["deulmul", "들물 · 썰물", "들물(밀물)은 간조에서 만조로 물이 차오르는 시간, 썰물은 반대입니다. 방파제·갯바위 워킹 낚시는 들물 초·중반을 선호하는 경우가 많습니다."],
  ["muldori", "물돌이 (정조)", "만조·간조 전후로 물 흐름이 멈췄다가 방향을 바꾸는 시간입니다. 전후 1시간에 입질이 몰리는 경우가 많습니다."],
  ["manjo", "만조 · 간조", "하루 두 번씩 바닷물이 가장 높을 때(만조)와 낮을 때(간조)입니다. 서해는 간조 때 수심이 크게 줄어 포인트가 사라지거나, 갯벌이 드러나 고립 위험이 생깁니다."],
  ["joccha", "조차", "그날 만조와 간조의 높이 차이입니다. 인천은 사리 때 8m 이상, 동해는 30cm 안팎입니다. 그래서 동해는 물때보다 파도·수온이 더 중요합니다."],
  ["wave", "유의파고", "파도 중 높은 1/3의 평균 높이로, 예보의 '파고'입니다. 실제로는 이보다 1.5~2배 높은 파도가 섞여 옵니다."],
  ["swell", "너울 · 파주기", "먼바다 저기압·태풍이 만든 긴 주기(8초 이상)의 파도입니다. 바람이 없는 맑은 날에도 갑자기 방파제·갯바위를 덮쳐 동해 사고의 주원인이 됩니다."],
  ["coldwater", "냉수대", "여름철 남서풍이 이어질 때 동해 연안에 차가운 바닷물이 솟아오르는 현상입니다. 수온이 하루 이틀 새 5℃ 이상 떨어져 입질이 급감합니다."],
];

export default function GuidePage() {
  return (
    <div className="stack">
      <h1>용어·도움말</h1>

      <section className="card">
        <h2>점수 읽는 법</h2>
        <ul className="checklist small">
          <li><strong>피싱 인덱스(0~100)</strong>: 물때·물 흐름·바람·파도·수온·시간대·포인트 궁합·시즌을 합친 점수입니다. 80점 이상 최고, 65점 이상 좋음, 50점 이상 보통입니다.</li>
          <li><strong>골든타임</strong>: 점수가 높은 시간이 이어지는 구간(최대 4시간)입니다. 오늘은 <strong>지금 이후 남은 시간</strong> 기준으로 보여주고, 지난 구간은 흐리게 표시합니다.</li>
          <li><strong>위험</strong>: 강풍·높은 파도·너울·해무·간조 고립 조건이면 점수와 관계없이 위험으로 표시하고 대체 포인트를 제안합니다.</li>
          <li><strong>데이터 배지</strong>: 초록 = 기상청·해양조사원 공식 예보, 파랑 = 국제 예보 모델, 노랑 = 조석 추정, 빨강 = 데모(판단에 쓰지 마세요).</li>
          <li><strong>선상</strong>은 04~17시 출항 기준으로 계산합니다.</li>
        </ul>
      </section>

      <section className="card">
        <h2>물때·바다 용어</h2>
        <dl className="glossary">
          {TERMS.map(([id, term, desc]) => (
            <div key={id} id={id} style={{ scrollMarginTop: 80 }}>
              <dt>{term}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card" id="safety" style={{ scrollMarginTop: 80 }}>
        <h2>안전 수칙</h2>
        <ul className="checklist small">
          <li>구명조끼는 갯바위·방파제·선상 어디서나 착용합니다.</li>
          <li>테트라포드 위로 이동하지 않습니다. 떨어지면 혼자 빠져나오기 어렵습니다.</li>
          <li>갯벌·갯바위는 간조 전후에 들어가지 않고, 만조 2시간 전에는 철수합니다.</li>
          <li>동해는 맑은 날에도 너울이 옵니다. 바닥이 젖어 있는 자리(파도가 닿은 흔적)는 피합니다.</li>
          <li>풍랑·강풍 특보 중에는 출조하지 않습니다. 긴급 신고는 <strong>해양경찰 122</strong>입니다.</li>
        </ul>
      </section>

      <section className="card">
        <h2>금어기·금지체장</h2>
        <p className="small sub" style={{ margin: 0 }}>
          어종별 금어기와 금지체장은 해마다 바뀌고 지역별 예외가 있습니다. 피싱체크는 확인된 항목만 경고하며, 최신 기준은{" "}
          <a className="link" href="https://www.mof.go.kr/doc/ko/selectDoc.do?docSeq=66688&menuSeq=1009&bbsSeq=22" target="_blank" rel="noreferrer">해양수산부 공고</a>를 확인하세요.
        </p>
      </section>

      <Link className="btn" href="/">홈으로</Link>
    </div>
  );
}
