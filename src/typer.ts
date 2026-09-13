export type Nivaa = "forste" | "andre" | "utfordrende" | "blandet";

export type Melk = "vanlig" | "jordbaer" | "sjokolade" | "stjerne";

export type Sekk = "lilla" | "stjerne" | "fotball" | "blomst";

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
  sekk: Sekk;
  stemme: string;
}

export const MELK_NAVN: Record<Melk, string> = {
  vanlig: "Vanlig skolemelk",
  jordbaer: "Jordbærmelke",
  sjokolade: "Sjokolademelk",
  stjerne: "Stjernemelk",
};

export const SEKK_NAVN: Record<Sekk, string> = {
  lilla: "Lilla sekk",
  stjerne: "Stjernesekk",
  fotball: "Fotballsekk",
  blomst: "Blomstersekk",
};

export const NIVAA_NAVN: Record<Nivaa, string> = {
  forste: "1. klasse",
  andre: "2. klasse",
  utfordrende: "Utfordrende",
  blandet: "Blandet",
};
