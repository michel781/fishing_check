import { beforeAll, describe, expect, it } from "vitest";
import { validateTip } from "../tips";
import {
  addTip,
  changePassword,
  createSession,
  deleteTip,
  deleteUser,
  endOtherSessions,
  endSession,
  getUser,
  hashPassword,
  listTips,
  loadData,
  rateLimit,
  sessionUser,
  signIn,
  signUp,
  updateFavs,
  updateLogs,
  verifyPassword,
} from "./accounts";
import { getKV, type KV } from "./store";

let kv: KV;
beforeAll(() => {
  process.env.FC_AUTH_STORE = "memory";
  kv = getKV()!;
});

const input = (email: string) => ({ email, password: "fish1234", nickname: "우럭왕", agree: true });

describe("자체 회원 기능", () => {
  it("비밀번호는 해시로만 저장되고 검증된다", async () => {
    const h = await hashPassword("fish1234");
    expect(h).not.toContain("fish1234");
    expect(await verifyPassword("fish1234", h)).toBe(true);
    expect(await verifyPassword("fish12345", h)).toBe(false);
    expect(await hashPassword("fish1234")).not.toBe(h); // 소금이 매번 다름
  });

  it("가입 → 로그인, 같은 이메일(대소문자 무시) 중복 가입 불가", async () => {
    const u = await signUp(kv, input("A@Test.com"));
    expect(u.nickname).toBe("우럭왕");
    await expect(signUp(kv, input("a@test.com"))).rejects.toMatchObject({ code: "user_already_exists" });
    expect((await signIn(kv, "a@test.com", "fish1234")).id).toBe(u.id);
    await expect(signIn(kv, "a@test.com", "wrong1234")).rejects.toMatchObject({ code: "invalid_credentials" });
    await expect(signIn(kv, "none@test.com", "fish1234")).rejects.toMatchObject({ code: "invalid_credentials" });
  });

  it("입력 검사와 필수 동의", async () => {
    await expect(signUp(kv, { ...input("b@test.com"), password: "short" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(signUp(kv, { ...input("b@test.com"), nickname: "a" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(signUp(kv, { ...input("b@test.com"), agree: false })).rejects.toMatchObject({ code: "invalid_input" });
    // 실패한 가입은 이메일 자리를 잡지 않는다
    await expect(signUp(kv, input("b@test.com"))).resolves.toBeTruthy();
  });

  it("세션: 만들기 → 확인 → 종료, 비밀번호 변경 시 다른 기기 로그아웃", async () => {
    const u = await signUp(kv, input("s@test.com"));
    const t1 = await createSession(kv, u.id);
    const t2 = await createSession(kv, u.id);
    expect((await sessionUser(kv, t1))?.id).toBe(u.id);
    expect(await sessionUser(kv, "garbage")).toBeNull();
    await changePassword(kv, u, "fish1234", "newpass99");
    await endOtherSessions(kv, u.id, t1);
    expect(await sessionUser(kv, t1)).not.toBeNull();
    expect(await sessionUser(kv, t2)).toBeNull();
    await expect(signIn(kv, "s@test.com", "fish1234")).rejects.toBeTruthy();
    await signIn(kv, "s@test.com", "newpass99");
    await endSession(kv, t1);
    expect(await sessionUser(kv, t1)).toBeNull();
  });

  it("즐겨찾기·조과 기록 저장과 탈퇴 시 전부 삭제", async () => {
    const u = await signUp(kv, input("d@test.com"));
    const t = await createSession(kv, u.id);
    await updateFavs(kv, u.id, ["sinjin-outer", "bad id!"], []);
    await updateLogs(kv, u.id, [{ id: "l1", spotId: "sinjin-outer", count: 3 }], []);
    let d = await loadData(kv, u.id);
    expect(d.favs).toEqual(["sinjin-outer"]);
    expect(d.logs).toHaveLength(1);
    await updateFavs(kv, u.id, [], ["sinjin-outer"]);
    await updateLogs(kv, u.id, [], ["l1"]);
    d = await loadData(kv, u.id);
    expect(d).toEqual({ favs: [], logs: [] });
    await updateFavs(kv, u.id, ["x"], []);
    await deleteUser(kv, (await getUser(kv, u.id))!);
    expect(await getUser(kv, u.id)).toBeNull();
    expect(await sessionUser(kv, t)).toBeNull();
    expect((await loadData(kv, u.id)).favs).toEqual([]);
    // 같은 이메일로 다시 가입할 수 있다
    await expect(signUp(kv, input("d@test.com"))).resolves.toBeTruthy();
  });

  it("사장님 조황: 올리기·목록·본인만 삭제", async () => {
    const a = await signUp(kv, input("t1@test.com"));
    const b = await signUp(kv, input("t2@test.com"));
    const today = new Date().toISOString().slice(0, 10);
    const tip = await addTip(kv, a, { spot_id: "sinjin-outer", shop_name: "신진도낚시", content: "해질녘 들물에 우럭 잘 나와요", heard_on: today, species: ["rockfish"] }, validateTip);
    await expect(addTip(kv, a, { spot_id: "sinjin-outer", shop_name: "", content: "짧", heard_on: today }, validateTip)).rejects.toMatchObject({ code: "invalid_input" });
    expect(await listTips(kv, "sinjin-outer", "2000-01-01")).toHaveLength(1);
    await expect(deleteTip(kv, b, "sinjin-outer", tip.id)).rejects.toMatchObject({ code: "forbidden" });
    await deleteTip(kv, a, "sinjin-outer", tip.id);
    expect(await listTips(kv, "sinjin-outer", "2000-01-01")).toHaveLength(0);
  });

  it("요청 횟수 제한", async () => {
    for (let i = 0; i < 3; i++) await rateLimit(kv, "test", 3, 60);
    await expect(rateLimit(kv, "test", 3, 60)).rejects.toMatchObject({ status: 429 });
  });
});
