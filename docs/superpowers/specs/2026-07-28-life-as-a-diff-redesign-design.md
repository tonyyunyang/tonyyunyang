# Profile redesign: "Life as a diff"

Date: 2026-07-28
Status: approved by tony (conversation, 2026-07-28)

## Goal

Replace the multi-pane terminal-SVG profile README with a single-screen,
zero-maintenance character sheet told as a literal code diff. New identity:
Amsterdam-based PhD dropout starting an AI lab (unnamed, news coming soon),
building bottom-up from inference to application.

Tone (user-selected): playful character sheet, with the philosophy line and
lab teaser kept clean and sincere. Content scope (user-selected): full wipe —
no publications, badges, stats, or GitHub Actions survive.

## Final README.md content

Amendments (2026-07-28, from tony): no Trainmore or Frans Otten mentions;
creative license granted — upgraded to an authentic git-patch framing
(`diff --git a/tony b/tony` header) so the README reads as the literal diff
between old life and new. Cat is 煎蛋, a British Shorthair.

The entire file is the following (one diff fence + one `<sub>` footer):

````markdown
```diff
diff --git a/tony b/tony
index phd..ai-lab
--- a/tony
+++ b/tony
@@ amsterdam, nl @@

- phd candidate
+ ai lab founder
! news coming soon

@@ current quest @@
+ build from the bottom up,
+ from inference to application
! currently: heads down, building with love
# inventory: nothing but ideas

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

<sub><a href="https://tonyyunyang.github.io">tonyyunyang.github.io</a> · <a href="mailto:tonyyunyang@outlook.com">email</a></sub>
````

## Rendering constraints (verified against GitHub's POST /markdown API)

- Diff-fence registers are theme-safe in both default light and dark themes:
  `@@ … @@` bold purple (pl-mdr), `+` green on green tint (pl-mi1), `-` red on
  red tint (pl-md), `!` amber (pl-mc), `#` muted gray (pl-c). Colorblind
  themes remap hues but the literal `+`/`-` glyphs carry the semantics.
- Patch-header lines verified 2026-07-28 via `gh api /markdown`:
  `diff --git …` renders blue (pl-c1), `index …` renders as plain body text,
  `--- a/tony` red (pl-md), `+++ b/tony` green (pl-mi1).
- Diff markers must sit at column 0; a leading space kills the styling.
- Code fences never wrap; keep every line under ~60 display columns so the
  narrow profile column and mobile need no horizontal scroll. CJK characters
  count as two columns.
- No emoji inside the fence (double-width, breaks monospace alignment).
- GitHub's sanitizer strips `style`/`class`/inline SVG; `<sub>` and `<a>`
  survive, so the footer uses plain HTML anchors.

## Teardown

- Delete: `assets/` (12 SVGs), `scripts/`, `content/`, `package.json`,
  `.github/workflows/studio.yml`.
- Delete the remote `output` branch (held the Action-generated ledger SVGs;
  orphaned once the workflow is gone).
- Prune `.gitignore` entries that only served the deleted tooling.
- Keep: `docs/` (design history), `.superpowers/`.

## Verification

- Render the exact new README through GitHub's `POST /markdown` API and
  confirm the expected `pl-*` classes appear and nothing is stripped.
- Grep for dangling references to deleted paths.
- Commit as `tony <tonyyunyang@outlook.com>` (no AI attribution), push to
  `main`, confirm the live profile renders in light and dark.

## Out of scope

The website (`../tonyyunyang.github.io`) keeps its current design; no shared
tokens are updated. Nothing dynamic is added — no Actions, no stats, ever,
until tony asks.
