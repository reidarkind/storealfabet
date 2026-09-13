import { registerSW } from "virtual:pwa-register";
import "./style.css";
import {
  erBlantDeTi,
  lesLagring,
  navnTilTavle,
  nullstillRekorder,
  oppdaterRekord,
  settInnRekord,
  skrivLagring,
  trengerAnonymBekreftelse,
} from "./lagring";
import { giBelonning, verdi } from "./okonomi";
import { sjekkSvar } from "./oppgaver/bank";
import {
  avsluttDuell,
  avsluttTur,
  duellFerdig,
  duellVunnet,
  harZombie,
  hentOppgave,
  leggTilKrasj,
  nesteStopp,
  registrerDuellSvar,
  registrerOppgaveSvar,
  startDuell,
  startNedtelling,
  startTur,
  turKanFortsette,
} from "./spill/tur";
import { prosjektDekor, prosjektDist, prosjektPunkt, skolePunkt, turFramgang, veiAvstand, veiEndeZ, veiPunkt, zFraDist } from "./spill/perspektiv";
import { flyttX, fortsettEtterZombie, settX, startSti, stiTick, trafikkBilde, xFraSkjerm, type StiHendelse, type StiTilstand } from "./spill/sti";
import { SvarVakt } from "./spill/svar-vakt";
import { lastAlfStemme, onAlfStemmeStatus, type AlfStemmeStatus } from "./tale/alf-stemme";
import {
  ALF_STEMME,
  AUTO_STEMME,
  aktiverLyd,
  kanSnakke,
  lesOppgave,
  norskeStemmer,
  settStemme,
  si,
  spillKling,
  spillStiLyd,
  stiLydForHendelse,
  stoppTale,
} from "./tale/tale";
import { htmlMedSitertOrd } from "./oppgaver/sitat";
import { lekseIntro, lekseIntroTrykkGjelder, type StiRapport } from "./spill/lekse-intro";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { lerretPunkt } from "./tegning/punkt";
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
let pausetSti: StiTilstand | null = null;
let duellFraSti = false;
let stiPauset = false;
let startLopenr = 0;
let sisteStiRapport: StiRapport = { sykler: 0, biler: 0, baesj: 0 };
let lekseIntroResolve: (() => void) | null = null;
let lekseIntroNed = false;
const svarVakt = new SvarVakt();

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
  fyllRekordTavle(lagret.tavle ?? []);
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
  $("knapp-installer").addEventListener("click", () => vis("skjerm-installer"));
  $("knapp-om").addEventListener("click", () => vis("skjerm-om"));
  $("install-hint").addEventListener("click", () => vis("skjerm-installer"));
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
  $("stemme-valg").addEventListener("click", (e) => {
    const knapp = (e.target as HTMLElement).closest("[data-stemme]");
    if (!(knapp instanceof HTMLButtonElement)) return;
    innstillinger = { ...innstillinger, stemme: knapp.dataset.stemme || ALF_STEMME };
    settStemme(innstillinger.stemme);
    persist();
    markerStemme();
    if (innstillinger.stemme === ALF_STEMME) void lastAlfStemme();
  });
  $("prov-stemme").addEventListener("click", () => {
    aktiverLyd();
    si("Hei, jeg er Alf. Vi skal rekke skolen.", true);
  });
  $("nullstill-rekord").addEventListener("click", () => {
    $("nullstill-sjekk").hidden = false;
  });
  $("nullstill-nei").addEventListener("click", () => {
    $("nullstill-sjekk").hidden = true;
  });
  $("nullstill-ja").addEventListener("click", () => {
    const lagret = nullstillRekorder(lesLagring());
    skrivLagring({ ...lagret, innstillinger });
    $("nullstill-sjekk").hidden = true;
    oppdaterMeny();
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

function fyllRekordTavle(tavle: { navn: string; verdi: number; melk: Melk }[]): void {
  const liste = $("rekord-tavle");
  liste.innerHTML = "";
  $("rekord-status").hidden = tavle.length > 0;
  for (const rad of tavle) {
    const li = document.createElement("li");
    li.textContent = `${rad.navn} · ${rad.verdi} poeng · ${MELK_NAVN[rad.melk]}`;
    liste.append(li);
  }
}

function markerSekk(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-sekk]").forEach((knapp) => {
    knapp.classList.toggle("valgt", knapp.dataset.sekk === innstillinger.sekk);
  });
}

function fyllStemmer(): void {
  const felt = $("stemme-valg");
  felt.innerHTML = "";
  const knapper: { id: string; tekst: string }[] = [
    { id: ALF_STEMME, tekst: "Alfs stemme (anbefalt)" },
    { id: AUTO_STEMME, tekst: "Telefonens stemme" },
  ];
  for (const stemme of norskeStemmer()) {
    knapper.push({ id: stemme.name, tekst: stemme.name });
  }
  for (const rad of knapper) {
    const knapp = document.createElement("button");
    knapp.type = "button";
    knapp.dataset.stemme = rad.id;
    knapp.textContent = rad.tekst;
    felt.append(knapp);
  }
  markerStemme();
}

function markerStemme(): void {
  const valgt = innstillinger.stemme || ALF_STEMME;
  document.querySelectorAll<HTMLButtonElement>("#stemme-valg [data-stemme]").forEach((knapp) => {
    const erValgt = knapp.dataset.stemme === valgt;
    knapp.classList.toggle("valgt", erValgt);
    knapp.setAttribute("aria-checked", String(erValgt));
    knapp.setAttribute("role", "radio");
  });
}

function markerNivaa(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-nivaa]").forEach((knapp) => {
    knapp.classList.toggle("valgt", knapp.dataset.nivaa === innstillinger.nivaa);
  });
}

async function startSpill(): Promise<void> {
  startLopenr += 1;
  const nr = startLopenr;
  tur = startTur(innstillinger);
  iDuell = false;
  duellFraSti = false;
  pausetSti = null;
  tegneForsok = 0;
  oppdaterHud();
  skjulSpillkort();
  visLekseStopp(1);
  visLekseZombie(false);
  $("hint-linje").textContent = "Skolen er der framme. Alf glemte lekser i går.";
  $("skjerm-spill").classList.add("paa-sti");
  vis("skjerm-spill");
  if (await spillSti(true)) {
    if (nr !== startLopenr) return;
    await startZombieDuell(true);
    return;
  }
  if (nr !== startLopenr) return;
  await visLekseIntro();
  if (nr !== startLopenr) return;
  await nesteOppgave();
}

async function nesteOppgave(): Promise<void> {
  if (!turKanFortsette(tur)) return;
  aktivOppgave = hentOppgave(tur);
  tegneForsok = 0;
  visOppgave(aktivOppgave, iDuell ? `Duell ${tur.duellRunde} av 3` : `Stopp ${tur.stopp} av 6`);
  startTimer();
  const tale = lesOppgave(aktivOppgave);
  window.setTimeout(() => {
    if (innstillinger.lydPa && aktivOppgave && lesOppgave(aktivOppgave) === tale) si(tale, true);
  }, 80);
}

function avbrytLekseIntro(): void {
  const ferdig = lekseIntroResolve;
  lekseIntroResolve = null;
  lekseIntroNed = false;
  $("lekse-intro").hidden = true;
  ferdig?.();
}

function bindLekseIntro(): void {
  const knapp = $("lekse-intro-videre");
  knapp.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    lekseIntroNed = lekseIntroTrykkGjelder(lekseIntroResolve != null);
  });
  knapp.addEventListener("pointerup", (e) => {
    e.preventDefault();
    if (!lekseIntroTrykkGjelder(lekseIntroNed) || !lekseIntroResolve) return;
    const ferdig = lekseIntroResolve;
    lekseIntroResolve = null;
    lekseIntroNed = false;
    $("lekse-intro").hidden = true;
    stoppTale();
    ferdig();
  });
}

async function visLekseIntro(): Promise<void> {
  avbrytLekseIntro();
  const intro = lekseIntro(sisteStiRapport);
  const kort = $("lekse-intro");
  $("oppgave-kort").hidden = true;
  $("melkebod").hidden = true;
  $("skole-ankomst").hidden = true;
  $("rekord-navn").hidden = true;
  $("rekord-anonym").hidden = true;
  $("skjerm-spill").classList.remove("tegn-modus", "paa-sti");
  kort.hidden = false;
  kort.classList.toggle("har-trafikk", intro.visTrafikk);
  kort.classList.toggle("har-baesj", intro.visBaesj);
  $("lekse-intro-tittel").textContent = intro.overskrift;
  $("lekse-intro-tekst").innerHTML = intro.avsnitt.map((linje) => `<p>${linje}</p>`).join("");
  const hund = $("lekse-intro-alf") as HTMLImageElement;
  hund.src = bildeUrl("alf.svg");
  hund.alt = "Alf";
  lekseIntroNed = false;
  if (innstillinger.lydPa) si(intro.tale, true);
  await new Promise<void>((resolve) => {
    lekseIntroResolve = resolve;
  });
}

function visOppgave(oppgave: Oppgave, overskrift: string): void {
  svarVakt.slipp();
  $("skjerm-spill").classList.remove("paa-sti");
  $("sti-spill").hidden = true;
  $("oppgave-kort").hidden = false;
  $("lekse-intro").hidden = true;
  $("skole-ankomst").hidden = true;
  $("rekord-navn").hidden = true;
  $("rekord-anonym").hidden = true;
  $("melkebod").hidden = true;
  $("skjerm-spill").classList.toggle("tegn-modus", oppgave.type === "tegning");
  $("oppgave-kicker").textContent = overskrift;
  $("oppgave-tekst").innerHTML = htmlMedSitertOrd(oppgave.prompt);
  $("hint-linje").textContent = "";
  $("bilde-felt").hidden = !oppgave.bilde;
  if (oppgave.bilde) $("bilde-felt").textContent = bildeEmoji(oppgave.bilde);
  $("hoer").textContent = kanSnakke() ? "Hør igjen" : "Vis lyden";
  const valg = $("valg");
  valg.innerHTML = "";
  const tegn = $("tegne-wrap") as HTMLElement;
  if (oppgave.type === "tegning") {
    tegn.hidden = false;
    valg.hidden = true;
    $("tegn-sjekk").hidden = false;
    $("tegn-knapper").hidden = false;
    const omriss = oppgave.omriss ?? "O";
    forberedTegning(omriss);
    requestAnimationFrame(() => {
      if (aktivOppgave?.type === "tegning") forberedTegning(aktivOppgave.omriss ?? omriss);
    });
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
      const trykk = (e: Event) => {
        e.preventDefault();
        void svar(tekst);
      };
      b.addEventListener("pointerdown", trykk);
      b.addEventListener("click", trykk);
      valg.append(b);
    }
  }
}

function bildeEmoji(id: string): string {
  const kart: Record<string, string> = {
    sol: "☀️",
    hus: "🏠",
    mus: "🐭",
    lam: "🐑",
    bil: "🚗",
    mat: "🍽️",
    hat: "🎩",
    is: "🍦",
    ape: "🐵",
    lys: "💡",
    bær: "🫐",
    ål: "🐍",
    tak: "🏠",
    bus: "🚌",
    pil: "🏹",
    dam: "💧",
    mor: "👩",
    båt: "⛵",
    nål: "🪡",
    gå: "🚶",
    rom: "🚪",
    pen: "🖊️",
    lim: "📎",
    kos: "🤗",
    løk: "🧅",
    kol: "⬛",
    år: "📅",
    te: "🍵",
    fe: "🧚",
    ben: "🦴",
    kom: "👋",
    mål: "🎯",
    rør: "🚰",
  };
  return kart[id] ?? "✨";
}

function startTimer(): void {
  stoppTimer();
  gjenstaende = TID;
  tegnUr();
  if (!document.hidden) fortsettTimer();
}

function fortsettTimer(): void {
  if (timerId || document.hidden || !turKanFortsette(tur) || !aktivOppgave || aktivSti) return;
  timerId = window.setInterval(() => {
    if (document.hidden) {
      pauseTimer();
      return;
    }
    gjenstaende -= 1;
    tegnUr();
    if (gjenstaende <= 0) void svar("", true);
  }, 1000);
}

function pauseTimer(): void {
  window.clearInterval(timerId);
  timerId = 0;
}

function stoppTimer(): void {
  pauseTimer();
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
  if (!turKanFortsette(tur) || !aktivOppgave) return;
  if (!svarVakt.godta()) return;
  document.querySelectorAll<HTMLButtonElement>(".valg-knapp").forEach((knapp) => {
    knapp.disabled = true;
  });
  stoppTimer();
  const { riktig, hint } = tidsutlop
    ? { riktig: false, hint: aktivOppgave.hint }
    : sjekkSvar(aktivOppgave, tekst);
  await etterSvar(riktig, hint, tidsutlop ? "Tiden er ute." : undefined);
}

async function etterSvar(riktig: boolean, hint: string, prefiks?: string): Promise<void> {
  if (!turKanFortsette(tur) || !aktivOppgave) return;
  const nr = startLopenr;
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
    if (nr !== startLopenr || !turKanFortsette(tur)) return;
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
    if (nr !== startLopenr || !turKanFortsette(tur)) return;
    if (duellFraSti) {
      duellFraSti = false;
      if (await fortsettSpillSti()) {
        await startZombieDuell(true);
        return;
      }
      if (!tur) return;
      visLekseStopp(tur.stopp);
      oppdaterHud();
      await visLekseIntro();
      if (nr !== startLopenr || !turKanFortsette(tur)) return;
      await nesteOppgave();
      return;
    }
    await videreEtterStopp();
    return;
  }

  tur = registrerOppgaveSvar(tur, riktig, aktivOppgave.belonning);
  oppdaterHud();
  await vent(1100);
  if (nr !== startLopenr || !turKanFortsette(tur)) return;
  if (harZombie(tur)) {
    await startZombieDuell();
    return;
  }
  await videreEtterStopp();
}

async function startZombieDuell(fraSti = false): Promise<void> {
  if (!turKanFortsette(tur)) return;
  iDuell = true;
  duellFraSti = fraSti;
  if (fraSti) {
    const detteStoppet = tur.stopp;
    tur = { ...tur, zombieStopp: tur.zombieStopp.filter((stopp) => stopp !== detteStoppet) };
  }
  tur = startDuell(tur);
  $("hint-linje").textContent = fraSti
    ? "Bokstavduell! Zombien vil ha steinene."
    : "En zombie vagger ut fra grøfta!";
  visLekseZombie(true);
  $("oppgave-kort").hidden = false;
  $("lekse-intro").hidden = true;
  await nesteOppgave();
}

async function videreEtterStopp(): Promise<void> {
  if (!turKanFortsette(tur)) return;
  tur = nesteStopp(tur);
  if (tur.ferdig) {
    await visMelkebod();
    return;
  }
  $("oppgave-kort").hidden = true;
  $("lekse-intro").hidden = true;
  $("skjerm-spill").classList.remove("tegn-modus");
  $("skjerm-spill").classList.remove("paa-sti");
  $("hint-linje").textContent = "Videre mot skolen! Se opp for trafikk og zombier.";
  const nr = startLopenr;
  if (await spillSti()) {
    if (nr !== startLopenr || !turKanFortsette(tur)) return;
    await startZombieDuell(true);
    return;
  }
  if (nr !== startLopenr || !turKanFortsette(tur)) return;
  visLekseStopp(tur.stopp);
  oppdaterHud();
  await visLekseIntro();
  if (nr !== startLopenr || !turKanFortsette(tur)) return;
  await nesteOppgave();
}

function skjulSpillkort(): void {
  $("oppgave-kort").hidden = true;
  $("lekse-intro").hidden = true;
  $("skole-ankomst").hidden = true;
  $("rekord-navn").hidden = true;
  $("rekord-anonym").hidden = true;
  $("melkebod").hidden = true;
}

function ventPaaKnapp(id: string): Promise<void> {
  return new Promise((resolve) => {
    const knapp = $(id);
    const ferdig = (e: Event) => {
      e.preventDefault();
      knapp.removeEventListener("pointerup", ferdig);
      resolve();
    };
    knapp.addEventListener("pointerup", ferdig);
  });
}

async function visSkoleAnkomst(): Promise<void> {
  skjulSpillkort();
  $("skole-ankomst").hidden = false;
  ($("ankomst-skole") as HTMLImageElement).src = bildeUrl("skole.svg");
  ($("ankomst-laerer") as HTMLImageElement).src = bildeUrl("laererinne.svg");
  ($("ankomst-alf") as HTMLImageElement).src = bildeUrl("alf.svg");
  if (innstillinger.lydPa) si("Alf er framme! Lærerinna står utenfor og vinker.", true);
  await ventPaaKnapp("ankomst-videre");
  stoppTale();
  $("skole-ankomst").hidden = true;
}

async function visRekordNavn(): Promise<string | null> {
  const felt = $("rekord-navn-felt") as HTMLInputElement;
  felt.value = "";
  while (true) {
    skjulSpillkort();
    $("rekord-navn").hidden = false;
    felt.focus();
    const valg = await new Promise<"lagre" | "avbryt">((resolve) => {
      const lagre = () => {
        rydd();
        resolve("lagre");
      };
      const avbryt = () => {
        rydd();
        resolve("avbryt");
      };
      const rydd = () => {
        $("rekord-lagre").removeEventListener("pointerup", lagre);
        $("rekord-avbryt").removeEventListener("pointerup", avbryt);
      };
      $("rekord-lagre").addEventListener("pointerup", lagre);
      $("rekord-avbryt").addEventListener("pointerup", avbryt);
    });
    if (valg === "avbryt") {
      $("rekord-navn").hidden = true;
      return null;
    }
    if (!trengerAnonymBekreftelse(felt.value)) {
      $("rekord-navn").hidden = true;
      return navnTilTavle(felt.value);
    }
    $("rekord-navn").hidden = true;
    $("rekord-anonym").hidden = false;
    const anonym = await new Promise<boolean>((resolve) => {
      const ja = () => {
        rydd();
        resolve(true);
      };
      const nei = () => {
        rydd();
        resolve(false);
      };
      const rydd = () => {
        $("rekord-anonym-ja").removeEventListener("pointerup", ja);
        $("rekord-anonym-nei").removeEventListener("pointerup", nei);
      };
      $("rekord-anonym-ja").addEventListener("pointerup", ja);
      $("rekord-anonym-nei").addEventListener("pointerup", nei);
    });
    $("rekord-anonym").hidden = true;
    if (anonym) return navnTilTavle("");
  }
}

async function visMelkebod(): Promise<void> {
  if (!tur) return;
  startLopenr += 1;
  stoppTimer();
  stoppTale();
  aktivOppgave = null;
  iDuell = false;
  $("skjerm-spill").classList.remove("tegn-modus", "paa-sti");
  $("valg").innerHTML = "";
  $("oppgave-tekst").textContent = "";
  $("hint-linje").textContent = "";
  await visSkoleAnkomst();
  const slutt = avsluttTur(tur);
  let lagret = oppdaterRekord(lesLagring(), slutt.verdi, slutt.melk);
  if (erBlantDeTi(lagret.tavle ?? [], slutt.verdi)) {
    const navn = await visRekordNavn();
    if (navn != null) {
      lagret = { ...lagret, tavle: settInnRekord(lagret.tavle ?? [], { navn, verdi: slutt.verdi, melk: slutt.melk }) };
    }
  }
  skrivLagring({ ...lagret, innstillinger });
  skjulSpillkort();
  $("melkebod").hidden = false;
  $("melk-tittel").textContent = MELK_NAVN[slutt.melk];
  $("melk-tekst").textContent = melkTekst(slutt.melk, slutt.verdi, slutt.lomme.krystaller, slutt.lomme.diamanter, slutt.skitten);
  $("melk-ikon").textContent = melkIkon(slutt.melk);
  feirLekse();
  if (innstillinger.lydPa) si(`Alf fikk ${MELK_NAVN[slutt.melk]}`, true);
}

function melkTekst(melk: Melk, v: number, k: number, d: number, skitten: boolean): string {
  const grunn = `Alf kom frem med ${k} krystaller og ${d} diamanter (${v} poeng). Han kjøpte ${MELK_NAVN[melk].toLowerCase()}!`;
  return skitten ? `${grunn} Men han må gå hjem og vaske seg. Ikke plukk hundebæsj.` : grunn;
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
  $("hud-sykkel").textContent = String(tur.sykler + (aktivSti?.sykler ?? 0));
  $("hud-bil").textContent = String(tur.biler + (aktivSti?.biler ?? 0));
  $("hud-baesj").textContent = String(tur.baesj + (aktivSti?.baesj ?? 0));
}

function forberedTegning(bokstav: string): void {
  const lerret = $("tegn") as HTMLCanvasElement;
  const ghost = $("tegn-ghost") as HTMLCanvasElement;
  const ctx = lerret.getContext("2d");
  const gctx = ghost.getContext("2d");
  if (!ctx || !gctx) return;
  const dpr = window.devicePixelRatio || 1;
  const wrap = $("tegne-wrap");
  const css = Math.max(110, Math.min(wrap.clientWidth || 160, wrap.clientHeight || 160, 200));
  for (const c of [lerret, ghost]) {
    c.width = Math.round(css * dpr);
    c.height = Math.round(css * dpr);
    c.style.width = "100%";
    c.style.height = "100%";
  }
  gctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  gctx.clearRect(0, 0, ghost.width, ghost.height);
  ctx.clearRect(0, 0, lerret.width, lerret.height);
  gctx.font = `${Math.floor(css * 0.7 * dpr)}px Georgia, serif`;
  gctx.textAlign = "center";
  gctx.textBaseline = "middle";
  gctx.lineWidth = 8 * dpr;
  gctx.strokeStyle = "rgba(244, 210, 122, 0.35)";
  gctx.strokeText(bokstav, ghost.width / 2, ghost.height / 2);
}

function bindTegning(): void {
  const lerret = $("tegn") as HTMLCanvasElement;
  const ctx = () => lerret.getContext("2d");
  const punkt = (e: PointerEvent) => {
    const r = lerret.getBoundingClientRect();
    return lerretPunkt(e.clientX, e.clientY, r, lerret.width, lerret.height);
  };
  lerret.addEventListener("pointerdown", (e) => {
    tegner = true;
    lerret.setPointerCapture(e.pointerId);
    const c = ctx();
    if (!c) return;
    const p = punkt(e);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineWidth = 14 * (window.devicePixelRatio || 1);
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, lerret.width, lerret.height);
  });
  $("tegn-sjekk").addEventListener("click", () => void sjekkTegning());
  $("hoer").addEventListener("click", () => {
    if (!aktivOppgave) return;
    if (kanSnakke() && innstillinger.lydPa) si(lesOppgave(aktivOppgave), true);
    else $("hint-linje").textContent = lesOppgave(aktivOppgave);
  });
  $("hjem-fra-spill").addEventListener("click", () => {
    startLopenr += 1;
    avbrytLekseIntro();
    stiPauset = false;
    stoppTimer();
    stoppTale();
    cancelAnimationFrame(stiRamme);
    aktivSti = null;
    pausetSti = null;
    duellFraSti = false;
    $("sti-start").hidden = true;
    $("sti-spill").hidden = true;
    skjulSpillkort();
    $("skjerm-spill").classList.remove("tegn-modus", "paa-sti");
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
  if (!svarVakt.godta()) return;
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
  $("lekse-skole").style.backgroundImage = `url(${import.meta.env.BASE_URL}skole.svg)`;
}

function visLekseZombie(vises: boolean): void {
  $("lekse-zombie").hidden = !vises;
}

function feirLekse(): void {
  const alf = $("lekse-alf");
  alf.classList.add("feirer");
  window.setTimeout(() => alf.classList.remove("feirer"), 700);
}

function bildeUrl(fil: string): string {
  return `${import.meta.env.BASE_URL}${fil}`;
}

function oppdaterStiTing(
  lag: HTMLElement,
  id: string,
  klasser: string,
  src: string,
  alt: string,
  left: number,
  top: number,
  skala: number,
  z: number,
  synlig: boolean,
  levende: Set<string>,
): void {
  levende.add(id);
  let el = document.getElementById(id) as HTMLImageElement | null;
  if (!el) {
    el = document.createElement("img");
    el.id = id;
    el.alt = alt;
    el.src = src;
    lag.append(el);
  }
  el.className = klasser;
  el.hidden = !synlig;
  el.style.left = `${left}%`;
  el.style.top = `${top}%`;
  el.style.transform = `translate(-50%, -92%) scale(${skala})`;
  el.style.zIndex = String(z);
}

function tegnVeiLerret(tilstand: StiTilstand): void {
  const canvas = $("sti-lerret") as HTMLCanvasElement;
  const panel = $("sti-spill");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = panel.clientWidth;
  const h = panel.clientHeight;
  if (w <= 0 || h <= 0) return;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const hor = veiPunkt(veiEndeZ(), tilstand.tid);
  const hy = (hor.cy / 100) * h;
  const himmel = ctx.createLinearGradient(0, 0, 0, Math.max(8, hy));
  himmel.addColorStop(0, "#7eb6d9");
  himmel.addColorStop(0.55, "#b9ddef");
  himmel.addColorStop(1, "#d7ead4");
  ctx.fillStyle = himmel;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#f8e7b0";
  ctx.beginPath();
  ctx.arc((hor.cx / 100) * w, Math.max(18, hy * 0.32), 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d6b38";
  ctx.fillRect(0, hy, w, Math.max(1, h - hy));
  const n = 58;
  const fase = veiAvstand(tilstand.tid);
  const ende = veiEndeZ();
  for (let i = 0; i < n; i++) {
    const z0 = ende + (i / n) * (1 - ende);
    const z1 = ende + ((i + 1) / n) * (1 - ende);
    const a = veiPunkt(z0, tilstand.tid);
    const b = veiPunkt(z1, tilstand.tid);
    const y0 = (a.cy / 100) * h;
    const y1 = (b.cy / 100) * h;
    if (y1 <= y0 + 0.2) continue;
    ctx.fillStyle = i % 2 ? "#3d6b38" : "#4a8f44";
    ctx.fillRect(0, y0, w, y1 - y0);
    const ax0 = ((a.cx - a.halv) / 100) * w;
    const ax1 = ((a.cx + a.halv) / 100) * w;
    const bx0 = ((b.cx - b.halv) / 100) * w;
    const bx1 = ((b.cx + b.halv) / 100) * w;
    ctx.fillStyle = i % 2 ? "#5c6168" : "#484c52";
    ctx.beginPath();
    ctx.moveTo(ax0, y0);
    ctx.lineTo(ax1, y0);
    ctx.lineTo(bx1, y1);
    ctx.lineTo(bx0, y1);
    ctx.closePath();
    ctx.fill();
    const stripe = Math.max(2, (a.halv * 0.07 / 100) * w);
    ctx.fillStyle = i % 2 ? "#c45c7a" : "#fff4dc";
    ctx.beginPath();
    ctx.moveTo(ax0, y0);
    ctx.lineTo(ax0 + stripe, y0);
    ctx.lineTo(bx0 + stripe, y1);
    ctx.lineTo(bx0, y1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ax1 - stripe, y0);
    ctx.lineTo(ax1, y0);
    ctx.lineTo(bx1, y1);
    ctx.lineTo(bx1 - stripe, y1);
    ctx.closePath();
    ctx.fill();
    if (Math.floor(fase * 7 + i * 0.65) % 2 === 0) {
      const midt = Math.max(1.2, (a.halv * 0.045 / 100) * w);
      ctx.fillStyle = "#f4d27a";
      ctx.fillRect((a.cx / 100) * w - midt / 2, y0, midt, y1 - y0);
    }
  }
}

function tegnSti(tilstand: StiTilstand): void {
  $("sti-ur").textContent = String(Math.ceil(tilstand.tid));
  tegnVeiLerret(tilstand);
  const alf = $("sti-alf");
  const alfP = prosjektPunkt(tilstand.x, 0.92, tilstand.tid);
  alf.style.left = `${alfP.left}%`;
  alf.style.top = `${alfP.top}%`;
  alf.dataset.sekk = innstillinger.sekk;
  $("sti-sekk").className = `sekk-${innstillinger.sekk}`;
  const bak = document.querySelector("#sti-alf .alf-pose.bak") as HTMLImageElement;
  const foran = document.querySelector("#sti-alf .alf-pose.foran") as HTMLImageElement;
  bak.src = bildeUrl("alf-bak.svg");
  foran.src = bildeUrl("alf.svg");
  const skole = $("sti-skole") as HTMLImageElement;
  const wrap = $("sti-skole-wrap");
  const skoleP = skolePunkt(tilstand.tid, tur?.stopp ?? 1);
  skole.src = bildeUrl("skole.svg");
  wrap.hidden = false;
  wrap.style.left = `${skoleP.left}%`;
  wrap.style.top = `${skoleP.top}%`;
  wrap.style.transform = `translate(-50%, -88%) scale(${skoleP.skala})`;
  const laerer = $("sti-laererinne") as HTMLImageElement;
  const fram = turFramgang(tilstand.tid, tur?.stopp ?? 1);
  laerer.src = bildeUrl("laererinne.svg");
  laerer.hidden = fram < 0.62;
  laerer.style.left = `${skoleP.left - Math.min(14, 6 + skoleP.skala * 4)}%`;
  laerer.style.top = `${skoleP.top + 1}%`;
  laerer.style.transform = `translate(-50%, -88%) scale(${Math.max(0.4, skoleP.skala * 0.42)})`;
  const lag = $("sti-lag");
  const levende = new Set<string>();
  for (const objekt of tilstand.dekor) {
    const p = prosjektDekor(objekt.side, objekt.dist, tilstand.tid);
    oppdaterStiTing(
      lag,
      `sti-dekor-${objekt.id}`,
      `sti-ting ${objekt.type}`,
      bildeUrl(`${objekt.type}.svg`),
      objekt.type,
      p.left,
      p.top,
      p.skala,
      2 + Math.round(zFraDist(objekt.dist, tilstand.tid) * 8),
      p.synlig,
      levende,
    );
  }
  for (const objekt of tilstand.objekter) {
    const p = prosjektDist(objekt.x, objekt.dist, tilstand.tid, false);
    const fil =
      objekt.type === "syklist" || objekt.type === "bil"
        ? trafikkBilde(objekt.type, objekt.retning ?? "mot")
        : objekt.type;
    oppdaterStiTing(
      lag,
      `sti-ting-${objekt.id}`,
      `sti-ting ${objekt.type}`,
      bildeUrl(`${fil}.svg`),
      objekt.type === "baesj" ? "hundebæsj" : objekt.type === "bil" ? "bil" : objekt.type,
      p.left,
      p.top,
      p.skala,
      3 + Math.round(zFraDist(objekt.dist, tilstand.tid) * 10),
      p.synlig,
      levende,
    );
  }
  for (const barn of [...lag.children]) {
    if (!levende.has(barn.id)) barn.remove();
  }
}

function visAlfGlad(): void {
  const alf = $("sti-alf");
  alf.classList.add("glad");
  window.setTimeout(() => alf.classList.remove("glad"), 700);
}

function visAlfTruffet(): void {
  const alf = $("sti-alf");
  const panel = $("sti-spill");
  const treff = $("sti-treff");
  const zombie = $("sti-treff-zombie") as HTMLImageElement;
  zombie.src = bildeUrl("zombie.svg");
  treff.hidden = false;
  alf.classList.add("truffet");
  panel.classList.add("humper");
  $("sti-hjelp").textContent = "Uff da! En klønete zombie dultet til Alf. Noen steiner ramler.";
  window.setTimeout(() => {
    alf.classList.remove("truffet");
    panel.classList.remove("humper");
    treff.hidden = true;
  }, 1200);
}

function visAlfSkitten(tekst?: string): void {
  const linje = tekst ?? "Ikke ta på hundebæsj!";
  $("sti-alf").classList.add("skitten");
  $("sti-hjelp").textContent = linje;
}

function visAlfTrafikk(hendelse: StiHendelse): void {
  const tekst = hendelse.tekst ?? "Pass deg for trafikken!";
  const alf = $("sti-alf");
  alf.classList.add("truffet");
  $("sti-spill").classList.add("humper");
  $("sti-hjelp").textContent = tekst;
  window.setTimeout(() => {
    alf.classList.remove("truffet");
    $("sti-spill").classList.remove("humper");
  }, 800);
}

async function visStartNedtelling(): Promise<boolean> {
  const lopenr = startLopenr;
  const overlay = $("sti-start");
  const tall = $("sti-start-tall");
  overlay.hidden = false;
  await ventRamme();
  if (aktivSti) tegnSti(aktivSti);
  for (const steg of startNedtelling()) {
    if (startLopenr !== lopenr) return false;
    tall.textContent = steg.tekst;
    tall.classList.toggle("ord", steg.tekst.length > 1);
    $("sti-start-under").textContent = steg.tekst === "Kom igjen!" ? "Alf går!" : "Alf er klar";
    if (innstillinger.lydPa) {
      if (steg.tekst === "Kom igjen!") spillStiLyd(true, "diamant");
      else spillKling(true, 480 + Number(steg.tekst) * 90);
    }
    await vent(steg.ms);
  }
  if (startLopenr !== lopenr) return false;
  overlay.hidden = true;
  return true;
}

async function fortsettSpillSti(): Promise<boolean> {
  const igjen = pausetSti ? fortsettEtterZombie(pausetSti) : null;
  pausetSti = null;
  if (!igjen || igjen.tid <= 0) return false;
  return spillSti(false, igjen);
}

async function spillSti(medStart = false, gjenopptatt?: StiTilstand): Promise<boolean> {
  const panel = $("sti-spill");
  $("skjerm-spill").classList.add("paa-sti");
  panel.hidden = false;
  $("oppgave-kort").hidden = true;
  $("lekse-intro").hidden = true;
  $("sti-alf").classList.remove("skitten", "truffet", "glad");
  $("sti-alf").classList.add("gaar");
  $("sti-spill").classList.remove("humper");
  $("sti-treff").hidden = true;
  if (!medStart) $("sti-start").hidden = true;
  $("sti-lag").innerHTML = "";
  aktivSti = gjenopptatt ?? startSti();
  let tilstand = aktivSti;
  tegnSti(tilstand);
  if (medStart && !gjenopptatt) {
    stiPauset = true;
    const ok = await visStartNedtelling();
    stiPauset = false;
    if (!ok || !aktivSti) return false;
    tilstand = aktivSti;
  }
  stoppTale();
  await new Promise<void>((resolve) => {
    let forrige = performance.now();
    const steg = (naa: number) => {
      if (document.hidden) {
        forrige = naa;
        stiRamme = requestAnimationFrame(steg);
        return;
      }
      const dt = Math.min(0.05, (naa - forrige) / 1000);
      forrige = naa;
      const kjor = aktivSti ?? tilstand;
      const resultat = stiTick(kjor, dt);
      tilstand = resultat.tilstand;
      aktivSti = tilstand;
      for (const hendelse of resultat.hendelser) {
        spillStiLyd(innstillinger.lydPa, stiLydForHendelse(hendelse.type, hendelse.objekt));
        if (hendelse.type === "plukk") {
          if (tur && (hendelse.objekt === "krystall" || hendelse.objekt === "diamant")) {
            tur = { ...tur, lomme: giBelonning(tur.lomme, hendelse.objekt) };
          }
          visAlfGlad();
          oppdaterHud();
        } else if (hendelse.type === "baesj") {
          visAlfSkitten(hendelse.tekst);
          if (tur) tur = { ...tur, skitten: true };
          oppdaterHud();
        } else if (hendelse.type === "trafikk") {
          visAlfTrafikk(hendelse);
          oppdaterHud();
        } else {
          visAlfTruffet();
        }
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
  sisteStiRapport = {
    sykler: tilstand.sykler ?? 0,
    biler: tilstand.biler ?? 0,
    baesj: tilstand.baesj ?? 0,
  };
  if (tur) tur = leggTilKrasj(tur, sisteStiRapport);
  const duell = tilstand.zombieTreff > 0;
  if (duell) {
    pausetSti = { ...tilstand, sykler: 0, biler: 0, baesj: 0 };
    await vent(900);
  }
  $("sti-alf").classList.remove("gaar");
  aktivSti = null;
  if (tur) oppdaterHud();
  panel.hidden = true;
  $("skjerm-spill").classList.remove("paa-sti");
  return duell;
}

function settStiX(x: number): void {
  if (!aktivSti) return;
  aktivSti = settX(aktivSti, x);
  tegnSti(aktivSti);
}

function styrAlf(klientX: number): void {
  const panel = $("sti-spill");
  const ramme = panel.getBoundingClientRect();
  if (ramme.width <= 0) return;
  settStiX(xFraSkjerm((klientX - ramme.left) / ramme.width, aktivSti?.tid));
}

function bindSti(): void {
  const panel = $("sti-spill");
  panel.addEventListener("pointerdown", (e) => {
    if (!aktivSti || stiPauset || panel.hidden) return;
    styrAlf(e.clientX);
  });
  panel.addEventListener("pointermove", (e) => {
    if (!aktivSti || stiPauset || panel.hidden) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    styrAlf(e.clientX);
  });

  window.addEventListener("keydown", (e) => {
    if (!aktivSti || stiPauset) return;
    if (e.key === "ArrowLeft") {
      aktivSti = flyttX(aktivSti, -0.08);
      tegnSti(aktivSti);
    }
    if (e.key === "ArrowRight") {
      aktivSti = flyttX(aktivSti, 0.08);
      tegnSti(aktivSti);
    }
  });
}

function vent(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ventRamme(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function visInstallasjon(): void {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  $("install-hint").hidden = standalone;
}

registerSW({ immediate: true });

bindMeny();
bindTegning();
bindLekseIntro();
bindSti();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseTimer();
    return;
  }
  fortsettTimer();
});
oppdaterMeny();
vis("skjerm-meny");
visInstallasjon();
function visStemmeStatus(status: AlfStemmeStatus): void {
  const tekst =
    status.tilstand === "laster"
      ? `Alf gjør klar stemmen…${status.prosent != null ? ` ${status.prosent} %` : ""}`
      : status.tilstand === "feil"
        ? "Alf bruker telefonens stemme i stedet."
        : "";
  for (const id of ["stemme-status", "meny-stemme-status"]) {
    const el = $(id);
    el.textContent = tekst;
    el.hidden = !tekst;
  }
}

settStemme(innstillinger.stemme);
onAlfStemmeStatus(visStemmeStatus);
void lastAlfStemme();
if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener("voiceschanged", () => {
    speechSynthesis.getVoices();
    if (!$("skjerm-innstillinger").hidden) fyllStemmer();
  });
}
