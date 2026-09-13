import { describe, expect, it } from "vitest";
import { startSti, stiTick, velgBane } from "./sti";

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
});
