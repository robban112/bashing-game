# Svarta riddaren — Bashing Game

Ett eget sidscrollande arkadspel inspirerat av The Black Knight. En svart riddare
samlar kungens skatt i en medeltida by. Spelet fyller hela webbläsarfönstret,
utan ram eller sidmarginaler. GameArt2D:s CC0-paket av pzUH ger spelet tecknade,
animerade sprites. Webbappen använder Next.js App Router och React.

Se [ASSET_CREDITS.md](ASSET_CREDITS.md) för paket, källor och licens.

## Spela

- Riddaren går automatiskt. Klicka i spelområdet, tryck mellanslag eller använd
  SLÅ-knappen när ett mål kommer nära.
- Håll in minst 0,55 sekunder och släpp för ett kraftslag.
- Bybor och tunnor ger mynt. Vagnar och vakter kräver mer skada.
- Undvik att slå lila trollkarlar: deras förbannelser skadar dig.
- Vakter som passerar oslagna skadar dig också.
- Varje dag varar 40 sekunder. Nå skattemålet och överlev för att gå vidare.
- Köp vapen, rustning eller läkande drycker mellan dagarna. Hälsa och
  utrustning följer med; skattemålet ökar varje dag.
- P eller Pausa stoppar spelet. Det pausas även när fönstret tappar fokus.
- Helskärm-knappen döljer webbläsarens gränssnitt där Fullscreen API stöds.
  Spelet fyller fönstret även utan det läget.
- Ljud är valfritt och avstängt från början. Rekord sparas lokalt i webbläsaren.

## Utveckling

Kräver Node.js 22+. Python behövs inte längre.

```sh
cd /workspace/bashing-game
npm ci
npm run dev
```

Utvecklingsservern använder port 3000. Stoppa den med Ctrl+C.

```sh
npm test
npm run build
npm start
```

`npm start` kör produktionsservern efter ett lyckat bygge. Porten kan ändras med
`npm run dev -- --port 8000` eller `npm start -- --port 8000`.

- `app/` innehåller Next.js-layout, startsida, metadata och global CSS.
- `components/KnightGame.js` är en React-klientkomponent för gränssnitt,
  inmatning och spellivscykel. Animation och ljud startas i en effekt och
  städas bort när komponenten avmonteras.
- `lib/game.js` innehåller den oberoende spellogiken.
- `lib/renderer.js` ritar sprites, egna miljöer och komiska träffeffekter på Canvas.
- `lib/assets.js` laddar lokala spritefiler före spelstart.
- `public/assets/gameart2d/` innehåller originalbilder, källlicens och filmanifest.
- `test/game.test.js` verifierar stridsräckvidd, cooldown, kraftslag,
  skadehantering, skattemål, ekonomi, utrustning, paus och en hel speldag.

Webbläsarkontroll: starta, slå med mus och tangentbord, pausa, slutför en dag,
handla, fortsätt och starta om efter förlust. Kontrollera även mobil layout, landskapsläge och Helskärm-knappen.
Spelet visar en laddningsknapp tills sprites är klara och ett omladdningsval
om en bild inte kan laddas. Ingen extern bildserver behövs under spel.
Ingen autentisering, databas eller hemlig miljövariabel krävs.

## Publicering

Projektet kan importeras från GitHub i Vercel med Next.js som ramverk och
standardkommandot `npm run build`. Det går också att köra på en Node.js-värd
med `npm ci`, `npm run build` och `npm start`. En offentlig webbplats skapas
först när projektet driftsätts på en sådan värd.
