/**
 * 낚시 방법(장르) 6가지: 원투 · 루어 · 찌 · 선상 · 대낚시(민장대) · 훌치기.
 *  - 원리: 어떤 고기가 어디서 무엇을 먹기 때문에 이 방법이 통하는가 (채비 도감·습성 데이터와 같은 논리)
 *  - species는 이 앱의 어종 id, others는 앱에 없는 대상(민물 등)을 글로만
 *  - rigs는 채비 도감(src/data/rigs.ts) id, genre는 장비·용어(gearTerms GENRES) id
 *  - 훌치기는 '방법 안내'를 싣지 않고 원리·규정·위험만 사실대로 적는다
 */

export type MethodId = "surf" | "lure" | "float" | "boat" | "pole" | "snag";

export interface Method {
  id: MethodId;
  name: string;
  aka: string;
  icon: string;
  /** 한 줄 정의 */
  one: string;
  /** 왜 물리나 (원리) */
  principle: string;
  how: string[];
  /** 1 적음·쉬움 ~ 3 많음·어려움 */
  effort: 1 | 2 | 3;
  cost: 1 | 2 | 3;
  level: 1 | 2 | 3;
  bait: string;
  place: string;
  fits: string[];
  notFor: string;
  species: string[];
  /** 앱에 없는 대상 (글로만) */
  others?: string;
  /** 어종별 덧붙임 */
  notes?: Record<string, string>;
  rigs: string[];
  genre?: string;
  safety?: string;
  /** 범위·주의 표시 */
  badge?: { text: string; tone: "blue" | "orange" | "red" };
  /** 사실 확인이 필요한 내용과 출처 */
  facts?: { text: string; src: [string, string][] }[];
}

export const METHODS: Method[] = [
  {
    id: "surf",
    name: "원투 낚시",
    aka: "멀리 던져 바닥에 두기",
    icon: "🎯",
    one: "무거운 봉돌로 채비를 멀리 던져 바닥에 두고 기다리는 낚시예요.",
    principle: "가자미·도다리·붕장어·노래미처럼 바닥에 사는 고기는 바닥의 갯지렁이·작은 갑각류를 먹어요. 봉돌이 미끼를 바닥에 붙잡아 두고, 냄새를 따라온 고기가 물면 대 끝(초릿대)의 떨림이나 방울 소리로 알아요.",
    how: [
      "받침대를 세우고 바늘에 갯지렁이(또는 오징어살)를 꿰어요.",
      "뒤·옆 사람을 확인하고 봉돌 무게를 실어 멀리 던져요.",
      "줄을 살짝 감아 팽팽하게 한 뒤 대를 받침대에 세워요.",
      "초릿대가 까딱이거나 방울이 울리면 대를 들어 걸어요.",
      "10~20분 입질이 없으면 조금 끌어 자리를 옮기거나 다시 던져요.",
    ],
    effort: 1,
    cost: 2,
    level: 1,
    bait: "생미끼 (갯지렁이·오징어살·고등어살)",
    place: "모래·펄 바닥 해변, 방파제 바깥쪽",
    fits: ["앉아서 편하게 쉬면서 하고 싶은 분", "대를 여러 대 펴 두고 가족·친구와 기다리는 분", "여름 밤낚시(붕장어)를 해 보고 싶은 분"],
    notFor: "가만히 기다리는 게 지루한 분",
    species: ["dodari", "righteye", "conger", "goby", "greenling", "rockfish", "rockbream"],
    others: "강·하구에서는 메기·장어도 같은 방식으로 노려요(민물 — 이 앱 범위 밖).",
    notes: {
      rockfish: "우럭은 바위 근처에 살아 원투하면 밑걸림이 많아요. 석축·바위 가장자리 쪽으로 짧게 던져요.",
      rockbream: "돌돔 원투(처넣기)는 튼튼한 대와 성게·소라 미끼를 쓰는 갯바위 고급 낚시예요.",
    },
    rigs: ["surf-branch", "sliding-sinker"],
    genre: "surf",
    safety: "봉돌이 무거워 던질 때 사고가 나기 쉬워요. 뒤·옆을 꼭 확인해요.",
  },
  {
    id: "lure",
    name: "루어 낚시",
    aka: "가짜 미끼를 움직여 쫓아오게",
    icon: "🐟",
    one: "생미끼 대신 가짜 미끼(루어)를 움직여, 쫓아와 물게 하는 낚시예요.",
    principle: "작은 고기·새우·오징어를 쫓아 먹는 고기(농어·삼치·광어·오징어류)는 '도망가는 먹이'의 움직임과 반짝임에 반응해요. 웜·미노우·메탈지그·에기 같은 루어 종류와 감는 속도·리듬으로, 그 고기가 평소 먹는 먹이를 흉내 내요.",
    how: [
      "노리는 고기가 먹는 먹이와 깊이에 맞는 루어를 골라요.",
      "던진 뒤 숫자를 세며 원하는 깊이까지 가라앉혀요.",
      "어종별 리듬으로 감고 멈춰요(어종 화면 '릴 감기' 탭).",
      "툭·묵직함이 느껴지면 바로 대를 세워 걸어요.",
      "입질이 없으면 루어·속도·깊이를 바꾸고, 걸어서 자리를 옮겨요.",
    ],
    effort: 3,
    cost: 2,
    level: 2,
    bait: "루어(가짜 미끼) — 생미끼를 만지지 않아요",
    place: "방파제·갯바위·하구, 걸어 다니며",
    fits: ["미끼 만지기 싫은 분", "걸어 다니며 활동적으로 하고 싶은 분", "해 뜰·질 무렵 짧게 집중하고 싶은 분"],
    notFor: "한 자리에 앉아 쉬고 싶은 분",
    species: ["seabass", "flatfish", "squid-bigfin", "webfoot", "cuttlefish", "bolak", "spanishmackerel", "yellowtail"],
    others: "민물에서는 배스·쏘가리·꺽지를 루어로 노려요(이 앱 범위 밖).",
    notes: {
      "squid-bigfin": "오징어류를 에기(새우 모양 루어)로 노리는 걸 '에깅'이라고 해요.",
      webfoot: "주꾸미도 방파제에서 에기로 노릴 수 있어요(금어기 5/11~8/31 제외).",
      flatfish: "광어는 웜을 바닥 가까이 천천히 움직여요. 선상 다운샷도 같은 원리예요.",
    },
    rigs: ["jighead", "nosinker", "minnow", "metaljig", "eging"],
    genre: "lure",
    safety: "세발바늘이 옷·손에 걸리기 쉬워요. 던지기 전 주변을 보고, 바늘은 집게로 빼요.",
  },
  {
    id: "float",
    name: "찌낚시",
    aka: "찌로 깊이를 맞추고 입질을 눈으로",
    icon: "🎈",
    one: "찌로 미끼를 원하는 깊이에 띄워 두고, 찌가 잠기는 걸 보고 거는 낚시예요.",
    principle: "바닥과 수면 사이(중층)에서 먹는 고기(감성돔·벵에돔·학꽁치·고등어)는 그 깊이에 미끼가 있어야 물어요. 찌멈춤 매듭으로 찌밑 수심을 정하고, 밑밥으로 고기를 모아 미끼와 함께 흘리며, 찌의 움직임으로 입질을 눈으로 봐요.",
    how: [
      "밑밥을 먼저 뿌려 고기를 모아요.",
      "찌멈춤 매듭으로 찌밑 수심을 노리는 층에 맞춰요.",
      "밑밥 뿌린 자리와 미끼가 같이 흘러가게 던져요.",
      "찌가 쏙 잠기면 대를 세워 걸어요.",
      "입질이 없으면 찌밑 수심을 바꿔 가며 고기가 있는 층을 찾아요.",
    ],
    effort: 2,
    cost: 2,
    level: 2,
    bait: "크릴·새우 + 밑밥",
    place: "갯바위·방파제, 물이 적당히 흐르는 곳",
    fits: ["찌가 쏙 들어가는 '찌맛'을 보고 싶은 분", "손맛 좋은 고급 어종(감성돔·벵에돔)에 도전하고 싶은 분", "밑밥으로 고기를 모으는 전략을 즐기는 분"],
    notFor: "밑밥·찌 여러 개 챙기기가 번거로운 분",
    species: ["blackporgy", "opaleye", "redseabream", "mackerel", "halfbeak", "hairtail", "mullet", "gizzardshad"],
    notes: {
      redseabream: "참돔은 주로 선상에서 낚지만, 남해 먼 섬 갯바위에서는 찌낚시로도 노려요.",
      mackerel: "고등어·전어 같은 떼 고기는 카드채비(여러 바늘)를 찌 아래 달거나 그냥 내려 밑밥 구름 속에 둬요.",
      hairtail: "갈치는 밤에 케미(빛나는 막대)를 꽂은 찌로 노려요.",
    },
    rigs: ["half-float", "full-float", "stick-float", "sabiki"],
    genre: "float",
  },
  {
    id: "boat",
    name: "선상 낚시",
    aka: "배를 타고 고기 위에서",
    icon: "🚤",
    one: "배를 타고 고기 있는 곳 바로 위로 가서, 채비를 아래로 내렸다 올리는 낚시예요.",
    principle: "연안에서 닿지 않는 깊은 바닥·물살 센 곳(우럭·참돔·대구)이나 먼바다를 도는 떼(갈치·오징어)는 배가 데려가야 만날 수 있어요. 선장이 어군탐지기로 고기와 바닥을 찾고 신호를 주면, 바로 아래로 내려 노려요.",
    how: [
      "예약하고, 승선 명부를 쓰고, 구명조끼를 입어요.",
      "선장이 정해 준 봉돌 무게·채비를 써요(옆 사람과 줄이 덜 엉켜요).",
      "'내리세요' 신호에 바닥까지 내리고, 바닥에서 살짝 띄워요.",
      "어종에 맞게 들었다 놓기(고패질)·감기를 해요.",
      "'올리세요' 신호에 바로 감아 올려요.",
    ],
    effort: 2,
    cost: 3,
    level: 1,
    bait: "어종마다 — 생미끼·루어·에기 모두",
    place: "출항 항구 → 먼바다·섬 주변",
    fits: ["확실하게, 많이 잡고 싶은 분", "장비 없이 시작하고 싶은 분(배에서 대여)", "큰 고기·여러 어종을 만나고 싶은 분"],
    notFor: "뱃멀미가 심한 분(멀미약을 미리 챙겨요)",
    species: ["rockfish", "flatfish", "webfoot", "cuttlefish", "hairtail", "redseabream", "octopus", "squid", "spanishmackerel", "yellowtail"],
    others: "대구는 겨울 동해·남해 깊은 바다에서 선상으로 노려요(이 앱 어종 목록에는 없어요).",
    notes: {
      hairtail: "남해 갈치 선상은 밤에 집어등을 켜고 여러 바늘 채비로 노려요.",
      squid: "살오징어는 밤 집어등 아래에서 뿔채비를 오르내려요.",
    },
    rigs: ["boat-bottom", "downshot", "tairaba", "egi-sinker", "squid-jig", "metaljig"],
    genre: "boat",
    safety: "낚싯배에서는 구명조끼 착용이 의무예요. 날씨가 나쁘면 출항이 취소돼요.",
  },
  {
    id: "pole",
    name: "대낚시 · 민장대",
    aka: "릴 없이 긴 대로 발 앞을",
    icon: "🎋",
    one: "릴 없이 긴 대에 대 길이만큼 줄을 묶어, 발 앞을 찌나 맨 줄로 노리는 낚시예요.",
    principle: "릴이 없어 멀리 던지진 못하지만 가볍고 단순해서 입질이 손에 그대로 와요. 민물에서는 붕어·잉어·향어를 찌로 노리는 대표 방법(대낚시)이고, 바다에서는 '민장대'로 항구 안 석축·벽 바로 앞에 사는 고기를 노려요.",
    how: [
      "대 길이에 맞춰 원줄을 묶고 찌·봉돌·바늘을 달아요.",
      "찌밑 수심을 바닥 근처(또는 노리는 층)로 맞춰요.",
      "대를 앞으로 뻗어 발 앞·벽 옆에 채비를 내려요.",
      "찌가 잠기거나 줄이 당겨지면 손목으로 살짝 들어 걸어요.",
    ],
    effort: 1,
    cost: 1,
    level: 1,
    bait: "바다: 갯지렁이·크릴 / 민물: 떡밥·지렁이",
    place: "항구 안 석축·선착장 (민물: 저수지·수로)",
    fits: ["아이·가족과 첫 낚시", "가볍게 짧게 즐기고 싶은 분", "발밑 작은 고기의 손맛을 느끼고 싶은 분"],
    notFor: "멀리 있는 고기·큰 고기를 노리는 분",
    species: ["goby", "halfbeak", "bolak", "mullet"],
    others: "민물 대낚시의 대표 대상은 붕어·잉어·향어예요(이 앱 범위 밖).",
    rigs: ["stick-float"],
    badge: { text: "민물이 본고장 · 바다는 민장대로", tone: "blue" },
  },
  {
    id: "snag",
    name: "훌치기",
    aka: "물게 하지 않고 몸에 걸어 올리기",
    icon: "⚠️",
    one: "미끼 없이 큰 갈고리 바늘과 무거운 봉돌을 던져, 떼 속에서 세게 당겨 고기 몸에 걸어 올리는 방식이에요.",
    principle: "고기가 먹이로 알고 무는 게 아니라 몸 아무 데나 걸려요. 그래서 '먹이로 유혹해 입에 건다'는 다른 낚시의 원리와 달라요. 바다에서는 주로 숭어 떼 같은 떼고기를 대상으로 한다고 알려져 있어요.",
    how: [],
    effort: 3,
    cost: 1,
    level: 2,
    bait: "미끼 없음 (훌치기 바늘)",
    place: "—",
    fits: [],
    notFor: "피싱체크는 권하지 않아요. 채비·동작 안내도 싣지 않아요.",
    species: [],
    rigs: [],
    badge: { text: "권하지 않음 · 지역에 따라 제한", tone: "red" },
    facts: [
      {
        text: "민물(내수면): 서울 한강공원은 「내수면어업법」을 근거로, 낚시 금지구역이 아닌 곳에서도 훌치기 바늘 사용·훌치기 동작 낚시를 제한한다고 안내해요. 다른 하천도 시·군 공고로 낚시 방법을 제한할 수 있어요.",
        src: [["한강공원 · 한강낚시 안내", "https://hangang.seoul.go.kr/www/contents/761.do?mid=513"]],
      },
      {
        text: "바다: 「낚시 관리 및 육성법」은 낚시제한기준(제5조)을 어기고 잡는 것을 금지(제7조)하는 구조예요. 바다에서 훌치기를 전국 공통으로 금지하는 조문은 검색으로 확인하지 못했어요(미확인).",
        src: [["국가법령정보센터 · 낚시 관리 및 육성법", "https://law.go.kr/lsLawLinkInfo.do?lsJoLnkSeq=1000905060&chrClsCd="]],
      },
      {
        text: "그래도 낚시금지구역·지자체 조례·항만 관리 규정으로 막힌 곳이 있어요. 현장 표지판과 관할 시·군·해경 안내를 따르세요.",
        src: [["공공데이터포털 · 해양수산부 국립해양조사원 낚시금지구역", "https://www.data.go.kr/data/15130115/fileData.do"]],
      },
      {
        text: "무거운 봉돌과 큰 갈고리가 빠르게 날아와 주변 사람에게 위험하고, 걸리지 않은 고기도 상처를 입어요. 낚시인 사이에서도 비매너 행위로 보는 시선이 많아요.",
        src: [
          ["오마이뉴스 · '훌치기'는 낚시가 아닌 비매너행위", "https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0002505105"],
          ["나무위키 · 훌치기", "https://namu.wiki/w/%ED%9B%8C%EC%B9%98%EA%B8%B0"],
        ],
      },
    ],
  },
];

export const methodById = (id: string) => METHODS.find((m) => m.id === id);

/** 이 어종을 낚는 방법들 (훌치기 제외) */
export const methodsForSpecies = (sp: string) => METHODS.filter((m) => m.id !== "snag" && m.species.includes(sp));

/** 이런 분께 — 원하는 것 → 방법 */
export const CHOOSER: { want: string; id: MethodId; why: string }[] = [
  { want: "앉아서 편하게 쉬면서", id: "surf", why: "던져 두고 방울·초릿대로 입질을 기다려요." },
  { want: "미끼는 싫고, 걸으며 활동적으로", id: "lure", why: "가짜 미끼를 움직이며 포인트를 옮겨 다녀요." },
  { want: "찌 보는 맛, 손맛", id: "float", why: "찌가 쏙 들어가는 순간을 눈으로 보고 걸어요." },
  { want: "확실하게 많이, 장비 없이", id: "boat", why: "선장이 고기 위로 데려가고 장비도 빌려요." },
  { want: "아이와 가볍게, 발 앞에서", id: "pole", why: "릴 없는 대로 항구 안 발밑을 노려요." },
];
