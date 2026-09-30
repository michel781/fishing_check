import type { LogEntry } from "@/lib/localStore";
import { authConfigured } from "./client";
import type { ShopTip } from "./tips";

/**
 * 회원 기능의 "저장 방식"을 하나의 모양으로 묶는다. 화면 코드는 이 인터페이스만 쓴다.
 * - supabase: 운영자가 Supabase 키를 넣은 경우 (메일 인증·카카오 로그인·비밀번호 찾기 메일)
 * - server  : 자체 회원 기능 + 서버 저장소(Upstash Redis). 여러 기기에서 같은 계정
 * - local   : 서버 저장소가 없을 때. 계정과 기록이 이 기기(브라우저)에만 저장
 */
export type AuthMode = "supabase" | "server" | "local";

export interface BUser {
  id: string;
  email: string | null;
  provider: string;
  createdAt: string;
  nickname: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  nickname: string;
  marketing: boolean;
  /** 이메일 인증번호 확인 뒤 받은 증명 (/api/verify/check) */
  proof?: string;
}

export interface DataApi {
  load(): Promise<{ favs: string[]; logs: LogEntry[] }>;
  addFavs(ids: string[]): Promise<void>;
  removeFav(id: string): Promise<void>;
  upsertLogs(logs: LogEntry[]): Promise<void>;
  removeLog(id: string): Promise<void>;
}

export interface TipsApi {
  list(spotId: string): Promise<ShopTip[]>;
  add(t: Omit<ShopTip, "id" | "author" | "created_at">): Promise<void>;
  remove(spotId: string, id: string): Promise<void>;
}

/** 오류는 쉬운 한국어 문구(error)로 돌려준다 */
export type Res = { error?: string };

export interface Backend {
  mode: AuthMode;
  current(): Promise<BUser | null>;
  /** 다른 탭·다른 방식으로 로그인 상태가 바뀌면 알려준다 */
  subscribe(cb: () => void): () => void;
  signUp(i: SignUpInput): Promise<Res & { confirmEmail?: boolean }>;
  signIn(email: string, password: string): Promise<Res>;
  signOut(): Promise<void>;
  setNickname(uid: string, nickname: string): Promise<Res>;
  /** current 는 needsCurrentPassword 일 때만 쓴다 */
  changePassword(current: string, password: string): Promise<Res>;
  /** password 는 needsCurrentPassword 일 때만 쓴다 */
  deleteAccount(password: string): Promise<Res>;
  /** 이메일 인증번호로 비밀번호 새로 정하기 (supabase 는 메일 링크 방식이라 없음) */
  resetPassword?(email: string, proof: string, password: string): Promise<Res>;
  /** 기기 간 동기화 (local 은 없음) */
  data: DataApi | null;
  tips: TipsApi | null;
  needsCurrentPassword: boolean;
  resetByEmail: boolean;
  kakao: boolean;
}

export const AUTH_EVT = "fc:auth";
const MODE_KEY = "fc:auth-mode";

let backend: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  if (typeof window === "undefined") return Promise.reject(new Error("browser only"));
  backend ??= (async () => {
    if (authConfigured) return (await import("./backend-supabase")).supabaseBackend();
    let store: boolean | null = null;
    let first: unknown = undefined;
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
      const j = (await r.json()) as { store?: boolean; user?: unknown };
      store = j.store === true;
      if (r.ok) first = j.user ?? null;
    } catch {
      // 오프라인: 지난번에 확인한 방식을 쓴다
      try {
        store = localStorage.getItem(MODE_KEY) === "server";
      } catch {}
    }
    try {
      localStorage.setItem(MODE_KEY, store ? "server" : "local");
    } catch {}
    if (store) return (await import("./backend-server")).serverBackend(first);
    return (await import("./backend-local")).localBackend();
  })();
  return backend;
}
