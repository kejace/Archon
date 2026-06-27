/**
 * Nav glyphs for the responsive shell. Inline stroke icons (24×24, 1.8 stroke,
 * `currentColor`) so they inherit the nav link's colour/active state and add no
 * network requests. Used by the mobile bottom tab bar; the desktop top nav uses
 * text labels only.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function OverviewIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.3" />
      <rect x="14" y="3" width="7" height="5" rx="1.3" />
      <rect x="14" y="12" width="7" height="9" rx="1.3" />
      <rect x="3" y="16" width="7" height="5" rx="1.3" />
    </Svg>
  );
}

export function DagIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5.5" cy="6" r="2.2" />
      <circle cx="18.5" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7 7.5 10.7 16 M17 7.5 13.3 16 M7.7 6h8.6" />
    </Svg>
  );
}

export function BlueprintIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3 3 5.4v15.6L9 18.6l6 2.4 6-2.4V3l-6 2.4z" />
      <path d="M9 3v15.6M15 5.4V21" />
    </Svg>
  );
}

export function LogsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 7l3 2.6L5 12.2" />
      <path d="M11 13h6" />
      <rect x="2.5" y="3.5" width="19" height="17" rx="2.2" />
    </Svg>
  );
}

export function DiffsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M6 8.2v7.6" />
      <path d="M18 15.8V11a4 4 0 0 0-4-4h-3.5" />
      <path d="M12.5 4.5 10 7l2.5 2.5" />
    </Svg>
  );
}

export function JournalIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 4.5A2 2 0 0 1 7 2.5h12v15H7a2 2 0 0 0-2 2z" />
      <path d="M5 19.5a2 2 0 0 0 2 2h12v-4" />
      <path d="M9 7.5h6M9 11h4" />
    </Svg>
  );
}

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  Icon: (p: IconProps) => JSX.Element;
}

/** The dashboard's primary navigation, shared by the top nav and bottom bar. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', end: true, Icon: OverviewIcon },
  { to: '/dag', label: 'DAG', Icon: DagIcon },
  { to: '/blueprint', label: 'Blueprint', Icon: BlueprintIcon },
  { to: '/logs', label: 'Logs', Icon: LogsIcon },
  { to: '/diffs', label: 'Diffs', Icon: DiffsIcon },
  { to: '/journal', label: 'Journal', Icon: JournalIcon },
];
