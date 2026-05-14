import type { CSSProperties } from 'react';

type Screen = 'auth' | 'welcome';

interface OrbsBackgroundProps {
  accent?: string;
  screen?: Screen;
}

interface Palette {
  c1: string;
  c2: string;
  c3: string;
}

// Derive three complementary HSL stops from a hex accent. Ported from backgrounds.jsx.
function palette(accentHex: string): Palette {
  const hex = accentHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  const hsl = (hh: number, ss: number, ll: number, a = 1) =>
    `hsla(${(hh + 360) % 360}, ${Math.min(100, ss * 100)}%, ${ll * 100}%, ${a})`;
  return {
    c1: hsl(h, 0.8, 0.55),
    c2: hsl(h + 60, 0.75, 0.55),
    c3: hsl(h - 50, 0.8, 0.5),
  };
}

interface Orb {
  left: string;
  size: number; // rem
  durSec: number;
  delaySec: number;
  dx: string;
  welcomeOnly?: boolean;
}

// Sizes are rem (px / 16). Always-on orbs first, welcome-only orbs after.
// Order matters: background.css's nth-of-type rules drop the third + fifth always-on
// at mobile breakpoints to halve GPU cost.
const ORBS: Orb[] = [
  { left: '12%', size: 8.75, durSec: 18, delaySec: 0, dx: '4%' },
  { left: '28%', size: 5, durSec: 22, delaySec: 3, dx: '-3%' },
  { left: '46%', size: 12.5, durSec: 28, delaySec: 1, dx: '2%' },
  { left: '62%', size: 6.875, durSec: 20, delaySec: 5, dx: '-2%' },
  { left: '78%', size: 10, durSec: 26, delaySec: 2, dx: '5%' },
  { left: '88%', size: 5.625, durSec: 24, delaySec: 4, dx: '-4%' },
  { left: '20%', size: 3.75, durSec: 10, delaySec: 0, dx: '8%', welcomeOnly: true },
  { left: '40%', size: 3.125, durSec: 11, delaySec: 1, dx: '-6%', welcomeOnly: true },
  { left: '70%', size: 4.375, durSec: 13, delaySec: 2, dx: '4%', welcomeOnly: true },
  { left: '55%', size: 2.5, durSec: 9, delaySec: 0.5, dx: '-3%', welcomeOnly: true },
];

export function OrbsBackground({ accent = '#22d3a8', screen = 'auth' }: OrbsBackgroundProps) {
  const p = palette(accent);
  const rootStyle = {
    '--c1': p.c1,
    '--c2': p.c2,
    '--c3': p.c3,
  } as CSSProperties;

  return (
    <div className="bg-root bg-orbs" data-state={screen} style={rootStyle} aria-hidden="true">
      <div className="vignette" />
      <div className="grid" />
      {ORBS.map((o, i) => (
        <div
          key={i}
          className={`orb${o.welcomeOnly ? ' welcome-only' : ''}`}
          style={{
            left: o.left,
            bottom: '-10%',
            width: `${o.size}rem`,
            height: `${o.size}rem`,
            ['--c3' as string]: p.c3,
            ['--dx' as string]: o.dx,
            animation: `orbRise ${o.durSec}s linear ${o.delaySec}s infinite`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
