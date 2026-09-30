import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { LogEntry } from "@/lib/localStore";
import type { Backend, BUser } from "./backend";
import { callbackUrl, getSupabase, kakaoEnabled } from "./client";
import { TIP_DAYS, type ShopTip } from "./tips";
import { authErrorMessage } from "./validate";

/** Supabase (운영자가 키를 넣은 경우). 테이블 구조와 권한(RLS)은 supabase/schema.sql 참고 */

const sbp = () => getSupabase()!;

async function uid(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("login");
  return id;
}

async function toUser(sb: SupabaseClient, s: Session | null): Promise<BUser | null> {
  if (!s?.user) return null;
  const meta = (s.user.user_metadata ?? {}) as Record<string, unknown>;
  let nickname = (meta.nickname ?? meta.name ?? meta.full_name ?? null) as string | null;
  try {
    const { data } = await sb.from("profiles").select("nickname").eq("id", s.user.id).maybeSingle();
    nickname = (data?.nickname as string | undefined) ?? nickname;
  } catch {}
  return {
    id: s.user.id,
    email: s.user.email ?? null,
    provider: (s.user.app_metadata?.provider as string) ?? "email",
    createdAt: s.user.created_at,
    nickname,
  };
}

const ok = (error: unknown) => (error ? { error: authErrorMessage(error as { code?: string; message?: string }) } : {});

export async function supabaseBackend(): Promise<Backend> {
  const sb = await sbp();
  return {
    mode: "supabase",
    needsCurrentPassword: false,
    resetByEmail: true,
    kakao: kakaoEnabled,
    async current() {
      const { data } = await sb.auth.getSession();
      return toUser(sb, data.session);
    },
    subscribe(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === "INITIAL_SESSION") return;
        // 콜백 안에서 바로 Supabase 를 다시 부르면 교착될 수 있어 다음 틱으로 미룬다
        setTimeout(cb, 0);
      });
      return () => data.subscription.unsubscribe();
    },
    async signUp(i) {
      const { data, error } = await sb.auth.signUp({
        email: i.email.trim(),
        password: i.password,
        options: {
          emailRedirectTo: callbackUrl(),
          data: { nickname: i.nickname.trim(), marketing_opt_in: i.marketing, terms_agreed_at: new Date().toISOString() },
        },
      });
      if (error) return ok(error);
      // 이미 가입된 메일이면 Supabase 는 오류 대신 빈 identities 를 준다 (가입 여부 노출 방지)
      if (data.user && data.user.identities?.length === 0) return { error: "이미 가입된 이메일이에요. 로그인해 주세요." };
      return data.session ? {} : { confirmEmail: true };
    },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      return ok(error);
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async setNickname(id, nickname) {
      const { error } = await sb.from("profiles").update({ nickname: nickname.trim(), updated_at: new Date().toISOString() }).eq("id", id);
      return error ? { error: "닉네임을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요." } : {};
    },
    async changePassword(_current, password) {
      const { error } = await sb.auth.updateUser({ password });
      return ok(error);
    },
    async deleteAccount() {
      const { data } = await sb.auth.getSession();
      const r = await fetch("/api/account", { method: "DELETE", headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` } }).catch(() => null);
      if (!r?.ok) {
        const j = (await r?.json().catch(() => null)) as { message?: string } | null;
        return { error: j?.message ?? "탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요." };
      }
      await sb.auth.signOut().catch(() => {});
      return {};
    },
    data: {
      async load() {
        const id = await uid(sb);
        const [f, l] = await Promise.all([
          sb.from("favorites").select("spot_id").eq("user_id", id),
          sb.from("catch_logs").select("data").eq("user_id", id),
        ]);
        if (f.error) throw f.error;
        if (l.error) throw l.error;
        return {
          favs: (f.data ?? []).map((r: { spot_id: string }) => r.spot_id),
          logs: (l.data ?? []).map((r: { data: LogEntry }) => r.data).filter((x) => x && typeof x.id === "string"),
        };
      },
      async addFavs(ids) {
        if (!ids.length) return;
        const id = await uid(sb);
        const { error } = await sb.from("favorites").upsert(ids.map((spot_id) => ({ user_id: id, spot_id })));
        if (error) throw error;
      },
      async removeFav(spotId) {
        const id = await uid(sb);
        const { error } = await sb.from("favorites").delete().eq("user_id", id).eq("spot_id", spotId);
        if (error) throw error;
      },
      async upsertLogs(logs) {
        const id = await uid(sb);
        // 사진이 들어 있으면 한 번에 너무 커질 수 있어 20개씩
        for (let i = 0; i < logs.length; i += 20) {
          const { error } = await sb
            .from("catch_logs")
            .upsert(logs.slice(i, i + 20).map((e) => ({ user_id: id, id: e.id, data: e, updated_at: new Date().toISOString() })));
          if (error) throw error;
        }
      },
      async removeLog(logId) {
        const id = await uid(sb);
        const { error } = await sb.from("catch_logs").delete().eq("user_id", id).eq("id", logId);
        if (error) throw error;
      },
    },
    tips: {
      async list(spotId) {
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
      },
      async add(t) {
        const { error } = await sb.from("shop_tips").insert({ ...t, author: await uid(sb) });
        if (error) throw error;
      },
      async remove(_spot, id) {
        const { error } = await sb.from("shop_tips").delete().eq("id", id);
        if (error) throw error;
      },
    },
  };
}
