import type { LogEntry } from "@/lib/localStore";
import { AUTH_EVT, type Backend, type BUser } from "./backend";
import type { ShopTip } from "./tips";

/** 자체 회원 기능 (/api/auth/*). 로그인 유지는 httpOnly 쿠키라 화면 코드는 토큰을 만지지 않는다. */

const USER_KEY = "fc:auth-user";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api/auth/${path}`, {
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("인터넷 연결이 불안정해요. 잠시 후 다시 시도해 주세요.", 0);
  }
  const j = (await r.json().catch(() => ({}))) as T & { message?: string };
  if (!r.ok) throw new ApiError(j.message ?? "처리하지 못했어요. 잠시 후 다시 시도해 주세요.", r.status);
  return j;
}

const res = async (f: () => Promise<unknown>) => {
  try {
    await f();
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "처리하지 못했어요." };
  }
};

interface PublicUser {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
}
const toUser = (u: PublicUser | null | undefined): BUser | null =>
  u ? { id: u.id, email: u.email, nickname: u.nickname, createdAt: u.createdAt, provider: "email" } : null;

function remember(u: BUser | null) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}
function remembered(): BUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null") as BUser | null;
  } catch {
    return null;
  }
}

const changed = () => window.dispatchEvent(new Event(AUTH_EVT));

export function serverBackend(first: unknown): Backend {
  // 첫 확인 결과(/api/auth/me)는 한 번 더 부르지 않고 쓴다. undefined = 확인 못 함
  let pending: unknown = first;
  return {
    mode: "server",
    needsCurrentPassword: true,
    resetByEmail: false,
    kakao: false,
    async current() {
      if (pending !== undefined) {
        const u = toUser(pending as PublicUser | null);
        pending = undefined;
        remember(u);
        return u;
      }
      try {
        const j = await call<{ user: PublicUser | null }>("me");
        const u = toUser(j.user);
        remember(u);
        return u;
      } catch (e) {
        // 오프라인·일시 오류: 마지막으로 확인한 로그인 상태를 유지
        if (e instanceof ApiError && e.status === 401) return null;
        return remembered();
      }
    },
    subscribe(cb) {
      window.addEventListener(AUTH_EVT, cb);
      // 다른 탭에서 로그인·로그아웃
      const onStorage = (e: StorageEvent) => e.key === USER_KEY && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener(AUTH_EVT, cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    async signUp(i) {
      const r = await res(() => call("signup", { ...i, agree: true }));
      if (!r.error) changed();
      return r;
    },
    async signIn(email, password) {
      const r = await res(() => call("login", { email, password }));
      if (!r.error) changed();
      return r;
    },
    async signOut() {
      await call("logout", {}).catch(() => {});
      remember(null);
      changed();
    },
    async resetPassword(email, proof, password) {
      const r = await res(() => call("reset", { email, proof, password }));
      if (!r.error) changed();
      return r;
    },
    setNickname: (_uid, nickname) => res(() => call("nickname", { nickname })),
    changePassword: (current, password) => res(() => call("password", { current, password })),
    async deleteAccount(password) {
      const r = await res(() => call("delete", { password }));
      if (!r.error) {
        remember(null);
        changed();
      }
      return r;
    },
    data: {
      load: () => call<{ favs: string[]; logs: LogEntry[] }>("data"),
      addFavs: async (ids) => void (ids.length && (await call("favs", { add: ids }))),
      removeFav: async (id) => void (await call("favs", { remove: [id] })),
      async upsertLogs(logs) {
        // 사진이 들어 있으면 한 번에 너무 커질 수 있어 나눠 보낸다
        for (let i = 0; i < logs.length; i += 10) await call("logs", { upsert: logs.slice(i, i + 10) });
      },
      removeLog: async (id) => void (await call("logs", { remove: [id] })),
    },
    tips: {
      list: async (spot) => (await call<{ tips: ShopTip[] }>(`tips?spot=${encodeURIComponent(spot)}`)).tips,
      add: async (t) => void (await call("tip", t)),
      remove: async (spot_id, id) => void (await call("tip-delete", { spot_id, id })),
    },
  };
}
