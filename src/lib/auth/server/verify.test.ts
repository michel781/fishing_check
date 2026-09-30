import { beforeAll, describe, expect, it } from "vitest";
import { codeMail, sendMail } from "./mail";
import { checkCode, checkProof, issueCode, verifyEnabled } from "./verify";

beforeAll(() => {
  process.env.FC_MAIL_TEST = "1";
});

describe("이메일 인증번호", () => {
  it("메일 설정이 없으면 꺼짐", () => {
    const saved = process.env.FC_MAIL_TEST;
    delete process.env.FC_MAIL_TEST;
    expect(verifyEnabled()).toBe(false);
    process.env.FC_MAIL_TEST = saved;
    expect(verifyEnabled()).toBe(true);
  });

  it("토큰에는 인증번호가 들어 있지 않다", () => {
    const { code, token } = issueCode("a@test.com", "signup");
    expect(code).toMatch(/^\d{6}$/);
    expect(Buffer.from(token.split(".")[0], "base64url").toString()).not.toContain(code);
  });

  it("맞는 번호 → 증명, 증명은 같은 이메일·용도에만", async () => {
    const { code, token } = issueCode("A@Test.com", "signup");
    const r = await checkCode(token, "a@test.com", code, "signup");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(checkProof(r.proof, "a@test.com", "signup")).toBe(true);
    expect(checkProof(r.proof, "b@test.com", "signup")).toBe(false);
    expect(checkProof(r.proof, "a@test.com", "reset")).toBe(false);
    expect(checkProof(r.proof + "x", "a@test.com", "signup")).toBe(false);
  });

  it("다른 이메일·다른 용도·위조 토큰은 거절", async () => {
    const { code, token } = issueCode("a@test.com", "signup");
    expect((await checkCode(token, "b@test.com", code, "signup")).ok).toBe(false);
    expect((await checkCode(token, "a@test.com", code, "reset")).ok).toBe(false);
    const [p] = token.split(".");
    expect((await checkCode(`${p}.forged`, "a@test.com", code, "signup")).ok).toBe(false);
  });

  it("틀린 번호는 5번까지, 그 뒤로는 맞아도 거절", async () => {
    const { code, token } = issueCode("c@test.com", "signup");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) {
      const r = await checkCode(token, "c@test.com", wrong, "signup");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.code).toBe("wrong");
    }
    const last = await checkCode(token, "c@test.com", code, "signup");
    expect(last.ok).toBe(false);
    if (!last.ok) expect(last.code).toBe("too_many");
  });

  it("테스트 메일함에 인증번호 메일이 담긴다", async () => {
    await sendMail(codeMail("d@test.com", "123456", "signup", 10));
    const box = (globalThis as { __fcOutbox?: { to: string; subject: string; html: string }[] }).__fcOutbox!;
    const m = box.at(-1)!;
    expect(m.subject).toContain("123456");
    expect(m.html).toContain("123456");
  });
});
