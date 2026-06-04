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
