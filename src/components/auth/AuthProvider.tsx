"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authConfigured, getSupabase } from "@/lib/auth/client";
import { flushBeforeSignOut, syncOnSignIn } from "@/lib/auth/sync";

export interface AuthUser {
  id: string;
  email: string | null;
  provider: string;
  createdAt: string;
}

interface AuthState {
  /** 운영자가 Supabase 키를 넣었는지 */
  configured: boolean;
  loading: boolean;
  user: AuthUser | null;
  nickname: string | null;
  /** 마지막 동기화 결과 */
  sync: { state: "idle" | "running" | "done" | "error"; favs?: number; logs?: number };
  refreshProfile: () => Promise<void>;
  /** 로그아웃. 기기 데이터 업로드 실패 시 false (데이터는 기기에 남김) */
  signOut: () => Promise<boolean>;
}

const Ctx = createContext<AuthState>({
  configured: false,
  loading: false,
  user: null,
  nickname: null,
  sync: { state: "idle" },
  refreshProfile: async () => {},
  signOut: async () => true,
});

export const useAuth = () => useContext(Ctx);

const toUser = (s: Session | null): AuthUser | null =>
  s?.user
    ? {
        id: s.user.id,
        email: s.user.email ?? null,
        provider: (s.user.app_metadata?.provider as string) ?? "email",
        createdAt: s.user.created_at,
      }
    : null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(authConfigured);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [sync, setSync] = useState<AuthState["sync"]>({ state: "idle" });
  const sbRef = useRef<SupabaseClient | null>(null);
  const syncedFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (sb: SupabaseClient, s: Session) => {
    const meta = (s.user.user_metadata ?? {}) as Record<string, unknown>;
    const fallback = (meta.nickname ?? meta.name ?? meta.full_name ?? null) as string | null;
    try {
      const { data } = await sb.from("profiles").select("nickname").eq("id", s.user.id).maybeSingle();
      setNickname((data?.nickname as string | undefined) ?? fallback);
    } catch {
      setNickname(fallback);
    }
  }, []);

  const onSession = useCallback(
    async (sb: SupabaseClient, s: Session | null) => {
      setUser(toUser(s));
      setLoading(false);
      if (!s) {
        setNickname(null);
        syncedFor.current = null;
        return;
      }
      void loadProfile(sb, s);
      if (syncedFor.current === s.user.id) return;
      syncedFor.current = s.user.id;
      setSync({ state: "running" });
      const r = await syncOnSignIn(sb, s.user.id);
      setSync(r.ok ? { state: "done", favs: r.favs, logs: r.logs } : { state: "error" });
    },
    [loadProfile],
  );

  useEffect(() => {
    const p = getSupabase();
    if (!p) return;
    let unsub: (() => void) | undefined;
    let alive = true;
    p.then(async (sb) => {
      if (!alive) return;
      sbRef.current = sb;
      const { data } = await sb.auth.getSession();
      await onSession(sb, data.session);
      const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
        if (event === "INITIAL_SESSION") return;
        // 콜백 안에서 바로 Supabase 를 다시 부르면 교착될 수 있어 다음 틱으로 미룬다
        setTimeout(() => void onSession(sb, s), 0);
      });
      unsub = () => sub.subscription.unsubscribe();
    }).catch(() => setLoading(false));
    return () => {
      alive = false;
      unsub?.();
    };
  }, [onSession]);

  const refreshProfile = useCallback(async () => {
    const sb = sbRef.current;
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    if (data.session) await loadProfile(sb, data.session);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const sb = sbRef.current;
    if (!sb) return true;
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    const flushed = uid ? await flushBeforeSignOut(sb, uid) : true;
    await sb.auth.signOut();
    return flushed;
  }, []);

  return (
    <Ctx.Provider value={{ configured: authConfigured, loading, user, nickname, sync, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
