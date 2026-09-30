/**
 * "홈 화면에 추가(앱처럼 쓰기)" — 브라우저마다 방법이 달라 먼저 환경을 판별한다 (순수 함수).
 *  - prompt   : 안드로이드 크롬·삼성인터넷·엣지·PC 크롬 → 버튼 한 번으로 설치 창(beforeinstallprompt)
 *  - ios      : 아이폰·아이패드 → 공유 버튼 → '홈 화면에 추가' 안내 (애플은 자동 설치 창을 허용하지 않음)
 *  - kakao    : 카카오톡 안 브라우저 → 설치 불가, 외부 브라우저로 열기 버튼
 *  - inapp    : 네이버·인스타그램·페이스북·라인 등 앱 안 브라우저 → 외부 브라우저로 열기 안내
 *  - firefox  : 파이어폭스(안드로이드) → 메뉴 → 설치
 */
export type InstallPlatform = "installed" | "prompt" | "ios" | "kakao" | "inapp" | "firefox" | "desktop" | "unknown";

export interface InstallEnv {
  ua: string;
  standalone: boolean;
  /** 아이패드(데스크톱 모드)는 UA 가 맥으로 보이므로 터치 여부로 구분 */
  maxTouchPoints?: number;
}

export function detectInstall(env: InstallEnv): { platform: InstallPlatform; os: "ios" | "android" | "other"; browser: string } {
  const ua = env.ua;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (env.maxTouchPoints ?? 0) > 1);
  const android = /Android/i.test(ua);
  const os = ios ? "ios" : android ? "android" : "other";
  const browser = /KAKAOTALK/i.test(ua)
    ? "카카오톡"
    : /NAVER\(inapp|; NAVER|Whale\/.*NAVER/i.test(ua)
      ? "네이버"
      : /Instagram/i.test(ua)
        ? "인스타그램"
        : /FBAN|FBAV/i.test(ua)
          ? "페이스북"
          : /Line\//i.test(ua)
            ? "라인"
            : /SamsungBrowser/i.test(ua)
              ? "삼성 인터넷"
              : /Firefox|FxiOS/i.test(ua)
                ? "파이어폭스"
                : /EdgA|EdgiOS|Edg\//i.test(ua)
                  ? "엣지"
                  : /CriOS|Chrome/i.test(ua)
                    ? "크롬"
                    : /Safari/i.test(ua)
                      ? "사파리"
                      : "브라우저";

  if (env.standalone) return { platform: "installed", os, browser };
  if (browser === "카카오톡") return { platform: "kakao", os, browser };
  if (["네이버", "인스타그램", "페이스북", "라인"].includes(browser)) return { platform: "inapp", os, browser };
  if (ios) return { platform: "ios", os, browser };
  if (browser === "파이어폭스") return { platform: "firefox", os, browser };
  if (android || browser === "크롬" || browser === "엣지") return { platform: os === "other" ? "desktop" : "prompt", os, browser };
  return { platform: "unknown", os, browser };
}

/** 카카오톡·다른 앱 안 브라우저에서 기본 브라우저로 여는 주소 */
export function externalOpenUrl(platform: InstallPlatform, os: string, url: string): string | null {
  if (platform === "kakao") return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
  if (platform === "inapp" && os === "android") {
    const u = new URL(url);
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;end`;
  }
  return null;
}

/** 수동으로 추가하는 방법 (설치 창을 띄울 수 없을 때) */
export function manualSteps(platform: InstallPlatform, browser: string, os: string): string[] {
  switch (platform) {
    case "ios":
      return [
        browser === "사파리" ? "화면 아래(또는 위) 공유 버튼(네모에 위쪽 화살표 ⬆︎)을 눌러요." : `${browser} 메뉴에서 공유 버튼(⬆︎)을 눌러요. 안 보이면 사파리로 열어 주세요.`,
        "목록을 올려 '홈 화면에 추가'를 눌러요.",
        "오른쪽 위 '추가'를 누르면 끝! 홈 화면의 피싱체크 아이콘으로 열어요.",
      ];
    case "kakao":
    case "inapp":
      return [
        `${browser} 안에서는 홈 화면 추가가 안 돼요.`,
        os === "ios" ? "오른쪽 아래(또는 위) ⋯ 메뉴 → '사파리로 열기' 또는 '다른 브라우저로 열기'를 눌러요." : "오른쪽 위 ⋮ 메뉴 → '다른 브라우저로 열기'를 눌러요.",
        "열린 브라우저에서 다시 '홈 화면에 추가'를 눌러 주세요.",
      ];
    case "firefox":
      return ["오른쪽 위(또는 아래) ⋮ 메뉴를 눌러요.", "'설치' 또는 '홈 화면에 추가'를 눌러요."];
    case "desktop":
      return ["주소창 오른쪽의 설치 아이콘(⊕ 또는 모니터 모양)을 눌러요.", "또는 ⋮ 메뉴 → '피싱체크 설치'를 눌러요."];
    default:
      return browser === "삼성 인터넷"
        ? ["아래쪽 ≡ 메뉴를 눌러요.", "'현재 페이지 추가' → '홈 화면'을 눌러요."]
        : ["오른쪽 위 ⋮ 메뉴를 눌러요.", "'홈 화면에 추가' 또는 '앱 설치'를 눌러요.", "'설치(추가)'를 누르면 홈 화면에 아이콘이 생겨요."];
  }
}
