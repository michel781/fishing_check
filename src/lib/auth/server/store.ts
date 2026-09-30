/**
 * 자체 회원 기능의 저장소 (서버 전용).
 * - 운영: Upstash Redis REST (Vercel → Storage → Upstash Redis 를 연결하면 KV_REST_API_URL/TOKEN 이 자동으로 들어온다)
 * - 개발·테스트: FC_AUTH_STORE=memory 이면 메모리 저장소 (서버를 끄면 사라짐)
 * 둘 다 없으면 null → 화면은 "이 기기 계정" 방식으로 동작한다.
 */

export type Arg = string | number;

export interface KV {
  kind: "redis" | "memory";
  cmd<T = unknown>(...args: Arg[]): Promise<T>;
  pipe(cmds: Arg[][]): Promise<unknown[]>;
}

export function redisEnv(): { url: string; token: string } | null {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  return url.startsWith("https://") && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

function redis(url: string, token: string): KV {
  const call = async (path: string, body: unknown) => {
    const r = await fetch(url + path, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok && r.status !== 400) throw new Error(`kv ${r.status}`);
    return r.json();
  };
  return {
    kind: "redis",
    async cmd<T>(...args: Arg[]) {
      const j = (await call("", args)) as { result?: T; error?: string };
      if (j.error) throw new Error(j.error);
      return j.result as T;
    },
    async pipe(cmds) {
      if (!cmds.length) return [];
      const j = (await call("/pipeline", cmds)) as { result?: unknown; error?: string }[];
      const bad = j.find((x) => x.error);
      if (bad) throw new Error(bad.error);
      return j.map((x) => x.result);
    },
  };
}

// ───────── 메모리 저장소: 쓰는 명령만 Redis 와 같은 모양으로 흉내 낸다 ─────────
type Val = string | Set<string> | Map<string, string>;
interface Mem {
  data: Map<string, Val>;
  exp: Map<string, number>;
}

function memory(): KV {
  const g = globalThis as { __fcMem?: Mem };
  const m = (g.__fcMem ??= { data: new Map(), exp: new Map() });
  const live = (k: string) => {
    const e = m.exp.get(k);
    if (e && e <= Date.now()) {
      m.data.delete(k);
      m.exp.delete(k);
    }
    return m.data.get(k);
  };
  const set = (k: string) => {
    const v = live(k);
    if (v instanceof Set) return v;
    const s = new Set<string>();
    m.data.set(k, s);
    return s;
  };
  const hash = (k: string) => {
    const v = live(k);
    if (v instanceof Map) return v;
    const h = new Map<string, string>();
    m.data.set(k, h);
    return h;
  };
  const run = (a: Arg[]): unknown => {
    const [c, ...r] = a.map(String);
    switch (c.toUpperCase()) {
      case "PING":
        return "PONG";
      case "GET": {
        const v = live(r[0]);
        return typeof v === "string" ? v : null;
      }
      case "SET": {
        const nx = r.some((x) => x.toUpperCase() === "NX");
        if (nx && live(r[0]) !== undefined) return null;
        m.data.set(r[0], r[1]);
        const ex = r.findIndex((x) => x.toUpperCase() === "EX");
        if (ex > 0) m.exp.set(r[0], Date.now() + Number(r[ex + 1]) * 1000);
        else m.exp.delete(r[0]);
        return "OK";
      }
      case "DEL": {
        let n = 0;
        for (const k of r) if (m.data.delete(k)) n++;
        return n;
      }
      case "INCR": {
        const n = Number(live(r[0]) ?? 0) + 1;
        m.data.set(r[0], String(n));
        return n;
      }
      case "EXPIRE":
        if (live(r[0]) === undefined) return 0;
        m.exp.set(r[0], Date.now() + Number(r[1]) * 1000);
        return 1;
      case "SADD": {
        const s = set(r[0]);
        const before = s.size;
        r.slice(1).forEach((x) => s.add(x));
        return s.size - before;
      }
      case "SREM": {
        const s = set(r[0]);
        return r.slice(1).filter((x) => s.delete(x)).length;
      }
      case "SMEMBERS":
        return [...set(r[0])];
      case "SCARD":
        return set(r[0]).size;
      case "HSET": {
        const h = hash(r[0]);
        let n = 0;
        for (let i = 1; i + 1 < r.length; i += 2) {
          if (!h.has(r[i])) n++;
          h.set(r[i], r[i + 1]);
        }
        return n;
      }
      case "HGET":
        return hash(r[0]).get(r[1]) ?? null;
      case "HDEL": {
        const h = hash(r[0]);
        return r.slice(1).filter((x) => h.delete(x)).length;
      }
      case "HLEN":
        return hash(r[0]).size;
      case "HGETALL":
        return [...hash(r[0])].flat();
      default:
        throw new Error(`memory kv: ${c} 미지원`);
    }
  };
  return {
    kind: "memory",
    async cmd<T>(...args: Arg[]) {
      return run(args) as T;
    },
    async pipe(cmds) {
      return cmds.map(run);
    },
  };
}

let cached: KV | null | undefined;

export function getKV(): KV | null {
  if (cached !== undefined) return cached;
  const env = redisEnv();
  if (env) cached = redis(env.url, env.token);
  else if (process.env.FC_AUTH_STORE === "memory") cached = memory();
  else cached = null;
  return cached;
}

/** HGETALL 결과([k, v, k, v]) → 객체 */
export function pairs(flat: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = String(flat[i + 1]);
  else if (flat && typeof flat === "object") Object.assign(out, flat);
  return out;
}
