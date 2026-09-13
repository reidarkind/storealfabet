import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("skjerm-synlighet", () => {
  it("lar hidden vinne over display:flex", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.skjerm\[hidden\]\s*\{[^}]*display:\s*none/);
  });

  it("skjuler den lille veibanen under lekser", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.skjerm\.spill:not\(\.paa-sti\)\s+\.verden-wrap\s*\{[^}]*display:\s*none/);
  });

  it("holder tegneknappene inne i oppgavekortet", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.spill\.tegn-modus\s+#tegne-wrap\s*\{[^}]*min-height:\s*0/);
    expect(css).toMatch(/\.spill\.tegn-modus\s+\.tegn-knapper\s*\{[^}]*flex:\s*0\s+0\s+auto/);
  });

  it("dekker veien med startskjerm under 3-2-1", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/#sti-start\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/#sti-start\s*\{[^}]*inset:\s*0/);
    expect(css).toMatch(/#sti-start\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});
