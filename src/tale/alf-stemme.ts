export const PIPER_ID = "no_NO-talesyntese-medium";

const STILLE_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export type AlfStemmeStatus = {
  tilstand: "klar" | "laster" | "feil";
  prosent?: number;
};

type PiperPakke = typeof import("@mintplex-labs/piper-tts-web");
type PiperOkt = { predict: (tekst: string) => Promise<Blob> };
type OrtWasm = {
  env?: { wasm?: { numThreads?: number; simd?: boolean; wasmPaths?: string } };
};

let piper: PiperPakke | null = null;
let okt: PiperOkt | null = null;
let lasting: Promise<boolean> | null = null;
let spillNr = 0;
let alfSpiller: HTMLAudioElement | null = null;
let statusLytter: ((status: AlfStemmeStatus) => void) | null = null;
let sisteStatus: AlfStemmeStatus = { tilstand: "klar" };

export function medTidsfrist<T>(jobb: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("tid")), ms);
    jobb.then(
      (verdi) => {
        clearTimeout(t);
        resolve(verdi);
      },
      (feil: unknown) => {
        clearTimeout(t);
        reject(feil);
      },
    );
  });
}

export function alfErKlar(): boolean {
  return okt != null;
}

export function onAlfStemmeStatus(lytter: (status: AlfStemmeStatus) => void): void {
  statusLytter = lytter;
  lytter(sisteStatus);
}

function meld(status: AlfStemmeStatus): void {
  sisteStatus = status;
  statusLytter?.(status);
}

function hentAlfSpiller(): HTMLAudioElement {
  if (!alfSpiller) {
    alfSpiller = new Audio();
    alfSpiller.preload = "auto";
    alfSpiller.setAttribute("playsinline", "true");
  }
  return alfSpiller;
}

export function aktiverAlfLyd(): void {
  const lyd = hentAlfSpiller();
  if (!lyd.src) lyd.src = STILLE_WAV;
  void lyd.play().catch(() => {
    /* iPhone åpner lyden ved trykk; selve setningen kommer etterpå */
  });
}

export function stoppAlfStemme(): void {
  spillNr += 1;
  if (!alfSpiller) return;
  alfSpiller.pause();
  alfSpiller.currentTime = 0;
}

async function medEnTrad<T>(fn: () => Promise<T>): Promise<T> {
  const nav = globalThis.navigator;
  if (!nav) return fn();
  const forrige = Object.getOwnPropertyDescriptor(nav, "hardwareConcurrency");
  Object.defineProperty(nav, "hardwareConcurrency", { configurable: true, get: () => 1 });
  try {
    return await fn();
  } finally {
    if (forrige) Object.defineProperty(nav, "hardwareConcurrency", forrige);
    else delete (nav as { hardwareConcurrency?: number }).hardwareConcurrency;
  }
}

async function forberedOrt(): Promise<void> {
  const modul = await import("onnxruntime-web/wasm");
  const ort = ((modul as { default?: OrtWasm }).default ?? modul) as OrtWasm;
  if (ort.env?.wasm) {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false;
  }
}

async function hentPiper(): Promise<PiperPakke> {
  if (piper) return piper;
  const pakke = await import("@mintplex-labs/piper-tts-web");
  pakke.PATH_MAP[PIPER_ID] = "no/no_NO/talesyntese/medium/no_NO-talesyntese-medium.onnx";
  piper = pakke;
  return pakke;
}

export async function lastAlfStemme(): Promise<boolean> {
  if (okt) {
    meld({ tilstand: "klar" });
    return true;
  }
  if (lasting) return lasting;
  lasting = (async () => {
    try {
      meld({ tilstand: "laster", prosent: 0 });
      await forberedOrt();
      const tts = await hentPiper();
      const framdrift = (p: { loaded: number; total: number }) => {
        if (p.total > 0) meld({ tilstand: "laster", prosent: Math.min(99, Math.round((p.loaded * 100) / p.total)) });
      };
      const lagret = await tts.stored().catch(() => [] as string[]);
      if (!lagret.includes(PIPER_ID)) {
        await medTidsfrist(tts.download(PIPER_ID, framdrift), 90000);
      }
      const ny = await medTidsfrist(
        medEnTrad(() =>
          tts.TtsSession.create({
            voiceId: PIPER_ID,
            progress: framdrift,
          }),
        ),
        45000,
      );
      okt = ny;
      meld({ tilstand: "klar" });
      return true;
    } catch {
      ttsNullstill();
      lasting = null;
      meld({ tilstand: "feil" });
      return false;
    }
  })();
  return lasting;
}

function ttsNullstill(): void {
  if (piper) piper.TtsSession._instance = null;
  okt = null;
}

async function spillWav(blob: Blob): Promise<void> {
  const lyd = hentAlfSpiller();
  const url = URL.createObjectURL(blob);
  lyd.pause();
  if (lyd.src.startsWith("blob:")) URL.revokeObjectURL(lyd.src);
  lyd.src = url;
  lyd.currentTime = 0;
  await lyd.play();
}

export async function spillAlfStemme(tekst: string): Promise<void> {
  const nr = ++spillNr;
  if (alfSpiller) {
    alfSpiller.pause();
    alfSpiller.currentTime = 0;
  }
  const ok = await lastAlfStemme();
  if (!ok || nr !== spillNr || !okt) throw new Error("alf-stemme");
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  if (nr !== spillNr) return;
  const wav = await medTidsfrist(okt.predict(tekst), 12000);
  if (nr !== spillNr) return;
  await spillWav(wav);
}

export async function lagAlfLyd(tekst: string): Promise<Blob> {
  const ok = await lastAlfStemme();
  if (!ok || !okt) throw new Error("alf-stemme");
  return medTidsfrist(okt.predict(tekst), 15000);
}

function hentLimCtx(): AudioContext {
  const Ctx = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error("alf-stemme");
  return new Ctx();
}

function bufferTilWav(buffer: AudioBuffer): Blob {
  const kanal = buffer.getChannelData(0);
  const data = new Int16Array(kanal.length);
  for (let i = 0; i < kanal.length; i += 1) {
    const x = Math.max(-1, Math.min(1, kanal[i] ?? 0));
    data[i] = x < 0 ? x * 0x8000 : x * 0x7fff;
  }
  const hode = 44;
  const bytes = new ArrayBuffer(hode + data.byteLength);
  const visning = new DataView(bytes);
  const skriv = (offset: number, tekst: string) => {
    for (let i = 0; i < tekst.length; i += 1) visning.setUint8(offset + i, tekst.charCodeAt(i));
  };
  skriv(0, "RIFF");
  visning.setUint32(4, 36 + data.byteLength, true);
  skriv(8, "WAVE");
  skriv(12, "fmt ");
  visning.setUint32(16, 16, true);
  visning.setUint16(20, 1, true);
  visning.setUint16(22, 1, true);
  visning.setUint32(24, buffer.sampleRate, true);
  visning.setUint32(28, buffer.sampleRate * 2, true);
  visning.setUint16(32, 2, true);
  visning.setUint16(34, 16, true);
  skriv(36, "data");
  visning.setUint32(40, data.byteLength, true);
  new Uint8Array(bytes, hode).set(new Uint8Array(data.buffer));
  return new Blob([bytes], { type: "audio/wav" });
}

async function limAlfLyd(deler: string[], pauseSek: number): Promise<Blob> {
  const ctx = hentLimCtx();
  if (ctx.state === "suspended") await ctx.resume();
  const buffere: AudioBuffer[] = [];
  for (const del of deler) {
    const wav = await lagAlfLyd(del);
    buffere.push(await ctx.decodeAudioData(await wav.arrayBuffer()));
  }
  const rate = buffere[0]?.sampleRate ?? 22050;
  const pause = Math.round(rate * pauseSek);
  const total = buffere.reduce((sum, b) => sum + b.length, 0) + pause * Math.max(0, buffere.length - 1);
  const ut = ctx.createBuffer(1, total, rate);
  let pos = 0;
  for (const [i, b] of buffere.entries()) {
    ut.getChannelData(0).set(b.getChannelData(0), pos);
    pos += b.length;
    if (i < buffere.length - 1) pos += pause;
  }
  void ctx.close();
  return bufferTilWav(ut);
}

export async function spillAlfDeler(deler: string[]): Promise<void> {
  const rene = deler.map((d) => d.trim()).filter(Boolean);
  if (rene.length === 0) return;
  const nr = ++spillNr;
  if (alfSpiller) {
    alfSpiller.pause();
    alfSpiller.currentTime = 0;
  }
  const ok = await lastAlfStemme();
  if (!ok || nr !== spillNr || !okt) throw new Error("alf-stemme");
  const wav = rene.length === 1 ? await lagAlfLyd(rene[0]!) : await limAlfLyd(rene, 0.22);
  if (nr !== spillNr) return;
  await spillWav(wav);
}
