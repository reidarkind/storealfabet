export const PIPER_ID = "no_NO-talesyntese-medium";

export type AlfStemmeStatus = {
  tilstand: "klar" | "laster" | "feil";
  prosent?: number;
};

type PiperPakke = typeof import("@mintplex-labs/piper-tts-web");
type PiperOkt = { predict: (tekst: string) => Promise<Blob> };

let piper: PiperPakke | null = null;
let okt: PiperOkt | null = null;
let lasting: Promise<boolean> | null = null;
let spillNr = 0;
let lydKilde: AudioBufferSourceNode | null = null;
let alfLyd: AudioContext | null = null;
let statusLytter: ((status: AlfStemmeStatus) => void) | null = null;
let sisteStatus: AlfStemmeStatus = { tilstand: "klar" };

export function onAlfStemmeStatus(lytter: (status: AlfStemmeStatus) => void): void {
  statusLytter = lytter;
  lytter(sisteStatus);
}

function meld(status: AlfStemmeStatus): void {
  sisteStatus = status;
  statusLytter?.(status);
}

function alfKontekst(): AudioContext | null {
  const Ctx =
    globalThis.AudioContext ||
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!alfLyd) alfLyd = new Ctx();
  return alfLyd;
}

export function aktiverAlfLyd(): void {
  const ctx = alfKontekst();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function stoppKilde(): void {
  if (!lydKilde) return;
  try {
    lydKilde.stop();
  } catch {
    /* allerede stoppet */
  }
  lydKilde.disconnect();
  lydKilde = null;
}

export function stoppAlfStemme(): void {
  spillNr += 1;
  stoppKilde();
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
      const tts = await hentPiper();
      const framdrift = (p: { loaded: number; total: number }) => {
        if (p.total > 0) meld({ tilstand: "laster", prosent: Math.min(99, Math.round((p.loaded * 100) / p.total)) });
      };
      const lagret = await tts.stored().catch(() => [] as string[]);
      if (!lagret.includes(PIPER_ID)) {
        await tts.download(PIPER_ID, framdrift);
      }
      const ny = await medEnTrad(() =>
        tts.TtsSession.create({
          voiceId: PIPER_ID,
          progress: framdrift,
        }),
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
  const ctx = alfKontekst();
  if (ctx) {
    await ctx.resume();
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    stoppKilde();
    const kilde = ctx.createBufferSource();
    kilde.buffer = buffer;
    kilde.connect(ctx.destination);
    lydKilde = kilde;
    kilde.onended = () => {
      if (lydKilde === kilde) lydKilde = null;
    };
    kilde.start();
    return;
  }
  const lyd = new Audio(URL.createObjectURL(blob));
  await lyd.play();
}

export async function spillAlfStemme(tekst: string): Promise<void> {
  const nr = ++spillNr;
  stoppKilde();
  const ok = await lastAlfStemme();
  if (!ok || nr !== spillNr || !okt) throw new Error("alf-stemme");
  const wav = await okt.predict(tekst);
  if (nr !== spillNr) return;
  await spillWav(wav);
}
