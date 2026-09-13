export interface StiRapport {
  sykler: number;
  biler: number;
  baesj: number;
}

export interface LekseIntro {
  overskrift: string;
  avsnitt: string[];
  tale: string;
  visTrafikk: boolean;
  visBaesj: boolean;
}

export const LEKSE_VARIANT = [
  "Oi, Alf har glemt å gjøre alle leksene! La oss hjelpe han før vi går videre.",
  "Uff da! Alf glemte leksene i går. Kan du hjelpe ham?",
  "Stopp litt. Alf har ikke gjort leksene. Vi hjelper ham først.",
];

export const TRAFIKK_TIPS = [
  "Husk å se deg for når du krysser veien.",
  "Gå på fortauet når du kan.",
  "Sykler og biler trenger plass. Hold deg i veikanten.",
];

export const VEI_TIPS = [
  "Ikke ta på hundebæsj. Den er ekkel og kan gjøre deg syk.",
  "Ikke spis eller drikk ting du finner på veien.",
  "La bæsj og rusk ligge. Alf skal bare gå videre.",
];

function velg<T>(liste: readonly T[], tilfeldig: () => number): T {
  return liste[Math.floor(tilfeldig() * liste.length)] ?? liste[0]!;
}

function tallOrd(antall: number, en: string, flere: string): string {
  return `${antall} ${antall === 1 ? en : flere}`;
}

export function krasjTekst(sykler: number, biler: number): string {
  const deler: string[] = [];
  if (sykler > 0) deler.push(tallOrd(sykler, "sykkel", "sykler"));
  if (biler > 0) deler.push(tallOrd(biler, "bil", "biler"));
  if (deler.length === 0) return "";
  return `Du krasjet med ${deler.join(" og ")}.`;
}

export function lekseIntroTrykkGjelder(nedEtterVisning: boolean): boolean {
  return nedEtterVisning;
}

export function lekseIntro(rapport: StiRapport, tilfeldig = Math.random): LekseIntro {
  const avsnitt = [velg(LEKSE_VARIANT, tilfeldig)];
  const visTrafikk = rapport.sykler > 0 || rapport.biler > 0;
  const visBaesj = rapport.baesj > 0;
  if (visTrafikk) {
    avsnitt.push(`Men først, pass deg i trafikken. ${krasjTekst(rapport.sykler, rapport.biler)}`);
    avsnitt.push(velg(TRAFIKK_TIPS, tilfeldig));
  }
  if (visBaesj) {
    avsnitt.push(velg(VEI_TIPS, tilfeldig));
  }
  return {
    overskrift: "Oi, leksene!",
    avsnitt,
    tale: avsnitt.join(" "),
    visTrafikk,
    visBaesj,
  };
}
