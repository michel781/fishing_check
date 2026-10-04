/**
 * 어종별 먹이 습성 (위 내용물·생태 자료를 낚시꾼이 쓰는 말로 단순화한 참고값).
 *  - diet: 자연 먹이 비중(%) — 합계 100
 *  - style: 먹이를 잡는 방식
 *  - layer: 먹이를 먹는 물 깊이(표층·중층·바닥) 0~1
 *  - cover: 주로 머무는 곳 (사냥터)
 *  - senses: 먹이를 찾을 때 주로 쓰는 감각
 *  - notes: 철마다 먹는 양이 바뀌는 때
 * 시간대별 활동은 엔진과 같은 기준을 쓰도록 species.light에서, 수온 반응은 species.temp에서 계산한다.
 */

export type FoodKind = "fish" | "crustacean" | "worm" | "shellfish" | "cephalopod" | "plankton" | "algae" | "detritus";

export const FOOD: Record<FoodKind, { label: string; icon: string; examples: string }> = {
  fish: { label: "작은 물고기", icon: "🐟", examples: "멸치·전어·학꽁치·망둥어 새끼" },
  crustacean: { label: "새우·게", icon: "🦐", examples: "보리새우·쏙·게·곤쟁이" },
  worm: { label: "갯지렁이", icon: "🪱", examples: "청갯지렁이·참갯지렁이·혼무시" },
  shellfish: { label: "조개·고둥·성게", icon: "🐚", examples: "바지락·홍합·따개비·소라·성게" },
  cephalopod: { label: "오징어·문어류", icon: "🦑", examples: "꼴뚜기·새끼 오징어" },
  plankton: { label: "플랑크톤", icon: "✨", examples: "요각류·곤쟁이·크릴 같은 작은 생물" },
  algae: { label: "해조류", icon: "🌿", examples: "파래·김·갈조류" },
  detritus: { label: "바닥 유기물", icon: "🟤", examples: "펄 속 규조류·썩은 유기물" },
};

export type FeedStyle = "ambush" | "chase" | "forage" | "school" | "graze" | "filter";

export const STYLE: Record<FeedStyle, { label: string; desc: string; tip: string }> = {
  ambush: {
    label: "숨어서 덮치기",
    desc: "바위틈·모래·구조물에 숨어 있다가 앞으로 지나가는 먹이를 한 번에 덮쳐요.",
    tip: "채비를 은신처 바로 앞으로 천천히 지나가게 하세요. 한자리에 오래 두기보다 구석구석 훑는 게 좋아요.",
  },
  chase: {
    label: "쫓아가서 사냥",
    desc: "빠르게 헤엄쳐 도망치는 작은 물고기를 쫓아가 잡아요.",
    tip: "루어를 빠르게 감거나 튀겨서 도망치는 먹이처럼 보이게 하세요. 베이트(작은 물고기 떼)가 보이는 곳이 1순위예요.",
  },
  forage: {
    label: "바닥 뒤지기",
    desc: "바닥을 돌아다니며 냄새로 먹이를 찾아 집어 먹어요.",
    tip: "미끼가 바닥에 닿아 있어야 해요. 냄새가 진한 생미끼가 유리하고, 입질이 오면 조금 기다렸다 챔질하세요.",
  },
  school: {
    label: "떼 지어 사냥",
    desc: "무리로 다니며 먹이 떼를 몰아 먹어요. 한 마리가 물면 줄줄이 물어요.",
    tip: "밑밥으로 떼를 붙잡아 두는 게 핵심이에요. 입질이 끊기면 수심(층)을 바꿔 보세요.",
  },
  graze: {
    label: "깨서 갉아먹기",
    desc: "단단한 이빨로 조개·성게·따개비를 깨서 먹어요.",
    tip: "딱딱한 미끼(성게·소라·게)를 쓰고, 작은 입질에 바로 챔질하지 말고 끌고 갈 때 채세요.",
  },
  filter: {
    label: "걸러 먹기",
    desc: "물이나 펄 속 아주 작은 먹이를 걸러 먹어요. 큰 미끼는 잘 안 먹어요.",
    tip: "아주 작은 바늘과 부드러운 미끼(빵·떡밥·작은 크릴)를 쓰세요.",
  },
};

export type Layer = { top: number; mid: number; bottom: number };

export interface Feeding {
  diet: Partial<Record<FoodKind, number>>;
  style: FeedStyle;
  layer: Layer;
  cover: string;
  senses: string;
  notes: string;
}

export const FEEDING: Record<string, Feeding> = {
  rockfish: {
    diet: { fish: 45, crustacean: 35, cephalopod: 10, worm: 10 },
    style: "ambush",
    layer: { top: 0.1, mid: 0.4, bottom: 1 },
    cover: "암초·테트라포드·어초 틈",
    senses: "옆줄(진동)과 눈",
    notes: "늦가을·초겨울 산란을 앞두고 많이 먹고, 봄 산란 뒤 다시 활발해져요.",
  },
  greenling: {
    diet: { crustacean: 40, worm: 30, fish: 15, shellfish: 15 },
    style: "ambush",
    layer: { top: 0, mid: 0.2, bottom: 1 },
    cover: "해초가 붙은 바위 바닥",
    senses: "눈과 냄새",
    notes: "늦가을 산란 전후로 먹성이 좋아요. 물이 차가워도 비교적 잘 먹어요.",
  },
  flatfish: {
    diet: { fish: 70, cephalopod: 15, crustacean: 15 },
    style: "ambush",
    layer: { top: 0, mid: 0.3, bottom: 1 },
    cover: "모래·펄 바닥 (몸을 묻고 위를 봄)",
    senses: "눈 (위쪽을 지나가는 먹이를 봄)",
    notes: "봄 산란 뒤와 가을에 살이 오르며 많이 먹어요. 살아 움직이는 먹이를 좋아해요.",
  },
  blackporgy: {
    diet: { crustacean: 30, shellfish: 25, worm: 25, algae: 10, fish: 10 },
    style: "forage",
    layer: { top: 0.2, mid: 0.6, bottom: 1 },
    cover: "갯바위 주변·방파제 기초석·몽돌 바닥",
    senses: "냄새와 눈 (경계심이 매우 큼)",
    notes: "봄 산란 전(3~4월)과 가을 수온이 내려갈 때 먹이를 많이 찾아요.",
  },
  redseabream: {
    diet: { crustacean: 35, fish: 25, shellfish: 20, worm: 10, cephalopod: 10 },
    style: "forage",
    layer: { top: 0.1, mid: 0.6, bottom: 1 },
    cover: "수심 있는 암반·자갈 바닥, 조류가 부딪히는 곳",
    senses: "눈과 냄새",
    notes: "봄 산란(4~6월)을 앞두고 연안으로 붙고, 가을에 다시 먹성이 좋아요.",
  },
  webfoot: {
    diet: { crustacean: 50, shellfish: 30, fish: 20 },
    style: "ambush",
    layer: { top: 0, mid: 0.1, bottom: 1 },
    cover: "펄·모래 바닥의 빈 조개껍데기·소라방",
    senses: "눈과 다리의 촉감",
    notes: "가을(9~10월) 새끼가 자라며 먹성이 가장 좋아요. 봄에는 산란기라 금어기(5~8월)가 있어요.",
  },
  cuttlefish: {
    diet: { crustacean: 50, fish: 40, worm: 10 },
    style: "ambush",
    layer: { top: 0, mid: 0.3, bottom: 1 },
    cover: "모래·자갈 바닥, 해초밭 가장자리",
    senses: "눈 (아주 밝음)",
    notes: "봄 산란 전과 가을(9~11월) 새끼가 커질 때 잘 먹어요.",
  },
  halfbeak: {
    diet: { plankton: 60, crustacean: 30, algae: 10 },
    style: "school",
    layer: { top: 1, mid: 0.3, bottom: 0 },
    cover: "방파제·항구 안 물 위 (떼로 다님)",
    senses: "눈",
    notes: "가을~겨울 연안으로 몰려와요. 입이 작아 아주 작은 먹이만 먹어요.",
  },
  mackerel: {
    diet: { fish: 50, plankton: 35, cephalopod: 15 },
    style: "school",
    layer: { top: 1, mid: 0.8, bottom: 0.1 },
    cover: "조류가 통하는 방파제 끝·외항",
    senses: "눈과 옆줄",
    notes: "여름~가을 멸치 떼를 따라 연안으로 들어와 아주 활발해요.",
  },
  bolak: {
    diet: { plankton: 35, crustacean: 30, fish: 25, worm: 10 },
    style: "ambush",
    layer: { top: 0.5, mid: 1, bottom: 0.3 },
    cover: "암초 위·방파제 벽에 떠 있음",
    senses: "큰 눈 (밤에도 잘 봄)",
    notes: "겨울~봄(12~4월)에 연안에서 잘 먹어요. 밤에 위로 떠올라 먹이를 기다려요.",
  },
  righteye: {
    diet: { worm: 50, crustacean: 25, shellfish: 15, plankton: 10 },
    style: "forage",
    layer: { top: 0, mid: 0.1, bottom: 1 },
    cover: "모래·펄 바닥",
    senses: "냄새와 눈",
    notes: "봄 산란 뒤 살이 오르며 많이 먹어요. 물이 맑고 차가운 바닥을 좋아해요.",
  },
  "squid-bigfin": {
    diet: { fish: 70, crustacean: 30 },
    style: "chase",
    layer: { top: 0.4, mid: 1, bottom: 0.5 },
    cover: "해초밭·암초 주변",
    senses: "눈 (움직임에 민감)",
    notes: "가을(9~11월) 새끼 무늬오징어가 많이 먹어요. 봄 산란기에는 큰 개체가 연안에 붙어요.",
  },
  hairtail: {
    diet: { fish: 70, cephalopod: 15, crustacean: 15 },
    style: "school",
    layer: { top: 0.8, mid: 1, bottom: 0.2 },
    cover: "항구·방파제 불빛 아래 (밤)",
    senses: "눈 (불빛에 모인 먹이를 노림)",
    notes: "늦여름~가을 밤에 멸치를 따라 위로 떠올라요. 몸을 세우고 위를 보며 먹이를 낚아채요.",
  },
  seabass: {
    diet: { fish: 65, crustacean: 25, worm: 10 },
    style: "chase",
    layer: { top: 1, mid: 0.7, bottom: 0.3 },
    cover: "파도가 부서지는 곳·강 하구·포말",
    senses: "옆줄(진동)과 눈",
    notes: "여름 장마 뒤 강 하구와 가을 베이트 철에 가장 많이 먹어요.",
  },
  opaleye: {
    diet: { algae: 40, crustacean: 35, worm: 15, plankton: 10 },
    style: "school",
    layer: { top: 0.6, mid: 1, bottom: 0.4 },
    cover: "갯바위 직벽·수중여 주변",
    senses: "눈 (경계심 큼)",
    notes: "여름엔 해조와 밑밥에, 겨울엔 더 깊은 곳에서 작은 먹이를 먹어요.",
  },
  spanishmackerel: {
    diet: { fish: 90, cephalopod: 10 },
    style: "chase",
    layer: { top: 1, mid: 0.6, bottom: 0 },
    cover: "조류가 빠른 외항·물골",
    senses: "눈 (빠른 움직임)",
    notes: "가을(9~11월) 멸치·전어 떼를 쫓아 연안에서 수면을 깨며 먹어요.",
  },
  yellowtail: {
    diet: { fish: 80, cephalopod: 20 },
    style: "chase",
    layer: { top: 1, mid: 0.9, bottom: 0.2 },
    cover: "조류가 부딪히는 갯바위 곶·수중여",
    senses: "눈과 옆줄",
    notes: "여름~가을 수온이 높을 때 베이트를 쫓아 수면까지 올라와요.",
  },
  mullet: {
    diet: { detritus: 70, algae: 20, crustacean: 10 },
    style: "filter",
    layer: { top: 0.7, mid: 0.4, bottom: 1 },
    cover: "항구 안·강 하구·갯벌 가장자리",
    senses: "냄새",
    notes: "봄·가을 연안에 많아요. 펄을 입으로 걸러 먹어 미끼를 잘 안 무는 날이 많아요.",
  },
  gizzardshad: {
    diet: { plankton: 60, detritus: 40 },
    style: "filter",
    layer: { top: 0.6, mid: 1, bottom: 0.3 },
    cover: "항구 안·내만 (큰 떼)",
    senses: "눈",
    notes: "가을(9~10월) 기름이 오르며 연안 떼가 커져요. 낚시는 카드채비 훌치기가 많아요.",
  },
  dodari: {
    diet: { worm: 55, crustacean: 25, shellfish: 20 },
    style: "forage",
    layer: { top: 0, mid: 0.1, bottom: 1 },
    cover: "모래·펄 바닥",
    senses: "냄새와 눈",
    notes: "봄(3~5월) 산란 뒤 살이 오르며 많이 먹어요.",
  },
  octopus: {
    diet: { crustacean: 50, shellfish: 35, fish: 15 },
    style: "ambush",
    layer: { top: 0, mid: 0.1, bottom: 1 },
    cover: "바위 굴·돌 틈",
    senses: "눈과 빨판의 촉감·맛",
    notes: "여름~가을 연안 수온이 높을 때 활발해요. 게를 특히 좋아해요.",
  },
  conger: {
    diet: { fish: 40, crustacean: 35, worm: 15, cephalopod: 10 },
    style: "forage",
    layer: { top: 0, mid: 0.2, bottom: 1 },
    cover: "바위틈·펄 바닥 굴 (밤에 나옴)",
    senses: "냄새 (아주 예민)",
    notes: "여름~가을 밤에 가장 활발해요. 냄새 진한 생선살 미끼가 잘 들어요.",
  },
  rockbream: {
    diet: { shellfish: 55, crustacean: 35, worm: 10 },
    style: "graze",
    layer: { top: 0, mid: 0.4, bottom: 1 },
    cover: "수중여·갯바위 직벽",
    senses: "눈 (경계심 큼)",
    notes: "여름~가을 수온 20℃ 넘을 때 활발해요. 성게·소라를 이빨로 깨 먹어요.",
  },
  squid: {
    diet: { fish: 50, plankton: 30, cephalopod: 20 },
    style: "chase",
    layer: { top: 0.8, mid: 1, bottom: 0.2 },
    cover: "밤바다 집어등 불빛 주변",
    senses: "눈 (불빛에 모인 먹이를 노림)",
    notes: "여름~가을 밤 동해에서 불빛을 따라 떠올라요.",
  },
  goby: {
    diet: { worm: 35, crustacean: 35, fish: 15, shellfish: 15 },
    style: "ambush",
    layer: { top: 0, mid: 0.1, bottom: 1 },
    cover: "갯벌·물골·선착장 바닥",
    senses: "눈 (아주 먹성이 좋음)",
    notes: "가을(9~11월) 살이 올라 아무 미끼나 잘 물어요.",
  },
};

export const getFeeding = (id: string): Feeding | undefined => FEEDING[id];
