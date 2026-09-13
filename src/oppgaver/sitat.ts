export function siterOrd(ord: string): string {
  return `«${ord}»`;
}

export function htmlMedSitertOrd(tekst: string): string {
  return tekst.replace(/«([^»]+)»/g, '<span class="oppgave-ord">«$1»</span>');
}
