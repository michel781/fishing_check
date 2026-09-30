"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getBackend, type AuthMode, type Backend, type BUser } from "@/lib/auth/backend";
import { flushBeforeSignOut, setActiveData, syncOnSignIn } from "@/lib/auth/sync";

export type AuthUser = Omit<BUser, "nickname">;

interface AuthState {
  /** 회원 기능을 쓸 수 있는지 (저장 방식이 정해지면 true) */
  configured: boolean;
  /** supabase·server: 여러 기기에서 같은 계정 / local: 이 기기에만 저장 */
  mode: AuthMode | null;
  backend: Backend | null;
  loading: boolean;
  user: AuthUser | null;
  nickname: string | null;
  /** 마지막 동기화 결과 */
  sync: { state: "idle" | "running" | "done" | "error"; favs?: number; logs?: number };
  /** 로그인 상태·프로필을 다시 읽는다 (가입·로그인 직후 화면 이동 전에 부른다) */
  refreshProfile: () => Promise<void>;
  /** 로그아웃. 기기 데이터 업로드 실패 시 false (데이터는 기기에 남김) */
  signOut: () => Promise<boolean>;
}

const Ctx = createContext<AuthState>({
  configured: false,
  mode: null,
  backend: null,
  loading: true,
  user: null,
  nickname: null,
  sync: { state: "idle" },
  refreshProfile: async () => {},
  signOut: async () => true,
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [sync, setSync] = useState<AuthState["sync"]>({ state: "idle" });
  const bRef = useRef<Backend | null>(null);
  const syncedFor = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const b = bRef.current;
    if (!b) return;
    let u: BUser | null = null;
    try {
      u = await b.current();
    } catch {}
    setUser(u ? { id: u.id, email: u.email, provider: u.provider, createdAt: u.createdAt } : null);
    setNickname(u?.nickname ?? null);
    setLoading(false);
    setActiveData(u ? b.data : null);
    if (!u) {
      syncedFor.current = null;
      setSync({ state: "idle" });
      return;
    }
    if (!b.data) {
      // 이 기기 계정: 기록이 이미 이 기기에 있다
      setSync({ state: "idle" });
      return;
    }
    if (syncedFor.current === u.id) return;
    syncedFor.current = u.id;
    setSync({ state: "running" });
    const r = await syncOnSignIn(b.data, u.id);
    setSync(r.ok ? { state: "done", favs: r.favs, logs: r.logs } : { state: "error" });
  }, []);

  useEffect(() => {
    let alive = true;
    let unsub: (() => void) | undefined;
    getBackend()
      .then(async (b) => {
        if (!alive) return;
        bRef.current = b;
        setBackend(b);
        await refresh();
        unsub = b.subscribe(() => void refresh());
      })
      .catch(() => setLoading(false));
    return () => {
      alive = false;
      unsub?.();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    const b = bRef.current;
    if (!b) return true;
    const flushed = b.data && syncedFor.current ? await flushBeforeSignOut(b.data) : true;
    setActiveData(null);
    await b.signOut().catch(() => {});
    await refresh();
    return flushed;
  }, [refresh]);

  return (
    <Ctx.Provider value={{ configured: !!backend, mode: backend?.mode ?? null, backend, loading, user, nickname, sync, refreshProfile: refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
