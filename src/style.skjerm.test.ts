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

  it("dekker veien bak skolen", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/#sti-skole-skjul\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/#sti-skole-wrap\s*\{[^}]*z-index:\s*8/);
  });

  it("har store ABC-klosser, zombie og steiner i app-ikonet", () => {
    const svg = readFileSync(new URL("../public/ikon.svg", import.meta.url), "utf8");
    expect(svg).toContain(">A</text>");
    expect(svg).toContain(">B</text>");
    expect(svg).toContain(">C</text>");
    expect(svg).toMatch(/width="118"/);
    expect(svg).toContain("#7c9a5c");
    expect(svg).toContain("#2ec4b6");
    expect(svg).toContain("#d9f4ff");
  });

  it("dekker veien med startskjerm under 3-2-1", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    expect(css).toMatch(/#sti-start\s*\{[^}]*position:\s*absolute/);
    expect(css).toMatch(/#sti-start\s*\{[^}]*inset:\s*0/);
    expect(css).toMatch(/#sti-start\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});
