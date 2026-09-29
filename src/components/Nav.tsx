"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈", ico: "🏠" },
  { href: "/spots", label: "낚시터", ico: "📍" },
  { href: "/fish", label: "물고기", ico: "🐟" },
  { href: "/log", label: "내 기록", ico: "📝" },
  { href: "/settings", label: "설정", ico: "⚙️" },
];

export function Nav({ variant }: { variant: "mobile" | "desktop" }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href) || (href === "/spots" && path.startsWith("/spot/"));
  if (variant === "desktop") {
    return (
      <nav className="desk-nav" aria-label="주 메뉴">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}>{i.label}</Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="tabbar" aria-label="주 메뉴">
      <ul>
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={active(i.href) ? "page" : undefined}>
              <span className="ico" aria-hidden>{i.ico}</span>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
