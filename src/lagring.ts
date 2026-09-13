import type { Innstillinger, Melk, Sekk } from "./typer";

const NOKKEL = "storealfabet-v1";

export interface Lagret {
  innstillinger: Innstillinger;
  besteVerdi: number;
  finesteMelk: Melk;
}

const STANDARD: Lagret = {
  innstillinger: { nivaa: "forste", lydPa: true, sekk: "lilla", stemme: "" },
  besteVerdi: 0,
  finesteMelk: "vanlig",
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
    const stemme = typeof data.innstillinger?.stemme === "string" ? data.innstillinger.stemme : "";
    const besteVerdi = typeof data.besteVerdi === "number" && data.besteVerdi >= 0 ? data.besteVerdi : 0;
    const finesteMelk = erMelk(data.finesteMelk) ? data.finesteMelk : "vanlig";
    return { innstillinger: { nivaa, lydPa, sekk, stemme }, besteVerdi, finesteMelk };
  } catch {
    return { ...STANDARD, innstillinger: { ...STANDARD.innstillinger } };
  }
}

export function skrivLagring(data: Lagret): void {
  localStorage.setItem(NOKKEL, JSON.stringify(data));
}

export function oppdaterRekord(forrige: Lagret, verdi: number, melk: Melk): Lagret {
  const rang: Record<Melk, number> = { vanlig: 0, jordbaer: 1, sjokolade: 2, stjerne: 3 };
  const finesteMelk = rang[melk] > rang[forrige.finesteMelk] ? melk : forrige.finesteMelk;
  return {
    ...forrige,
    besteVerdi: Math.max(forrige.besteVerdi, verdi),
    finesteMelk,
  };
}
