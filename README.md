# Svarta riddaren — Bashing Game

Ett eget sidscrollande arkadspel inspirerat av The Black Knight. En svart riddare
samlar kungens skatt i en medeltida by. All grafik är egen vektorgrafik ritad på
Canvas, utan externa bilder, bibliotek eller tjänster.

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
- Ljud är valfritt och avstängt från början. Rekord sparas lokalt i webbläsaren.

## Utveckling

Kräver Node.js 22+ och Python 3. Ingen paketinstallation eller byggprocess behövs.

```sh
cd /workspace/bashing-game
npm test
npm start
```

Utvecklingsservern använder port 8000 och serverar endast `public/`.
Stoppa den med Ctrl+C. Filerna i `public/` kan publiceras på en statisk webbserver.

`public/game.js` innehåller spellogiken, `public/app.js` gränssnitt och rendering.
`test/game.test.js` verifierar stridsräckvidd, cooldown, kraftslag, skadehantering,
skattemål, ekonomi, utrustning, paus och en hel speldag.

Webbläsarkontroll: starta, slå med mus och tangentbord, pausa, slutför en dag,
handla, fortsätt och starta om efter förlust. Kontrollera även mobil layout.
Ingen autentisering, databas eller hemlig miljövariabel krävs.
