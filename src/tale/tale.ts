import { aktiverAlfLyd, alfErKlar, lastAlfStemme, spillAlfStemme, stoppAlfStemme } from "./alf-stemme";

let lydCtx: AudioContext | null = null;
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
  if (navn === ALF_STEMME || navn === "") return AUTO_STEMME;
  const n = navn.toLowerCase();
  if (/microsoft|hedda|compact/.test(n) && /nora|hedda|compact/.test(n)) return AUTO_STEMME;
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
  return velgTaleModus(valgtStemmeNavn, tilgjengeligeStemmer()) === "alf";
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

export function forberedUttale(tekst: string): string {
  return UTTALE.reduce((ut, [fra, til]) => ut.replace(fra, til), tekst);
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
  const Ctx = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!lydCtx) lydCtx = new Ctx();
  return lydCtx;
}

export function aktiverLyd(): void {
  const ctx = taleKontekst();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
  aktiverAlfLyd();
  if (brukerAlfNa()) void lastAlfStemme();
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
  const ytring = new SpeechSynthesisUtterance(forberedUttale(tekst));
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
  speechSynthesis.speak(ytring);
}

export function si(tekst: string, lydPa: boolean): void {
  if (!lydPa || !tekst.trim()) return;
  if (!taleKlar) aktiverLyd();
  stoppTale();
  if (brukerAlfNa()) {
    if (!alfErKlar()) {
      void lastAlfStemme();
      siMedNettleser(tekst);
      return;
    }
    void spillAlfStemme(forberedUttale(tekst)).catch(() => siMedNettleser(tekst));
    return;
  }
  siMedNettleser(tekst);
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
