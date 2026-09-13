import { describe, expect, it } from "vitest";
import { baneFraX, flyttBane, startSti, stiFremgang, stiSkala, stiTick, stiVenstre, velgBane } from "./sti";

describe("sti", () => {
  it("starter i midten og blir ferdig etter tiden", () => {
    const start = startSti();
    expect(start.bane).toBe(1);
    expect(start.ferdig).toBe(false);
    const slutt = stiTick(start, start.tid + 0.1).tilstand;
    expect(slutt.ferdig).toBe(true);
    expect(slutt.tid).toBe(0);
  });

  it("plukker krystall i samme bane og unngår zombie i annen bane", () => {
    let t = startSti();
    t = {
      ...t,
      objekter: [
        { id: 1, bane: 1, y: 0.9, type: "krystall" },
        { id: 2, bane: 0, y: 0.9, type: "zombie" },
      ],
    };
    const { tilstand, hendelser } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.krystaller).toBe(1);
    expect(tilstand.zombieTreff).toBe(0);
    expect(hendelser.map((h) => h.type)).toEqual(["plukk"]);
  });

  it("treffer zombie i samme bane", () => {
    const t = velgBane(
      {
        ...startSti(),
        objekter: [{ id: 1, bane: 2, y: 0.9, type: "zombie" }],
      },
      2,
    );
    const { tilstand } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.zombieTreff).toBe(1);
  });

  it("deler skjermen i venstre, midten og høyre", () => {
    expect(baneFraX(0.1)).toBe(0);
    expect(baneFraX(0.5)).toBe(1);
    expect(baneFraX(0.9)).toBe(2);
  });

  it("flytter Alf ett felt og stopper i kanten", () => {
    const midt = startSti();
    expect(flyttBane(midt, -1).bane).toBe(0);
    expect(flyttBane(flyttBane(midt, -1), -1).bane).toBe(0);
    expect(flyttBane(midt, 1).bane).toBe(2);
  });

  it("gjør steiner større når de kommer nærmere", () => {
    expect(stiSkala(0.1)).toBeLessThan(stiSkala(0.9));
    expect(stiVenstre(0, 0.1)).not.toBe(stiVenstre(0, 0.9));
  });

  it("plukker bæsj i samme bane", () => {
    const t = velgBane(
      {
        ...startSti(),
        objekter: [{ id: 1, bane: 1, y: 0.9, type: "baesj" }],
      },
      1,
    );
    const { tilstand, hendelser } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.baesj).toBe(1);
    expect(hendelser.map((h) => h.type)).toEqual(["baesj"]);
  });

  it("har hus, folk og zombie langs veien fra start", () => {
    const start = startSti();
    expect(start.dekor.length).toBeGreaterThanOrEqual(8);
    expect(start.dekor.some((d) => d.type === "hus")).toBe(true);
    expect(start.objekter.some((o) => o.type === "zombie")).toBe(true);
    expect(start.objekter.some((o) => o.type === "baesj")).toBe(true);
  });

  it("fyller grøfta med mer dekor", () => {
    const start = { ...startSti(), spawnTeller: 0.55, dekor: [] };
    const { tilstand } = stiTick(start, 0.01, () => 0.1);
    expect(tilstand.dekor.length).toBeGreaterThanOrEqual(2);
  });

  it("lar hus og syklister gli forbi uten treff", () => {
    const start = {
      ...startSti(),
      dekor: [{ id: 9, side: -1 as const, y: 0.4, type: "hus" as const }],
    };
    const { tilstand } = stiTick(start, 0.2, () => 0.99);
    expect(tilstand.dekor[0]?.y).toBeGreaterThan(0.4);
    expect(tilstand.baesj).toBe(0);
  });

  it("lar skolen komme nærmere mot slutten", () => {
    expect(stiFremgang(40)).toBe(0);
    expect(stiFremgang(0)).toBe(1);
    expect(stiFremgang(20)).toBeCloseTo(0.5);
  });
});
