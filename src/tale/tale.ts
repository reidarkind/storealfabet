import { aktiverAlfLyd, alfErKlar, lastAlfStemme, spillAlfStemme, stoppAlfStemme } from "./alf-stemme";

let lydCtx: AudioContext | null = null;
let taleKlar = false;
let valgtStemmeNavn = "";

export const ALF_STEMME = "alf";

export function skalBrukeAlfStemme(navn: string): boolean {
  return navn === ALF_STEMME || navn === "";
}

export function migrerStemme(navn: string): string {
  if (skalBrukeAlfStemme(navn)) return ALF_STEMME;
  const n = navn.toLowerCase();
  if (/microsoft|hedda|compact/.test(n) && /nora|hedda|compact/.test(n)) return ALF_STEMME;
  return navn;
}

export function harTale(): boolean {
  return typeof globalThis.speechSynthesis !== "undefined";
}

export function kanSnakke(): boolean {
  return skalBrukeAlfStemme(valgtStemmeNavn) || harTale();
}

export function settStemme(navn: string): void {
  valgtStemmeNavn = navn;
}

export function erNorskLang(lang: string): boolean {
  const l = lang.toLowerCase();
  return l.startsWith("nb") || l.startsWith("no") || l.includes("nor");
}

export function stemmeRang(navn: string, lang = ""): number {
  const n = navn.toLowerCase();
  const l = lang.toLowerCase();
  let rang = 0;
  if (l.startsWith("nb")) rang += 12;
  if (l.startsWith("nn")) rang -= 18;
  if (/google|apple|siri|samsung/.test(n)) rang += 55;
  if (/neural|natural|online|enhanced|premium/.test(n)) rang += 30;
  if (/henrik|oskar|erik|magnus|anders|finn|pernille|male|mann/.test(n)) rang += 20;
  if (/microsoft/.test(n) && !/neural|natural|online/.test(n)) rang -= 20;
  if (/compact|eloquence|espeak|robot|desktop|hedda/.test(n)) rang -= 35;
  if (/nora|female|kvinne|dame/.test(n) && !/enhanced|premium|neural|natural/.test(n)) rang -= 5;
  return rang;
}

export function velgBesteStemme<T extends { name: string; lang: string }>(
  stemmer: T[],
  onsket = "",
): T | undefined {
  if (onsket) {
    const treff = stemmer.find(
      (s) => s.name === onsket || ("voiceURI" in s && (s as { voiceURI: string }).voiceURI === onsket),
    );
    if (treff) return treff;
  }
  const norsk = stemmer.filter((s) => erNorskLang(s.lang));
  const liste = norsk.length > 0 ? norsk : stemmer;
  return [...liste].sort(
    (a, b) => stemmeRang(b.name, b.lang) - stemmeRang(a.name, a.lang) || a.name.localeCompare(b.name),
  )[0];
}

export function norskeStemmer(): SpeechSynthesisVoice[] {
  if (!harTale()) return [];
  const alle = speechSynthesis.getVoices();
  const norsk = alle.filter(
    (s) => erNorskLang(s.lang) || /norsk|norwegian|bokmål|bokmal|henrik|nora/i.test(s.name),
  );
  return (norsk.length > 0 ? norsk : alle).sort(
    (a, b) => stemmeRang(b.name, b.lang) - stemmeRang(a.name, a.lang) || a.name.localeCompare(b.name, "nb"),
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
  return velgBesteStemme(harTale() ? speechSynthesis.getVoices() : [], valgtStemmeNavn);
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
  if (skalBrukeAlfStemme(valgtStemmeNavn)) void lastAlfStemme();
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
  if (skalBrukeAlfStemme(valgtStemmeNavn)) {
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

export function spillKling(lydPa: boolean, frekvens = 620): void {
  if (!lydPa) return;
  const ctx = taleKontekst();
  if (!ctx) return;
  void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frekvens;
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  osc.stop(ctx.currentTime + 0.2);
}
