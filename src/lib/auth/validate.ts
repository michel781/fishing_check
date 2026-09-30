/** 회원가입·로그인 입력 검사와 오류 문구 (서버·클라이언트 공용, 순수 함수) */

export const NICK_MIN = 2;
export const NICK_MAX = 12;
export const PW_MIN = 8;

export function validateEmail(v: string): string | null {
  const s = v.trim();
  if (!s) return "이메일을 입력해 주세요.";
  if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return "이메일 형식이 맞지 않아요. 예) fish@example.com";
  return null;
}

export function validatePassword(v: string): string | null {
  if (!v) return "비밀번호를 입력해 주세요.";
  if (v.length < PW_MIN) return `비밀번호는 ${PW_MIN}자 이상이어야 해요.`;
  if (v.length > 72) return "비밀번호는 72자 이하로 정해 주세요.";
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "영문과 숫자를 함께 넣어 주세요.";
  return null;
}

export function validateNickname(v: string): string | null {
  const s = v.trim();
  if (!s) return "닉네임을 입력해 주세요.";
  if ([...s].length < NICK_MIN || [...s].length > NICK_MAX) return `닉네임은 ${NICK_MIN}~${NICK_MAX}자로 정해 주세요.`;
  if (!/^[가-힣A-Za-z0-9_]+$/.test(s)) return "닉네임은 한글·영문·숫자·밑줄(_)만 쓸 수 있어요.";
  return null;
}

/** 로그인 후 돌아갈 주소: 우리 사이트 안의 경로만 허용 (외부로 튕기는 공격 방지) */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/^\/(login|signup|auth)(\/|$|\?)/.test(next)) return fallback;
  return next;
}

/** Supabase Auth 오류 → 쉬운 한국어 */
export function authErrorMessage(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!err) return "알 수 없는 오류가 났어요. 잠시 후 다시 시도해 주세요.";
  const code = err.code ?? "";
  const msg = err.message ?? "";
  const byCode: Record<string, string> = {
    invalid_credentials: "이메일 또는 비밀번호가 맞지 않아요.",
    email_not_confirmed: "메일 인증을 먼저 완료해 주세요. 받은편지함(스팸함 포함)을 확인해 주세요.",
    user_already_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
    email_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
    weak_password: "비밀번호가 너무 쉬워요. 영문·숫자를 섞어 더 길게 정해 주세요.",
    over_email_send_rate_limit: "메일을 너무 자주 보냈어요. 잠시 후 다시 시도해 주세요.",
    over_request_rate_limit: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
    email_address_invalid: "쓸 수 없는 이메일 주소예요. 다른 주소를 넣어 주세요.",
    signup_disabled: "지금은 회원가입을 받지 않고 있어요.",
    same_password: "지금 쓰는 비밀번호와 다른 비밀번호를 정해 주세요.",
    otp_expired: "링크가 만료됐어요. 다시 요청해 주세요.",
    session_not_found: "로그인이 풀렸어요. 다시 로그인해 주세요.",
    provider_disabled: "이 로그인 방식은 아직 준비 중이에요.",
  };
  if (byCode[code]) return byCode[code];
  if (/invalid login credentials/i.test(msg)) return byCode.invalid_credentials;
  if (/email not confirmed/i.test(msg)) return byCode.email_not_confirmed;
  if (/already registered|already exists/i.test(msg)) return byCode.user_already_exists;
  if (/rate limit|only request this after/i.test(msg)) return byCode.over_request_rate_limit;
  if (/password should/i.test(msg)) return byCode.weak_password;
  if (/provider is not enabled|unsupported provider/i.test(msg)) return byCode.provider_disabled;
  if (/fetch|network|failed to/i.test(msg)) return "인터넷 연결이 불안정해요. 잠시 후 다시 시도해 주세요.";
  return "처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
