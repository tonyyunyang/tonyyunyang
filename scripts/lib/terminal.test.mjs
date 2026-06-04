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
