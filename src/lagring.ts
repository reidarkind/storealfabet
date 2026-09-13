import { migrerStemme } from "./tale/tale";
import type { Innstillinger, Melk, Sekk } from "./typer";

const NOKKEL = "storealfabet-v1";

export interface RekordRad {
  navn: string;
  verdi: number;
  melk: Melk;
}

export interface Lagret {
  innstillinger: Innstillinger;
  besteVerdi: number;
  finesteMelk: Melk;
  tavle: RekordRad[];
}

export const REKORD_PLASSER = 10;
export const ANONYM_NAVN = "Anonym";

const STANDARD: Lagret = {
  innstillinger: { nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "alf" },
  besteVerdi: 0,
  finesteMelk: "vanlig",
  tavle: [],
};

function erNivaa(verdi: unknown): verdi is Innstillinger["nivaa"] {
  return verdi === "forste" || verdi === "andre" || verdi === "utfordrende" || verdi === "blandet";
}

function erMelk(verdi: unknown): verdi is Melk {
  return verdi === "vanlig" || verdi === "jordbaer" || verdi === "sjokolade" || verdi === "stjerne";
}

function erSekk(verdi: unknown): verdi is Sekk {
  return verdi === "lilla" || verdi === "stjerne" || verdi === "fotball" || verdi === "blomst";
}

export function lesLagring(): Lagret {
  try {
    const raa = localStorage.getItem(NOKKEL);
    if (!raa) return { ...STANDARD, innstillinger: { ...STANDARD.innstillinger } };
    const data = JSON.parse(raa) as Partial<Lagret>;
    const nivaa = erNivaa(data.innstillinger?.nivaa) ? data.innstillinger.nivaa : "forste";
    const lydPa = data.innstillinger?.lydPa !== false;
    const sekk = erSekk(data.innstillinger?.sekk) ? data.innstillinger.sekk : "lilla";
    const raaStemme = typeof data.innstillinger?.stemme === "string" ? data.innstillinger.stemme : "";
    const stemme = migrerStemme(raaStemme);
    const besteVerdi = typeof data.besteVerdi === "number" && data.besteVerdi >= 0 ? data.besteVerdi : 0;
    const finesteMelk = erMelk(data.finesteMelk) ? data.finesteMelk : "vanlig";
    const tavle = lesTavle(data.tavle);
    const lagret = { innstillinger: { nivaa, lydPa, sekk, stemme }, besteVerdi, finesteMelk, tavle };
    if (stemme !== raaStemme) skrivLagring(lagret);
    return lagret;
  } catch {
    return { ...STANDARD, innstillinger: { ...STANDARD.innstillinger } };
  }
}

export function skrivLagring(data: Lagret): void {
  localStorage.setItem(NOKKEL, JSON.stringify(data));
}

function lesTavle(raa: unknown): RekordRad[] {
  if (!Array.isArray(raa)) return [];
  return raa
    .filter((rad): rad is RekordRad => {
      if (!rad || typeof rad !== "object") return false;
      const r = rad as RekordRad;
      return typeof r.navn === "string" && typeof r.verdi === "number" && erMelk(r.melk);
    })
    .slice(0, REKORD_PLASSER);
}

export function rensNavn(navn: string): string {
  return navn.trim().slice(0, 12);
}

export function trengerAnonymBekreftelse(navn: string): boolean {
  return rensNavn(navn) === "";
}

export function navnTilTavle(navn: string): string {
  return rensNavn(navn) || ANONYM_NAVN;
}

export function erBlantDeTi(liste: RekordRad[], verdi: number): boolean {
  if (liste.length < REKORD_PLASSER) return true;
  const laveste = Math.min(...liste.map((rad) => rad.verdi));
  return verdi >= laveste;
}

export function settInnRekord(liste: RekordRad[], rad: RekordRad): RekordRad[] {
  return [...liste, rad]
    .sort((a, b) => b.verdi - a.verdi || a.navn.localeCompare(b.navn, "nb"))
    .slice(0, REKORD_PLASSER);
}

export function nullstillRekorder(forrige: Lagret): Lagret {
  return {
    ...forrige,
    besteVerdi: 0,
    finesteMelk: "vanlig",
    tavle: [],
  };
}

export function oppdaterRekord(forrige: Lagret, verdi: number, melk: Melk): Lagret {
  const rang: Record<Melk, number> = { vanlig: 0, jordbaer: 1, sjokolade: 2, stjerne: 3 };
  const finesteMelk = rang[melk] > rang[forrige.finesteMelk] ? melk : forrige.finesteMelk;
  return {
    ...forrige,
    besteVerdi: Math.max(forrige.besteVerdi, verdi),
    finesteMelk,
    tavle: forrige.tavle ?? [],
  };
}
