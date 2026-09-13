import type { Nivaa, Oppgave } from "../typer";
import { ALLE_OPPGAVER, LYDRETTE_ORD_LISTE } from "./data";

const LYDRETTE_ORD = new Set<string>(LYDRETTE_ORD_LISTE);

export function erLydrettOrd(ord: string): boolean {
  return LYDRETTE_ORD.has(ord.toLowerCase());
}

export function oppgaverForNivaa(nivaa: Nivaa): Oppgave[] {
  if (nivaa === "blandet") return [...ALLE_OPPGAVER];
  return ALLE_OPPGAVER.filter((oppgave) => oppgave.nivaa === nivaa);
}

export function trekkOppgave(nivaa: Nivaa, brukt: Set<string>, tilfeldig = Math.random): Oppgave {
  const pool = oppgaverForNivaa(nivaa);
  const ledige = pool.filter((oppgave) => !brukt.has(oppgave.id));
  const kilde = ledige.length > 0 ? ledige : pool;
  const indeks = Math.floor(tilfeldig() * kilde.length);
  const valgt = kilde[indeks];
  if (!valgt) {
    throw new Error("Oppgavebanken er tom");
  }
  if (!valgt.valg.includes(valgt.fasit) && valgt.type !== "tegning") {
    throw new Error(`Oppgave ${valgt.id} mangler fasit blant valgene`);
  }
  return valgt;
}

export function sjekkSvar(oppgave: Oppgave, svar: string): { riktig: boolean; hint: string } {
  const normalisert = svar.trim().toLowerCase();
  const fasit = oppgave.fasit.trim().toLowerCase();
  return {
    riktig: normalisert === fasit,
    hint: oppgave.hint,
  };
}

export function erGyldigOppgave(oppgave: Oppgave): boolean {
  if (oppgave.type === "tegning") {
    return Boolean(oppgave.omriss) && oppgave.omriss === oppgave.fasit;
  }
  return oppgave.valg.includes(oppgave.fasit) && oppgave.valg.length >= 2;
}
