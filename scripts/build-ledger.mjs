#!/usr/bin/env node
/**
 * build-ledger.mjs
 *
 * Renders the hand-drawn "Workshop Ledger" SVG for the GitHub profile
 * README. Two outputs (light + dark) using Tony Yang's Atelier × Cinema
 * design tokens. The plate carries:
 *   - total contributions in the trailing 12 months
 *   - current streak (consecutive most-recent days with contributions)
 *   - longest streak in the trailing 12 months
 *   - a 30-day sparkline area-chart
 *   - a full 53-week × 7-day contribution grid with month + day labels
 *   - peak-day annotation (the loudest workshop day in the window)
 *   - plate colophon (date + N° tick) so it reads as a printed page
 *
 * Run via:
 *   GITHUB_TOKEN=ghp_... GH_USER=tonyyunyang node scripts/build-ledger.mjs
 *
 * In CI the workflow exposes GITHUB_TOKEN automatically. GH_USER falls
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

// Color tokens, in lockstep with assets/banner-*.svg + globals.css.
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
            firstDay
            contributionDays {
              date
              contributionCount
              weekday
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
  const days = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount, weekday: day.weekday });
    }
  }
  return days;
}

function streaks(days) {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else break;
  }
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

function findPeak(days) {
  let best = null;
  for (const d of days) {
    if (!best || d.count > best.count) best = d;
  }
  return best && best.count > 0 ? best : null;
}

// ISO date to "MMM D, YYYY" without locale gotchas
function fmt(iso) {
  if (!iso) return "·";
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function fmtShort(iso) {
  const d = new Date(iso + "T00:00:00Z");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ----------------------------------------------------------------- svg
function svg(theme, stats, calendar) {
  const t = TOKENS[theme];
  const { total, current, longest, currentRange, longestRange: lr, last30, peak } = stats;

  // Sparkline (top right side, smaller than before to make room for year grid)
  const SPARK_X = 60;
  const SPARK_Y = 196;
  const SPARK_W = 760;
  const SPARK_H = 48;
  const max30 = Math.max(1, ...last30.map((d) => d.count));
  const stepX = SPARK_W / Math.max(1, last30.length - 1);
  const sparkPts = last30.map((d, i) => {
    const x = SPARK_X + i * stepX;
    const y = SPARK_Y + SPARK_H - (d.count / max30) * SPARK_H;
    return [x, y];
  });
  const sparkPath = sparkPts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const sparkArea = `${sparkPath} L ${(SPARK_X + SPARK_W).toFixed(1)} ${(SPARK_Y + SPARK_H).toFixed(1)} L ${SPARK_X.toFixed(1)} ${(SPARK_Y + SPARK_H).toFixed(1)} Z`;

  // Spark x-axis tick markers every ~5 days
  const sparkTicks = [];
  for (let i = 0; i < last30.length; i += 5) {
    const x = SPARK_X + i * stepX;
    sparkTicks.push(`<line x1="${x.toFixed(1)}" y1="${(SPARK_Y + SPARK_H).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(SPARK_Y + SPARK_H + 3).toFixed(1)}" stroke="${t.inkSoft}" stroke-width="0.5" opacity="0.6"/>`);
  }
  // Day-30 marker (today)
  const todayMarker = sparkPts[sparkPts.length - 1];

  // Year grid · 53 weeks × 7 days, calendar.weeks comes oldest-first.
  // Cells sized so the grid fits inside the inner frame with a small
  // visual margin on both sides. 53 columns × (CELL+GAP) = total grid
  // width. We center inside the [60, 820] content range.
  const CELL = 11;
  const GAP = 3;
  const colWidth = CELL + GAP;
  const numWeeks = Math.min(calendar.weeks.length, 53);
  const gridW = numWeeks * colWidth - GAP;
  const YG_X = Math.round((880 - gridW) / 2 + 8); // small leftward bias for the day labels
  const YG_Y = 372;
  const yearCells = [];
  const monthLabels = [];
  let lastMonth = -1;
  let peakCellPos = null;
  for (let w = 0; w < numWeeks; w++) {
    const week = calendar.weeks[w];
    const colX = YG_X + w * colWidth;
    const firstDay = week.contributionDays[0];
    if (firstDay) {
      const d = new Date(firstDay.date + "T00:00:00Z");
      const m = d.getUTCMonth();
      if (m !== lastMonth && d.getUTCDate() <= 7) {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        monthLabels.push({ x: colX, label: months[m] });
        lastMonth = m;
      }
    }
    for (const day of week.contributionDays) {
      const row = day.weekday;
      const x = colX;
      const y = YG_Y + row * colWidth;
      let fill;
      if (day.contributionCount === 0) fill = withAlpha(t.inkSoft, theme === "dark" ? 0.20 : 0.18);
      else if (day.contributionCount < 3) fill = withAlpha(t.accent, 0.35);
      else if (day.contributionCount < 6) fill = withAlpha(t.accent, 0.62);
      else if (day.contributionCount < 12) fill = t.accent;
      else fill = t.ink;
      yearCells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"/>`);
      if (peak && day.date === peak.date) peakCellPos = { x: x + CELL / 2, y: y + CELL / 2 };
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  // Day labels (sparse) on the left of the year grid
  const dayLabelY = (row) => YG_Y + row * colWidth + CELL - 1;

  // Legend swatches mirror the cell ramp so they read as keys
  const legendX = 60;
  const legendY = 492;
  const legendSwatches = [
    withAlpha(t.inkSoft, theme === "dark" ? 0.20 : 0.18),
    withAlpha(t.accent, 0.35),
    withAlpha(t.accent, 0.62),
    t.accent,
    t.ink,
  ];

  // Peak day annotation
  const peakLabel = peak
    ? `${peak.count} commits on ${fmtShort(peak.date)}`
    : "no commits this window";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 580" role="img" aria-label="Workshop ledger · ${theme} · contribution stats for ${USER}">
  <title>Workshop ledger · contribution stats for ${USER}</title>
  <desc>An editorial plate showing total contributions in the trailing 12 months (${total}), current streak (${current} days), longest streak (${longest} days), a 30-day activity sparkline, and a full year contribution grid. Regenerated twice daily by GitHub Actions.</desc>
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
  <rect x="0" y="0" width="880" height="580" fill="${t.paper}"/>
  <rect x="0" y="0" width="880" height="580" fill="url(#hatch-fine-${theme})" opacity="${theme === "dark" ? 0.45 : 0.22}"/>

  <!-- Outer dashed + inner solid frame -->
  <rect x="14" y="14" width="852" height="552" fill="none" stroke="${t.ink}" stroke-width="0.7" stroke-dasharray="3 5" opacity="${theme === "dark" ? 0.45 : 0.55}"/>
  <rect x="22" y="22" width="836" height="536" fill="none" stroke="${t.ink}" stroke-width="1.2" opacity="${theme === "dark" ? 0.85 : 1}"/>

  <!-- Hatched engraving corners -->
  <rect x="22" y="22" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="22" y="22" width="12" height="64" fill="url(#hatch-${theme})"/>
  <rect x="794" y="22" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="846" y="22" width="12" height="64" fill="url(#hatch-${theme})"/>
  <rect x="22" y="546" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="22" y="494" width="12" height="64" fill="url(#hatch-${theme})"/>
  <rect x="794" y="546" width="64" height="12" fill="url(#hatch-${theme})"/>
  <rect x="846" y="494" width="12" height="64" fill="url(#hatch-${theme})"/>

  <!-- Header strip -->
  <text x="60" y="50" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="11" letter-spacing="0.18em" fill="${t.inkSoft}">§ PLATE GH · WORKSHOP LEDGER</text>
  <text x="820" y="50" text-anchor="end" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="11" letter-spacing="0.18em" fill="${t.inkSoft}">AS OF ${today.toUpperCase()}</text>
  <line x1="60" y1="62" x2="820" y2="62" stroke="${t.hairline}" stroke-width="0.7"/>

  <!-- Three-column figures -->
  <text x="60" y="98" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">TOTAL CONTRIBUTIONS</text>
  <text x="60" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-weight="400" font-size="56" fill="${t.ink}">${total.toLocaleString()}</text>
  <text x="60" y="170" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.inkSoft}">last 12 months</text>

  <text x="320" y="98" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">CURRENT STREAK</text>
  <text x="320" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-weight="400" font-size="56" fill="${t.accent}">${current}</text>
  <text x="${320 + measureNumber(current) + 12}" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="20" fill="${t.inkSoft}">${current === 1 ? "day" : "days"}</text>
  <text x="320" y="170" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.inkSoft}">${current > 0 ? `${fmt(currentRange.first)} → ${fmt(currentRange.last)}` : daysSinceLastContribution(stats.allDays)}</text>

  <text x="600" y="98" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">LONGEST STREAK</text>
  <text x="600" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-weight="400" font-size="56" fill="${t.ink}">${longest}</text>
  <text x="${600 + measureNumber(longest) + 12}" y="146" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="20" fill="${t.inkSoft}">${longest === 1 ? "day" : "days"}</text>
  <text x="600" y="170" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.inkSoft}">${lr ? `${fmt(lr.first)} → ${fmt(lr.last)}` : "·"}</text>

  <!-- Sparkline -->
  <text x="60" y="190" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">ACTIVITY · LAST 30 DAYS</text>
  <text x="820" y="190" text-anchor="end" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="12" fill="${t.inkSoft}">peak ${max30}</text>
  <path d="${sparkArea}" fill="url(#spark-fill-${theme})" stroke="none"/>
  <path d="${sparkPath}" fill="none" stroke="${t.accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${SPARK_X}" y1="${SPARK_Y + SPARK_H}" x2="${SPARK_X + SPARK_W}" y2="${SPARK_Y + SPARK_H}" stroke="${t.hairline}" stroke-width="0.6" stroke-dasharray="2 3"/>
  ${sparkTicks.join("\n  ")}
  <!-- Today marker on sparkline -->
  ${todayMarker ? `<circle cx="${todayMarker[0].toFixed(1)}" cy="${todayMarker[1].toFixed(1)}" r="3.6" fill="${t.paper}" stroke="${t.accent}" stroke-width="1.4"/>` : ""}

  <!-- Decorative divider before year grid -->
  <g transform="translate(60 290)" stroke="${t.inkSoft}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5">
    <path d="M0 0 Q90 -6 180 0 Q270 6 360 0 Q450 -6 540 0 Q630 6 720 0 L760 0" stroke-width="0.7"/>
    <circle cx="380" cy="0" r="1.6" fill="${t.accent}" stroke="none"/>
  </g>

  <!-- Year grid heading -->
  <text x="60" y="328" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="22" fill="${t.ink}">the year, in days</text>
  <text x="820" y="328" text-anchor="end" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="10" letter-spacing="0.2em" fill="${t.inkSoft}">${numWeeks} WEEKS · ${numWeeks * 7} DAYS</text>

  <!-- Day labels (Mon, Wed, Fri at rows 1, 3, 5) -->
  <g font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="8.5" letter-spacing="0.16em" fill="${t.inkSoft}" text-anchor="end">
    <text x="${YG_X - 6}" y="${dayLabelY(1)}">MON</text>
    <text x="${YG_X - 6}" y="${dayLabelY(3)}">WED</text>
    <text x="${YG_X - 6}" y="${dayLabelY(5)}">FRI</text>
  </g>

  <!-- Month labels above grid -->
  <g font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="9" letter-spacing="0.18em" fill="${t.inkSoft}">
    ${monthLabels.map(m => `<text x="${m.x}" y="${YG_Y - 8}">${m.label.toUpperCase()}</text>`).join("\n    ")}
  </g>

  <!-- Year grid cells -->
  ${yearCells.join("\n  ")}

  <!-- Peak day annotation: small caret pointing at the cell -->
  ${peakCellPos ? `<g stroke="${t.ink}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8">
    <path d="M ${peakCellPos.x.toFixed(1)} ${(YG_Y - 6).toFixed(1)} L ${peakCellPos.x.toFixed(1)} ${(YG_Y + 7 * colWidth + 6).toFixed(1)}" stroke-width="0.5" stroke-dasharray="1.5 2.5"/>
    <circle cx="${peakCellPos.x.toFixed(1)}" cy="${(peakCellPos.y).toFixed(1)}" r="${(CELL / 2 + 2).toFixed(1)}" stroke="${t.ink}" stroke-width="0.7"/>
  </g>` : ""}

  <!-- Legend -->
  <text x="${legendX}" y="${legendY}" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="9" letter-spacing="0.2em" fill="${t.inkSoft}">QUIETER</text>
  ${legendSwatches.map((c, i) => `<rect x="${legendX + 70 + i * 16}" y="${legendY - 9}" width="12" height="12" rx="2" fill="${c}"/>`).join("\n  ")}
  <text x="${legendX + 70 + legendSwatches.length * 16 + 6}" y="${legendY}" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="9" letter-spacing="0.2em" fill="${t.inkSoft}">LOUDER</text>

  <!-- Peak day annotation, right-aligned -->
  <text x="820" y="${legendY}" text-anchor="end" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="14" fill="${t.ink}">peak day · ${peakLabel}</text>

  <!-- Bottom colophon -->
  <text x="60" y="544" font-family="JetBrains Mono, ui-monospace, Menlo, Consolas, monospace" font-size="9" letter-spacing="0.22em" fill="${t.inkSoft}">REGENERATED TWICE DAILY · GITHUB ACTIONS</text>
  <text x="820" y="544" text-anchor="end" font-family="EB Garamond, Garamond, Cormorant Garamond, Georgia, serif" font-style="italic" font-size="13" fill="${t.inkSoft}">measure twice, ship once.</text>
</svg>
`;
}

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

function daysSinceLastContribution(days) {
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      const gap = days.length - 1 - i;
      if (gap === 0) return "today";
      if (gap === 1) return "yesterday";
      return `${gap} days since the last commit`;
    }
  }
  return "no commits in window";
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
  peak: findPeak(days),
  allDays: days,
};

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "ledger-light.svg"), svg("light", stats, calendar));
writeFileSync(resolve(outDir, "ledger-dark.svg"), svg("dark", stats, calendar));
console.log(`Wrote ledger-light.svg + ledger-dark.svg (total=${stats.total}, current=${stats.current}, longest=${stats.longest}, peak=${stats.peak ? stats.peak.count : 0})`);
