import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 웹 앱 매니페스트. 삼성 인터넷은 '설치'하면 자체 APK 를 만들어 주는데, 이 APK 가 옛 안드로이드 기준이라
 * Google Play 프로텍트가 "안전하지 않은 앱 차단됨"으로 막는다. 그래서 삼성 인터넷에는 설치형(standalone) 대신
 * display: "browser" 를 줘서 APK 가 아닌 일반 홈 화면 바로가기로 추가되게 한다.
 * (크롬은 구글이 서명한 WebAPK 를 만들어 차단되지 않음 → 그대로 설치형)
 */
const MANIFEST = {
  "id": "/",
  "name": "피싱체크 — 바다낚시 출조 타이밍",
  "short_name": "피싱체크",
  "description": "전국 바다낚시 물때·황금타임·포인트 추천",
  "start_url": "/?source=homescreen",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f3f7fc",
  "theme_color": "#0b3d91",
  "lang": "ko",
  "categories": [
    "sports",
    "weather",
    "travel"
  ],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "가장 잘 잡히는 포인트",
      "short_name": "베스트",
      "url": "/best",
      "icons": [
        {
          "src": "/icon-192.png",
          "sizes": "192x192"
        }
      ]
    },
    {
      "name": "포인트 찾기",
      "short_name": "낚시터",
      "url": "/spots",
      "icons": [
        {
          "src": "/icon-192.png",
          "sizes": "192x192"
        }
      ]
    },
    {
      "name": "조황 기록",
      "short_name": "내 기록",
      "url": "/log",
      "icons": [
        {
          "src": "/icon-192.png",
          "sizes": "192x192"
        }
      ]
    }
  ]
};

export function GET(req: NextRequest) {
  const samsung = /SamsungBrowser/i.test(req.headers.get("user-agent") ?? "");
  const body = samsung ? { ...MANIFEST, display: "browser", shortcuts: undefined } : MANIFEST;
  return NextResponse.json(body, {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      // 브라우저마다 내용이 달라 공용 캐시(CDN)에 하나로 저장되면 안 된다
      "cache-control": "private, max-age=3600",
      vary: "User-Agent",
    },
  });
}
