import { validateEmail, validateNickname, validatePassword } from "./validate";
import { AUTH_EVT, type Backend, type BUser } from "./backend";

/**
 * 이 기기 계정: 서버 저장소가 아직 없을 때도 회원가입·로그인이 되도록 한다.
 * 계정과 기록은 이 브라우저에만 있고, 비밀번호는 PBKDF2 해시로만 저장한다.
 * 운영자가 서버 저장소를 연결하면 자동으로 서버 계정 방식으로 바뀐다 (기록은 기기에 남아 새 계정에 합쳐짐).
 */

const ACC_KEY = "fc:accounts";
const SESSION_KEY = "fc:session";

interface LocalAccount {
  id: string;
  email: string;
  nickname: string;
  salt: string;
  hash: string;
  createdAt: string;
  marketing: boolean;
}

const norm = (e: string) => e.trim().toLowerCase();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pw: string, salt: Uint8Array): Promise<string> {
  if (!crypto?.subtle) throw new Error("이 브라우저에서는 계정을 만들 수 없어요. 최신 크롬·사파리로 열어 주세요.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: 150_000 }, key, 256);
  return b64(bits);
}

function read(): Record<string, LocalAccount> {
  try {
    return JSON.parse(localStorage.getItem(ACC_KEY) || "{}") as Record<string, LocalAccount>;
  } catch {
    return {};
  }
}
function write(v: Record<string, LocalAccount>) {
  localStorage.setItem(ACC_KEY, JSON.stringify(v));
}
function session(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
function setSession(key: string | null) {
  try {
    if (key) localStorage.setItem(SESSION_KEY, key);
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
  window.dispatchEvent(new Event(AUTH_EVT));
}

const toUser = (a: LocalAccount): BUser => ({ id: a.id, email: a.email, nickname: a.nickname, createdAt: a.createdAt, provider: "device" });

async function check(a: LocalAccount | undefined, pw: string) {
  return !!a && (await derive(pw, unb64(a.salt))) === a.hash;
}

const wrap = async (f: () => Promise<string | void>) => {
  try {
    const e = await f();
    return e ? { error: e } : {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "처리하지 못했어요." };
  }
};

export function localBackend(): Backend {
  return {
    mode: "local",
    needsCurrentPassword: true,
    resetByEmail: false,
    kakao: false,
    async current() {
      const k = session();
      const a = k ? read()[k] : undefined;
      return a ? toUser(a) : null;
    },
    subscribe(cb) {
      window.addEventListener(AUTH_EVT, cb);
      const onStorage = (e: StorageEvent) => (e.key === SESSION_KEY || e.key === ACC_KEY) && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener(AUTH_EVT, cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    signUp: (i) =>
      wrap(async () => {
        const bad = validateNickname(i.nickname) ?? validateEmail(i.email) ?? validatePassword(i.password);
        if (bad) return bad;
        const all = read();
        const k = norm(i.email);
        if (all[k]) return "이 기기에 이미 가입된 이메일이에요. 로그인해 주세요.";
        const salt = crypto.getRandomValues(new Uint8Array(16));
        all[k] = {
          id: crypto.randomUUID?.() ?? `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
          email: i.email.trim(),
          nickname: i.nickname.trim(),
          salt: b64(salt),
          hash: await derive(i.password, salt),
          createdAt: new Date().toISOString(),
          marketing: i.marketing,
        };
        write(all);
        setSession(k);
      }),
    signIn: (email, password) =>
      wrap(async () => {
        const k = norm(email);
        if (!(await check(read()[k], password))) return "이메일 또는 비밀번호가 맞지 않아요.";
        setSession(k);
      }),
    async signOut() {
      setSession(null);
    },
    setNickname: (_uid, nickname) =>
      wrap(async () => {
        const bad = validateNickname(nickname);
        if (bad) return bad;
        const all = read();
        const k = session();
        if (!k || !all[k]) return "로그인이 풀렸어요. 다시 로그인해 주세요.";
        all[k].nickname = nickname.trim();
        write(all);
      }),
    changePassword: (current, password) =>
      wrap(async () => {
        const all = read();
        const k = session();
        if (!k || !(await check(all[k], current))) return "지금 비밀번호가 맞지 않아요.";
        const bad = validatePassword(password);
        if (bad) return bad;
        if (current === password) return "지금 쓰는 비밀번호와 다른 비밀번호를 정해 주세요.";
        const salt = crypto.getRandomValues(new Uint8Array(16));
        all[k] = { ...all[k], salt: b64(salt), hash: await derive(password, salt) };
        write(all);
      }),
    deleteAccount: (password) =>
      wrap(async () => {
        const all = read();
        const k = session();
        if (!k || !(await check(all[k], password))) return "비밀번호가 맞지 않아요.";
        delete all[k];
        write(all);
        setSession(null);
      }),
    data: null,
    tips: null,
  };
}
