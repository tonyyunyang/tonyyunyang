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
