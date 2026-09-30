/** 이용자가 낚시점 사장님께 듣고 공유한 최근 조황 (supabase/schema.sql 의 shop_tips) */
export interface ShopTip {
  id: string;
  spot_id: string;
  shop_name: string;
  species: string[];
  content: string;
  heard_on: string;
  nickname: string | null;
  author: string;
  created_at: string;
}

export const TIP_DAYS = 30;

/** 저장 방식(Supabase·자체 서버)에 맞춰 부른다. 이 기기 계정 방식이면 null (공유 불가) */
async function api() {
  const { getBackend } = await import("./backend");
  return (await getBackend()).tips;
}

export async function listTips(spotId: string): Promise<ShopTip[] | null> {
  const t = await api();
  return t ? t.list(spotId) : null;
}

export async function addTip(tip: { spot_id: string; shop_name: string; species: string[]; content: string; heard_on: string; nickname: string | null }) {
  const t = await api();
  if (!t) throw new Error("unsupported");
  await t.add(tip);
}

export async function deleteTip(spotId: string, id: string) {
  const t = await api();
  if (!t) throw new Error("unsupported");
  await t.remove(spotId, id);
}

export function validateTip(t: { shop_name: string; content: string }): string | null {
  if (!t.shop_name.trim()) return "낚시점 이름을 적어 주세요.";
  if (t.shop_name.trim().length > 40) return "낚시점 이름이 너무 길어요.";
  if (t.content.trim().length < 5) return "들은 내용을 5자 이상 적어 주세요.";
  if (t.content.trim().length > 300) return "300자 이내로 적어 주세요.";
  if (/(\d{2,3}-?\d{3,4}-?\d{4})/.test(t.content)) return "개인 연락처는 적지 말아 주세요.";
  return null;
}
