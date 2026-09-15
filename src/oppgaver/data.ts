import type { Nivaa, Oppgave, OppgaveType } from "../typer";
import { siterOrd } from "./sitat";

export const LYDRETTE_ORD_LISTE = [
  "is",
  "se",
  "le",
  "te",
  "fe",
  "de",
  "bi",
  "si",
  "ni",
  "vi",
  "du",
  "ro",
  "to",
  "gå",
  "så",
  "må",
  "år",
  "sol",
  "ros",
  "los",
  "mos",
  "rot",
  "mot",
  "sot",
  "kol",
  "mus",
  "hus",
  "lus",
  "sus",
  "bus",
  "lam",
  "ram",
  "dam",
  "mat",
  "hat",
  "tas",
  "mas",
  "ras",
  "bak",
  "tak",
  "sak",
  "rak",
  "dal",
  "sal",
  "mal",
  "sil",
  "mil",
  "bil",
  "pil",
  "ris",
  "vis",
  "din",
  "min",
  "sin",
  "lin",
  "fin",
  "lys",
  "nys",
  "bær",
  "vær",
  "nær",
  "lær",
  "løs",
  "søl",
  "løk",
  "rør",
  "ål",
  "mål",
  "sår",
  "nål",
  "båt",
  "ape",
  "lue",
  "mor",
  "bor",
  "lim",
  "rim",
  "rom",
  "som",
  "tom",
  "kom",
  "ben",
  "pen",
  "ren",
  "sen",
  "kos",
  "les",
  "tap",
  "skole",
] as const;

type NivaaUtenBlandet = Exclude<Nivaa, "blandet">;

function o(
  del: {
    type: OppgaveType;
    nivaa: NivaaUtenBlandet;
    prompt: string;
    tale: string;
    valg: string[];
    fasit: string;
    hint: string;
    belonning: "krystall" | "diamant";
    bilde?: string;
    omriss?: string;
  },
  id: string,
): Oppgave {
  return { ...del, id };
}

function roter<T>(liste: T[], nøkkel: string): T[] {
  if (liste.length === 0) return liste;
  const k = nøkkel.split("").reduce((sum, t) => sum + t.charCodeAt(0), 0) % liste.length;
  return [...liste.slice(k), ...liste.slice(0, k)];
}

function valgMed(fasit: string, andre: string[], nøkkel: string): string[] {
  const unike = [...new Set(andre.filter((x) => x.toLowerCase() !== fasit.toLowerCase()))];
  return roter([fasit, ...unike.slice(0, 3)], nøkkel);
}

function mal<T>(liste: readonly T[], nøkkel: string): T {
  const k = nøkkel.split("").reduce((sum, t) => sum + t.charCodeAt(0), 0);
  return liste[k % liste.length] as T;
}

function lydAv(bokstav: string): string {
  if (bokstav === "æ") return "æææ";
  if (bokstav === "ø") return "øøø";
  if (bokstav === "å") return "ååå";
  return `${bokstav}${bokstav}${bokstav}`;
}

function hale(ord: string): string {
  return ord.length <= 2 ? ord.slice(-1) : ord.slice(-2);
}

const BOKSTAVER = [
  { stor: "A", liten: "a", lyd: "aaa", hint: "Ape begynner på aaa." },
  { stor: "B", liten: "b", lyd: "bbb", hint: "Bil begynner på bbb." },
  { stor: "D", liten: "d", lyd: "ddd", hint: "Dam begynner på ddd." },
  { stor: "E", liten: "e", lyd: "eee", hint: "Se slutter på eee." },
  { stor: "F", liten: "f", lyd: "fff", hint: "Fin begynner på fff." },
  { stor: "G", liten: "g", lyd: "ggg", hint: "Gå begynner på ggg." },
  { stor: "H", liten: "h", lyd: "hhh", hint: "Hus begynner på hhh." },
  { stor: "I", liten: "i", lyd: "iii", hint: "Is begynner på iii." },
  { stor: "J", liten: "j", lyd: "jjj", hint: "Ja begynner på jjj." },
  { stor: "K", liten: "k", lyd: "kkk", hint: "Kos begynner på kkk." },
  { stor: "L", liten: "l", lyd: "lll", hint: "Lam begynner på lll." },
  { stor: "M", liten: "m", lyd: "mmm", hint: "Mus begynner på mmm." },
  { stor: "N", liten: "n", lyd: "nnn", hint: "Nær begynner på nnn." },
  { stor: "O", liten: "o", lyd: "ooo", hint: "Sol har ooo i midten." },
  { stor: "P", liten: "p", lyd: "ppp", hint: "Pil begynner på ppp." },
  { stor: "R", liten: "r", lyd: "rrr", hint: "Ram begynner på rrr." },
  { stor: "S", liten: "s", lyd: "sss", hint: "Sol begynner på sss." },
  { stor: "T", liten: "t", lyd: "ttt", hint: "Tak begynner på ttt." },
  { stor: "U", liten: "u", lyd: "uuu", hint: "Hus har uuu i midten." },
  { stor: "V", liten: "v", lyd: "vvv", hint: "Vi begynner på vvv." },
  { stor: "Y", liten: "y", lyd: "yyy", hint: "Lys begynner på yyy." },
  { stor: "Æ", liten: "æ", lyd: "æææ", hint: "Bær har æææ i midten." },
  { stor: "Ø", liten: "ø", lyd: "øøø", hint: "Løk har øøø i midten." },
  { stor: "Å", liten: "å", lyd: "ååå", hint: "Ål begynner på ååå." },
] as const;

const BILDE_ORD: Record<string, string> = {
  sol: "sol",
  hus: "hus",
  mus: "mus",
  lam: "lam",
  bil: "bil",
  mat: "mat",
  hat: "hat",
  is: "is",
  ape: "ape",
  lys: "lys",
  bær: "bær",
  ål: "ål",
  tak: "tak",
  bus: "bus",
  pil: "pil",
  dam: "dam",
  mor: "mor",
  båt: "båt",
  nål: "nål",
  gå: "gå",
  rom: "rom",
  pen: "pen",
  lim: "lim",
  kos: "kos",
  løk: "løk",
  kol: "kol",
  år: "år",
  te: "te",
  fe: "fe",
  ben: "ben",
  kom: "kom",
  mål: "mål",
  rør: "rør",
};

const KORTE_ORD = LYDRETTE_ORD_LISTE.filter((ord) => ord.length <= 3);
const TRE_BOKSTAVER = LYDRETTE_ORD_LISTE.filter((ord) => ord.length === 3);

const FORSTE_ORD = KORTE_ORD.map((ord) => ({ ord, bilde: BILDE_ORD[ord] }));

const TEGN_HINT: Record<string, string> = {
  A: "A er som et telt med en strek.",
  B: "B har to mager.",
  C: "C er en bue som en måne.",
  D: "D har en stor mage.",
  E: "E har tre armer til siden.",
  F: "F har to armer til siden.",
  G: "G er C med en hylle.",
  H: "H er to streker med en bro.",
  I: "I er en rett strek.",
  J: "J er en strek med en krok nede.",
  K: "K har to bein til siden.",
  L: "L er en strek ned og en strek til siden.",
  M: "M har to topper.",
  N: "N har en skrå strek i midten.",
  O: "O er en rund ring.",
  P: "P har en mage øverst.",
  R: "R er P med et bein.",
  S: "S svinger som en slange.",
  T: "T er en strek ned med hatt.",
  U: "U er som en kopp.",
  V: "V er to streker som møtes nede.",
  Y: "Y er V med en strek ned.",
  Æ: "Æ er A og E i ett.",
  Ø: "Ø er O med en strek gjennom.",
  Å: "Å er A med en ring over.",
};

function bokstavlyder(): Oppgave[] {
  const alle = BOKSTAVER.map((b) => b.stor);
  const lyder = BOKSTAVER.map((b) =>
    o(
      {
        type: "bokstavlyd",
        nivaa: "forste",
        prompt: mal(
          [
            `Hvilken bokstav sier ${b.lyd}?`,
            `Hør ${b.lyd}. Hvilken bokstav er det?`,
            `Hvilken bokstav lager lyden ${b.lyd}?`,
          ],
          b.liten,
        ),
        tale: b.liten,
        valg: valgMed(b.stor, alle, `lyd-${b.liten}`),
        fasit: b.stor,
        hint: b.hint,
        belonning: "krystall",
      },
      `f-lyd-${b.liten}`,
    ),
  );
  const sier = BOKSTAVER.map((b) =>
    o(
      {
        type: "bokstavlyd",
        nivaa: "forste",
        prompt: mal(
          [`Hva sier bokstaven ${b.stor}?`, `Hvilken lyd hører du i ${b.stor}?`, `Bokstaven ${b.stor} sier …?`],
          `sier-${b.liten}`,
        ),
        tale: `bokstaven ${b.liten}`,
        valg: valgMed(b.lyd, BOKSTAVER.map((x) => x.lyd), `sier-${b.liten}`),
        fasit: b.lyd,
        hint: b.hint,
        belonning: "krystall",
      },
      `f-sier-${b.liten}`,
    ),
  );
  return [...lyder, ...sier];
}

function forstelyder(): Oppgave[] {
  const bokstaver = BOKSTAVER.map((b) => b.stor);
  return FORSTE_ORD.flatMap((rad, i) => {
    const stor = rad.ord[0]?.toUpperCase() ?? "";
    const sluttBokstav = rad.ord.at(-1)?.toUpperCase() ?? "";
    const start = o(
      {
        type: "forstelyd",
        nivaa: "forste",
        prompt: mal(
          [
            `Hva begynner ordet ${siterOrd(rad.ord)} med?`,
            `Hvilken bokstav hører du først i ${siterOrd(rad.ord)}?`,
            `Hvilken lyd starter ordet ${siterOrd(rad.ord)} med?`,
            `Første bokstav i ${siterOrd(rad.ord)}?`,
          ],
          `forst-${rad.ord}`,
        ),
        tale: rad.ord,
        valg: valgMed(stor, bokstaver, `forst-${rad.ord}`),
        fasit: stor,
        hint: `${rad.ord[0]?.toUpperCase()}${rad.ord.slice(1)} begynner på ${stor.toLowerCase()}.`,
        belonning: "krystall",
        bilde: rad.bilde,
      },
      `f-forst-${rad.ord}`,
    );
    const slutt = o(
      {
        type: "forstelyd",
        nivaa: i % 2 === 0 ? "forste" : "andre",
        prompt: mal(
          [
            `Hvilken bokstav slutter ordet ${siterOrd(rad.ord)} på?`,
            `Hvilken lyd hører du sist i ${siterOrd(rad.ord)}?`,
            `Siste bokstav i ${siterOrd(rad.ord)}?`,
            `${siterOrd(rad.ord)} ender på …?`,
          ],
          `sist-${rad.ord}`,
        ),
        tale: rad.ord,
        valg: valgMed(sluttBokstav, bokstaver, `sist-${rad.ord}`),
        fasit: sluttBokstav,
        hint: `${rad.ord} slutter på ${sluttBokstav.toLowerCase()}.`,
        belonning: "krystall",
        bilde: rad.bilde,
      },
      `f-sist-${rad.ord}`,
    );
    return [start, slutt];
  });
}

function midtlyder(): Oppgave[] {
  const vokaler = [...new Set(TRE_BOKSTAVER.map((ord) => (ord[1] ?? "").toUpperCase()))];
  return TRE_BOKSTAVER.map((ord) => {
    const midt = (ord[1] ?? "").toUpperCase();
    return o(
      {
        type: "forstelyd",
        nivaa: "andre",
        prompt: mal(
          [
            `Hvilken bokstav hører du midt i ${siterOrd(ord)}?`,
            `Hvilken lyd er i midten av ${siterOrd(ord)}?`,
            `${siterOrd(ord)}: bokstaven i midten?`,
          ],
          `midt-${ord}`,
        ),
        tale: ord,
        valg: valgMed(midt, vokaler, `midt-${ord}`),
        fasit: midt,
        hint: `${ord} har ${midt.toLowerCase()} i midten.`,
        belonning: "krystall",
        bilde: BILDE_ORD[ord],
      },
      `a-midt-${ord}`,
    );
  });
}

function storLiten(): Oppgave[] {
  const smaa = BOKSTAVER.map((b) => b.liten);
  const store = BOKSTAVER.map((b) => b.stor);
  return BOKSTAVER.flatMap((b) => [
    o(
      {
        type: "storLiten",
        nivaa: "forste",
        prompt: mal(
          [
            `Finn den lille bokstaven til ${b.stor}`,
            `Stor ${b.stor} blir liten …?`,
            `Hvilken liten bokstav hører til ${b.stor}?`,
          ],
          `liten-${b.liten}`,
        ),
        tale: `stor ${b.liten}, liten ${b.liten}`,
        valg: valgMed(b.liten, smaa, `liten-${b.liten}`),
        fasit: b.liten,
        hint: `Stor ${b.stor} hører sammen med liten ${b.liten}.`,
        belonning: "krystall",
      },
      `f-stor-${b.liten}`,
    ),
    o(
      {
        type: "storLiten",
        nivaa: "forste",
        prompt: mal(
          [
            `Finn den store bokstaven til ${b.liten}`,
            `Liten ${b.liten} blir stor …?`,
            `Hvilken stor bokstav hører til ${b.liten}?`,
          ],
          `stor-${b.liten}`,
        ),
        tale: `liten ${b.liten}, stor ${b.liten}`,
        valg: valgMed(b.stor, store, `stor-${b.liten}`),
        fasit: b.stor,
        hint: `Liten ${b.liten} hører sammen med stor ${b.stor}.`,
        belonning: "krystall",
      },
      `f-storopp-${b.liten}`,
    ),
  ]);
}

function tegninger(): Oppgave[] {
  return Object.entries(TEGN_HINT).map(([bokstav, hint]) =>
    o(
      {
        type: "tegning",
        nivaa: "forste",
        prompt: mal(
          [
            `Tegn bokstaven ${bokstav} oppå spøkelset`,
            `Kan du tegne ${bokstav}? Følg spøkelset.`,
            `Skriv ${bokstav} med fingeren.`,
          ],
          `tegn-${bokstav}`,
        ),
        tale: `${bokstav.toLowerCase()}. Tegn ${bokstav.toLowerCase()}.`,
        valg: [],
        fasit: bokstav,
        hint,
        belonning: "krystall",
        omriss: bokstav,
      },
      `f-tegn-${bokstav.toLowerCase()}`,
    ),
  );
}

function trekkSammen(): Oppgave[] {
  return KORTE_ORD.map((ord) => {
    const lyder = [...ord].map((b) => lydAv(b)).join(" – ");
    const tale = [...ord].join(". ");
    return o(
      {
        type: "trekkSammen",
        nivaa: "andre",
        prompt: mal(
          [`Hva blir ${lyder}?`, `Trekk sammen: ${lyder}`, `Hvilket ord blir det av ${lyder}?`],
          `trekk-${ord}`,
        ),
        tale: `${tale}.`,
        valg: valgMed(ord, KORTE_ORD, `trekk-${ord}`),
        fasit: ord,
        hint: `${lyder.replaceAll(" – ", "-")} blir ${ord}.`,
        belonning: "krystall",
      },
      `a-trekk-${ord}`,
    );
  });
}

function rim(): Oppgave[] {
  const grupper = new Map<string, string[]>();
  for (const ord of KORTE_ORD) {
    const nøkkel = hale(ord);
    const liste = grupper.get(nøkkel) ?? [];
    liste.push(ord);
    grupper.set(nøkkel, liste);
  }
  const oppgaver: Oppgave[] = [];
  for (const [slutt, liste] of grupper) {
    if (liste.length < 2) continue;
    for (const [i, ord] of liste.entries()) {
      const fasit = liste[(i + 1) % liste.length] ?? liste[0]!;
      const andre = KORTE_ORD.filter((x) => hale(x) !== slutt);
      oppgaver.push(
        o(
          {
            type: "rim",
            nivaa: "andre",
            prompt: mal(
              [`Hva rimer på ${siterOrd(ord)}?`, `Hvilket ord rimer med ${siterOrd(ord)}?`, `Finn et rim til ${siterOrd(ord)}.`],
              `rim-${ord}`,
            ),
            tale: ord,
            valg: valgMed(fasit, andre, `rim-${ord}`),
            fasit,
            hint: `${ord} og ${fasit} ender likt.`,
            belonning: "diamant",
          },
          `a-rim-${ord}`,
        ),
      );
    }
    if (liste.length >= 3) {
      const feil = KORTE_ORD.find((x) => hale(x) !== slutt) ?? "sol";
      const valg = valgMed(feil, liste, `rimikke-${slutt}`);
      const vis = liste.slice(0, 3).join(", ");
      oppgaver.push(
        o(
          {
            type: "rim",
            nivaa: "utfordrende",
            prompt: `Hvilket ord rimer ikke med ${liste.slice(0, 3).map(siterOrd).join(", ")}?`,
            tale: `${vis}. Hvilket rimer ikke?`,
            valg,
            fasit: feil,
            hint: `${feil} ender ikke likt som ${liste[0]}.`,
            belonning: "diamant",
          },
          `u-rimikke-${slutt}`,
        ),
      );
    }
  }
  return oppgaver;
}

function stavelser(): Oppgave[] {
  const rader: { ord: string; tale: string; klapp: string; hint: string; nivaa: NivaaUtenBlandet }[] = [
    { ord: "Alf", tale: "Alf", klapp: "1", hint: "Alf er ett klapp.", nivaa: "forste" },
    { ord: "se", tale: "se", klapp: "1", hint: "Se er ett klapp.", nivaa: "forste" },
    { ord: "is", tale: "is", klapp: "1", hint: "Is er ett klapp.", nivaa: "forste" },
    { ord: "gå", tale: "gå", klapp: "1", hint: "Gå er ett klapp.", nivaa: "forste" },
    { ord: "sol", tale: "sol", klapp: "1", hint: "Sol er ett klapp.", nivaa: "andre" },
    { ord: "mus", tale: "mus", klapp: "1", hint: "Mus er ett klapp.", nivaa: "andre" },
    { ord: "hus", tale: "hus", klapp: "1", hint: "Hus er ett klapp.", nivaa: "andre" },
    { ord: "lam", tale: "lam", klapp: "1", hint: "Lam er ett klapp.", nivaa: "andre" },
    { ord: "mat", tale: "mat", klapp: "1", hint: "Mat er ett klapp.", nivaa: "andre" },
    { ord: "bil", tale: "bil", klapp: "1", hint: "Bil er ett klapp.", nivaa: "andre" },
    { ord: "lys", tale: "lys", klapp: "1", hint: "Lys er ett klapp.", nivaa: "andre" },
    { ord: "båt", tale: "båt", klapp: "1", hint: "Båt er ett klapp.", nivaa: "andre" },
    { ord: "løk", tale: "løk", klapp: "1", hint: "Løk er ett klapp.", nivaa: "andre" },
    { ord: "ape", tale: "a-pe", klapp: "2", hint: "A – pe. To klapp.", nivaa: "andre" },
    { ord: "lue", tale: "lu-e", klapp: "2", hint: "Lu – e. To klapp.", nivaa: "andre" },
    { ord: "skole", tale: "sko-le", klapp: "2", hint: "Sko – le. To klapp.", nivaa: "andre" },
    { ord: "mamma", tale: "mam-ma", klapp: "2", hint: "Mam – ma. To klapp.", nivaa: "andre" },
    { ord: "pappa", tale: "pap-pa", klapp: "2", hint: "Pap – pa. To klapp.", nivaa: "andre" },
    { ord: "nisse", tale: "nis-se", klapp: "2", hint: "Nis – se. To klapp.", nivaa: "andre" },
    { ord: "kake", tale: "ka-ke", klapp: "2", hint: "Ka – ke. To klapp.", nivaa: "andre" },
    { ord: "nese", tale: "ne-se", klapp: "2", hint: "Ne – se. To klapp.", nivaa: "andre" },
    { ord: "hule", tale: "hu-le", klapp: "2", hint: "Hu – le. To klapp.", nivaa: "andre" },
    { ord: "rose", tale: "ro-se", klapp: "2", hint: "Ro – se. To klapp.", nivaa: "andre" },
    { ord: "kanin", tale: "ka-nin", klapp: "2", hint: "Ka – nin. To klapp.", nivaa: "andre" },
    { ord: "tiger", tale: "ti-ger", klapp: "2", hint: "Ti – ger. To klapp.", nivaa: "utfordrende" },
    { ord: "eple", tale: "ep-le", klapp: "2", hint: "Ep – le. To klapp.", nivaa: "utfordrende" },
    { ord: "potet", tale: "po-tet", klapp: "2", hint: "Po – tet. To klapp.", nivaa: "utfordrende" },
    { ord: "zombie", tale: "zom-bie", klapp: "2", hint: "Zom – bie. To klapp.", nivaa: "utfordrende" },
    { ord: "banana", tale: "ba-na-na", klapp: "3", hint: "Ba – na – na. Tre klapp.", nivaa: "utfordrende" },
    { ord: "elefant", tale: "e-le-fant", klapp: "3", hint: "E – le – fant. Tre klapp.", nivaa: "utfordrende" },
    { ord: "diamant", tale: "di-a-mant", klapp: "3", hint: "Di – a – mant. Tre klapp.", nivaa: "utfordrende" },
    { ord: "skolemelk", tale: "sko-le-melk", klapp: "3", hint: "Sko – le – melk. Tre klapp.", nivaa: "utfordrende" },
    { ord: "sjokolade", tale: "sjo-ko-la-de", klapp: "4", hint: "Sjo – ko – la – de. Fire klapp.", nivaa: "utfordrende" },
  ];
  return rader.map((rad) =>
    o(
      {
        type: "stavelser",
        nivaa: rad.nivaa,
        prompt: mal(
          [
            `Hvor mange klapp har ordet ${siterOrd(rad.ord)}?`,
            `Klapp ordet ${siterOrd(rad.ord)}. Hvor mange ganger?`,
            `Hvor mange stavelser har ${siterOrd(rad.ord)}?`,
          ],
          rad.ord,
        ),
        tale: rad.tale,
        valg: roter(["1", "2", "3", "4"], rad.ord),
        fasit: rad.klapp,
        hint: rad.hint,
        belonning: "krystall",
      },
      `${rad.nivaa === "forste" ? "f" : rad.nivaa === "andre" ? "a" : "u"}-stav-${rad.ord.toLowerCase()}`,
    ),
  );
}

function byggOrd(): Oppgave[] {
  return KORTE_ORD.map((ord) => {
    const bokstaver = [...ord].map((b) => b.toUpperCase()).join(" ");
    return o(
      {
        type: "byggOrd",
        nivaa: "andre",
        prompt: mal(
          [
            `Sett bokstavene i rett rekkefølge: ${bokstaver}`,
            `Hvilket ord blir det av ${bokstaver}?`,
            `Lag ordet av ${bokstaver}`,
          ],
          `bygg-${ord}`,
        ),
        tale: `${[...ord].join(". ")}. Hvilket ord?`,
        valg: valgMed(ord, KORTE_ORD, `bygg-${ord}`),
        fasit: ord,
        hint: `Ordet blir ${ord}.`,
        belonning: "diamant",
      },
      `a-bygg-${ord}`,
    );
  });
}

function finnOrd(): Oppgave[] {
  const startGrupper = new Map<string, string[]>();
  const sluttGrupper = new Map<string, string[]>();
  for (const ord of KORTE_ORD) {
    const start = ord[0] ?? "";
    const slutt = ord.at(-1) ?? "";
    startGrupper.set(start, [...(startGrupper.get(start) ?? []), ord]);
    sluttGrupper.set(slutt, [...(sluttGrupper.get(slutt) ?? []), ord]);
  }
  const startOppgaver = [...startGrupper.entries()].flatMap(([bokstav, treff]) => {
    const fasit = treff[0]!;
    const andre = KORTE_ORD.filter((x) => !x.startsWith(bokstav));
    const stor = bokstav.toUpperCase();
    return [
      o(
        {
          type: "byggOrd",
          nivaa: "forste",
          prompt: mal(
            [`Hvilket ord begynner med bokstaven ${siterOrd(stor)}?`, `Hvilket ord starter med bokstaven ${siterOrd(bokstav)}?`, `Finn ordet som begynner med bokstaven ${siterOrd(stor)}.`],
            `finnstart-${bokstav}`,
          ),
          tale: `hvilket ord begynner med bokstaven ${bokstav}`,
          valg: valgMed(fasit, andre, `finnstart-${bokstav}`),
          fasit,
          hint: `${fasit} begynner på ${bokstav}.`,
          belonning: "krystall",
          bilde: BILDE_ORD[fasit],
        },
        `f-finnstart-${bokstav}`,
      ),
    ];
  });
  const sluttOppgaver = [...sluttGrupper.entries()].map(([bokstav, treff]) => {
    const fasit = treff[0]!;
    const andre = KORTE_ORD.filter((x) => x.at(-1) !== bokstav);
    return o(
      {
        type: "byggOrd",
        nivaa: "andre",
        prompt: mal(
          [`Hvilket ord slutter med bokstaven ${siterOrd(bokstav)}?`, `Finn ordet som ender med bokstaven ${siterOrd(bokstav)}.`, `Hvilket ord har ${siterOrd(bokstav)} til slutt?`],
          `finnslutt-${bokstav}`,
        ),
        tale: `hvilket ord slutter med bokstaven ${bokstav}`,
        valg: valgMed(fasit, andre, `finnslutt-${bokstav}`),
        fasit,
        hint: `${fasit} slutter på ${bokstav}.`,
        belonning: "krystall",
      },
      `a-finnslutt-${bokstav}`,
    );
  });
  return [...startOppgaver, ...sluttOppgaver];
}

function byttLyd(): Oppgave[] {
  const par: { fra: string; gammel: string; ny: string; til: string }[] = [];
  for (const a of TRE_BOKSTAVER) {
    for (const b of TRE_BOKSTAVER) {
      if (a >= b || a.length !== b.length) continue;
      const skiller: number[] = [];
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) skiller.push(i);
      }
      if (skiller.length !== 1) continue;
      const i = skiller[0]!;
      par.push({ fra: a, gammel: a[i]!, ny: b[i]!, til: b });
      par.push({ fra: b, gammel: b[i]!, ny: a[i]!, til: a });
    }
  }
  return par.map((rad) =>
    o(
      {
        type: "byttLyd",
        nivaa: "utfordrende",
        prompt: mal(
          [
            `Bytt ${rad.gammel} i ${siterOrd(rad.fra)} med ${rad.ny}. Hva blir det?`,
            `Bytt ut ${rad.gammel} med ${rad.ny} i ordet ${siterOrd(rad.fra)}.`,
            `${siterOrd(rad.fra)}: bytt ${rad.gammel} til ${rad.ny}. Nytt ord?`,
          ],
          `bytt-${rad.fra}-${rad.ny}-${rad.til}`,
        ),
        tale: `${rad.fra}. Bytt ${rad.gammel} med ${rad.ny}.`,
        valg: valgMed(rad.til, TRE_BOKSTAVER, `bytt-${rad.fra}-${rad.ny}-${rad.til}`),
        fasit: rad.til,
        hint: `${rad.fra} blir ${rad.til}.`,
        belonning: "diamant",
      },
      `u-bytt-${rad.fra}-${rad.ny}-${rad.til}`,
    ),
  );
}

function manglende(): Oppgave[] {
  const bokstav = TRE_BOKSTAVER.flatMap((ord) => {
    const tegn = [...ord];
    return tegn.map((bok, i) => {
      const vis = tegn.map((t, j) => (j === i ? "_" : t)).join("");
      const andre = BOKSTAVER.map((b) => b.liten).filter((x) => x !== bok);
      return o(
        {
          type: "manglende",
          nivaa: "utfordrende",
          prompt: mal(
            [
              `${siterOrd(ord)}: ${vis} – hvilken bokstav mangler?`,
              `Hør ${siterOrd(ord)}. Fyll ut ${vis}.`,
              `Hvilken bokstav skal stå i ${vis} for å lage ${siterOrd(ord)}?`,
            ],
            `${ord}-${i}`,
          ),
          tale: `${ord}. Hvilken bokstav mangler?`,
          valg: valgMed(bok, andre, `mang-${ord}-${i}`),
          fasit: bok,
          hint: `${ord} har bokstaven ${bok} der det er hull.`,
          belonning: "diamant",
        },
        `u-mang-${ord}-${i}`,
      );
    });
  });
  const setninger: { prompt: string; tale: string; fasit: string; valg: string[]; hint: string }[] = [
    { prompt: "Hvilket ord passer? Jeg ___ til skolen.", tale: "Jeg går til skolen. Hvilket ord?", fasit: "går", valg: ["går", "sol", "mus", "hat"], hint: "Jeg går til skolen." },
    { prompt: "Hvilket ord passer? Alf ___ melk.", tale: "Alf drikker melk. Hvilket ord?", fasit: "drikker", valg: ["drikker", "hus", "pil", "ram"], hint: "Alf drikker melk." },
    { prompt: "Hvilket ord passer? Jeg ___ Alf.", tale: "Jeg ser Alf. Hvilket ord?", fasit: "ser", valg: ["ser", "tak", "lam", "bus"], hint: "Jeg ser Alf." },
    { prompt: "Hvilket ord passer? Vi ___ i veien.", tale: "Vi går i veien. Hvilket ord?", fasit: "går", valg: ["går", "lys", "fin", "dal"], hint: "Vi går i veien." },
    { prompt: "Hvilket ord passer? Hun ___ på fortauet.", tale: "Hun går på fortauet. Hvilket ord?", fasit: "går", valg: ["går", "bær", "sak", "rot"], hint: "Hun går på fortauet." },
    { prompt: "Hvilket ord passer? Jeg ___ en is.", tale: "Jeg spiser en is. Hvilket ord?", fasit: "spiser", valg: ["spiser", "mål", "nys", "løk"], hint: "Jeg spiser en is." },
    { prompt: "Hvilket ord passer? Alf ___ skolen.", tale: "Alf rekker skolen. Hvilket ord?", fasit: "rekker", valg: ["rekker", "mus", "hat", "pil"], hint: "Alf rekker skolen." },
    { prompt: "Hvilket ord passer? Vi ___ en zombie.", tale: "Vi ser en zombie. Hvilket ord?", fasit: "ser", valg: ["ser", "sol", "tak", "ren"], hint: "Vi ser en zombie." },
    { prompt: "Hvilket ord passer? Alf ___ i sekken.", tale: "Alf har mat i sekken. Hvilket ord?", fasit: "har", valg: ["har", "bil", "dam", "rim"], hint: "Alf har mat i sekken." },
    { prompt: "Hvilket ord passer? Jeg ___ på Alf.", tale: "Jeg venter på Alf. Hvilket ord?", fasit: "venter", valg: ["venter", "kol", "ben", "tap"], hint: "Jeg venter på Alf." },
    { prompt: "Hvilket ord passer? Hun ___ en krystall.", tale: "Hun finner en krystall. Hvilket ord?", fasit: "finner", valg: ["finner", "lus", "mal", "sen"], hint: "Hun finner en krystall." },
    { prompt: "Hvilket ord passer? Vi ___ skolemelk.", tale: "Vi kjøper skolemelk. Hvilket ord?", fasit: "kjøper", valg: ["kjøper", "ros", "tom", "les"], hint: "Vi kjøper skolemelk." },
    { prompt: "Hvilket ord passer? Alf ___ på zombie.", tale: "Alf hopper unna zombie. Hvilket ord?", fasit: "hopper", valg: ["hopper", "nål", "sår", "rak"], hint: "Alf hopper unna zombie." },
    { prompt: "Hvilket ord passer? Jeg ___ i veien.", tale: "Jeg løper i veien. Hvilket ord?", fasit: "løper", valg: ["løper", "ape", "lue", "bor"], hint: "Jeg løper i veien." },
    { prompt: "Hvilket ord passer? Han ___ en diamant.", tale: "Han plukker en diamant. Hvilket ord?", fasit: "plukker", valg: ["plukker", "mos", "sus", "pen"], hint: "Han plukker en diamant." },
    { prompt: "Hvilket ord passer? Vi ___ til skolen i tide.", tale: "Vi rekker skolen i tide. Hvilket ord?", fasit: "rekker", valg: ["rekker", "lim", "kom", "år"], hint: "Vi rekker skolen i tide." },
    { prompt: "Hvilket ord passer? Alf ___ seg i veien.", tale: "Alf skynder seg i veien. Hvilket ord?", fasit: "skynder", valg: ["skynder", "båt", "rør", "søl"], hint: "Alf skynder seg i veien." },
    { prompt: "Hvilket ord passer? Jeg ___ Alf i hånda.", tale: "Jeg holder Alf i hånda. Hvilket ord?", fasit: "holder", valg: ["holder", "sal", "ras", "fin"], hint: "Jeg holder Alf i hånda." },
    { prompt: "Hvilket ord passer? Hun ___ en sekk.", tale: "Hun bærer en sekk. Hvilket ord?", fasit: "bærer", valg: ["bærer", "is", "te", "du"], hint: "Hun bærer en sekk." },
    { prompt: "Hvilket ord passer? Vi ___ på skolen.", tale: "Vi leker på skolen. Hvilket ord?", fasit: "leker", valg: ["leker", "mor", "rom", "gå"], hint: "Vi leker på skolen." },
    { prompt: "Hvilket ord passer? Alf ___ etter zombie.", tale: "Alf ler etter zombie. Hvilket ord?", fasit: "ler", valg: ["ler", "hat", "pil", "tak"], hint: "Alf ler etter zombie." },
    { prompt: "Hvilket ord passer? Jeg ___ skolemelk.", tale: "Jeg drikker skolemelk. Hvilket ord?", fasit: "drikker", valg: ["drikker", "lys", "ål", "sak"], hint: "Jeg drikker skolemelk." },
    { prompt: "Hvilket ord passer? De ___ krystaller.", tale: "De samler krystaller. Hvilket ord?", fasit: "samler", valg: ["samler", "bus", "dal", "nys"], hint: "De samler krystaller." },
    { prompt: "Hvilket ord passer? Alf ___ fram til skolen.", tale: "Alf kommer fram til skolen. Hvilket ord?", fasit: "kommer", valg: ["kommer", "lam", "sil", "vis"], hint: "Alf kommer fram til skolen." },
  ];
  const setning = setninger.map((rad, i) =>
    o(
      {
        type: "manglende",
        nivaa: "utfordrende",
        prompt: rad.prompt,
        tale: rad.tale,
        valg: rad.valg,
        fasit: rad.fasit,
        hint: rad.hint,
        belonning: "diamant",
      },
      `u-setning-${i}`,
    ),
  );
  return [...bokstav, ...setning];
}

function taBort(): Oppgave[] {
  const rader = [
    { fra: "sol", bort: "s", igjen: "ol", valg: ["ol", "so", "sl", "lo"] },
    { fra: "mat", bort: "m", igjen: "at", valg: ["at", "ma", "mt", "ta"] },
    { fra: "hus", bort: "h", igjen: "us", valg: ["us", "hu", "hs", "su"] },
    { fra: "bil", bort: "b", igjen: "il", valg: ["il", "bi", "bl", "li"] },
    { fra: "lam", bort: "l", igjen: "am", valg: ["am", "la", "lm", "ma"] },
    { fra: "ris", bort: "r", igjen: "is", valg: ["is", "ri", "rs", "si"] },
    { fra: "tak", bort: "t", igjen: "ak", valg: ["ak", "ta", "tk", "ka"] },
    { fra: "pen", bort: "p", igjen: "en", valg: ["en", "pe", "pn", "ne"] },
  ];
  return rader.map((rad) =>
    o(
      {
        type: "byttLyd",
        nivaa: "utfordrende",
        prompt: `Ta bort ${rad.bort} i ${siterOrd(rad.fra)}. Hva blir igjen?`,
        tale: `${rad.fra}. Ta bort ${rad.bort}.`,
        valg: rad.valg,
        fasit: rad.igjen,
        hint: `Uten ${lydAv(rad.bort)} blir det ${rad.igjen}.`,
        belonning: "diamant",
      },
      `u-bort-${rad.fra}`,
    ),
  );
}

export const ALLE_OPPGAVER: Oppgave[] = [
  ...bokstavlyder(),
  ...forstelyder(),
  ...midtlyder(),
  ...storLiten(),
  ...tegninger(),
  ...trekkSammen(),
  ...rim(),
  ...stavelser(),
  ...byggOrd(),
  ...finnOrd(),
  ...byttLyd(),
  ...manglende(),
  ...taBort(),
];
