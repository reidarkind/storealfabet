import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("skjerm-synlighet", () => {
  it("lar hidden vinne over display:flex", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.skjerm\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});
