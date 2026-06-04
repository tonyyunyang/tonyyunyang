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

const TONE_KEY = { prompt: "prompt", cmd: "cmd", out: "out", comment: "comment", amber: "amber" };

function bodyLine(row, t, y) {
  if (row.gap) return "";
  const tspans = row.segs
    .map((seg) => `<tspan fill="${t[TONE_KEY[seg.tone] || "out"]}">${escapeXml(seg.text)}</tspan>`)
    .join("");
  // xml:space=preserve keeps leading/trailing spaces used for column alignment.
  return `<text x="${PAD_X}" y="${y}" xml:space="preserve" font-family="${FONT}" font-size="${FONT_SIZE}">${tspans}</text>`;
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
    .map((row, i) => bodyLine(row, t, bodyTop + i * LINE_H))
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

// Static builds have no animation; replaced in Task 5.
function buildAnimation() {
  return { style: "", overlay: "" };
}
