// Decorative hero background for the Creator Passport: ghost UGC video
// cards, floating commerce tags, abstract growth lines and connected dots,
// drifting over slow blurred gradients. Pure SVG/CSS, no video, no audio,
// nothing that implies real sales/ROAS data. Animation respects
// prefers-reduced-motion (see the .passport-anim-* rules in globals.css)
// and sheds elements on small screens via `hidden sm:block`.

const TAGS = ["UGC", "E-commerce", "Reviews", "Video Ads", "TikTok Shop", "Amazon", "Mercado Libre"];

const GHOST_CARDS = [
  { top: "8%", left: "6%", rotate: "-6deg", anim: "passport-anim-a", duration: "18s", delay: "0s", hideOnMobile: false },
  { top: "52%", left: "2%", rotate: "4deg", anim: "passport-anim-b", duration: "22s", delay: "1.2s", hideOnMobile: true },
  { top: "14%", left: "86%", rotate: "7deg", anim: "passport-anim-c", duration: "15s", delay: "0.6s", hideOnMobile: false },
  { top: "58%", left: "90%", rotate: "-5deg", anim: "passport-anim-a", duration: "20s", delay: "2s", hideOnMobile: true },
];

const TAG_POSITIONS = [
  { top: "6%", left: "32%", anim: "passport-anim-b", duration: "16s", delay: "0s" },
  { top: "20%", left: "66%", anim: "passport-anim-c", duration: "19s", delay: "0.8s" },
  { top: "40%", left: "14%", anim: "passport-anim-a", duration: "13s", delay: "1.6s" },
  { top: "72%", left: "40%", anim: "passport-anim-b", duration: "21s", delay: "0.4s" },
  { top: "82%", left: "70%", anim: "passport-anim-c", duration: "17s", delay: "2.4s" },
  { top: "30%", left: "48%", anim: "passport-anim-a", duration: "24s", delay: "1.1s" },
  { top: "60%", left: "60%", anim: "passport-anim-b", duration: "14s", delay: "1.9s" },
];

export function AnimatedCommerceBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Slow blurred gradient blobs */}
      <div
        className="passport-anim-drift absolute -left-16 -top-24 size-72 rounded-full bg-passport-mint/20 blur-3xl"
        style={{ "--passport-anim-duration": "26s" } as React.CSSProperties}
      />
      <div
        className="passport-anim-drift absolute -right-10 top-10 size-80 rounded-full bg-accent/25 blur-3xl"
        style={{ "--passport-anim-duration": "22s", "--passport-anim-delay": "3s" } as React.CSSProperties}
      />
      <div
        className="passport-anim-drift hidden size-64 rounded-full bg-passport-mint/10 blur-3xl sm:block"
        style={{ top: "60%", left: "40%", position: "absolute", "--passport-anim-duration": "28s", "--passport-anim-delay": "5s" } as React.CSSProperties}
      />

      {/* Abstract growth lines + connected dots */}
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 200" preserveAspectRatio="none" fill="none">
        <path d="M0 160 C 60 150, 90 100, 150 95 S 240 60, 300 50 S 370 20, 400 10" stroke="var(--passport-mint)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M0 190 C 80 185, 120 150, 180 140 S 260 110, 330 90" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        {[
          [20, 170],
          [95, 118],
          [160, 100],
          [230, 75],
          [300, 55],
          [370, 25],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={2.5} fill="var(--passport-mint)" />
        ))}
        <line x1="20" y1="170" x2="95" y2="118" stroke="var(--passport-mint)" strokeWidth="0.75" opacity="0.5" />
        <line x1="95" y1="118" x2="160" y2="100" stroke="var(--passport-mint)" strokeWidth="0.75" opacity="0.5" />
        <line x1="160" y1="100" x2="230" y2="75" stroke="var(--passport-mint)" strokeWidth="0.75" opacity="0.5" />
        <line x1="230" y1="75" x2="300" y2="55" stroke="var(--passport-mint)" strokeWidth="0.75" opacity="0.5" />
      </svg>

      {/* Ghost UGC video cards (9:16), ~empty frames hinting at content */}
      {GHOST_CARDS.map((c, i) => (
        <div
          key={i}
          className={`${c.anim} absolute aspect-[9/16] w-16 rounded-lg border border-white/15 bg-white/5 sm:w-20 ${c.hideOnMobile ? "hidden sm:block" : ""}`}
          style={
            {
              top: c.top,
              left: c.left,
              transform: `rotate(${c.rotate})`,
              "--passport-anim-duration": c.duration,
              "--passport-anim-delay": c.delay,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Floating commerce tags */}
      {TAG_POSITIONS.map((p, i) => (
        <span
          key={TAGS[i]}
          className={`${p.anim} absolute whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm ${
            i >= 4 ? "hidden sm:block" : ""
          }`}
          style={{ top: p.top, left: p.left, "--passport-anim-duration": p.duration, "--passport-anim-delay": p.delay } as React.CSSProperties}
        >
          {TAGS[i]}
        </span>
      ))}
    </div>
  );
}
