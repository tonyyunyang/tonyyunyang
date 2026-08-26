# Profile upgrade: ASCII wordplate + 3D contributions

- **Date:** 2026-08-26
- **Repo:** `tonyyunyang/tonyyunyang` (GitHub profile README)
- **Status:** Approved by tony (conversation, 2026-08-26)
- **Companion site:** `https://tonytheyang.com/` (read-only reference for copy; do not modify)
- **Supersedes:** portions of `2026-07-28-life-as-a-diff-redesign-design.md` (the “no Actions, ever” clause)

---

## 1. Summary

Upgrade the profile README from a single diff fence to a three-layer stack:

1. **ASCII wordplate** — isometric FIGlet art spelling `tonytheyang`, with `.com` as the CTA line, linking to `https://tonytheyang.com/`
2. **Life-as-a-diff** — keep the git-patch character sheet; update copy to match the personal site
3. **Live 3D contribution map** — [github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib) Action, custom emerald-on-charcoal palette, light + dark SVGs on the `output` branch

Art direction stays **patch / terminal / engineer-made**. No lowlighter/metrics default widgets as the visual surface.

---

## 2. Goals and non-goals

**Goals**

- Impressive, clickable “ad” at the top that drives traffic to `tonytheyang.com`
- Keep the diff character sheet as the personality core
- Add a genuinely live, visually special contribution element (3D isometric)
- Unified emerald (`#5bc795`) + charcoal (`#0f1417`) / paper (`#f2ead8`) palette from the old terminal redesign
- Light + dark adaptive where GitHub allows it

**Non-goals**

- No changes to `../tonytheyang.com/`
- No full metrics dashboard or multi-plugin metrics card
- No animated GIF skyline (metrics `skyline` plugin — too heavy, wrong aesthetic)
- No resurrection of the old multi-pane terminal SVG system wholesale

---

## 3. Page architecture (top → bottom)

```
[ ASCII wordplate in <pre> ]     ← wrapped in <a href="https://tonytheyang.com/">
  Small Isometric1 FIGlet: tonytheyang
  next line: → tonytheyang.com (plain text CTA)

[ life-as-a-diff fence ]         ← native GitHub diff coloring

[ 3D contribution SVG ]          ← <picture> light/dark from output branch

[ footer ]                       ← tonytheyang.com · email
```

---

## 4. Wordplate design

### 4.1 Font choice (research-validated)

**Font:** `Small Isometric1` via [figlet.js](https://github.com/patorjk/figlet.js) v1.11+

- 70 columns wide for `tonytheyang` — fits GitHub profile column with horizontal scroll on very narrow mobile only
- Isometric 3D ASCII visually rhymes with the isometric 3D contribution map
- Trending style category in 2025–26 FIGlet ecosystem (isometric family + 2025 bugfixes)

### 4.2 Layout

```html
<a href="https://tonytheyang.com/">
<pre align="center">
…FIGlet output for "tonytheyang"…

→ tonytheyang.com
</pre>
</a>
```

- Visible label: `tonytheyang.com` (not full URL with scheme)
- Link target: `https://tonytheyang.com/`
- No emoji inside the `<pre>` (breaks alignment)
- ASCII generated once, committed statically in README (regenerate with `npx figlet -f "Small Isometric1" tonytheyang` if copy changes)

### 4.3 Accessibility

- `<pre>` content is readable as plain text by screen readers
- Link `title` attribute optional: `title="tonytheyang.com — personal site"`

---

## 5. Diff content (updated)

Replace the July 2026 diff body. Keep patch framing and philosophy lines.

```diff
diff --git a/tony b/tony
index phd..builder
--- a/tony
+++ b/tony
@@ amsterdam, nl @@

- phd candidate
+ ai researcher & engineer
! infra → applications

@@ current quest @@
+ build from the bottom up,
+ recursive self-improvement & agent runtimes
! currently: heads down, building with love
# inventory: nothing but ideas (yet)

@@ daily buffs @@
+ +10 cuddling 煎蛋 the british shorthair
+  +5 cooking for family
+  +5 iced club-mate
+  +5 bodybuilding
+  +5 running vondelpark & amsterdamse bos
+  +5 tennis

# live as if in the future,
# and you will be in the future
```

**Constraints (unchanged from prior spec):**

- Diff markers at column 0
- No em-dashes
- Lines under ~60 display columns where possible
- No emoji inside the fence

**Footer:**

```html
<sub><a href="https://tonytheyang.com/">tonytheyang.com</a> · <a href="mailto:tonyyunyang@outlook.com">email</a></sub>
```

---

## 6. 3D contribution map

### 6.1 Library

**[yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib)** — GitHub Action, pure SVG isometric columns.

Why this over raw metrics:

- Deep color control via `SETTING_JSON` (`contribColors`, backgrounds, foregrounds)
- `profile-gitblock.svg` variant available if we want block-char columns later
- Same “Action refreshes daily” model as the old ledger workflow
- SVG output scales cleanly in README

### 6.2 Custom palette (emerald on charcoal / paper)

Two configs in `conf/github-profile-3d-contrib.json`:

| Token | Dark | Light |
|-------|------|-------|
| background | `#0f1417` | `#f2ead8` |
| foreground | `#efe4ce` | `#1a1f24` |
| strong | `#5bc795` | `#0e5347` |
| weak | `#7c8893` | `#9c917a` |
| contrib ramp (5 steps) | `#161d23` → `#5bc795` | `#e7ddc7` → `#0e5347` |

Output files:

- `contrib-dark.svg` (night)
- `contrib-light.svg` (day)

### 6.3 Workflow

- Trigger: daily cron + `workflow_dispatch` + push to `main`
- Action generates SVGs from `SETTING_JSON`
- Push artifacts to **`output`** branch (reuse name from old ledger pipeline) via `crazy-max/ghaction-github-pages`
- README references:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/contrib-dark.svg">
  <img alt="3D isometric GitHub contribution calendar for tonyyunyang" src="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/contrib-light.svg" width="100%">
</picture>
```

### 6.4 Auth

- Default `secrets.GITHUB_TOKEN` sufficient for public contributions
- Include private contributions if profile setting enabled (document in workflow comment)

---

## 7. Repository file inventory

**Add**

- `conf/github-profile-3d-contrib.json` — emerald day/night settings
- `.github/workflows/profile-3d-contrib.yml` — generate + push to `output`
- This spec; implementation plan; updated `README.md`

**Modify**

- `README.md` — wordplate + updated diff + picture + footer
- `.gitignore` — ignore local figlet/node artifacts if any dev tooling added

**Unchanged**

- `docs/` prior design history

**Remote**

- Create/update `output` branch with generated SVGs (no source code on that branch)

---

## 8. Verification

1. Render README through GitHub `POST /markdown` API — confirm diff classes, `<a>`, `<pre>`, `<picture>` survive
2. Run 3d-contrib workflow manually; confirm SVGs land on `output` branch
3. Verify `<picture>` URLs resolve (200) for both light and dark SVGs
4. View live profile in GitHub light and dark themes
5. Grep for stale `tonyyunyang.github.io` references
6. Confirm wordplate link opens `https://tonytheyang.com/`

---

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| ASCII too wide on mobile | `Small Isometric1` at 70 cols; acceptable horizontal scroll; `.com` line readable alone |
| 3d-contrib default green look | Custom `contribColors` in JSON; not using stock presets |
| `output` branch missing on first view | Run workflow before announcing; README can ship same PR as workflow |
| Action failure leaves stale SVG | Workflow badge optional; cron + manual dispatch |

---

## 10. Future extensions (out of scope)

- Animated growing columns (`growingAnimation: true` — try after baseline works)
- `gitblock` variant instead of smooth isometric columns
- metrics v4 isocalendar if it ships with proper palette API
- Wordplate regeneration script in CI
