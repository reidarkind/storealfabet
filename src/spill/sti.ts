export const STI_SEKUNDER = 40;
export const PLUKK_AVSTAND = 0.18;

export type StiType = "krystall" | "diamant" | "zombie" | "baesj";
export type DekorType = "hus" | "syklist" | "hund" | "barn" | "tre";
export type DekorSide = -1 | 1;

export interface StiObjekt {
  id: number;
  x: number;
  y: number;
  type: StiType;
}

export interface StiDekor {
  id: number;
  side: DekorSide;
  y: number;
  type: DekorType;
}

export interface StiTilstand {
  x: number;
  tid: number;
  nesteId: number;
  spawnTeller: number;
  objekter: StiObjekt[];
  dekor: StiDekor[];
  krystaller: number;
  diamanter: number;
  zombieTreff: number;
  baesj: number;
  ferdig: boolean;
}

export interface StiHendelse {
  type: "plukk" | "treff" | "baesj";
  objekt: StiType;
}

function klem(verdi: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, verdi));
}

export function klemX(x: number): number {
  return klem(x, 0.04, 0.96);
}

export function startSti(): StiTilstand {
  return {
    x: 0.5,
    tid: STI_SEKUNDER,
    nesteId: 16,
    spawnTeller: 0.35,
    objekter: [
      { id: 1, x: 0.22, y: 0.2, type: "krystall" },
      { id: 2, x: 0.81, y: 0.34, type: "zombie" },
      { id: 3, x: 0.47, y: 0.1, type: "diamant" },
      { id: 14, x: 0.33, y: 0.56, type: "baesj" },
      { id: 15, x: 0.64, y: 0.7, type: "krystall" },
    ],
    dekor: [
      { id: 4, side: -1, y: 0.06, type: "hus" },
      { id: 5, side: 1, y: 0.12, type: "tre" },
      { id: 6, side: -1, y: 0.24, type: "syklist" },
      { id: 7, side: 1, y: 0.2, type: "hus" },
      { id: 8, side: -1, y: 0.38, type: "hund" },
      { id: 9, side: 1, y: 0.34, type: "barn" },
      { id: 10, side: -1, y: 0.52, type: "tre" },
      { id: 11, side: 1, y: 0.58, type: "hund" },
      { id: 12, side: -1, y: 0.68, type: "hus" },
      { id: 13, side: 1, y: 0.76, type: "syklist" },
    ],
    krystaller: 0,
    diamanter: 0,
    zombieTreff: 0,
    baesj: 0,
    ferdig: false,
  };
}

export function settX(tilstand: StiTilstand, x: number): StiTilstand {
  return { ...tilstand, x: klemX(x) };
}

export function stiSpre(y: number): number {
  return 10 + klem(y) * 28;
}

export function xFraSkjerm(rel: number, y = 0.92): number {
  const spre = stiSpre(y) / 100;
  const venstre = 0.5 - spre;
  const hoyre = 0.5 + spre;
  if (hoyre <= venstre) return 0.5;
  return klemX((rel - venstre) / (hoyre - venstre));
}

export function flyttX(tilstand: StiTilstand, steg: number): StiTilstand {
  return settX(tilstand, tilstand.x + steg);
}

export function stiSkala(y: number): number {
  return 0.42 + klem(y) * 1.05;
}

export function stiVenstre(x: number, y: number): string {
  return `${50 + (klem(x) - 0.5) * 2 * stiSpre(y)}%`;
}

export function stiDekorVenstre(side: DekorSide, y: number): string {
  return `${50 + side * (18 + klem(y) * 24)}%`;
}

export function stiFremgang(tid: number): number {
  return klem(1 - tid / STI_SEKUNDER);
}

function tilfeldigVeiX(tilfeldig: () => number): number {
  return 0.08 + tilfeldig() * 0.84;
}

function tilfeldigType(tilfeldig: () => number): StiType {
  const r = tilfeldig();
  if (r < 0.16) return "zombie";
  if (r < 0.26) return "baesj";
  if (r < 0.38) return "diamant";
  return "krystall";
}

function tilfeldigDekor(tilfeldig: () => number): DekorType {
  const r = tilfeldig();
  if (r < 0.26) return "hus";
  if (r < 0.48) return "tre";
  if (r < 0.66) return "syklist";
  if (r < 0.84) return "hund";
  return "barn";
}

function treffer(alfX: number, objektX: number): boolean {
  return Math.abs(alfX - objektX) <= PLUKK_AVSTAND;
}

export function stiTick(
  tilstand: StiTilstand,
  dt: number,
  tilfeldig = Math.random,
): { tilstand: StiTilstand; hendelser: StiHendelse[] } {
  if (tilstand.ferdig) {
    return { tilstand, hendelser: [] };
  }

  const tid = Math.max(0, tilstand.tid - dt);
  let spawnTeller = tilstand.spawnTeller + dt;
  let nesteId = tilstand.nesteId;
  const objekter = tilstand.objekter.map((o) => ({ ...o, y: o.y + dt * 0.42 }));
  const dekor = tilstand.dekor.map((o) => ({ ...o, y: o.y + dt * 0.38 })).filter((o) => o.y < 1.15);
  const hendelser: StiHendelse[] = [];
  let krystaller = tilstand.krystaller;
  let diamanter = tilstand.diamanter;
  let zombieTreff = tilstand.zombieTreff;
  let baesj = tilstand.baesj;
  const beholdt: StiObjekt[] = [];

  for (const objekt of objekter) {
    if (objekt.y < 0.86) {
      beholdt.push(objekt);
      continue;
    }
    if (objekt.y > 1.12) {
      continue;
    }
    if (!treffer(tilstand.x, objekt.x)) {
      beholdt.push(objekt);
      continue;
    }
    if (objekt.type === "zombie") {
      zombieTreff += 1;
      hendelser.push({ type: "treff", objekt: "zombie" });
    } else if (objekt.type === "baesj") {
      baesj += 1;
      hendelser.push({ type: "baesj", objekt: "baesj" });
    } else if (objekt.type === "krystall") {
      krystaller += 1;
      hendelser.push({ type: "plukk", objekt: "krystall" });
    } else {
      diamanter += 1;
      hendelser.push({ type: "plukk", objekt: "diamant" });
    }
  }

  if (spawnTeller >= 0.55) {
    spawnTeller = 0;
    beholdt.push({
      id: nesteId,
      x: tilfeldigVeiX(tilfeldig),
      y: -0.12,
      type: tilfeldigType(tilfeldig),
    });
    nesteId += 1;
    dekor.push({
      id: nesteId,
      side: -1,
      y: -0.18,
      type: tilfeldigDekor(tilfeldig),
    });
    nesteId += 1;
    dekor.push({
      id: nesteId,
      side: 1,
      y: -0.1,
      type: tilfeldigDekor(tilfeldig),
    });
    nesteId += 1;
  }

  return {
    tilstand: {
      ...tilstand,
      tid,
      spawnTeller,
      nesteId,
      objekter: beholdt,
      dekor,
      krystaller,
      diamanter,
      zombieTreff,
      baesj,
      ferdig: tid <= 0,
    },
    hendelser,
  };
}
