import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

describe("mer-lenker", () => {
  it("har de samme knappene som i Bananmatte på Om appen og Installer", () => {
    expect(html).toContain("Andre apper jeg har laget");
    expect(html).toContain("Spander en kaffe");
    expect(html).toContain("https://reidarkind.github.io/myapps/");
    expect(html).toContain("https://buymeacoffee.com/reidarkind");
    expect(html.match(/data-apps/g)?.length).toBe(2);
    expect(html.match(/data-coffee/g)?.length).toBe(2);
    expect(html).toContain("Vil du ha appen på hjemskjermen? Se Installer.");
    expect(html).toContain('id="skjerm-installer"');
  });
});
