#!/usr/bin/env node
/**
 * build-ledger.mjs
 *
 * Renders a hand-drawn "Workshop Ledger" SVG for the GitHub profile
 * README. Two outputs (light + dark) using Tony Yang's Atelier × Cinema
 * design tokens. The plate carries:
 *   - total contributions in the trailing 12 months
 *   - current streak (consecutive most-recent days with contributions)
 *   - longest streak in the trailing 12 months
 *   - a 30-day sparkline area-chart
 *   - a small 7×7 contribution-grid motif (last seven weeks)
 *   - plate colophon (date + N° tick) so it reads as a printed page
 *
 * Run via:
 *   GITHUB_TOKEN=ghp_... GH_USER=tonyyunyang node scripts/build-ledger.mjs
 *
 * In CI the workflow exposes GITHUB_TOKEN automatically; GH_USER falls
 * back to the repository_owner.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = resolve(root, "dist");

const USER = process.env.GH_USER || process.env.GITHUB_REPOSITORY_OWNER || "tonyyunyang";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("Missing GITHUB_TOKEN. Set GITHUB_TOKEN env var (read:user is enough for public data).");
  process.exit(1);
}

// Color tokens — keep these in lockstep with assets/banner-*.svg + globals.css.
const TOKENS = {
  light: {
    paper: "#F5EFE2",
    paperShade: "#EDE6D5",
    ink: "#0F1417",
    inkSoft: "#4A5159",
    accent: "#0E5347",
    accentSoft: "#0E5347",
    hairline: "#D9D2C2",
    glow: "#FAF1D8",
  },
  dark: {
    paper: "#14110D",
    paperShade: "#1D1812",
    ink: "#EFE4CE",
    inkSoft: "#9C8F77",
    accent: "#5BC795",
    accentSoft: "#5BC795",
    hairline: "#2F261C",
    glow: "#FAF1D8",
  },
};

// ----------------------------------------------------------------- fetch
const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchCalendar() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "tonyyunyang-readme-ledger-script",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  return data.data.user.contributionsCollection.contributionCalendar;
}

// ----------------------------------------------------------------- compute
function flattenDays(calendar) {
  // Calendar weeks come oldest-first. Flatten to a single chronological array.
  const days = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount });
    }
  }
  return days;
}

function streaks(days) {
  // currentStreak: consecutive non-zero days ending at the most-recent
  // recorded day. If today is zero we still walk backwards from today.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else break;
  }
  // longest in window
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  return { current, longest };
}

function streakDateRange(days) {
  // Return {first, last} ISO dates for the current streak window
  const last = days[days.length - 1];
  let firstIdx = days.length;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) firstIdx = i;
    else break;
  }
  const first = days[firstIdx] || last;
  return { first: first.date, last: last.date };
}

function longestRange(days) {
  let bestStart = 0, bestLen = 0, runStart = 0, run = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i].count > 0) {
      if (run === 0) runStart = i;
      run++;
      if (run > bestLen) {
        bestLen = run;
        bestStart = runStart;
      }
    } else {
      run = 0;
    }
  }
  if (bestLen === 0) return null;
  return { first: days[bestStart].date, last: days[bestStart + bestLen - 1].date };
}

function lastNDays(days, n) {
  return days.slice(Math.max(0, days.length - n));
}

// Convert ISO date -> "MMM D, YYYY" without locale gotchas
function fmt(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

// ----------------------------------------------------------------- svg
function svg(theme, stats) {
  const t = TOKENS[theme];
  const { total, current, longest, currentRange, longestRange: lr, last30, last49 } = stats;

  // Sparkline — 30 days, area chart
  const SPARK_X = 60;
  const SPARK_Y = 196;
  const SPARK_W = 540;
  const SPARK_H = 56;
  const max30 = Math.max(1, ...last30.map((d) => d.count));
  const stepX = SPARK_W / Math.max(1, last30.length - 1);
  const sparkPts = last30.map((d, i) => {
    const x = SPARK_X + i * stepX;
    const y = SPARK_Y + SPARK_H - (d.count / max30) * SPARK_H;
    return [x, y];
  });
  const sparkPath = sparkPts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const sparkArea = `${sparkPath} L ${(SPARK_X + SPARK_W).toFixed(1)} ${(SPARK_Y + SPARK_H).toFixed(1)} L ${SPARK_X.toFixed(1)} ${(SPARK_Y + SPARK_H).toFixed(1)} Z`;

  // Mini grid — 7×7 = last 49 days, 6×6 px cells
  const GRID_X = 670;
  const GRID_Y = 192;
  const CELL = 7;
  const GAP = 2;
  const gridCells = last49.map((d, i) => {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const x = GRID_X + col * (CELL + GAP);
    const y = GRID_Y + row * (CELL + GAP);
    let fill;
    if (d.count === 0) fill = t.hairline;
    else if (d.count < 3) fill = withAlpha(t.accent, 0.35);
    else if (d.count < 7) fill = withAlpha(t.accent, 0.65);
    else if (d.count < 12) fill = t.accent;
    else fill = t.ink;
    return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="1" fill="${fill}"/>`;
  }).join("");

  const today = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 280" role="img" aria-label="Workshop ledger · ${theme} · contribution stats for ${USER}">
  <title>Workshop ledger · contribution stats for ${USER}</title>
  <desc>A hand-drawn editorial plate showing the total contributions in the trailing 12 months (${total}), current streak (${current} days), longest streak (${longest} days), and a 30-day activity sparkline. Generated nightly by GitHub Actions.</desc>
  <defs>
    <pattern id="hatch-${theme}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${t.ink}" stroke-width="0.45" opacity="${theme === "dark" ? 0.32 : 0.45}"/>
    </pattern>
    <pattern id="hatch-fine-${theme}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-30)">
      <line x1="0" y1="0" x2="0" y2="4" stroke="${t.ink}" stroke-width="0.3" opacity="${theme === "dark" ? 0.16 : 0.32}"/>
    </pattern>
    <linearGradient id="spark-fill-${theme}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <!-- Page -->
  <rect x="0" y="0" width="880" height="280" fill="${t.paper}"/>
  <rect x="0" y="0" width="880" height="280" fill="url(#hatch-fine-${theme})" opacity="${theme === "dark" ? 0.45 : 0.22}"/>

  <!-- Outer dashed frame + inner solid frame -->
  <rect x="14" y="14" width="852" height="252" fill="none" stroke="${t.ink}" stroke-width="0.7" stroke-dasharray="3 5" opacity="${theme === "dark" ? 0.45 : 0.55}"/>
  <rect x="22" y="22" width="836" height="236" fill="none" stroke="${t.ink}" stroke-width="1.2" opacity="${theme === "dark" ? 0.85 : 1}"/>

  <!-- Hatched engraving corners -->
  <rect x="22" y="22" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="22" y="22" width="12" height="64" fill="url(#hatch-${theme})"/>
  <rect x="794" y="22" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="846" y="22" width="12" height="64" fill="url(#hatch-${theme})"/>
  <rect x="22" y="246" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="22" y="194" width="12" height="64" fill="url(#hatch-${theme})"/>
  <rect x="794" y="246" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="846" y="194" width="12" height="64" fill="url(#hatch-${theme})"/>

  <!-- Header strip -->
  <text x="60" y="50" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="11" letter-spacing="0.18em" fill="${t.inkSoft}">§ PLATE GH · WORKSHOP LEDGER</text>
  <text x="820" y="50" text-anchor="end" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="11" letter-spacing="0.18em" fill="${t.inkSoft}">AS OF ${today.toUpperCase()}</text>

  <!-- Three-column figures -->
  <!-- Column 1: total -->
  <text x="60" y="100" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">TOTAL CONTRIBUTIONS</text>
  <text x="60" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-weight="400" font-size="56" fill="${t.ink}">${total.toLocaleString()}</text>
  <text x="60" y="170" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.inkSoft}">last 12 months</text>

  <!-- Column 2: current streak -->
  <text x="320" y="100" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">CURRENT STREAK</text>
  <text x="320" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-weight="400" font-size="56" fill="${t.accent}">${current}</text>
  <text x="${320 + measureNumber(current) + 12}" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="20" fill="${t.inkSoft}">${current === 1 ? "day" : "days"}</text>
  <text x="320" y="170" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.inkSoft}">${current > 0 ? `${fmt(currentRange.first)} → ${fmt(currentRange.last)}` : "—"}</text>

  <!-- Column 3: longest streak -->
  <text x="600" y="100" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">LONGEST STREAK</text>
  <text x="600" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-weight="400" font-size="56" fill="${t.ink}">${longest}</text>
  <text x="${600 + measureNumber(longest) + 12}" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="20" fill="${t.inkSoft}">${longest === 1 ? "day" : "days"}</text>
  <text x="600" y="170" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.inkSoft}">${lr ? `${fmt(lr.first)} → ${fmt(lr.last)}` : "—"}</text>

  <!-- Sparkline label -->
  <text x="60" y="190" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">ACTIVITY · LAST 30 DAYS</text>
  <!-- Sparkline area -->
  <path d="${sparkArea}" fill="url(#spark-fill-${theme})" stroke="none"/>
  <!-- Sparkline stroke -->
  <path d="${sparkPath}" fill="none" stroke="${t.accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Sparkline baseline -->
  <line x1="${SPARK_X}" y1="${SPARK_Y + SPARK_H}" x2="${SPARK_X + SPARK_W}" y2="${SPARK_Y + SPARK_H}" stroke="${t.hairline}" stroke-width="0.6" stroke-dasharray="2 3"/>

  <!-- Grid label + grid -->
  <text x="${GRID_X}" y="190" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">LAST 7 WEEKS</text>
  ${gridCells}

  <!-- Bottom colophon -->
  <text x="60" y="244" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="9" letter-spacing="0.22em" fill="${t.inkSoft}">REGENERATED NIGHTLY · GITHUB ACTIONS</text>
  <text x="820" y="244" text-anchor="end" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="13" fill="${t.inkSoft}">measure twice, ship once.</text>
</svg>
`;
}

// Crude width estimate for a numeric string at the 56px serif size used
// in the figure column. EB Garamond digits are roughly 0.55em wide; this
// gives us enough accuracy to place the trailing "days" label cleanly.
function measureNumber(n) {
  const digits = String(n).length;
  return Math.round(digits * 56 * 0.5);
}

function withAlpha(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ----------------------------------------------------------------- main
const calendar = await fetchCalendar();
const days = flattenDays(calendar);
const { current, longest } = streaks(days);
const stats = {
  total: calendar.totalContributions,
  current,
  longest,
  currentRange: streakDateRange(days),
  longestRange: longestRange(days),
  last30: lastNDays(days, 30),
  last49: lastNDays(days, 49),
};

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "ledger-light.svg"), svg("light", stats));
writeFileSync(resolve(outDir, "ledger-dark.svg"), svg("dark", stats));
console.log(`Wrote ledger-light.svg + ledger-dark.svg (total=${stats.total}, current=${stats.current}, longest=${stats.longest})`);
