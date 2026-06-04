import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeStats, renderLedger } from "./build-ledger.mjs";

const cal = JSON.parse(readFileSync("scripts/lib/fixtures/calendar.json", "utf8"));

test("computeStats totals and streaks from the fixture", () => {
  const s = computeStats(cal);
  assert.equal(s.total, 1240);
  // 2026-05-17..05-22 are six consecutive non-zero days (3,4,6,7,2,1).
  assert.equal(s.longest, 6);
  // Most-recent day (05-24) is non-zero, the day before (05-23) is zero.
  assert.equal(s.current, 1);
  assert.equal(s.peak.count, 9);
});

test("renderLedger emits a single terminal log pane with a heatmap", () => {
  const svg = renderLedger("dark", computeStats(cal));
  assert.match(svg, /^<\?xml/);
  assert.equal((svg.match(/<\/svg>/g) || []).length, 1);
  assert.ok(svg.includes("git log"), "shows the git log command");
  assert.ok(svg.includes("1,240"), "shows the formatted total");
  // Heatmap cells (one rect per contribution day in the fixture: 14).
  assert.ok((svg.match(/<rect /g) || []).length >= 14, "draws heatmap cells");
});
