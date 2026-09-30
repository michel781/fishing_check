import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AccountLink } from "@/components/auth/AccountLink";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SWRegister } from "@/components/SWRegister";
import { OG_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION = "바다낚시 출조 타이밍을 한눈에. 물때·바람·파도·수온·포인트·어종 습성으로 언제, 어디서, 무엇을 낚을지 알려드려요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "피싱체크 — 언제, 어디서, 무엇을 낚을까", template: "%s · 피싱체크" },
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: "피싱체크",
  appleWebApp: { capable: true, title: "피싱체크", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "피싱체크",
    locale: "ko_KR",
    title: "피싱체크 — 언제, 어디서, 무엇을 낚을까",
    description: DESCRIPTION,
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b3d91",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = (await cookies()).get("theme")?.value;
  const theme = t === "dark" || t === "auto" ? t : "light";
  return (
    <html lang="ko" data-theme={theme} suppressHydrationWarning>
      <head>
        {theme === "auto" && (
          // 자동: 기기 설정(다크 모드)에 맞춰 첫 화면 그리기 전에 적용
          <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}` }} />
        )}
      </head>
      <body>
        <a className="skip" href="#main">본문 바로가기</a>
        <AuthProvider>
          <header className="topbar">
            <div className="container">
              <Link href="/" className="brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" width={30} height={30} />
                피싱<span>체크</span>
              </Link>
              <div className="spacer" />
              <Nav variant="desktop" />
              <Link href="/guide" className="btn small" aria-label="용어·도움말">? 도움말</Link>
              <AccountLink />
              <Link href="/settings" className="icon-btn" aria-label="설정">⚙️</Link>
            </div>
          </header>
          <main id="main" className="container">{children}</main>
          <Nav variant="mobile" />
        </AuthProvider>
        <SWRegister />
      </body>
    </html>
  );
}
