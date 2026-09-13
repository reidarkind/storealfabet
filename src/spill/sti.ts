export const STI_SEKUNDER = 40;
export const ANTALL_BANER = 3;

export type Bane = 0 | 1 | 2;
export type StiType = "krystall" | "diamant" | "zombie";

export interface StiObjekt {
  id: number;
  bane: Bane;
  y: number;
  type: StiType;
}

export interface StiTilstand {
  bane: Bane;
  tid: number;
  nesteId: number;
  spawnTeller: number;
  objekter: StiObjekt[];
  krystaller: number;
  diamanter: number;
  zombieTreff: number;
  ferdig: boolean;
}

export interface StiHendelse {
  type: "plukk" | "treff";
  objekt: StiType;
}

export function startSti(): StiTilstand {
  return {
    bane: 1,
    tid: STI_SEKUNDER,
    nesteId: 1,
    spawnTeller: 0,
    objekter: [],
    krystaller: 0,
    diamanter: 0,
    zombieTreff: 0,
    ferdig: false,
  };
}

export function velgBane(tilstand: StiTilstand, bane: Bane): StiTilstand {
  return { ...tilstand, bane };
}

function tilfeldigBane(tilfeldig: () => number): Bane {
  return Math.floor(tilfeldig() * ANTALL_BANER) as Bane;
}

function tilfeldigType(tilfeldig: () => number): StiType {
  const r = tilfeldig();
  if (r < 0.18) return "zombie";
  if (r < 0.3) return "diamant";
  return "krystall";
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
  const hendelser: StiHendelse[] = [];
  let krystaller = tilstand.krystaller;
  let diamanter = tilstand.diamanter;
  let zombieTreff = tilstand.zombieTreff;
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
    } else if (objekt.type === "krystall") {
      krystaller += 1;
      hendelser.push({ type: "plukk", objekt: "krystall" });
    } else {
      diamanter += 1;
      hendelser.push({ type: "plukk", objekt: "diamant" });
    }
  }

  if (spawnTeller >= 0.85) {
    spawnTeller = 0;
    beholdt.push({
      id: nesteId,
      bane: tilfeldigBane(tilfeldig),
      y: -0.12,
      type: tilfeldigType(tilfeldig),
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
      krystaller,
      diamanter,
      zombieTreff,
      ferdig: tid <= 0,
    },
    hendelser,
  };
}
