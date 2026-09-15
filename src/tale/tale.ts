import { aktiverAlfLyd, alfErKlar, lastAlfStemme, spillAlfDeler, stoppAlfStemme, hentLydKontekst } from "./alf-stemme";

let taleKlar = false;
let valgtStemmeNavn = "";

export const ALF_STEMME = "alf";
export const AUTO_STEMME = "auto";

export type TaleModus = "system" | "alf";
export type StiLyd = "krystall" | "diamant" | "bil" | "sykkel" | "baesj" | "zombie";

export function skalBrukeAlfStemme(navn: string): boolean {
  return navn === ALF_STEMME;
}

export function migrerStemme(navn: string): string {
  if (navn === AUTO_STEMME) return AUTO_STEMME;
  if (navn === ALF_STEMME || navn === "") return ALF_STEMME;
  const n = navn.toLowerCase();
  if (/microsoft|hedda|compact/.test(n) && /nora|hedda|compact/.test(n)) return ALF_STEMME;
  if (/nora/i.test(n)) return AUTO_STEMME;
  return navn;
}

export function harTale(): boolean {
  return typeof globalThis.speechSynthesis !== "undefined";
}

export function kanSnakke(): boolean {
  return brukerAlfNa() || harTale();
}

export function settStemme(navn: string): void {
  valgtStemmeNavn = navn;
}

export function erNorskLang(lang: string): boolean {
  const l = lang.toLowerCase();
  return l.startsWith("nb") || l.startsWith("no") || l.includes("nor");
}

export function stemmeRang(navn: string, lang = "", voiceURI = ""): number {
  const n = `${navn} ${voiceURI}`.toLowerCase();
  const l = lang.toLowerCase();
  let rang = 0;
  if (l.startsWith("nb")) rang += 12;
  if (l.startsWith("nn")) rang -= 18;
  if (/google|apple|siri|samsung|ttsbundle/.test(n)) rang += 55;
  if (/neural|natural|online|enhanced|premium/.test(n)) rang += 30;
  if (/henrik|oskar|erik|magnus|anders|finn|pernille|male|mann/.test(n)) rang += 20;
  if (/microsoft/.test(n) && !/neural|natural|online/.test(n)) rang -= 20;
  if (/compact|eloquence|espeak|robot|desktop|hedda/.test(n)) rang -= 35;
  if (/nora|female|kvinne|dame/.test(n) && !/enhanced|premium|neural|natural|siri/.test(n)) rang -= 5;
  return rang;
}

type StemmeTreff = { name: string; lang: string; voiceURI?: string };

export function velgBesteStemme<T extends StemmeTreff>(stemmer: T[], onsket = ""): T | undefined {
  if (onsket && onsket !== AUTO_STEMME && onsket !== ALF_STEMME) {
    const treff = stemmer.find((s) => s.name === onsket || s.voiceURI === onsket);
    if (treff) return treff;
  }
  const norsk = stemmer.filter((s) => erNorskLang(s.lang));
  const liste = norsk.length > 0 ? norsk : stemmer;
  return [...liste].sort(
    (a, b) =>
      stemmeRang(b.name, b.lang, b.voiceURI ?? "") - stemmeRang(a.name, a.lang, a.voiceURI ?? "") ||
      a.name.localeCompare(b.name),
  )[0];
}

function stemmeErGodNok(stemme: StemmeTreff): boolean {
  const tekst = `${stemme.name} ${stemme.voiceURI ?? ""}`.toLowerCase();
  if (/siri|apple|google|samsung|neural|natural|online|enhanced|premium|ttsbundle/.test(tekst)) {
    return true;
  }
  if (/microsoft/.test(tekst) && /compact|eloquence|hedda/.test(tekst) && !/neural|natural|online/.test(tekst)) {
    return false;
  }
  if (/compact|eloquence|espeak|robot/.test(tekst) && !/siri|apple/.test(tekst)) return false;
  return erNorskLang(stemme.lang) || stemmeRang(stemme.name, stemme.lang, stemme.voiceURI ?? "") >= 20;
}

export function velgTaleModus(onsket: string, stemmer: StemmeTreff[]): TaleModus {
  if (onsket === ALF_STEMME) return "alf";
  if (onsket && onsket !== AUTO_STEMME) return "system";
  if (stemmer.length === 0) return "system";
  const beste = velgBesteStemme(stemmer);
  return beste && stemmeErGodNok(beste) ? "system" : "alf";
}

export function skalListesSomStemmevalg(navn: string, lang = "", voiceURI = ""): boolean {
  if (/nora|hedda/i.test(`${navn} ${voiceURI}`)) return false;
  return stemmeErGodNok({ name: navn, lang, voiceURI });
}

export function skalBrukeNettleserTale(onsket: string, stemmer: StemmeTreff[]): boolean {
  return velgTaleModus(onsket, stemmer) === "system";
}

export function stiLydForHendelse(type: string, objekt?: string): StiLyd {
  if (type === "plukk") return objekt === "diamant" ? "diamant" : "krystall";
  if (type === "trafikk") return objekt === "syklist" ? "sykkel" : "bil";
  if (type === "baesj") return "baesj";
  return "zombie";
}

function tilgjengeligeStemmer(): StemmeTreff[] {
  return harTale() ? speechSynthesis.getVoices() : [];
}

function brukerAlfNa(): boolean {
  return !skalBrukeNettleserTale(valgtStemmeNavn, tilgjengeligeStemmer());
}

export function norskeStemmer(): SpeechSynthesisVoice[] {
  if (!harTale()) return [];
  const alle = speechSynthesis.getVoices();
  const norsk = alle.filter(
    (s) =>
      erNorskLang(s.lang) ||
      /norsk|norwegian|bokmål|bokmal|henrik|nora|siri/i.test(`${s.name} ${s.voiceURI}`),
  );
  return (norsk.length > 0 ? norsk : alle).sort(
    (a, b) =>
      stemmeRang(b.name, b.lang, b.voiceURI) - stemmeRang(a.name, a.lang, a.voiceURI) ||
      a.name.localeCompare(b.name, "nb"),
  );
}

const UTTALE: [RegExp, string][] = [
  [/\bzombien\b/gi, "såmbien"],
  [/\bzombie\b/gi, "såmbi"],
  [/\bkrystaller\b/gi, "krysstaller"],
  [/\bkrystall\b/gi, "krysstall"],
  [/\bdiamanter\b/gi, "di-amanter"],
  [/\bdiamant\b/gi, "di-amant"],
  [/\bskolemelk\b/gi, "skole-melk"],
  [/\bskolen\b/gi, "skoolen"],
  [/\bskole\b/gi, "skoole"],
  [/\bforsovet\b/gi, "for-såvet"],
  [/\bhundebæsj\b/gi, "hunde-bæsj"],
];

const KLIPP_RE = /⟦([^⟧]+)⟧/g;
/** Korte siterte ord («de», «se») limer seg i samme ytring. */
const KORT_SITAT = 2;

function bokstavLyd(bok: string): string {
  return bok.toLowerCase();
}

function rydd(tekst: string): string {
  return tekst
    .replace(/\s+/g, " ")
    .replace(/ *\. */g, ". ")
    .replace(/\s+([?!])/g, "$1")
    .trim();
}

function erSkille(tekst: string): boolean {
  return /^[?!.–,;:\-\s]+$/.test(tekst);
}

function klipp(lyd: string): string {
  return `⟦${lyd}⟧`;
}

function pause(sporsmal?: string): "." | "?" {
  return sporsmal ? "?" : ".";
}

function pauseForanLyd(pre: string, bok: string, sporsmal?: string): string {
  return `${pre}${pause(sporsmal)} ${klipp(bokstavLyd(bok))}`;
}

function siterOrdTale(ord: string, etterOrdet: boolean): string {
  const kort = ord.length <= KORT_SITAT;
  if (etterOrdet) return kort ? `ordet. ${klipp(ord)}` : `ordet. ${ord}.`;
  return kort ? ` ${klipp(ord)} ` : ` ${ord}. `;
}

function kollapsUtenforKlipp(tekst: string): string {
  return tekst.replace(/⟦[^⟧]*⟧|([a-zæøå])\1{2,}/gi, (treff, bok: string | undefined) => bok ?? treff);
}

/**
 * Alf (Piper) tåler ikke SSML. Det som virker:
 * - Bokstavlyd = ett lite bokstavklipp. Aldri aaa/eee/rrr (blir å, e-e-e, er-er-er).
 * - Pause før isolert bokstav: ? i spørsmål, ellers punktum.
 * - ordet «lese»/«sol»: punktum i samme ytring. ordet «de»: eget klipp.
 * - Trekk-sammen-lyder som egne klipp, uten å lese tankestreken.
 * - skole→skoole bare i løpende tale, ikke som isolert «sool».
 */
export function forberedTaleDeler(tekst: string): string[] {
  const merket = kollapsUtenforKlipp(
    tekst
      .replace(/«([A-Za-zÆØÅæøå])»(\s*\?)?/g, (_all, bok: string, spm: string | undefined) => pauseForanLyd("", bok, spm))
      .replace(
        /(^|[^A-Za-zÆØÅæøå])([A-ZÆØÅ])(?![A-Za-zÆØÅæøå])(\s*\?)?/g,
        (_all, pre: string, bok: string, spm: string | undefined) => pauseForanLyd(pre, bok, spm),
      )
      .replace(
        /\b(til|på|bokstaven)\s+([a-zæøå])\b(\s*\?)?/gi,
        (_all, pre: string, bok: string, spm: string | undefined) => pauseForanLyd(pre, bok, spm),
      )
      .replace(
        /\b(lyden|sier|Hør)\s+([a-zæøå])\2{2,}(\s*\?)?/gi,
        (_all, pre: string, bok: string, spm: string | undefined) => pauseForanLyd(pre, bok, spm),
      )
      .replace(/⟦[^⟧]*⟧|\b([a-zæøå])\1{2,}\b/gi, (treff, bok: string | undefined) =>
        bok ? klipp(bokstavLyd(bok)) : treff,
      ),
  )
    .replace(/\bordet\s*«([^»]+)»/gi, (_all, ord: string) => siterOrdTale(ord, true))
    .replace(/«([^»]+)»/g, (_all, ord: string) => siterOrdTale(ord, false));
  const medOrd = UTTALE.reduce((ut, [fra, til]) => ut.replace(fra, til), merket);
  const deler: string[] = [];
  let siste = 0;
  KLIPP_RE.lastIndex = 0;
  let treff: RegExpExecArray | null;
  while ((treff = KLIPP_RE.exec(medOrd))) {
    const foran = rydd(medOrd.slice(siste, treff.index));
    if (foran && !erSkille(foran)) deler.push(foran);
    deler.push(treff[1] ?? "");
    siste = treff.index + treff[0].length;
  }
  const resten = rydd(medOrd.slice(siste));
  if (resten && !erSkille(resten)) deler.push(resten);
  return deler.filter(Boolean);
}

export function forberedUttale(tekst: string): string {
  return forberedTaleDeler(tekst).join(" ");
}

export function lesOppgave(oppgave: { prompt: string; tale: string }): string {
  return oppgave.prompt || oppgave.tale;
}

export function stemmeEtikett(navn: string): string {
  if (/google|apple|siri|samsung/i.test(navn)) return `${navn} (ofte best)`;
  if (/neural|natural|online/i.test(navn)) return `${navn} (naturlig)`;
  if (/microsoft|hedda|compact/i.test(navn)) return `${navn} (kan trykke feil)`;
  return navn;
}

function finnStemme(): SpeechSynthesisVoice | undefined {
  const onsket = valgtStemmeNavn === AUTO_STEMME || valgtStemmeNavn === ALF_STEMME ? "" : valgtStemmeNavn;
  return velgBesteStemme(harTale() ? speechSynthesis.getVoices() : [], onsket);
}

function taleKontekst(): AudioContext | null {
  return hentLydKontekst();
}

export function aktiverLyd(): void {
  aktiverAlfLyd();
  if (brukerAlfNa()) {
    void lastAlfStemme();
    taleKlar = true;
    return;
  }
  if (taleKlar) return;
  if (harTale()) {
    speechSynthesis.getVoices();
    speechSynthesis.cancel();
    const varm = new SpeechSynthesisUtterance(" ");
    varm.lang = "nb-NO";
    varm.volume = 0.01;
    varm.rate = 2;
    const stemme = finnStemme();
    if (stemme) varm.voice = stemme;
    speechSynthesis.speak(varm);
  }
  taleKlar = true;
}

function siMedNettleser(tekst: string): void {
  if (!harTale()) return;
  speechSynthesis.cancel();
  const deler = forberedTaleDeler(tekst);
  const siDel = (i: number): void => {
    if (i >= deler.length) return;
    const ytring = new SpeechSynthesisUtterance(deler[i]);
    ytring.lang = "nb-NO";
    ytring.pitch = 1;
    const stemme = finnStemme();
    if (stemme) {
      ytring.voice = stemme;
      ytring.lang = stemme.lang.startsWith("nb") || stemme.lang.startsWith("no") ? stemme.lang : "nb-NO";
      ytring.rate = /microsoft/i.test(stemme.name) && !/neural|natural|online/i.test(stemme.name) ? 0.82 : 0.9;
    } else {
      ytring.rate = 0.9;
    }
    ytring.onend = () => {
      if (i + 1 < deler.length) window.setTimeout(() => siDel(i + 1), 220);
    };
    speechSynthesis.speak(ytring);
  };
  siDel(0);
}

export function si(tekst: string, lydPa: boolean): void {
  if (!lydPa || !tekst.trim()) return;
  if (!taleKlar) aktiverLyd();
  stoppTale();
  if (brukerAlfNa()) {
    void spillAlfUtenNora(forberedTaleDeler(tekst));
    return;
  }
  siMedNettleser(tekst);
}

async function spillAlfUtenNora(deler: string[]): Promise<void> {
  const ok = alfErKlar() || (await lastAlfStemme());
  if (!ok) return;
  try {
    await spillAlfDeler(deler);
  } catch {
    /* Alf skal ikke byttes ut med Nora midt i setningen */
  }
}

export function stoppTale(): void {
  stoppAlfStemme();
  if (harTale()) speechSynthesis.cancel();
}

function spillTone(
  ctx: AudioContext,
  type: OscillatorType,
  frekvens: number,
  start: number,
  varighet: number,
  volum: number,
  sluttFrekvens?: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frekvens, start);
  if (sluttFrekvens != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, sluttFrekvens), start + varighet);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volum, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + varighet);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + varighet + 0.02);
}

export function spillKling(lydPa: boolean, frekvens = 620): void {
  if (!lydPa) return;
  const ctx = taleKontekst();
  if (!ctx) return;
  void ctx.resume();
  spillTone(ctx, "sine", frekvens, ctx.currentTime, 0.18, 0.08);
}

export function spillStiLyd(lydPa: boolean, type: StiLyd): void {
  if (!lydPa) return;
  const ctx = taleKontekst();
  if (!ctx) return;
  void ctx.resume();
  const t = ctx.currentTime;
  if (type === "krystall") {
    spillTone(ctx, "sine", 980, t, 0.16, 0.09);
    return;
  }
  if (type === "diamant") {
    spillTone(ctx, "sine", 880, t, 0.1, 0.08);
    spillTone(ctx, "sine", 1174, t + 0.07, 0.1, 0.08);
    spillTone(ctx, "sine", 1568, t + 0.14, 0.16, 0.09);
    return;
  }
  if (type === "bil") {
    spillTone(ctx, "square", 370, t, 0.22, 0.05);
    spillTone(ctx, "square", 466, t, 0.22, 0.04);
    return;
  }
  if (type === "sykkel") {
    spillTone(ctx, "triangle", 1760, t, 0.12, 0.07);
    spillTone(ctx, "triangle", 1480, t + 0.16, 0.14, 0.07);
    return;
  }
  if (type === "baesj") {
    spillTone(ctx, "sine", 120, t, 0.22, 0.1, 55);
    spillTone(ctx, "triangle", 80, t + 0.04, 0.18, 0.06, 40);
    return;
  }
  spillTone(ctx, "square", 220, t, 0.08, 0.05);
  spillTone(ctx, "sine", 140, t + 0.06, 0.16, 0.08, 90);
}
