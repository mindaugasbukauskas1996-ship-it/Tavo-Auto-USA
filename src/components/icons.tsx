// Paprastos linijinės ikonos (24×24, stroke = currentColor)
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p,
});

export const IconPhone = (p: P) => (
  <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
);
export const IconMail = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const IconHelp = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconGauge = (p: P) => (
  <svg {...base(p)}><path d="M4 15a8 8 0 1 1 16 0" /><path d="m12 15 4-5" /><path d="M4 15h2M18 15h2M12 7V5" /></svg>
);
export const IconGear = (p: P) => (
  <svg {...base(p)}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><path d="M6 8v8M18 8v3H6" /></svg>
);
export const IconFuel = (p: P) => (
  <svg {...base(p)}><path d="M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M3 20h12M4 10h10" /><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3" /></svg>
);
export const IconCar = (p: P) => (
  <svg {...base(p)}><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v3H3zM5 11h14" /><circle cx="7.5" cy="13.5" r=".5" /><circle cx="16.5" cy="13.5" r=".5" /></svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconCalc = (p: P) => (
  <svg {...base(p)}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h4" /></svg>
);
export const IconFilter = (p: P) => (
  <svg {...base(p)}><path d="M4 5h16l-6 7v6l-4 2v-8Z" /></svg>
);
export const IconWallet = (p: P) => (
  <svg {...base(p)}><path d="M4 7a2 2 0 0 1 2-2h11v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 13.5h.01" /></svg>
);
export const IconShip = (p: P) => (
  <svg {...base(p)}><path d="M3 17c1.5 1.5 3 2 4.5 2S10.5 18 12 17c1.5 1 3 2 4.5 2s3-.5 4.5-2" /><path d="M5 15 4 11h16l-1 4M7 11V7h10v4M12 4v3" /></svg>
);
export const IconDoc = (p: P) => (
  <svg {...base(p)}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></svg>
);
export const IconGavel = (p: P) => (
  <svg {...base(p)}><path d="m14 4 6 6M11 7l6 6M12.5 5.5l-6 6 3 3 6-6M8 13l-5 5 2 2 5-5M4 21h9" /></svg>
);
