import { describe, expect, it } from "vitest";
import { oppdaterRekord } from "./lagring";

describe("lagring", () => {
  it("beholder den fineste melken", () => {
    const start = {
      innstillinger: { nivaa: "forste" as const, lydPa: true, sekk: "lilla" as const, stemme: "" },
      besteVerdi: 4,
      finesteMelk: "jordbaer" as const,
    };
    expect(oppdaterRekord(start, 3, "vanlig").finesteMelk).toBe("jordbaer");
    expect(oppdaterRekord(start, 12, "stjerne").finesteMelk).toBe("stjerne");
    expect(oppdaterRekord(start, 12, "stjerne").besteVerdi).toBe(12);
  });
});
