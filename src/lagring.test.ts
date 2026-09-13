import { describe, expect, it } from "vitest";
import { lesLagring, oppdaterRekord } from "./lagring";

function medMinne(innhold: Record<string, string>, kjor: () => void): void {
  const minne = new Map(Object.entries(innhold));
  const forrige = (globalThis as { localStorage?: Storage }).localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (nokkel: string) => minne.get(nokkel) ?? null,
      setItem: (nokkel: string, verdi: string) => {
        minne.set(nokkel, verdi);
      },
      removeItem: (nokkel: string) => {
        minne.delete(nokkel);
      },
    },
  });
  try {
    kjor();
  } finally {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: forrige });
  }
}

describe("lagring", () => {
  it("bytter Nora ut med Alfs stemme", () => {
    medMinne(
      {
        "storealfabet-v1": JSON.stringify({
          innstillinger: { nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "Microsoft Nora Compact" },
          besteVerdi: 0,
          finesteMelk: "vanlig",
        }),
      },
      () => {
        expect(lesLagring().innstillinger.stemme).toBe("alf");
      },
    );
  });

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
