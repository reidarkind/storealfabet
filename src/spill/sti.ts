export const STI_SEKUNDER = 40;
export const ANTALL_BANER = 3;

export type Bane = 0 | 1 | 2;
export type StiType = "krystall" | "diamant" | "zombie" | "baesj";
export type DekorType = "hus" | "syklist" | "hund" | "barn" | "tre";
export type DekorSide = -1 | 1;

export interface StiObjekt {
  id: number;
  bane: Bane;
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
  bane: Bane;
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

export function startSti(): StiTilstand {
  return {
    bane: 1,
    tid: STI_SEKUNDER,
    nesteId: 16,
    spawnTeller: 0.35,
    objekter: [
      { id: 1, bane: 0, y: 0.2, type: "krystall" },
      { id: 2, bane: 2, y: 0.34, type: "zombie" },
      { id: 3, bane: 1, y: 0.1, type: "diamant" },
      { id: 14, bane: 0, y: 0.56, type: "baesj" },
      { id: 15, bane: 1, y: 0.7, type: "krystall" },
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

export function velgBane(tilstand: StiTilstand, bane: Bane): StiTilstand {
  return { ...tilstand, bane };
}

export function baneFraX(rel: number): Bane {
  if (rel < 1 / 3) return 0;
  if (rel < 2 / 3) return 1;
  return 2;
}

export function flyttBane(tilstand: StiTilstand, steg: -1 | 1): StiTilstand {
  const bane = Math.max(0, Math.min(2, tilstand.bane + steg)) as Bane;
  return { ...tilstand, bane };
}

export function stiSkala(y: number): number {
  const klem = Math.max(0, Math.min(1, y));
  return 0.42 + klem * 1.05;
}

export function stiVenstre(bane: Bane, y: number): string {
  const klem = Math.max(0, Math.min(1, y));
  const spre = 10 + klem * 28;
  return `${50 + (bane - 1) * spre}%`;
}

export function stiDekorVenstre(side: DekorSide, y: number): string {
  const klem = Math.max(0, Math.min(1, y));
  return `${50 + side * (18 + klem * 24)}%`;
}

export function stiFremgang(tid: number): number {
  return Math.max(0, Math.min(1, 1 - tid / STI_SEKUNDER));
}

function tilfeldigBane(tilfeldig: () => number): Bane {
  return Math.floor(tilfeldig() * ANTALL_BANER) as Bane;
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
    if (objekt.bane !== tilstand.bane) {
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
      bane: tilfeldigBane(tilfeldig),
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
