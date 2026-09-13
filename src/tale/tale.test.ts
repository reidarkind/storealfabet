import { describe, expect, it } from "vitest";
import { erNorskLang, stemmeRang, velgBesteStemme } from "./tale";

describe("stemmevalg", () => {
  it("kjenner igjen norsk språk", () => {
    expect(erNorskLang("nb-NO")).toBe(true);
    expect(erNorskLang("no-NO")).toBe(true);
    expect(erNorskLang("en-US")).toBe(false);
  });

  it("foretrekker valgt stemme, ellers den beste norske", () => {
    const stemmer = [
      { name: "Microsoft Nora Compact", lang: "nb-NO" },
      { name: "Henrik", lang: "nb-NO" },
      { name: "Google US English", lang: "en-US" },
    ];
    expect(velgBesteStemme(stemmer)?.name).toBe("Henrik");
    expect(velgBesteStemme(stemmer, "Microsoft Nora Compact")?.name).toBe("Microsoft Nora Compact");
  });

  it("gir kompakt damestemme lavere rang enn Henrik", () => {
    expect(stemmeRang("Henrik")).toBeGreaterThan(stemmeRang("Microsoft Nora Compact"));
  });
});
