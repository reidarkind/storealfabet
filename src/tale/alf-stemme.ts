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
let lydCtx: AudioContext | null = null;
let alfSpiller: HTMLAudioElement | null = null;
let statusLytter: ((status: AlfStemmeStatus) => void) | null = null;
let sisteStatus: AlfStemmeStatus = { tilstand: "klar" };
let spillFerdig: (() => void) | null = null;

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

export function hentLydKontekst(): AudioContext | null {
  const Ctx = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!lydCtx) lydCtx = new Ctx();
  return lydCtx;
}

/** Kort, nesten stille buffer — må spilles i samme trykk som resume, ellers forblir iPhone stum. */
function spillWebAudioOpplasning(ctx: AudioContext): void {
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.001;
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);
  } catch {
    /* noen nettlesere nekter start mens suspended; resume kommer like etter */
  }
}

/** Åpner HTML-lyd (Alf) og Web Audio i samme fingertrykk. */
export function aktiverAlfLyd(): void {
  const ctx = hentLydKontekst();
  if (ctx) {
    spillWebAudioOpplasning(ctx);
    if (ctx.state === "suspended") {
      void ctx.resume().then(() => {
        if (ctx.state === "running") spillWebAudioOpplasning(ctx);
      });
    }
  }

  const lyd = hentAlfSpiller();
  const snakker = !lyd.paused && !lyd.ended && lyd.src.startsWith("blob:");
  if (snakker) return;
  if (lyd.src.startsWith("blob:")) URL.revokeObjectURL(lyd.src);
  lyd.src = STILLE_WAV;
  void lyd.play().catch(() => {
    /* iPhone åpner lyden ved trykk; selve setningen kommer etterpå */
  });
}

/** Venter til Web Audio faktisk kjører, så toner ikke planlegges mens konteksten er suspended. */
export async function medKjorendeLyd<T>(
  spill: (ctx: AudioContext) => T | Promise<T>,
  ctx: AudioContext | null = hentLydKontekst(),
): Promise<T | null> {
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  if (ctx.state !== "running") return null;
  return spill(ctx);
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

function vent(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function spillWav(blob: Blob): Promise<void> {
  const lyd = hentAlfSpiller();
  const url = URL.createObjectURL(blob);
  lyd.pause();
  if (lyd.src.startsWith("blob:")) URL.revokeObjectURL(lyd.src);
  lyd.src = url;
  lyd.currentTime = 0;
  await new Promise<void>((resolve, reject) => {
    const ferdig = () => {
      if (spillFerdig === ferdig) spillFerdig = null;
      lyd.removeEventListener("ended", ferdig);
      lyd.removeEventListener("error", feil);
      resolve();
    };
    const feil = () => {
      if (spillFerdig === ferdig) spillFerdig = null;
      lyd.removeEventListener("ended", ferdig);
      lyd.removeEventListener("error", feil);
      reject(new Error("alf-spill"));
    };
    spillFerdig = ferdig;
    lyd.addEventListener("ended", ferdig);
    lyd.addEventListener("error", feil);
    void lyd.play().catch(feil);
  });
}

export function stoppAlfStemme(): void {
  spillNr += 1;
  spillFerdig?.();
  spillFerdig = null;
  if (!alfSpiller) return;
  alfSpiller.pause();
  alfSpiller.currentTime = 0;
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
  let neste: Promise<Blob> | undefined;
  for (let i = 0; i < rene.length; i += 1) {
    if (nr !== spillNr) return;
    const wav = await (neste ?? lagAlfLyd(rene[i]!));
    neste = i + 1 < rene.length ? lagAlfLyd(rene[i + 1]!) : undefined;
    if (nr !== spillNr) return;
    await spillWav(wav);
    if (nr !== spillNr) return;
    if (neste) await vent(220);
  }
}
