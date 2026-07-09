# Nationen-Frequenz-Integration (Brief für Opus) — nach Paket A v3

## Kontext — was Fable geliefert hat (v0.9.14.37/.38, alles gepusht)
- **Namens-Seite fertig:** `data/names.js` (304 KB, ~20.500 Namen, echte Häufigkeits-
  Gewichte) wird von `fable-deliverables/name-data/build-names-v3.js` GENERIERT —
  **nie von Hand editieren**. Läuft ohne Code-Änderung (Schema identisch).
  Neue Pools: ARG, NOR, GRE, TUR, KOR (aus `NATION_NAME_FALLBACK` entfernt).
- **Nationen-Datenbasis fertig:** `fable-deliverables/nation-data/nation-frequency-by-decade.js`
  → `MOTORSPORT_NATION_FREQ` mit drei Blöcken je Debüt-Dekade 1950–2020:
  - `counts` — Roh-Fahrerzahlen (12.207 Auto-Rennfahrer, Wikidata, Zweiräder raus)
  - `shares` — normalisierte Anteile (reine Motorsport-Welt = Kart-/Breiten-Basis)
  - `sharesF1Blend` — 50 % shares + 50 % DECADE_NATION_POOLS (F1-naher Trichter)
  Excel zum Eyeballing: `nation-frequency-by-decade.xlsx` (4 Blätter inkl. Mapping).
- **Indy-Regel (v0.9.14.38, NICHT anfassen):** `DECADE_NATION_POOLS` 1950/1960 sind
  jetzt OHNE Indy-500-Teilnehmer gezählt (USA 34,8 %→7,2 % in den 50ern);
  `generateDriver` setzt bei `isIndyTeam` weiterhin hart `'USA'`. Die neue
  Verteilung darf NIE auf Indy-Teams angewendet werden.

## Aufgabe: Integration in die Spiel-Strukturen
1. **Junior-Welt (Kernstück):** `JUNIOR_NATIONS` (index.html ~11947, 15 Nationen
   GLEICHGEWICHTET, gezogen via `_jwRand` ~11973) ersetzen durch gewichtete Ziehung
   aus `MOTORSPORT_NATION_FREQ` passend zur aktuellen Junior-Saison-Dekade.
   Empfehlung: F3/F2 = `sharesF1Blend` (F1-naher Trichter); falls später
   Kart-Serien kommen: dort pures `shares`. Mit Nutzer klären, ob USA für die
   europäisch geprägten F3/F2-Grids zusätzlich gedämpft werden soll
   (en-Wiki-Bias, siehe nation-data/README).
2. **F1-Ebene:** `DECADE_NATION_POOLS` ist inzwischen selbst datenbasiert
   (1950/60 F1DB-road, 2000–2020 SEASON_DATA) und F1-REAL — für den normalen
   Grid-Fill wahrscheinlich BEHALTEN. Sinnvoller Einsatz der neuen Basis:
   Reserve-Pool/generierte Fahrer NACH Template-Horizont (~2025+, siehe Memory
   „Reserve-Pool versiegt") mit `sharesF1Blend[2020]` speisen → mehr Vielfalt.
3. **Dünne 2020er:** `shares[2020]` hat nur n=793 (Wikidata-Lag bei Jahrgängen
   2000+) → für 2020+ mit `shares[2010]` mischen (z.B. 50:50) oder counts-Schwelle.

## Technische Pflichten
- **Laufzeit-Daten gehören nach `data/*.js` oder inline:** manage-v inliniert NUR
  `data/*.js`. Wenn `MOTORSPORT_NATION_FREQ` zur Laufzeit gebraucht wird, den
  gewählten Ausschnitt entweder nach `data/` legen (+ `$DataFiles` in manage-v.ps1
  + `<script src>` in index.html, wie bei names.js) ODER als kompakte Konstante
  direkt in index.html einbetten (Blend je Dekade ≈ wenige KB — vermutlich reicht das).
- **Fallback-Sicherheit:** Ziehung kann IOC-Codes ohne Namens-Pool liefern
  (z.B. CHI, PER, UKR) — `pickPooledName` fällt automatisch auf
  `NATION_NAME_FALLBACK`/INT zurück, das ist okay. Exotische Codes (MYA, COD)
  landen in INT — akzeptiert.
- **Schema-Pflicht:** neue/geänderte Funktionen sofort in functions.schema.json
  (`./update-functions-index.ps1`), manage-v-Workflow mit Bestätigungs-Dialog.
- **Validierung:** `exportNameStats(20000, <jahr>, true)` → `_nations`-Block zeigt
  die tatsächliche Ziehungs-Frequenz; für Junior-Grids Saison simulieren und
  Nationen-Mix gegen `sharesF1Blend` der Dekade prüfen. In-Game-Check:
  `exportNationStats('generated', true)`.

## Nicht Scope
- Namens-Pools/Build-Pipeline (fertig, Fable) — bei Namens-Wünschen Build-Skript
  anpassen und neu laufen lassen, NICHT data/names.js editieren.
- Wikidata-Neuabzug (Reproduktion: SPARQL im Kopf von build-nation-freq.js).
