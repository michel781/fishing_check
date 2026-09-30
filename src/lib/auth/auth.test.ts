import { describe, expect, it } from "vitest";
import { mergeData, type LogEntry } from "@/lib/localStore";
import { authErrorMessage, safeNext, validateEmail, validateNickname, validatePassword } from "./validate";

const log = (id: string, time: string): LogEntry => ({
  id, spotId: "sinjin-outer", speciesId: "rockfish", time, count: 1, maxCm: null, memo: "", predicted: null,
});

describe("회원가입 입력 검사", () => {
  it("이메일", () => {
    expect(validateEmail("")).toMatch(/입력/);
    expect(validateEmail("fish@")).toMatch(/형식/);
    expect(validateEmail(" fish@example.com ")).toBeNull();
  });
  it("비밀번호: 8자 이상, 영문+숫자", () => {
    expect(validatePassword("abc123")).toMatch(/8자/);
    expect(validatePassword("abcdefgh")).toMatch(/영문과 숫자/);
    expect(validatePassword("12345678")).toMatch(/영문과 숫자/);
    expect(validatePassword("gofish2026")).toBeNull();
  });
  it("닉네임: 2~12자 한글·영문·숫자", () => {
    expect(validateNickname("a")).toMatch(/2~12/);
    expect(validateNickname("우럭왕")).toBeNull();
    expect(validateNickname("우럭 왕")).toMatch(/한글/);
    expect(validateNickname("가".repeat(13))).toMatch(/2~12/);
  });
});

describe("로그인 후 이동 주소", () => {
  it("사이트 안 경로만 허용", () => {
    expect(safeNext("/log")).toBe("/log");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext("/login")).toBe("/account");
    expect(safeNext(null, "/")).toBe("/");
  });
});

describe("오류 문구", () => {
  it("코드·메시지를 한국어로", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toMatch(/맞지 않아요/);
    expect(authErrorMessage({ message: "Email not confirmed" })).toMatch(/메일 인증/);
    expect(authErrorMessage({ message: "Failed to fetch" })).toMatch(/인터넷/);
    expect(authErrorMessage({ message: "something odd" })).toMatch(/처리하지 못했어요/);
  });
});

describe("기기 ↔ 계정 데이터 합치기", () => {
  const local = { favs: ["a", "b"], logs: [log("1", "2026-09-01T00:00:00Z"), log("2", "2026-09-03T00:00:00Z")] };
  const server = { favs: ["b", "c"], logs: [log("2", "2026-09-03T00:00:00Z"), log("3", "2026-09-02T00:00:00Z")] };
  it("같은 계정(또는 주인 없는 기기): 합치고 없는 것만 올린다", () => {
    const m = mergeData(local, server, true);
    expect(m.favs.sort()).toEqual(["a", "b", "c"]);
    expect(m.uploadFavs).toEqual(["a"]);
    expect(m.uploadLogs.map((l) => l.id)).toEqual(["1"]);
    expect(m.logs.map((l) => l.id)).toEqual(["2", "3", "1"]); // 최신순
  });
  it("다른 계정이 쓰던 기기: 섞지 않고 이 계정 데이터로 바꾼다", () => {
    const m = mergeData(local, server, false);
    expect(m.favs).toEqual(["b", "c"]);
    expect(m.uploadFavs).toEqual([]);
    expect(m.uploadLogs).toEqual([]);
    expect(m.logs.map((l) => l.id)).toEqual(["2", "3"]);
  });
});
