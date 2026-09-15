import { describe, expect, it } from "vitest";
import {
  erNorskLang,
  forberedTaleDeler,
  forberedUttale,
  lesOppgave,
  migrerStemme,
  skalBrukeAlfStemme,
  stiLydForHendelse,
  stemmeRang,
  skalBrukeNettleserTale,
  skalListesSomStemmevalg,
  velgBesteStemme,
  velgTaleModus,
} from "./tale";
import { ALLE_OPPGAVER } from "../oppgaver/data";

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
    expect(migrerStemme("")).toBe("alf");
    expect(migrerStemme("auto")).toBe("auto");
    expect(migrerStemme("alf")).toBe("alf");
    expect(migrerStemme("Microsoft Nora Compact")).toBe("alf");
    expect(migrerStemme("Nora (Enhanced)")).toBe("auto");
    expect(migrerStemme("Google norsk")).toBe("Google norsk");
    expect(velgTaleModus("auto", [{ name: "Nora (Enhanced)", lang: "nb-NO", voiceURI: "com.apple.voice.compact.nb-NO.siri" }])).toBe(
      "system",
    );
    expect(velgTaleModus("auto", [{ name: "Microsoft Nora Compact", lang: "nb-NO" }])).toBe("alf");
    expect(velgTaleModus("alf", [{ name: "Nora (Enhanced)", lang: "nb-NO" }])).toBe("alf");
    expect(skalBrukeNettleserTale("alf", [{ name: "Nora (Enhanced)", lang: "nb-NO" }])).toBe(false);
    expect(skalBrukeNettleserTale("auto", [{ name: "Microsoft Nora Compact", lang: "nb-NO" }])).toBe(false);
    expect(
      skalBrukeNettleserTale("auto", [{ name: "Nora (Enhanced)", lang: "nb-NO", voiceURI: "com.apple.voice.compact.nb-NO.siri" }]),
    ).toBe(true);
    expect(skalListesSomStemmevalg("Nora (Enhanced)", "nb-NO")).toBe(false);
    expect(skalListesSomStemmevalg("Microsoft Nora Compact", "nb-NO")).toBe(false);
    expect(skalListesSomStemmevalg("Henrik", "nb-NO")).toBe(true);
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
    expect(forberedTaleDeler("Hva begynner ordet «sol» med?")).toEqual(["Hva begynner ordet. sol. med?"]);
  });

  it("klipper trekk-sammen-lyder som isolerte bokstaver", () => {
    expect(forberedTaleDeler("Trekk sammen: rrr – aaa – mmm")).toEqual(["Trekk sammen:", "r", "a", "m"]);
    expect(forberedTaleDeler("Trekk sammen: lll – eee – rrr")).toEqual(["Trekk sammen:", "l", "e", "r"]);
    expect(lesOppgave({ prompt: "Trekk sammen: lll – eee – rrr", tale: "l. e. r." })).toMatch(/trekk sammen/i);
    expect(forberedUttale("Trekk sammen: lll – eee – rrr")).not.toMatch(/lll|rrr/i);
  });

  it("tar punktum-pause etter ordet, og klipper andre siterte ord uten punktum på verbet", () => {
    expect(forberedUttale("Hvilken bokstav begynner ordet «lese» med?")).toMatch(/ordet\.\s*lese\.\s*med/i);
    expect(forberedTaleDeler("Hvilken bokstav slutter ordet «de» på?")).toEqual([
      "Hvilken bokstav slutter ordet.",
      "de",
      "på?",
    ]);
    expect(lesOppgave({ prompt: "Hvilken bokstav slutter ordet «de» på?", tale: "de" })).toBe(
      "Hvilken bokstav slutter ordet «de» på?",
    );
  });

  it("klipper bokstavlyder én gang som eget klipp", () => {
    expect(forberedTaleDeler("Finn den lille bokstaven til E")).toEqual([
      "Finn den lille bokstaven til.",
      "e",
    ]);
    expect(forberedTaleDeler("Finn den lille bokstaven til R")).toEqual([
      "Finn den lille bokstaven til.",
      "r",
    ]);
    expect(forberedTaleDeler("Hvilket ord begynner med bokstaven «S»?")).toEqual([
      "Hvilket ord begynner med bokstaven?",
      "s",
    ]);
    expect(forberedTaleDeler("Finn den store bokstaven til r")).toEqual([
      "Finn den store bokstaven til.",
      "r",
    ]);
  });

  it("skiller ordet lyden fra selve lyden", () => {
    expect(forberedTaleDeler("Hvilken bokstav lager lyden rrr?")).toEqual([
      "Hvilken bokstav lager lyden?",
      "r",
    ]);
    expect(forberedTaleDeler("Hvilken bokstav sier aaa?")).toEqual(["Hvilken bokstav sier?", "a"]);
    expect(forberedTaleDeler("Finn den lille bokstaven til A")).toEqual([
      "Finn den lille bokstaven til.",
      "a",
    ]);
  });

  it("gir minst én taledel for alle oppgaver", () => {
    for (const oppgave of ALLE_OPPGAVER) {
      const deler = forberedTaleDeler(oppgave.prompt || oppgave.tale);
      expect(deler.length, oppgave.id).toBeGreaterThan(0);
    }
  });
});
