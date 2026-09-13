import { distFraZ, prosjektPunkt, veiEndeZ, veiPunkt, zFraDist } from "./perspektiv";

export const STI_SEKUNDER = 40;
export const PLUKK_AVSTAND = 0.18;
export const ZOMBIE_AVSTAND = 0.13;
export const MAX_ZOMBIE_PER_STI = 1;

export type StiType = "krystall" | "diamant" | "zombie" | "baesj" | "syklist" | "bil";
export type DekorType = "hus" | "hund" | "barn" | "tre";
export type TrafikkType = "syklist" | "bil";
export type TrafikkRetning = "mot" | "fra";
export type DekorSide = -1 | 1;

export interface StiObjekt {
  id: number;
  x: number;
  dist: number;
  type: StiType;
  retning?: TrafikkRetning;
  baneX?: number;
  vingleFase?: number;
}

export interface StiDekor {
  id: number;
  side: DekorSide;
  dist: number;
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
  zombieSpawnet: number;
}

export interface StiHendelse {
  type: "plukk" | "treff" | "baesj" | "trafikk";
  objekt: StiType;
  tekst?: string;
}

export const TRAFIKK_HINT_SYKKEL = [
  "Pass på syklisten!",
  "Sykler trenger plass i veien.",
  "Gå på fortauet, Alf!",
  "Se deg for før du krysser!",
];

export const TRAFIKK_HINT_BIL = [
  "Pass deg for trafikken!",
  "Bilen så deg ikke. Bruk fortauet.",
  "Biler kjører fort. Gå på fortauet.",
  "Se til begge sider!",
  "Hold deg i veikanten.",
];

export const BAESJ_HINT = [
  "Ikke ta på hundebæsj!",
  "Æsj! Hundebæsj. Gå utenom.",
  "Alf, ikke plukk bæsj!",
  "Bæsj er ekkelt. La den ligge.",
  "Hold deg unna hundebæsj.",
  "Uff da, bæsj i potene!",
];

export function trafikkHint(type: TrafikkType, tilfeldig = Math.random): string {
  const liste = type === "bil" ? TRAFIKK_HINT_BIL : TRAFIKK_HINT_SYKKEL;
  return liste[Math.floor(tilfeldig() * liste.length)] ?? "Pass deg for trafikken!";
}

export function baesjHint(tilfeldig = Math.random): string {
  return BAESJ_HINT[Math.floor(tilfeldig() * BAESJ_HINT.length)] ?? "Ikke ta på hundebæsj!";
}

export function trafikkBilde(type: TrafikkType, retning: TrafikkRetning = "mot"): string {
  return retning === "fra" ? `${type}-bak` : type;
}

export function vingleX(baneX: number, tid: number, fase: number): number {
  return klemX(baneX + Math.sin(tid * 4.4 + fase) * 0.075);
}

function klem(verdi: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, verdi));
}

export function klemX(x: number): number {
  return klem(x, 0.04, 0.96);
}

function veiTing(id: number, x: number, z: number, type: StiType, ekstra: Partial<StiObjekt> = {}): StiObjekt {
  return { id, x, dist: distFraZ(z, STI_SEKUNDER), type, ...ekstra };
}

function veiDekor(id: number, side: DekorSide, z: number, type: DekorType): StiDekor {
  return { id, side, dist: distFraZ(z, STI_SEKUNDER), type };
}

export function fortsettEtterZombie(tilstand: StiTilstand): StiTilstand {
  return {
    ...tilstand,
    ferdig: false,
    zombieTreff: 0,
    objekter: tilstand.objekter.filter((o) => o.type !== "zombie"),
    zombieSpawnet: Math.max(tilstand.zombieSpawnet, MAX_ZOMBIE_PER_STI),
  };
}

export function startSti(): StiTilstand {
  return {
    x: 0.5,
    tid: STI_SEKUNDER,
    nesteId: 18,
    spawnTeller: 0.35,
    objekter: [
      veiTing(1, 0.22, 0.16, "krystall"),
      veiTing(2, 0.81, 0.34, "zombie"),
      veiTing(3, 0.47, 0.1, "diamant"),
      veiTing(14, 0.33, 0.24, "baesj"),
      veiTing(15, 0.64, 0.2, "krystall"),
      veiTing(16, 0.18, 0.3, "syklist", { retning: "mot", baneX: 0.18, vingleFase: 0.4 }),
      veiTing(17, 0.78, 0.14, "bil", { retning: "mot", baneX: 0.78 }),
    ],
    dekor: [
      veiDekor(4, -1, 0.06, "hus"),
      veiDekor(5, 1, 0.12, "tre"),
      veiDekor(6, -1, 0.24, "barn"),
      veiDekor(7, 1, 0.2, "hus"),
      veiDekor(8, -1, 0.38, "hund"),
      veiDekor(9, 1, 0.34, "barn"),
      veiDekor(10, -1, 0.52, "tre"),
      veiDekor(11, 1, 0.58, "hund"),
      veiDekor(12, -1, 0.68, "hus"),
      veiDekor(13, 1, 0.76, "tre"),
    ],
    krystaller: 0,
    diamanter: 0,
    zombieTreff: 0,
    baesj: 0,
    ferdig: false,
    zombieSpawnet: 1,
  };
}

export function settX(tilstand: StiTilstand, x: number): StiTilstand {
  return { ...tilstand, x: klemX(x) };
}

export function xFraSkjerm(rel: number, tid = STI_SEKUNDER): number {
  const vei = veiPunkt(0.92, tid);
  const venstre = (vei.cx - vei.halv) / 100;
  const hoyre = (vei.cx + vei.halv) / 100;
  if (hoyre <= venstre) return 0.5;
  return klemX((rel - venstre) / (hoyre - venstre));
}

export function flyttX(tilstand: StiTilstand, steg: number): StiTilstand {
  return settX(tilstand, tilstand.x + steg);
}

export function stiSkala(y: number, tid = STI_SEKUNDER): number {
  return prosjektPunkt(0.5, y, tid).skala;
}

export function stiVenstre(x: number, y: number, tid = STI_SEKUNDER): string {
  return `${prosjektPunkt(x, y, tid).left}%`;
}

export function stiFremgang(tid: number): number {
  return klem(1 - tid / STI_SEKUNDER);
}

function tilfeldigVeiX(tilfeldig: () => number): number {
  return 0.08 + tilfeldig() * 0.84;
}

function tilfeldigZombieX(tilfeldig: () => number): number {
  return tilfeldig() < 0.5 ? 0.12 + tilfeldig() * 0.1 : 0.78 + tilfeldig() * 0.1;
}

function tilfeldigType(tilfeldig: () => number, kanZombie: boolean): StiType {
  const r = tilfeldig();
  if (kanZombie && r < 0.04) return "zombie";
  if (r < 0.12) return "baesj";
  if (r < 0.24) return "syklist";
  if (r < 0.36) return "bil";
  if (r < 0.5) return "diamant";
  return "krystall";
}

function tilfeldigDekor(tilfeldig: () => number): DekorType {
  const r = tilfeldig();
  if (r < 0.32) return "hus";
  if (r < 0.58) return "tre";
  if (r < 0.8) return "hund";
  return "barn";
}

function trafikkFart(type: StiType): number {
  if (type === "bil") return 1.5;
  if (type === "syklist") return 0.75;
  return 0;
}

function flyttTrafikk(raw: StiObjekt, dt: number, tid: number): StiObjekt {
  const fart = trafikkFart(raw.type);
  if (!fart) return raw;
  const tegn = raw.retning === "fra" ? 1 : -1;
  const baneX = raw.baneX ?? raw.x;
  return {
    ...raw,
    dist: raw.dist + tegn * dt * fart,
    baneX,
    x: raw.type === "syklist" ? vingleX(baneX, tid, raw.vingleFase ?? 0) : raw.x,
  };
}

function nyTrafikk(id: number, type: TrafikkType, tid: number, tilfeldig: () => number): StiObjekt {
  const retning: TrafikkRetning = tilfeldig() < 0.42 ? "fra" : "mot";
  const x = tilfeldigVeiX(tilfeldig);
  return {
    id,
    x,
    dist: distFraZ(retning === "fra" ? 0.28 : veiEndeZ() + 0.02, tid),
    type,
    retning,
    baneX: x,
    vingleFase: tilfeldig() * Math.PI * 2,
  };
}

function treffer(alfX: number, objekt: StiObjekt): boolean {
  const avstand = objekt.type === "zombie" ? ZOMBIE_AVSTAND : PLUKK_AVSTAND;
  return Math.abs(alfX - objekt.x) <= avstand;
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
  const hendelser: StiHendelse[] = [];
  let krystaller = tilstand.krystaller;
  let diamanter = tilstand.diamanter;
  let zombieTreff = tilstand.zombieTreff;
  let baesj = tilstand.baesj;
  let zombieSpawnet = tilstand.zombieSpawnet;
  const beholdt: StiObjekt[] = [];

  for (const raw of tilstand.objekter) {
    const objekt = flyttTrafikk(raw, dt, tid);
    const z = zFraDist(objekt.dist, tid);
    if (z < 0.86) {
      beholdt.push(objekt);
      continue;
    }
    if (z > 1.12) {
      continue;
    }
    if (!treffer(tilstand.x, objekt)) {
      beholdt.push(objekt);
      continue;
    }
    if (objekt.type === "zombie") {
      zombieTreff += 1;
      hendelser.push({ type: "treff", objekt: "zombie" });
    } else if (objekt.type === "syklist" || objekt.type === "bil") {
      hendelser.push({
        type: "trafikk",
        objekt: objekt.type,
        tekst: trafikkHint(objekt.type, tilfeldig),
      });
    } else if (objekt.type === "baesj") {
      baesj += 1;
      hendelser.push({ type: "baesj", objekt: "baesj", tekst: baesjHint(tilfeldig) });
    } else if (objekt.type === "krystall") {
      krystaller += 1;
      hendelser.push({ type: "plukk", objekt: "krystall" });
    } else {
      diamanter += 1;
      hendelser.push({ type: "plukk", objekt: "diamant" });
    }
  }

  const dekor = tilstand.dekor.filter((o) => zFraDist(o.dist, tid) < 1.15);

  if (spawnTeller >= 0.55) {
    spawnTeller = 0;
    const type = tilfeldigType(tilfeldig, zombieSpawnet < MAX_ZOMBIE_PER_STI);
    if (type === "zombie") zombieSpawnet += 1;
    beholdt.push(
      type === "syklist" || type === "bil"
        ? nyTrafikk(nesteId, type, tid, tilfeldig)
        : {
            id: nesteId,
            x: type === "zombie" ? tilfeldigZombieX(tilfeldig) : tilfeldigVeiX(tilfeldig),
            dist: distFraZ(veiEndeZ() + 0.02, tid),
            type,
          },
    );
    nesteId += 1;
    dekor.push({
      id: nesteId,
      side: -1,
      dist: distFraZ(veiEndeZ() + 0.02, tid),
      type: tilfeldigDekor(tilfeldig),
    });
    nesteId += 1;
    dekor.push({
      id: nesteId,
      side: 1,
      dist: distFraZ(veiEndeZ() + 0.03, tid),
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
      zombieSpawnet,
      ferdig: tid <= 0 || zombieTreff > 0,
    },
    hendelser,
  };
}
