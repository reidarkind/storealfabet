import { lagAlfLyd, lastAlfStemme, spillAlfDeler } from "../src/tale/alf-stemme";
import { forberedTaleDeler } from "../src/tale/tale";

let spiller: HTMLAudioElement | null = null;

function visStatus(tekst: string): void {
  const el = document.getElementById("status");
  if (el) el.textContent = tekst;
}

async function limMedPause(deler: string[], pauseSek = 0.45): Promise<Blob> {
  const ctx = new AudioContext();
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
  return bufferTilWav(ut);
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

async function spillBlob(blob: Blob): Promise<void> {
  if (spiller) {
    spiller.pause();
    if (spiller.src.startsWith("blob:")) URL.revokeObjectURL(spiller.src);
  }
  spiller = new Audio(URL.createObjectURL(blob));
  spiller.setAttribute("playsinline", "");
  await spiller.play();
}

const PROVER: Record<string, () => Promise<void>> = {
  "lese-naa": async () => spillBlob(await lagAlfLyd("Hvilken bokstav begynner ordet – lese – med?")),
  "lese-punktum": async () => spillBlob(await lagAlfLyd("Hvilken bokstav begynner ordet. lese. med?")),
  "lese-klipp": async () => spillBlob(await limMedPause(["Hvilken bokstav begynner ordet", "lese", "med?"])),
  "lese-valgt": () => spillAlfDeler(forberedTaleDeler("Hvilken bokstav begynner ordet «lese» med?")),
  "e-naa": async () => spillBlob(await lagAlfLyd("Finn den lille bokstaven til E")),
  "e-punktum": async () => spillBlob(await lagAlfLyd("Finn den lille bokstaven til. eee.")),
  "e-klipp": async () => spillBlob(await limMedPause(["Finn den lille bokstaven til", "eee"])),
  "e-valgt": () => spillAlfDeler(forberedTaleDeler("Finn den lille bokstaven til E")),
  "r-naa": async () => spillBlob(await lagAlfLyd("Finn den lille bokstaven til R")),
  "r-valgt": () => spillAlfDeler(forberedTaleDeler("Finn den lille bokstaven til R")),
};

async function spill(id: string): Promise<void> {
  const lag = PROVER[id];
  if (!lag) return;
  visStatus("Lager lyden…");
  await lag();
  visStatus("Spiller.");
}

async function start(): Promise<void> {
  const knapper = [...document.querySelectorAll<HTMLButtonElement>("[data-prove]")];
  try {
    const ok = await lastAlfStemme();
    if (!ok) throw new Error("stemme");
    visStatus("Klar. Trykk en knapp. «Valgt løsning» og oppgaveknappene er det som nå ligger i appen.");
    for (const knapp of knapper) {
      knapp.disabled = false;
      knapp.addEventListener("click", () => {
        void spill(knapp.dataset.prove ?? "").catch(() => {
          visStatus("Kunne ikke spille. Prøv igjen.");
        });
      });
    }
    for (const knapp of document.querySelectorAll<HTMLButtonElement>("[data-oppgave]")) {
      knapp.disabled = false;
      knapp.addEventListener("click", () => {
        const tekst = knapp.textContent?.trim() ?? "";
        visStatus("Lager lyden…");
        void spillAlfDeler(forberedTaleDeler(tekst))
          .then(() => visStatus("Spiller."))
          .catch(() => visStatus("Kunne ikke spille. Prøv igjen."));
      });
    }
  } catch {
    visStatus("Klarte ikke å laste Alfs stemme. Trenger nett første gang.");
  }
}

void start();
