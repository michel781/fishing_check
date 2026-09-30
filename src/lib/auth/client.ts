import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 회원 기능(Supabase). 브라우저에서만 쓴다.
 * 환경변수가 없으면 null → 앱은 로그인 없이(이 기기 저장) 그대로 동작한다.
 * NEXT_PUBLIC_ 값은 빌드할 때 코드에 들어가므로, Vercel 에서 값을 넣은 뒤 다시 배포해야 반영된다.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const authConfigured = Boolean(URL && KEY);
export const kakaoEnabled = process.env.NEXT_PUBLIC_AUTH_KAKAO === "1";

let client: Promise<SupabaseClient> | null = null;

/** 필요할 때만 라이브러리를 불러온다 (첫 화면 용량 절약) */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!authConfigured || typeof window === "undefined") return null;
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "fc-auth" },
    }),
  );
  return client;
}

/** 이메일 인증·비밀번호 재설정·카카오 로그인 뒤 돌아올 주소 */
export const callbackUrl = (path = "/auth/callback") => `${window.location.origin}${path}`;
