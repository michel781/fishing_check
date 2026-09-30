import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { mailSecretSeed } from "./mail";
import { getKV } from "./store";

/**
 * 이메일 인증번호 (서버 전용). 저장소 없이도 동작하도록 서명된 토큰을 쓴다.
 *  - 인증번호 요청: 6자리 번호를 메일로 보내고, 화면에는 "번호의 서명값"만 든 토큰을 준다 (번호 자체는 없음)
 *  - 번호 확인: 토큰 서명·유효시간·이메일·번호를 확인하면 30분짜리 "인증 완료 증명(proof)"을 준다
 *  - 회원가입·비밀번호 재설정은 proof 가 있어야 진행된다
 * 틀린 번호는 토큰마다 5번까지. 횟수는 저장소(Redis)가 있으면 거기에, 없으면 서버 메모리에 센다.
 */

export type Purpose = "signup" | "reset";
export const CODE_MINUTES = 10;
const PROOF_MINUTES = 30;
const MAX_TRIES = 5;

function secret(): Buffer | null {
  const seed = mailSecretSeed();
  return seed ? createHash("sha256").update(`fc-verify|${seed}`).digest() : null;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const mac = (key: Buffer, s: string) => createHmac("sha256", key).update(s).digest("base64url");
const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export const normEmail = (e: string) => e.trim().toLowerCase();

function sign(payload: object): string {
  const key = secret();
  if (!key) throw new Error("no secret");
  const p = b64(JSON.stringify(payload));
  return `${p}.${mac(key, p)}`;
}

function open<T>(token: string): T | null {
  const key = secret();
  if (!key || typeof token !== "string" || token.length > 2000) return null;
  const [p, s] = token.split(".");
  if (!p || !s || !same(s, mac(key, p))) return null;
  try {
    return JSON.parse(unb64(p)) as T;
  } catch {
    return null;
  }
}

interface CodeToken {
  t: "code";
  e: string;
  u: Purpose;
  x: number;
  n: string;
  h: string;
}
interface Proof {
  t: "proof";
  e: string;
  u: Purpose;
  x: number;
}

export function issueCode(email: string, purpose: Purpose): { code: string; token: string } {
  const key = secret();
  if (!key) throw new Error("no secret");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const e = normEmail(email);
  const n = randomBytes(9).toString("base64url");
  const token = sign({ t: "code", e, u: purpose, x: Date.now() + CODE_MINUTES * 60e3, n, h: mac(key, `${e}|${purpose}|${n}|${code}`) } satisfies CodeToken);
  return { code, token };
}

// 저장소가 없을 때의 횟수 세기 (서버 인스턴스마다 따로 셈)
const mem = ((globalThis as { __fcTries?: Map<string, { n: number; x: number }> }).__fcTries ??= new Map());

/** 제한 시간 동안 key 의 횟수를 1 올리고 올린 값을 돌려준다 */
export async function bump(key: string, windowSec: number): Promise<number> {
  const kv = getKV();
  if (kv) {
    const n = await kv.cmd<number>("INCR", `vr:${key}`);
    if (n === 1) await kv.cmd("EXPIRE", `vr:${key}`, windowSec);
    return n;
  }
  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (v.x < now) mem.delete(k);
  const cur = mem.get(key);
  const next = cur && cur.x > now ? { n: cur.n + 1, x: cur.x } : { n: 1, x: now + windowSec * 1000 };
  mem.set(key, next);
  return next.n;
}

export type CheckResult = { ok: true; proof: string } | { ok: false; code: "expired" | "wrong" | "too_many" | "invalid"; message: string; left?: number };

export async function checkCode(token: string, email: string, code: string, purpose: Purpose): Promise<CheckResult> {
  const key = secret();
  const t = open<CodeToken>(token);
  if (!key || !t || t.t !== "code" || t.u !== purpose || t.e !== normEmail(email)) {
    return { ok: false, code: "invalid", message: "인증번호를 다시 받아 주세요." };
  }
  if (t.x < Date.now()) return { ok: false, code: "expired", message: `인증번호 유효시간(${CODE_MINUTES}분)이 지났어요. 다시 받아 주세요.` };
  const tries = await bump(`try:${t.n}`, CODE_MINUTES * 60);
  if (tries > MAX_TRIES) return { ok: false, code: "too_many", message: "여러 번 틀렸어요. 인증번호를 다시 받아 주세요." };
  const digits = String(code ?? "").replace(/\D/g, "");
  if (digits.length !== 6 || !same(t.h, mac(key, `${t.e}|${purpose}|${t.n}|${digits}`))) {
    return { ok: false, code: "wrong", message: `인증번호가 맞지 않아요. (${MAX_TRIES - tries}번 남음)`, left: MAX_TRIES - tries };
  }
  return { ok: true, proof: sign({ t: "proof", e: t.e, u: purpose, x: Date.now() + PROOF_MINUTES * 60e3 } satisfies Proof) };
}

/** 회원가입·재설정 직전에 "이 이메일은 방금 인증됐다"를 확인 */
export function checkProof(proof: unknown, email: string, purpose: Purpose): boolean {
  const p = open<Proof>(String(proof ?? ""));
  return !!p && p.t === "proof" && p.u === purpose && p.e === normEmail(email) && p.x > Date.now();
}

/** 인증 메일을 보낼 수 있는 상태인지 (메일 키가 있으면 서명 비밀값도 있다) */
export const verifyEnabled = () => !!secret();
