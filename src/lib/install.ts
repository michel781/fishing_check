/**
 * "홈 화면에 추가(앱처럼 쓰기)" — 브라우저마다 방법이 달라 먼저 환경을 판별한다 (순수 함수).
 *  - prompt   : 안드로이드 크롬·엣지·PC 크롬 → 버튼 한 번으로 설치 창(beforeinstallprompt)
 *  - samsung  : 삼성 인터넷 → 크롬으로 열어 설치 (삼성 인터넷이 만드는 APK 는 Play 프로텍트가 "안전하지 않은 앱"으로 차단)
 *  - ios      : 아이폰·아이패드 → 공유 버튼 → '홈 화면에 추가' 안내 (애플은 자동 설치 창을 허용하지 않음)
 *  - kakao    : 카카오톡 안 브라우저 → 설치 불가, 외부 브라우저로 열기 버튼
 *  - inapp    : 네이버·인스타그램·페이스북·라인 등 앱 안 브라우저 → 외부 브라우저로 열기 안내
 *  - firefox  : 파이어폭스(안드로이드) → 메뉴 → 설치
 */
export type InstallPlatform = "installed" | "prompt" | "samsung" | "ios" | "kakao" | "inapp" | "firefox" | "desktop" | "unknown";

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
  if (browser === "삼성 인터넷" && android) return { platform: "samsung", os, browser };
  if (android || browser === "크롬" || browser === "엣지") return { platform: os === "other" ? "desktop" : "prompt", os, browser };
  return { platform: "unknown", os, browser };
}

/** 카카오톡·다른 앱 안 브라우저에서 기본 브라우저로 여는 주소 */
export function externalOpenUrl(platform: InstallPlatform, os: string, url: string): string | null {
  if (platform === "kakao") return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
  if ((platform === "inapp" || platform === "samsung") && os === "android") {
    const u = new URL(url);
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;end`;
  }
  return null;
}

/** iOS 사파리 주 버전 (Version/26.0 → 26). 사파리 26부터 공유 버튼이 ⋯ 메뉴 안으로 들어갔다 */
export function iosSafariMajor(ua: string): number | null {
  const m = /Version\/(\d+)[.\d]* (Mobile\/\S+ )?Safari/.exec(ua);
  return m ? Number(m[1]) : null;
}

/** 아이폰 사파리에서 눌러야 할 버튼이 있는 곳 (화면에 화살표로 가리킨다) */
export function iosPointer(ua: string, browser: string, ipad: boolean): "bottom-center" | "bottom-right" | "top-right" | null {
  if (ipad || browser === "크롬" || browser === "엣지") return "top-right";
  if (browser !== "사파리") return null;
  return (iosSafariMajor(ua) ?? 0) >= 26 ? "bottom-right" : "bottom-center";
}

/** 수동으로 추가하는 방법 (설치 창을 띄울 수 없을 때) */
export function manualSteps(platform: InstallPlatform, browser: string, os: string, iosMajor: number | null = null): string[] {
  switch (platform) {
    case "ios":
      if (browser === "사파리" && (iosMajor ?? 0) >= 26)
        return [
          "화면 아래 오른쪽 ⋯ 버튼을 눌러요.",
          "'공유'를 누르고 목록에서 '홈 화면에 추가'를 눌러요.",
          "'웹 앱으로 열기'가 켜진 채로 '추가'를 누르면 끝! 홈 화면의 피싱체크 아이콘으로 열어요.",
        ];
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
    case "samsung":
      return [
        "아래 '크롬으로 열기'를 눌러요. 크롬에서 다시 '홈 화면에 추가'를 누르면 안전하게 설치돼요.",
        "크롬이 없다면: 삼성 인터넷 아래쪽 ≡ 메뉴 → '현재 페이지 추가' → '홈 화면'을 눌러 바로가기로 추가해요.",
        "이미 추가했다가 'Google Play 프로텍트 · 안전하지 않은 앱 차단됨'이 떴다면 그 아이콘을 길게 눌러 삭제한 뒤 위 방법으로 다시 추가해 주세요.",
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
