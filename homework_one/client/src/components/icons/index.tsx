import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="1.5" y="3" width="13" height="10" rx="2" />
      <path d="m2 4 6 5 6-5" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3.5 13 12.5" />
      <path d="M4.7 4.8C2.5 6.2 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1.2 0 2.3-.3 3.2-.7" />
      <path d="M14.5 8s-1-1.8-3.2-3.2" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

export function TickIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export function WarnIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 5v3.5" />
      <circle cx="8" cy="11" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CapsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 8 4-4 4 4" />
      <path d="M6 8h4v3H6z" />
      <path d="M4 13.5h8" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8h10" />
      <path d="m9 4 4 4-4 4" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  // Used inline only when the .spinner CSS class can't be applied; the CSS-driven spinner is preferred.
  return (
    <svg {...base} {...props}>
      <path d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5" />
    </svg>
  );
}
