import { giBelonning, melkForVerdi, miltTap, tomLomme, verdi } from "../okonomi";
import { trekkOppgave } from "../oppgaver/bank";
import type { Innstillinger, Lomme, Melk, Nivaa, Oppgave } from "../typer";

export const ANTALL_STOPP = 6;
export const DUELL_RUNDE = 3;
export const DUELL_TRENGER = 2;

export interface StartSteg {
  tekst: string;
  ms: number;
}

export function startNedtelling(): StartSteg[] {
  return [
    { tekst: "3", ms: 700 },
    { tekst: "2", ms: 700 },
    { tekst: "1", ms: 700 },
    { tekst: "Kom igjen!", ms: 550 },
  ];
}

export interface Tur {
  nivaa: Nivaa;
  lydPa: boolean;
  stopp: number;
  lomme: Lomme;
  zombieStopp: number[];
  brukt: string[];
  duellRiktige: number;
  duellRunde: number;
  ferdig: boolean;
  skitten: boolean;
}

export interface TurSlutt {
  lomme: Lomme;
  verdi: number;
  melk: Melk;
  skitten: boolean;
}

export function velgZombieStopp(tilfeldig = Math.random): number[] {
  const kandidater = [2, 3, 4, 5, 6];
  const kopi = [...kandidater];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(tilfeldig() * (i + 1));
    const a = kopi[i];
    const b = kopi[j];
    if (a === undefined || b === undefined) continue;
    kopi[i] = b;
    kopi[j] = a;
  }
  return kopi.slice(0, 2).sort((a, b) => a - b);
}

export function startTur(innstillinger: Innstillinger, tilfeldig = Math.random): Tur {
  return {
    nivaa: innstillinger.nivaa,
    lydPa: innstillinger.lydPa,
    stopp: 1,
    lomme: tomLomme(),
    zombieStopp: velgZombieStopp(tilfeldig),
    brukt: [],
    duellRiktige: 0,
    duellRunde: 0,
    ferdig: false,
    skitten: false,
  };
}

export function hentOppgave(tur: Tur, tilfeldig = Math.random): Oppgave {
  const oppgave = trekkOppgave(tur.nivaa, new Set(tur.brukt), tilfeldig);
  tur.brukt.push(oppgave.id);
  return oppgave;
}

export function harZombie(tur: Tur): boolean {
  return tur.zombieStopp.includes(tur.stopp);
}

export function registrerOppgaveSvar(tur: Tur, riktig: boolean, belonning: "krystall" | "diamant"): Tur {
  const lomme = riktig ? giBelonning(tur.lomme, belonning) : miltTap(tur.lomme, 1);
  return { ...tur, lomme };
}

export function startDuell(tur: Tur): Tur {
  return { ...tur, duellRiktige: 0, duellRunde: 1 };
}

export function registrerDuellSvar(tur: Tur, riktig: boolean): Tur {
  const duellRiktige = tur.duellRiktige + (riktig ? 1 : 0);
  const duellRunde = tur.duellRunde + 1;
  return { ...tur, duellRiktige, duellRunde };
}

export function duellFerdig(tur: Tur): boolean {
  return tur.duellRunde > DUELL_RUNDE;
}

export function duellVunnet(tur: Tur): boolean {
  return tur.duellRiktige >= DUELL_TRENGER;
}

export function avsluttDuell(tur: Tur): Tur {
  const lomme = duellVunnet(tur) ? giBelonning(tur.lomme, "diamant") : miltTap(tur.lomme, 2);
  return { ...tur, lomme, duellRunde: 0, duellRiktige: 0 };
}

export function nesteStopp(tur: Tur): Tur {
  if (tur.stopp >= ANTALL_STOPP) {
    return { ...tur, ferdig: true };
  }
  return { ...tur, stopp: tur.stopp + 1 };
}

export function avsluttTur(tur: Tur): TurSlutt {
  const v = verdi(tur.lomme);
  return {
    lomme: tur.lomme,
    verdi: v,
    melk: melkForVerdi(v),
    skitten: tur.skitten,
  };
}
