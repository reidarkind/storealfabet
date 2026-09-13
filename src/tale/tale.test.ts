import { describe, expect, it } from "vitest";
import {
  erNorskLang,
  forberedUttale,
  migrerStemme,
  skalBrukeAlfStemme,
  stiLydForHendelse,
  stemmeRang,
  velgBesteStemme,
  velgTaleModus,
} from "./tale";

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

  it("bruker telefonens stemme når Siri finnes, ellers Alf mot dårlig Nora", () => {
    expect(skalBrukeAlfStemme("alf")).toBe(true);
    expect(skalBrukeAlfStemme("")).toBe(false);
    expect(skalBrukeAlfStemme("auto")).toBe(false);
    expect(migrerStemme("")).toBe("auto");
    expect(migrerStemme("alf")).toBe("auto");
    expect(migrerStemme("Microsoft Nora Compact")).toBe("auto");
    expect(migrerStemme("Google norsk")).toBe("Google norsk");
    expect(velgTaleModus("auto", [{ name: "Nora (Enhanced)", lang: "nb-NO", voiceURI: "com.apple.voice.compact.nb-NO.siri" }])).toBe(
      "system",
    );
    expect(velgTaleModus("auto", [{ name: "Microsoft Nora Compact", lang: "nb-NO" }])).toBe("alf");
    expect(velgTaleModus("alf", [{ name: "Nora (Enhanced)", lang: "nb-NO" }])).toBe("alf");
  });

  it("gir korte veilyder i stedet for prat", () => {
    expect(stiLydForHendelse("plukk", "diamant")).toBe("diamant");
    expect(stiLydForHendelse("plukk", "krystall")).toBe("krystall");
    expect(stiLydForHendelse("trafikk", "syklist")).toBe("sykkel");
    expect(stiLydForHendelse("trafikk", "bil")).toBe("bil");
    expect(stiLydForHendelse("baesj", "baesj")).toBe("baesj");
    expect(stiLydForHendelse("treff", "zombie")).toBe("zombie");
  });

  it("retter trykk på vanlige norske spillord", () => {
    expect(forberedUttale("Alf rekker skolen")).toMatch(/sko/i);
    expect(forberedUttale("En zombie dultet til Alf")).toMatch(/såmbi|zombi/i);
    expect(forberedUttale("krystall og diamant")).toMatch(/krysstall|krys-tall/i);
  });
});
