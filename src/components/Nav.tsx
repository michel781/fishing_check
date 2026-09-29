"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IcFish, IcHome, IcMore, IcRecord, IcSpot } from "./icons";

const ITEMS = [
  { href: "/", label: "홈", Icon: IcHome, match: (p: string) => p === "/" || p.startsWith("/best") },
  { href: "/spots", label: "낚시터", Icon: IcSpot, match: (p: string) => p.startsWith("/spots") || p.startsWith("/spot/") },
  { href: "/fish", label: "어종", Icon: IcFish, match: (p: string) => p.startsWith("/fish") },
  { href: "/log", label: "내 기록", Icon: IcRecord, match: (p: string) => p.startsWith("/log") },
  { href: "/settings", label: "더보기", Icon: IcMore, match: (p: string) => p.startsWith("/settings") || p.startsWith("/guide") },
];

export function Nav({ variant }: { variant: "mobile" | "desktop" }) {
  const path = usePathname();
  if (variant === "desktop") {
    return (
      <nav className="desk-nav" aria-label="주 메뉴">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={i.match(path) ? "page" : undefined}>{i.label}</Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="tabbar" aria-label="주 메뉴">
      <ul>
        {ITEMS.map(({ href, label, Icon, match }) => (
          <li key={href}>
            <Link href={href} aria-current={match(path) ? "page" : undefined}>
              <Icon size={24} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
