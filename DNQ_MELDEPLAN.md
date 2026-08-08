# Meldeliste, Grid & DNQ — Ist-Zustand und Bauplan

**Status:** ✅ **L1 (Stufe 1+2) und L3 gebaut** — L1 in v0.9.15.81, L3 in v0.9.15.82 (2026-08-08). **L2 wird nicht gebaut** (Abschnitt 9). Offen bleiben zwei Abnahmepunkte, beide erklärt und keinem Hebel dieses Plans zuzuordnen: 1950er Δ −1,7 und 1980er DNQ 5,2.

| Dekade | Baseline | nach L1 | **nach L3** | real |
|---|---|---|---|---|
| 1950er | +3,9 | −1,9 | **−1,7** | 0 |
| 1960er | +2,6 | −0,9 | **−0,9** | 0 |
| 1970er | +3,1 | +0,8 | **+0,8** | 0 |
| 1980er | +2,2 | +1,3 | **+1,3** | 0 |

DNQ/Rennen dazu: 1950er **1,4** (real 1,4 ✅) · 1960er 1,6 (1,5) · 1970er 3,7 (2,7) · 1980er 5,2 (3,9).
L3 verschiebt nur, **welche** Rennen ein Privatier fährt — Δ bleibt deshalb praktisch stehen; sein Erfolgsmaß steht in Abschnitt 10.
**Zweck:** Diese Datei ist **selbsttragend** — sie beschreibt die komplette Meldeformel (wie aus SEASON_DATA eine Startaufstellung wird), warum sie in der klassischen Ära zu viele Autos liefert, und in welcher Reihenfolge das repariert wird. Wer hier einsteigt, braucht nur noch die zwei Messskripte in `tests/`, keinen Gesprächsverlauf.

Alle Zeilennummern beziehen sich auf **`index.html`, Stand v0.9.15.31**. Sie verschieben sich — bei Abweichung `grep -n` und danach `./update-functions-index.ps1`.

---

## 1. Problem in einem Satz

Das Spiel **meldet in der klassischen Ära zu viele Autos pro Rennen** (Ø +2 bis +4 gegenüber der Realität). Dadurch entstehen **künstliche DNQ**, die es historisch so nicht gab.

### Referenzquelle (verbindlich)
Die Google-Tabelle des Nutzers (per Rennen: Gemeldet / Pre-Qualy / Qualy / Starter, 1950–91) ist manuell aus F1DB gebaut und **deckt sich exakt** mit `f1db-json-splitted/`:
- **Gemeldet** = distinct Fahrer je Runde aus `f1db-seasons-entrants-drivers.json` (Testfahrer + Indy raus)
- **Starter** = `f1db-starting-grid-positions.json`

Spreadsheet-ID `1UR7n8qZDU0oNAjFbviW0N5RwkOAyft-dG1fGXmJ9wE8`. Im Zweifel gilt `f1db-json-splitted/`, weil skriptbar. Beide sind dieselbe Wahrheit.

---

## 2. Die Meldeformel heute (Ist-Zustand, vollständig)

Grundphilosophie seit v0.9.15.11: **Der Meldeplan steht VOR der Saison fest.** Zur Rennzeit wird nur noch abgelesen, nicht gewürfelt. Ein geplanter Fahrer meldet garantiert.

### 2.1 Einmal pro Saison — `expandSeasonData(year)` (`6748`, gleiche Kette in `startNewSeason`)

| # | Schritt | Funktion | Was passiert |
|---|---|---|---|
| 1 | Kader aus Template | `expandSeasonData` `6748` | SEASON_DATA liefert Teams + alle Fahrer der Saison |
| 2 | Werk vs. Privat | `markPrivateers` `5928` | je Team: **die 2 Schnellsten sind Werksfahrer**, der Rest `isPrivateer`. Muss jede Saison neu laufen — lief das früher nur beim Spielstart, wurde nach ein paar Saisons jeder zum Werksfahrer und DNQ verschwand komplett |
| 3 | Heimrennen-Gäste | `HOME_ONLY_ENTRIES` `6810` + `assignGenericHomeOnly` `5737` | kuratierte und generische `homeOnly`-Fahrer bekommen ihre Heimstrecken |
| 4 | **Kleinstkonstrukteure markieren** | `markSmallConstructors` `5941` | siehe Abschnitt 3 — **muss VOR Schritt 5 laufen** |
| 5 | Startpläne ziehen | `assignPrivateerSchedules` `5969` | schreibt `d.scheduledRaces` (Liste von `circuitId`, lowercase — nicht Index, damit Kalender-Edits nichts verschieben) |
| 6 | 0-Meldungs-Pass | `_findZeroEntryDrivers` `6145` / `pruneZeroEntryDrivers` `6158` | wer mit Plan 0 Rennen meldet (z. B. Heimrennen nicht im Kalender), fliegt raus → Reserve-Pool |
| 7 | Feld auffüllen | `fillGridEntries` `6053` | nur in FORTGESETZTEN Saisons: solange irgendwo weniger melden als `getGridSize`, Reservefahrer (Pace ≥ 50) als Privateers an **Kunden-Marken** (`CUSTOMER_MARQUES` `6029`) hängen. Nach der Saison `releaseGridFillers` `6125` |

**Startplan-Ziehung im Detail** (`_drawPrivateerCount` `5807`, `_pickPrivateerRaces` `5832`):

```
Gaststarter-Anteil _privGuestShare(year):  <1960 0,68 · <1970 0,66 · <1975 0,60 · <1980 0,50 · <1990 0,44 · sonst 0,35
  Gaststarter  → geometrisch, n=1, weiter mit p=0,42
  sonst        → Teilsaison: 22–84 % des Kalenders
Verteilung _privClusterWindow(year):       <1962 0 (verstreut) · <1972 2,6 · <1980 1,5 · sonst 1,25 (geballt)
```
Begründung der Ära-Staffelung (gemessen: Spannweite der Startrunden gegen Zufallserwartung, Fahrer mit 2–6 Starts): 1950 = 1,38× · 1960 = 0,94× · 1970 = 0,63× · 1980 = 0,42×. Früh pickt sich der reisende Privatier Rennen nach Geld und Geografie (verstreut), ab den 70ern liegen die Starts geballt („hatte kurz ein Cockpit").

### 2.2 Pro Rennen — identisch in allen Modi

```
aktive Fahrer
  → Indy-Rennen? (eigenes Feld, andere Regeln)
  → privateerEntersRace(d, race)        6221   Plan ablesen; kein Plan = Werksfahrer = jedes Rennen
  → applyConstructorCarCap(...)         6197   je Team auf Ära-Grenze UND t._carsThisSeason kappen (schnellster sitzt im Auto)
  → getGridSize(year, race)             4277   mehr Melder als Plätze → DNQ, weniger → Gastfahrer aus dem Pool
```

**Diese drei Aufrufe stehen an DREI Stellen und müssen synchron bleiben** (CLAUDE.md: „Modus = Darstellung, nie Konsequenzen"): `simulateRace` `9492/9494`, Live-Ticker `10093/10094` und `10231/10232`. Wer nur eine anfasst, baut einen Modus-Bug.

**Ära-Deckel `_maxCarsPerConstructor` (`6186`)** — gemessen an F1DB (Ø Autos je Konstrukteur und Rennen / Maximum / Anteil > 2 Autos):

| Ära | Ø | Max | > 2 Autos | Deckel im Spiel |
|---|---|---|---|---|
| 1950er | 3,77 | 16 | 66 % | 99 (kein Deckel) |
| 1960er | 2,95 | 13 | 48 % | 99 |
| 1970er | 2,00 | 7 | 21 % | 7 |
| 1980–85 | 1,83 | 4 | 1 % | 3 |
| ab 1986 | 2,00 | 2 | 0 % | 2 (Regelwerk) |

Ohne diesen Deckel melden moderne **Ersatzfahrer** aus SEASON_DATA sporadisch über ihren Privateer-Plan mit. Er greift pro RENNEN, nicht pro Saison — sonst brechen Fahrerwechsel mitten in der Saison.

### 2.3 Wo DNQ und DNPQ entstehen

- **DNQ:** `simulateRace` `9504–9523`. Melder > `getGridSize` → die schnellsten N kommen ins Feld, der Rest ist DNQ. Liegt ein Qualifying-Ergebnis vor, wird dessen Reihenfolge genutzt (kein zweiter unabhängiger Wurf).
- **Unterbesetzung:** Melder < Grid → Gastfahrer aus dem Reserve-Pool (`isGuest`), `9525–9540`.
- **DNPQ (Vor-Qualifikation):** `PRE_QUAL_DATA` `4262`, ausgewertet in `simulateQualifying` `10173` (`_pqGrid` `10246`). Eigene Mechanik für 1977–1992: `pool` müssen antreten, `through` kommen durch, `prob` = Anteil der Wochenenden mit Vor-Quali; zusätzlich muss die Melderzahl über der Grid-Größe liegen. **Das ist die einzige Stelle, an der viele Melder historisch korrekt sind** — 1989: 39 Melder auf 26 Plätze.
- **Grid-Größe:** `GRID_SIZES` `4222` = gerundeter realer Ø Starter je Jahr aus F1DB (Indy raus). Ausnahmen in `getGridSize` `4277`: Monaco 1958–71 → 16, Monaco 1975–86 → 20, Nürburgring/Nordschleife bis 1976 → `base + 2`.
  ⚠ In `GRID_SIZES` **keine Inline-Kommentare** zwischen den Einträgen — ein `//` kommentiert den Rest der Zeile aus; genau so fielen 1954/57/58/59 einmal auf den Fallback 20 zurück.

---

## 3. Kleinstkonstrukteure — die vierte Klasse (Kernstück der Formel)

Über dem Dreier-System (Top / Mittelfeld / Backmarker) liegt eine vierte Klasse, die **über GRÖSSE definiert ist, nicht über Tempo**: Minardi ist Backmarker, fährt aber zwei Autos die ganze Saison — Klodwig fährt ein Auto bei zwei Rennen. Ohne diese Trennung meldet jedes Team jedes Rennen mit zwei Autos, und das Feld wird „zu ordentlich".

### 3.1 Datenbasis (F1DB, Konstrukteure nach Lebensdauer-Rennstarts)

| Lebensdauer | Ø Autos/Rennen | Ø Saisonanteil | davon < 2 Autos |
|---|---|---|---|
| < 20 Starts | 1,56 | **39 %** | 69 % |
| 20–99 | 2,03 | 86 % | 38 % |
| 100–299 | 2,20 | 92 % | 15 % |
| ≥ 300 | 2,22 | 98 % | 6 % |

**Scharfer Bruch: alles ab ~20 Starts fährt fast die ganze Saison.** Daraus die zwei Listen (`5854–5880`, aus `totalRaceStarts` generiert):
- `CONSTRUCTOR_TINY` — 112 Konstrukteure mit < 20 Lebenszeit-Starts
- `CONSTRUCTOR_SMALL` — 31 Konstrukteure mit 20–59 Starts

Ab 60 Lebenszeit-Starts ist ein Team **nie** Kleinstkonstrukteur. Das hält Surtees (118), Ensign (99), Osella (130) und Minardi (339) draußen — die waren schwach, aber etabliert.

### 3.2 Die Regel im Code

```
_smallConstructorShare(year)   5902     < 1970 → 0     1970–1985 → 0,35     ab 1986 → 0
markSmallConstructors(...)     5941     TINY  → 70 % Chance _smallCtor
                                        SMALL → 30 % Chance _smallCtor
                                        t._carsThisSeason = _smallCtor ? (65 % → 1 Auto, sonst 2) : unbegrenzt
assignPrivateerSchedules(...)  5969     EIN Teamplan je Kleinstkonstrukteur, Teilnahmequote 40–90 % (Ø 65 %)
                                        Werksfahrer übernehmen den Teamplan 1:1
                                        echte Privateers im selben Team dürfen nur aus diesem Plan ziehen
```

**Warum Wahrscheinlichkeit statt Gewissheit:** Lebenszeit-Starts messen „kurzlebig", nicht „Teilsaison". Gegenbeispiele aus 1975 — Frank Williams Racing Cars (12 Starts) fuhr **alle** 14 Rennen, Hesketh (52) ebenso; Maki (0) dagegen nur 5, Lyncar (1) genau eines. Ein Winzling fährt also meistens, aber nicht immer, eine Teilsaison.

**Warum EIN Plan pro Team statt pro Fahrer:** Ein Kleinteam fährt eine Teilsaison, sein Stammfahrer fährt deren Rennen dann aber praktisch alle mit. Surtees hatte 1975 real 11 von 14 Rennen, John Watson saß bei allen 11 drin — die frühere Fahrer-Ziehung gab ihm 1–3. Die Quote 40–90 % deckt die reale Spanne ab: Theodore/Martini 7/16, Hesketh 6/16, Surtees 11/14, Fondmetal 13/16.

**Warum erst ab 1970:** Davor deckt der Privateer-Mechanismus das schon ab — in den 50ern/60ern sind die meisten Fahrer Privateers (1965: 39 von 51) und tauchen über ihren Startplan ohnehin nur partiell auf. Gegengeprüft: 1955 lieferte 26,2 Melder gegen real 26,0, 1965 19,9 gegen 19,6. Ab 1978 sind die meisten Fahrer **Werks**fahrer (30 von 47) — dort fehlte der Mechanismus.

**Warum ab 1986 null:** (a) Die Kleinteams der Vor-Quali-Ära meldeten gerade JEDES Rennen — deshalb gab es die Vor-Quali überhaupt; sie scheiterten am Freitag, nicht an der Nennung. (b) Der Anteil echter Teilsaison-Konstrukteure fällt hart: 1970er 28 %, 1980er 4 %, 1990er 4 %, 2000er 2 %.

### 3.3 Die bekannte Schwäche — genau hier setzt L1 an

Die Klassenzuordnung nutzt **Lebenszeit-Starts als Stellvertreter für Per-Saison-Präsenz**. Das ist der Kern von Befund (A):
- Ein Team, das 1985 nur die halbe Saison fuhr, aber insgesamt viele Starts hat, gilt im Spiel als ganzjährig präsent (Spirit, Haas, Zakspeed).
- Umgekehrt fielen **moderne Umbenennungen** mit wenigen Lebenszeit-Starts (racing-point 38, alphatauri ~80) in `CONSTRUCTOR_SMALL`, obwohl sie volle Saisons fuhren — 2021–2023 stand deshalb je ein Team ohne Auto da. Erst der Jahres-Sweep zeigte das; die Null ab 1986 fängt es heute ab.

**Mit echter Per-Saison-Präsenz (L1) wird die Wahrscheinlichkeitsrechnung für reale Teams überflüssig** — für sie steht dann in den Daten, an welchen Runden sie antraten. `markSmallConstructors` bleibt nur noch für Teams **ohne** Präsenzeintrag zuständig: generierte, fiktive und Zukunfts-Teams. Genau das macht die Formel klarer, statt eine zweite Heuristik danebenzustellen.

---

## 4. Erweiterung (Nutzer-Idee): Gelegenheitsfahrer als dritte Fahrerklasse

### 4.1 Das Problem: der Kader schrumpft auf exakt 2 je Team

Die Kaderlogik zielt hart auf **zwei Sitze pro Team** — nirgends bekommt ein Team in einer fortgesetzten Saison einen dritten Stammfahrer:
- `fillEmptyTeamSeats` `15351`: `while (seatCount() < 2 …)`
- `processTeamChanges` `16238/16240`: `if (teamDrivers.length >= 2) return;` · `spotsNeeded = 2 - teamDrivers.length`

Folge nach ein paar Saisons: **Meldeliste = Teams × 2**. Bei 9 Teams sind das 18 Autos gegen ein Grid-Ziel von 20 — das Feld kann gar nicht mehr voll werden.

### 4.2 Warum das Auffüllen heute nicht greift

Zwei belegte Gründe:

1. **Der Ära-Deckel schneidet Füller wieder weg.** `fillGridEntries` `6053` hängt Reservefahrer als Privateers an Kunden-Marken — pro Rennen kappt `applyConstructorCarCap` `6197` aber je Team auf `_maxCarsPerConstructor`. Ab 1986 ist das **2**, und die zwei Stammfahrer sind schneller. Der Füller verschwindet also genau dort, wo er gebraucht wird. In 1970–79 (Deckel 7) und 1980–85 (Deckel 3) überlebt er.
2. **Der Renn-Füller ist faktisch tot.** `simulateRace` `9525–9540` will bei Unterbesetzung Gastfahrer aus dem Reserve-Pool holen, filtert sie aber mit `GAME_STATE.teams.some(t => t.id === d.team)` — Pool-Fahrer haben jedoch immer `team: null` (`initReservePool` `7901`, und `releaseGridFillers` `6125` setzt es explizit zurück). **Im frischen 2024-Save gemessen: 99 Pool-Fahrer, davon 0 mit Team → der Zweig kann nie feuern.** Entweder beim Ziehen ein Team zuweisen oder den Zweig entfernen.

### 4.3 Die Übergangsphase 1970–1985 (die verwirrende Zone)

Sie ist verwirrend, weil sie real ein **Auslaufen** ist, kein Regelwechsel — gemessen an F1DB (Anteil Team-Rennen mit mehr als 2 Autos):

| Zeitraum | Ø Autos/Team/Rennen | Max | > 2 Autos | Deckel im Spiel |
|---|---|---|---|---|
| 1970–79 | 2,00 | 7 | **21 %** | 7 |
| 1980–85 | 1,83 | 4 | **1 %** | 3 |
| ab 1986 | 2,00 | 2 | 0 % | 2 (Regelwerk) |

Letztes Drittauto: **1985**. Die „maximal 2"-Regel gilt also erst ab 1986 hart; davor ist sie eine Häufigkeit, die von 21 % auf 1 % fällt. Ein Gelegenheitsfahrer-Mechanismus muss diese Kurve abbilden, nicht einen Schalter.

**Wichtige Konsequenz für die Moderne:** ab 1986 sind 9 Teams × 2 = 18 Autos **historisch korrekt**. Dort ist der richtige Hebel die **Teamzahl** (Neueinsteiger), nicht ein drittes Auto. Wer das Feld ab 1986 mit Gelegenheitsfahrern auffüllt, erzeugt einen Anachronismus.

### 4.4 Konzept: die dritte Fahrerklasse

Zwischen Stammfahrer (fester Vertrag, jedes Rennen) und Einzelstarter (`homeOnly`, nur das Heimrennen) fehlt die mittlere Klasse — **Gelegenheitsfahrer** wie Derek Bell: kein Lokalmatador, kein Stammfahrer, aber grundsätzlich bei jedem Grand Prix verfügbar.

| Eigenschaft | Stammfahrer | **Gelegenheitsfahrer** | Einzelstarter (`homeOnly`) |
|---|---|---|---|
| Vertrag | fest (`contractEnd`) | **keiner** — bleibt, solange gebraucht | keiner |
| Verfügbarkeit | jedes Rennen | **jedes Rennen möglich** | nur Heimstrecke |
| Anlass | Kader | **Leistung ODER Meldelisten-Bedarf** | Heimrennen |
| Bindung | Team | lose an ein Team, rennweise | Team des Gaststarts |

**Zwei Einsatzgründe, beide vom Nutzer benannt:**
1. **Leistung** — ein Team braucht kurzfristig einen besseren/anderen Fahrer (Verletzung, Tod, Formkrise, Nachtest).
2. **Feld füllen** — Meldeliste unter Grid-Ziel; er meldet, bis wieder genug Autos da sind.

**Vorgeschlagene Mechanik (baut auf Vorhandenem auf, erfindet nichts Neues):**
- Wohnort: **Reserve-Pool** mit Flag (`_occasional`), nicht als 3. Kadersitz. Damit bleiben `fillEmptyTeamSeats`/`processTeamChanges` unangetastet.
- Verpflichtung: derselbe Weg wie `fillGridEntries` `6053` (Team setzen, `isPrivateer = true`, `scheduledRaces` schreiben, Wertungs-Eintrag anlegen) — nur **auch mitten in der Saison** und nicht nur beim Saisonstart.
- Auswahl: Pace-Band **unterhalb** der Stammfahrer des Teams, aber über dem Pool-Schnitt; **keine** `homeCircuits`.
- Freigabe: wie `releaseGridFillers` `6125` zurück in den Pool — zusätzlich mitten in der Saison, sobald der Anlass wegfällt.
- **Ära-Gate = der Deckel, nicht eine neue Konstante.** Er darf nur einsteigen, wo `_maxCarsPerConstructor` noch Luft lässt (also bis 1985), mit einer Häufigkeit entlang der 21 % → 1 %-Kurve aus 4.3.
- Reihenfolge beachten: Gelegenheitsfahrer müssen **vor** `applyConstructorCarCap` in der Liste stehen und dürfen den Cap nicht überschreiten — sonst wirft der Cap den Falschen raus (er sortiert nach Pace, und der Füller ist der Langsamste).

**Verhältnis zu L1:** unabhängig, aber gegenläufig — L1 nimmt Meldungen weg (zu viele Autos), die Gelegenheitsfahrer geben welche zurück (zu wenige Autos in späten Saves). Deshalb **L1 zuerst messen, dann diese Klasse**: sonst tunt man zwei Hebel gegeneinander und weiß am Ende nicht, welcher gewirkt hat.

---

## 5. Befund: zwei getrennte Probleme (nicht vermischen)

**(A) Niveau zu hoch — zu viele Konstrukteure ganzjährig präsent.**
Klarster Fall 1985: real ~25,6 Melder (~13 Teams × 2), Spiel ~30,1 (~15 × 2). Ursache = Abschnitt 3.3.

**(B) Variation zu flach (50er/60er).**
Real schwankte die Meldezahl stark je Strecke (1952: Zandvoort 18 vs. Monza 35), im Spiel ist sie fast konstant. Reale Streckenstreuung (SD) ist 2–2,5× so hoch wie im Spiel (50er: 4,6 vs. 1,9). Reale DNQ waren an wenigen Strecken **geballt** (Monza, Nürburgring, Monaco), im Spiel streuen sie gleichmäßig.

| Dekade | Δ Meldungen (Spiel − real) | reale DNQ/Rennen | Spiel-DNQ/Rennen |
|---|---|---|---|
| 1950er | +3,9 | 1,4 | 4–6 |
| 1960er | +2,5 | 1,5 | 4–6 |
| 1970er | +3,1 | 2,7 | 4–6 |
| 1980er | +2,2 | 3,9 | 4–6 |

### Die Messskripte (liegen fertig in `tests/`, reproduzierbar)
```
node tests/dnq-entrant-diagnosis.js              → Detail 1952/1968/1985 + Sweep 1950–1989 (Δ, DNQ)
node tests/dnq-entrant-diagnosis.js 1961 1970    → nur diese Jahre im Detail
node tests/dnq-lever-dryrun.js                   → Hebel-Vergleich L1/L2 (ändert index.html NICHT)
node tests/dnq-venue-diagnosis.js                → Befund B: Teil A–C, reine Daten, schnell
node tests/dnq-venue-diagnosis.js --game         → dazu Teil D–G (Spiel gegen real, braucht sim-core)
node tests/dnq-l3-dryrun.js                      → L3-Gewicht W sweepen (ändert index.html NICHT)
```
Alle Spiel-Messungen gegen die **unkommittete** `index.html`: `SIMCORE_FROM_INDEX=1` davorsetzen, sonst misst `sim-core` den letzten Monolith.
`dnq-l3-dryrun.js` kennt `WEIGHTS=1,4`, `YEAR_FROM`/`YEAR_TO`, `N_RUNS` und `DETAIL=1` (Abweichung je Strecke).
Beide bauen die Saison über `expandSeasonData` und messen die Meldeliste **exakt wie `simulateRace`** (Indy raus → `privateerEntersRace` → `applyConstructorCarCap`), gemittelt über 400 bzw. 150 Läufe. Die real-DNQ-Spalte matcht die Referenztabelle (1952 Monza: 35 gemeldet → 24 Starter = 11 DNQ ✓).

---

## 6. Hebel-Trockenlauf (bereits gemessen)

Δ = Spiel − real, **0 = perfekt**:

| Dekade | Baseline | **L1** Präsenz | **L2** Schwach | L1+L2 |
|---|---|---|---|---|
| 1950er | +3,9 | −1,8 | +1,3 | +0,3 |
| 1960er | +2,5 | −0,9 | −0,9 | −1,1 |
| 1970er | +3,1 | +0,8 | −1,8 | −1,9 |
| 1980er | +2,2 | +1,3 | −4,5 | −4,6 |

- **L1 – Per-Saison-Präsenz aus F1DB:** datenexakt, keine Tuning-Knöpfe, bester ausbalancierter Hebel. Die −1,8 in den 50ern sind **kein L1-Fehler**, sondern Problem (B): dem Spiel fehlt der lange Schwanz der Einmal-Melder.
- **L2 – schwaches Team meldet weniger (Idee des Nutzers):** die naive carSpeed-Kurve **überkorrigiert die 80er** (−4,5; schickt Tyrrell/Ligier in Teilsaisons). In den 80ern fuhr real jedes Team jedes Rennen, DNQ kam aus der Vor-Quali. Nur **ära-gegatet bis ~1980** brauchbar.
- **L3 – Per-Venue:** adressiert (B), ist gegen dieselbe Referenz aber zirkulär und wurde nicht numerisch getestet.

**Reihenfolge steht damit fest: L1 zuerst und allein bewerten, dann L2 gegated, L3 nur bei Bedarf.**

---

## 7. Stufe 1 — Datenrunde: Präsenz-Tabelle bauen ✅ ERLEDIGT (2026-08-07)

**Gebaut:** `tests/build-presence.js` → `data/presence.js` (`TEAM_PRESENCE`, 30,7 KB).
76 Saisons 1950–2025, 961 Team-Saisons, davon **257 Teilsaison** (1950er 84 · 1960er 64 · 1970er 62 · 1980er 30 · 1990er 12 · 2000er 3 · 2010er 2).

**Vom Vorschlag unten abgewichen — drei Entscheidungen:**

| Punkt | Vorschlag | Gebaut | Warum |
|---|---|---|---|
| Format | Runden-Bitmaske | **`circuitId`-Listen** | `driver.scheduledRaces` ist seit v0.9.15.11 bewusst circuit-basiert („nicht Index, damit Kalender-Edits nichts verschieben"). Rundennummern hätten diese Fragilität zurückgeholt **und** eine Runde→Strecke-Tabelle im Spiel verlangt. Strecken sind in 75 von 77 Saisons eindeutig; die zwei Ausnahmen (2020/21 Doppelrennen) liegen in der Ära mit 0 % Teilsaison-Teams |
| Inhalt | alle Team-Saisons | **nur Abweichungen** (`1` = volle Saison, Liste = Teilsaison, **fehlt = unbekannt**) | Der häufigste Fall trägt keine Information — die Liste wäre der Kalender. Die Unterscheidung `1` ↔ „fehlt" ist aber tragend: für Unbekannte muss die Heuristik weiterlaufen, für bekannte Vollsaison-Teams gerade nicht |
| Abdeckung | 1950–1994 | **1950–2025** | Kostet dank `1` fast nichts und erspart eine Ära-Grenze als Sonderfall |

⚠️ **Vollständigkeits-Wächter — nicht wegoptimieren.** Für eine noch nicht gefahrene Saison kennt F1DB nur die ersten Runden. Ohne Prüfung wären im Stand von 2026-08 **alle 11 Teams der Saison 2026 als 3-Rennen-Teilsaison** eingegangen, und das Spiel hätte ihnen genau drei Meldungen zugestanden. Regel: an jeder Kalenderstrecke muss irgendein Team gemeldet haben, sonst ist das ganze Jahr unbrauchbar und fliegt raus. Hält sich von selbst aktuell, wenn F1DB nachzieht.

**Trockenlauf umgebaut:** `tests/dnq-lever-dryrun.js` baut seine L1-Wahrheit nicht mehr selbst aus den Rohdaten, sondern liest `data/presence.js` — dieselbe Tabelle, die Stufe 2 im Spiel benutzt. Die Referenz-Meldezahlen (`realEntered`) kommen weiterhin aus dem JSON, das ist die Messlatte und nicht der Hebel.

<details><summary>Ursprüngliche Planung (zur Nachvollziehbarkeit)</summary>

L1 braucht Wissen, das das Spiel heute nicht hat: **welches Team ist in Saison X an welchen Runden wirklich angetreten.** SEASON_DATA kennt nur „Team existiert in dieser Saison".

**1.1 Generator als `tests/`-Skript** (noch kein Laufzeit-Code):
- Quelle `f1db-json-splitted/f1db-seasons-entrants-drivers.json` + `f1db-races.json`
- Team-Mapping: `norm(name) / norm(fullName)` aus `f1db-constructors.json` — **dieselbe Funktion, die `tests/dnq-lever-dryrun.js` schon benutzt** (1950–1989 zu 100 % gemappt, 0 Miss). Nicht neu erfinden, herüberkopieren.
- Indy-500-Einträge und Testfahrer raus (gleiche Filterregel wie in den Diagnose-Skripten)

**1.2 Ausgabeformat** — Empfehlung: Runden-**Bitmaske** je (Jahr, Team), weil die klassische Ära ≤ 17 Läufe hat:
```js
// data/presence.js  (generiert – NIE von Hand editieren)
const TEAM_PRESENCE = { 1985: { ferrari: 0xFFFF, spirit: 0x000F, ... }, ... };
```
Alternative: Array der Rundennummern — lesbarer, ~3× größer. Beides unkritisch (**~10–15 KB** für 1950–1994).

**1.3 Abdeckung:** 1950–1994 (klassische Ära + Vor-Quali-Ära bis 1992). Ab ~1995 fährt real jedes Team jedes Rennen → keine Wirkung, nur Datenballast.

**1.4 Trockenlauf gegen die Datei:** `tests/dnq-lever-dryrun.js` so umbauen, dass L1 **aus `data/presence.js` statt aus dem JSON-Rohbestand** liest. Erst wenn die Δ-Tabelle aus Abschnitt 6 reproduziert wird, ist die Datei korrekt.

**Abbruchkriterium:** weicht die L1-Spalte um mehr als ±0,3 vom Trockenlauf ab, stimmt Mapping oder Filter nicht — nicht weiterbauen, sondern das Delta erklären.

</details>

---

## 8. Stufe 2 — Verdrahtung im Spiel ✅ GEBAUT (v0.9.15.81, 2026-08-08)

**Im Spiel gemessen** (`SIMCORE_FROM_INDEX=1 node tests/dnq-entrant-diagnosis.js`) — exakte Parität mit dem Trockenlauf:

| Dekade | Δ vorher | Δ jetzt | Trockenlauf-Prognose | DNQ vorher → jetzt | real |
|---|---|---|---|---|---|
| 1950er | +3,9 | **−1,9** | −1,9 ✅ | 4,6 → **1,2** | 1,4 |
| 1960er | +2,6 | **−0,9** | −0,9 ✅ | 4,0 → **1,6** | 1,5 |
| 1970er | +3,1 | **+0,8** | +0,7 ✅ | 5,7 → **3,8** | 2,7 |
| 1980er | +2,2 | **+1,3** | +1,3 ✅ | 6,0 → **5,2** | 3,9 |

**Moderne Ära (A/B gegen den Monolith .80 ohne `presence.js`):** 2000/2010/2015/2020/2024 auf die Nachkommastelle identisch. Zwei Jahre bewegen sich, beide **historisch korrekt**: 1996 22,00 → 21,25 (Forti ging real nach Runde 10 unter) und 2005 20,00 → 19,78 (BAR fehlte real zwei Rennen nach der Imola-Sperre).

**Abnahme-Bilanz (Abschnitt 11) — zwei Kriterien noch nicht erreicht:**
- ✅ moderne Ära unverändert · ✅ Trockenlauf-Parität · ✅ Fallback ohne Daten
- ⚠️ **|Δ| ≤ 1,5:** 1950er liegt bei −1,9. **Kein L1-Fehler**, sondern Problem (B) aus Abschnitt 5 — dem Spiel fehlt der lange Schwanz der Einmal-Melder. Adressiert L3, nicht L1
- ⚠️ **DNQ-Korridor 1,4–3,9:** 1980er bleiben bei 5,2. Die Vor-Quali-Ära lebt von vielen Meldern, der Überschuss sitzt dort nicht in der Präsenz

**So gebaut — bewusst als NACHLAUF, nicht als Ersatz der Heuristik:**

| Stelle | Änderung |
|---|---|
| `getTeamPresence(team, year)` (neu) | `1` = volle Saison · Array = Teilsaison · `null` = unbekannt |
| `assignPrivateerSchedules` | Nachlauf am Ende: Werksfahrer bekommen die realen Strecken, geplante Fahrer werden darauf beschnitten |
| `markSmallConstructors` | **unverändert** — die Heuristik würfelt weiter |
| `privateerEntersRace`, `applyConstructorCarCap` | unverändert |

Die Reihenfolge „erst würfeln, dann auf die realen Strecken beschneiden" ist exakt das, was im Trockenlauf gemessen wurde. Die Heuristik stattdessen abzuschalten hätte etwas anderes gemessen als das Verifizierte — deshalb bleibt sie stehen.

⚠️ **Schlüssel: ZWEI Formen nötig.** `TEAM_PRESENCE` ist mit F1DB-Konstrukteur-IDs geschlüsselt, das Spiel führt Anzeigenamen. `„Alfa Romeo" → alfa-romeo` trifft, `„O.S.C.A." → o-s-c-a-` nicht (F1DB: `osca`). Gemessen 1950–2025: mit einer Form 4 echte Lücken (alle O.S.C.A.), mit beiden 943 von 1047 Team-Saisons. Die restlichen ~100 sind reine **Indy**-Konstrukteure — die haben korrekt keinen Eintrag, weil der Generator Indy-Runden filtert, und fallen damit auf die Heuristik zurück.

<details><summary>Ursprüngliche Planung (zur Nachvollziehbarkeit)</summary>

| Stelle | Zeile | Was zu tun ist |
|---|---|---|
| `expandSeasonData` | `6748` | Präsenz je Team anhängen (`t._presenceRounds`), bevor Schritt 4/5 laufen |
| `markSmallConstructors` | `5941` (Aufrufe `6825` / `18143`) | Teams **mit** Präsenzeintrag nicht mehr auswürfeln — Daten schlagen Heuristik; Rest unverändert |
| `assignPrivateerSchedules` | `5969` | Teamplan eines präsenten Teams = seine realen Runden statt der 40–90-%-Ziehung |
| `privateerEntersRace` | `6221` | **unverändert lassen** — es liest nur den Plan ab, und genau das soll so bleiben |
| `applyConstructorCarCap` | `6197` | unverändert; `_carsThisSeason` bleibt der Wagenzahl-Hebel |
| Filterpaare | `9492/9494`, `10093/10094`, `10231/10232` | unverändert, aber **alle drei gegenprüfen** |

**Neue Datendatei registrieren — DREI Stellen, nicht zwei (2026-08-07 ergänzt):**
1. `<script src="data/presence.js">` in `index.html` (bei den anderen sechs, ~Zeile 3099)
2. `data/presence.js` in `$DataFiles` in **`manage-v.ps1:20`** — sonst fehlt sie im Standalone-Build
3. ⚠️ **`tests/sim-core.js:113`** hat eine **eigene, kürzere** hartcodierte Liste (nur `f1db.js`, `hist.js`, `seasons.js`, `names.js`). Wird die Datei in `index.html` eingehängt, aber hier nicht nachgetragen, ist `TEAM_PRESENCE` in **allen** sim-core-Tests undefiniert — inklusive der beiden Messskripte, mit denen die Abnahme läuft

**Verhalten ohne Daten:** fehlt `TEAM_PRESENCE` oder das Jahr (Zukunftssaisons, generierte Teams), gilt „Team fährt alle Runden" plus die heutige Kleinstkonstrukteur-Heuristik — also exakt das aktuelle Verhalten. **L1 darf nie Voraussetzung für einen Rennstart sein.**

</details>

---

## 9. Stufe 3 — L2 ära-gegatet (Feintuning 70er) ❌ VERWORFEN

**Nicht bauen.** L1 bringt die 70er auf Δ +0,8 — das ist die beste Dekade im ganzen Plan. L2 würde dort gegen einen Rest von unter einem Auto pro Rennen tunen und hat in der Nachbardekade nachweislich überkorrigiert (80er −4,5). Ein zweiter Niveau-Hebel neben L1 macht außerdem unklar, welcher von beiden wirkt. Die Idee bleibt hier nur dokumentiert.

<details><summary>Ursprüngliche Planung</summary>

Erst anfassen, wenn L1 allein gemessen ist. Regeln aus dem Trockenlauf:
- Gate bis **~1980** (Vorbild: `_smallConstructorShare` `5902`), darüber wirkungslos
- greift nur für Teams **ohne** Präsenzeintrag — für reale Teams ist L1 die Wahrheit, L2 würde doppelt kürzen
- eine einzige Kurve aus `carSpeed`, tunebar; Zielkorridor 70er Δ ≈ 0

</details>

## 10. Stufe 4 — L3 Heimrennen-Sog ✅ GEBAUT (v0.9.15.82, 2026-08-08)

**Die Ausgangsannahme war überholt.** Die Diagnose (`tests/dnq-venue-diagnosis.js`, neu) zeigt: nach L1 ist das Spiel **nicht mehr flach**. Die alte Zahl „Spiel-SD 1,9 gegen real 4,6" stammt aus der Zeit vor L1 **und** aus einer anderen Rechnung — der Trockenlauf mittelte erst über die Läufe und nahm dann die SD, was die Streuung gerade wegmittelt. Pro Lauf gemessen (das ist der faire Vergleich zu einer einzelnen realen Saison) stand es vor L3 bei 3,6 gegen 4,6 (50er), 2,8 gegen 3,5 (60er), 2,5 gegen 2,5 (70er) und 1,4 gegen 1,1 (80er).

**L1 hat dem Spiel das Streckenprofil geschenkt:** wer 1952 real nicht in Zandvoort war, ist es jetzt auch im Spiel nicht. Die Korrelation zwischen dem realen und dem gespielten Streckenprofil lag schon vor L3 bei 0,93 / 0,74 / 0,82 / 0,77. **Offen war nur der AUSSCHLAG in den 50ern/60ern** (systematische SD 2,6 gegen 4,1 bzw. 1,4 gegen 2,2) — die 70er waren getroffen, die 80er lagen darüber.

### 10.1 Was die Diagnose ergab (Teile A–G)

| Teil | Befund |
|---|---|
| **A** | Die Streuung sitzt **komplett im Schwanz**: SD Schwanz 4,13 von 4,63 gesamt (50er). Das Stammfeld ist mit SD ~1,5 in jeder Dekade fast konstant — L1 hält es, L3 darf es nicht anfassen |
| **B** | **36 % der Schwanz-Melder sind Landsleute** des Streckenlandes (50er), im Stammfeld nur 13 %. 60er 34 % · 70er 19 % · 80er 11 % |
| **B2** | ⚠ **Die Anreise-These ist widerlegt.** Übersee-Rennen haben denselben Schwanz wie europäische (9,0 gegen 10,0). Ein Kontinent-/Distanzfaktor wäre falsch gewesen |
| **C** | Magnete wiederholen sich über Jahre: Aintree +4,9 · Nürburgring +4,8 · Silverstone +4,4 · Monza +3,2. Auslass: Zandvoort −5,4 · Buenos Aires −5,0 · Spa −4,9. Das sind genau die Länder mit großer bzw. kleiner Privatier-Population |
| **D/E** | siehe oben — Profil richtig, Ausschlag zu klein |
| **F** | DNQ-Ballung war schon nah dran (50er: 74 % der Saison-DNQ auf den zwei stärksten Strecken gegen real 78 %) |
| **G** | Im Spiel waren nur **27 %** des Schwanzes Landsleute bei einer Zufallserwartung von 17 % — der Schwanz wurde also praktisch **ungewichtet** verteilt. Das ist der Rest-Fehler |

### 10.2 Der Hebel

**Keine Streckentabelle** (die wäre gegen dieselbe Referenz zirkulär), sondern **ein Gewicht in der Streckenwahl des Privatiers**: Rennen im eigenen Land zählen W-fach. Der Ausschlag entsteht dann aus der **Fahrerpopulation der Gastgebernation**, nicht aus einer nachgebauten Zielzahl.

| Stelle | Änderung |
|---|---|
| `_homePullWeight(year)` (neu) | `< 1970 → 4`, sonst `1` |
| `_homePullNation(d)` (neu) | Nationalität als IOC-Code inkl. `HOME_RACE_PROXY` — gleiche Regel wie `assignGenericHomeOnly` |
| `_weightedDraw(list, w, n)` (neu) | Ziehen ohne Zurücklegen mit Gewichten |
| `_pickPrivateerRaces` | vierter Parameter `homeNat`; **verstreut** (< 1962) → gewichtetes Ziehen · **geballt** (ab 1962) → die **Lage des Fensters** wird gewichtet, das Fenster selbst bleibt |
| `assignPrivateerSchedules` | gibt `_homePullNation(d)` an den Einzel-Privatier-Zug weiter |
| Teamplan-Zug (Kleinstkonstrukteure) | **unverändert** — siehe 10.4 |

⚠ **Warum die Ballung nicht aufgelöst wird:** der Trockenlauf ersetzte den ganzen Zug durch ein gewichtetes Ziehen und verlor damit für 1962–69 die über die Spannweite der Startrunden eigenständig kalibrierte Ballung (`_privClusterWindow`). Eingebaut ist deshalb die Fenster-**Lage**-Gewichtung. Sie ist nicht nur sauberer, sondern misst sich auch besser: 60er-Korrelation −0,03 statt −0,10, Landsmann-Anteil 32,7 % statt der prognostizierten 31 %.

### 10.3 Ergebnis (gemessen, `SIMCORE_FROM_INDEX=1`)

| Kennzahl | Dekade | vor L3 | **nach L3** | real |
|---|---|---|---|---|
| **Landsmann-Anteil Schwanz** (Zielgröße, strukturell) | 1950er | 27 % | **36,9 %** | 36,4 % ✅ |
| | 1960er | 24 % | **32,7 %** | 34,0 % ✅ |
| **systematische Strecken-SD** | 1950er | 2,62 | **3,26** | 4,11 |
| | 1960er | 1,43 | **1,93** | 2,22 |
| **Korrelation Streckenprofil** | 1950er | 0,93 | 0,93 | — |
| | 1960er | 0,74 | 0,71 | — |
| **Saison-SD** | 1950er | 3,63 | **4,00** | 4,63 |
| | 1960er | 2,81 | **2,99** | 3,46 |
| **DNQ-Ballung Top-2** | 1950er | 74 % | **78 %** | 78 % ✅ |
| **Ø DNQ/Rennen** | 1950er | 1,2 | **1,4** | 1,4 ✅ |
| **Δ Meldungen** | 1950er | −1,9 | **−1,7** | 0 |

**Ära-Gate verifiziert:** 1970er und 1980er in **allen** Kennzahlen unverändert (SD 2,52/2,53 · Profil-SD 1,70/1,69 · Korr 0,82/0,82). Moderne Ära 1996 / 2005 / 2010 / 2024 **bitgleich** gegen den Monolith .81. 1975 wich in einem Kurzlauf um +0,9 ab — bei 5 × 120 Läufen 26,32 gegen 26,35, also Rauschen (das Jahr schwankt selbst um ±0,4).

### 10.4 Bewusst NICHT gemacht

- **Teamplan-Zug der Kleinstkonstrukteure unverändert gelassen.** Er war kurzzeitig auf `_pickPrivateerRaces` umgestellt — das bringt dort aber **keinen Sog** (Teampläne gibt es nur 1970–1985, wo das Gate aus ist) und hätte nur die Fenster-Ballung eingeschleppt, die niemand gemessen hat. Zurückgebaut.
- **Kein Sog für Teampläne.** Ein Team hat keine Nationalität; die Streckenwahl eines Rennstalls ist eine Logistik-, keine Herkunftsentscheidung.
- **70er/80er nicht angefasst.** Gemessen: dort ist nichts zu holen (70er SD 1,7 gegen real 1,7) oder es schadet (80er liegen mit 0,8 gegen 0,5 schon darüber). Ein W von 1,5 in den 70ern drückte die SD auf 1,1, also **weg** von real.

### 10.5 Grenze des Modells (nicht wegtunen)

**Nürburgring und Monaco zogen ihre Riesenfelder über Kapazität und Prestige an, nicht über Landsleute.** Der Sog trifft in den 50ern 8 von 10 Strecken besser und diese zwei schlechter (Monaco +1,6 → +0,5 gegen real +2,8). Zuständig dafür sind die Ausnahmen in `getGridSize`, nicht L3.

Der 60er-Korrelationsabfall hängt an genau zwei Strecken: **east-london** ist schon vor L3 falsch (+2,6 gegen real +0,5 — `assignGenericHomeOnly` überzieht bei RSA) und wird verstärkt, **nurburgring** siehe oben. Ohne diese beiden liegt die Korrelation bei 0,78 → 0,78 bei steigender SD (1,2 → 1,6). Der Hebel verschlechtert also nichts, was er erklären kann — er verstärkt einen bestehenden Fehler an einer Stelle.

▶ **Offen daraus:** die RSA-Überziehung in `assignGenericHomeOnly` ist ein eigener, kleiner Fehler und kein L3-Thema.

---

## 11. Abnahme

1. `node tests/dnq-entrant-diagnosis.js` — Sweep 1950–1989, Δ je Dekade
2. `node tests/dnq-venue-diagnosis.js --game` — Streckenprofil, Landsmann-Anteil, DNQ-Ballung
3. Ziel: **|Δ| ≤ 1,5 in jeder Dekade**, DNQ/Rennen im Korridor 1,4–3,9 statt ursprünglich 4–6
4. Gegenprobe moderne Ära (1995–2025): Δ **unverändert** — weder L1 noch L3 dürfen dort etwas tun
5. Vor-Quali-Jahre (1988–92) behalten ihre DNPQ-Zahlen (`PRE_QUAL_DATA` `4262` ist gegen F1DB geeicht)
6. Ein Rennen im Live-Ticker und im Sofort-Modus: **identische Meldeliste**

### Stand nach L1 + L3 (v0.9.15.82)

| Kriterium | Ergebnis |
|---|---|
| 1 Δ je Dekade | −1,7 · −0,9 · +0,8 · +1,3 |
| 2 Streckenprofil | Landsmann-Anteil 36,9 % / 32,7 % (real 36,4 / 34,0) ✅ · SD 3,26 / 1,93 (real 4,11 / 2,22) |
| 3 **\|Δ\| ≤ 1,5** | ⚠ 1950er −1,7. **Kein Hebel dieses Plans** — es fehlt der Schwanz der Einmal-Melder (real 3,3/Rennen). Der wäre ein neuer Mechanismus (Gelegenheitsfahrer, Abschnitt 4), kein Tuning |
| 3 **DNQ-Korridor** | 1950er 1,4 ✅ · 1960er 1,6 ✅ · 1970er 3,7 ✅ · ⚠ 1980er 5,2. Vor-Quali-Ära: der Überschuss sitzt nicht in der Präsenz und nicht in der Streckenwahl |
| 4 moderne Ära | ✅ 1996 / 2005 / 2010 / 2024 bitgleich gegen .81 |
| 5 DNPQ | ✅ `PRE_QUAL_DATA` nicht angefasst |
| 6 Modus-Parität | ✅ beide Hebel sitzen in `assignPrivateerSchedules` / `_pickPrivateerRaces`, also **vor** der Saison — die drei Filterpaare (`9492/9494`, `10093/10094`, `10231/10232`) lesen unverändert nur den Plan ab |

## 12. Nicht-Ziele / Fallen

- **Kein Save-Sanitize.** Alte Spielstände behalten ihre Startpläne; L1 wirkt ab der nächsten `expandSeasonData`-Saison.
- **DNQ nicht wegdefinieren.** Sie sollen seltener und an den richtigen Strecken auftreten, nicht verschwinden — die Vor-Quali-Ära lebt davon.
- **Einzelrennen beweisen nichts.** Startpläne sind zufällig; immer über N Läufe mitteln (Diagnose-Skript nutzt 400).
- **Nicht am Qualifying schrauben.** Das Problem sitzt in der Meldeliste, nicht in der Quali-Auswahl.
- **Nicht `privateerEntersRace` „schlau" machen.** Es ist bewusst rein deterministisch; jeder Zufallszweig dort bricht die Modus-Parität.

## 13. Offene Entscheidungen (brauchen den Nutzer)

1. Format der Präsenz-Tabelle: **Bitmaske** (kompakt, Empfehlung) oder Rundenliste (lesbar)?
2. Abdeckung 1950–1994 oder gleich bis 2025 (Datenballast, aber keine Sonderfälle)?
3. L2 überhaupt bauen, wenn L1 die 70er schon auf +0,8 bringt?
4. Sollen Kleinstkonstrukteure **mit** Präsenzdaten weiterhin bei der Wagenzahl (`_carsThisSeason`, Ø 1,56 Autos) gewürfelt werden, oder auch die aus F1DB ziehen?

## 14. Änderungslog dieses Dokuments

- **2026-07-26** — angelegt aus der abgeschlossenen Diagnose (v0.9.15.26) und dem Hebel-Trockenlauf.
- **2026-08-08 (2)** — L3 gebaut (v0.9.15.82). Abschnitt 10 komplett neu: die Ausgangsannahme „Spiel ist flach" war nach L1 überholt, der echte Rest-Fehler war die ungewichtete Streckenwahl des Privatiers. L2 in Abschnitt 9 verworfen. Neue Skripte `dnq-venue-diagnosis.js` und `dnq-l3-dryrun.js`.
- **2026-07-26 (2)** — um die vollständige Meldeformel (Abschnitt 2) und die Kleinstkonstrukteure (Abschnitt 3) erweitert, damit das Dokument ohne Vorwissen lesbar ist; alle Konstanten und Zeilenanker gegen v0.9.15.31 verifiziert.
