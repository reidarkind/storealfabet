export type Nivaa = "forste" | "andre" | "utfordrende" | "blandet";

export type Melk = "vanlig" | "jordbaer" | "sjokolade" | "stjerne";

export type OppgaveType =
  | "bokstavlyd"
  | "forstelyd"
  | "storLiten"
  | "tegning"
  | "trekkSammen"
  | "rim"
  | "stavelser"
  | "byggOrd"
  | "byttLyd"
  | "manglende";

export interface Lomme {
  krystaller: number;
  diamanter: number;
}

export interface Oppgave {
  id: string;
  type: OppgaveType;
  nivaa: Exclude<Nivaa, "blandet">;
  prompt: string;
  tale: string;
  valg: string[];
  fasit: string;
  hint: string;
  belonning: "krystall" | "diamant";
  bilde?: string;
  omriss?: string;
}

export interface Innstillinger {
  nivaa: Nivaa;
  lydPa: boolean;
}

export const MELK_NAVN: Record<Melk, string> = {
  vanlig: "Vanlig skolemelk",
  jordbaer: "Jordbærmelke",
  sjokolade: "Sjokolademelk",
  stjerne: "Stjernemelk",
};

export const NIVAA_NAVN: Record<Nivaa, string> = {
  forste: "1. klasse",
  andre: "2. klasse",
  utfordrende: "Utfordrende",
  blandet: "Blandet",
};
