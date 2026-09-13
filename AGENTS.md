# AGENTS.md

Dette er **Alf til skolen** (`storealfabet`): en norsk PWA for barn i 1. og 2. klasse. Alf har *forsovet* seg (ikke «oversovet») og må rekke skolen. Barnet løser alfabetoppgaver, samler krystaller og diamanter, kan møte klønete bokstav-zombier, og kjøper skolemelk til slutt.

Publiseres med GitHub Actions til GitHub Pages. Barnet «installerer» ved å legge siden til hjemskjermen. Ingen App Store.

## Stack

- Vite + TypeScript + Phaser 3 + Vitest
- PWA (`vite-plugin-pwa`), `base` er `/storealfabet/`
- Meny utenfor Phaser (HTML/CSS). Phaser viser den malte veien, Alf og zombiene.
- `npm test`, `npm run dev`, `npm run build`. Ikke pip/venv.

## Design som ikke skal endres uten at mennesket ber om det

- Språk: bokmål. Meny: Spill, Innstillinger (nivaa, lyd, sekk), Rekord, Om appen.
- Fire nivåer: 1. klasse, 2. klasse, Utfordrende, Blandet.
- Zombier er komiske skurker (store øyne, aldri blod).
- Tap er mildt. Alf kommer alltid frem. Ingen game over.
- Tale med «hør igjen». Fingertegning av bokstav, **ikke kamera**.
- Uttrykk: myk bildebok, ikke pixel-fliser.
- Mellom lekser: gang-minispill 30-60s. Alf bakfra, glinsende steiner, hopp unna zombier.
- Sekk i innstillinger: lilla, stjerne, fotball, blomst. Alf snur seg og smiler naar han plukker.
- 6 stopp, 30 sekunder, to dueller blant stopp 2–6, 2 av 3 vinner duellen.
- Verdi = krystaller + 2 × diamanter. Melk: 0 vanlig, 4 jordbær, 8 sjokolade, 12 stjernemelk.
- 1. og 2. klasse: bare lydrette ord. Æ/Ø/Å med. Ingen innlogging.

## Kode

- Spillogikk (tur, bank, økonomi, tegning) skal være testbar uten DOM/Phaser.
- Nye oppgavetyper: utvid `src/oppgaver/data.ts` og tester i `bank.test.ts`.
- localStorage-nøkkel: `storealfabet-v1`.
- Ikke commit `.env`, hemmeligheter eller `node_modules`.
- Commit bare når mennesket ber om det. Push bare når mennesket ber om det.

## Før du sier ferdig

Kjør `npm test`. For UI: én hel tur i stående mobilvisning, duell, melk, og at PWA-manifestet finnes.
