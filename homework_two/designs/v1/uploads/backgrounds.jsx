// backgrounds.jsx — three animated dark backgrounds for the auth prototype.
// All take { accent, intensity, screen } where screen is 'auth' | 'welcome'.

const __BG_STYLE = `
.bg-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 0%, #10151c 0%, #06080b 60%, #04060a 100%)}

/* ─── AURORA ─── */
.bg-aurora .blob{position:absolute;border-radius:50%;filter:blur(80px);
  mix-blend-mode:screen;opacity:.55;will-change:transform}
.bg-aurora .b1{width:62%;aspect-ratio:1;left:-12%;top:-18%;
  background:radial-gradient(circle,var(--c1) 0%,transparent 65%);
  animation:auroraDrift1 22s ease-in-out infinite alternate}
.bg-aurora .b2{width:54%;aspect-ratio:1;right:-10%;top:8%;
  background:radial-gradient(circle,var(--c2) 0%,transparent 65%);
  animation:auroraDrift2 28s ease-in-out infinite alternate}
.bg-aurora .b3{width:70%;aspect-ratio:1;left:8%;bottom:-30%;
  background:radial-gradient(circle,var(--c3) 0%,transparent 65%);
  animation:auroraDrift3 26s ease-in-out infinite alternate}
.bg-aurora .b4{width:38%;aspect-ratio:1;right:18%;bottom:-12%;
  background:radial-gradient(circle,var(--c4) 0%,transparent 65%);
  animation:auroraDrift4 30s ease-in-out infinite alternate}
.bg-aurora[data-state="welcome"] .blob{opacity:.85;filter:blur(60px)}
.bg-aurora[data-state="welcome"] .b1{animation-duration:14s}
.bg-aurora[data-state="welcome"] .b2{animation-duration:16s}
.bg-aurora[data-state="welcome"] .b3{animation-duration:18s}

@keyframes auroraDrift1{
  0%{transform:translate(0,0) scale(1)}
  100%{transform:translate(18%,12%) scale(1.15)}
}
@keyframes auroraDrift2{
  0%{transform:translate(0,0) scale(1.05)}
  100%{transform:translate(-14%,18%) scale(.9)}
}
@keyframes auroraDrift3{
  0%{transform:translate(0,0) scale(.95)}
  100%{transform:translate(12%,-14%) scale(1.2)}
}
@keyframes auroraDrift4{
  0%{transform:translate(0,0) scale(1)}
  100%{transform:translate(-18%,-10%) scale(1.1)}
}

/* ─── MESH + GRAIN ─── */
.bg-mesh{}
.bg-mesh .layer{position:absolute;inset:-20%;will-change:transform}
.bg-mesh .m1{
  background:
    radial-gradient(40% 35% at 22% 28%, var(--c1) 0%, transparent 60%),
    radial-gradient(35% 40% at 78% 22%, var(--c2) 0%, transparent 65%),
    radial-gradient(50% 45% at 60% 85%, var(--c3) 0%, transparent 60%),
    radial-gradient(30% 30% at 12% 78%, var(--c4) 0%, transparent 65%);
  filter:blur(40px);opacity:.7;
  animation:meshShift 30s ease-in-out infinite alternate}
.bg-mesh .grain{
  position:absolute;inset:0;opacity:.18;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size:180px}
.bg-mesh .lines{
  position:absolute;inset:0;opacity:.06;
  background-image:linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px);
  background-size:80px 80px;
  mask-image:radial-gradient(70% 70% at 50% 50%, #000, transparent)}
.bg-mesh[data-state="welcome"] .m1{opacity:.95;animation-duration:18s}
.bg-mesh[data-state="welcome"] .grain{opacity:.12}

@keyframes meshShift{
  0%{transform:translate(0,0) rotate(0deg)}
  100%{transform:translate(4%,-3%) rotate(8deg)}
}

/* ─── ORBS ─── */
.bg-orbs{}
.bg-orbs .vignette{position:absolute;inset:0;
  background:
    radial-gradient(60% 80% at 50% 50%, transparent 0%, rgba(0,0,0,.55) 100%),
    radial-gradient(120% 60% at 50% 110%, var(--c1) 0%, transparent 55%),
    radial-gradient(100% 60% at 50% -10%, var(--c2) 0%, transparent 50%)}
.bg-orbs .orb{position:absolute;border-radius:50%;
  background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), var(--c3) 35%, transparent 70%);
  box-shadow:0 0 60px var(--c3), 0 0 120px var(--c3);
  opacity:.0;will-change:transform,opacity}
.bg-orbs .orb.welcome-only{display:none}
.bg-orbs[data-state="welcome"] .orb.welcome-only{display:block}
.bg-orbs .grid{
  position:absolute;inset:0;opacity:.08;
  background-image:
    linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px);
  background-size:64px 64px;
  mask-image:radial-gradient(60% 50% at 50% 50%, #000, transparent)}
@keyframes orbRise{
  0%{transform:translateY(8%) translateX(0); opacity:0}
  20%{opacity:.9}
  100%{transform:translateY(-110%) translateX(var(--dx,0)); opacity:0}
}
`;

if (typeof document !== 'undefined' && !document.getElementById('bg-styles')) {
  const s = document.createElement('style');
  s.id = 'bg-styles';
  s.textContent = __BG_STYLE;
  document.head.appendChild(s);
}

// ──────────────────────────────────────────────────────────────────────────
// Palette derivation — given a single accent hue, generate complementary stops.
function palette(accent) {
  // Parse hex -> hsl-ish anchor and rotate.
  const hex = accent.replace('#','');
  const r = parseInt(hex.slice(0,2),16)/255;
  const g = parseInt(hex.slice(2,4),16)/255;
  const b = parseInt(hex.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0; const l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h *= 60;
  }
  const hsl = (hh, ss, ll, a=1) => `hsla(${(hh+360)%360}, ${Math.min(100,ss*100)}%, ${ll*100}%, ${a})`;
  return {
    c1: hsl(h, .8, .55, 1),
    c2: hsl(h + 60, .75, .55, 1),
    c3: hsl(h - 50, .8, .50, 1),
    c4: hsl(h + 140, .7, .55, 1),
  };
}

function AuroraBg({ accent, screen }) {
  const p = palette(accent);
  return (
    <div className="bg-root bg-aurora" data-state={screen}
         style={{'--c1': p.c1, '--c2': p.c2, '--c3': p.c3, '--c4': p.c4}}>
      <div className="blob b1"></div>
      <div className="blob b2"></div>
      <div className="blob b3"></div>
      <div className="blob b4"></div>
    </div>
  );
}

function MeshBg({ accent, screen }) {
  const p = palette(accent);
  return (
    <div className="bg-root bg-mesh" data-state={screen}
         style={{'--c1': p.c1, '--c2': p.c2, '--c3': p.c3, '--c4': p.c4}}>
      <div className="layer m1"></div>
      <div className="lines"></div>
      <div className="grain"></div>
    </div>
  );
}

function OrbsBg({ accent, screen }) {
  const p = palette(accent);
  // Deterministic orb positions so renders match across re-mounts.
  const orbs = [
    {left:'12%', size:140, dur:18, delay:0,  c:p.c1, dx:'4%'},
    {left:'28%', size:80,  dur:22, delay:3,  c:p.c2, dx:'-3%'},
    {left:'46%', size:200, dur:28, delay:1,  c:p.c3, dx:'2%'},
    {left:'62%', size:110, dur:20, delay:5,  c:p.c1, dx:'-2%'},
    {left:'78%', size:160, dur:26, delay:2,  c:p.c2, dx:'5%'},
    {left:'88%', size:90,  dur:24, delay:4,  c:p.c3, dx:'-4%'},
  ];
  const welcomeOrbs = [
    {left:'20%', size:60,  dur:10, delay:0,  c:p.c1, dx:'8%'},
    {left:'40%', size:50,  dur:11, delay:1,  c:p.c2, dx:'-6%'},
    {left:'70%', size:70,  dur:13, delay:2,  c:p.c3, dx:'4%'},
    {left:'55%', size:40,  dur:9,  delay:.5, c:p.c1, dx:'-3%'},
  ];
  return (
    <div className="bg-root bg-orbs" data-state={screen}
         style={{'--c1': p.c1, '--c2': p.c2, '--c3': p.c3}}>
      <div className="vignette"></div>
      <div className="grid"></div>
      {orbs.map((o,i) => (
        <div key={i} className="orb" style={{
          left:o.left, bottom:'-10%', width:o.size, height:o.size,
          '--c3': o.c, '--dx': o.dx,
          animation: `orbRise ${o.dur}s linear ${o.delay}s infinite`
        }}></div>
      ))}
      {welcomeOrbs.map((o,i) => (
        <div key={`w${i}`} className="orb welcome-only" style={{
          left:o.left, bottom:'-10%', width:o.size, height:o.size,
          '--c3': o.c, '--dx': o.dx,
          animation: `orbRise ${o.dur}s linear ${o.delay}s infinite`
        }}></div>
      ))}
    </div>
  );
}

Object.assign(window, { AuroraBg, MeshBg, OrbsBg, palette });
