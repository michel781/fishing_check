import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SWRegister } from "@/components/SWRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "피싱체크 — 바다낚시 출조 타이밍", template: "%s · 피싱체크" },
  description: "서해·동해 바다낚시 출조 결정 엔진. 물때·만조/간조·바람·파도·수온·포인트·어종 습성으로 골든타임을 알려드립니다.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "피싱체크", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121211",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await cookies()).get("theme")?.value === "light" ? "light" : "dark";
  return (
    <html lang="ko" data-theme={theme}>
      <body>
        <a className="skip" href="#main">본문 바로가기</a>
        <header className="topbar">
          <div className="container">
            <Link href="/" className="brand">피싱<span>체크</span></Link>
            <div className="spacer" />
            <Nav variant="desktop" />
            <Link href="/guide" className="btn small" aria-label="용어·도움말">? 도움말</Link>
          </div>
        </header>
        <main id="main" className="container">{children}</main>
        <Nav variant="mobile" />
        <SWRegister />
      </body>
    </html>
  );
}
