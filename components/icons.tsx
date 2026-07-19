// Line icons (no emoji) — stroke uses currentColor so callers set color via className.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const HomeIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>
);
export const CalendarIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
);
export const CartIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.2L21 8H6" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /></svg>
);
export const SearchIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
);
export const ClockIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const BackIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2}><path d="m15 5-7 7 7 7" /></svg>
);
export const HeartIcon = ({ size = 19, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 20s-7-4.5-9.2-9C1 7.5 3 4.5 6.2 4.8 8 5 12 8 12 8s4-3 5.8-3.2C21 4.5 23 7.5 21.2 11 19 15.5 12 20 12 20z" />
  </svg>
);
export const CheckIcon = ({ size = 15, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2.6}><path d="m5 13 4 4L19 7" /></svg>
);
export const PlusIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
);
export const SparkIcon = ({ size = 15, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
);
export const TrashIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
);
export const EditIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const GearIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
export const DownloadIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>
);
export const UploadIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 21V9M7 14l5-5 5 5M4 3h16" /></svg>
);
export const LockIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>
);
export const ImageIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 18 5-5 4 3 3-2 4 4" /></svg>
);
export const CloseIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p} strokeWidth={2}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
