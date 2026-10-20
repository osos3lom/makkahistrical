/** Thin-line editorial SVG icon set for the Empire Atlas.
 *  Consistent 1.5px strokes, warm slate or currentColor. */
import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const TempleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3L21 8.5H3L12 3Z" fill="currentColor" stroke="none" />
    <path d="M5 10.5V18M9.3 10.5V18M13.6 10.5V18M17.9 10.5V18" />
    <path d="M3 19.5H21" />
  </svg>
);
export const CompassIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
  </svg>
);
export const EmpiresIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 21h18M5 21V8l7-5 7 5v13" />
    <path d="M9 21v-6h6v6" />
  </svg>
);
export const LessonsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 19.5V5.5A2.5 2.5 0 016.5 3H20v15.5H6.5a2.5 2.5 0 00-2.5 2.5z" />
    <path d="M4 19.5A2.5 2.5 0 016.5 22H20" />
  </svg>
);
export const LibraryIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 4v16M9 4v16" />
    <path d="M13 5.5l4-1 4 14-4 1z" />
  </svg>
);
export const NotesIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
    <path d="M9 8h6M9 12h6M9 16h3.5" />
  </svg>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20.5 20.5L16 16" />
  </svg>
);
export const RotateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M20 12a8 8 0 11-2.34-5.66" />
    <path d="M20 3v4h-4" transform="translate(-2.4,0)" />
  </svg>
);
export const ZoomInIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M10.5 7.5v6M7.5 10.5h6" />
    <path d="M15.4 15.4L20.5 20.5" />
  </svg>
);
export const ZoomOutIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M7.5 10.5h6" />
    <path d="M15.4 15.4L20.5 20.5" />
  </svg>
);
export const PanIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3v18M3 12h18" />
    <path d="M8.5 6L12 2.5 15.5 6M8.5 18L12 21.5 15.5 18M6 8.5L2.5 12 6 15.5M18 8.5L21.5 12 18 15.5" />
  </svg>
);
export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);
export const VaseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M9.5 3h5M10.5 3c0 2.5-2.5 3.5-2.5 6.5 0 2 .8 3.2 1.6 4.2.7.9.9 1.6.9 2.8 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.2.2-1.9.9-2.8.8-1 1.6-2.2 1.6-4.2 0-3-2.5-4-2.5-6.5" />
  </svg>
);
export const TimelineIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);
export const ResetIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    {/* counter-clockwise arrow, its head seated on the end of the arc */}
    <path d="M3.5 11.5a8.5 8.5 0 1 1 2.5 6" />
    <path d="M3.5 6.5v5h5" />
  </svg>
);
export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </svg>
);
export const HeartIcon = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-9.3-9C1.4 7.6 3.4 4.5 6.7 4.5c2 0 3.7 1.1 4.6 2.7.9-1.6 2.6-2.7 4.6-2.7 3.3 0 5.3 3.1 4 6.5-1.8 4.4-7.9 9-7.9 9z" />
  </svg>
);
export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);
export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M7 5l12 7-12 7V5z" />
  </svg>
);
export const QuizIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 113.6 2.24c-.8.36-1.1.9-1.1 1.76" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const LaurelIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} strokeWidth={1.2}>
    <path d="M7 19c-2.5-2-3.5-5-2.8-9M7 19c2.5-1 4-3 4.2-6" />
    <path d="M4.2 10c1.4.4 2.8-.2 3.6-1.4M5.3 13.6c1.5.2 2.8-.6 3.4-1.9M6.4 16.8c1.4 0 2.5-.9 2.9-2.2" />
  </svg>
);
export const BulbIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M9.5 18h5M10.5 21h3" />
    <path d="M12 3a6 6 0 00-3.3 11c.6.5 1 1.2 1 2h4.6c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
  </svg>
);
export const HandIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M8 11V5.5a1.5 1.5 0 013 0V10M11 10V4.5a1.5 1.5 0 013 0V10M14 10V6a1.5 1.5 0 013 0v7" />
    <path d="M17 13l1.8-2.2a1.4 1.4 0 012.1 1.8L18 17c-1.2 2.6-3.5 4-6.5 4S6 19.4 5 17l-1.5-4c-.4-1 .9-2 1.9-1.4L8 13" />
  </svg>
);
export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 0113 0C18.5 15.3 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
);
export const PeriodIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3 1.8" />
  </svg>
);
export const MaterialsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 7l8-4 8 4-8 4-8-4z" />
    <path d="M4 12l8 4 8-4M4 17l8 4 8-4" />
  </svg>
);
export const FeatureIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 21h18M6 21V10l6-6 6 6v11" />
    <path d="M10 21v-5h4v5" />
  </svg>
);
export const OccupantsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M15.5 5.6a3 3 0 010 5.8M17.5 15.5c1.7.7 3 2.2 3 4.5" />
  </svg>
);
export const BookmarkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M7 3.5h10V21l-5-3.5L7 21V3.5z" />
  </svg>
);
export const MoreIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </svg>
);
export const ChevronDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </svg>
);
export const GridIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <path d="M4 12h16M12 4v16" />
  </svg>
);
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const WireIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9" />
  </svg>
);
export const XrayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2.5" />
    <path d="M12 7.5v9M7.5 12h9" />
  </svg>
);
