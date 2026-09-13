import { describe, expect, it } from "vitest";
import { erNorskLang, forberedUttale, migrerStemme, skalBrukeAlfStemme, stemmeRang, velgBesteStemme } from "./tale";

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

  it("foretrekker Google, Apple og neural over vanlig Microsoft", () => {
    expect(stemmeRang("Google norsk", "nb-NO")).toBeGreaterThan(stemmeRang("Microsoft Hedda", "nb-NO"));
    expect(stemmeRang("Microsoft Finn Online (Natural)", "nb-NO")).toBeGreaterThan(
      stemmeRang("Microsoft Nora Compact", "nb-NO"),
    );
    expect(stemmeRang("Henrik", "nb-NO")).toBeGreaterThan(stemmeRang("Nora", "nn-NO"));
  });

  it("bruker Alfs stemme i stedet for Nora", () => {
    expect(skalBrukeAlfStemme("alf")).toBe(true);
    expect(skalBrukeAlfStemme("")).toBe(true);
    expect(migrerStemme("")).toBe("alf");
    expect(migrerStemme("Microsoft Nora")).toBe("alf");
    expect(migrerStemme("Microsoft Nora Compact")).toBe("alf");
    expect(migrerStemme("Microsoft Hedda")).toBe("alf");
    expect(migrerStemme("Google norsk")).toBe("Google norsk");
  });

  it("retter trykk på vanlige norske spillord", () => {
    expect(forberedUttale("Alf rekker skolen")).toMatch(/sko/i);
    expect(forberedUttale("En zombie dultet til Alf")).toMatch(/såmbi|zombi/i);
    expect(forberedUttale("krystall og diamant")).toMatch(/krysstall|krys-tall/i);
  });
});
