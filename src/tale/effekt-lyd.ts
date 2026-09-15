/** Korte veilyder via HTMLAudio — samme opplåsning som Alf, så iPhone faktisk spiller dem. */

const STILLE_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export type EffektTone = {
  type: "sine" | "square" | "triangle";
  frekvens: number;
  start: number;
  varighet: number;
  volum: number;
  sluttFrekvens?: number;
};

let effektSpiller: HTMLAudioElement | null = null;
let sisteEffektUrl = "";

function hentEffektSpiller(): HTMLAudioElement {
  if (!effektSpiller) {
    effektSpiller = new Audio();
    effektSpiller.preload = "auto";
    effektSpiller.setAttribute("playsinline", "true");
  }
  return effektSpiller;
}

export function aktiverEffektLyd(): void {
  const lyd = hentEffektSpiller();
  if (!lyd.paused && !lyd.ended && lyd.src.startsWith("blob:")) return;
  if (lyd.src.startsWith("blob:")) {
    URL.revokeObjectURL(lyd.src);
    sisteEffektUrl = "";
  }
  lyd.src = STILLE_WAV;
  void lyd.play().catch(() => {
    /* iPhone åpner effektlyden ved trykk */
  });
}

function sampleFor(type: EffektTone["type"], phase: number, t: number, frekvens: number): number {
  if (type === "sine") return Math.sin(phase);
  if (type === "square") return Math.sin(phase) >= 0 ? 1 : -1;
  const tri = 2 * Math.abs(2 * ((frekvens * t) % 1) - 1) - 1;
  return tri;
}

function konvolutt(t: number, varighet: number, volum: number): number {
  const angrep = Math.min(0.012, varighet / 3);
  if (t < angrep) return volum * (t / angrep);
  const rest = Math.max(0, 1 - (t - angrep) / Math.max(0.001, varighet - angrep));
  return volum * rest;
}

/** Bygger en mono 16-bit WAV av én eller flere toner (testbart uten DOM). */
export function lagEffektWav(deler: EffektTone[], sampleRate = 22050): Blob {
  if (deler.length === 0) return new Blob();
  const slutt = Math.max(...deler.map((d) => d.start + d.varighet)) + 0.02;
  const n = Math.max(1, Math.ceil(slutt * sampleRate));
  const samples = new Float32Array(n);

  for (const del of deler) {
    const i0 = Math.floor(del.start * sampleRate);
    const len = Math.floor(del.varighet * sampleRate);
    for (let i = 0; i < len; i += 1) {
      const t = i / sampleRate;
      const frekvens =
        del.sluttFrekvens != null && del.varighet > 0
          ? del.frekvens * Math.pow(Math.max(1, del.sluttFrekvens) / del.frekvens, t / del.varighet)
          : del.frekvens;
      const phase = 2 * Math.PI * frekvens * t;
      const verdi = sampleFor(del.type, phase, t, frekvens) * konvolutt(t, del.varighet, del.volum);
      const idx = i0 + i;
      if (idx >= 0 && idx < n) samples[idx] = Math.max(-1, Math.min(1, samples[idx]! + verdi));
    }
  }

  const buffer = new ArrayBuffer(44 + n * 2);
  const visning = new DataView(buffer);
  const skrivTekst = (offset: number, tekst: string) => {
    for (let i = 0; i < tekst.length; i += 1) visning.setUint8(offset + i, tekst.charCodeAt(i));
  };
  skrivTekst(0, "RIFF");
  visning.setUint32(4, 36 + n * 2, true);
  skrivTekst(8, "WAVE");
  skrivTekst(12, "fmt ");
  visning.setUint32(16, 16, true);
  visning.setUint16(20, 1, true);
  visning.setUint16(22, 1, true);
  visning.setUint32(24, sampleRate, true);
  visning.setUint32(28, sampleRate * 2, true);
  visning.setUint16(32, 2, true);
  visning.setUint16(34, 16, true);
  skrivTekst(36, "data");
  visning.setUint32(40, n * 2, true);
  let offset = 44;
  for (let i = 0; i < n; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    visning.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export function spillEffektWav(blob: Blob): void {
  if (blob.size === 0) return;
  const lyd = hentEffektSpiller();
  if (sisteEffektUrl) URL.revokeObjectURL(sisteEffektUrl);
  const url = URL.createObjectURL(blob);
  sisteEffektUrl = url;
  lyd.pause();
  lyd.src = url;
  lyd.currentTime = 0;
  void lyd.play().catch(() => {
    /* kan skje før opplåsning; neste trykk åpner lyden */
  });
}

export function spillEffektToner(deler: EffektTone[]): void {
  spillEffektWav(lagEffektWav(deler));
}
