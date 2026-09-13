import { describe, expect, it } from "vitest";
import {
  erBlantDeTi,
  lesLagring,
  navnTilTavle,
  nullstillRekorder,
  oppdaterRekord,
  settInnRekord,
  trengerAnonymBekreftelse,
} from "./lagring";

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
  it("bruker Alfs stemme som standard og bytter Compact Nora til Alf", () => {
    medMinne({}, () => {
      expect(lesLagring().innstillinger.stemme).toBe("alf");
    });
    medMinne(
      {
        "storealfabet-v1": JSON.stringify({
          innstillinger: { nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "auto" },
          besteVerdi: 0,
          finesteMelk: "vanlig",
        }),
      },
      () => {
        expect(lesLagring().innstillinger.stemme).toBe("alf");
      },
    );
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

  it("slipper inn de ti beste og ber om bekreftelse når navnet er tomt", () => {
    expect(erBlantDeTi([], 1)).toBe(true);
    expect(trengerAnonymBekreftelse("")).toBe(true);
    expect(trengerAnonymBekreftelse("   ")).toBe(true);
    expect(trengerAnonymBekreftelse("Mia")).toBe(false);
    expect(navnTilTavle("")).toBe("Anonym");
    expect(navnTilTavle("  Mia  ")).toBe("Mia");
    const full = Array.from({ length: 10 }, (_, i) => ({
      navn: `Barn ${i}`,
      verdi: 20 - i,
      melk: "vanlig" as const,
    }));
    expect(erBlantDeTi(full, 12)).toBe(true);
    expect(erBlantDeTi(full, 5)).toBe(false);
    const tavle = settInnRekord(full, { navn: "Alf", verdi: 18, melk: "jordbaer" });
    expect(tavle).toHaveLength(10);
    expect(tavle[0]?.navn).toBe("Barn 0");
    expect(tavle.some((rad) => rad.navn === "Alf")).toBe(true);
    expect(tavle.some((rad) => rad.verdi === 11)).toBe(false);
  });

  it("nullstiller tavle og beste tur", () => {
    const full = {
      innstillinger: { nivaa: "forste" as const, lydPa: true, sekk: "lilla" as const, stemme: "alf" },
      besteVerdi: 12,
      finesteMelk: "stjerne" as const,
      tavle: [{ navn: "Mia", verdi: 12, melk: "stjerne" as const }],
    };
    const tom = nullstillRekorder(full);
    expect(tom.besteVerdi).toBe(0);
    expect(tom.finesteMelk).toBe("vanlig");
    expect(tom.tavle).toEqual([]);
    expect(tom.innstillinger.stemme).toBe("alf");
  });
});
