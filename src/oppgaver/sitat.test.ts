import { describe, expect, it } from "vitest";
import { htmlMedSitertOrd, siterOrd } from "./sitat";

describe("sitat", () => {
  it("setter norske anførselstegn rundt ordet", () => {
    expect(siterOrd("de")).toBe("«de»");
  });

  it("merker siterte ord i spørsmålstekst", () => {
    expect(htmlMedSitertOrd("Hvilken bokstav slutter «de» på?")).toBe(
      'Hvilken bokstav slutter <span class="oppgave-ord">«de»</span> på?',
    );
  });
});
