import { describe, expect, it } from "vitest";
import { distFraZ, zFraDist } from "./perspektiv";
import {
  flyttX,
  settX,
  startSti,
  fortsettEtterZombie,
  STI_SEKUNDER,
  stiFremgang,
  stiSkala,
  stiTick,
  stiVenstre,
  baesjHint,
  trafikkBilde,
  trafikkHint,
  xFraSkjerm,
} from "./sti";

function nær(x: number, type: "krystall" | "zombie" | "baesj" | "diamant" | "syklist" | "bil", tid = STI_SEKUNDER) {
  return { id: 1, x, dist: distFraZ(0.9, tid), type };
}

describe("sti", () => {
  it("starter i midten og blir ferdig etter tiden", () => {
    const start = startSti();
    expect(start.x).toBeCloseTo(0.5);
    expect(start.ferdig).toBe(false);
    const slutt = stiTick(start, start.tid + 0.1).tilstand;
    expect(slutt.ferdig).toBe(true);
    expect(slutt.tid).toBe(0);
  });

  it("plukker krystall nær Alf og unngår zombie lenger unna", () => {
    const t = {
      ...startSti(),
      x: 0.5,
      objekter: [
        { id: 1, x: 0.48, dist: distFraZ(0.9, STI_SEKUNDER), type: "krystall" as const },
        { id: 2, x: 0.12, dist: distFraZ(0.9, STI_SEKUNDER), type: "zombie" as const },
      ],
    };
    const { tilstand, hendelser } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.krystaller).toBe(1);
    expect(tilstand.zombieTreff).toBe(0);
    expect(hendelser.map((h) => h.type)).toEqual(["plukk"]);
  });

  it("treffer zombie når Alf er nær nok og gjør veien ferdig til duell", () => {
    const t = settX(
      {
        ...startSti(),
        objekter: [nær(0.8, "zombie")],
      },
      0.82,
    );
    const { tilstand } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.zombieTreff).toBe(1);
    expect(tilstand.ferdig).toBe(true);
  });

  it("etter zombieduell kan Alf gå videre på samme vei", () => {
    const t = settX(
      {
        ...startSti(),
        tid: 28,
        objekter: [nær(0.8, "zombie", 28)],
      },
      0.82,
    );
    const truffet = stiTick(t, 0.01, () => 0.99).tilstand;
    const videre = fortsettEtterZombie(truffet);
    expect(videre.ferdig).toBe(false);
    expect(videre.zombieTreff).toBe(0);
    expect(videre.tid).toBeCloseTo(truffet.tid);
  });

  it("følger fingeren flytende, ikke i tre felt", () => {
    expect(xFraSkjerm(0.5)).toBeCloseTo(0.5, 1);
    expect(xFraSkjerm(0.34)).toBeLessThan(xFraSkjerm(0.41));
    expect(xFraSkjerm(0.41)).toBeLessThan(xFraSkjerm(0.5));
    expect(xFraSkjerm(0.58)).toBeGreaterThan(xFraSkjerm(0.5));
    expect(xFraSkjerm(0.0)).toBeLessThan(0.12);
    expect(xFraSkjerm(1.0)).toBeGreaterThan(0.88);
  });

  it("flytter Alf litt og stopper i kanten", () => {
    const midt = startSti();
    expect(flyttX(midt, -0.2).x).toBeCloseTo(0.3);
    expect(flyttX(flyttX(midt, -1), -1).x).toBeGreaterThanOrEqual(0);
    expect(flyttX(midt, 1).x).toBeLessThanOrEqual(1);
  });

  it("gjør steiner større når de kommer nærmere", () => {
    expect(stiSkala(0.1)).toBeLessThan(stiSkala(0.9));
    expect(stiVenstre(0.1, 0.1)).not.toBe(stiVenstre(0.1, 0.9));
    expect(stiVenstre(0.2, 0.8)).not.toBe(stiVenstre(0.7, 0.8));
  });

  it("plukker bæsj nær Alf", () => {
    const t = settX(
      {
        ...startSti(),
        objekter: [nær(0.5, "baesj")],
      },
      0.5,
    );
    const { tilstand, hendelser } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.baesj).toBe(1);
    expect(hendelser.map((h) => h.type)).toEqual(["baesj"]);
    expect(hendelser[0]?.tekst).toMatch(/bæsj/i);
  });

  it("advarer mot hundebæsj med ulike tekster", () => {
    const tekster = new Set([0, 0.2, 0.4, 0.6, 0.8].map((n) => baesjHint(() => n)));
    expect(tekster.has("Ikke ta på hundebæsj!")).toBe(true);
    expect(tekster.size).toBeGreaterThanOrEqual(4);
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

  it("lar hus stå på samme veipunkt mens kameraet kjører", () => {
    const dist = distFraZ(0.4, STI_SEKUNDER);
    const start = {
      ...startSti(),
      dekor: [{ id: 9, side: -1 as const, dist, type: "hus" as const }],
    };
    const { tilstand } = stiTick(start, 0.2, () => 0.99);
    expect(tilstand.dekor[0]?.dist).toBe(dist);
    expect(zFraDist(dist, tilstand.tid)).toBeGreaterThan(zFraDist(dist, start.tid));
    expect(tilstand.baesj).toBe(0);
  });

  it("lar skolen komme nærmere mot slutten", () => {
    expect(stiFremgang(40)).toBe(0);
    expect(stiFremgang(0)).toBe(1);
    expect(stiFremgang(20)).toBeCloseTo(0.5);
  });

  it("lar stein gli forbi når Alf ikke er nær nok", () => {
    const t = {
      ...startSti(),
      x: 0.2,
      objekter: [{ id: 1, x: 0.85, dist: distFraZ(0.9, STI_SEKUNDER), type: "krystall" as const }],
    };
    const { tilstand, hendelser } = stiTick(t, 0.01, () => 0.99);
    expect(tilstand.krystaller).toBe(0);
    expect(tilstand.objekter).toHaveLength(1);
    expect(hendelser).toEqual([]);
  });

  it("legger steiner på tilfeldig sted i veien, ikke bare tre felt", () => {
    const xs = new Set<string>();
    for (let i = 0; i < 12; i++) {
      let n = 0;
      const { tilstand } = stiTick({ ...startSti(), spawnTeller: 0.55, objekter: [] }, 0.01, () => {
        n += 1;
        return (0.13 * (i + n)) % 1;
      });
      const stein = tilstand.objekter[0];
      expect(stein).toBeDefined();
      xs.add((stein?.x ?? 0).toFixed(2));
    }
    expect(xs.size).toBeGreaterThan(3);
    expect([...xs].every((v) => Number(v) >= 0 && Number(v) <= 1)).toBe(true);
  });

  it("har syklist og bil i veien, ikke som pynt i grøfta", () => {
    const start = startSti();
    expect(start.objekter.some((o) => o.type === "syklist")).toBe(true);
    expect(start.objekter.some((o) => o.type === "bil")).toBe(true);
    expect(start.dekor.some((d) => d.type === "syklist")).toBe(false);
  });

  it("sier ifra om trafikk uten å stanse veien", () => {
    const t = settX(
      {
        ...startSti(),
        objekter: [nær(0.5, "syklist")],
      },
      0.5,
    );
    const { tilstand, hendelser } = stiTick(t, 0.01, () => 0.2);
    expect(hendelser[0]?.type).toBe("trafikk");
    expect(hendelser[0]?.objekt).toBe("syklist");
    expect(hendelser[0]?.tekst).toBeTruthy();
    expect(tilstand.ferdig).toBe(false);
  });

  it("lar syklisten sykle mot Alf", () => {
    const dist = distFraZ(0.4, STI_SEKUNDER);
    const t = {
      ...startSti(),
      objekter: [{ id: 1, x: 0.4, dist, type: "syklist" as const, retning: "mot" as const }],
    };
    const { tilstand } = stiTick(t, 0.2, () => 0.99);
    expect(tilstand.objekter[0]?.dist).toBeLessThan(dist);
  });

  it("lar biler kjøre fra Alf mot horisonten", () => {
    const dist = distFraZ(0.6, STI_SEKUNDER);
    const t = {
      ...startSti(),
      objekter: [{ id: 1, x: 0.6, dist, type: "bil" as const, retning: "fra" as const }],
    };
    const { tilstand } = stiTick(t, 0.2, () => 0.99);
    expect(tilstand.objekter[0]?.dist).toBeGreaterThan(dist);
  });

  it("vingler sykkelen fram og tilbake i veien", () => {
    const dist = distFraZ(0.3, STI_SEKUNDER);
    const start = {
      ...startSti(),
      objekter: [
        {
          id: 1,
          x: 0.5,
          dist,
          type: "syklist" as const,
          retning: "mot" as const,
          baneX: 0.5,
          vingleFase: 0,
        },
      ],
    };
    const a = stiTick(start, 0.15, () => 0.99).tilstand;
    const b = stiTick(a, 0.15, () => 0.99).tilstand;
    expect(a.objekter[0]?.x).not.toBeCloseTo(b.objekter[0]?.x ?? -1, 3);
    expect(a.objekter[0]?.x).toBeGreaterThan(0.35);
    expect(a.objekter[0]?.x).toBeLessThan(0.65);
  });

  it("viser trafikk forfra eller bakfra", () => {
    expect(trafikkBilde("bil", "mot")).toBe("bil");
    expect(trafikkBilde("bil", "fra")).toBe("bil-bak");
    expect(trafikkBilde("syklist", "mot")).toBe("syklist");
    expect(trafikkBilde("syklist", "fra")).toBe("syklist-bak");
  });

  it("gir ulike trafikkhint", () => {
    const a = trafikkHint("bil", () => 0.1);
    const b = trafikkHint("syklist", () => 0.8);
    expect(a.length).toBeGreaterThan(8);
    expect(b.length).toBeGreaterThan(8);
    expect(a).not.toBe(b);
  });
});
