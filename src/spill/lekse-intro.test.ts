import { describe, expect, it } from "vitest";
import { krasjTekst, lekseIntro } from "./lekse-intro";

describe("lekse-intro", () => {
  it("teller sykler og biler med riktig tallord", () => {
    expect(krasjTekst(2, 1)).toBe("Du krasjet med 2 sykler og 1 bil.");
    expect(krasjTekst(1, 0)).toBe("Du krasjet med 1 sykkel.");
    expect(krasjTekst(0, 3)).toBe("Du krasjet med 3 biler.");
    expect(krasjTekst(1, 1)).toBe("Du krasjet med 1 sykkel og 1 bil.");
    expect(krasjTekst(0, 0)).toBe("");
  });

  it("starter med at Alf har glemt leksene", () => {
    const intro = lekseIntro({ sykler: 0, biler: 0, baesj: 0 }, () => 0);
    expect(intro.avsnitt[0] ?? "").toMatch(/lekse/i);
    expect(intro.avsnitt.join(" ")).not.toMatch(/krasjet/i);
    expect(intro.visTrafikk).toBe(false);
    expect(intro.visBaesj).toBe(false);
    expect(intro.tale).toMatch(/lekse/i);
  });

  it("legger til krasj, trafikktips og bæsj etter leksene", () => {
    const intro = lekseIntro({ sykler: 2, biler: 1, baesj: 1 }, () => 0);
    expect(intro.avsnitt[0] ?? "").toMatch(/lekse/i);
    expect(intro.avsnitt.join(" ")).toContain("Du krasjet med 2 sykler og 1 bil.");
    expect(intro.avsnitt.join(" ")).toMatch(/fortau|se deg|veien|sykkel|bil/i);
    expect(intro.avsnitt.join(" ")).toMatch(/bæsj|spis|drikk/i);
    expect(intro.visTrafikk).toBe(true);
    expect(intro.visBaesj).toBe(true);
    expect(intro.tale).toContain("sykler");
  });
});
