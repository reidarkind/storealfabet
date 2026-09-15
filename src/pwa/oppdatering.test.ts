import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { oppdateringTekst, sjekkForOppdatering } from "./oppdatering";

describe("oppdatering", () => {
  it("forteller barnet om nett, ny versjon og feil", () => {
    expect(oppdateringTekst("sjekker")).toBe("Sjekker…");
    expect(oppdateringTekst("offline")).toBe("Du spiller fra telefonen. Prøv igjen når du er på nett.");
    expect(oppdateringTekst("nyeste")).toBe("Du har nyeste.");
    expect(oppdateringTekst("ny")).toBe("Ny versjon. Åpne appen på nytt.");
    expect(oppdateringTekst("feil")).toBe("Klarte ikke å sjekke. Prøv igjen.");
  });

  it("sjekker ikke når telefonen er offline", async () => {
    let kalt = false;
    const utfall = await sjekkForOppdatering({
      online: false,
      hentNyVersjon: async () => {
        kalt = true;
        return true;
      },
    });
    expect(utfall).toBe("offline");
    expect(kalt).toBe(false);
  });

  it("skiller ny versjon fra den som allerede ligger på telefonen", async () => {
    expect(await sjekkForOppdatering({ online: true, hentNyVersjon: async () => false })).toBe("nyeste");
    expect(await sjekkForOppdatering({ online: true, hentNyVersjon: async () => true })).toBe("ny");
  });

  it("tåler at sjekken feiler", async () => {
    const utfall = await sjekkForOppdatering({
      online: true,
      hentNyVersjon: async () => {
        throw new Error("nett");
      },
    });
    expect(utfall).toBe("feil");
  });

  it("har knapp i innstillinger og laster Nunito lokalt", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
    const vite = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
    expect(html).toContain("Sjekk for oppdateringer");
    expect(html).toContain('id="sjekk-oppdatering"');
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family:\s*Nunito/);
    expect(css).toMatch(/nunito-latin.*\.woff2/);
    expect(css).toMatch(/nunito-latin-ext.*\.woff2/);
    expect(vite).toMatch(/registerType:\s*"prompt"/);
    expect(vite).toMatch(/globPatterns:\s*\["\*\*\/\*\.\{js,css,html,svg,png,woff2,json,wasm\}"\]/);
  });
});
