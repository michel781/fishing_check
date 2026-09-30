import { describe, expect, it } from "vitest";
import { detectInstall, externalOpenUrl, iosPointer, iosSafariMajor, manualSteps } from "./install";

const UA = {
  androidChrome: "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
  samsung: "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  kakaoAndroid: "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36;KAKAOTALK 2410370",
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0 Mobile/15E148 Safari/604.1",
  ipadDesktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  naverIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.6.1)",
  instagram: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36 Instagram 300.0",
  pcChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  firefoxAndroid: "Mozilla/5.0 (Android 14; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0",
};

describe("홈 화면 추가 — 환경 판별", () => {
  it.each([
    ["androidChrome", "prompt", "크롬"],
    ["samsung", "prompt", "삼성 인터넷"],
    ["kakaoAndroid", "kakao", "카카오톡"],
    ["iphoneSafari", "ios", "사파리"],
    ["iphoneChrome", "ios", "크롬"],
    ["naverIos", "inapp", "네이버"],
    ["instagram", "inapp", "인스타그램"],
    ["pcChrome", "desktop", "크롬"],
    ["firefoxAndroid", "firefox", "파이어폭스"],
  ] as const)("%s → %s", (k, platform, browser) => {
    expect(detectInstall({ ua: UA[k], standalone: false })).toMatchObject({ platform, browser });
  });
  it("아이패드 데스크톱 모드는 iOS 로", () => {
    expect(detectInstall({ ua: UA.ipadDesktop, standalone: false, maxTouchPoints: 5 }).platform).toBe("ios");
  });
  it("이미 홈 화면 앱으로 열었으면 installed", () => {
    expect(detectInstall({ ua: UA.androidChrome, standalone: true }).platform).toBe("installed");
  });
  it("카카오톡·안드로이드 앱 안 브라우저는 외부로 여는 주소", () => {
    expect(externalOpenUrl("kakao", "android", "https://fishing-check.vercel.app/")).toBe("kakaotalk://web/openExternal?url=https%3A%2F%2Ffishing-check.vercel.app%2F");
    expect(externalOpenUrl("inapp", "android", "https://fishing-check.vercel.app/?a=1")).toBe("intent://fishing-check.vercel.app/?a=1#Intent;scheme=https;package=com.android.chrome;end");
    expect(externalOpenUrl("ios", "ios", "https://x.y/")).toBeNull();
  });
  it("수동 안내 문구", () => {
    expect(manualSteps("ios", "사파리", "ios")[1]).toMatch(/홈 화면에 추가/);
    expect(manualSteps("prompt", "삼성 인터넷", "android")[1]).toMatch(/현재 페이지 추가/);
  });
});

describe("아이폰 버튼 위치 안내", () => {
  const ios18 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
  const ios26 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
  it("사파리 버전", () => {
    expect(iosSafariMajor(ios18)).toBe(18);
    expect(iosSafariMajor(ios26)).toBe(26);
  });
  it("사파리 26부터는 ⋯ 메뉴(오른쪽 아래)", () => {
    expect(iosPointer(ios18, "사파리", false)).toBe("bottom-center");
    expect(iosPointer(ios26, "사파리", false)).toBe("bottom-right");
    expect(iosPointer(ios26, "사파리", true)).toBe("top-right");
    expect(manualSteps("ios", "사파리", "ios", 26)[0]).toMatch(/⋯/);
    expect(manualSteps("ios", "사파리", "ios", 18)[0]).toMatch(/공유 버튼/);
  });
});
