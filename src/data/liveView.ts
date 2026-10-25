/**
 * 실시간 바다 보기 (속초·양양·강릉 시범): 차 타고 돌아다니지 않고 회유어 가능성을 가늠하는 바로가기.
 *  - 주소는 2026-10 웹 검색으로 확인한 것(이 환경에서는 직접 접속 불가 → 원문 미확인). 외부 서비스라 바뀌거나 멈출 수 있다.
 *  - 유튜브 라이브는 영상 주소가 수시로 바뀌므로 '지금 방송 중'만 거르는 검색(라이브 필터)을 함께 둔다.
 *  - 조황은 최근 글만 거르는 검색으로 연결한다(특정 게시판은 확인하지 못함).
 */

export type LiveArea = "속초" | "양양" | "강릉";
export const LIVE_AREAS: LiveArea[] = ["속초", "양양", "강릉"];

export type LiveKind = "cam" | "youtube" | "temp" | "wave" | "report";

export const KIND_INFO: Record<LiveKind, { label: string; icon: string; what: string }> = {
  cam: { label: "바다 영상(CCTV·웨이브캠)", icon: "📹", what: "새떼가 한곳에서 도는지, 루어꾼이 한 해변에 몰렸는지, 파도·물색. 보일링은 화질상 거의 안 보여요." },
  youtube: { label: "유튜브 라이브", icon: "🔴", what: "24시간 방송 해변 캠과, 지금 방송 중인 영상만 거른 검색. 해변·방파제 낚시 생방송이 있으면 조황을 바로 볼 수 있어요." },
  temp: { label: "수온·냉수대", icon: "🌡", what: "냉수대가 들어오면 회유어가 연안에서 빠지기 쉬워요. 삼치는 앱 기준 15~25℃." },
  wave: { label: "파도", icon: "🌊", what: "서프루어는 파도가 높으면 위험하고 루어 운용도 어려워요." },
  report: { label: "조황(최근 글)", icon: "🎣", what: "어제·오늘 삼치·방어 조황이 이어지면 떼가 머물고 있을 가능성이 커요. 가장 직접적인 신호예요." },
};

export interface LiveLink {
  kind: LiveKind;
  title: string;
  url: string;
  note?: string;
}

const YT_LIVE = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgJAAQ%253D%253D`;
const YT_TODAY = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIIAg%253D%253D`;
const NAVER_WEEK = (q: string) => `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(q)}&nso=so%3Add%2Cp%3A1w`;

/** 지역마다 */
const BY_AREA: Record<LiveArea, LiveLink[]> = {
  속초: [
    { kind: "cam", title: "바다타임 · 속초등대 실시간 바다영상", url: "https://www.badatime.com/cctv/113", note: "KBS 재난안전포털 영상" },
    { kind: "cam", title: "WSB FARM · 속초해변", url: "https://www.wsbfarm.com/wavecam/WeatherWarnView?beach=SCC1" },
    { kind: "cam", title: "CCTV월드 · 영랑 해수욕장 라이브캠", url: "https://www.cctv-world.kr/cctv/beach2/yeongrang" },
    { kind: "youtube", title: "유튜브 · 속초해수욕장 Live Cam", url: "https://www.youtube.com/watch?v=BVC5ckBcVx0", note: "방송이 끝났으면 아래 '지금 라이브' 검색으로" },
  ],
  양양: [
    { kind: "cam", title: "WSB FARM 웨이브캠 · 죽도·인구·기사문·하조대·낙산·물치·설악", url: "https://www.wsbfarm.com/wavecam/WaveCamList", note: "목록에서 해변 선택" },
    { kind: "wave", title: "WSB FARM 파도예보 · 낙산해변", url: "https://www.wsbfarm.com/wavecam/WaveChartView?beach=YNS1" },
    { kind: "wave", title: "WSB FARM 파도예보 · 기사문해변", url: "https://www.wsbfarm.com/wavecam/WaveChartView?beach=GSM1" },
    { kind: "wave", title: "WSB FARM 파도예보 · 물치해변", url: "https://www.wsbfarm.com/wavecam/WaveChartView?beach=MUL" },
  ],
  강릉: [
    { kind: "cam", title: "바다타임 · 주문진해변 실시간 바다영상", url: "https://www.badatime.com/cctv/112", note: "KBS 재난안전포털 영상" },
    { kind: "youtube", title: "유튜브 · 강문해변 Live Cam (24시간)", url: "https://www.youtube.com/watch?v=n8mJCRXGoXc", note: "기가아이즈 CCTV 송출" },
    { kind: "cam", title: "뷰맵라이브 · 경포 바다 24시간", url: "https://viewmaplive.com/gangneung-gyeongpo-beach-live-view-cctv/" },
    { kind: "cam", title: "WSB FARM 웨이브캠 · 금진 등", url: "https://www.wsbfarm.com/wavecam/WaveCamList", note: "목록에서 해변 선택" },
  ],
};

/** 지역 공통 */
const COMMON: LiveLink[] = [
  { kind: "cam", title: "해양수산부 연안포털 · 연안 CCTV", url: "https://coast.mof.go.kr/coastScene/coastMediaService.do", note: "곳에 따라 최근 사진으로 대체" },
  { kind: "cam", title: "CCTV월드 · 전국 해수욕장 실시간", url: "https://www.cctv-world.kr/theme/beach" },
  { kind: "temp", title: "국립수산과학원 · 동해연안 냉수대 예측·속보", url: "https://www.nifs.go.kr/kodc/rocps/index2.jsp" },
  { kind: "temp", title: "국립수산과학원 · 실시간 해양환경 어장정보(수온)", url: "https://www.nifs.go.kr/risa/" },
  { kind: "wave", title: "WSB FARM · 해변별 파도예보", url: "https://www.wsbfarm.com/wavecam/WaveChartList" },
];

/** 검색 바로가기 (지역 이름을 넣어 만든다) */
function searches(area: LiveArea): LiveLink[] {
  return [
    { kind: "youtube", title: `유튜브 · 지금 라이브 중 '${area} 바다'`, url: YT_LIVE(`${area} 바다 라이브`), note: "라이브 필터 — 지금 방송 중인 것만" },
    { kind: "youtube", title: `유튜브 · 지금 라이브 중 '${area} 낚시'`, url: YT_LIVE(`${area} 낚시`), note: "낚시 생방송이 있으면 조황 확인" },
    { kind: "report", title: `유튜브 · 오늘 올라온 '${area} 삼치'`, url: YT_TODAY(`${area} 삼치`) },
    { kind: "report", title: `네이버 블로그 · 최근 1주 '${area} 삼치 조황'`, url: NAVER_WEEK(`${area} 삼치 조황`) },
    { kind: "report", title: `네이버 블로그 · 최근 1주 '${area} 방어 부시리 조황'`, url: NAVER_WEEK(`${area} 부시리 방어 조황`) },
  ];
}

export const KIND_ORDER: LiveKind[] = ["report", "youtube", "cam", "temp", "wave"];

/** 지역 바로가기 전체 (종류 순서: 조황 → 유튜브 → 영상 → 수온 → 파도) */
export function liveLinks(area: LiveArea): LiveLink[] {
  const all = [...BY_AREA[area], ...searches(area), ...COMMON];
  return KIND_ORDER.flatMap((k) => all.filter((l) => l.kind === k));
}

export const isLiveArea = (a: string): a is LiveArea => (LIVE_AREAS as string[]).includes(a);

/**
 * 원격 확인 → 출발 판단 (판단 보조, 추론).
 * 조황이 가장 직접적인 신호, 냉수대·높은 파도는 출발을 막는 신호로 본다.
 */
export interface RemoteAnswer {
  report?: boolean; // 최근 1~2일 회유어 조황
  birds?: boolean; // 영상에서 새떼가 한곳에서 돎
  crowd?: boolean; // 영상에서 루어꾼이 한 해변에 몰림
  coldWater?: boolean; // 냉수대 속보·수온 급강하
  highWave?: boolean; // 파도 높음(서프루어 위험)
}

export function remoteVerdict(a: RemoteAnswer): { level: "go" | "maybe" | "hold"; text: string; why: string[] } {
  const why: string[] = [];
  if (a.highWave) return { level: "hold", text: "보류 — 파도가 높아 서프루어가 위험해요", why: ["파도 높음"] };
  if (a.coldWater) return { level: "hold", text: "보류 — 냉수대·수온 급강하로 회유어가 연안에서 빠졌을 가능성이 커요", why: ["냉수대"] };
  let s = 0;
  if (a.report) { s += 2; why.push("최근 조황 있음"); }
  if (a.birds) { s += 2; why.push("영상에 새떼"); }
  if (a.crowd) { s += 1; why.push("루어꾼 몰림"); }
  if (s >= 3) return { level: "go", text: "출발 추천 — 오전 피딩 시작 30분 전에 도착해요", why };
  if (s >= 1) return { level: "maybe", text: "조건부 — 가 볼 만해요. 도착해서 5~10분 신호부터 확인해요", why };
  return { level: "maybe", text: "정보 부족 — 조황·영상 신호가 없어요. 에이전트 1순위 시간에 가볍게 확인하거나 다른 날을 봐요", why };
}
