/** 디자인 시스템 아웃라인 아이콘 (stroke = currentColor) */
type P = { size?: number; className?: string; title?: string };

function S({ size = 22, className, title, children, fill = "none" }: P & { children: React.ReactNode; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const IcHome = (p: P) => <S {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h5v-5h4v5h5V9.5" /></S>;
export const IcSpot = (p: P) => <S {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></S>;
export const IcFish = (p: P) => (
  <S {...p}>
    <path d="M3 12c2.5-4 6-6 10-6 3.5 0 6 2.5 7 6-1 3.5-3.5 6-7 6-4 0-7.5-2-10-6Z" />
    <path d="M3 12 1 8.5M3 12l-2 3.5" />
    <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
  </S>
);
export const IcRecord = (p: P) => <S {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></S>;
export const IcMore = (p: P) => <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></S>;
export const IcBack = (p: P) => <S {...p}><path d="M15 5l-7 7 7 7" /></S>;
export const IcChevron = (p: P) => <S {...p}><path d="M9 5l7 7-7 7" /></S>;
export const IcSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></S>;
export const IcBell = (p: P) => <S {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></S>;
export const IcShare = (p: P) => <S {...p}><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></S>;
export const IcHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10Z" /></S>
);
export const IcPin = (p: P) => <S {...p}><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z" /><circle cx="12" cy="11" r="2" /></S>;
export const IcMap = (p: P) => <S {...p}><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z" /><path d="M9 4v14M15 6v14" /></S>;
export const IcList = (p: P) => <S {...p}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></S>;
export const IcTide = (p: P) => <S {...p}><path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" /><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" /></S>;
export const IcWind = (p: P) => <S {...p}><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h16a3 3 0 1 1-3 3" /><path d="M3 16h8" /></S>;
export const IcWave = (p: P) => <S {...p}><path d="M2 17c3 0 4-2 6-2s3 2 6 2 4-3 4-6c-2 1-4 0-4-2s2-4 5-4c-5-1-10 2-11 8" /></S>;
export const IcThermo = (p: P) => <S {...p}><path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" /><path d="M12 9v7" /></S>;
export const IcSun = (p: P) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></S>;
export const IcMoon = (p: P) => <S {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></S>;
export const IcTarget = (p: P) => <S {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></S>;
export const IcPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IcClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></S>;
export const IcSettings = (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></S>;
export const IcRuler = (p: P) => <S {...p}><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 7v3M11 7v4M15 7v3M19 7v2" /></S>;
export const IcPalette = (p: P) => <S {...p}><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10" cy="7.5" r="1" fill="currentColor" /><circle cx="14.5" cy="7.5" r="1" fill="currentColor" /></S>;
export const IcDatabase = (p: P) => <S {...p}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></S>;
export const IcInfo = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></S>;
export const IcHelp = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" /></S>;
export const IcMail = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></S>;
export const IcReset = (p: P) => <S {...p}><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /></S>;
export const IcTrophy = (p: P) => <S {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8.5 20h7M10 17h4" /></S>;
export const IcSwap = (p: P) => <S {...p}><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></S>;
export const IcCamera = (p: P) => <S {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3.5" /></S>;
export const IcCheck = (p: P) => <S {...p}><path d="m5 12 4.5 4.5L19 7" /></S>;
export const IcCurrent = (p: P) => <S {...p}><circle cx="12" cy="12" r="8" /><path d="M8 12c1.5-2 3-2 4 0s2.5 2 4 0" /></S>;
