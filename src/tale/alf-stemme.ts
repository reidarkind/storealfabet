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
