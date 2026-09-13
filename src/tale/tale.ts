let lydCtx: AudioContext | null = null;
let taleKlar = false;

export function harTale(): boolean {
  return typeof globalThis.speechSynthesis !== "undefined";
}

function finnNorskStemme(): SpeechSynthesisVoice | undefined {
  const stemmer = speechSynthesis.getVoices();
  return (
    stemmer.find((s) => s.lang.toLowerCase().startsWith("nb")) ??
    stemmer.find((s) => s.lang.toLowerCase().startsWith("no")) ??
    stemmer.find((s) => s.lang.toLowerCase().includes("nor"))
  );
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
  const stemme = finnNorskStemme();
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
  ytring.pitch = 1.05;
  const stemme = finnNorskStemme();
  if (stemme) ytring.voice = stemme;
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
