/** 배포 주소 (카카오톡·SNS 공유 미리보기의 절대 주소에 쓰임) */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fishing-check.vercel.app";

/** 공유 썸네일 (1200×630, 카카오톡 권장 비율 1.91:1) */
export const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: "피싱체크 — 언제, 어디서, 무엇을 낚을까" };

/** 하위 페이지 openGraph 에 썸네일을 같이 넣기 위한 헬퍼 (Next 는 openGraph 를 통째로 덮어씀) */
export function og(title: string, description: string, url: string) {
  return {
    openGraph: { type: "website" as const, siteName: "피싱체크", locale: "ko_KR", title, description, url, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image" as const, title, description, images: [OG_IMAGE.url] },
  };
}
