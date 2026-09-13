import { registerSW } from "virtual:pwa-register";
import "./style.css";
import { lesLagring, oppdaterRekord, skrivLagring } from "./lagring";
import { verdi } from "./okonomi";
import { sjekkSvar } from "./oppgaver/bank";
import {
  avsluttDuell,
  avsluttTur,
  duellFerdig,
  duellVunnet,
  harZombie,
  hentOppgave,
  nesteStopp,
  registrerDuellSvar,
  registrerOppgaveSvar,
  startDuell,
  startTur,
} from "./spill/tur";
import { hentVerden, lagSpill } from "./spill/verden";
import { harTale, si, spillKling, stoppTale } from "./tale/tale";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { MELK_NAVN, NIVAA_NAVN, type Innstillinger, type Melk, type Nivaa, type Oppgave } from "./typer";
import type { Tur } from "./spill/tur";
import type Phaser from "phaser";

const TID = 30;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let innstillinger: Innstillinger = lesLagring().innstillinger;
let tur: Tur | null = null;
let aktivOppgave: Oppgave | null = null;
let iDuell = false;
let tegneForsok = 0;
let timerId = 0;
let gjenstaende = TID;
let spill: Phaser.Game | null = null;
let tegner = false;

function vis(id: string): void {
  document.querySelectorAll<HTMLElement>(".skjerm").forEach((el) => {
    el.hidden = el.id !== id;
  });
}

function oppdaterMeny(): void {
  const lagret = lesLagring();
  const tekst =
    lagret.besteVerdi > 0
      ? `Beste tur: ${lagret.besteVerdi} poeng · ${MELK_NAVN[lagret.finesteMelk]}`
      : "Ingen tur ennå. Alf venter!";
  $("rekord").textContent = tekst;
  $("rekord-status").textContent = tekst;
  $("nivaa-vis").textContent = NIVAA_NAVN[lagret.innstillinger.nivaa];
}

function bindMeny(): void {
  $("knapp-spill").addEventListener("click", () => void startSpill());
  $("knapp-innstillinger").addEventListener("click", () => {
    vis("skjerm-innstillinger");
    markerNivaa();
    $("lyd-pa").setAttribute("aria-pressed", String(innstillinger.lydPa));
    $("lyd-pa").textContent = innstillinger.lydPa ? "Lyd er på" : "Lyd er av";
  });
  $("knapp-rekord").addEventListener("click", () => {
    oppdaterMeny();
    vis("skjerm-rekord");
  });
  $("knapp-om").addEventListener("click", () => vis("skjerm-om"));
  document.querySelectorAll<HTMLButtonElement>("[data-tilbake]").forEach((knapp) => {
    knapp.addEventListener("click", () => {
      vis("skjerm-meny");
      oppdaterMeny();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-nivaa]").forEach((knapp) => {
    knapp.addEventListener("click", () => {
      innstillinger = { ...innstillinger, nivaa: knapp.dataset.nivaa as Nivaa };
      persist();
      markerNivaa();
    });
  });
  $("lyd-pa").addEventListener("click", () => {
    innstillinger = { ...innstillinger, lydPa: !innstillinger.lydPa };
    persist();
    $("lyd-pa").textContent = innstillinger.lydPa ? "Lyd er på" : "Lyd er av";
    $("lyd-pa").setAttribute("aria-pressed", String(innstillinger.lydPa));
  });
}

function persist(): void {
  const lagret = lesLagring();
  skrivLagring({ ...lagret, innstillinger });
}

function markerNivaa(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-nivaa]").forEach((knapp) => {
    knapp.classList.toggle("valgt", knapp.dataset.nivaa === innstillinger.nivaa);
  });
}

async function startSpill(): Promise<void> {
  vis("skjerm-spill");
  const verdenEl = $("verden");
  if (!spill) {
    spill = lagSpill(verdenEl);
  } else {
    spill.scene.getScene("verden")?.scene.restart();
    await vent(200);
  }
  tur = startTur(innstillinger);
  iDuell = false;
  tegneForsok = 0;
  oppdaterHud();
  $("oppgave-kort").hidden = true;
  $("melkebod").hidden = true;
  $("hint-linje").textContent = "Alf har forsovet seg. Løp til skolen!";
  await vent(400);
  await hentVerden(spill)?.gaaTilStopp(1);
  await nesteOppgave();
}

async function nesteOppgave(): Promise<void> {
  if (!tur) return;
  aktivOppgave = hentOppgave(tur);
  tegneForsok = 0;
  visOppgave(aktivOppgave, iDuell ? `Duell ${tur.duellRunde} av 3` : `Stopp ${tur.stopp} av 6`);
  startTimer();
  if (innstillinger.lydPa) si(aktivOppgave.tale, true);
}

function visOppgave(oppgave: Oppgave, overskrift: string): void {
  $("oppgave-kort").hidden = false;
  $("melkebod").hidden = true;
  $("oppgave-kicker").textContent = overskrift;
  $("oppgave-tekst").textContent = oppgave.prompt;
  $("hint-linje").textContent = "";
  $("bilde-felt").hidden = !oppgave.bilde;
  if (oppgave.bilde) $("bilde-felt").textContent = bildeEmoji(oppgave.bilde);
  $("hoer").textContent = harTale() ? "Hør igjen" : "Vis lyden";
  const valg = $("valg");
  valg.innerHTML = "";
  const tegn = $("tegne-wrap") as HTMLElement;
  if (oppgave.type === "tegning") {
    tegn.hidden = false;
    valg.hidden = true;
    $("tegn-sjekk").hidden = false;
    forberedTegning(oppgave.omriss ?? "O");
  } else {
    tegn.hidden = true;
    valg.hidden = false;
    $("tegn-sjekk").hidden = true;
    for (const tekst of oppgave.valg) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "valg-knapp";
      b.textContent = tekst;
      b.addEventListener("click", () => void svar(tekst));
      valg.append(b);
    }
  }
}

function bildeEmoji(id: string): string {
  const kart: Record<string, string> = { sol: "☀️", hus: "🏠", mus: "🐭", lam: "🐑", bil: "🚗" };
  return kart[id] ?? "✨";
}

function startTimer(): void {
  stoppTimer();
  gjenstaende = TID;
  tegnUr();
  timerId = window.setInterval(() => {
    gjenstaende -= 1;
    tegnUr();
    if (gjenstaende <= 0) void svar("", true);
  }, 1000);
}

function stoppTimer(): void {
  window.clearInterval(timerId);
  timerId = 0;
}

function tegnUr(): void {
  $("ur-tekst").textContent = String(gjenstaende);
  const ring = $("ur-ring") as unknown as SVGCircleElement;
  const max = 2 * Math.PI * 16;
  ring.style.strokeDasharray = String(max);
  ring.style.strokeDashoffset = String(max * (1 - gjenstaende / TID));
  $("ur").classList.toggle("siste", gjenstaende <= 8 && innstillinger.nivaa !== "forste");
}

async function svar(tekst: string, tidsutlop = false): Promise<void> {
  if (!tur || !aktivOppgave) return;
  stoppTimer();
  const { riktig, hint } = tidsutlop
    ? { riktig: false, hint: aktivOppgave.hint }
    : sjekkSvar(aktivOppgave, tekst);
  await etterSvar(riktig, hint, tidsutlop ? "Tiden er ute." : undefined);
}

async function etterSvar(riktig: boolean, hint: string, prefiks?: string): Promise<void> {
  if (!tur || !aktivOppgave) return;
  if (riktig) {
    spillKling(innstillinger.lydPa, 740);
    $("hint-linje").textContent = prefiks ?? "Ja!";
    hentVerden(spill!)?.feir();
  } else {
    spillKling(innstillinger.lydPa, 220);
    $("hint-linje").textContent = `${prefiks ? `${prefiks} ` : ""}${hint}`;
  }

  if (iDuell) {
    tur = registrerDuellSvar(tur, riktig);
    await vent(1100);
    if (!duellFerdig(tur)) {
      await nesteOppgave();
      return;
    }
    const vant = duellVunnet(tur);
    tur = avsluttDuell(tur);
    iDuell = false;
    await hentVerden(spill!)?.gjemZombie(vant);
    $("hint-linje").textContent = vant
      ? "Zombien tumlet vekk! Alf fikk en diamant."
      : "Zombien rotet bort noen steiner. Alf løper videre.";
    oppdaterHud();
    await vent(1000);
    await videreEtterStopp();
    return;
  }

  tur = registrerOppgaveSvar(tur, riktig, aktivOppgave.belonning);
  oppdaterHud();
  await vent(1100);
  if (harZombie(tur)) {
    await startZombieDuell();
    return;
  }
  await videreEtterStopp();
}

async function startZombieDuell(): Promise<void> {
  if (!tur) return;
  iDuell = true;
  tur = startDuell(tur);
  $("hint-linje").textContent = "En zombie vagger ut fra grøfta!";
  await hentVerden(spill!)?.visZombie();
  await nesteOppgave();
}

async function videreEtterStopp(): Promise<void> {
  if (!tur) return;
  tur = nesteStopp(tur);
  if (tur.ferdig) {
    await visMelkebod();
    return;
  }
  $("oppgave-kort").hidden = true;
  await hentVerden(spill!)?.gaaTilStopp(tur.stopp);
  oppdaterHud();
  await nesteOppgave();
}

async function visMelkebod(): Promise<void> {
  if (!tur) return;
  stoppTale();
  const slutt = avsluttTur(tur);
  $("oppgave-kort").hidden = true;
  $("melkebod").hidden = false;
  $("melk-tittel").textContent = MELK_NAVN[slutt.melk];
  $("melk-tekst").textContent = melkTekst(slutt.melk, slutt.verdi, slutt.lomme.krystaller, slutt.lomme.diamanter);
  $("melk-ikon").textContent = melkIkon(slutt.melk);
  const lagret = oppdaterRekord(lesLagring(), slutt.verdi, slutt.melk);
  skrivLagring({ ...lagret, innstillinger });
  hentVerden(spill!)?.feir();
  if (innstillinger.lydPa) si(`Alf fikk ${MELK_NAVN[slutt.melk]}`, true);
}

function melkTekst(melk: Melk, v: number, k: number, d: number): string {
  return `Alf kom frem med ${k} krystaller og ${d} diamanter (${v} poeng). Han kjøpte ${MELK_NAVN[melk].toLowerCase()}!`;
}

function melkIkon(melk: Melk): string {
  if (melk === "stjerne") return "🌟🥛";
  if (melk === "sjokolade") return "🍫🥛";
  if (melk === "jordbaer") return "🍓🥛";
  return "🥛";
}

function oppdaterHud(): void {
  if (!tur) return;
  $("hud-stopp").textContent = `${tur.stopp} / 6`;
  $("hud-krystall").textContent = String(tur.lomme.krystaller);
  $("hud-diamant").textContent = String(tur.lomme.diamanter);
  $("hud-verdi").textContent = String(verdi(tur.lomme));
}

function forberedTegning(bokstav: string): void {
  const lerret = $("tegn") as HTMLCanvasElement;
  const ghost = $("tegn-ghost") as HTMLCanvasElement;
  const ctx = lerret.getContext("2d");
  const gctx = ghost.getContext("2d");
  if (!ctx || !gctx) return;
  const dpr = window.devicePixelRatio || 1;
  const css = 260;
  for (const c of [lerret, ghost]) {
    c.width = css * dpr;
    c.height = css * dpr;
    c.style.width = `${css}px`;
    c.style.height = `${css}px`;
  }
  gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  gctx.clearRect(0, 0, css, css);
  ctx.clearRect(0, 0, css, css);
  gctx.font = "180px Georgia, serif";
  gctx.textAlign = "center";
  gctx.textBaseline = "middle";
  gctx.lineWidth = 8;
  gctx.strokeStyle = "rgba(244, 210, 122, 0.35)";
  gctx.strokeText(bokstav, 130, 140);
}

function bindTegning(): void {
  const lerret = $("tegn") as HTMLCanvasElement;
  const ctx = () => lerret.getContext("2d");
  const punkt = (e: PointerEvent) => {
    const r = lerret.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  lerret.addEventListener("pointerdown", (e) => {
    tegner = true;
    lerret.setPointerCapture(e.pointerId);
    const c = ctx();
    if (!c) return;
    const p = punkt(e);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineWidth = 14;
    c.lineCap = "round";
    c.strokeStyle = "#f4d27a";
  });
  lerret.addEventListener("pointermove", (e) => {
    if (!tegner) return;
    const c = ctx();
    if (!c) return;
    const p = punkt(e);
    c.lineTo(p.x, p.y);
    c.stroke();
  });
  const slutt = () => {
    tegner = false;
  };
  lerret.addEventListener("pointerup", slutt);
  lerret.addEventListener("pointercancel", slutt);
  $("tegn-sjekk").addEventListener("click", () => void sjekkTegning());
  $("hoer").addEventListener("click", () => {
    if (!aktivOppgave) return;
    if (harTale() && innstillinger.lydPa) si(aktivOppgave.tale, true);
    else $("hint-linje").textContent = aktivOppgave.tale;
  });
  $("hjem-fra-spill").addEventListener("click", () => {
    stoppTimer();
    stoppTale();
    tur = null;
    vis("skjerm-meny");
    oppdaterMeny();
  });
  $("ny-tur").addEventListener("click", () => void startSpill());
}

async function sjekkTegning(): Promise<void> {
  if (!aktivOppgave) return;
  const lerret = $("tegn") as HTMLCanvasElement;
  const ghost = $("tegn-ghost") as HTMLCanvasElement;
  const ctx = lerret.getContext("2d");
  const gctx = ghost.getContext("2d");
  if (!ctx || !gctx) return;
  const strek = rasterFraAlpha(ctx.getImageData(0, 0, lerret.width, lerret.height).data, lerret.width, lerret.height);
  const omriss = rasterFraAlpha(gctx.getImageData(0, 0, ghost.width, ghost.height).data, ghost.width, ghost.height, 10);
  const ok = vurderTegning(strek, omriss);
  if (!ok && tegneForsok < 1) {
    tegneForsok += 1;
    $("hint-linje").textContent = "Prøv en gang til. Følg det lyse spøkelset.";
    return;
  }
  stoppTimer();
  await etterSvar(ok, aktivOppgave.hint);
}

function vent(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function visInstallasjon(): void {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  $("ios-hint").hidden = !ios || standalone;
}

registerSW({ immediate: true });

bindMeny();
bindTegning();
oppdaterMeny();
vis("skjerm-meny");
visInstallasjon();
if (harTale()) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener("voiceschanged", () => speechSynthesis.getVoices());
}
