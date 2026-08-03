# Erweiterte Statistiken — Rekord-Listen mit Dekaden- und Quellen-Filter (Bauplan)

**Status:** 📐 Bauplan, **noch keine Zeile in `index.html` geändert**.
**Zweck:** Selbsttragend. Beschreibt, welche Rekord-Listen aus der vorhandenen Datenlage gebaut werden können, welche drei Datenschichten dafür **fehlen**, und in welcher Reihenfolge das entsteht. Wer hier einsteigt, braucht keinen Gesprächsverlauf.

Zeilennummern beziehen sich auf **`index.html`, Stand v0.9.15.74**. Bei Abweichung `grep -n`, danach `./update-functions-index.ps1`.

---

## 1. Ziel

Der Stats-Tab bekommt einen neuen Sub-Tab **🏅 Rekorde** mit zwei Filtern:

| Filter | Werte | entschieden |
|---|---|---|
| **Dekade** | Alles · 1950er · 1960er · … (feste 10er-Blöcke) | ✅ fix, kein freier Bereich |
| **Quelle** | Alles · Nur simuliert · Nur real | ✅ bei „Alles" **eine** Zeile pro Fahrer (real + simuliert summiert, markiert) |

Weitere getroffene Entscheidungen:

| Frage | Entscheidung |
|---|---|
| Serie überschreitet eine Dekadengrenze | ✅ zählt in **beiden** Dekaden, ungeschnitten, mit Zeitraum-Angabe |
| Allzeit-Vergleichszeile pro Rekord-Karte | ✅ ja („Dekadenrekord 4 · Allzeit 9") |
| Mindestschwellen | ✅ ja, pro Rekord unterschiedlich — **immer sichtbar ausgewiesen** (Abschnitt 6) |

Erste Ausbaustufe: **nur Fahrer und Teams.**

### 1.1 Warum Rekorde und nicht Spalten

Die erste Fassung dieses Plans schlug Dekaden-Spalten vor (Punkte/Siege/Podien pro Dekade). Das ist die bestehende All-Time-Tabelle (`24098`) mit einem Zeitfilter davor — kein neuer Erkenntniswert. **Rekord-Listen sind eine andere Gattung von Abfrage:** sie fragen nach Serien, Ersten Malen, Kombinationen innerhalb eines Rennens und Altern. Das braucht **Renn-Chronologie**, nicht Saison-Summen.

Das ist der teure, aber richtige Weg — und er bestimmt die Architektur (Abschnitt 5).

---

## 2. Der Rekord-Katalog

Legende Machbarkeit:
**A** = aus leichten Saison-Summen, sofort · **B** = braucht schwere Renn-Daten (lazy nachladen) · **C** = braucht eine neue Datenschicht (Abschnitt 4)

### 2.1 Fahrer — deine Liste

| Rekord | Stufe | simuliert | real | Anmerkung |
|---|---|---|---|---|
| **Siegesserien** (meiste Siege in Folge) | B | ✅ | ✅ | Zustandsautomat über Rennen-Chronologie |
| **Meiste Hattricks** (Sieg + Pole + schnellste Runde im selben Rennen) | B | ✅ | ✅ | sim: `res[].fl` + Quali-P1; real: `f1db-races-fastest-laps` + Grid |
| **Meiste DNF** | A/B | ✅ | ✅ | sim **A**: `driverStandings.dnfs` ist pro Saison da; real **B** |
| **Meiste DNQ** | B | ⚠️ | ✅ | simuliert **erst ab v0.9.15.25** gespeichert (`dnq`-Array, `18557`), ältere Saisons haben es nicht. Real vollständig — steckt in `positionText` (3.3) |
| **Meiste Konstrukteure** | B | ✅ | ✅ | ⚠️ Saison-Standings kennen nur das **letzte** Team. Exakt nur über `res[].tmn` (Teamname zur Rennzeit, `18568`); real über `D_CON` (`data/hist.js:2942`) |
| **Siege vor erstem Titel** | B | ✅ | ✅ | braucht Chronologie + Titeljahr |
| **Rennen vor erstem Sieg** | B | ✅ | ✅ | Starts zählen → nur aus `res` |
| **Alter bei erstem Sieg** | **C** | ❌ | ❌ | braucht Geburtsdatum **und** Renndatum |
| **Alter bei erstem Titel** | **C** | ❌ | ❌ | dito + Titel-Entscheidungstag |
| **Ältester Fahrer** (im Rennen / überhaupt) | **C** | ❌ | ❌ | dito |
| **Meiste Rennen ohne Punkte** | B | ✅ | ✅ | `res[].pt === 0` |
| **Meiste Rennen ohne Top 10** | B | ✅ | ✅ | punktesystem-unabhängig — **gute Wahl**, `res[].p > 10` |

### 2.2 Teams — deine Liste

| Rekord | Stufe | Anmerkung |
|---|---|---|
| **Doppelsiege** (P1+P2) | B | beide Autos eines Teams im selben Rennen — `res[].tmn` gruppieren |
| **Doppelpoles** (Quali P1+P2) | B | aus `qualifyingResults` (Top 20 gespeichert, `18573`) |
| **Pole-to-Win-Ratio** | A | Poles stehen in `driverStandings.poles`; Team-Summe über die Saison |

### 2.3 Ergänzungen, die derselbe Durchlauf kostenlos mitliefert

Diese kosten **keinen zusätzlichen Datenzugriff** — der Scan aus Abschnitt 5 läuft ohnehin:

| Rekord | Stufe |
|---|---|
| Meiste Poles ohne je einen Sieg | B |
| Längste Durststrecke zwischen zwei Siegen (in Rennen) | B |
| Meiste Rennen ohne je zu gewinnen (Karriere) | B |
| Meiste Punkteplatzierungen in Folge | B |
| Schlechteste Startposition eines Siegers (Aufholjagd) | B |
| Meiste Siege in einer Saison + Siegquote der Saison | B |
| Meiste verschiedene Sieger in einer Dekade | B |
| Meiste Rennen für **ein** Team (Loyalität) | B |
| Team: längste sieglose Serie · meiste Saisons ohne Punkte | B |
| Jüngster/ältester Sieger · jüngster Weltmeister · ältester Polesetter | **C** |
| Knappste Titelentscheidung (Punktabstand) | A |

**Nicht machbar:** „Grand Slam" (Pole + Sieg + schnellste Runde + alle Runden geführt). **Geführte Runden werden nirgends gespeichert** — weder simuliert noch im kompakten F1DB-Format. Das wäre eine eigene Datenschicht und ein Eingriff in `simulateRace`. Bewusst draußen.

---

## 3. Was die Datenlage hergibt (geprüft)

### 3.1 Simulierte Saisons — schwer, aber vollständig

`history[y].results` (schwer, `HISTORY_HEAVY_FIELDS` `4024`), Format bei `18550`:

```js
{ ri, rn, rc, rain, dnq:[ids],
  res: [{ d, p, pt, dnf, fl, fat, dnpq, gsc, wts, tmn }] }
```

Damit sind Position, Punkte, DNF, schnellste Runde, DNQ/DNPQ und **Teamname zur Rennzeit** pro Rennen belegt. `history[y].qualifyingResults` (`18573`) liefert Top-20-Quali → Pole und Doppelpole.

**Das reicht für jeden Stufe-B-Rekord.** Was fehlt, ist nur das Datum (Abschnitt 4.2).

### 3.2 Reale Jahre — vollständig, aber nur in den Rohdaten

`f1db-json-splitted/` ist komplett vorhanden:

**Wichtig: zur Laufzeit wird davon fast nichts gebraucht.** Nach der Dekodierung (3.3) trägt `F1DB_RESULTS` in `data/f1db.js` bereits Position, Wertungsstatus, Punkte, Startplatz, **Pole und schnellste Runde** — also alles für Stufe-B-Rekorde. Ergänzt um `F1DB_RACES` (`{raceId: [name, date, circuit, isIndy, laps]}`) für die Renndaten ist der reale Pfad **vollständig ohne Zusatzdatei** bedienbar.

Die Rohdateien werden nur noch für **zwei Build-Schritte** gebraucht (einmalig, nicht zur Laufzeit):

| Datei | wofür | Build-Schritt |
|---|---|---|
| `f1db-drivers.json` | `dateOfBirth` exakt + `dateOfDeath` → Tabelle `DRIVER_DOB` | 8 (Alters-Rekorde) |
| `f1db-races-driver-standings.json` | Zwischenstand nach jedem Rennen → Tabelle `TITLE_CLINCH` | 9 (Titel-Entscheidungstag) |

Nicht mehr nötig (durch 3.3 erledigt): `f1db-races-race-results.json`, `-qualifying-results.json`, `-fastest-laps.json`, `-pre-qualifying-results.json`, `-starting-grid-positions.json`.

### 3.3 `F1DB_RESULTS` — fertiger Decoder vorhanden ✅ (geprüft 2026-08-03)

**`getF1DBYear(year)` in `data/f1db.js:66` dekodiert das Format bereits vollständig** und cacht das Ergebnis. Es liefert pro Rennen `{raceId, round, name, date, circuit, isIndy, scheduledLaps, entries[]}` und pro Eintrag benannte Felder:

```js
{ raceId, posNum, posText, driverId, constrId, laps, time, gap,
  gapLaps, dnfReason, points, gridPos, fastestLap, pole }
```

**Der reale Pfad braucht also keinerlei Index-Arithmetik** — `getF1DBYear` ist die fertige Quelle, inklusive Renndatum. Genutzt wird sie an mehreren Stellen bereits so (`21005` ff.).

Die Wire-Format-Belegung ist zusätzlich als Kommentar über der Konstante dokumentiert (2026-08-03 gegen `f1db-json-splitted/f1db-races-race-results.json` über alle 27.137 Einträge verifiziert — der Decoder ist korrekt):

```
{year: [[raceId, runde, [eintraege]], ...]}
Eintrag = [raceId, positionNumber, positionText, driverId, constructorId,
           laps, time, gap, gapLaps, reasonRetired, points, gridPosition,
           fastestLap(1|null), polePosition(1)]
```

Drei Eigenheiten, die der Decoder **nicht** abnimmt und die den Bau betreffen:

1. **DNQ und DNPQ stecken in `posText`** — 1041 bzw. 338 Einträge. Für reale Jahre braucht der DNQ-Rekord **keine Zusatzquelle** (die zunächst eingeplante `pre-qualifying-results.json` entfällt).
2. **Eine Zahl in `posText` bedeutet nicht „Zieleinlauf"** — 865 Einträge tragen eine Position **und** einen `dnfReason` (klassifiziert trotz Ausfall). Wer „Rennen ohne Punkte" oder Serien über Zieleinläufe definiert, muss sich hier festlegen. Der Decoder reicht beides durch, ohne es zu bewerten.
3. **`posNum` ist bei allen nicht-numerischen Wertungen `null`** — Sortier- und Vergleichslogik muss das abfangen, sonst wandern DNF-Einträge bei `<`-Vergleichen an die Spitze.

Werteverteilung von `positionText` (27.291 Einträge gesamt):

| Wert | Anzahl | davon mit Ausfallgrund |
|---|---|---|
| `<Zahl>` | 16.434 | 865 |
| `DNF` | 8.725 | 8.700 |
| `DNQ` | 1.041 | 12 |
| `DNS` | 374 | 305 |
| `DNPQ` | 338 | 1 |
| `NC` (nicht klassifiziert) | 198 | 0 |
| `DSQ` | 161 | 156 |
| `EX` | 15 | 8 |
| `DNP` | 5 | 1 |

⚠️ **Snapshot-Drift ~0,15 %:** Das Kompaktformat stammt aus v0.8.3 und weicht in ~40 von 27.137 Einträgen vom heutigen F1DB-Stand ab (Punkte, Startplätze, einzelne Flags). Für Rekord-Listen unerheblich, aber es erklärt, warum ein Abgleich nie exakt 100 % trifft.

---

## 4. Die drei fehlenden Datenschichten

Hier weicht die Realität von der Annahme ab. Alle drei sind lösbar, aber keine ist geschenkt.

### 4.1 Geburtsdaten ⚠️ existieren heute nicht

**Annahme:** „jeder Fahrer hat ein genaues Geburtsdatum, Fallback 01.01."
**Ist-Zustand:** Es gibt **nirgends** ein Geburtsdatum — nur `birthYear` (Jahr), und selbst das lückenhaft:

- `HIST_DRIVERS` (`data/hist.js:1`) = `[wins, podiums, poles, points, races, championships, firstYear, lastYear]` — **kein Geburtsjahr**
- Generierte Fahrer bekommen `birthYear` (`6694`, `9577`, `9650`)
- Profil-Anzeige **erfindet** notfalls `birthYear = firstYear - 25` (`26389`, `26431`) — eine Schätzung, keine Angabe

**Lösung:**
1. Build-Skript zieht `dateOfBirth`/`dateOfDeath` aus `f1db-json-splitted/f1db-drivers.json` → neue kompakte Tabelle `DRIVER_DOB = { slug: 'YYYY-MM-DD' }` in `data/hist.js` (~900 Einträge, ~25 KB)
2. Generierte Fahrer bekommen künftig zusätzlich **Tag + Monat**, deterministisch aus dem Fahrer-Seed
3. Alt-Saves / Fahrer ohne Angabe: **`01.01.` des `birthYear`** — genau wie von dir vorgesehen. Der Fallback muss aber **markiert** sein (`_dobApprox: true`), sonst behauptet ein Altersrekord Taggenauigkeit, die er nicht hat
4. Erfundene Geburtsjahre (`firstYear - 25`) dürfen in Rekord-Listen **nie** einfließen — sie sind keine Daten

### 4.2 Renndaten (Tag) ⚠️ werden heute weggeworfen

**Annahme:** „wir haben ja den Kalender."
**Ist-Zustand:** `buildRacesForYear` (`19223`) verwirft das Datum und behält nur den Monat:

```js
month: r.date ? parseInt(r.date.slice(5, 7)) : null   // 19242
```

`F1DB_RACES[raceId][1]` **hat** das volle Datum (`"1950-05-13"`) — es wird nur nicht übernommen. Für Jahre jenseits des F1DB-Horizonts erzeugt `generateRacesForYear` (`19279`) Kalender **ganz ohne Datum**, Nutzer-Strecken (`customCircuitToRace`, `19254`) haben ebenfalls nur `month`.

**Das Problem ist kleiner als es aussieht — für die meisten Saisons ist das Datum rückwirkend ableitbar.** `buildRacesForYear` speichert `raceId: r.raceId` (`19235`), und `F1DB_RACES[raceId][1]` trägt das volle Datum. Für jede Saison, die auf einem F1DB-Kalender beruht, gilt also: **nicht migrieren, sondern beim Scan auflösen.** Keine Save-Änderung, kein Backfill.

Echt datumslos bleiben nur:
- generierte Kalender jenseits des F1DB-Horizonts (~ab 2026)
- Nutzer-Strecken aus dem Streckeneditor (`customCircuitToRace`, `19254` — nur `month`)

**Lösung:**

| # | Maßnahme | Aufwand |
|---|---|---|
| 1 | Beim Scan: `date` aus `F1DB_RACES[race.raceId]` auflösen, wenn das Rennobjekt keines trägt | Kern, deckt alle Alt-Saves ab |
| 2 | `buildRacesForYear`: `date: r.date` künftig mitspeichern (einzeilig, additiv) — spart die Auflösung für neue Saisons | trivial |
| 3 | Generierte Jahre: deterministische Datums-Synthese aus dem Saison-Seed (N Rennen über März–November, Mindestabstand 14 Tage) → `date` + `_dateSynth: true` | mittel |
| 4 | Custom-Strecken: Tag aus dem Monat ableiten (Monatsmitte), ebenfalls markiert | trivial |
| 5 | Bleibt ein Rennen ohne Datum, zeigen Rekorde mit Tagesbezug für diese Saison **„—", nicht geschätzt** | — |

Für die **reale** Quelle entfällt das Thema ganz: `getF1DBYear` liefert `date` bereits pro Rennen (3.3).

### 4.3 Titel-Entscheidungstag ⚠️ existiert als Konzept noch nicht

Du willst „Titel gilt als erreicht, sobald jemand mathematisch Weltmeister ist" — taggenau, plus neue UI-Meldung im Spiel.

**Für simulierte Saisons ist das sauber berechenbar:** Das Spiel kennt **keine Streichresultate** (kein `droppedScore`/`bestOf` im Code), Punkte sind eine reine Summe. Also:

```
maxRest = Σ getPointsForPosition(1, year)  über die verbleibenden Rennen   // 21164
entschieden, wenn  Führender.punkte - Zweiter.punkte > maxRest
```

Zu beachten: schnellste-Runde-Bonuspunkte und Ära-Punktesysteme laufen bereits über `getPointsForPosition` — der Bonus muss in `maxRest` mitgerechnet werden, sonst wird zu früh gemeldet.

**Für reale Jahre gilt diese Formel NICHT.** Vor 1991 zählten je nach Saison nur die besten N Ergebnisse; eine naive Summenrechnung datiert den Titel falsch. Für reale Jahre deshalb **nicht rechnen, sondern nachschlagen**: `f1db-races-driver-standings.json` enthält den Zwischenstand nach jedem Rennen → Entscheidungsrennen ist ablesbar, Datum kommt aus `f1db-races.json`. Ergebnis als kompakte Tabelle `TITLE_CLINCH = { year: raceId }` ins Build.

**Die UI-Meldung ist ein eigenständiges Feature**, nicht Teil der Rekord-Listen. Sie gehört in `applyRaceResults` (nach dem Rennen prüfen, einmal pro Saison feuern, Flag im Save gegen Doppelmeldung) und ist unabhängig von diesem Plan baubar. Sie ist **Voraussetzung** für „Alter bei erstem Titel" in simulierten Saisons — ohne sie gibt es keinen gespeicherten Entscheidungstag.

---

## 5. Architektur: ein Scan, viele Rekorde

Der entscheidende Unterschied zur Spalten-Idee: Rekorde **einzeln** zu berechnen hieße, die schweren Saison-Daten pro Rekord einmal zu laden. Bei 20 Rekorden × 40 Saisons ist das absurd.

**Stattdessen: ein einziger chronologischer Durchlauf über ALLE Jahre, der alle Akkumulatoren gleichzeitig füttert — und dabei pro Dekade *und* allzeit getrennt zählt.**

```
_scanAllRaces(quelle)                       ← läuft EINMAL, nicht pro Dekade
   └─ pro Jahr (aufsteigend):
        simuliert → getHistoryDetail(y)  (3795, LRU-Cache, sequenziell!)
        real      → F1DB_RESULTS[y] + F1DB_QUALIFYING[y]
      pro Rennen (chronologisch):
        → normalisiertes Renn-Event { year, date, raceIdx, results[], quali[], dnq[] }
   └─ Akkumulatoren verarbeiten jedes Event einmal:
        StreakAcc · FirstTimeAcc · CountAcc · TeamPairAcc · AgeAcc
   └─ jeder Akkumulator schreibt in MEHRERE Töpfe gleichzeitig:
        buckets['all']  +  buckets[1970]  (+ buckets[1980], wenn das Ereignis die Grenze überschreitet)
```

**Warum der volle Scan und nicht pro Dekade:** Die beschlossene Allzeit-Vergleichszeile („Dekadenrekord 4 · Allzeit 9") setzt ohnehin voraus, dass alle Jahre gelesen wurden. Ein Dekaden-Scan könnte sie gar nicht liefern. Also einmal alles lesen, in Töpfe verteilen — danach ist **jeder Dekadenwechsel kostenlos** (reines Umschalten zwischen bereits gefüllten Töpfen, kein Nachladen).

Der Scan läuft weiterhin **erst auf Klick**. Er ist einmalig teurer, dafür ist danach die ganze Ansicht sofort bedienbar.

### 5.0 Dekaden-Zuordnung (Entscheidung: beides)

| Ereignistyp | Zuordnung |
|---|---|
| Einzel-Ereignis (Sieg, Hattrick, DNF, Doppelsieg) | Dekade des Renndatums |
| **Serie über eine Grenze** (z. B. Siegesserie 1979–1981) | **beide** Dekaden, jeweils mit der **vollen** Länge, plus Zeitraum-Angabe in der Zeile |
| „Erstes Mal" (erster Sieg, erster Titel) | Dekade des Ereignisses |
| Karriere-Aggregat (meiste Konstrukteure) | Dekade jedes einzelnen Beitrags — der Fahrer erscheint in jeder berührten Dekade mit dem dortigen Teilwert |

⚠️ **Folge, die in die UI muss:** Die Summe der Dekaden-Rekorde ergibt **nicht** den Allzeit-Rekord. Eine grenzüberschreitende Serie wird zweimal gezeigt. Ohne Hinweis in der Fußzeile liest sich das wie ein Doppelzähl-Bug.

### 5.1 Regeln für den Scan

| Regel | Grund |
|---|---|
| **Sequenziell laden, nie `Promise.all` über die Jahre** | sonst liegen 40 schwere Saisons gleichzeitig im RAM — genau das, was vermieden werden soll. `getHistoryDetail` hat bereits einen LRU-Cache (`HIST_DETAIL_CACHE_MAX`), der von selbst verdrängt |
| **Erst auf Klick** | Nichts läuft beim Öffnen des Stats-Tabs. Der Scan startet per Button im Sub-Tab „Rekorde" — einmal, danach nie wieder (bis zur Invalidierung) |
| **Fortschrittsanzeige** | Ein Scan über 40+ Saisons ist sichtbar langsam. „Saison 1974 von 1950–2013 …" mit Abbruch-Button. Bei Abbruch: Teilergebnis **verwerfen**, nicht anzeigen — halb gescannte Rekorde sind falsche Rekorde |
| **Ergebnis-Cache im RAM, nicht persistiert** | `_recordsCache: Map<'source', {buckets}>` — Schlüssel ist **nur** die Quelle, die Dekaden stecken als Töpfe darin. Geleert bei Saisonende / Import / `deleteSelectedSeasons`. Kein neuer Store, nichts wächst im Save |
| **Normalisierung an genau einer Stelle** | simuliert und real münden in **dasselbe** Event-Format. Kein Akkumulator darf wissen, aus welcher Quelle sein Event stammt — sonst driften die beiden Pfade auseinander (dieselbe Lehre wie Live-Ticker vs. `simulateRace`) |

### 5.2 Schlüssel-Angleichung ⚠️ (bleibt aus Plan-Fassung 1 bestehen)

`allTimeStats` ist mit `histId || id` verschlüsselt (`18614`), `driverStandings` und `res[].d` dagegen mit der Lauf-ID `d.id` (`10133`). Die sind **nicht identisch** — `histId` wird separat gesetzt (`7167`, `8560`, `9085`, Crossover-Gäste `_cx_…` bei `10201`).

Ohne Auflösung erscheint ein Fahrer in zwei Rekord-Zeilen und die Profil-Verlinkung bricht. Da der Scan ohnehin die schweren Records liest, steht dort `drivers[]` mit **beiden** IDs zur Verfügung → die Map entsteht im Scan selbst. **Ein leichtes `driverIdMap`-Feld ist damit nicht mehr nötig** (anders als in Fassung 1 dieses Plans) — spart Schritt 0 komplett ein.

Für Teams gilt zusätzlich: IDs existieren in drei Formen (SEASON_DATA-Kurzkey `MA1`, Anzeigename, F1DB-Slug). **`makeTeamMatcher` aus .15.31 verwenden — exakt vor unscharf.**

### 5.3 Das normalisierte Renn-Event (die Schnittstelle)

Beide Quellen münden in **dasselbe** Format. Kein Akkumulator darf wissen, woher sein Event stammt — sonst driften die Pfade auseinander (dieselbe Lehre wie Live-Ticker vs. `simulateRace`).

```js
{ year, date, raceIdx, isIndy,
  entries: [{ driverKey, teamKey, pos, status, points, pole, fastestLap, grid }] }
```

`status` ist der Kern — ein **einziges** Feld statt verstreuter Flags:

| `status` | bedeutet | zählt als Start? | zählt als Zieleinlauf? |
|---|---|---|---|
| `finished` | gewertet, kein Ausfall | ✅ | ✅ |
| `classified` | Position **trotz** Ausfall (die 865 F1DB-Fälle) | ✅ | ⚠️ Definitionsfrage |
| `dnf` | ausgefallen | ✅ | ❌ |
| `dns` | gemeldet, nicht gestartet | ❌ | ❌ |
| `dnq` / `dnpq` | nicht qualifiziert / nicht vorqualifiziert | ❌ | ❌ |
| `dsq` / `ex` | disqualifiziert / ausgeschlossen | ✅ | ❌ |
| `nc` | nicht klassifiziert | ✅ | ❌ |

**Übersetzungstabelle:**

| Quelle | → `status` |
|---|---|
| **simuliert** `res[].dnf === 1` | `dnf` |
| **simuliert** `res[].dnpq === 1` | `dnpq` |
| **simuliert** ID steht im `dnq`-Array des Rennens | `dnq` |
| **simuliert** sonst | `finished` |
| **real** `posText` = Zahl **ohne** `dnfReason` | `finished` |
| **real** `posText` = Zahl **mit** `dnfReason` | `classified` |
| **real** `DNF` / `DNS` / `DNQ` / `DNPQ` / `DSQ` / `EX` / `NC` | gleichnamig |
| **real** `DNP` (5 Fälle) | `dns` |

Die reale Seite kommt dabei **nicht** aus dem Rohformat, sondern aus `getF1DBYear(year)` (3.3) — dort sind `pole`, `fastestLap`, `gridPos`, `points` und `date` bereits benannt und gecacht. Zu tun bleibt nur die `posText` → `status`-Übersetzung oben.

⚠️ **Asymmetrie, die bleibt:** Die simulierte Seite kennt `classified`, `dns`, `dsq`, `ex` und `nc` **gar nicht** — sie speichert nur `dnf`/`dnpq`/`dnq` (`18550`). Ein Rekord wie „meiste Disqualifikationen" wäre real befüllbar und simuliert immer 0. **Solche Rekorde gehören nicht in den Katalog**, solange die Simulation die Zustände nicht kennt. Die Tabelle oben ist trotzdem vollständig, damit reale Jahre nicht stillschweigend falsch einsortiert werden.

Pole für simulierte Jahre kommt aus `qualifyingResults` (P1), für reale aus `entry.pole`. Schnellste Runde: simuliert `res[].fl`, real `entry.fastestLap`.

⚠️ **`posNum` ist bei jeder nicht-numerischen Wertung `null`** (empirisch bestätigt für DNF/NC/DNS/DSQ/DNQ/DNPQ/DNP/EX). Jeder `<`- oder `sort`-Vergleich über Positionen muss das abfangen, sonst landen Ausfälle vor dem Sieger.

---

### 5.4 Die Akkumulatoren

Fünf Bauarten decken den gesamten Katalog ab. Jeder bekommt jedes Event **einmal** und schreibt in die Töpfe aus 5.0.

**Gemeinsame Schnittstelle:**

```js
{ id, kind, init(), onRace(evt, buckets), finish(buckets) → [{key, value, detail}] }
```

`buckets` ist immer `{all, 1950, 1960, …}`. Kein Akkumulator liest die Dekade selbst — er bekommt die Liste der Töpfe, in die sein Ereignis gehört (bei Serien sind das mehrere, siehe 5.0).

#### A — `CountAcc` (Zählung)

Einfachster Fall: pro Fahrer/Team einen Zähler hochsetzen, wenn ein Prädikat zutrifft.

```
state:   Map<key, zahl> je Topf
onRace:  für jeden Eintrag: wenn prädikat(entry) → zähler++
```

Deckt ab: DNF · Rennen ohne Punkte · Rennen ohne Top 10 · Hattricks · Doppelsiege · Doppelpoles · DNQ · Saisons ohne Punkte.
Konfiguration ist nur das Prädikat — deshalb **eine** Implementierung, nicht acht.

#### B — `StreakAcc` (Serien)

```
state:   Map<key, {laufend, seitDatum, beste, besteVon, besteBis}> je Topf
onRace:  trifft prädikat  → laufend++, ggf. beste aktualisieren
         trifft es nicht  → laufend = 0
```

Deckt ab: Siegesserien · Punkteplatzierungen in Folge · sieglose Serien (invertiertes Prädikat) · längste Durststrecke.

⚠️ **Zwei Fallen:**
1. **Die Serie muss über Saisongrenzen laufen** — sie endet nicht im Dezember. Der Zustand wird beim Jahreswechsel **nicht** zurückgesetzt.
2. **Wer ein Rennen nicht bestreitet, unterbricht nicht.** Ein Fahrer, der aussetzt, verliert seine Siegesserie nicht — sie wird beim nächsten Start fortgeführt. Nur eine **Teilnahme ohne Erfolg** bricht ab. Das muss in der Definitionszeile stehen, weil beide Lesarten vertretbar sind.

#### C — `FirstTimeAcc` (Erste Male)

```
state:   Map<key, {starts, siege, ersterSiegNachStarts, ersterSiegDatum,
                   siegeVorTitel, titelDatum}>
onRace:  starts++ (nur bei status ∈ {finished, classified, dnf, dsq, nc})
         bei Sieg:  wenn kein ersterSieg → merken
         bei Titel: siegeVorTitel = aktueller Siegzähler
```

Deckt ab: Rennen vor erstem Sieg · Siege vor erstem Titel · Alter bei erstem Sieg/Titel (Stufe C).
Wird **erst in `finish()` gefiltert** — die Qualifikations-Bedingungen aus 6.2 (nur Sieger, nur Weltmeister) lassen sich vorher nicht kennen.

#### D — `TeamPairAcc` (Kombinationen innerhalb eines Rennens)

Der einzige Akkumulator, der **quer über die Einträge eines Rennens** arbeitet statt pro Fahrer.

```
onRace:  Einträge nach teamKey gruppieren
         Doppelsieg    = zwei Einträge desselben Teams auf P1 und P2
         Doppelpole    = P1 und P2 der Qualifikation
```

⚠️ Die Gruppierung läuft über `tmn` (Teamname zur Rennzeit) bzw. `constrId` — **innerhalb eines Rennens** ist das eindeutig, über Dekaden hinweg nicht (siehe 5.2).

#### E — `RatioAcc` (Quoten)

```
state:   Map<key, {zaehler, nenner}> je Topf
finish:  wert = zaehler/nenner, Einträge unter der Schwelle (6.2) aussortieren
         — aber den besten Aussortierten für die UI-Zeile aufheben (6.3)
```

Deckt ab: Pole-to-Win-Ratio · Siegquote einer Saison.

### 5.5 Rangfolge bei Gleichstand (global)

Gilt für **jede** Rekordliste, damit die Reihenfolge nicht zufällig aus der Map-Iteration entsteht:

1. **Wert** (absteigend, bei Alters-Rekorden aufsteigend)
2. **Früheres Auftreten zuerst** — wer den Wert zuerst erreichte, steht oben
3. **Weniger Versuche zuerst** — 5 Siege aus 20 Starts vor 5 Siegen aus 80
4. **Alphabetisch**

Das spiegelt die Sortierlogik der bestehenden All-Time-Tabelle (`24114`: primär → `firstYear` → Name) und macht Listen zwischen zwei Läufen stabil.

---

## 6. Mindestschwellen

### 6.1 Grundregel: nur Quoten brauchen eine Schwelle

**Zähl-Rekorde brauchen keine.** „Meiste DNF" oder „meiste Hattricks" begrenzen sich selbst — niemand sammelt viele DNF ohne viele Starts. Eine Schwelle wäre dort reine Willkür.

**Quoten-Rekorde brauchen zwingend eine**, sonst gewinnt sie immer jemand mit dem kleinstmöglichen Nenner (1 Pole, 1 Sieg → 100 %).

**Ein dritter Typ braucht keine Schwelle, sondern eine Qualifikations-Bedingung** — eine inhaltliche Voraussetzung, ohne die der Rekord unsinnig wird.

### 6.2 Vorgeschlagene Werte

| Rekord | Typ | Schwelle / Bedingung | Begründung |
|---|---|---|---|
| Siegesserien | Zählung | **≥ 2 Siege in Folge** | eine „Serie" von 1 ist keine Serie |
| Meiste Hattricks | Zählung | keine | selbstbegrenzend |
| Meiste DNF | Zählung | keine | selbstbegrenzend |
| Meiste DNQ | Zählung | keine, aber **Erfassungszeitraum ausweisen** | simuliert erst ab v0.9.15.25 (siehe 7) |
| Meiste Konstrukteure | Zählung | keine | selbstbegrenzend |
| **Siege vor erstem Titel** | Bedingung | **nur Weltmeister** | ohne Titel ist der Wert unendlich offen. Gegenstück als eigene Karte: „meiste Siege ohne je Weltmeister zu werden" |
| **Rennen vor erstem Sieg** | Bedingung | **nur Fahrer, die je gewonnen haben** | sonst führt ein sieglos gebliebener Fahrer die Liste dauerhaft an. Gegenstück: „meiste Rennen ohne je zu gewinnen" |
| Meiste Rennen ohne je zu gewinnen | Bedingung | **aktive Fahrer markieren** (🏎️) | ein aktiver Fahrer kann noch gewinnen — der Rekord ist vorläufig |
| Meiste Rennen ohne Punkte | Zählung | keine | selbstbegrenzend |
| Meiste Rennen ohne Top 10 | Zählung | keine | selbstbegrenzend |
| **Pole-to-Win-Ratio (Fahrer)** | **Quote** | **≥ 10 Poles** | darunter ist die Quote Rauschen; 10 ergibt eine Liste in brauchbarer Länge |
| **Pole-to-Win-Ratio (Team)** | **Quote** | **≥ 20 Poles** | Teams sammeln etwa doppelt so schnell wie Fahrer |
| **Siegquote einer Saison** | **Quote** | **≥ 60 % der Saisonrennen gestartet** | **relativ, nicht absolut** — 1950 hatte 7 Rennen, 2025 hat 24. Eine feste Zahl wäre in einer der beiden Ären falsch |
| Meiste Siege in einer Saison | Zählung | keine | selbstbegrenzend |
| Längste Durststrecke zwischen zwei Siegen | Bedingung | **≥ 2 Siege** | folgt aus der Definition |
| Meiste Punkteplatzierungen in Folge | Zählung | **≥ 2** | wie Siegesserie |
| Schlechteste Startposition eines Siegers | Zählung | keine, aber **Quali-Daten nötig** | Saisons ohne gespeicherte Quali fallen raus → ausweisen |
| Meiste Rennen für ein Team | Zählung | keine | selbstbegrenzend |
| Team: längste sieglose Serie | Bedingung | **≥ 2 Siege** (Serie *zwischen* Siegen) | sonst gewinnt ein nie siegreiches Team. Gegenstück: „meiste Rennen ohne je zu gewinnen" |
| Team: Doppelsiege / Doppelpoles | Zählung | keine | selbstbegrenzend |
| Team: meiste Saisons ohne Punkte | Zählung | keine | selbstbegrenzend |
| Meiste verschiedene Sieger in einer Dekade | Zählung | **Dekade muss ≥ 6 der 10 Jahre abdecken** | eine Dekade mit 2 Saisons ist kein Vergleichsmaßstab |
| Alters-Rekorde (jüngster/ältester …) | **Datenqualität** | **nur exaktes Geburtsdatum** (`_dobApprox` fällt raus) | ein 01.01.-Fallback darf keinen Tagesrekord tragen (siehe 4.1) |
| Knappste Titelentscheidung | Zählung | keine | selbstbegrenzend |

### 6.3 Darstellung der Schwelle (verbindlich)

Deine Regel: *eine Schwelle, die man nicht sieht, wirkt wie ein verlorener Rekord.* Jede Karte mit Schwelle bekommt deshalb **drei** Elemente:

```
┌ Pole-to-Win-Ratio ─────────────────────────────┐
│  1. …                              68 %  (17/25)│
│  2. …                              61 %  (14/23)│
│                                                 │
│  ⚠ Mindestens 10 Poles · 23 von 64 Fahrern      │
│    erfüllen das                                 │
│  ↳ Bester darunter: <Name> 100 % (2/2)          │
│  [ Schwelle ignorieren ]                        │
└─────────────────────────────────────────────────┘
```

| Element | Zweck |
|---|---|
| **Schwellen-Hinweis mit Trefferzahl** („23 von 64") | macht sichtbar, dass gefiltert wurde und wie stark |
| **Bester unterhalb der Schwelle** | beantwortet „wo ist meine 100 %-Quote?" direkt in der Karte, **bevor** die Frage entsteht |
| **Schalter „Schwelle ignorieren"** | pro Karte, nicht global. Wer die Rohliste will, bekommt sie — mit dann sichtbar sinnlosem Kopf |

Bei Zähl-Rekorden entfällt der Block; dort steht stattdessen nur die **Definitionszeile** (was als Start/Rennen zählt, welcher Zeitraum erfasst ist).

---

## 7. Stolpersteine

| Falle | Warum sie hier lauert |
|---|---|
| **Real/Sim-Schnitt immer gegen `templateUsed`, nie gegen `currentYear`** | genau dieser Fehler erzeugte in .15.27 die Matrix-Duplikate |
| **DNQ gibt es simuliert erst ab v0.9.15.25** (`18556`) | Ältere Saisons im selben Save haben keine DNQ-Daten. Der DNQ-Rekord muss den erfassten Zeitraum **ausweisen** („ab 1987 erfasst"), sonst ist er schlicht falsch |
| **Konstrukteur-Zählung aus Saison-Standings unterschätzt** | Mid-Season-Wechsel gehen verloren, die Standings kennen nur das letzte Team. Nur `res[].tmn` ist exakt |
| **Team-Zuordnung eines Rennens ist der Name, nicht die ID** | `tmn` ist ein Anzeigename. Für Doppelsieg/Doppelpole reicht das (Gruppierung innerhalb **eines** Rennens), für dekadenübergreifende Team-Rekorde nicht → dort über `makeTeamMatcher` normalisieren |
| **Ein Fahrer kann in einem Rennen zweimal auftauchen** | Crossover-Gäste `_cx_<slug>` (`10201`) sind eigene IDs. Ohne Auflösung zählt eine Serie doppelt |
| **„Rennen" ≠ „Starts" ≠ „Zieleinläufe"** | DNQ/DNS gehören nicht in „Rennen vor erstem Sieg". Die `status`-Tabelle in 5.3 legt fest, was jeweils zählt — insbesondere `classified` (Position trotz Ausfall, 865 reale Fälle). Definition pro Rekord festschreiben und **in der UI anzeigen** |
| **Zustände, die es nur real gibt** | `dsq`, `ex`, `nc`, `dns`, `classified` kennt die Simulation nicht (5.3). Ein Rekord darauf wäre real befüllt und simuliert immer 0 → gehört nicht in den Katalog |
| **Punkte-Rekorde über Ären hinweg sind irreführend** | 1950 gab es 8 für den Sieg, heute 25. Deshalb ist dein „Rennen ohne Top 10" die bessere Metrik als „ohne Punkte" — beide anbieten, die Systemabhängigkeit benennen |
| **Indy-Jahre 1950–60** | Die Indy 500 zählte zur WM, war aber ein anderes Starterfeld. Der bestehende Indy-Filter (`23858`) muss auf Rekorde durchschlagen, sonst gewinnt ein Indy-Spezialist die „meiste Siege"-Serie |
| **Erfundene Geburtsjahre** (`26389`) | dürfen nie in Altersrekorde einfließen — siehe 4.1 |

---

## 8. UI

Neuer Sub-Tab neben den bestehenden (`23898`):

```
[👤 Fahrer] [🏎️ Teams] [👑 WM] [🏟️ Strecken] [🏁 GP] [🔄 Transfers] [💀 Nekrolog] [🏅 Rekorde]

┌ Dekade ──────────────────────────────────────────────┐
│ [Alles] [1950er 📜] [1960er 📜] [1970er ⚡] [1980er 🏎️]│  📜 real · ⚡ gemischt · 🏎️ simuliert
└───────────────────────────────────────────────────────┘
┌ Quelle ────────────────────────────┐
│ [🌍 Alles] [🏎️ Simuliert] [📜 Real] │
└─────────────────────────────────────┘

  ⚡ Rekorde berechnen  (liest 64 Saisons — einmalig, danach sofort)

  ─ danach: Karten-Raster, je Rekord eine Karte mit Top 5 + „alle zeigen" ─
```

Jede Rekord-Karte hat denselben Aufbau:

```
┌ Längste Siegesserie ───────────────────────────┐
│  1. <Name>          5   (1972–1973)            │
│  2. <Name>          4   (1978)                 │
│  …                                             │
│  Dekadenrekord 5 · Allzeit 9                   │   ← Vergleichszeile (Entscheidung 3)
│  ⚠ Serien über Dekadengrenzen zählen in beiden │   ← nur wenn zutreffend
│  Serie = aufeinanderfolgende Rennen mit Start  │   ← Definitionszeile, immer
└────────────────────────────────────────────────┘
```

Zustand neben den bestehenden Variablen (`23857`), in `localStorage` gemerkt wie `stATSSubTab` (`23934`):

```js
let stATSDecade = 'all';    // 'all' | 1950 | 1960 | …
let stATSSource = 'all';    // 'all' | 'sim' | 'real'
```

Die Fußzeile ist **Pflicht, nicht Zierde**: Definition, Erfassungszeitraum, Schwellen-Hinweis (6.3) und Dekaden-Doppelzählung. Ohne sie ist jeder Rekord angreifbar — und jede Auslassung sieht aus wie ein Fehler.

---

## 9. Bau-Reihenfolge

| Schritt | Inhalt | Risiko |
|---|---|---|
| **1** | `_scanRaces` + Event-Normalisierung (nur simulierte Quelle), Fortschritt + Abbruch | mittel — Herzstück |
| **2** | `CountAcc` (5.4 A) — deckt DNF, ohne Punkte, ohne Top 10, Hattricks, DNQ, Konstrukteure in **einer** Implementierung ab | niedrig |
| **3** | `StreakAcc` + `FirstTimeAcc` (5.4 B/C) — Serien und Erste Male, inkl. Rangfolge-Regel 5.5 | niedrig |
| **4** | `TeamPairAcc` + `RatioAcc` (5.4 D/E) — Doppelsieg, Doppelpole, Pole-to-Win mit Schwellen aus 6.2 | niedrig |
| **5** | UI: Sub-Tab, Chips, Karten-Raster, Cache + Invalidierung | niedrig |
| **6** | Reale Quelle in `_scanAllRaces` — Feldsemantik ist dekodiert und in `data/f1db.js` dokumentiert (3.3), Übersetzung nach 5.3 | **niedrig** (war mittel) |
| **7** | Datenschicht Renndatum (4.2): Auflösung über `raceId` im Scan (deckt Alt-Saves ab), `date` künftig mitspeichern, Synthese nur für generierte Jahre | niedrig |
| **8** | Datenschicht Geburtsdaten (4.1): `DRIVER_DOB` bauen, generierte Fahrer erweitern, Approx-Flag | mittel |
| **9** | Titel-Entscheidung (4.3): Berechnung + **neue UI-Meldung im Rennverlauf** + `TITLE_CLINCH` für reale Jahre | mittel — eigenständiges Feature |
| **10** | Alters-Rekorde (Stufe C), sobald 7–9 stehen | niedrig |
| **11** | `./update-functions-index.ps1`, Changelog, Version | — |

Schritte 1–6 sind **rein lesend** und können den bestehenden Stats-Tab nicht beschädigen. Erst 7–9 fassen Schreibpfade an (`buildRacesForYear`, Fahrer-Generierung, `applyRaceResults`).

Sinnvoller erster Meilenstein: **Schritte 1–5** — alle Stufe-A/B-Rekorde für simulierte Saisons, ohne jede Datenmigration und ohne Alt-Save-Risiko.

---

## 10. Offene Entscheidungen

Die drei Fragen aus Fassung 2 sind entschieden (Schwellen ja mit Ausweisung · Dekaden beides · Allzeit-Vergleichszeile ja) und in die Abschnitte 1, 5.0, 6 und 8 eingearbeitet.

Neu offen, aber **nicht blockierend** für Schritte 1–5:

1. **Listenlänge pro Karte:** Top 5 mit „alle zeigen", oder Top 10 direkt? Bei ~25 Karten entscheidet das über die Scrolllänge der Seite.
2. **Verhalten bei Quelle-Wechsel:** Der Scan ist pro Quelle gecacht. Ein Wechsel `simuliert → alles` erfordert einen zweiten Durchlauf. Direkt automatisch starten, oder Button anzeigen?
