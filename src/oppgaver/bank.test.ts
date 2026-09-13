import { describe, expect, it } from "vitest";
import { ALLE_OPPGAVER } from "./data";
import { erGyldigOppgave, erLydrettOrd, sjekkSvar, trekkOppgave } from "./bank";

describe("oppgavebank", () => {
  it("har fasit blant valgene, unntatt tegning", () => {
    for (const oppgave of ALLE_OPPGAVER) {
      expect(erGyldigOppgave(oppgave), oppgave.id).toBe(true);
    }
  });

  it("har æ ø å blant 1. klasse-oppgavene", () => {
    const tekst = ALLE_OPPGAVER.filter((o) => o.nivaa === "forste")
      .map((o) => `${o.valg.join()}${o.fasit}${o.prompt}`)
      .join()
      .toLowerCase();
    expect(tekst).toContain("æ");
    expect(tekst).toContain("ø");
    expect(tekst).toContain("å");
  });

  it("bruker lydrette ord på 1. og 2. klasse når fasit er et ord", () => {
    const ordOppgaver = ALLE_OPPGAVER.filter(
      (o) =>
        (o.nivaa === "forste" || o.nivaa === "andre") &&
        (o.type === "trekkSammen" || o.type === "rim" || o.type === "byggOrd") &&
        /^[a-zæøå]+$/i.test(o.fasit) &&
        o.fasit.length > 1 &&
        !/^\d+$/.test(o.fasit),
    );
    for (const oppgave of ordOppgaver) {
      expect(erLydrettOrd(oppgave.fasit), oppgave.id).toBe(true);
    }
  });

  it("godtar riktig svar uten å bry seg om store bokstaver", () => {
    const oppgave = ALLE_OPPGAVER.find((o) => o.id === "f-lyd-s");
    expect(oppgave).toBeDefined();
    expect(sjekkSvar(oppgave!, "s").riktig).toBe(true);
    expect(sjekkSvar(oppgave!, "M").riktig).toBe(false);
  });

  it("unngår brukt id når det finnes flere", () => {
    const brukt = new Set(["f-lyd-s"]);
    const oppgave = trekkOppgave("forste", brukt, () => 0);
    expect(oppgave.id).not.toBe("f-lyd-s");
  });

  it("har mange ulike oppgaver så samme tekst ikke går i ett kjør", () => {
    const ids = ALLE_OPPGAVER.map((o) => o.id);
    const tekster = ALLE_OPPGAVER.map((o) => o.prompt);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(tekster).size).toBe(tekster.length);
    expect(ALLE_OPPGAVER.length).toBeGreaterThanOrEqual(400);
    expect(ALLE_OPPGAVER.filter((o) => o.nivaa === "forste").length).toBeGreaterThanOrEqual(150);
    expect(ALLE_OPPGAVER.filter((o) => o.nivaa === "andre").length).toBeGreaterThanOrEqual(150);
    expect(ALLE_OPPGAVER.filter((o) => o.nivaa === "utfordrende").length).toBeGreaterThanOrEqual(80);
  });

  it("blandet kan trekke fra alle nivåer", () => {
    const sett = new Set<string>();
    for (let i = 0; i < 40; i++) {
      sett.add(trekkOppgave("blandet", new Set(), () => i / 40).nivaa);
    }
    expect(sett.has("forste") || sett.has("andre") || sett.has("utfordrende")).toBe(true);
  });
});
