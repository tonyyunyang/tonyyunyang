#!/usr/bin/env node
/**
 * build-ledger.mjs
 *
 * Renders the live contribution ledger for the profile README as a terminal
 * window (light + dark), matching the generated panes in scripts/build-panes.mjs.
 * The ~/log pane carries a `git log` command line, a contribution heatmap drawn
 * in the theme's accent ramp, and a terse stats line (total / current streak /
 * longest streak / busiest day) over the trailing 12 months.
 *
 * Run via:
 *   GITHUB_TOKEN=ghp_... GH_USER=tonyyunyang node scripts/build-ledger.mjs
 *
 * In CI the workflow exposes GITHUB_TOKEN automatically. GH_USER falls back to
 * the repository owner. Outputs dist/ledger-{light,dark}.svg, which studio.yml
 * publishes to the `output` branch twice daily.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderTerminal, THEMES } from "./lib/terminal.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = resolve(root, "dist");

const USER = process.env.GH_USER || process.env.GITHUB_REPOSITORY_OWNER || "tonyyunyang";

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
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
// Single source of truth for "as of" date so the streak window never counts
// days that GitHub may return slightly ahead of the local clock.
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function flattenDays(calendar) {
  const days = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      if (day.date > TODAY_ISO) continue;
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

function findPeak(days) {
  let best = null;
  for (const d of days) {
    if (!best || d.count > best.count) best = d;
  }
  return best && best.count > 0 ? best : null;
}

export function computeStats(calendar) {
  const days = flattenDays(calendar);
  const { current, longest } = streaks(days);
  return {
    total: calendar.totalContributions,
    current,
    longest,
    peak: findPeak(days),
    weeks: calendar.weeks,
  };
}

// ----------------------------------------------------------------- render
// Contribution heatmap as an SVG fragment positioned under the terminal body.
// The ramp goes quiet -> loud in the theme accent.
function heatmap(weeks, theme, originX, originY) {
  const t = THEMES[theme];
  const ramp = theme === "dark"
    ? ["#1B2A26", "#1F4D40", "#2F7D68", t.prompt, "#7BE8CF"]
    : ["#E6DECB", "#BCD3C4", "#7FAE9B", "#3F8A72", t.prompt];
  const CELL = 11, GAP = 3, col = CELL + GAP;
  let cells = "";
  weeks.forEach((w, x) => {
    w.contributionDays.forEach((d) => {
      const n = d.contributionCount;
      const lvl = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 12 ? 3 : 4;
      const cx = originX + x * col;
      const cy = originY + d.weekday * col;
      cells += `<rect x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="2" fill="${ramp[lvl]}"/>`;
    });
  });
  return cells;
}

export function renderLedger(theme, stats) {
  const statsSegs = [
    { text: `${stats.total.toLocaleString()} commits`, tone: "amber" },
    { text: `   ·   current ${stats.current}d`, tone: "out" },
    { text: `   ·   longest ${stats.longest}d`, tone: "out" },
  ];
  if (stats.peak) statsSegs.push({ text: `   ·   busiest ${stats.peak.count}`, tone: "out" });

  const rows = [
    { segs: [{ text: "~/log $ ", tone: "prompt" }, { text: 'git log --stat --since="1 year ago"', tone: "cmd" }] },
    { gap: true },
    { segs: statsSegs },
    { gap: true },
    // Reserved band for the contribution heatmap (7 weekday rows, ~98px tall).
    { gap: true }, { gap: true }, { gap: true }, { gap: true }, { gap: true },
    { segs: [{ text: "# the year in green · regenerated twice a day by a github action", tone: "comment" }] },
  ];

  let svg = renderTerminal({ title: "tony@amsterdam: ~/log", rows, theme });
  // Splice the heatmap into the reserved band. originY sits just below the
  // stats line; originX matches the terminal body's left padding (PAD_X = 22).
  const originX = 22;
  const originY = 150;
  svg = svg.replace("</svg>", `  ${heatmap(stats.weeks, theme, originX, originY)}\n</svg>`);
  return svg;
}

// ----------------------------------------------------------------- main
// Only run when executed directly (not when imported by tests or other tools).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  if (!process.env.GITHUB_TOKEN) {
    console.error("Missing GITHUB_TOKEN. Set GITHUB_TOKEN env var (read:user is enough for public data).");
    process.exit(1);
  }
  const calendar = await fetchCalendar();
  const stats = computeStats(calendar);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "ledger-light.svg"), renderLedger("light", stats));
  writeFileSync(resolve(outDir, "ledger-dark.svg"), renderLedger("dark", stats));
  console.log(`Wrote ledger SVGs (total=${stats.total}, current=${stats.current}, longest=${stats.longest}, peak=${stats.peak ? stats.peak.count : 0})`);
}
