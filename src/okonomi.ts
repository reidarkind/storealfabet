import type { Lomme, Melk } from "./typer";

export function verdi(lomme: Lomme): number {
  return lomme.krystaller + 2 * lomme.diamanter;
}

export function melkForVerdi(v: number): Melk {
  if (v >= 12) return "stjerne";
  if (v >= 8) return "sjokolade";
  if (v >= 4) return "jordbaer";
  return "vanlig";
}

export function tomLomme(): Lomme {
  return { krystaller: 0, diamanter: 0 };
}

export function giBelonning(lomme: Lomme, type: "krystall" | "diamant"): Lomme {
  if (type === "diamant") {
    return { ...lomme, diamanter: lomme.diamanter + 1 };
  }
  return { ...lomme, krystaller: lomme.krystaller + 1 };
}

export function miltTap(lomme: Lomme, mengde = 1): Lomme {
  let { krystaller, diamanter } = lomme;
  let igjen = mengde;
  const fraKrystall = Math.min(krystaller, igjen);
  krystaller -= fraKrystall;
  igjen -= fraKrystall;
  const fraDiamant = Math.min(diamanter, igjen);
  diamanter -= fraDiamant;
  return { krystaller, diamanter };
}

export function clampLomme(lomme: Lomme): Lomme {
  return {
    krystaller: Math.max(0, lomme.krystaller),
    diamanter: Math.max(0, lomme.diamanter),
  };
}
