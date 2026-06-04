// Terminal-window SVG builder for the profile README panes + ledger.
// No dependencies. Two themes, in lockstep with the design spec and the
// site's globals.css tokens.

export const THEMES = {
  light: {
    win: "#F2EAD8", bar: "#E7DDC7", border: "#D9D2C2",
    prompt: "#0E5347", cmd: "#1A1F24", out: "#43494F", comment: "#9C917A", amber: "#946321",
    dotR: "#E0654F", dotY: "#D9A23B", dotG: "#3E8E6E",
    shadow: "rgba(15,20,23,0.16)",
  },
  dark: {
    win: "#0F1417", bar: "#161D23", border: "#2A3138",
    prompt: "#5BC795", cmd: "#EFE4CE", out: "#C7C0B2", comment: "#7C8893", amber: "#E0A458",
    dotR: "#EC6A5E", dotY: "#F4BF4F", dotG: "#43C59E",
    shadow: "rgba(0,0,0,0.40)",
  },
};

const XML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

const FONT = "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace";
const FONT_SIZE = 15;
const LINE_H = 24;
const PAD_X = 22;     // body left/right padding
const PAD_TOP = 18;   // gap below the title bar to the first line
const PAD_BOT = 18;
const BAR_H = 38;     // title bar height
const CHAR_W = 9.02;  // approx advance width of JetBrains Mono at 15px

// Layout metrics, exported so other generators (e.g. the ledger heatmap) can
// place graphics against the same grid instead of hardcoding magic numbers.
export const METRICS = { FONT_SIZE, LINE_H, PAD_X, PAD_TOP, PAD_BOT, BAR_H, CHAR_W };

// Locate the single segment a hero line "types": its prompt prefix, the typed
// command, any suffix, and the command's x-origin + reveal width. Shared by
// bodyLine and buildAnimation so the clip rect always lines up with the text.
function typedParts(row) {
  const idx = row.segs.findIndex((s) => s.typed);
  if (idx === -1) return null;
  const prefix = row.segs.slice(0, idx);
  const prefixChars = prefix.reduce((n, s) => n + s.text.length, 0);
  const typed = row.segs[idx];
  return {
    prefix,
    typed,
    suffix: row.segs.slice(idx + 1),
    typedX: PAD_X + prefixChars * CHAR_W,
    typedW: typed.text.length * CHAR_W,
  };
}

function bodyLine(row, t, y, i = 0, animate = false) {
  if (row.gap) return "";
  // xml:space=preserve keeps leading/trailing spaces used for column alignment.
  const span = (seg) => `<tspan fill="${t[seg.tone] || t.out}">${escapeXml(seg.text)}</tspan>`;
  const mk = (x, segs, extra = "") =>
    `<text x="${x}" y="${y}"${extra} xml:space="preserve" font-family="${FONT}" font-size="${FONT_SIZE}">${segs.map(span).join("")}</text>`;

  const parts = animate ? typedParts(row) : null;
  if (!parts) {
    // Static line, or an animated line with no typed segment: one (fading) text element.
    return mk(PAD_X, row.segs, animate ? ` class="ln ln-${i}"` : "");
  }

  // Animated typed line: prompt prefix fades in, the command "types" via a widening
  // clip (positioned at parts.typedX, after the prompt), an optional suffix follows.
  const cls = ` class="ln ln-${i}"`;
  const tx = parts.typedX.toFixed(1);
  const sx = (parts.typedX + parts.typedW).toFixed(1);
  let out = "";
  if (parts.prefix.length) out += mk(PAD_X, parts.prefix, cls);
  out += `<g clip-path="url(#ty-${i})">${mk(tx, [parts.typed])}</g>`;
  if (parts.suffix.length) out += mk(sx, parts.suffix, cls);
  return out;
}

export function renderTerminal({ title, rows, theme = "light", width = 860, animate = false }) {
  const t = THEMES[theme];
  const bodyTop = BAR_H + PAD_TOP + FONT_SIZE; // baseline of first line
  const bodyHeight = PAD_TOP + rows.length * LINE_H + PAD_BOT;
  const height = BAR_H + bodyHeight;

  const dots = [t.dotR, t.dotY, t.dotG]
    .map((c, i) => `<circle cx="${20 + i * 20}" cy="${BAR_H / 2}" r="6" fill="${c}"/>`)
    .join("");

  const lines = rows
    .map((row, i) => bodyLine(row, t, bodyTop + i * LINE_H, i, animate))
    .filter(Boolean)
    .join("\n  ");

  const anim = animate ? buildAnimation(rows, t, bodyTop) : { style: "", overlay: "" };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <filter id="sh-${theme}" x="-4%" y="-4%" width="108%" height="116%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="${t.shadow}"/>
    </filter>
  </defs>
  ${anim.style}
  <rect x="2" y="2" width="${width - 4}" height="${height - 8}" rx="11" fill="${t.win}" stroke="${t.border}" stroke-width="1" filter="url(#sh-${theme})"/>
  <path d="M2 13 a11 11 0 0 1 11 -11 h${width - 26} a11 11 0 0 1 11 11 v${BAR_H - 13} h-${width - 4} z" fill="${t.bar}"/>
  <line x1="2" y1="${BAR_H}" x2="${width - 2}" y2="${BAR_H}" stroke="${t.border}" stroke-width="1"/>
  ${dots}
  <text x="84" y="${BAR_H / 2 + 4}" font-family="${FONT}" font-size="12" fill="${t.comment}">${escapeXml(title)}</text>
  ${lines}
  ${anim.overlay}
</svg>
`;
}

// Animated hero: per-line reveal + typed-command clip reveal + blinking caret.
// CSS-in-SVG runs when the SVG is loaded via <img> on GitHub, and honors
// prefers-reduced-motion. Tunables:
const STEP = 0.55;   // seconds of breathing room after each command block
const TYPE = 0.5;    // seconds to "type" a command

function buildAnimation(rows, t, bodyTop) {
  let clip = "";
  // .ln fades in via a keyframe (not a base opacity), with `both` fill so the
  // resting state is opacity:1. A renderer that applies the CSS but skips
  // animation therefore shows every line, rather than leaving them at 0.
  let css = `
  .ln { animation: appear 0.01s linear both; }
  @keyframes appear { from { opacity: 0; } to { opacity: 1; } }
  .ca { animation: blink 1.05s steps(2, start) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .ln { opacity: 1; animation: none; }
    .ty { animation: none; }
    .ca { animation: none; }
  }`;

  // Reveal time per row: commands "type"; their outputs follow shortly after.
  let clock = 0.2;
  const delays = rows.map((row) => {
    if (row.gap) return null;
    const isCmd = row.segs.some((s) => s.typed);
    const d = clock;
    clock += isCmd ? TYPE + 0.15 : 0.2;
    if (isCmd) clock += STEP - 0.2; // breathing room after each command block
    return d;
  });

  // Per-row reveal delay; typed commands also get a clip that widens to "type".
  rows.forEach((row, i) => {
    if (delays[i] == null) return;
    css += `\n  .ln-${i} { animation-delay: ${delays[i].toFixed(2)}s; }`;
    const parts = typedParts(row);
    if (parts) {
      const typedX = parts.typedX.toFixed(1);
      const full = parts.typedW.toFixed(1);
      const top = bodyTop + i * LINE_H - FONT_SIZE;
      css += `\n  #ty-${i} rect { animation: type-${i} ${TYPE}s steps(${parts.typed.text.length}) ${delays[i].toFixed(2)}s both; }`;
      css += `\n  @keyframes type-${i} { from { width: 0; } to { width: ${full}px; } }`;
      // width attribute = full reveal, so the command still shows if CSS is stripped.
      clip += `<clipPath id="ty-${i}" clipPathUnits="userSpaceOnUse"><rect x="${typedX}" y="${top}" width="${full}" height="${LINE_H}" class="ty"/></clipPath>`;
    }
  });

  // Caret rests just after the last visible line and blinks. Wrapped in a .ln group
  // sharing that line's delay, so it fades in with the line (never floats alone).
  let lastIdx = rows.length - 1;
  while (lastIdx >= 0 && rows[lastIdx].gap) lastIdx--;
  if (lastIdx < 0) return { style: `<style>${css}\n  </style>`, overlay: "" };
  const lastLen = rows[lastIdx].segs.reduce((n, s) => n + s.text.length, 0);
  const caretX = (PAD_X + lastLen * CHAR_W + 1).toFixed(1);
  const caretY = bodyTop + lastIdx * LINE_H - FONT_SIZE + 2;
  const overlay = `<g class="ln ln-${lastIdx}"><rect class="ca" x="${caretX}" y="${caretY}" width="9" height="${FONT_SIZE + 2}" fill="${t.prompt}"/></g>`;

  return { style: `<style>${css}\n  </style><defs>${clip}</defs>`, overlay };
}
