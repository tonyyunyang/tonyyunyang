// Generates the static terminal panes (light + dark) from content/profile.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderTerminal } from "./lib/terminal.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const cfg = JSON.parse(readFileSync(resolve(root, "content/profile.json"), "utf8"));
const outDir = resolve(root, "assets");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const pad = (s, n) => String(s).padEnd(n, " ");

// --- row builders: turn config into renderTerminal `rows` -----------------

function commandRow(command) {
  return { segs: [{ text: "~ $ ", tone: "prompt" }, { text: command, tone: "cmd" }] };
}

function publicationsRows(p) {
  const vW = Math.max(...p.rows.map((r) => r.venue.length)) + 3;
  const nW = Math.max(...p.rows.map((r) => r.name.length)) + 3;
  const ctxCommand = { segs: [{ text: "~/publications $ ", tone: "prompt" }, { text: p.command, tone: "cmd" }] };
  const listing = p.rows.map((r) => ({
    segs: [
      { text: pad(r.venue, vW), tone: "amber" },
      { text: pad(r.name, nW), tone: "cmd" },
      { text: r.desc, tone: "comment" },
    ],
  }));
  return [ctxCommand, { gap: true }, ...listing];
}

function projectsRows(p) {
  const sW = Math.max(...p.rows.map((r) => r.status.length)) + 3;
  const nW = Math.max(...p.rows.map((r) => r.name.length)) + 3;
  const cmd = { segs: [{ text: "~/projects $ ", tone: "prompt" }, { text: p.command, tone: "cmd" }] };
  const listing = p.rows.map((r) => ({
    segs: [
      { text: pad(r.status, sW), tone: "amber" },
      { text: pad(r.name, nW), tone: "cmd" },
      { text: r.desc, tone: "comment" },
    ],
  }));
  return [cmd, { gap: true }, ...listing];
}

function tieredRows(s, ctx) {
  const w = Math.max(...s.tiers.map((t) => t.tier.length)) + 2; // for "[tier]"
  const cmd = { segs: [{ text: `~/${ctx} $ `, tone: "prompt" }, { text: s.command, tone: "cmd" }] };
  const lines = s.tiers.map((t) => ({
    segs: [{ text: pad(`[${t.tier}]`, w + 2), tone: "comment" }, { text: " " + t.tools, tone: "cmd" }],
  }));
  return [cmd, { gap: true }, ...lines];
}

function keyedRows(block, ctx) {
  const w = Math.max(...block.rows.map((r) => r.key.length)) + 2;
  const cmd = { segs: [{ text: `~/${ctx} $ `, tone: "prompt" }, { text: block.command, tone: "cmd" }] };
  const lines = block.rows.map((r) => ({
    segs: [{ text: pad(r.key, w), tone: "comment" }, { text: r.val, tone: "cmd" }],
  }));
  return [cmd, { gap: true }, ...lines];
}

// --- emit -----------------------------------------------------------------

const panes = {
  publications: { title: cfg.publications.title, rows: publicationsRows(cfg.publications) },
  projects: { title: cfg.projects.title, rows: projectsRows(cfg.projects) },
  stack: { title: cfg.stack.title, rows: tieredRows(cfg.stack, "stack") },
  life: { title: cfg.life.title, rows: keyedRows(cfg.life, "life") },
  contact: { title: cfg.contact.title, rows: keyedRows(cfg.contact, "contact") },
};

for (const [name, pane] of Object.entries(panes)) {
  for (const theme of ["light", "dark"]) {
    const svg = renderTerminal({ title: pane.title, rows: pane.rows, theme });
    writeFileSync(resolve(outDir, `${name}-${theme}.svg`), svg);
  }
}

// Animated hero (typing effect + blinking caret).
for (const theme of ["light", "dark"]) {
  const svg = renderTerminal({ title: cfg.hero.title, rows: cfg.hero.rows, theme, animate: true });
  writeFileSync(resolve(outDir, `hero-${theme}.svg`), svg);
}

console.log(`Wrote ${Object.keys(panes).length * 2 + 2} pane SVGs (incl. hero) to assets/`);
