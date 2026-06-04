# Terminal-Session Profile README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `tonyyunyang/tonyyunyang` profile README as a single, light/dark-adaptive terminal session (animated hero, static panes, restyled live contribution ledger), generated from one content config.

**Architecture:** A dependency-free Node generator (`scripts/lib/terminal.mjs` + `scripts/build-panes.mjs`) reads `content/profile.json` and emits per-pane terminal-window SVGs (light + dark) into `assets/`. The existing `scripts/build-ledger.mjs` keeps its GitHub data fetch and stats, but its renderer is swapped to the same terminal style. `README.md` becomes thin markdown: `<picture>` panes interleaved with real shields.io link buttons (links cannot live inside an `<img>` SVG), plus the ledger and an accessible plain-text mirror.

**Tech Stack:** Node 20 (ESM `.mjs`, built-in `fetch`, built-in `node:test` runner — no npm dependencies), hand-written SVG, GitHub-flavored Markdown with `<picture>`, shields.io badges, existing GitHub Actions (`studio.yml`, unchanged).

**Authoritative spec:** `docs/superpowers/specs/2026-06-04-profile-terminal-redesign-design.md`. Read it before starting. This plan implements it.

---

## Required inputs before Task 3 (from Tony)

These are the spec's §11 open items. Get them from Tony (or use the marked fallbacks) when filling `content/profile.json` in Task 3. They do not block Tasks 1, 2.

1. **`[ai]` line** — confirmed: `claude code`, `codex`, `cursor`. Needed: the name (and optional repo URL) of Tony's own harness framework; correct spelling of the OSS agents (`pi-agent`? was "harmess" → `harness`?) and any others.
2. **`[infra]` line** — Tony's real model stack (serving / routing / training). Fallback if unanswered: omit the `[infra]` line entirely rather than ship a guess.
3. **`~/projects` pane (Task 6, optional)** — include curated 3 or skip. If included, content comes from `../tonyyunyang.github.io/src/content/projects/*.mdx`.

---

## File structure

**Create**
- `package.json` — no dependencies; declares `"type": "module"` and convenience scripts. Single source for run commands.
- `scripts/lib/terminal.mjs` — the reusable core: color themes, XML escaping, and `renderTerminal()` that builds one terminal-window SVG (static or animated) from structured line data. One responsibility: turn line data + theme into an SVG string.
- `scripts/lib/terminal.test.mjs` — `node:test` unit tests for the pure helpers and renderer output.
- `content/profile.json` — all pane copy (hero, publications, stack, life, contact, footer). The only file you edit to change wording later.
- `scripts/build-panes.mjs` — reads `content/profile.json`, calls `renderTerminal()`, writes `assets/<pane>-{light,dark}.svg`.
- `scripts/build-panes.test.mjs` — `node:test` checks that generated panes are valid XML, contain expected content, and carry no em-dashes.
- `scripts/lib/fixtures/calendar.json` — a small fake GitHub contribution calendar so the ledger renderer can be tested offline.

**Modify**
- `scripts/build-ledger.mjs` — keep `fetchCalendar`, the stats functions, and `main`; replace the `svg()` renderer with one that uses `renderTerminal()` (terminal `~/log $ git log` pane). Keep writing `dist/ledger-{light,dark}.svg`.
- `README.md` — full rewrite (panes + link rows + ledger + footer + a11y mirror).
- `.gitignore` — add the `.superpowers/` line (brainstorming companion artifacts) if not already present.

**Delete (retire)**
- `assets/banner-light.svg`, `assets/banner-dark.svg`
- `assets/ornament-light.svg`, `assets/ornament-dark.svg`
- `assets/locator-light.svg`, `assets/locator-dark.svg`
- `assets/stack-light.svg`, `assets/stack-dark.svg`

**Unchanged**
- `.github/workflows/studio.yml` (still renders the ledger to the `output` branch twice daily + on push to `main`).

---

## Task 1: Scaffold + shared theme/escape helpers

**Files:**
- Create: `package.json`
- Create: `scripts/lib/terminal.mjs`
- Test: `scripts/lib/terminal.test.mjs`

- [ ] **Step 1: Create `package.json` (no deps)**

```json
{
  "name": "tonyyunyang-profile",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "build:panes": "node scripts/build-panes.mjs",
    "build:ledger": "node scripts/build-ledger.mjs",
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Write the failing test for `escapeXml` + `THEMES`**

Create `scripts/lib/terminal.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeXml, THEMES } from "./terminal.mjs";

test("escapeXml escapes the five XML-significant characters", () => {
  assert.equal(escapeXml(`a & b < c > d " e ' f`), "a &amp; b &lt; c &gt; d &quot; e &#39; f");
});

test("escapeXml leaves CJK and the middle dot untouched", () => {
  assert.equal(escapeXml("杨童耘 · 瓜子"), "杨童耘 · 瓜子");
});

test("THEMES expose light + dark with the required tone keys", () => {
  for (const name of ["light", "dark"]) {
    const t = THEMES[name];
    for (const k of ["win", "bar", "border", "prompt", "cmd", "out", "comment", "amber", "dotR", "dotY", "dotG", "shadow"]) {
      assert.ok(t[k], `THEMES.${name}.${k} missing`);
    }
  }
});
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `node --test scripts/lib/terminal.test.mjs`
Expected: FAIL (cannot find module `./terminal.mjs` / export missing).

- [ ] **Step 4: Implement `THEMES` + `escapeXml` in `scripts/lib/terminal.mjs`**

```js
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
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `node --test scripts/lib/terminal.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/lib/terminal.mjs scripts/lib/terminal.test.mjs
git commit -m "Add terminal SVG scaffold: themes + xml escaping"
```

---

## Task 2: `renderTerminal()` — the terminal-window builder (static)

Renders one terminal window: a rounded `win` rect with a soft shadow, a title bar with three traffic-light dots + a mono title, then body lines. Each body line is an array of colored segments. Mono metrics let columns align via space-padding done by callers.

**Files:**
- Modify: `scripts/lib/terminal.mjs`
- Test: `scripts/lib/terminal.test.mjs`

- [ ] **Step 1: Add failing tests for `renderTerminal`**

Append to `scripts/lib/terminal.test.mjs`:

```js
import { renderTerminal } from "./terminal.mjs";

const sample = {
  title: "tony@amsterdam: ~",
  rows: [
    { segs: [{ text: "~ $ ", tone: "prompt" }, { text: "whoami", tone: "cmd" }] },
    { segs: [{ text: "Tony Yang · 杨童耘", tone: "amber" }] },
    { gap: true },
    { segs: [{ text: "# done", tone: "comment" }] },
  ],
};

test("renderTerminal returns a single well-formed <svg> root", () => {
  const svg = renderTerminal({ ...sample, theme: "light" });
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /<svg[^>]+viewBox="0 0 860 /);
  assert.equal((svg.match(/<\/svg>/g) || []).length, 1);
});

test("renderTerminal prints the title and the line text", () => {
  const svg = renderTerminal({ ...sample, theme: "light" });
  assert.ok(svg.includes("tony@amsterdam: ~"));
  assert.ok(svg.includes("whoami"));
  assert.ok(svg.includes("杨童耘"));
});

test("renderTerminal applies theme colors (dark prompt green)", () => {
  const svg = renderTerminal({ ...sample, theme: "dark" });
  assert.ok(svg.includes("#5BC795"), "dark prompt color present");
  assert.ok(svg.includes("#0F1417"), "dark window color present");
});

test("renderTerminal height grows with row count", () => {
  const one = renderTerminal({ title: "t", rows: [{ segs: [{ text: "a", tone: "cmd" }] }], theme: "light" });
  const many = renderTerminal({ title: "t", rows: Array.from({ length: 6 }, () => ({ segs: [{ text: "a", tone: "cmd" }] })), theme: "light" });
  const h = (s) => Number(s.match(/viewBox="0 0 860 (\d+)"/)[1]);
  assert.ok(h(many) > h(one));
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test scripts/lib/terminal.test.mjs`
Expected: FAIL (`renderTerminal` is not exported).

- [ ] **Step 3: Implement `renderTerminal` (static path) in `scripts/lib/terminal.mjs`**

Append:

```js
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
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test scripts/lib/terminal.test.mjs`
Expected: PASS (all Task 1 + Task 2 tests).

- [ ] **Step 5: Eyeball one real SVG**

Run: `node -e "import('./scripts/lib/terminal.mjs').then(m=>process.stdout.write(m.renderTerminal({title:'tony@amsterdam: ~',rows:[{segs:[{text:'~ \$ ',tone:'prompt'},{text:'whoami',tone:'cmd'}]},{segs:[{text:'Tony Yang',tone:'amber'}]}],theme:'light'})))" > /tmp/pane.svg && open /tmp/pane.svg`
Expected: a cream terminal window with a title bar, three dots, and two lines. (On Linux use `xdg-open`.)

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/terminal.mjs scripts/lib/terminal.test.mjs
git commit -m "Add static terminal-window renderer"
```

---

## Task 3: Content config (`content/profile.json`)

All copy in one place. Fill the `[ai]`/`[infra]` values from the "Required inputs" section. Voice is terse; **no em-dashes**.

**Files:**
- Create: `content/profile.json`

- [ ] **Step 1: Write `content/profile.json`**

Tones: `prompt`, `cmd`, `out`, `comment`, `amber`. `gap:true` is a blank spacer line. `typed:true` marks a segment the hero animation should "type" (ignored by static panes).

```json
{
  "links": {
    "site": "https://tonyyunyang.github.io",
    "scholar": "https://scholar.google.com/citations?hl=en&user=rIFdBYAAAAAJ",
    "email": "tonyyunyang@outlook.com",
    "github": "https://github.com/tonyyunyang",
    "cvEn": "https://tonyyunyang.github.io/cv-en.pdf",
    "cvZh": "https://tonyyunyang.github.io/cv-zh.pdf"
  },
  "hero": {
    "title": "tony@amsterdam: ~",
    "rows": [
      { "segs": [{ "text": "~ $ ", "tone": "prompt" }, { "text": "whoami", "tone": "cmd", "typed": true }] },
      { "segs": [{ "text": "Tony (Tongyun) Yang · 杨童耘", "tone": "amber" }] },
      { "segs": [{ "text": "Independent AI Researcher · Amsterdam", "tone": "comment" }] },
      { "gap": true },
      { "segs": [{ "text": "~ $ ", "tone": "prompt" }, { "text": "cat focus.txt", "tone": "cmd", "typed": true }] },
      { "segs": [{ "text": "the scaling race is becoming a systems race.", "tone": "cmd" }] },
      { "segs": [{ "text": "bigger models still matter, but they are not enough.", "tone": "cmd" }] },
      { "segs": [{ "text": "what counts is how we train, route, compress, and ship them.", "tone": "cmd" }] },
      { "segs": [{ "text": "building AI that is capable, efficient, and genuinely useful.", "tone": "cmd" }] },
      { "gap": true },
      { "segs": [{ "text": "~ $ ", "tone": "prompt" }, { "text": "open-to-work --roles", "tone": "cmd", "typed": true }] },
      { "segs": [{ "text": "left my PhD fellowship this spring; clearer now on what's next.", "tone": "out" }] },
      { "segs": [{ "text": "open", "tone": "amber" }, { "text": " to research · academia or industry", "tone": "cmd" }] }
    ]
  },
  "publications": {
    "title": "tony@amsterdam: ~/publications",
    "command": "ls -lt",
    "rows": [
      { "venue": "ACM CAIS '26", "name": "twinrouterbench", "desc": "agentic LLM routing bench · cuts cost 53%" },
      { "venue": "ACM CAIS '26", "name": "mera", "desc": "trace-driven routing · 87% acc at ~half cost" },
      { "venue": "IMWUT '25", "name": "through-the-eyes-of-emotion", "desc": "eye-tracking dataset · emotion in VR" },
      { "venue": "MICCAI '25", "name": "reverse-imaging", "desc": "any-sequence cardiac MRI segmentation" },
      { "venue": "MIDL '25", "name": "pruning-nnunet", "desc": "80%+ weights pruned · dice >0.95" }
    ]
  },
  "stack": {
    "title": "tony@amsterdam: ~/stack",
    "command": "cat stack.toml",
    "tiers": [
      { "tier": "daily", "tools": "python · pytorch · cuda · latex" },
      { "tier": "ai", "tools": "claude code · codex · cursor · FILL_HARNESS · FILL_OSS_AGENTS" },
      { "tier": "infra", "tools": "FILL_INFRA_OR_REMOVE_THIS_TIER" },
      { "tier": "often", "tools": "tensorflow · unity · typescript · c++ · linux" },
      { "tier": "shelf", "tools": "react · node · docker · git" }
    ]
  },
  "life": {
    "title": "tony@amsterdam: ~/life",
    "command": "cat .life",
    "rows": [
      { "key": "from", "val": "sichuan → now amsterdam" },
      { "key": "cook", "val": "sichuan wok · never a covered pot" },
      { "key": "sport", "val": "tennis (pure drive) · half-marathon 1:43:53" },
      { "key": "read", "val": "sartre · borges · tulips each spring" },
      { "key": "soon", "val": "adopting 瓜子, a 狸花猫" }
    ]
  },
  "contact": {
    "title": "tony@amsterdam: ~/contact",
    "command": "./contact.sh",
    "rows": [
      { "key": "email", "val": "tonyyunyang@outlook.com" },
      { "key": "github", "val": "github.com/tonyyunyang" },
      { "key": "scholar", "val": "scholar.google.com/citations" },
      { "key": "site", "val": "tonyyunyang.github.io" }
    ]
  },
  "footer": "# static svg panes + one live ledger · adaptive light/dark · hand-built, no template"
}
```

- [ ] **Step 2: Replace the three `FILL_*` placeholders**

Use Tony's answers (Required inputs section). If `[infra]` is unknown, delete the entire `{ "tier": "infra", ... }` object rather than ship a guess. Verify no `FILL_` remains:

Run: `grep -n "FILL_" content/profile.json || echo "no placeholders left"`
Expected: `no placeholders left`.

- [ ] **Step 3: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('content/profile.json','utf8')); console.log('valid json')"`
Expected: `valid json`.

- [ ] **Step 4: Commit**

```bash
git add content/profile.json
git commit -m "Add profile content config"
```

---

## Task 4: `build-panes.mjs` — generate the static panes

Generates `publications`, `stack`, `life`, `contact` (light + dark) from the config. Column alignment is done here by space-padding (monospace), so `renderTerminal` stays generic.

**Files:**
- Create: `scripts/build-panes.mjs`
- Test: `scripts/build-panes.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `scripts/build-panes.test.mjs`:

```js
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

before(() => execFileSync("node", ["scripts/build-panes.mjs"], { stdio: "inherit" }));

const PANES = ["publications", "stack", "life", "contact"];

test("every static pane is written in both themes", () => {
  for (const p of PANES) for (const th of ["light", "dark"]) {
    assert.ok(existsSync(`assets/${p}-${th}.svg`), `assets/${p}-${th}.svg missing`);
  }
});

test("panes are well-formed single-root svg with no em-dash", () => {
  for (const p of PANES) {
    const svg = readFileSync(`assets/${p}-light.svg`, "utf8");
    assert.match(svg, /^<\?xml/);
    assert.equal((svg.match(/<\/svg>/g) || []).length, 1);
    assert.ok(!svg.includes("—") && !svg.includes("–"), `${p} contains a dash glyph`);
  }
});

test("publications pane lists all five papers and aligns columns", () => {
  const svg = readFileSync("assets/publications-light.svg", "utf8");
  for (const name of ["twinrouterbench", "mera", "through-the-eyes-of-emotion", "reverse-imaging", "pruning-nnunet"]) {
    assert.ok(svg.includes(name), `missing ${name}`);
  }
});

test("stack pane shows the [ai] tier", () => {
  const svg = readFileSync("assets/stack-light.svg", "utf8");
  assert.ok(svg.includes("[ai]"));
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test scripts/build-panes.test.mjs`
Expected: FAIL (`scripts/build-panes.mjs` does not exist).

- [ ] **Step 3: Implement `scripts/build-panes.mjs`**

```js
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
console.log(`Wrote ${Object.keys(panes).length * 2} static pane SVGs to assets/`);
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test scripts/build-panes.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Visually check a couple of panes (light + dark)**

Run: `open assets/publications-light.svg assets/stack-dark.svg`
Expected: aligned terminal panes; dark window separates from a dark backdrop. (If the dark window reads too close to a dark page, nudge `THEMES.dark.win`/`bar` lighter in `terminal.mjs` and rerun `npm run build:panes`.)

- [ ] **Step 6: Commit**

```bash
git add scripts/build-panes.mjs scripts/build-panes.test.mjs assets/publications-*.svg assets/stack-*.svg assets/life-*.svg assets/contact-*.svg
git commit -m "Generate static terminal panes from config"
```

---

## Task 5: Hero pane + typing animation

The hero is generated like a static pane but with `animate: true`, which injects a `<style>` block: command segments marked `typed:true` reveal left-to-right via an animated clip, output lines fade in staggered, and a caret blinks at the end. A `prefers-reduced-motion` rule shows everything instantly.

**Files:**
- Modify: `scripts/lib/terminal.mjs` (replace `buildAnimation`)
- Modify: `scripts/build-panes.mjs` (emit hero)
- Test: `scripts/build-panes.test.mjs`

- [ ] **Step 1: Add a failing test for the hero**

Append to `scripts/build-panes.test.mjs`:

```js
test("hero pane exists in both themes and is animated + reduced-motion safe", () => {
  for (const th of ["light", "dark"]) {
    const svg = readFileSync(`assets/hero-${th}.svg`, "utf8");
    assert.ok(svg.includes("@keyframes"), `hero-${th} has no animation`);
    assert.ok(svg.includes("prefers-reduced-motion"), `hero-${th} missing reduced-motion guard`);
    assert.ok(svg.includes("whoami") && svg.includes("systems race"), `hero-${th} missing copy`);
  }
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test scripts/build-panes.test.mjs`
Expected: FAIL (`hero-light.svg` not found / no `@keyframes`).

- [ ] **Step 3: Replace `buildAnimation` in `scripts/lib/terminal.mjs`**

Replace the stub `function buildAnimation() { return { style: "", overlay: "" }; }` with:

```js
// Animated hero: per-line reveal + typed-command clip reveal + blinking caret.
// CSS-in-SVG runs when the SVG is loaded via <img> on GitHub, and honors
// prefers-reduced-motion. Tunables:
const STEP = 0.55;   // seconds between successive commands starting
const TYPE = 0.5;    // seconds to "type" a command
const CHAR_W = 9.02; // approx advance width of JetBrains Mono at 15px

function buildAnimation(rows, t, bodyTop) {
  let clip = "";
  let css = `
  .ln { opacity: 0; animation: appear 0.01s linear forwards; }
  @keyframes appear { to { opacity: 1; } }
  .ca { animation: blink 1.05s steps(2, start) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .ln { opacity: 1; animation: none; }
    .ty { width: 100% !important; animation: none; }
    .ca { animation: none; }
  }`;

  // Compute a reveal time per row. Commands "type"; their outputs follow.
  let clock = 0.2;
  const delays = rows.map((row) => {
    if (row.gap) return null;
    const isCmd = row.segs.some((s) => s.typed);
    const d = clock;
    clock += isCmd ? TYPE + 0.15 : 0.2;
    if (isCmd) clock += STEP - 0.2; // a little breathing room after each command block
    return d;
  });

  // Per-row CSS reveal delay.
  rows.forEach((row, i) => {
    if (delays[i] == null) return;
    css += `\n  .ln-${i} { animation-delay: ${delays[i].toFixed(2)}s; }`;
    const typed = row.segs.find((s) => s.typed);
    if (typed) {
      const chars = typed.text.length;
      const w = (chars * CHAR_W).toFixed(1);
      css += `\n  #ty-${i} rect { animation: type-${i} ${TYPE}s steps(${chars}) ${delays[i].toFixed(2)}s forwards; }`;
      css += `\n  @keyframes type-${i} { from { width: 0; } to { width: ${w}px; } }`;
      clip += `<clipPath id="ty-${i}"><rect x="0" y="0" width="0" height="${LINE_H + 4}" class="ty"/></clipPath>`;
    }
  });

  const caretY = bodyTop + (rows.length - 1) * LINE_H;
  const overlay = `<rect class="ca" x="${PAD_X}" y="${caretY - FONT_SIZE + 2}" width="9" height="${FONT_SIZE + 2}" fill="${t.prompt}"/>`;

  return { style: `<style>${css}\n  </style><defs>${clip}</defs>`, overlay };
}
```

Then make line rendering animation-aware. Replace the `lines` construction inside `renderTerminal` with one that adds classes and wraps typed segments in their clip group. Change `bodyLine` to accept `(row, t, y, i, animate)`:

```js
function bodyLine(row, t, y, i, animate) {
  if (row.gap) return "";
  const cls = animate ? ` class="ln ln-${i}"` : "";
  const tspans = row.segs
    .map((seg) => {
      const fill = t[TONE_KEY[seg.tone] || "out"];
      const span = `<tspan fill="${fill}">${escapeXml(seg.text)}</tspan>`;
      if (animate && seg.typed) {
        // Wrap just the typed text in a clipped group that widens over time.
        return `</text><g clip-path="url(#ty-${i})"><text x="${PAD_X}" y="${y}" xml:space="preserve" font-family="${FONT}" font-size="${FONT_SIZE}"><tspan fill="${fill}">${escapeXml(seg.text)}</tspan></text></g><text x="${PAD_X}" y="${y}" xml:space="preserve" font-family="${FONT}" font-size="${FONT_SIZE}" visibility="hidden">`;
      }
      return span;
    })
    .join("");
  return `<text x="${PAD_X}" y="${y}"${cls} xml:space="preserve" font-family="${FONT}" font-size="${FONT_SIZE}">${tspans}</text>`;
}
```

> Note for the implementer: the typed-segment wrapping above is the one fiddly part. The intent: the prompt (`~ $ `) renders normally; the command text renders twice, once inside an animated clip (visible, widening) and once hidden (to reserve layout). If the nested `</text>...<text>` splicing proves awkward, the simpler equivalent is to render each animated row as: a normal `<text>` for the prompt, then a separate clipped `<text>` for the command positioned at `x = PAD_X + promptChars*CHAR_W`. Either is fine; verify visually in Step 5.

Update the `.map` call in `renderTerminal` to pass `i` and `animate`:

```js
  const lines = rows
    .map((row, i) => bodyLine(row, t, bodyTop + i * LINE_H, i, animate))
    .filter(Boolean)
    .join("\n  ");
```

- [ ] **Step 4: Emit the hero in `scripts/build-panes.mjs`**

Add hero generation before the `console.log`:

```js
for (const theme of ["light", "dark"]) {
  const svg = renderTerminal({ title: cfg.hero.title, rows: cfg.hero.rows, theme, animate: true });
  writeFileSync(resolve(outDir, `hero-${theme}.svg`), svg);
}
```

- [ ] **Step 5: Run tests, then watch it animate in a browser**

Run: `npm run build:panes && node --test`
Expected: all tests PASS.

Run: `open assets/hero-light.svg` then `open assets/hero-dark.svg`
Expected: the three commands type out in sequence with a blinking caret. Toggle OS "reduce motion" and reload: everything shows instantly, caret steady. If GitHub's image proxy later strips the CSS animation (check after the README ships), set the hero to static by calling `renderTerminal({... animate:false})` and rerun; the page still works.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/terminal.mjs scripts/build-panes.mjs scripts/build-panes.test.mjs assets/hero-light.svg assets/hero-dark.svg
git commit -m "Add animated terminal hero pane"
```

---

## Task 6 (OPTIONAL): `~/projects` pane

Only if Tony chose to include it. Source content from `../tonyyunyang.github.io/src/content/projects/*.mdx`.

**Files:**
- Modify: `content/profile.json` (add a `projects` block)
- Modify: `scripts/build-panes.mjs` (emit it, between publications and stack)

- [ ] **Step 1: Add a `projects` block to `content/profile.json`**

```json
"projects": {
  "title": "tony@amsterdam: ~/projects",
  "command": "ls -lt",
  "rows": [
    { "status": "in-progress", "name": "human-intent-world-model", "desc": "VLM reads customer intent · MeetaVista" },
    { "status": "in-progress", "name": "llm-router", "desc": "routing benchmark · NeurIPS '26 under review" },
    { "status": "self-driven", "name": "polymarket-decoder", "desc": "order-book study of prediction markets" }
  ]
}
```

- [ ] **Step 2: Emit it in `scripts/build-panes.mjs`**

Add a `projectsRows` builder (mirror `publicationsRows`, using `status` in the amber column) and include `projects` in the `panes` object. Reuse the `pad` alignment helper.

```js
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
// add to panes: projects: { title: cfg.projects.title, rows: projectsRows(cfg.projects) },
```

- [ ] **Step 3: Build + visually verify**

Run: `npm run build:panes && open assets/projects-light.svg`
Expected: a three-row projects listing.

- [ ] **Step 4: Commit**

```bash
git add content/profile.json scripts/build-panes.mjs assets/projects-*.svg
git commit -m "Add optional projects pane"
```

---

## Task 7: Restyle the contribution ledger into a `~/log` terminal pane

Keep `fetchCalendar`, all stat functions, and `main` in `scripts/build-ledger.mjs`. Replace only the `svg(theme, stats, calendar)` renderer so the plate becomes a terminal window: a `git log` command line, a contribution heatmap drawn in the theme's accent ramp, and a terse stats line. Add an offline fixture so it is testable without a token.

**Files:**
- Create: `scripts/lib/fixtures/calendar.json`
- Modify: `scripts/build-ledger.mjs`
- Test: `scripts/build-ledger.test.mjs`

- [ ] **Step 1: Create a small calendar fixture**

Create `scripts/lib/fixtures/calendar.json` (3 weeks is enough to test stats + rendering):

```json
{
  "totalContributions": 1240,
  "weeks": [
    { "firstDay": "2026-05-11", "contributionDays": [
      { "date": "2026-05-11", "contributionCount": 0, "weekday": 0 },
      { "date": "2026-05-12", "contributionCount": 2, "weekday": 1 },
      { "date": "2026-05-13", "contributionCount": 5, "weekday": 2 },
      { "date": "2026-05-14", "contributionCount": 9, "weekday": 3 },
      { "date": "2026-05-15", "contributionCount": 1, "weekday": 4 },
      { "date": "2026-05-16", "contributionCount": 0, "weekday": 5 },
      { "date": "2026-05-17", "contributionCount": 3, "weekday": 6 }
    ] },
    { "firstDay": "2026-05-18", "contributionDays": [
      { "date": "2026-05-18", "contributionCount": 4, "weekday": 0 },
      { "date": "2026-05-19", "contributionCount": 6, "weekday": 1 },
      { "date": "2026-05-20", "contributionCount": 7, "weekday": 2 },
      { "date": "2026-05-21", "contributionCount": 2, "weekday": 3 },
      { "date": "2026-05-22", "contributionCount": 1, "weekday": 4 },
      { "date": "2026-05-23", "contributionCount": 0, "weekday": 5 },
      { "date": "2026-05-24", "contributionCount": 8, "weekday": 6 }
    ] }
  ]
}
```

- [ ] **Step 2: Refactor `build-ledger.mjs` so the renderer is importable and testable**

Make three changes:

(a) At the top of the stat helpers region, export a pure `computeStats(calendar)` that wraps the existing `flattenDays` + `streaks` + ranges + `lastNDays` + `findPeak` (move the body of the current `main` stats assembly into it):

```js
export function computeStats(calendar) {
  const days = flattenDays(calendar);
  const { current, longest } = streaks(days);
  return {
    total: calendar.totalContributions,
    current, longest,
    currentRange: streakDateRange(days),
    longestRange: longestRange(days),
    last30: lastNDays(days, 30),
    peak: findPeak(days),
    allDays: days,
    weeks: calendar.weeks,
  };
}
```

(b) Replace the entire `function svg(theme, stats, calendar) { ... }` with a terminal renderer that reuses `renderTerminal`. Add at the top: `import { renderTerminal, THEMES } from "./lib/terminal.mjs";` and a heatmap helper:

```js
// Build the contribution heatmap as an SVG fragment positioned under the
// terminal body. cellRamp goes quiet -> loud in the theme accent.
function heatmap(weeks, theme, originX, originY) {
  const t = THEMES[theme];
  const ramp = theme === "dark"
    ? ["#1b2a26", "#1f4d40", "#2f7d68", t.prompt, "#7be8cf"]
    : ["#e6decb", "#bcd3c4", "#7fae9b", "#3f8a72", t.prompt];
  const CELL = 11, GAP = 3, col = CELL + GAP;
  let cells = "";
  weeks.forEach((w, x) => {
    w.contributionDays.forEach((d) => {
      const lvl = d.contributionCount === 0 ? 0 : d.contributionCount < 3 ? 1 : d.contributionCount < 6 ? 2 : d.contributionCount < 12 ? 3 : 4;
      const cx = originX + x * col, cy = originY + d.weekday * col;
      cells += `<rect x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="2" fill="${ramp[lvl]}"/>`;
    });
  });
  return cells;
}
```

Then a `renderLedger(theme, stats)` that composes the terminal text rows + appends the heatmap + a stats line. The simplest robust approach: render the terminal with the command + a few output rows via `renderTerminal`, but because the heatmap is graphical, render the window with `renderTerminal` sized to leave room, then splice the heatmap before `</svg>`. Concretely:

```js
function renderLedger(theme, stats) {
  const t = THEMES[theme];
  const busiest = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // index by weekday if you compute it; else omit
  const rows = [
    { segs: [{ text: "~/log $ ", tone: "prompt" }, { text: 'git log --stat --since="1 year ago"', tone: "cmd" }] },
    { gap: true },
    { segs: [
      { text: `commits ${stats.total.toLocaleString()}`, tone: "amber" },
      { text: `   current ${stats.current}d`, tone: "out" },
      { text: `   longest ${stats.longest}d`, tone: "out" },
    ] },
    { gap: true },
    { gap: true }, { gap: true }, { gap: true }, { gap: true }, { gap: true }, { gap: true }, { gap: true }, // room for the heatmap (7 rows)
    { segs: [{ text: "# regenerated twice a day by a github action", tone: "comment" }] },
  ];
  let svg = renderTerminal({ title: "tony@amsterdam: ~/log", rows, theme });
  // Splice the heatmap into the reserved band. originY aligns to the first gap band.
  const originX = 22, originY = 38 + 18 + 24 * 4; // BAR_H + PAD_TOP + four rows down
  svg = svg.replace("</svg>", `${heatmap(stats.weeks, theme, originX, originY)}\n</svg>`);
  return svg;
}
```

(c) Update `main` to use them:

```js
const calendar = await fetchCalendar();
const stats = computeStats(calendar);
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "ledger-light.svg"), renderLedger("light", stats));
writeFileSync(resolve(outDir, "ledger-dark.svg"), renderLedger("dark", stats));
console.log(`Wrote ledger SVGs (total=${stats.total}, current=${stats.current}, longest=${stats.longest})`);
```

Remove the now-unused old `svg()` helpers (`measureNumber`, `withAlpha`, sparkline code) if nothing else references them.

- [ ] **Step 3: Write the offline test**

Create `scripts/build-ledger.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeStats } from "./build-ledger.mjs";

const cal = JSON.parse(readFileSync("scripts/lib/fixtures/calendar.json", "utf8"));

test("computeStats totals and streaks from the fixture", () => {
  const s = computeStats(cal);
  assert.equal(s.total, 1240);
  assert.equal(s.longest, 5); // 05-18..05-22 is 5 consecutive non-zero days
});
```

> Note: importing `build-ledger.mjs` must not trigger the network `fetch`/`process.exit`. Guard the `main` body so it only runs when executed directly: wrap the bottom-of-file `await fetchCalendar()...` block in `if (import.meta.url === \`file://${process.argv[1]}\`) { ... }`. Keep `computeStats` and renderers as plain exports above that guard.

- [ ] **Step 4: Run tests**

Run: `node --test scripts/build-ledger.test.mjs`
Expected: PASS.

- [ ] **Step 5: Render real ledgers with a token + eyeball them**

Run: `GITHUB_TOKEN=<a token with read:user> GH_USER=tonyyunyang node scripts/build-ledger.mjs && open dist/ledger-light.svg dist/ledger-dark.svg`
Expected: a terminal `~/log` window with the `git log` line, a heatmap, and the stats line. Adjust `originY`/row count if the heatmap overlaps text.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-ledger.mjs scripts/build-ledger.test.mjs scripts/lib/fixtures/calendar.json
git commit -m "Restyle contribution ledger into a terminal log pane"
```

---

## Task 8: Rewrite `README.md` (panes + links + ledger + a11y)

Thin markdown: each pane as a `<picture>` (dark source + light `<img>` fallback), real shields.io link rows between panes, the ledger from the `output` branch, a footer, and a collapsed plain-text mirror for accessibility/search.

**Files:**
- Modify: `README.md` (full replacement)
- Delete: the eight retired `assets/*.svg`

- [ ] **Step 1: Replace `README.md` with this exact content**

Fill paper/code/site/data URLs from the spec appendix. Badge label/value text must URL-encode spaces (`_` or `%20`) and commas (`%2C`).

````markdown
<!-- Hand-built terminal-session profile. Panes are generated by
     scripts/build-panes.mjs from content/profile.json. The ~/log pane is
     regenerated twice daily by .github/workflows/studio.yml. Do not hand-edit
     the SVGs; edit content/profile.json and rerun `npm run build:panes`. -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg">
    <img alt="tony@amsterdam:~ $ whoami — Tony (Tongyun) Yang, Independent AI Researcher in Amsterdam. focus.txt: the scaling race is becoming a systems race; what counts is how we train, route, compress, and ship models. open-to-work: left my PhD fellowship this spring, open to research roles in academia or industry." src="./assets/hero-light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://tonyyunyang.github.io/"><img alt="site" src="https://img.shields.io/badge/site-tonyyunyang.github.io-0E5347?style=flat-square&labelColor=EDE6D5&logo=safari&logoColor=0E5347"></a>
  <a href="https://scholar.google.com/citations?hl=en&user=rIFdBYAAAAAJ"><img alt="scholar" src="https://img.shields.io/badge/scholar-profile-0E5347?style=flat-square&labelColor=EDE6D5&logo=googlescholar&logoColor=0E5347"></a>
  <a href="mailto:tonyyunyang@outlook.com"><img alt="email" src="https://img.shields.io/badge/email-outlook-0E5347?style=flat-square&labelColor=EDE6D5&logo=maildotru&logoColor=0E5347"></a>
  <a href="https://tonyyunyang.github.io/cv-en.pdf"><img alt="cv en" src="https://img.shields.io/badge/cv-en-0E5347?style=flat-square&labelColor=EDE6D5&logo=readthedocs&logoColor=0E5347"></a>
  <a href="https://tonyyunyang.github.io/cv-zh.pdf"><img alt="cv zh" src="https://img.shields.io/badge/cv-%E4%B8%AD%E6%96%87-0E5347?style=flat-square&labelColor=EDE6D5&logo=readthedocs&logoColor=0E5347"></a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/publications-dark.svg">
    <img alt="~/publications $ ls -lt — twinrouterbench (ACM CAIS 2026), mera (ACM CAIS 2026), through-the-eyes-of-emotion (IMWUT 2025), reverse-imaging (MICCAI 2025), pruning-nnunet (MIDL 2025)." src="./assets/publications-light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://openreview.net/forum?id=UWvHJtnmc2"><img alt="twinrouterbench paper" src="https://img.shields.io/badge/twinrouterbench-paper-0E5347?style=flat-square&labelColor=EDE6D5"></a>
  <a href="https://github.com/CommonstackAI/TwinRouterBench"><img alt="twinrouterbench code" src="https://img.shields.io/badge/code-_-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>
  <a href="https://commonstackai.github.io/TwinRouterBench/"><img alt="twinrouterbench site" src="https://img.shields.io/badge/site-_-0E5347?style=flat-square&labelColor=EDE6D5"></a>
  &nbsp;
  <a href="https://openreview.net/forum?id=6oyBiDMCHs"><img alt="mera paper" src="https://img.shields.io/badge/mera-paper-0E5347?style=flat-square&labelColor=EDE6D5"></a>
  <a href="https://github.com/zeyuyuyu/router-skills-evolve"><img alt="mera code" src="https://img.shields.io/badge/code-_-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>
  <br>
  <a href="https://dl.acm.org/doi/abs/10.1145/3749545"><img alt="through-the-eyes paper" src="https://img.shields.io/badge/through--the--eyes-paper-0E5347?style=flat-square&labelColor=EDE6D5"></a>
  <a href="https://github.com/MultiRepEyeVR/Through-the-Eyes-of-Emotion"><img alt="through-the-eyes code" src="https://img.shields.io/badge/code-_-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>
  <a href="https://zenodo.org/records/16790658"><img alt="through-the-eyes data" src="https://img.shields.io/badge/data-zenodo-0E5347?style=flat-square&labelColor=EDE6D5&logo=zenodo&logoColor=0E5347"></a>
  &nbsp;
  <a href="https://papers.miccai.org/miccai-2025/0780-Paper2605.html"><img alt="reverse-imaging paper" src="https://img.shields.io/badge/reverse--imaging-paper-0E5347?style=flat-square&labelColor=EDE6D5"></a>
  <a href="https://github.com/Ido-zh/cmr_reverse"><img alt="reverse-imaging code" src="https://img.shields.io/badge/code-_-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>
  <br>
  <a href="https://openreview.net/forum?id=uTTOhthEDR"><img alt="pruning-nnunet paper" src="https://img.shields.io/badge/pruning--nnunet-paper-0E5347?style=flat-square&labelColor=EDE6D5"></a>
  <a href="https://github.com/prunennunet/Prune_nnUNet"><img alt="pruning-nnunet code" src="https://img.shields.io/badge/code-_-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/stack-dark.svg">
    <img alt="~/stack $ cat stack.toml — daily: python, pytorch, cuda, latex. ai: claude code, codex, cursor, and a self-built harness. often: tensorflow, unity, typescript, c++, linux. shelf: react, node, docker, git." src="./assets/stack-light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/ledger-dark.svg">
    <img alt="~/log $ git log — contribution heatmap and streak stats, regenerated twice a day." src="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/ledger-light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/life-dark.svg">
    <img alt="~/life $ cat .life — from Sichuan, now Amsterdam; cooks in a wok; tennis and a 1:43:53 half-marathon; reads Sartre and Borges; adopting a cat, 瓜子." src="./assets/life-light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/contact-dark.svg">
    <img alt="~/contact $ ./contact.sh — email tonyyunyang@outlook.com, github.com/tonyyunyang, Google Scholar, tonyyunyang.github.io." src="./assets/contact-light.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="mailto:tonyyunyang@outlook.com"><img alt="email" src="https://img.shields.io/badge/email-outlook-0E5347?style=flat-square&labelColor=EDE6D5&logo=maildotru&logoColor=0E5347"></a>
  <a href="https://github.com/tonyyunyang"><img alt="github" src="https://img.shields.io/badge/github-tonyyunyang-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>
  <a href="https://scholar.google.com/citations?hl=en&user=rIFdBYAAAAAJ"><img alt="scholar" src="https://img.shields.io/badge/scholar-profile-0E5347?style=flat-square&labelColor=EDE6D5&logo=googlescholar&logoColor=0E5347"></a>
  <a href="https://tonyyunyang.github.io/"><img alt="site" src="https://img.shields.io/badge/site-studio-0E5347?style=flat-square&labelColor=EDE6D5&logo=safari&logoColor=0E5347"></a>
</p>

<details>
<summary>plain text (for screen readers and search)</summary>

Tony (Tongyun) Yang, Independent AI Researcher in Amsterdam. The scaling race is becoming a systems race; what counts is how we train, route, compress, and ship models. Left my PhD fellowship this spring; open to research roles in academia or industry.

Publications: TwinRouterBench (ACM CAIS 2026), MERA (ACM CAIS 2026), Through the Eyes of Emotion (IMWUT 2025), Reverse Imaging (MICCAI 2025 and IEEE TMI), Pruning nnU-Net (MIDL 2025).

Contact: tonyyunyang@outlook.com, github.com/tonyyunyang, scholar.google.com, tonyyunyang.github.io.

</details>

<p align="center"><sub>hand-built, no template ancestry · companion to tonyyunyang.github.io</sub></p>
````

- [ ] **Step 2: Delete the retired assets**

```bash
git rm assets/banner-light.svg assets/banner-dark.svg assets/ornament-light.svg assets/ornament-dark.svg assets/locator-light.svg assets/locator-dark.svg assets/stack-light.svg assets/stack-dark.svg
```

Note: `stack-light.svg`/`stack-dark.svg` are immediately re-created by `build-panes.mjs` (the new terminal stack pane), so they will reappear as regenerated files. The `git rm` clears the old hand-drawn versions from history cleanly before the regenerated ones are committed.

- [ ] **Step 3: Verify no em-dashes anywhere in user-visible files**

Run: `grep -rn "—\|–" README.md content/ assets/*.svg | grep -v "<!--" || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Render the README locally (light + dark) and verify links**

Use the existing `.preview/` helper (or any GitHub-flavored markdown previewer that supports `<picture>`), once in light and once in dark, and confirm: every pane shows, the hero animates, the dark terminal separates from the dark page, and each badge points at the right URL. Confirm GitHub renders the animation by pushing to a scratch branch first if unsure.

- [ ] **Step 5: Commit**

```bash
git add README.md assets/stack-light.svg assets/stack-dark.svg
git commit -m "Rewrite README as a terminal session"
```

---

## Task 9: Final verification + ship

- [ ] **Step 1: Full test run**

Run: `node --test`
Expected: all suites PASS.

- [ ] **Step 2: Regenerate everything from scratch (reproducibility)**

Run: `npm run build:panes && GITHUB_TOKEN=<token> GH_USER=tonyyunyang npm run build:ledger`
Expected: panes in `assets/`, ledgers in `dist/`, no errors.

- [ ] **Step 3: Verification checklist (manual, on a real GitHub render)**

Push to a scratch branch and open it on github.com (or your profile preview):
- [ ] Hero types out in both light and dark.
- [ ] Reduced-motion shows the hero fully, no typing.
- [ ] Dark terminal panes separate clearly from GitHub's dark background.
- [ ] All five papers + every badge link resolve to the correct URL.
- [ ] `~/log` ledger image loads from the `output` branch.
- [ ] No layout overflow on mobile width.

- [ ] **Step 4: Push (auto-deploys the ledger)**

```bash
git push origin main
```

`studio.yml` runs on push to `main` and regenerates the ledger to the `output` branch. Confirm the Action succeeds and the README's `~/log` image updates within a few minutes.

---

## Self-review (completed by plan author)

- **Spec coverage:** terminal aesthetic (Tasks 2,4,5), pure-session/all-panes (Tasks 4–7), animated hero (Task 5), light/dark adaptive (themes in Task 1, `<picture>` in Task 8), terse voice + content (Task 3), links-outside-image (Task 8 badge rows), ledger kept + restyled (Task 7), `~/life` (Tasks 3,4), a11y mirror + alt text (Task 8), retire old assets (Task 8), 7-color discipline + no em-dash (THEMES in Task 1, grep gates in Tasks 4 & 8). Projects pane is the spec's optional item (Task 6).
- **Placeholder scan:** the only intentional placeholders are the `FILL_*` tokens in `content/profile.json`, gated by a `grep` check in Task 3 Step 2 and dependent on Tony's inputs (documented up top). No "TBD/handle errors/similar to" placeholders in code steps.
- **Type consistency:** `renderTerminal({title, rows, theme, width, animate})`, row shape `{segs:[{text,tone,typed?}], gap?}`, tones `prompt|cmd|out|comment|amber`, and `THEMES[theme]` keys are used identically across Tasks 2, 4, 5, 7. `computeStats`/`renderLedger`/`heatmap` signatures match their call sites in Task 7.

## Notes for the implementer
- The animation (Task 5 Step 3) and the ledger heatmap splice (Task 7 Step 2) are the two spots most likely to need a visual nudge. Both have explicit "eyeball it" steps and simple fallbacks. Everything else is mechanical.
- If GitHub's image proxy strips CSS animation from the hero (verify on a scratch branch), set the hero to `animate:false` and ship static. The page is fully functional either way.
- Keep editing centralized: change copy in `content/profile.json`, rerun `npm run build:panes`, commit the regenerated SVGs.
