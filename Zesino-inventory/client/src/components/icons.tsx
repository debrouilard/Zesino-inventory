import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: 20,
    height: 20,
    ...props,
  };
}

export const IconReports = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
  </svg>
);
export const IconInventory = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M21 8H3l2-4h14l2 4Z" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </svg>
);
export const IconPos = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M8 21h8M9 8h6M9 12h4" />
  </svg>
);
export const IconReconciliation = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M8 7h11M8 12h11M8 17h7" />
    <path d="M4 7h.01M4 12h.01M4 17h.01" />
  </svg>
);
export const IconCredit = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>
);
export const IconCustomer = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 19c1.2-3 3.5-4.5 7-4.5S17.8 16 19 19" />
  </svg>
);
export const IconBell = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M8 3.5V7M16 3.5V7M3.5 10h17" />
  </svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
);
export const IconHelp = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4 1-1.4 1.9V14.5M12 17.2h.01" />
  </svg>
);
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M5 12.5 10 17.5 19 7.5" />
  </svg>
);
export const IconAlert = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.2h.01" />
  </svg>
);
export const IconBox = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M12 3 21 8v8l-9 5-9-5V8l9-5Z" />
    <path d="M12 12 21 8M12 12v9M12 12 3 8" />
  </svg>
);
export const IconEmptyChart = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 24 24">
    <path d="M4 19h16" />
    <path d="M7 16v-3M12 16V8M17 16v-6" />
  </svg>
);
export const LogoMark = () => (
  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-[0_8px_16px_rgba(59,109,255,.35)]">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="10" width="3.2" height="6" rx="1" fill="white" />
      <rect x="7.4" y="6" width="3.2" height="10" rx="1" fill="white" />
      <rect x="12.8" y="3" width="3.2" height="13" rx="1" fill="white" />
    </svg>
  </span>
);
