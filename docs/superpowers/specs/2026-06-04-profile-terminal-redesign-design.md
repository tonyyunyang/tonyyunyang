# GitHub Profile Redesign · Terminal Session (design spec)

- **Date:** 2026-06-04
- **Repo:** `tonyyunyang/tonyyunyang` (the GitHub profile README repo)
- **Status:** Approved in brainstorming. Ready for implementation planning.
- **Companion site:** `https://tonyyunyang.github.io` (Astro, "Atelier × Cinema" design language). Sibling repo at `../tonyyunyang.github.io/`. Source of truth for copy, papers, projects, and palette.

---

## 1. Summary

Replace the current ornate "PLATE GH · Studio" editorial README (hand-drawn banner, ornaments, locator map, workshop-kit plate) with a **single terminal session**: the whole profile reads top to bottom like a shell, in Tony's warm palette, **light/dark adaptive**, with an **animated hero that types itself out** on load. The personality stays (`cat ~/.life`); the contribution ledger stays (restyled into a `git log` pane, still auto-regenerated). Voice is **terse, just facts**, so "human" comes from authentic content, not chatty prose.

The look should read as *simple, straightforward, technical, and hand-built*, while still being distinctive and cool.

## 2. Goals and non-goals

**Goals**
- A profile that is unmistakably an engineer's: terse, technical, screenshot-worthy.
- Shares the site's visual DNA (paper, emerald, JetBrains Mono) so the two read as one identity.
- Foreground the current message: the *systems race* thesis, and *open to research roles*.
- Keep one genuinely live element (the contribution ledger) for "alive, technical" signal.
- Accurate, current content (5 papers, real stack including AI-native tooling).

**Non-goals**
- No carryover of the atelier/workshop/plate metaphor or its naming.
- Not maximizing scannability over distinctiveness. Tony explicitly chose the bolder "all-terminal" read (V1) over a hedged hero-plus-cards layout.
- No new color outside the established token set.
- No third-party README-stats widgets as the primary surface; the ledger is our own.

## 3. Background: what we are replacing

Current `README.md` is HTML-in-markdown with six SVG assets (`banner`, `ornament`, `locator`, `stack`, each light+dark) plus a dynamic ledger. Sections: Currently, Research (2 featured papers + compass), Stack (kit plate), Open the workshop (ledger), Off the page (personality), Connect. **All of it is being ditched** per the redesign, except the *ledger build pipeline*, which we keep and restyle.

Assets to retire: `assets/banner-*.svg`, `assets/ornament-*.svg`, `assets/locator-*.svg`, `assets/stack-*.svg`.
Pipeline to keep + restyle: `scripts/build-ledger.mjs`, `.github/workflows/studio.yml`.

## 4. Core decisions (validated)

| Decision | Choice | Notes |
|---|---|---|
| Aesthetic | **Terminal / CLI session** | Chosen over editorial-plate, docs-native, hybrid. |
| Scope of metaphor | **Pure session, top to bottom** (V1) | Every section is a terminal pane. |
| Motion | **Animated hero (types on load)** | Hero pane only; lower panes static. |
| Theme | **Light + dark adaptive** | Dark charcoal terminal in dark mode; warm **paper** terminal in light mode. Two SVG variants per pane via `<picture>`. |
| Voice | **Terse, just facts** | Minimal `#` commentary. Warmth from content, not editorializing. |
| Ledger | **Keep, restyled** | Reuse the data + stats pipeline; re-skin the SVG to a terminal `git log` pane. |
| Personality | **Keep `cat ~/.life`** | Short, terse, human. |
| Links | **Real buttons outside the image** | SVG-as-`<img>` cannot contain working links (see §7). |

## 5. Visual design system

### 5.1 Terminal window anatomy
Each pane is a rounded terminal window: a **title bar** (three traffic-light dots + a `tony@amsterdam: ~/<context>` title) over a **body** of monospace lines. Shared chrome + palette across panes makes the separate windows read as one continuous session. The title bar's working-directory context advances per pane (`~`, `~/publications`, `~/stack`, `~/log`, `~/life`, `~/contact`) so it feels like steps in one session.

### 5.2 Palette (7-token discipline, no eighth color)
Starting values, tunable in implementation. Two terminal themes:

**Light (paper terminal, on GitHub's white page)**
- window `#F2EAD8`, title bar `#E7DDC7`, border/hairline `#D9D2C2`
- prompt / accent `#0E5347`, command (ink) `#1A1F24`, output `#43494F`, comment `#9C917A`, path/amber `#946321`

**Dark (charcoal terminal, on GitHub's `#0d1117` page)**
- window `#0F1417`, title bar `#161D23`, border `#2A3138`
- prompt / accent `#5BC795`, command (cream) `#EFE4CE`, output `#C7C0B2`, comment `#7C8893`, path/amber `#E0A458`

> Dark-mode caution: GitHub's dark page is `#0d1117`, very close to the window `#0F1417`. Ensure the window separates via the lighter title bar, a visible 1px border, and a soft drop-shadow rectangle. Verify on a real dark GitHub page, not just the mockup.

Tokens trace back to the site's `globals.css` and the existing ledger dark tokens (`paper #14110D`, `ink #EFE4CE`, `accent #5BC795`), so the ledger and the panes share one dark palette.

### 5.3 Type
- **JetBrains Mono** throughout the terminal bodies (the site already ships it).
- Fonts must be embedded or path-rendered in the SVG (GitHub does not load page webfonts into an `<img>` SVG). Prefer rendering with a mono web-safe stack as fallback (`JetBrains Mono, ui-monospace, Menlo, Consolas, monospace`), matching `build-ledger.mjs`'s existing approach. If exact JetBrains glyphs matter, embed a subset as a base64 `@font-face` in the SVG `<style>`.

### 5.4 Motion
- **Hero only.** Lines reveal in sequence; command lines use a `steps()` width "typing" reveal; a block caret blinks at the end. Total run roughly 5s.
- Lower panes are static (they are off-screen on load; animating them wastes the effect).
- Honor reduced motion: inside the hero SVG `<style>`, add `@media (prefers-reduced-motion: reduce)` that renders all lines instantly with a steady caret. (Honored by the viewer's browser even for an `<img>`-loaded SVG.)

## 6. Page architecture (the session, top to bottom)

Markdown is thin glue: a `<picture>` per pane, link-button rows between panes, the ledger `<picture>`, a footer. Exact approved copy below (terse, lowercase where shown, **no em-dashes**).

1. **Hero · `tony@amsterdam: ~`** (animated)
   ```
   ~ $ whoami
   Tony (Tongyun) Yang · 杨童耘
   Independent AI Researcher · Amsterdam

   ~ $ cat focus.txt
   the scaling race is becoming a systems race.
   bigger models still matter, but they are not enough.
   what counts is how we train, route, compress, and ship them.
   building AI that is capable, efficient, and genuinely useful.

   ~ $ open-to-work --roles
   left my PhD fellowship this spring; clearer now on what's next.
   open to research · academia or industry
   ```
   → **link buttons:** `site` · `scholar` · `email` · `cv (en · zh)`

2. **Publications · `~/publications`** (static): `ls -lt`, newest first, aligned `venue · name · one-line fact`:
   ```
   ACM CAIS '26   twinrouterbench               agentic LLM routing bench · cuts cost 53%
   ACM CAIS '26   mera                          trace-driven routing · 87% acc at ~half cost
   IMWUT '25      through-the-eyes-of-emotion   eye-tracking dataset · emotion in VR
   MICCAI '25     reverse-imaging               any-sequence cardiac MRI segmentation
   MIDL '25       pruning-nnunet                80%+ weights pruned · dice >0.95
   ```
   → **per-paper link buttons** (one row each): paper / code / (project|data where present). URLs in §13.

3. **Stack · `~/stack`** (static): `cat stack.toml`:
   ```
   [daily]   python · pytorch · cuda · latex
   [ai]      claude code · codex · cursor · <tony's harness> · <oss agents>
   [infra]   <tony's real model stack>
   [often]   tensorflow · unity · typescript · c++ · linux
   [shelf]   react · node · docker · git
   ```
   `[ai]` and `[infra]` exact strings are an **open item** (§11). `[ai]` sits directly under `[daily]` to read as core.

4. **Ledger · `~/log`** (dynamic): `git log --stat --since="1 year ago"`: terminal-styled contribution heatmap + streak/commit stats. Regenerated twice daily (see §8.5).

5. **Life · `~/life`** (static): `cat .life`, terse:
   ```
   from   sichuan → now amsterdam
   cook   sichuan wok · never a covered pot
   sport  tennis (pure drive) · half-marathon 1:43:53
   read   sartre · borges · tulips each spring
   soon   adopting 瓜子, a 狸花猫
   ```

6. **Contact · `~/contact`** (static): `./contact.sh` prints the addresses (visual), then **link buttons:** `email` · `github` · `scholar` · `site`.

7. **Footer**: one terse mono line, e.g. `# static svg panes + one live ledger · adaptive light/dark · hand-built, no template` and the quiet profile-views badge.

> **Optional extension (recommended, pending Tony):** a curated **`~/projects $ ls`** pane between Publications and Stack, showing 3 active builds to prove he ships, not just publishes. Candidates: `human-intent-world-model` (MeetaVista), `llm-router` (Gradient Networks, NeurIPS '26 under review), `polymarket-decoder` (self-driven). Several projects have no public repo yet, so rows show `status` as output with a `code` button only where a link exists. Not part of the approved baseline; see §11.

## 7. Hard constraints and how we honor them

- **SVG-as-`<img>` cannot hold working links.** GitHub sanitizes/sandboxes README images. → Every actionable link is a **real markdown/HTML button row outside the image** (the terminal only *prints* addresses as text). This shapes the whole layout: panes alternate with link rows.
- **No webfont guarantee inside img-SVG.** → Embed/subset the mono font in the SVG or rely on the mono fallback stack (§5.3).
- **No `<style>`/`<script>`/CSS in README markdown.** → All visual styling lives *inside* the SVGs; markdown stays plain.
- **No em-dashes** in any user-visible string (Tony's rule). Use `·`, `→`, commas, periods, parens, colons. Grep before done.
- **7-color discipline.** Reuse the established tokens only.
- **Accessibility:** every `<picture>` needs descriptive `alt` (the pane's content in prose). Provide an optional collapsed `<details>` plain-text mirror of the whole session for screen readers, search, and no-image contexts.

## 8. Technical implementation

### 8.1 Pane generation
Add `scripts/build-panes.mjs` (Node, no deps, mirrors `build-ledger.mjs` style): reads a content config (a new `content/profile.json` or inline) and emits per-pane SVGs (light + dark) into `assets/`. Keeps content edits out of hand-authored SVG and enforces palette tokens in one place. Static panes are generated then **committed** to `assets/` (they change rarely).

Panes (each light + dark): `hero`, `publications`, `stack`, `life`, `contact` (+ `projects` if adopted). Naming: `assets/<pane>-light.svg`, `assets/<pane>-dark.svg`.

### 8.2 Animation (hero)
Inside `hero-{light,dark}.svg`, a `<style>` block with `@keyframes` for (a) per-line reveal, (b) `steps()` width typing on command lines, (c) caret blink. Plus a `prefers-reduced-motion` fallback. CSS-in-SVG animation runs when the SVG is loaded via `<img>` on GitHub. (SMIL `<animate>` is an acceptable alternative if CSS proves flaky in the camo proxy; validate on a real profile.)

### 8.3 Adaptive light/dark
Standard GitHub pattern (already used in the current README):
```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg">
  <img alt="…full prose of the pane…" src="./assets/hero-light.svg" width="100%">
</picture>
```
Remember: in `<source srcset>`, encode any literal comma as `%2C` (GitHub parses commas as candidate separators). Plain commas are fine in `<img src>`.

### 8.4 Link buttons
Reuse the current approach: `shields.io` flat-square badges (paper `labelColor` + emerald) wrapped in markdown links. They stay constant across themes (acceptable; the terminals carry the adaptivity). Alternatively, small custom pill SVGs each wrapped in its own `<a>`. Keep the mono, paper-and-emerald look from the mockups.

### 8.5 Ledger pane (restyle existing pipeline)
Keep `scripts/build-ledger.mjs`'s data fetch (GitHub GraphQL contribution calendar) and stats (total, current/longest streak, sparkline, peak, 53-week grid). **Replace only the SVG renderer** so the plate becomes a **terminal window** titled `~/log $ git log --stat --since="1 year ago"`: heatmap grid in the terminal cell ramp, a terse stat line (`commits N · current streak D · longest L · busiest <day>`), legend, and a `# regenerated twice a day by a github action` comment. Output two files (`ledger-light.svg`, `ledger-dark.svg`) as today. `.github/workflows/studio.yml` is unchanged (still pushes `dist/` to the `output` branch twice daily + on push to main). README keeps referencing `https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/ledger-{light,dark}.svg` via `<picture>`.

### 8.6 Local preview
Keep/refresh the `.preview/` README-rendering helper (already gitignored) so light/dark can be checked locally before pushing. Verify the dark-window separation issue (§5.2) and the typing animation in an actual browser.

## 9. Repository file inventory

**Add**
- `scripts/build-panes.mjs`: static pane SVG generator.
- `content/profile.json` (or similar): single source for all pane copy.
- `assets/hero-{light,dark}.svg`, `publications-…`, `stack-…`, `life-…`, `contact-…` (+ `projects-…` if adopted).
- This spec; an implementation plan; updated `README.md`.

**Modify**
- `README.md`: rewritten: `<picture>` panes + link rows + ledger + footer. Thorough `alt` text. Optional `<details>` plain-text mirror.
- `scripts/build-ledger.mjs`: swap the SVG renderer for the terminal `git log` styling; keep fetch/stats.

**Retire**
- `assets/banner-*.svg`, `assets/ornament-*.svg`, `assets/locator-*.svg`, `assets/stack-*.svg`.

**Unchanged**
- `.github/workflows/studio.yml` (still drives the ledger).

## 10. Implementation roadmap (phases)

A suggested sequence for the implementation session's workflow:

1. **Content lock.** Fill the §11 open items into `content/profile.json` (hero, 5 papers + URLs, stack incl. real `[ai]`/`[infra]`, life, contact). Decide projects pane.
2. **Palette + one static pane.** Build `build-panes.mjs` and ship the `stack` pane (light + dark) end to end; validate the `<picture>` swap and dark-window separation on a real GitHub render.
3. **Remaining static panes** (publications, life, contact, hero-static-first).
4. **Hero animation.** Add typing + caret + reduced-motion fallback; validate on a live profile.
5. **Link rows.** Wire shields/custom buttons under hero, per-paper, and contact.
6. **Ledger restyle.** Swap the renderer in `build-ledger.mjs`; run locally with a token; confirm `output` branch + README reference still resolve.
7. **README assembly + a11y.** Compose markdown, write `alt` text, add the `<details>` plain-text mirror, footer, profile-views badge.
8. **Polish loop.** Local light/dark preview, em-dash grep, then push (ledger auto-deploys). Optional codex critique round.

## 11. Open items for Tony to finalize

1. **`[ai]` exact strings.** Confirmed: `claude code`, `codex`, `cursor`. Needed: the **name (and optional repo link) of Tony's own harness framework**; correct spelling/identity of the OSS agents (`pi-agent`? `harness` vs the "harmess" he typed?) and any "etc." others.
2. **`[infra]` line.** Real model stack (serving / routing / training infra). The spec's `hugging face · vllm · openrouter · langgraph` was a placeholder guess; replace entirely.
3. **`~/projects` pane.** Adopt the curated 3-project pane (recommended) or stay papers-only. If adopted, confirm which projects and pull summaries/links from `../tonyyunyang.github.io/src/content/projects/*.mdx`.
4. **Authorship markers (optional).** Whether to mark equal-contribution / first-author on papers (e.g. a `†`), or keep the listing clean.

## 12. Risks and mitigations

- **Image-heavy page hurts a11y/SEO.** → Mandatory `alt` prose + optional `<details>` plain-text mirror.
- **CSS-in-SVG animation not running through GitHub's camo proxy.** → Validate early on a real profile; fall back to SMIL or to the static hero if needed.
- **Dark terminal blends into GitHub dark page.** → Lighter title bar + border + shadow; verify on real render (§5.2).
- **Terseness reading cold.** → The `~/life` pane and authentic content carry the human note; keep at least the journey line in the hero.
- **Stale content drift.** → `content/profile.json` is the single edit point; papers/projects mirror the site's collections.

## 13. Appendix: canonical links

**Papers**
- twinrouterbench: paper `https://openreview.net/forum?id=UWvHJtnmc2` · code `https://github.com/CommonstackAI/TwinRouterBench` · project `https://commonstackai.github.io/TwinRouterBench/`
- mera: paper `https://openreview.net/forum?id=6oyBiDMCHs` · code `https://github.com/zeyuyuyu/router-skills-evolve`
- through-the-eyes-of-emotion: paper `https://dl.acm.org/doi/abs/10.1145/3749545` · code `https://github.com/MultiRepEyeVR/Through-the-Eyes-of-Emotion` · data `https://zenodo.org/records/16790658`
- reverse-imaging: paper `https://papers.miccai.org/miccai-2025/0780-Paper2605.html` · code `https://github.com/Ido-zh/cmr_reverse`
- pruning-nnunet: paper `https://openreview.net/forum?id=uTTOhthEDR` · code `https://github.com/prunennunet/Prune_nnUNet`

**Contact**
- email `tonyyunyang@outlook.com` · github `https://github.com/tonyyunyang` · scholar `https://scholar.google.com/citations?hl=en&user=rIFdBYAAAAAJ` · site `https://tonyyunyang.github.io` · cv `https://tonyyunyang.github.io/cv-en.pdf` (en) · `https://tonyyunyang.github.io/cv-zh.pdf` (zh)
