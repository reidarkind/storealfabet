import { describe, expect, it } from "vitest";
import { baneFraX, flyttBane, startSti, stiSkala, stiTick, stiVenstre, velgBane } from "./sti";

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
});
