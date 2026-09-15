export type OppdateringUtfall = "sjekker" | "offline" | "nyeste" | "ny" | "feil";

const TEKST: Record<OppdateringUtfall, string> = {
  sjekker: "Sjekker…",
  offline: "Du spiller fra telefonen. Prøv igjen når du er på nett.",
  nyeste: "Du har nyeste.",
  ny: "Ny versjon. Åpne appen på nytt.",
  feil: "Klarte ikke å sjekke. Prøv igjen.",
};

export function oppdateringTekst(utfall: OppdateringUtfall): string {
  return TEKST[utfall];
}

export async function sjekkForOppdatering(kilder: {
  online: boolean;
  hentNyVersjon: () => Promise<boolean>;
}): Promise<Exclude<OppdateringUtfall, "sjekker">> {
  if (!kilder.online) return "offline";
  try {
    return (await kilder.hentNyVersjon()) ? "ny" : "nyeste";
  } catch {
    return "feil";
  }
}
