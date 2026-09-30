import { getSupabase } from "./client";

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

export async function listTips(spotId: string): Promise<ShopTip[] | null> {
  const p = getSupabase();
  if (!p) return null;
  const sb = await p;
  const since = new Date(Date.now() - TIP_DAYS * 86400e3).toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("shop_tips")
    .select("id,spot_id,shop_name,species,content,heard_on,nickname,author,created_at")
    .eq("spot_id", spotId)
    .gte("heard_on", since)
    .order("heard_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as ShopTip[];
}

export async function addTip(t: { spot_id: string; shop_name: string; species: string[]; content: string; heard_on: string; nickname: string | null }) {
  const sb = await getSupabase()!;
  const { data } = await sb.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error("login");
  const { error } = await sb.from("shop_tips").insert({ ...t, author: uid });
  if (error) throw error;
}

export async function deleteTip(id: string) {
  const sb = await getSupabase()!;
  const { error } = await sb.from("shop_tips").delete().eq("id", id);
  if (error) throw error;
}

export function validateTip(t: { shop_name: string; content: string }): string | null {
  if (!t.shop_name.trim()) return "낚시점 이름을 적어 주세요.";
  if (t.shop_name.trim().length > 40) return "낚시점 이름이 너무 길어요.";
  if (t.content.trim().length < 5) return "들은 내용을 5자 이상 적어 주세요.";
  if (t.content.trim().length > 300) return "300자 이내로 적어 주세요.";
  if (/(\d{2,3}-?\d{3,4}-?\d{4})/.test(t.content)) return "개인 연락처는 적지 말아 주세요.";
  return null;
}
