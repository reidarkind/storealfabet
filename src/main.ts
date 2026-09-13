import { registerSW } from "virtual:pwa-register";
import "./style.css";
import { lesLagring, oppdaterRekord, skrivLagring } from "./lagring";
import { miltTap, verdi } from "./okonomi";
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
import { baneFraX, flyttBane, startSti, stiSkala, stiTick, stiVenstre, velgBane, type Bane, type StiTilstand } from "./spill/sti";
import { aktiverLyd, harTale, norskeStemmer, settStemme, si, spillKling, stoppTale } from "./tale/tale";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { MELK_NAVN, NIVAA_NAVN, type Innstillinger, type Melk, type Nivaa, type Oppgave, type Sekk } from "./typer";
import type { Tur } from "./spill/tur";
const TID = 30;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let innstillinger: Innstillinger = lesLagring().innstillinger;
let tur: Tur | null = null;
let aktivOppgave: Oppgave | null = null;
let iDuell = false;
let tegneForsok = 0;
let timerId = 0;
let gjenstaende = TID;
let tegner = false;
let aktivSti: StiTilstand | null = null;

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
  $("knapp-spill").addEventListener("click", () => {
    aktiverLyd();
    void startSpill();
  });
  $("knapp-innstillinger").addEventListener("click", () => {
    vis("skjerm-innstillinger");
    markerNivaa();
    markerSekk();
    fyllStemmer();
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
  document.querySelectorAll<HTMLButtonElement>("[data-sekk]").forEach((knapp) => {
    knapp.addEventListener("click", () => {
      innstillinger = { ...innstillinger, sekk: knapp.dataset.sekk as Sekk };
      persist();
      markerSekk();
    });
  });
  $("stemme-valg").addEventListener("change", () => {
    const valg = $("stemme-valg") as HTMLSelectElement;
    innstillinger = { ...innstillinger, stemme: valg.value };
    settStemme(innstillinger.stemme);
    persist();
  });
  $("prov-stemme").addEventListener("click", () => {
    aktiverLyd();
    si("Hei, jeg er Alf. Vi skal rekke skolen.", true);
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

function markerSekk(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-sekk]").forEach((knapp) => {
    knapp.classList.toggle("valgt", knapp.dataset.sekk === innstillinger.sekk);
  });
}

function fyllStemmer(): void {
  const valg = $("stemme-valg") as HTMLSelectElement;
  const stemmer = norskeStemmer();
  valg.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = stemmer[0] ? `Automatisk (${stemmer[0].name})` : "Automatisk";
  valg.append(auto);
  for (const stemme of stemmer) {
    const opt = document.createElement("option");
    opt.value = stemme.name;
    opt.textContent = stemme.name;
    valg.append(opt);
  }
  valg.value = innstillinger.stemme;
  if (valg.value !== innstillinger.stemme) valg.value = "";
}

function markerNivaa(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-nivaa]").forEach((knapp) => {
    knapp.classList.toggle("valgt", knapp.dataset.nivaa === innstillinger.nivaa);
  });
}

async function startSpill(): Promise<void> {
  vis("skjerm-spill");
  tur = startTur(innstillinger);
  iDuell = false;
  tegneForsok = 0;
  oppdaterHud();
  $("oppgave-kort").hidden = true;
  $("melkebod").hidden = true;
  visLekseStopp(1);
  visLekseZombie(false);
  $("hint-linje").textContent = "Skolen er der framme. Alf glemte lekser i går.";
  await vent(300);
  await spillSti();
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
  $("skjerm-spill").classList.toggle("tegn-modus", oppgave.type === "tegning");
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
    $("tegn-knapper").hidden = false;
    forberedTegning(oppgave.omriss ?? "O");
  } else {
    tegn.hidden = true;
    valg.hidden = false;
    $("tegn-sjekk").hidden = true;
    $("tegn-knapper").hidden = true;
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
    feirLekse();
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
    visLekseZombie(false);
    if (vant) feirLekse();
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
  visLekseZombie(true);
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
  $("skjerm-spill").classList.remove("tegn-modus");
    $("skjerm-spill").classList.remove("paa-sti");
  $("hint-linje").textContent = "Videre mot skolen! Plukk steiner og hopp unna zombier.";
  await spillSti();
  visLekseStopp(tur.stopp);
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
  feirLekse();
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
  const wrap = $("tegne-wrap");
  const css = Math.max(120, Math.min(200, Math.floor(wrap.clientWidth || 160)));
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
  gctx.font = `${Math.floor(css * 0.7)}px Georgia, serif`;
  gctx.textAlign = "center";
  gctx.textBaseline = "middle";
  gctx.lineWidth = 8;
  gctx.strokeStyle = "rgba(244, 210, 122, 0.35)";
  gctx.strokeText(bokstav, css / 2, css / 2 + 8);
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
  $("tegn-slett").addEventListener("click", () => {
    const lerret = $("tegn") as HTMLCanvasElement;
    const ctx = lerret.getContext("2d");
    if (!ctx || !aktivOppgave?.omriss) return;
    ctx.clearRect(0, 0, lerret.width, lerret.height);
  });
  $("tegn-sjekk").addEventListener("click", () => void sjekkTegning());
  $("hoer").addEventListener("click", () => {
    if (!aktivOppgave) return;
    if (harTale() && innstillinger.lydPa) si(aktivOppgave.tale, true);
    else $("hint-linje").textContent = aktivOppgave.tale;
  });
  $("hjem-fra-spill").addEventListener("click", () => {
    stoppTimer();
    stoppTale();
    cancelAnimationFrame(stiRamme);
    aktivSti = null;
    $("sti-spill").hidden = true;
    $("skjerm-spill").classList.remove("tegn-modus");
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

let stiRamme = 0;

function visLekseStopp(stopp: number): void {
  const alf = $("lekse-alf");
  const zombie = $("lekse-zombie");
  alf.dataset.sekk = innstillinger.sekk;
  alf.style.left = `${10 + (stopp - 1) * 12}%`;
  alf.style.backgroundImage = `url(${import.meta.env.BASE_URL}alf.svg)`;
  zombie.style.backgroundImage = `url(${import.meta.env.BASE_URL}zombie.svg)`;
}

function visLekseZombie(vises: boolean): void {
  $("lekse-zombie").hidden = !vises;
}

function feirLekse(): void {
  const alf = $("lekse-alf");
  alf.classList.add("feirer");
  window.setTimeout(() => alf.classList.remove("feirer"), 700);
}

function tegnSti(tilstand: StiTilstand): void {
  $("sti-ur").textContent = String(Math.ceil(tilstand.tid));
  const alf = $("sti-alf");
  alf.style.left = stiVenstre(tilstand.bane, 0.92);
  alf.dataset.sekk = innstillinger.sekk;
  $("sti-sekk").className = `sekk-${innstillinger.sekk}`;
  const bak = document.querySelector("#sti-alf .alf-pose.bak") as HTMLImageElement;
  const foran = document.querySelector("#sti-alf .alf-pose.foran") as HTMLImageElement;
  bak.src = `${import.meta.env.BASE_URL}alf-bak.svg`;
  foran.src = `${import.meta.env.BASE_URL}alf.svg`;
  const lag = $("sti-lag");
  lag.innerHTML = "";
  for (const objekt of tilstand.objekter) {
    const el = document.createElement("img");
    el.className = `sti-ting ${objekt.type}`;
    const skala = stiSkala(objekt.y);
    el.style.left = stiVenstre(objekt.bane, objekt.y);
    el.style.top = `${10 + objekt.y * 72}%`;
    el.style.transform = `translateX(-50%) scale(${skala})`;
    el.style.zIndex = String(10 + Math.round(objekt.y * 80));
    el.src = `${import.meta.env.BASE_URL}${objekt.type}.svg`;
    el.alt = objekt.type === "krystall" ? "krystall" : objekt.type === "diamant" ? "diamant" : "zombie";
    lag.append(el);
  }
}

function visAlfGlad(): void {
  const alf = $("sti-alf");
  alf.classList.add("glad");
  window.setTimeout(() => alf.classList.remove("glad"), 700);
}

async function spillSti(): Promise<void> {
  const panel = $("sti-spill");
  $("skjerm-spill").classList.add("paa-sti");
  panel.hidden = false;
  $("oppgave-kort").hidden = true;
  aktivSti = startSti();
  let tilstand = aktivSti;
  tegnSti(tilstand);
  await new Promise<void>((resolve) => {
    let forrige = performance.now();
    const steg = (naa: number) => {
      const dt = Math.min(0.05, (naa - forrige) / 1000);
      forrige = naa;
      const resultat = stiTick(tilstand, dt);
      tilstand = resultat.tilstand;
      aktivSti = tilstand;
      for (const hendelse of resultat.hendelser) {
        if (hendelse.type === "plukk") {
          spillKling(innstillinger.lydPa, hendelse.objekt === "diamant" ? 880 : 640);
          visAlfGlad();
        }
        else spillKling(innstillinger.lydPa, 180);
      }
      tegnSti(tilstand);
      if (tilstand.ferdig) {
        resolve();
        return;
      }
      stiRamme = requestAnimationFrame(steg);
    };
    stiRamme = requestAnimationFrame(steg);
  });
  if (tur) {
    for (let i = 0; i < tilstand.krystaller; i++) tur = { ...tur, lomme: { ...tur.lomme, krystaller: tur.lomme.krystaller + 1 } };
    for (let i = 0; i < tilstand.diamanter; i++) tur = { ...tur, lomme: { ...tur.lomme, diamanter: tur.lomme.diamanter + 1 } };
    if (tilstand.zombieTreff > 0) tur = { ...tur, lomme: miltTap(tur.lomme, tilstand.zombieTreff) };
    oppdaterHud();
  }
  aktivSti = null;
  panel.hidden = true;
  $("skjerm-spill").classList.remove("paa-sti");
}

function settStiBane(bane: Bane): void {
  if (!aktivSti) return;
  aktivSti = velgBane(aktivSti, bane);
  tegnSti(aktivSti);
}

function bindSti(): void {
  const panel = $("sti-spill");
  let startX = 0;
  let startY = 0;
  let peker = -1;

  panel.addEventListener("pointerdown", (e) => {
    if (!aktivSti || panel.hidden) return;
    peker = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    panel.setPointerCapture(e.pointerId);
  });

  const slipp = (e: PointerEvent) => {
    if (!aktivSti || peker !== e.pointerId) return;
    peker = -1;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) >= 24 && Math.abs(dx) > Math.abs(dy) * 0.8) {
      aktivSti = flyttBane(aktivSti, dx < 0 ? -1 : 1);
      tegnSti(aktivSti);
      return;
    }
    const ramme = panel.getBoundingClientRect();
    if (ramme.width <= 0) return;
    settStiBane(baneFraX((e.clientX - ramme.left) / ramme.width));
  };

  panel.addEventListener("pointerup", slipp);
  panel.addEventListener("pointercancel", () => {
    peker = -1;
  });

  window.addEventListener("keydown", (e) => {
    if (!aktivSti) return;
    if (e.key === "ArrowLeft") {
      aktivSti = flyttBane(aktivSti, -1);
      tegnSti(aktivSti);
    }
    if (e.key === "ArrowRight") {
      aktivSti = flyttBane(aktivSti, 1);
      tegnSti(aktivSti);
    }
  });
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
bindSti();
oppdaterMeny();
vis("skjerm-meny");
visInstallasjon();
settStemme(innstillinger.stemme);
if (harTale()) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener("voiceschanged", () => {
    speechSynthesis.getVoices();
    if (!$("skjerm-innstillinger").hidden) fyllStemmer();
  });
}
