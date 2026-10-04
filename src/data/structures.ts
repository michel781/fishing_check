/**
 * 구조물·바닥 지형별 서식 가이드 (동해 북부 내항 초보 기준).
 * 근거는 세 종류로 구분해 표시한다.
 *  - 생태: 공공기관·학술·백과의 일반 생태 특성
 *  - 현장: 낚시 매체 기사·포인트 DB의 해당 지역 기록 (작성일·조행일을 함께 적음)
 *  - 추론: 위 두 가지를 바탕으로 한 판단 (근거 문헌 없음)
 * 확률·명당 순위·고정 수심·거리는 넣지 않는다. 낚싯대 길이·바늘·봉돌 규격도 정하지 않는다.
 * 조사일: 2026-10-04. 이 환경에서 원문 페이지 열람이 막혀 검색 결과 요약으로 확인한 것은 note에 "원문 미열람"으로 적었다.
 */

export type EvidenceKind = "생태" | "현장" | "추론" | "규정";

export interface Source {
  id: string;
  title: string;
  url: string;
  kind: EvidenceKind;
  /** 작성일·조행일·주의 */
  note: string;
}

export const SOURCES: Record<string, Source> = {
  greenling: {
    id: "greenling",
    title: "쥐노래미 생태 (위키백과·서울대 해양저서생태학연구실)",
    url: "https://benthos.snu.ac.kr/our-data/our-benthos?md=v&bbsidx=10628",
    kind: "생태",
    note: "암초·해조가 많은 바닥에 세력권을 갖고 정착, 배를 바위에 대고 생활. 잡식(갑각류·갯지렁이·해조·작은 물고기), 치어는 낮에만 먹음.",
  },
  rockfishNibr: {
    id: "rockfishNibr",
    title: "조피볼락 (국립생물자원관 생물다양성 정보)",
    url: "https://species.nibr.go.kr/home/mainHome.do?cont_link=002&subMenu=002003&contCd=002003006001&pageMode=view&seq_no=34124",
    kind: "생태",
    note: "전 연안 바닥층 암초 주변, 작은 물고기·갑각류를 먹음. 원문 미열람(검색 요약).",
  },
  rockfishMyth: {
    id: "rockfishMyth",
    title: "국민생선 조피볼락의 오해와 진실 (어업in수산)",
    url: "https://www.suhyupnews.co.kr/news/articleView.html?idxno=30674",
    kind: "생태",
    note: "돌틈에 숨어 있다가 먹이를 보면 잠깐 나와 물고 들어감. '야간엔 움직이지 않고 물 흐름이 바뀌는 때 먹이활동'이라고 씀 — 밤낚시에 잘 낚인다는 현장 통념과 다름(상충). 원문 미열람.",
  },
  bolak: {
    id: "bolak",
    title: "볼락 생태 (위키백과 · 영남일보 김동욱의 낚시시대 2015-01-30)",
    url: "https://www.yeongnam.com/web/view.php?key=20150130.010390832100001",
    kind: "생태",
    note: "성어는 밤에 활동(새끼는 낮). 큰 볼락이 아래, 작은 볼락이 위로 층을 이룸. 암초·방파제 테트라포드 틈·선착장·교각에 삶.",
  },
  tetrapodStudy: {
    id: "tetrapodStudy",
    title: "테트라포드·자연초 어류 어획 비교 (한국해양환경·에너지학회지)",
    url: "https://www.jkosmee.or.kr/xml/14119/14119.pdf",
    kind: "생태",
    note: "우점종 노래미·볼락, 테트라포드와 자연초에서 어획 개체수가 많았음. 조사 해역은 동해 북부가 아님 — 원리 참고용.",
  },
  sillago: {
    id: "sillago",
    title: "보리멸 (현대해양)",
    url: "https://www.hdhy.co.kr/news/articleView.html?idxno=535",
    kind: "생태",
    note: "내만 모래 바닥에서 작은 갑각류·갯지렁이를 먹음. 난류성이라 겨울엔 깊은 곳에서 월동, 봄~가을 연안 모래바닥.",
  },
  flathead: {
    id: "flathead",
    title: "양태·성대 생태 (글로벌 세계 대백과사전, 위키문헌)",
    url: "https://ko.wikisource.org/wiki/%EA%B8%80%EB%A1%9C%EB%B2%8C_%EC%84%B8%EA%B3%84_%EB%8C%80%EB%B0%B1%EA%B3%BC%EC%82%AC%EC%A0%84/%EC%83%9D%EB%AC%BCI%C2%B7%EB%8F%99%EB%AC%BC%C2%B7%EC%9D%B8%EC%B2%B4/%EB%8F%99%EB%AC%BC%EC%9D%98_%EB%B6%84%EB%A5%98/%EC%B2%99_%EC%B6%94_%EB%8F%99_%EB%AC%BC/%EC%96%B4%EB%A5%98_%EA%B2%BD%EA%B3%A8%EC%96%B4%EB%A5%98",
    kind: "생태",
    note: "모래·펄 바닥, 산란기(5~7월)에 얕은 연안. 양태는 낮에 모래에 몸을 묻고 눈만 내놓고 매복, 성대는 가슴지느러미 아래 손가락 같은 줄기로 바닥을 걸으며 먹이를 찾음.",
  },
  starryFlounder: {
    id: "starryFlounder",
    title: "강도다리 (강원특별자치도 방류 보도, 헤럴드경제)",
    url: "https://biz.heraldcorp.com/article/10828614",
    kind: "생태",
    note: "주로 동해 북부, 모래·펄·자갈 바닥, 기수역에도 출현. 원문 미열람(검색 요약).",
  },
  north10: {
    id: "north10",
    title: "강원 북부 감성돔 포인트 10 — 속초 동명항~양양 기사문항 (낚시춘추, 김진현 기자)",
    url: "http://fishingseasons.co.kr/contents_view_detail.asp?b_no=15185",
    kind: "현장",
    note: "게재 연월·조행일 미확인. 감성돔(겨울 중심) 포인트 기사라 10월 내항 조과로 읽으면 안 됨. 설악·물치·낙산 지형 설명에 사용. 원문 미열람.",
  },
  surfcast10: {
    id: "surfcast10",
    title: "원투낚시 명소 10 (낚시춘추)",
    url: "https://fishingseasons.co.kr/contents_view_detail.asp?b_no=8675",
    kind: "현장",
    note: "물치항 큰 방파제 내항 얕은 모래 — 강도다리·황어, 작은 방파제 강도다리·쥐노래미·황어 내용이 검색 요약에 나왔으나 이 기사인지 원문으로 확인 못 함. 게재일 미확인.",
  },
  eging20: {
    id: "eging20",
    title: "강원도 무늬오징어 시대 <2> 동해북부 에깅 포인트 20 (낚시춘추)",
    url: "http://fishingseasons.co.kr/contents_view_detail.asp?b_no=4021",
    kind: "현장",
    note: "물치항 수심 4m권·바닥 몽돌, 외항 테트라포드는 수면과 높이 차가 커 위험. 게재 연도 미확인(오래된 기사로 추정).",
  },
  eging1: {
    id: "eging1",
    title: "강원도 무늬오징어 시대 <1> (낚시춘추)",
    url: "https://fishingseasons.co.kr/contents_view_detail.asp?b_no=4020",
    kind: "현장",
    note: "동해 북부 무늬오징어 시즌 6월 중순~11월 초, 해초가 잘 형성되고 조류 소통 좋은 곳(양양 수산항 등). 게재 연도 미확인.",
  },
  naksanDb: {
    id: "naksanDb",
    title: "낙산방파제 갯바위 포인트 (바다타임 포인트 DB)",
    url: "https://www.badatime.com/p-529.html",
    kind: "현장",
    note: "가을 대상어 고등어·학공치·돌돔으로 표기. 조행 기록이 아닌 포인트 DB이며 내항·외항 구분 없음. 원문 미열람.",
  },
  autumnGw: {
    id: "autumnGw",
    title: "특집 가을 방파제 손맛 대잔치 — 강원도 (낚시춘추)",
    url: "https://m.fishingseasons.co.kr/news_Detail.asp?b_no=2337",
    kind: "현장",
    note: "동해 학공치는 고성 공현진 일대에 먼저 나타나고 10월 하순이면 남쪽으로 이동. 게재 연도 미확인(오래된 기사로 추정) — 해마다 다름.",
  },
  flounderNorth: {
    id: "flounderNorth",
    title: "[입문자 교실] 가자미낚시 (낚시춘추)",
    url: "https://m.fishingseasons.co.kr/news_Detail.asp?b_no=18335",
    kind: "현장",
    note: "동해 북부 연안 가자미는 주로 참가자미·용가자미, 모래바닥에서 먹이를 찾음. 원문 미열람.",
  },
  harborLaw: {
    id: "harborLaw",
    title: "항만법과 방파제낚시 (낚시춘추) — 2020.7.30 항만법 개정으로 테트라포드 등 위험구역 출입 통제 가능",
    url: "https://fishingseasons.co.kr/contents_view_detail.asp?b_no=15207",
    kind: "규정",
    note: "구체적인 통제 구역은 항만·지자체 공고와 현장 표지판으로 확인해야 함.",
  },
  sokchoOctopus: {
    id: "sokchoOctopus",
    title: "속초시 낚시행위 관리 조례 — 시 수역 문어(대문어·참문어·돌문어) 낚시 금지 (노컷뉴스 2024-06)",
    url: "https://www.nocutnews.co.kr/news/6168233",
    kind: "규정",
    note: "2024-06-25 시의회 원안가결, 위반 시 300만원 이하 과태료. 이후 보도에서 '시행 중'으로 언급. 최신 상태는 속초시에 확인 필요.",
  },
  yangyangOctopus: {
    id: "yangyangOctopus",
    title: "속초·고성 이어 양양도 문어낚시 조례 제정 (MBC 강원영동)",
    url: "https://www.mbceg.co.kr/post/122129",
    kind: "규정",
    note: "양양군 조례는 지역 낚시어선이 정해진 구역에서 2~10월에만 문어 낚시 가능하도록 한 내용으로 보도됨. 방파제 낚시인 적용 여부는 미확인.",
  },
  gwNonFisher: {
    id: "gwNonFisher",
    title: "강원특별자치도 비어업인 수산자원 포획·채취 기준 조례 (노컷뉴스)",
    url: "https://www.nocutnews.co.kr/news/6184466",
    kind: "규정",
    note: "마을어장·합동양식장 안에서 비어업인의 전복·해삼·성게·홍합·문어 포획 금지.",
  },
  octopusWeight: {
    id: "octopusWeight",
    title: "금어기·금지체장 조정 — 대문어 금지체중 600g (한국농어민신문)",
    url: "https://www.agrinet.co.kr/news/articleView.html?idxno=177019",
    kind: "규정",
    note: "비어업인도 위반 시 과태료.",
  },
  squidLaw: {
    id: "squidLaw",
    title: "살오징어 금어기 4~5월, 외투장 15cm 이하 연중 포획 금지 (식품저널)",
    url: "https://www.foodnews.co.kr/news/articleView.html?idxno=101740",
    kind: "규정",
    note: "낚시인 위반 시 과태료.",
  },
};

export type StructureId =
  | "tetrapod"
  | "seawall"
  | "vertical"
  | "shade"
  | "sand"
  | "reef"
  | "inout"
  | "tip"
  | "light"
  | "edge";

export interface Structure {
  id: StructureId;
  name: string;
  icon: string;
  /** 대표 어종 (서비스 어종 id가 있으면 연결) */
  fish: { name: string; id?: string }[];
  residency: string;
  why: string;
  layer: string;
  dayNight: string;
  pole: { fit: "적합" | "조건부" | "부적합"; how: string };
  cast: { fit: "적합" | "조건부" | "부적합"; how: string };
  bait: string;
  caution: string;
  evidence: { kind: EvidenceKind; text: string }[];
  sources: string[];
}

export const STRUCTURES: Structure[] = [
  {
    id: "tetrapod",
    name: "테트라포드의 수중 부분과 가장자리",
    icon: "🧱",
    fish: [{ name: "쥐노래미", id: "greenling" }, { name: "볼락", id: "bolak" }, { name: "우럭(조피볼락)", id: "rockfish" }],
    residency: "상주(정착성)",
    why: "블록 사이 틈이 숨을 곳이 되고, 블록 표면에 붙은 해조·작은 갑각류가 먹이가 돼요. 파도도 틈 안쪽에서 약해져요.",
    layer: "바닥~중층의 틈 속. 볼락은 밤에 틈 위 중층으로 떠오르기도 해요.",
    dayNight: "쥐노래미는 낮 활동형(치어는 낮에만 먹음). 볼락 성어는 밤 활동형. 우럭은 자료가 엇갈려요(야간 비활동·물돌이 때 섭식 vs 밤낚시 조과 통념).",
    pole: { fit: "조건부", how: "올라가지 말고, 평평한 발판에서 닿는 테트라포드 가장자리 바로 앞에 수직으로 내려 바닥을 찍은 뒤 살짝 들어요." },
    cast: { fit: "부적합", how: "끌어오는 동안 블록 틈에 걸려요. 원투는 다른 방향(모래)으로." },
    bait: "갯지렁이(쥐노래미·볼락), 오징어 살(우럭 — 질겨서 잔챙이에 덜 뜯김)",
    caution: "밑걸림이 가장 심한 곳. 2020년 항만법 개정 뒤 테트라포드 등 위험구역은 출입 통제 대상 — 위로 올라가지 마세요. 빠지면 스스로 나오기 어려워요.",
    evidence: [
      { kind: "생태", text: "쥐노래미는 암초·해조 바닥에 정착, 볼락은 테트라포드 틈·선착장·교각에도 삶. 테트라포드·자연초에서 노래미·볼락 어획이 많았던 연구(다른 해역)." },
      { kind: "추론", text: "속초·양양 내항 테트라포드 가장자리에도 같은 원리가 적용될 것 — 이 항구들의 테트라포드 조과 기록은 확인 못 함." },
    ],
    sources: ["greenling", "bolak", "tetrapodStudy", "rockfishMyth", "harborLaw"],
  },
  {
    id: "seawall",
    name: "내항 석축과 돌 틈",
    icon: "🪨",
    fish: [{ name: "쥐노래미", id: "greenling" }, { name: "우럭", id: "rockfish" }, { name: "볼락", id: "bolak" }, { name: "감성돔(석축 주변 기록)", id: "blackporgy" }],
    residency: "상주(정착성) + 감성돔은 계절 회유",
    why: "돌 사이 틈이 작은 은신처를 만들고, 돌에 붙은 해조·따개비·작은 게가 먹이가 돼요. 석축이 끝나는 곳(바닥과 만나는 선)에 먹이가 쌓여요.",
    layer: "바닥, 특히 석축 경사가 바닥과 만나는 선.",
    dayNight: "쥐노래미는 해 있을 때, 볼락은 어두워진 뒤. 해질녘은 둘이 겹치는 시간.",
    pole: { fit: "적합", how: "발밑 석축을 따라 바닥까지 내리고, 석축 끝선을 옆으로 조금씩 옮기며 찔러 봐요. 한자리에서 반응 없으면 몇 걸음 이동." },
    cast: { fit: "조건부", how: "석축 기슭 너머가 모래로 이어지면 그 모래 쪽으로. 석축 위로 끌어올리면 걸려요." },
    bait: "갯지렁이(쥐노래미), 오징어 살(우럭)",
    caution: "석축 경사면은 젖으면 미끄러워요. 평평한 상판 위에서만 서세요. 물치항 석축 주변은 감성돔 포인트로 소개됐지만 겨울 중심 기사예요.",
    evidence: [
      { kind: "생태", text: "쥐노래미: 바위·돌에 배를 대고 생활, 세력권. 볼락: 암초·인공 구조물 틈." },
      { kind: "현장", text: "물치방파제: 감성돔은 큰·작은 방파제 콧부리와 석축 주변(감성돔 포인트 기사, 게재일 미확인)." },
    ],
    sources: ["greenling", "bolak", "north10"],
  },
  {
    id: "vertical",
    name: "수직 콘크리트 벽과 부두 기초",
    icon: "🏗",
    fish: [{ name: "볼락", id: "bolak" }, { name: "쥐노래미(벽 기초 바닥)", id: "greenling" }, { name: "학공치·전갱이(회유 때 벽 따라)", id: "halfbeak" }],
    residency: "볼락·쥐노래미 상주, 학공치·전갱이 회유",
    why: "벽면 자체는 숨을 곳이 적지만, 벽에 붙은 홍합·해조와 벽 밑 기초석(사석)이 은신처·먹이터가 돼요. 발밑이 바로 깊어져요.",
    layer: "벽 기초가 있는 바닥, 밤에는 벽을 따라 중층·표층(볼락).",
    dayNight: "낮엔 기초 바닥 위주, 밤엔 볼락이 벽면을 따라 떠올라요.",
    pole: { fit: "적합", how: "벽에 붙여 바닥까지 내린 뒤, 반응이 없으면 한 뼘씩 올리며 층을 찾아요. 민장대가 가장 잘 맞는 곳." },
    cast: { fit: "부적합", how: "벽 앞은 발밑이 포인트라 멀리 던질 이유가 적어요." },
    bait: "갯지렁이를 작게(볼락), 오징어 살 가늘게",
    caution: "어선이 대는 벽·계류줄 주변은 피하고 줄을 넘기지 마세요. 항만 안 어선·여객선 정박지는 항만법상 출입 제한일 수 있어요(현장 표지판 확인).",
    evidence: [
      { kind: "생태", text: "볼락은 선착장·교각 같은 인공물에도 삶, 큰 개체가 아래·작은 개체가 위로 층." },
      { kind: "추론", text: "벽 기초 사석은 석축과 같은 은신 효과 — 세 항구의 벽 구조·기초 형태는 확인 못 함." },
    ],
    sources: ["bolak", "harborLaw"],
  },
  {
    id: "shade",
    name: "선착장·상판 아래 그늘",
    icon: "⛱",
    fish: [{ name: "볼락", id: "bolak" }, { name: "우럭", id: "rockfish" }, { name: "작은 물고기 떼(치어)" }],
    residency: "상주",
    why: "그늘은 작은 물고기가 숨는 곳이고, 그 가장자리(빛과 그늘의 경계)에서 포식자가 기다려요. 낮에 효과가 커요.",
    layer: "그늘 경계의 중층~바닥.",
    dayNight: "낮엔 그늘 속·경계, 밤엔 그늘보다 불빛 경계(아래 '가로등' 항목)가 중요해져요.",
    pole: { fit: "적합", how: "상판 가장자리 그늘선 바로 바깥에 내리고 그늘 쪽으로 살짝 밀어 넣어요." },
    cast: { fit: "부적합", how: "기둥·로프에 감겨요." },
    bait: "갯지렁이, 오징어 살",
    caution: "기둥·폐로프 밑걸림. 배가 오르내리는 경사로(슬로프)와 계류줄은 막지 마세요.",
    evidence: [{ kind: "추론", text: "빛-그늘 경계에서 포식자가 매복한다는 일반 원리. 이 지역 선착장 그늘 조과 기록은 확인 못 함." }],
    sources: [],
  },
  {
    id: "sand",
    name: "항구 안쪽 모래·펄 바닥",
    icon: "🏖",
    fish: [
      { name: "가자미류(참가자미 등)", id: "righteye" },
      { name: "강도다리(물치 내항 기록)" },
      { name: "보리멸(10월엔 끝물일 수 있음)" },
      { name: "양태·성대(10월 연안 출현 근거 부족)" },
    ],
    residency: "계절에 따라 깊은 곳↔연안을 오가요(완전 상주 아님)",
    why: "모래 속 갯지렁이·작은 갑각류를 먹는 물고기가 와요. 가자미·보리멸은 바닥을 뒤지고, 양태는 모래에 몸을 묻고 매복, 성대는 가슴지느러미 줄기로 바닥을 걸으며 먹이를 찾아요.",
    layer: "바닥에 붙어 있어요. 미끼가 바닥에 닿아야 해요.",
    dayNight: "가자미류는 해 있을 때 입질이 많다고 알려져 있지만 밤에도 원투로 노려요. 양태는 낮에 모래 속 매복.",
    pole: { fit: "조건부", how: "발밑이 바로 모래면 가능하지만 닿는 범위가 좁아요." },
    cast: { fit: "적합", how: "내항 모래 쪽으로 던져 바닥에 두고, 가끔 조금씩 끌어 위치를 바꿔요. 원투가 가장 잘 맞는 곳." },
    bait: "갯지렁이(가장 잘 맞음). 오징어 살은 보조",
    caution: "밑걸림은 적지만 폐어구·해초가 있을 수 있어요. 던지기 전 뒤·옆 사람과 배 다니는 길을 확인하세요.",
    evidence: [
      { kind: "생태", text: "보리멸: 내만 모래, 겨울엔 깊은 곳·봄~가을 연안. 양태·성대: 모래·펄, 산란기 5~7월에 얕은 연안. 강도다리: 주로 동해 북부 모래·펄·자갈." },
      { kind: "현장", text: "물치방파제 내항 바닥은 대부분 모래라 원투에 적합(게재일 미확인). 물치 큰 방파제 내항 얕은 모래에서 강도다리·황어(출처 원문 미확인)." },
      { kind: "추론", text: "보리멸·양태·성대의 10월 속초·양양 내항 조과 기록은 찾지 못했어요 — 대상어로 기대하지 마세요." },
    ],
    sources: ["sillago", "flathead", "starryFlounder", "north10", "surfcast10", "flounderNorth"],
  },
  {
    id: "reef",
    name: "갯바위·수중 암초·해초 지대",
    icon: "🌿",
    fish: [{ name: "쥐노래미", id: "greenling" }, { name: "우럭", id: "rockfish" }, { name: "볼락", id: "bolak" }, { name: "감성돔", id: "blackporgy" }],
    residency: "상주 + 감성돔 계절 회유",
    why: "바위틈은 은신처, 해초는 작은 생물의 집이라 먹이가 많아요.",
    layer: "바닥~중층.",
    dayNight: "어종마다 달라요(위 항목 참고).",
    pole: { fit: "조건부", how: "내항에서 닿는 거리에 암반이 이어진 경계만. 갯바위로 들어가지 마세요." },
    cast: { fit: "부적합", how: "끌어오면 거의 걸려요." },
    bait: "갯지렁이, 오징어 살",
    caution: "이 환경은 대부분 외항·갯바위 쪽이라 초보 내항 조건 밖이에요. 낙산 외항은 수중여가 많고 수심이 얕다고 소개됐어요(겨울 감성돔 기사).",
    evidence: [
      { kind: "생태", text: "쥐노래미·볼락·우럭의 암초 서식." },
      { kind: "현장", text: "낙산방파제: 갯바위와 방파제 연결 구간, 외항 수중여 많고 수심 4m 내외라 밑채비를 짧게(감성돔 기사, 게재일 미확인)." },
    ],
    sources: ["greenling", "rockfishNibr", "north10"],
  },
  {
    id: "inout",
    name: "방파제 안쪽과 바깥쪽",
    icon: "🌊",
    fish: [{ name: "안쪽: 쥐노래미·볼락·가자미류" }, { name: "바깥쪽: 감성돔·회유어", id: "blackporgy" }],
    residency: "안쪽 상주어 중심, 바깥쪽 회유어 섞임",
    why: "바깥쪽은 파도·조류가 직접 닿아 물이 잘 바뀌고 수심이 있어요. 안쪽은 잔잔하고 바닥이 모래·석축인 경우가 많아요.",
    layer: "안쪽 바닥 위주, 바깥쪽은 층이 다양해요.",
    dayNight: "북동풍·너울이 있는 날은 바깥쪽이 위험해지고, 안쪽이 대안이 돼요.",
    pole: { fit: "적합", how: "초보는 안쪽 평평한 발판에서." },
    cast: { fit: "적합", how: "안쪽 모래 바닥 방향으로." },
    bait: "갯지렁이, 오징어 살",
    caution: "바깥쪽은 테트라포드·너울 위험. 물치 외항 테트라포드는 수면과 높이 차가 크다고 소개됐어요.",
    evidence: [
      { kind: "현장", text: "물치항: 큰·작은 방파제 외항에서 감성돔, 파도가 적당히 있는 날 조과(겨울 감성돔 기사). 외항 테트라포드 높이 주의(에깅 기사)." },
    ],
    sources: ["north10", "eging20"],
  },
  {
    id: "tip",
    name: "방파제 끝·항구 입구·등대 주변",
    icon: "🗼",
    fish: [{ name: "고등어·전갱이", id: "mackerel" }, { name: "학공치", id: "halfbeak" }, { name: "감성돔(콧부리 기록)", id: "blackporgy" }],
    residency: "회유어가 지나가는 길목",
    why: "방파제 끝은 물이 꺾이며 흐르고 수심이 깊어 회유어가 지나가요. 등대 자체(불빛)가 고기를 모은다는 근거는 찾지 못했어요 — 효과는 등대가 서 있는 '끝'의 수심·조류·지형이 만드는 거예요.",
    layer: "회유어는 표층~중층, 감성돔은 바닥.",
    dayNight: "회유어는 해질녘에 활발한 경우가 많아요. 밤엔 불빛 있는 곳으로.",
    pole: { fit: "조건부", how: "회유어가 들어왔을 때만 표층~중층을 노려요. 들어오지 않으면 끝에서 기다리기보다 내항으로." },
    cast: { fit: "조건부", how: "항로 쪽으로 던지지 말고, 끝에서 내항 안쪽 모래 방향만." },
    bait: "갯지렁이·오징어 살을 작게(회유어는 원래 크릴·작은 미끼를 많이 씀 — 현재 미끼로는 불리)",
    caution: "끝은 바람·너울에 가장 노출돼요. 배가 드나드는 항구 입구 쪽으로 던지거나 줄을 늘어뜨리지 마세요.",
    evidence: [
      { kind: "현장", text: "물치 큰 방파제는 빨간 등대 끝 쪽과 중간 꺾이는 구간 초입 조과가 좋다고 소개(감성돔 대상, 출처 원문 미확인)." },
      { kind: "추론", text: "등대 불빛은 멀리 신호를 보내려는 것이라 수면을 비추는 가로등과 달라요. 등대 효과는 위치(끝)의 효과로 봐야 해요." },
    ],
    sources: ["north10", "surfcast10"],
  },
  {
    id: "light",
    name: "가로등 불빛과 어둠의 경계",
    icon: "💡",
    fish: [{ name: "볼락", id: "bolak" }, { name: "학공치", id: "halfbeak" }, { name: "전갱이", id: "mackerel" }],
    residency: "밤에 모였다 흩어져요",
    why: "불빛 아래로 작은 생물·치어가 모이고, 그것을 먹으려는 물고기가 밝은 곳과 어두운 곳의 경계(어두운 쪽)에서 기다린다는 것이 낚시 현장의 일반적인 설명이에요.",
    layer: "표층~중층(볼락은 중층, 학공치는 표층).",
    dayNight: "밤에만 의미가 있어요.",
    pole: { fit: "적합", how: "불빛이 수면에 닿는 경계선 바로 어두운 쪽에 내리고, 얕은 층부터 조금씩 내려가며 찾아요." },
    cast: { fit: "부적합", how: "멀리 던질 이유가 없어요." },
    bait: "갯지렁이를 짧게 끊어서, 오징어 살은 가늘게",
    caution: "불빛 아래는 사람이 몰려요. 줄 엉킴과 뒤쪽 통행에 주의.",
    evidence: [{ kind: "추론", text: "가로등이 이 지역 어류 분포에 미치는 영향을 다룬 공공·학술 자료는 찾지 못했어요. 집어등 원리와 현장 통념에 기댄 설명이에요." }],
    sources: [],
  },
  {
    id: "edge",
    name: "모래와 암초가 만나는 경계",
    icon: "↔",
    fish: [{ name: "쥐노래미·우럭(돌 쪽)", id: "greenling" }, { name: "가자미류(모래 쪽)", id: "righteye" }],
    residency: "양쪽 어종이 함께",
    why: "돌 쪽 물고기는 은신처 가까이에서 사냥하고, 모래 쪽 물고기는 돌 주변에 모이는 먹이를 노려요. 두 환경의 먹이가 겹치는 곳이에요.",
    layer: "바닥.",
    dayNight: "낮·밤 모두. 해질녘이 겹치는 시간.",
    pole: { fit: "조건부", how: "발밑에서 석축이 끝나고 모래가 시작되는 선에 닿으면 좋아요." },
    cast: { fit: "적합", how: "던진 뒤 천천히 끌다 무게감이 '사각사각(모래)→툭툭(돌)'으로 바뀌는 곳을 찾고, 그 바로 모래 쪽에 둬요." },
    bait: "갯지렁이, 오징어 살",
    caution: "돌 쪽으로 계속 끌면 걸려요. 경계를 찾으면 더 끌지 마세요.",
    evidence: [
      { kind: "생태", text: "쥐노래미는 모래·펄이 섞인 암초 지대에도 삶. 가자미는 모래바닥에서 먹이를 찾음." },
      { kind: "추론", text: "경계 효과는 일반 원리. 세 항구 내항의 정확한 경계 위치는 확인 못 함 — 현장에서 끌어 보며 찾아야 해요." },
    ],
    sources: ["greenling", "flounderNorth"],
  },
];

/** 두족류: 물고기와 따로 — 지금 장비·미끼로 노리기 적합한지 */
export const CEPHALOPODS = [
  {
    name: "문어(대문어·참문어)",
    fit: "노리지 마세요",
    why: "바위틈 굴에 숨어 게·조개를 먹어요. 문어 전용 에기·테야 채비가 필요해 민장대·원투 + 갯지렁이·오징어 살로는 대상이 아니에요.",
    rule: "속초시는 조례로 시 수역 문어 낚시 금지(2024-06 통과, 시행 중 보도) → 설악항(속초)은 금지. 양양군 조례는 낚시어선 대상으로 보도 — 방파제 낚시 적용 여부 미확인. 강원 조례로 마을어장 안 비어업인 문어 포획 금지. 대문어 600g 이하 포획 금지.",
    sources: ["sokchoOctopus", "yangyangOctopus", "gwNonFisher", "octopusWeight"],
  },
  {
    name: "무늬오징어",
    fit: "현재 장비로는 부적합",
    why: "해초가 있고 물이 잘 통하는 곳에서 작은 물고기를 쫓아요. 동해 북부 시즌은 6월 중순~11월 초로 소개됐지만 에기(루어)와 전용 낚싯대가 필요해요.",
    rule: "별도 금어기 확인 필요(서비스 어종 정보 참고).",
    sources: ["eging1", "eging20"],
  },
  {
    name: "살오징어",
    fit: "현재 장비로는 부적합",
    why: "밤에 불빛 주변으로 떠올라요. 오징어 뿔 등 전용 채비가 필요해요.",
    rule: "4~5월 금어기, 외투장 15cm 이하 연중 포획 금지.",
    sources: ["squidLaw"],
  },
];

/** 세 항구에서 확인된 정보 (현장·규정 근거만, 우열 없음) */
export const HARBOR_NOTES: Record<string, { name: string; confirmed: { text: string; source: string }[]; unknown: string[] }> = {
  "seorak-inner": {
    name: "설악항 (속초 대포동)",
    confirmed: [
      { text: "큰 방파제 내항과 작은 방파제 전역에서 낚시, 큰 방파제 외항은 테트라포드 구간으로 소개(감성돔 기사).", source: "north10" },
      { text: "큰 방파제 주변에서 감성돔·도다리·쥐노래미가 낚인다고 소개(계절은 감성돔 시즌 중심).", source: "north10" },
      { text: "속초시 수역이라 문어 낚시 금지 조례 적용.", source: "sokchoOctopus" },
    ],
    unknown: ["10월 내항 최근 조행 기록", "현재 출입·낚시 통제 구역(항만 공고·현장 표지판 확인)", "내항 바닥 재질"],
  },
  "mulchi-inner": {
    name: "물치항 (양양 강현면)",
    confirmed: [
      { text: "내항 바닥은 대부분 모래라 원투에 적합(감성돔 기사).", source: "north10" },
      { text: "큰 방파제 내항은 얕은 모래 — 강도다리·황어, 작은 방파제는 강도다리·쥐노래미·황어, 해변을 끼고 있음(출처 원문 미확인).", source: "surfcast10" },
      { text: "외항 테트라포드는 수면과 높이 차가 커 위험(에깅 기사).", source: "eging20" },
    ],
    unknown: ["10월 내항 최근 조행 기록", "현재 출입 통제 구역", "양양군 문어 조례의 방파제 낚시 적용 여부"],
  },
  "naksan-inner": {
    name: "낙산항 (양양 강현면)",
    confirmed: [
      { text: "갯바위와 방파제가 연결된 구간, 외항에 수중여가 많고 수심이 얕다고 소개(감성돔 기사 — 외항 정보).", source: "north10" },
      { text: "포인트 DB에 가을 대상어 고등어·학공치·돌돔(내항·외항 구분 없음, 조행 기록 아님).", source: "naksanDb" },
    ],
    unknown: ["내항 바닥 재질·구조물", "10월 내항 최근 조행 기록", "현재 출입 통제 구역"],
  },
};

/** 포인트 종류별로 흔히 보이는 구조물 (항구별 확인 정보가 없을 때의 기본값 — 현장 확인 필요) */
export const TYPE_STRUCTURES: Record<string, StructureId[]> = {
  INNER_HARBOR: ["seawall", "vertical", "shade", "sand", "light", "edge"],
  OUTER_HARBOR: ["inout", "tetrapod", "seawall", "tip", "light"],
  BREAKWATER_TIP: ["tip", "tetrapod", "inout", "light"],
  ROCK: ["reef", "edge"],
  SURF: ["sand", "edge"],
  TIDAL_FLAT: ["sand"],
  BOAT: [],
};

export const structureById = (id: StructureId) => STRUCTURES.find((s) => s.id === id)!;
