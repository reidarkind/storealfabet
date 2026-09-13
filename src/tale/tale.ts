let lydCtx: AudioContext | null = null;
let taleKlar = false;
let valgtStemmeNavn = "";

export function harTale(): boolean {
  return typeof globalThis.speechSynthesis !== "undefined";
}

export function settStemme(navn: string): void {
  valgtStemmeNavn = navn;
}

export function erNorskLang(lang: string): boolean {
  const l = lang.toLowerCase();
  return l.startsWith("nb") || l.startsWith("no") || l.includes("nor");
}

export function stemmeRang(navn: string): number {
  const n = navn.toLowerCase();
  let rang = 0;
  if (/henrik|oskar|erik|magnus|anders|male|mann/.test(n)) rang += 40;
  if (/enhanced|premium|neural|natural|siri/.test(n)) rang += 15;
  if (/compact|eloquence|espeak|robot/.test(n)) rang -= 25;
  if (/nora|female|kvinne|dame/.test(n) && !/enhanced|premium/.test(n)) rang -= 5;
  return rang;
}

export function velgBesteStemme<T extends { name: string; lang: string }>(
  stemmer: T[],
  onsket = "",
): T | undefined {
  if (onsket) {
    const treff = stemmer.find((s) => s.name === onsket);
    if (treff) return treff;
  }
  const norsk = stemmer.filter((s) => erNorskLang(s.lang));
  const liste = norsk.length > 0 ? norsk : stemmer;
  return [...liste].sort((a, b) => stemmeRang(b.name) - stemmeRang(a.name) || a.name.localeCompare(b.name))[0];
}

export function norskeStemmer(): SpeechSynthesisVoice[] {
  if (!harTale()) return [];
  const alle = speechSynthesis.getVoices();
  const norsk = alle.filter((s) => erNorskLang(s.lang));
  return (norsk.length > 0 ? norsk : alle).sort(
    (a, b) => stemmeRang(b.name) - stemmeRang(a.name) || a.name.localeCompare(b.name, "nb"),
  );
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
  if (!harTale()) {
    taleKlar = true;
    return;
  }
  speechSynthesis.getVoices();
  speechSynthesis.cancel();
  const varm = new SpeechSynthesisUtterance(" ");
  varm.lang = "nb-NO";
  varm.volume = 0.01;
  varm.rate = 2;
  const stemme = finnStemme();
  if (stemme) varm.voice = stemme;
  speechSynthesis.speak(varm);
  taleKlar = true;
}

export function si(tekst: string, lydPa: boolean): void {
  if (!lydPa || !harTale() || !tekst.trim()) return;
  if (!taleKlar) aktiverLyd();
  speechSynthesis.cancel();
  const ytring = new SpeechSynthesisUtterance(tekst);
  ytring.lang = "nb-NO";
  ytring.rate = 0.92;
  ytring.pitch = 1;
  const stemme = finnStemme();
  if (stemme) {
    ytring.voice = stemme;
    ytring.lang = stemme.lang || "nb-NO";
  }
  speechSynthesis.speak(ytring);
}

export function stoppTale(): void {
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
