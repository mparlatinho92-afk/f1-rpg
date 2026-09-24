# BEFUNDE – Hauptprojekt (F1 RPG)

**Warum etwas so ist, und was schon vergeblich versucht wurde.** Gemessene Zahlen,
Messfallen, Negativergebnisse und Architektur-Historie. Pendant zu
`zielflagge/BEFUNDE.md`, nur für das Hauptspiel.

⚠ **Diese Datei wird NICHT automatisch geladen.** Sie ist Nachschlagewerk, kein
Kontext: gelesen wird sie **vor** Arbeit am jeweiligen Thema, nicht bei jeder Sitzung.
Genau dafür gibt es sie — `CLAUDE.md` läuft in jeder Sitzung mit und muss deshalb knapp
bleiben, hier darf es ausführlich sein.

**Warum auch Negativergebnisse und Historie:** „X wurde versucht und bringt nichts"
spart beim nächsten Mal einen ganzen Anlauf — ohne Zahlen probiert es irgendwann wieder
jemand. Und wer weiß, warum eine Konstruktion entstanden ist, baut sie nicht
versehentlich zurück.

## Inhalt

| Thema | Nachschlagen vor Arbeit an … |
|---|---|
| Fahrer-Karrieren: Bogen und Pace-Entwicklung | `developDriverPace`, `checkCareerEnds`, Alterskurven, Renn-Balancing |
| Live-Ticker: warum Balance-Fixes nicht ankamen | Ticker, `simulateRace`, Pace-Gewichtung |
| Das Feld ist zu ausgeglichen: niemand geht leer aus | Punkteverteilung, carSpeed-Spanne, Startfeld, `simulateRace`, Power-to-Weight |
| Vakuum-Saison: die Ursache ist zerlegt | Kalibrierung von carSpeed/Elo/Form, Startfeld, Quali |
| **VOLLAUF 75 Saisons: das Spiel zieht zur Mitte** | jede Kalibrierung der Streuung — Stichproben führen hier in die Irre |
| Die Leistungspyramide `TEAM_PYRAMID_EXP` | carSpeed-Verteilung, punktende Teams, große Felder |
| **⚠ Spearman-Gleichstände: der „Modellfehler 50er/70er" war ein Messartefakt** | JEDE Rangkorrelation über Endstände mit vielen punktlosen Fahrern — Durchschnittsränge verwenden |
| **⚠ Rauschgrenze: „Zug zur Mitte" bei den Fahrern ist Artefakt** | JEDE Auswertung von  gegen Einzelsaisons — Fahrer-Kennzahl ausgereizt (Ø ~1,71 wäre perfekt), Teams mit echtem Rest |
| **Todesfälle je Ebene neu abgeglichen** | Renntote aus Unfällen, Gastfahrer-Tote, nonWM- und Indy-Anker (alte Anker zu niedrig) |
| **Unfall-Anteil je Saison statt 50/50** | `dnfType`, Todesfälle im Rennen (−20 % WM-Tode durch weniger Unfälle) |
| **Ausfall-Spreizung nach Teamstärke: Formel liefert die Hälfte** | jede Arbeit an der DNF-Formel, `reliability`, `dnfType` |
| **`ERA_DNF_RATES` neu: DNQ im Nenner drückte Vor-Quali-Jahre** | Ausreißer 1989/1991, jede Arbeit an Ausfallraten — global neutral, Vor-Quali-Jahre besser |
| **⚠ Der Batch-Parser maß die TEAMS statt der Fahrer** | jede Auswertung von `vakuum-batch.js` — dort stehen zwei widerrufene Messungen und die Gegenprobe |
| Form-Vielfalt kalibriert, carSpeed-Gewicht verworfen | `BAD_DAY_PACE_FACTOR`, Streuung im Rennen |
| Ära-Abhängigkeit: das Auto zählt heute mehr | Auto/Fahrer-Verhältnis, Spearman-Fallen (⚠ `ERA_CAR_WEIGHT` wieder entfernt) |

---

## Fahrer-Karrieren: Bogen und Pace-Entwicklung (seit v0.9.18.5)

Eine Karriere hat einen **Bogen** – Aufstieg, Zenit, Abbau. Wer an `developDriverPace`,
`checkCareerEnds` oder den Alterskurven dreht, misst ihn vorher und nachher.

| Befehl | Zweck |
|---|---|
| `node tests/karriere-peak.js <export.json>` | Drei Gruppen gegen F1DB: Realität, echte Fahrer im Save, generierte |
| `node tests/karriere-peak-sim.js 1980 160 2010 --laeufe=3` | Simuliert und misst – für A/B **ohne** und **mit** `SIMCORE_FROM_INDEX=1` |
| `node tests/pace-kurve-real.js` | Die **Zielkurve** aus `PACE_RATINGS` (160 reale Fahrer) |
| `node tests/feld-spreizung.js <export.json>` | Spreizung des Feldes je Ära gegen F1DB — Zielkurve für carSpeed/Form |

**Die reale Zielkurve** (gemessen, nicht geschätzt): Debüt bei **88,5 %** des eigenen
Peaks, Zenit im Karrierejahr **4,2**, danach **2,95** Pace-Punkte Abbau pro Jahr. Der
pro Jahr geschlossene Gap-Anteil **steigt** (32/42/46/53 %).

⚠ **Messfallen:**
- **Der Bogen kommt aus dem ABBAU nach Jahr 4, nicht aus einem Rookie-Tal.** In der
  Pace gibt es kein Tal (Debüt 88,5 %). Eine fallende Lernkurve ist falsch herum.
- **`potentialPace` muss mitfallen, wenn `pace` fällt.** Sonst sieht der Aufbau im
  Folgejahr wieder einen offenen Gap und holt den Altersverlust zurück – dieses
  Tauziehen ließ den Abbau jahrelang unsichtbar verpuffen.
- **Zielwert ist Gruppe B, nicht die nackte Realität.** Echte Fahrer im Spielstand
  fahren in derselben Engine und Feldgröße; was sie nicht erreichen, liegt an der
  Feldzusammensetzung, nicht an der Fahrerkurve (→ *Das Feld ist zu ausgeglichen*).
- **Feldgröße kontrollieren.** Von Feld Ø53 auf Ø29 ändert sich die reale Flachheit
  nur 32 → 35 % – aber prüfen, sonst misst man ein Artefakt (s. Ticker-Realismus).
- `debutYear` ist bei generierten Fahrern das **Erzeugungsjahr**, nicht das Debüt
  (Ø 3,1 Jahre Pool davor). Karrierejahre immer über `getF1DebutYear()` /
  `getCareerYears()`.
- Rücktritte im Sim-Lauf erst **nach `processTeamChanges()`** abgreifen, sonst fehlen
  die Entlassungen (16 statt ~300).

### Der Karrierestart ist FELDGROESSEN-gebunden — nicht beliebig kalibrierbar

Dieselben echten Fahrer mit derselben echten Pace-Kurve, nur nach Aera getrennt:

| Gruppe B, Karriereende | Feld Ø | Abschnitt 1 | Flachheit |
|---|---|---|---|
| vor 1980 | 81 | 27 % | **28 %** |
| alle Aeren | 59 | 30 % | 35 % |
| ab 1995 | 25 | 34 % | 48 % |
| ab 2005 | 23 | **34 %** | **50 %** |

⚠ **Im 20er-Feld ist ~34 % / ~50 % die Grenze, nicht die nackte Realitaet (16 % / 32 %).**
Wer den Startwert darunter druecken will, muss die Pace-Kurve gegen die Daten
verbiegen — die Ursache liegt woanders.

⚠ **Die urspruengliche Erklaerung „10 Punkteraenge bei 20 Startern" ist WIDERLEGT**
(16.09.2026): die moderne reale F1 hat dieselben 10 Raenge. Nachgemessen steht der
Grund im Abschnitt *Das Feld ist zu ausgeglichen* — es fehlen die Fahrer und Teams,
die real leer ausgehen.

**NEGATIVERGEBNIS – nicht nochmal versuchen:** Den Rücktritt zu verzögern (Form- und
Trenddämpfung am Alterszweig, v0.9.18.4) bewegt die Kennzahl **nicht**. Solange die
Karriere flach ist, ändert der Zeitpunkt des Abgangs nichts.

---

## Live-Ticker: warum Balance-Fixes nicht ankamen (bis v0.9.18.0)

Bis v0.9.18.0 hatte der Live-Ticker eine **eigene** Lap-Pace-Formel und baute sein
Ergebnis aus akkumulierten Lap-Zeiten — er war damit eine zweite, stillschweigend
abweichende Engine.

Die eigene Formel war `pace*0.02` / `carSpeed*0.015`, **ohne** `experience` und **ohne**
Car-Ceiling. Ein Fahrer mit pace 95 gegen einen mit 50 war dort **0,9 % pro Runde**
schneller — in `simulateRace` entscheidet `pace` dagegen mit **0.45 von rund 100
Punkten**. Deshalb kamen Balance-Fixes im Ticker nie an. Der Umbau entfernte ~345 Zeilen
(netto 233 weniger).

**Warum das hier steht:** Der Fall zeigt dasselbe Muster wie der Karriere-Bogen weiter
oben — eine Stellschraube wird gedreht, aber ein zweiter Pfad rechnet daneben weiter,
und die Wirkung verpufft. Wer eine Balance-Änderung misst und **gar nichts** sieht,
sucht zuerst nach dem zweiten Pfad.

Die geltende Regel steht in `CLAUDE.md` unter *Simulations-Architektur*: seit .18.0 gibt
es nur noch einen Pfad, der Ticker animiert nur noch dorthin. Absicherung:
`node tests/ticker-paritaet.js --alle 40`.

---

## Das Feld ist zu ausgeglichen: niemand geht leer aus (gemessen 16.09.2026)

Ausgangsfrage des Nutzers zum flachen Karriere-Bogen: „was ist mit der Differenz, dass
noch im Schnitt die Hälfte in die Punkte fahren statt ein Drittel?"

⚠ **Die Vermutung „10 Punkteränge bei 20 Startern" war FALSCH** — und zwar meine eigene,
ungemessen behauptet. Die moderne reale F1 hat dieselben 10 Ränge. Die Messung zeigt
etwas anderes.

### Wie viele Fahrer einer Saison holen überhaupt Punkte?

⚠ **Ära-abhängig messen, nicht pauschal „generiert".** Generierte Fahrer gibt es
theoretisch in jeder Epoche (Lückenfüller, Ersatz, Privatiers) — wer nur die
Zukunftsjahre betrachtet, misst die eingefrorene Ära-Kurve und hält ein
Feldgrößen-Problem für ein Generator-Problem.

| Ära | Feld Spiel | Quote Spiel | Quote real | |
|---|---|---|---|---|
| 1950er | 105,3 | 24,4 % | 25 % | ✓ |
| 1960er | 59,5 | 42,9 % | 42 % | ✓ |
| 1970er | 50,1 | 51,7 % | ~50 % | ✓ |
| 1980er | 37,0 | **73,5 %** | 59 % | ✗ |
| 1990er | 29,4 | **77,6 %** | 59 % | ✗ |
| 2000er | 22,4 | **93,3 %** | 70 % | ✗ |
| 2010er | 21,8 | **99,1 %** | 66 % | ✗✗ |
| 2020–2025 | 20,0 | **100,0 %** | ~66 % | ✗✗ |
| 2026+ (nur generierte) | 20,0 | 99,5 % | — | |

**Die Abweichung beginnt in den 1980ern — mit ECHTEN Fahrern.** Im gemessenen Stand
(Start 1950) gab es vor 2026 überhaupt keine generierten Fahrer; das Feld war
historisch besetzt. Die Zukunft erbt also nur den Zustand der Gegenwart, sie
verursacht ihn nicht. **Ein Spielstand, der 1990 oder 2010 startet, hat das Problem
sofort** — nicht erst nach 400 Simjahren.

Bis in die 1970er trifft das Spiel die Realität genau. Dort ist das Feld groß genug,
dass viele Melder nur ein, zwei Rennen fahren und zwangsläufig leer ausgehen.

**Das Punktesystem ist NICHT die Ursache** — `getPointsForPosition` (index.html ~26902)
ist ära-korrekt: 5 Ränge bis 1960, 6 bis 2002, 8 bis 2009, 10 ab 2010. Geprüft.

Aussagekräftiger als die Quote ist die **absolute** Zahl: real holen über siebzig Jahre
stabil **19–22** Fahrer Punkte, und das Spiel trifft sie mit 18,5. Was fehlt, sind die
Fahrer, die real **leer ausgehen** — 1980er real ~15 davon, im Spiel ~10; 2010er real
~10, im Spiel praktisch keiner.

⚠ **Messgrenze:** Der ausgewertete Stand enthält keine generierten Fahrer vor 2026. Ob
ein Generator-Fahrer in den 1950ern sich ära-gerecht verhält (also auch mal leer
ausgeht), ist damit **nicht gemessen** — dafür bräuchte es einen Stand mit Lücken in
den frühen Jahrgängen.

### Der fehlende Tiefpunkt: Nullsaisons

Auch hier ära-getrennt, und auch hier verläuft der Bruch quer durch die **historische**
Phase — nicht zwischen echt und generiert:

| Karriere in … | n | mit ≥1 Nullsaison | **erste** Saison punktlos |
|---|---|---|---|
| Spiel 1950–1969 | 82 | 96,3 % | 59,8 % |
| Spiel 1970–1989 | 29 | 86,2 % | 48,3 % |
| Spiel 1990–2009 | 22 | **45,5 %** | **13,6 %** |
| Spiel 2010–2025 | 11 | **0,0 %** | **0,0 %** |
| Spiel 2026–2100 | 132 | 4,5 % | 0,8 % |
| Spiel 2400–2585 | 377 | 1,1 % | 0,0 % |
| — real, alle Ären | 215 | 88,8 % | 62,8 % |
| — real, Ende ab 2000 | 46 | 71,7 % | 32,6 % |

In den 50ern und 60ern trifft das Spiel die Realität (96 % gegen 89 %). Ab den 90ern
bricht es weg, ab 2010 gibt es **keine einzige** punktlose Saison mehr — real ist es in
derselben Zeit noch jede dritte Debütsaison.

**Das ist der fehlende Tiefpunkt in Abschnitt 1 des Karriere-Bogens** (38 % statt real
16 %) — nicht eine falsch kalibrierte Pace-Kurve. Die stimmt seit .18.5.

### Nur EINE Kennzahl liegt daneben — die Punktequote

Gemessen mit `node tests/feld-spreizung.js <export.json>`, vier Kennzahlen je Ära:

| | Betrag | vorzeichenbehaftet | |
|---|---|---|---|
| Punktequote | 17,7 | **+17,6** | **DANEBEN** |
| letztes Team | 4,4 | −0,4 | trifft — ⚠ **Vorzeichen kippt** |
| Champion-Anteil | 3,2 | −3,2 | trifft |
| DNF-Quote | 2,6 | +0,7 | trifft |

**Die Punktequote ist die einzige systematische Abweichung**, und sie geht immer in
dieselbe Richtung: zu viele Fahrer punkten. Spitze und Ausfallrate sind richtig
modelliert — es fehlt nur der Schwanz.

⚠ **Zwei Messfallen, beide selbst hineingelaufen:**

1. **Der Mittelwert der Beträge verdeckt kippende Vorzeichen.** „Letztes Team" trifft
   mit −0,4 scheinbar perfekt — tatsächlich ist das Spiel in den 1950ern **zu hart**
   (0,0 gegen real 9,4) und ab 2000 **zu weich** (5,4 gegen 1,0). Zwei echte Fehler,
   die sich gegenseitig aufheben. Das Werkzeug warnt seither explizit.
2. ⚠ **KORREKTUR einer früheren Zahl in diesem Dokument:** Der Champion-Anteil stand
   hier mit „real 38,5 % gegen Spiel 13,5 %". **Falsch** — beide Werte waren auf
   unterschiedlich gefilterten Kohorten berechnet (nur Karrieren ab 4 Saisons, nicht
   aktive). Über die vollständige Saisonkohorte sind es **real 18,2 % gegen Spiel
   16,8 %** — die Kennzahl **trifft**. Wer Anteile misst, muss bei Spiel und Realität
   dieselbe Grundgesamtheit nehmen.

**Die DNF-Quote ist der Gegenbeweis, dass so eine Kalibrierung möglich ist:** Sie folgt
der realen Ära-Kurve bereits genau — 52,2 % in den 1980ern, 11,9 % heute, Abweichung
im Schnitt 2,6 Punkte. Das Rauschen aus Ausfällen ist also **nicht** die Ursache; diese
Hypothese wurde aufgestellt und sofort widerlegt.

### Power-to-Weight trennt moderne Autos NICHT

Aus dem Recherche-Sheet des Nutzers (PS und Leergewicht je Wagen und Jahr):

| Jahr | Top-Team | Backmarker | Spanne |
|---|---|---|---|
| 1965 | 0,461 | 0,258 | Faktor 1,8 |
| 1985 | 1,596 | 0,994 | Faktor 2,3 |
| **2025** | 1,313 | **1,319** | **praktisch null** |

2025 hat der Haas dieselbe PS/kg wie der McLaren. Power-to-Weight taugt damit für die
**Ära-Skalierung** und den **Serienvergleich** (F1 1,313 · F2 0,780 · F3 0,565 · Kart
0,250 — relevant für die Junior-Welt), **nicht** für die Rangfolge innerhalb einer
modernen Saison.

Bemerkenswert: Real ist die technische Spanne früher **groß** und heute **klein**, die
Punktespreizung aber genau umgekehrt (letztes Team 9,4 % → 0,4 %). Kleine technische
Unterschiede erzeugen heute also große Ergebnisunterschiede — weil sie über eine ganze
Saison konsistent wirken und kaum noch Ausfälle dazwischenfunken.

### Warum die Spanne nicht durchschlägt

Nominell ist sie da: carSpeed Ø68,0 bis Ø95,9 (Spanne 27,8), Fahrer-pace Ø59,9 bis
Ø86,3 (Spanne 26,4). Sie übersetzt sich nur nicht ins Ergebnis. In `simulateRace`
(index.html ~14071):

```
_effPace * _paceFactor * 0.45  +  (trocken: 15)  +  experience * 0.15  +  _effCarSpeed * 0.20
```

- 28 Punkte carSpeed-Spanne × 0.20 = **5,6** Performance-Punkte
- Rauschen: **±6 bis ±16** (`_halfVar = 6 + (100 - Konstanz) * 0.10`)
- dazu ein **fester Sockel von 15**, der alle gleich anhebt

Der Abstand zwischen bestem und schlechtestem Auto ist damit kleiner als das Rauschen
eines einzelnen Rennens. Deshalb punktet jeder.

▶ **OFFEN, nicht angefasst:** Der Hebel wäre die Gewichtung oder der Sockel in
`simulateRace` — die zentrale Engine, die der Live-Ticker seit .18.0 miterbt. Jede
Änderung dort wirkt auf Titelverteilung, DNF-Raten und Ticker-Parität. Verwandt:
`project_presence_vs_fieldsize` (Startfeld zu klein, 19,8 gegen real 22,7) und die
offene carSpeed-Herkunft — Konstrukteurspunkte messen Auto UND Fahrer.

---

## Vakuum-Saison: die Ursache ist zerlegt (17.09.2026)

`node tests/vakuum-saison.js <jahr> [laeufe] [--quali]` fixiert das Drumherum —
echte Fahrer, echte Teams, echtes Startfeld aus F1DB — und misst, was `simulateRace`
allein daraus macht. Alles, was hier noch abweicht, kommt aus carSpeed, der
Elo-Übersetzung oder der Form-Vielfalt.

**Mechanik:** nicht das Fahrerfeld wird umgebaut, sondern `qualifyingResults` gesetzt.
Seit v0.9.17.14 gilt „das Rennen folgt der Qualifikation", also bestimmt das
Quali-Ergebnis Teilnehmer **und** Startplätze. Deckung real → Spiel: **100 %**.

### Bei IDENTISCHEM Feld punkten zu viele — das ist die Engine

Die belastbare Größe ist die **absolute Zahl der Punktefahrer**, nicht die Quote: Die
Quote hängt mechanisch an der Feldgröße (10 Punkteränge auf 22 Fahrer ergeben eine
höhere Quote als auf 29, ohne dass die Engine anders rechnet).

| bei identischem Feld, 10 Läufe | Spiel | real | Differenz |
|---|---|---|---|
| 1988 (36 Starter) | 19,5 | 17 | **+2,5 Fahrer** |
| 2010 (27 Starter) | 24,1 | 19 | **+5,1 Fahrer** |

**Das Feld ist fixiert, die Deckung 100 % — also kommt das vollständig aus
`simulateRace`.** Die Abweichung ist in der modernen Ära doppelt so groß: enge Felder
strafen eine zu flache Leistungsübersetzung härter.

⚠ **KORREKTUR einer früheren Zerlegung in diesem Dokument** (17.09.2026, am selben Tag):
Hier stand, rund 19 von 34 Punkten der Abweichung kämen aus der Feldzusammensetzung und
nur 10 aus der Rennsimulation. **Falsch.** Die Rechnung zog die Spielstand-Abweichung
(+34,0, bezogen auf *alle Fahrer einer Saison*) von der Vakuum-Abweichung (+14,9,
bezogen auf *die Starter eines Jahres*) ab — zwei verschiedene Grundgesamtheiten, die
Differenz ist bedeutungslos. Nutzer-Einwand: „die meldungen an sich nicht das problem
sondern die leistung, der erfolg, was daraus gemacht wird, deswegen das vakuum."

**Die dritte Anteils-Falle derselben Art in einer Sitzung.** Merksatz: Eine Differenz
von Differenzen ist nur zulässig, wenn ALLE vier Werte dieselbe Bezugsgruppe haben.
Sonst absolute Zahlen nehmen.

**Was die Feldgröße damit zu tun hat: sie ist ein eigenes Thema, keine Ursache.** Im
vollen Spielstand fehlen Fahrer im Feld (21,8 gegen real 29,4), was die *Quote*
zusätzlich hochtreibt. Die Leistungsverteilung wird dadurch nicht erklärt — die weicht
schon bei perfektem Feld ab.

### Was die Engine gut kann

| | 1988 | 2010 |
|---|---|---|
| Ø Rangabweichung, reale Top 10 | 1,57 Plätze | **1,22 Plätze** |
| Top-3-Überschneidung | 93 % | 63 % |
| Meister getroffen | 10 % | 60 % (fiktive Quali: 80 %) |

Die Rangfolge trifft die Engine bei korrektem Feld **sehr genau**. Das stützt den
Befund von oben: Spitze und Reihenfolge stimmen, es fehlt der Schwanz.

⚠ **Messfallen:**
- **Streichresultate.** Bis 1990 zählten nur die besten N Rennen (1988: 11 von 16).
  Das Werkzeug rechnet beide Seiten **ohne** Streichresultate, deshalb führt 1988 dort
  Prost statt Senna. „Meister getroffen 10 %" ist für solche Jahre kein Qualitätsmaß —
  Rangabweichung und Top-3 lesen.
- **Spiel-IDs sind keine F1DB-Slugs.** Die Standings-Keys tragen Zeitstempel; ohne
  Auflösung über `histId` vergleicht man Äpfel mit Birnen und bekommt Trefferquoten
  von 100 % neben Top-3 von 0 % (genau so zuerst passiert).
- **Ein Fahrer ohne gültiges `team` wird in `simulateRace` stillschweigend
  übersprungen.** Deshalb weist das Werkzeug die Deckung aus; unter ~90 % ist das
  Ergebnis wertlos.
- Indy 500 der 50er fliegt raus — anderes Rennen, eigenes Feld.

▶ **Folge für die Kalibrierung:** Der Hebel liegt in `simulateRace` — carSpeed-Gewicht,
Elo-Übersetzung, Form-Vielfalt. Zielgröße ist die **absolute Zahl der Punktefahrer**:
2,5 bis 5,1 zu viel bei fixiertem Feld, mit wachsender Abweichung in der modernen Ära.

Das Startfeld (`project_presence_vs_fieldsize`) bleibt ein **eigenes, paralleles**
Thema: Es fehlen Melder (21,8 gegen real 29,4), was die Quote zusätzlich verzerrt und
die Meldelisten betrifft — aber es erklärt die Leistungsverteilung nicht und ist keine
Vorbedingung für die Kalibrierung.

---

## Form-Vielfalt kalibriert, carSpeed-Gewicht verworfen (v0.9.18.6)

Zielgröße war die **absolute Zahl der Punktefahrer bei fixiertem Feld**
(`tests/vakuum-saison.js`). Fünf Jahre, je 10 Läufe, Deckung überall 100 %.

### Der wirksame Hebel: `BAD_DAY_PACE_FACTOR`

`_paceFactor` war ein Alles-oder-nichts-Schalter: an einem schlechten Tag fiel
`pace * 0.45` **komplett** weg — bei pace 85 sind das 38 Performance-Punkte, bei einem
kontinuierlichen Rauschen von nur ±8,5. **Der Einbruch war viermal so groß wie das
eigentliche Rauschen** und traf einen Fahrer mit Konstanz 75 in jedem vierten Rennen.
Ein Spitzenfahrer fiel dadurch regelmäßig auf Hinterbank-Niveau und räumte
Punkteplätze frei. Real bricht er nicht ein — er fällt aus (DNF, separat modelliert)
oder fährt seine Leistung.

Jetzt `0.70`: ein schlechter Tag kostet 30 % der Pace statt 100 %. Die Konstanz bleibt
voll wirksam, sie bestimmt weiter die **Häufigkeit**.

| Jahr | Baseline | nur BAD_DAY 0.70 | + carSpeed 0.26 |
|---|---|---|---|
| 1965 | +5,8 / 3,07 | +5,4 / 2,89 | +4,8 / **4,09** |
| 1988 | +2,5 / 1,57 | −0,6 / 1,73 | −0,3 / 1,59 |
| 1995 | +3,3 / 2,51 | +2,6 / 2,55 | +3,3 / 2,52 |
| 2010 | +5,1 / 1,22 | +1,5 / 1,29 | +0,7 / 1,16 |
| 2018 | **+0,0** / 1,28 | −0,2 / 1,42 | **−1,2** / 1,49 |
| **Ø Betrag** | **3,34** / 1,93 | **2,06** / 1,98 | **2,06** / **2,17** |

*(Fahrer-Differenz / Rangabweichung über die realen Top 10)*

### NEGATIVERGEBNIS: das carSpeed-Gewicht bringt nichts

`CAR_SPEED_WEIGHT` von 0.20 auf 0.26 (und 0.32) getestet: **keine** weitere
Verbesserung der Zielgröße (Ø 2,06 wie ohne), aber die Rangabweichung verschlechtert
sich von 1,98 auf 2,17 — und 2018, das ohne carSpeed-Änderung fast perfekt trifft
(−0,2), rutscht auf −1,2. Bei 0.32 wird es deutlicher (Ø −1,6 bei 1988).

Die carSpeed-**Spanne** ist also nicht das Problem und ihr Gewicht auch nicht. Der Wert
steht seit .18.6 als benannte Konstante da, damit die nächste Messung nicht wieder bei
einer Magic Number anfängt — aber **nicht ohne neue Messung anfassen**.

### ▶ OFFEN: die Ära-Abhängigkeit bleibt

1965 (+5,4) und 1995 (+2,6) liegen weiter daneben, 1988/2010/2018 treffen auf unter
einen Fahrer. Eine **globale** Konstante kann das nicht lösen — die Abweichung streut
ära- und jahresabhängig. Der nächste Schritt wäre, `BAD_DAY_PACE_FACTOR` (oder die
Streuung insgesamt) ära-abhängig zu machen, wie es `ERA_RETIREMENT_AGE` für die
Karrierelänge längst ist. Dafür braucht es mehr Messpunkte je Ära als fünf Jahre.

⚠ **Messfalle, selbst hineingelaufen:** Zuerst auf 1988 und 2010 kalibriert — dort traf
es glänzend (−0,3 / +0,7). Die Validierung auf drei **ungesehenen** Jahren zeigte die
Überanpassung: 1965 +4,8, und 2018 wurde von +0,0 auf −1,2 **verschlechtert**.
Kalibrierwerte immer auf Jahren prüfen, die nicht zur Kalibrierung dienten.

**Abgesichert:** `node tests/ticker-paritaet.js --alle 40` → 40/40 identisch.

### Gegenprobe: steigt dadurch die Dominanz des Besten?

Nutzer-Einwand zur Streuungs-Senkung: „ist form jetzt glatter als sonst, also dominanz
des besten fahrers wahrscheinlicher? das muss nicht sein, war vorher schon leicht zu
viel." Berechtigt — weniger Zufall heißt zwangsläufig konsistentere Spitze. Gemessen:

| | Punktanteil des Führenden | | | Siege des Führenden | | |
|---|---|---|---|---|---|---|
| | Baseline | .18.6 | real | Baseline | .18.6 | real |
| 1988 | 20,3 % | 22,0 % | 26,3 % | 6,1 | **7,0** | 7 |
| 2010 | 16,2 % | 16,6 % | 13,3 % | **8,5** | **7,1** | 5 |
| 2018 | 17,1 % | 16,6 % | 19,2 % | 8,7 | 8,3 | 11 |

**Die Dominanz steigt nicht.** Der Punktanteil bleibt stabil (±1,7), die Siege werden
realistischer. Mechanischer Grund: Der schlechte Tag traf vorher **alle**, auch die
Schwachen — bricht ein Hinterbänkler ein, ändert das an der Spitze nichts; bricht ein
Starker ein, gewinnt meist ein anderer Starker.

Der Eindruck „vorher schon leicht zu viel" trifft für 2010 zu (8,5 Siege statt real 5)
und wird durch den Eingriff **verbessert** (7,1).

▶ **Eigener offener Punkt, keine Folge der Änderung:** Die Siegverteilung streut
jahresabhängig — 2010 zu dominant (7,1 gegen 5), 2018 zu wenig (8,3 gegen 11). Dieselbe
Ära-Abhängigkeit wie bei den Punktefahrern.

⚠ **Regel:** Wer die Streuung in `simulateRace` senkt, misst die Dominanz mit.
`tests/vakuum-saison.js` gibt sie seit .18.6 aus — ohne diese Gegenprobe tauscht man
ein Problem gegen ein anderes.

---

## Ära-Abhängigkeit: das AUTO zählt heute mehr, nicht weniger (v0.9.18.7)

### Der Messfehler, der beinahe durchging

Erst hatte ich die **Elo-Spanne** verdächtigt: 1965 drängen sich 40 Starter auf 27
Pace-Punkten, 2018 verteilen sich 20 auf 40 (Deckung jeweils 100 %). Also eine
Feld-Spreizung eingebaut, die die Spanne auf ein festes Maß streckt.

⚠ **Nutzer-Einwand, methodisch entscheidend:** „elo in der zweiten aufgabe darf nicht
die erste aufgabe der ären beeinflussen. das darf kein Bias sein." Genau das war es:
Die Zielspanne war **am modernen Feld abgelesen** und alten Ären aufgezwungen. Die
Spreizung wurde zurückgenommen — Wirkung war ohnehin marginal (1965 Spearman 0,018 →
0,094).

⚠ **Und ein zweiter Fehler im selben Anlauf:** „Elo korreliert 1965 nur mit 0,414 mit
dem Endstand" gelesen als „Elo ist dort schlecht". Falsch — diese Korrelation misst
auch, **wie stark das Auto den Endstand bestimmt**. Ein Weltklassefahrer im schwachen
Auto landet hinten, ganz ohne Datenfehler.

### Die bias-freie Messung

Rein aus F1DB, Konstrukteurswertung gegen Fahrerwertung — ohne Spiel, ohne Elo:

| Jahr | 1965 | 1975 | 1985 | 1990 | 2010 | 2024 |
|---|---|---|---|---|---|---|
| Auto erklärt den Endstand | −0,17 | 0,38 | 0,48 | **0,93** | **0,97** | 0,94 |

**Heute bestimmt das Auto den Endstand fast vollständig, früher kaum.** Und zwar
entgegen der Technik: Die Power-to-Weight-Spanne war früher **größer** (1965 Faktor 1,8;
2025 praktisch null). Der Grund ist die Feldzusammensetzung — heute fährt jeder Vollzeit
im Werkswagen, früher mischten Gelegenheitsfahrer in guten Autos und Stammfahrer in
schlechten das Bild.

⚠ **Spearman korrekt rechnen.** Der erste Versuch ergab Werte wie −5,642 — unmöglich für
eine Korrelation. Ursache: Fahrer-Ränge (0–47) gegen Team-Ränge (0–10) gerechnet. Beide
Größen müssen Ränge über **dieselbe** Menge sein.

### `ERA_CAR_WEIGHT` statt konstantem Gewicht

Ein konstantes carSpeed-Gewicht kann beides nicht treffen: 0.26 half 2010
(Rangabweichung 1,22 → 1,16) und schadete 1965 (3,07 → 4,09). Jetzt ära-abhängig,
0.14 (50er/60er) bis 0.27 (ab 2010).

Die Werte sind **bewusst flacher** als die gemessene Korrelation: Die Messung sagt, wie
stark das Auto den **Endstand** erklärt, nicht welchen Anteil es an **einem**
Rennergebnis hat. Wer die Korrelation direkt als Gewicht einsetzt, verwechselt Wirkung
mit Ursache.

### Ergebnis über sieben Jahre, drei davon ungesehen

| | Ø Fahrer-Abweichung | Ø Spearman |
|---|---|---|
| Baseline (.18.6, konstant 0.20) | 3,03 | 0,703 |
| **`ERA_CAR_WEIGHT`** | **2,27** | 0,710 |

Validiert auf 1975, 1995, 2005 — die nicht zur Kalibrierung dienten. Größter Gewinn
1995 (+4,5 → +0,7 Fahrer).

### ▶ OFFEN: zwei Ausreißer und eine Obergrenze

- **2005 fehlen 6,5 Punktefahrer** (real 24, Spiel 17,5) — hier streut das Spiel zu
  **wenig**, das Gegenteil des ursprünglichen Befunds. Schon in der Baseline so (−7,1),
  also kein Nebeneffekt dieser Änderung.
- **1975 −3,1** Fahrer, leicht schlechter als Baseline (−2,6).
- **1965 bleibt bei Spearman 0,064.** Dort war real die Zuordnung Auto ↔ Endstand
  nahezu zufällig (−0,17); was eine Simulation dort überhaupt treffen kann, ist offen.
  Keine Streuungs- oder Gewichtsfrage mehr.

**Abgesichert:** `node tests/ticker-paritaet.js --alle 40` → 40/40 identisch.

### Nachtrag 18.09.2026: die 1960er sind ein TAL, und zwei Ausreißer sind historisch

**Ganze Kurve statt Stichjahre.** Auf die Nutzerfrage, ob eine Fünf-Jahres-Prüfung die
Nachbarjahre abdeckt, alle 75 Jahre gerechnet:

| Dekade | Ø | Ø Sprung Jahr→Jahr |
|---|---|---|
| 1960er | 0,04 | **0,25** ⚠ unruhig |
| 1970er | 0,43 | 0,12 |
| 1980er | 0,71 | 0,19 |
| 2010er | 0,92 | **0,06** |

**Ab 1970 trägt ein Stichjahr** — Nachbarjahre springen nur 0,06–0,19. Die 1960er sind
unruhig, schwanken aber um **null**: dort erklärt das Auto in keinem Jahr etwas, ein
niedriger Wert ist für alle richtig.

**1950–57 ist doch messbar** (Nutzer-Hinweis): Die Konstrukteurs-WM lässt sich nach der
1958er Regel nachrechnen — nur das bestplatzierte Auto je Konstrukteur, 8-6-4-3-2.
Ergebnis **0,28 bis 0,44, Ø 0,36** — also **deutlich höher als die 1960er (0,04)**.

⚠ **Die 1960er sind ein Tal, nicht der Beginn einer Steigung.** Ära der Kundenmotoren,
das halbe Feld fuhr Coventry Climax und war technisch gleich; in den 50ern standen
Werks-Alfa und -Mercedes gegen Privatiers. `ERA_CAR_WEIGHT` bildet das jetzt ab
(1950er 0.19, 1960er 0.15).

**NEGATIVERGEBNIS:** Die Korrektur bringt **keine messbare Verbesserung** —
Spearman-Mittel 0,626 vorher wie nachher über sechs Jahre. Behalten, weil datentreu
begründet, nicht weil sie hilft.

### Die zwei großen Ausreißer sind historische Sonderfälle

| | real | Spiel | davon nicht abbildbar |
|---|---|---|---|
| **1955** | 24 Punktefahrer | 15,0 | **4 nur durch geteilte Autos** (23 `sharedCar`-Zeilen) |
| **2005** | 24 Punktefahrer | 17,9 | **3 nur durch den 6-Starter-US-GP** (Michelin-Farce) |

Beides kann das Spiel nicht abbilden und soll es auch nicht — geteilte Fahrzeuge gibt
es nicht, und ein Rennen mit sechs Startern ist ein Einzelereignis. ⚠ **Die
Punktefahrer-Zahl ist in solchen Jahren kein faires Maß.** Ab 1965 gibt es keine
`sharedCar`-Zeilen mehr.

### Neue Kennzahl: Renn-Deckung

Die gemeldete Deckung bezog sich auf das gesetzte **Quali**. Gemessen 2005: in 6 von 19
Runden stand ein Fahrer im Quali und fehlte im Rennen — `simulateRace` filtert still
(Team nicht in `GAME_STATE.teams`, `homeOnly`, Indy-Regel, Status). Das Werkzeug weist
jetzt beides aus; **1988 erreicht nur 95,2 %**, 2005 und 2010 über 99 %.

### 18.09.2026: Der Melde-Filter verfälschte JEDE Vakuum-Messung alter Jahre

Bei der Suche nach den Ausreißern 1965 und 1975 aufgefallen: Die Renn-Deckung fiel mit
dem Alter des Jahrgangs.

| Jahr | 1955 | 1965 | 1975 | 1988 | 2005 | 2010 |
|---|---|---|---|---|---|---|
| vorher | **83,2 %** | **87,0 %** | **89,4 %** | 94,6 % | 99,4 % | 99,5 % |
| nachher | **97,2 %** | **97,3 %** | **97,9 %** | 94,3 % | 99,4 % | 99,5 % |

**Ursache: der Privateer-/Meldeplan.** In alten Ären ist fast jeder Zweite als
Privatier markiert, und `privateerEntersRace` entscheidet unabhängig vom Qualifying
über die Teilnahme — im Vakuum falsch, denn wer real in der Startaufstellung stand, hat
nachweislich teilgenommen. Das Werkzeug setzt jetzt `isPrivateer`, `scheduledRaces` und
`homeOnly` für gesetzte Fahrer zurück.

⚠ Der Grid-Cap war es **nicht**: `getGridSize` trifft die reale Starterzahl exakt, kein
Rennen lag darüber. Erst geprüft, dann verworfen.

⚠ **Alle früheren Aussagen dieses Dokuments zu 1955/1965/1975 beruhten auf einem bis zu
17 % zu kleinen Feld.** Die korrigierten Werte weichen nur wenig ab (1975 −3,5 → −3,0;
1965 +4,9 → +4,5), aber das war Glück, nicht Methode.

### ▶ WIDERLEGT: „das Spiel skaliert nicht mit den Punkteplätzen"

| Jahr | Punkteplätze (Rennen × Ränge) | real | Spiel |
|---|---|---|---|
| 1965 | 10 × 6 = 60 | 16 | **20,5** |
| 1975 | 14 × 6 = 84 | 21 | 18,0 |
| 1995 | 17 × 6 = 102 | 18 | 18,9 |
| 2005 | 19 × 8 = 152 | 24 | **16,8** |
| 2018 | 21 × 10 = 210 | 20 | 18,6 |

**Das Spiel produziert fast immer 16–19 Punktefahrer, real schwankt es zwischen 16 und
24.** Real skaliert die Zahl mit den verfügbaren Punkteplätzen — das Spiel nicht. Bei
2005 heißt das konkret: im Spiel bleiben ~10 Fahrer über 19 Rennen ohne jeden Punkt,
real nur 3.

⚠ **Diese Deutung war falsch — aus zwei Datenpunkten geschlossen.** Über alle 75 Jahre
gerechnet (Indy der 50er raus) korreliert die Zahl der Punktefahrer mit **nichts**
davon:

| Rennzahl | Punkteränge | Punkteplätze | Feld/Rennen | Starter gesamt |
|---|---|---|---|---|
| 0,256 | 0,044 | **0,119** | 0,211 | −0,062 |

1950: 6 Rennen, 5 Ränge → **16** Punktefahrer. 2024: 24 Rennen, 10 Ränge → **21**.
Vervierfachte Rennzahl, verdoppelte Ränge, fünf Fahrer mehr.

**Warum das stabil bleibt:** 1950 fuhren **46 verschiedene Starter** bei 6 Rennen, 2018
nur **20** bei 21 Rennen. Wenige Rennen mit buntem Feld und viele Rennen mit konstantem
Feld ergeben dieselbe Zahl — das kompensiert sich.

Das Spiel liegt mit 16–19 damit **im realen Band** (16–26, Schwerpunkt 17–21). Die
verbliebenen Abweichungen sind **Einzeljahre** (1965 +5,0; 2005 −3,6), kein
systematischer Skalierungsfehler. Nutzer-Einwand dazu: „immer 16-19 jede saison ergibt
kein sinn, gerade wenn es kleine kalender gibt und 24er kalender" — die Erwartung ist
intuitiv, die Realität verhält sich aber genauso flach.

▶ **Geprüft und verworfen:** Die reale DNF-Spreizung nach Teamstärke (schwache Teams
fallen öfter aus) reicht als Erklärung nicht — 2005 beträgt sie nur 5,2 Punkte, 2018
sogar 2,9.

▶ **Offen und vermutlich zusammenhängend:** 1965 bleibt bei Spearman 0,138. Dort war
real die Zuordnung Auto ↔ Endstand nahezu zufällig (−0,17), die Elo-Spanne ist mit 27
die engste aller Ären. Eine Obergrenze dessen, was dort überhaupt treffbar ist, ist
nicht bestimmt.

### 18.09.2026 (2): Indy synchronisiert und ein Spearman-Bug — beide Ausreißer weg

**Nutzeridee:** „2005er indy real und fiktion rausrechnen. und indy 500 1950-1960
sowieso, da ganz andere fahrer- und team-welt und eh fix 33 starter."

Das Werkzeug überging Indianapolis im **Spiel**, rechnete es in der **realen** Referenz
aber mit. Das Spiel wurde also gegen Punkte gemessen, die es nie erreichen konnte:

| | real MIT Indy | real OHNE | Differenz |
|---|---|---|---|
| 1950 | 22 | 16 | 6 |
| **1955** | 24 | **17** | **7** |
| 1960 | 24 | 19 | 5 |
| 2005 | 24 | 21 | 3 |

Jetzt bestimmt `gefahreneRunden()` die Menge **einmal** und beide Seiten nutzen sie.
Ausgeschlossen werden das Indy 500 der 50er (eigene Fahrer- und Teamwelt, fix 33
Startplätze) und Rennen mit unter 60 % der medianen Starterzahl — das trifft den US-GP
2005 (6 Starter nach dem Michelin-Rückzug) und sonst nichts.

### ⚠ Spearman-Bug im Werkzeug — alte Jahre waren systematisch zu schlecht

Aufgefallen, weil 1955 plötzlich **−1,520** ergab, unmöglich für eine Korrelation.
Ursache: `simRang` kam aus der vollen Spiel-Tabelle (0..m), `realRang` aus der realen
(0..n) — die d²-Formel setzt aber Permutationen **gleicher Länge** voraus. Je größer
der Längenunterschied, desto falscher: alte Jahre mit vielen Gelegenheitsfahrern traf
es am härtesten. Derselbe Fehler war zuvor schon in der Auto-Dominanz-Messung
aufgetreten und dort korrigiert worden — im Werkzeug blieb er stehen.

### Stand nach beiden Korrekturen

| Jahr | Fahrer-Differenz | Spearman (vorher → jetzt) |
|---|---|---|
| 1955 | **+0,5** | −1,52 → **0,736** |
| 1965 | +5,0 | 0,138 → **0,687** |
| 1975 | −2,3 | 0,598 → 0,714 |
| 1988 | **+0,0** | 0,801 → 0,808 |
| 1995 | +1,1 | 0,767 → 0,777 |
| 2005 | −3,6 | 0,898 → 0,941 |
| 2010 | +1,4 | 0,934 → 0,944 |
| 2018 | −1,9 | 0,946 → 0,947 |
| **Ø** | **1,98** | **0,819** (vorher ~0,63) |

**1965 war nie bei 0,12** — das war der Bug. Und 1955 ist mit korrekter Referenz
praktisch perfekt. Beide „offenen Ausreißer" der letzten Runden waren Messfehler, kein
Balancing-Problem.

▶ **Offen:** 1965 punkten weiter 5,0 Fahrer zu viel, 2005 3,6 zu wenige — das
Skalierungsmuster (das Spiel produziert immer 16–19 Punktefahrer) besteht fort.
⚠ Und: `ERA_CAR_WEIGHT` wurde gegen die **falschen** Spearman-Werte bewertet
(„keine messbare Verbesserung"). Diese Aussage ist damit hinfällig und müsste neu
geprüft werden.

### 18.09.2026 (3): ERA_CAR_WEIGHT gemessen und ZURÜCKGENOMMEN

Die Bewertung „keine messbare Verbesserung" beruhte auf den fehlerhaften
Spearman-Werten und war hinfällig. Nachgeholt mit korrigierter Messung, **zehn
Saisons** statt vier, über `tests/vakuum-batch.js`:

| | konstant 0.20 | Ära-Kurve 0.15–0.27 |
|---|---|---|
| Ø Punktefahrer-Abweichung | **2,13** | 2,56 |
| Ø Spearman | 0,809 | 0,810 |
| Ø Rangabweichung | **5,63** | 5,67 |

Die Kurve war in **6 von 10 Jahren schlechter** und verbesserte die Rangfolge nicht.
Zurückgenommen, `CAR_SPEED_WEIGHT` ist wieder konstant 0.20.

⚠ **LEHRE, die den ganzen Anlauf erklärt:** „Wie stark X den **Endstand** erklärt" ist
nicht „welches Gewicht X in der **Rennformel** braucht". Der Endstand summiert eine
ganze Saison inklusive Ausfällen, Feldstruktur und Meldeverhalten; das Gewicht wirkt
auf ein einzelnes Rennen. Ich hatte genau das in den Code-Kommentar geschrieben
(„verwechselt Wirkung mit Ursache") und es dann trotzdem getan.

**Die Auto-Dominanz-Messung selbst bleibt gültig** (real 1965 −0,17 bis 2010 0,97, aus
F1DB, bias-frei) — sie sagt nur nichts über das richtige Gewicht in `simulateRace`.

### Das Punktefahrer-Ziel ist SAISONSPEZIFISCH

Auf Nutzerwunsch legt `tests/vakuum-batch.js` das Ziel jetzt **pro Saison** fest statt
gegen eine globale Zahl zu messen. Es gibt keine gute globale Zahl: real schwanken die
Punktefahrer zwischen **16 (1965) und 26 (1982)**, ohne systematischen Zusammenhang mit
Rennzahl (0,256), Punkterängen (0,044) oder Punkteplätzen (0,119).

```
SIMCORE_FROM_INDEX=1 node tests/vakuum-batch.js              Standardsatz, 12 Saisons
SIMCORE_FROM_INDEX=1 node tests/vakuum-batch.js 1965,1988 8  eigene Auswahl
node tests/vakuum-batch.js --alle 5                          jedes 5. Jahr ab 1950
```

Für A/B denselben Aufruf zweimal: ohne `SIMCORE_FROM_INDEX` (Vorher, letzter Monolith)
und mit (Nachher, Arbeitskopie).

**Stand über zehn Saisons:** Ø Abweichung 2,13 Fahrer, Ø Spearman 0,809.
Größte Ausreißer bleiben 1965 (+5,0) und 2005 (−4,2).

⚠ **Deckungs-Warnungen ernst nehmen:** 1982 (86,8 %) und 1995 (83,3 %) liegen deutlich
unter den übrigen Jahren — dort misst das Werkzeug ein anderes Feld als das reale, die
Zahlen sind entsprechend weich. Ursache noch nicht bestimmt.

### 18.09.2026 (4): Nicht-Starter blieben im Feld — die letzte Deckungslücke

Die auffälligen Deckungswerte (1982 86,8 %, 1995 83,3 %) hatten eine einfache Ursache,
die drei falsche Fährten überlebt hat:

⚠ **Die realen Starter zu setzen genügt nicht — die ÜBRIGEN müssen raus.** Fahrer aus
`SEASON_DATA`, die ein Rennen real nicht bestritten, blieben im Kader und konkurrierten
um dieselben Startplätze. Ferrari stand 1982 dadurch mit drei Autos da, und
`simulateRace` warf einen heraus — **ohne DNQ, DNS oder sonst eine Spur**. Gilles
Villeneuve fehlte so in Rennen, die er real gefahren ist. Das Werkzeug setzt jetzt
`team = null` für alle, die in der jeweiligen Runde nicht real starteten.

Geprüft und verworfen auf dem Weg dorthin: der **Grid-Cap** (26 = 26, passt exakt), die
**Team-Kapazität** (1982 hatte real gar keine Drittwagen, max 2 Autos) und der
**Privateer-Filter** (war schon behoben).

| | 1982 | 1995 |
|---|---|---|
| Deckung vorher | 86,8 % | 83,3 % |
| **nachher** | **99,0 %** | **99,3 %** |

⚠ Die Punktefahrer-Werte wurden dadurch teils **schlechter** (1995 +1,3 → +2,2) — vorher
wurde mit einem zu kleinen Feld gemessen, das zufällig näher am realen Ergebnis lag.
Spearman verbessert sich dagegen überall (1995 0,782 → 0,826).

### Stand über zehn Saisons, alle Messfehler behoben

| Jahr | Ziel | Ist | Diff | Spearman | Deckung |
|---|---|---|---|---|---|
| 1955 | 17 | 16,0 | −1,0 | 0,777 | 96,6 % |
| 1961 | 17 | 18,8 | +1,8 | 0,623 | 96,2 % |
| 1965 | 16 | 21,5 | **+5,5** | 0,655 | 96,0 % |
| 1975 | 21 | 20,3 | −0,7 | 0,690 | 97,8 % |
| 1982 | 23 | 19,3 | **−3,7** | 0,872 | 98,9 % |
| 1988 | 17 | 17,5 | +0,5 | 0,797 | 98,8 % |
| 1995 | 18 | 20,2 | +2,2 | 0,826 | 99,3 % |
| 2005 | 21 | 18,3 | −2,7 | 0,933 | 99,3 % |
| 2010 | 19 | 20,2 | +1,2 | 0,938 | 99,5 % |
| 2018 | 20 | 19,3 | −0,7 | 0,936 | 99,5 % |
| **Ø** | | | **2,00** | **0,805** | |

Sechs von zehn Saisons liegen unter 1,5 Fahrern Abweichung. Die Ausreißer sind **1965
(+5,5)** und **1982 (−3,7)**, und das Vorzeichen kippt — es ist also kein einheitlicher
Fehler.

▶ **Offen:** Die 50er/60er erreichen weiterhin nur 96 % Deckung (gegen 99 % ab 1982).
Dort geht noch etwas verloren, das keine der geprüften Ursachen erklärt.

### 18.09.2026 (5): VOLLAUF über alle 75 Saisons — „das Spiel zieht zur Mitte"

⚠⚠ **Am 24.09.2026 zum größten Teil als Messartefakt erkannt** (s. Abschnitt „Die
Rauschgrenze" unten). Der reale Wert ist EINE Saison mit ihrem ganzen Zufall, der
Spielwert ein Mittel über 4 Läufe. Das allein ergibt bei den Fahrern r ≈ −0,70 und
einen mittleren Fehler von ~1,71. Die Fahrer-Kennzahl liegt damit an ihrer
Rauschgrenze. Bei den Teams bleibt ein echter Rest.

Nutzerfrage: „sind das einzelfälle die besonders hervorstechen, weil du wirklich jedes
jahr geprüft hast?" Nein — es waren zehn von 75 Jahren. Nachgeholt mit
`node tests/vakuum-batch.js --alle 1 4`, ausgewertet mit `tests/vakuum-verteilung.js`.

⚠ **Die benannten Ausreißer waren Stichproben-Artefakte.** 1982 liegt nicht einmal
unter den zehn größten, 1965 nur auf Platz 6. Der tatsächliche Ausreißer ist **1989 mit
−11,8** (Ziel 29, Ist 17,3) — das Jahr mit 39 Meldungen und Vor-Qualifikation, in dem
real 29 verschiedene Fahrer punkteten.

**Die Verteilung ist gesund:** Ø Betrag 1,84 · Median 1,5 · 67 % aller Jahre unter 2
Fahrern · nur eines über 6. Vorzeichenbehaftet −0,08, also kein globaler Drall.

### Der stärkste Zusammenhang im Datensatz

| Abweichung korreliert mit | |
|---|---|
| Jahr | −0,286 |
| Rennzahl | −0,270 |
| Renn-Deckung | −0,218 |
| **Ziel-Zahl** | **−0,703** |

**−0,703 heißt: das Spiel zieht zur Mitte.** Wo real viele punkten, hat es zu wenige; wo
real wenige punkten, zu viele. Real reicht die Spanne von **12 (1953) bis 29 (1989)**,
das Spiel bleibt bei 16–21.

⚠ **Damit ist meine eigene Widerlegung von vorhin zu kurz gegriffen.** Der Nutzer hatte
eingewandt, „immer 16-19 jede saison ergibt kein sinn". Ich hatte gezeigt, dass die
reale Zahl nicht mit Rennzahl oder Punkterängen skaliert — und daraus geschlossen, das
Spiel liege im Band. Richtig ist: Sie skaliert nicht mit dem **Kalender**, schwankt aber
sehr wohl (12 bis 29), und dieser Schwankung folgt das Spiel nicht. Der Einwand war
berechtigt, nur die vermutete Ursache nicht.

### Zweites Muster: die Engine wird mit dem Jahr besser

| Dekade | Ø Diff | Ø Spearman | Ø Deckung |
|---|---|---|---|
| 1950er | **+1,55** | 0,680 | 96,6 % |
| 1960er | +1,28 | 0,744 | 96,3 % |
| 1970er | −0,80 | 0,758 | 98,0 % |
| 1980er | **−1,93** | 0,865 | 98,8 % |
| 1990er | −0,74 | 0,865 | 99,1 % |
| 2000er | −0,23 | 0,926 | 99,2 % |
| 2010er | +0,67 | 0,947 | 99,3 % |
| 2020er | −0,78 | 0,950 | 99,2 % |

Spearman steigt **monoton** mit dem Jahr (Korrelation 0,848), von 0,680 auf 0,950. Und
das Vorzeichen der Abweichung kippt um 1970 von plus nach minus — alte Jahre zu viele
Punktefahrer, 1970–90er zu wenige.

▶ **Der eigentliche offene Punkt ist damit benannt:** nicht einzelne Jahre, sondern die
fehlende Spreizung. Das Spiel müsste in Saisons wie 1989 (29 reale Punktefahrer) deutlich
breiter streuen und in Saisons wie 1953 (12) enger. Werkzeug für jeden Versuch:
`tests/vakuum-batch.js --alle 1 4` plus `tests/vakuum-verteilung.js` — Stichproben haben
hier zweimal in die Irre geführt.

### 18.09.2026 (6): Die Ursache sind die TEAMS, nicht die Fahrerstreuung

Der Vollauf hatte „das Spiel zieht zur Mitte" ergeben (Korrelation −0,703). Die Frage
war, **wodurch** die reale Zahl schwankt. Über 75 Jahre gemessen:

| Die reale Punktefahrer-Zahl korreliert mit | |
|---|---|
| **Teams mit Punkten** | **0,602** |
| **Top-2-Konzentration** | **−0,555** |
| Teams gesamt | 0,312 |
| Rennzahl | 0,276 |
| Feld pro Rennen | 0,229 |
| DNF-Quote | 0,139 |

**Die Zahl der Punktefahrer ist im Kern die Zahl der punktenden TEAMS.** 1953 punkten
3 Teams und 12 Fahrer; 1989 sind es 16 Teams und 29 Fahrer. Wer die Fahrerzahl treffen
will, muss die Teams treffen.

Und genau dort weicht das Spiel ab:

| Jahr | Teams mit Punkten Spiel → real | Fahrer-Differenz |
|---|---|---|
| 1953 | 6 → 3 (**+3**) | +3,3 |
| 1965 | 6 → 6 (0) | +4,5 |
| 1978 | 10 → 14 (**−4**) | −4,8 |
| 1989 | 11 → 16 (**−5**) | −11,8 |
| 2005 | 9 → 9 (0) | −2,7 |
| 2010 | 10 → 9 (+1) | +2,3 |

Gleiches Vorzeichen, gleiche Größenordnung. **Bei großen Feldern punkten im Spiel zu
wenige Teams** — 1989 nur 11 von 20 statt real 16. Bei zehn Teams (moderne Ära) stimmt
es. Die Kennzahl steht seit .18.9 in `tests/vakuum-saison.js`.

### Geprüft und verworfen: die Ausfälle

Naheliegende Erklärung wäre, dass im Spiel die schwachen Teams zu oft ausfallen und
deshalb nicht punkten. **Das Gegenteil ist der Fall:**

| DNF-Spreizung (schwach minus stark) | Spiel | real |
|---|---|---|
| 1989 | 14,3 | **21,5** |
| 2010 | 7,4 | **21,9** |
| 1978 | **−4,6** | 14,2 |

Im Spiel fallen schwache Teams **zu selten** aus, 1978 sogar seltener als die starken.
Sie kommen also häufiger ins Ziel als real — und punkten trotzdem nicht. Damit bleibt
nur die **Leistungslücke**: die schwachen Autos sind zu weit weg, um bei einem
Ausfall vorne hineinzurutschen.

▶ **Das ist ein eigenständiger Realismus-Befund**, unabhängig vom Punktefahrer-Thema:
die DNF-Verteilung nach Teamstärke ist im Spiel viel zu flach (7–14 statt real ~21).

▶ **Nächster Schritt:** nicht an der Fahrer-Streuung drehen (die ist über
`BAD_DAY_PACE_FACTOR` kalibriert), sondern an der **Spreizung der Teamstärken bei
großen Feldern**. Zielgröße ist „Teams mit Punkten" je Saison, nicht die Fahrerzahl.

### 18.09.2026 (7): Die Leistungspyramide — `TEAM_PYRAMID_EXP` von 1.8 auf 1.4

Die Ursache der fehlenden punktenden Teams steckt in einer **Setzung, nicht in Daten**.
`carSpeed` wird nicht roh aus `SEASON_DATA` genommen, sondern aus dem **Rang** neu
berechnet (index.html:10338 und ~24262, seit v0.9.14.53):

```
carSpeed = 60 + pos^EXP * (max - 60)      pos = 1 beim Besten, 0 beim Letzten
```

⚠ **Der Exponent wirkt feldgrößenabhängig** — das erklärt, warum die Abweichung
ausgerechnet bei großen Feldern auftrat:

| | Teams mit carSpeed ≤ 65 |
|---|---|
| 10 Teams, exp 1.8 | 4 |
| **20 Teams, exp 1.8** | **7** |
| 20 Teams, exp 1.4 | 5 |

Bei 20 Teams landeten die Plätze 12–20 zwischen 60 und 65 — praktisch ununterscheidbar
und alle chancenlos. Bei 10 Teams traf das kaum jemanden, deshalb passten die modernen
Jahre.

⚠⚠ **Die ursprünglich hier stehende A/B-Tabelle war UNGÜLTIG** (1,33 → 1,09, „1989 von
−10,8 auf −4,5"). Sie maß nicht die Fahrer, sondern die **Teams** — Ursache und
Richtigstellung stehen im nächsten Abschnitt. Ersetzt durch den Vollauf unten.

**A/B über alle 75 Saisons, je vier Läufe, gepaart (19.09.2026):**

| | EXP 1.8 | EXP 1.4 | Delta | SE | t |
|---|---|---|---|---|---|
| Ø \|Punktefahrer-Abweichung\| | 1,88 | 1,76 | −0,12 | 0,13 | **−0,94** |
| Ø \|Team-Abweichung\| | 0,97 | 0,88 | −0,10 | 0,06 | **−1,51** |
| Ø Spearman | 0,832 | 0,834 | +0,002 | 0,003 | 0,52 |

**Kein Effekt ist nachweisbar.** Alle drei Kennzahlen zeigen in die gewünschte Richtung,
keine erreicht Signifikanz; bei den Fahrern ist exp 1.4 in 34 Jahren besser und in 36
schlechter. Der große Sprung, den die alte Tabelle zeigte, existiert nicht.

**Warum der Wert trotzdem stehen bleibt:** 1.4 ist nicht schlechter, und die
Feldgrößen-Analyse oben gilt unabhängig von der Messung — bei 20 Teams liegen unter exp
1.8 sieben Teams im ununterscheidbaren Band 60–65, unter 1.4 nur fünf. Das ist ein
Argument aus der Formel, kein gemessener Gewinn. Wer ihn misst, braucht mehr als vier
Läufe je Jahr: bei SE 0,13 verschwindet ein Effekt dieser Größe im Rauschen.

**Das ursprüngliche Problem bleibt gelöst:** Der Exponent kam in v0.9.14.53, weil rohe
SD-Werte für Backmarker zu hoch waren (Minardi 2001 pace 78 → 60). Der **letzte Platz
liegt bei jedem Exponenten exakt auf dem Floor 60** (pos = 0) — angehoben wird nur das
Mittelfeld.

Beide Fundstellen nutzen jetzt die gemeinsamen Konstanten `TEAM_PYRAMID_FLOOR` und
`TEAM_PYRAMID_EXP`; vorher stand der Wert zweimal als Magic Number im Code, einmal davon
mit einem toten Kommentar („Variant B: _EXP = 2.0").

▶ **Offen:** 1989 bleibt mit **−9,3** der größte Ausreißer (nicht −4,5, das war die
Team-Zahl), 1991 mit −6,0 der zweite, 1965 mit +5,0 unverändert.

---

### 19.09.2026: Der Parser des Batch maß zwei Sitzungen lang die TEAMS

**Wie es passierte.** `vakuum-batch.js` liest die Zahlen aus der Textausgabe von
`vakuum-saison.js`. Am 18.09. kam dort die Zeile „Teams mit Punkten" **vor** die Zeile
„Fahrer mit Punkten" — ab da gab es zwei Zeilen der Form `Spiel X real Y Differenz Z`,
und beide Muster des Batch trafen die erste davon:

| Muster | fand | Folge |
|---|---|---|
| `/real\s+(\d+)\s+Differenz/` | Teams-Zeile | Teamzahl in der Ziel-Spalte |
| `/Differenz\s+([+-][\d.]+)\s+Fahrer/` | Teams-Zeile | **Ø Betrag des ganzen Vollaufs falsch** |

Das zweite ist die Falle, die zweimal durchging: **`\s` matcht auch den Zeilenumbruch.**
Das Muster verlangte das Wort „Fahrer" — und fand die Team-Differenz, gefolgt von
`\n  Fahrer mit Punkten`. Ein Regex, der nach „Fahrer" sucht, kann die Teamzahl liefern.

Am 18.09. fiel nur der erste Fehler auf (die Ziel-Spalte sah unstimmig aus). Ich hielt
den Ø Betrag daraufhin für unbetroffen, „weil er aus einem anderen Regex stammt" — er
stammte aus dem zweiten, der denselben Fehler hatte.

**Tragweite, über `git log` eingegrenzt** (die Teams-Zeile kam mit `9d0e364`, 21:31):

| Messung | gültig? |
|---|---|
| Vollauf Ø 1,84 (Abschnitt 5, 21:01 gelaufen) | ✅ echte Fahrer-Zahl |
| A/B `TEAM_PYRAMID_EXP` 1,33 → 1,09 (Abschnitt 7) | ❌ maß Teams |
| Vollauf Ø 0,99, „kein Jahr über 4" | ❌ maß Teams |

Der gefeierte Sprung „1,84 → 0,99" verglich eine Fahrer-Zahl mit einer Team-Zahl.

**Gegenprobe, die es sofort gezeigt hätte:** In jeder Tabellenzeile muss
`Ist − Ziel = Diff` aufgehen. Bei 1951 stand „Ziel 11, Ist 14,3, Diff +2,0" — und +2,0
war die Team-Differenz 5,0 minus 3. Diese Prüfung kostet einen Blick.

**Behoben:** alle Muster auf `Fahrer mit Punkten:` verankert, und die Teams laufen als
eigene Spalte `Ist/Ziel` in der Tabelle mit — eine Verwechslung ist damit sichtbar statt
still.

### Der korrigierte Vollauf (exp 1.4, 75 Saisons × 4 Läufe)

| | Wert |
|---|---|
| Ø Betrag | **1,76** Fahrer |
| Median | 1,3 |
| Standardabw. | 2,33 |
| vorzeichenbehaftet | +0,08 — kein globaler Drall |
| Ø Spearman | 0,832 |
| größte Abweichung | 1989 −9,3 · 1991 −6,0 · 1965 +5,0 |

69 % aller Jahre liegen unter 2 Fahrern Abweichung, zwei über 6. **Beide Muster aus
Abschnitt 5 überleben die Korrektur unverändert:**

- **„Das Spiel zieht zur Mitte"** — Korrelation der Abweichung mit der Ziel-Zahl −0,646
- **Die Engine wird mit dem Jahr besser** — Ø\|Diff\| von 2,06 (1950er) auf 0,76
  (2020er), Spearman von 0,667 auf 0,949

### Und die Kette „Teams → Fahrer" hält, jetzt über 75 Jahre

Abschnitt 6 hatte sie aus sechs Jahren geschlossen. Mit der Teams-Spalte im Vollauf ist
sie nachgerechnet:

| | |
|---|---|
| Team-Differenz ↔ Fahrer-Differenz | **r = 0,709** |
| \|Team-Diff\| ↔ \|Fahrer-Diff\| | r = 0,542 |
| relativer Fehler Teams | 0,88 von 9,1 = **9,6 %** |
| relativer Fehler Fahrer | 1,76 von 19,4 = **9,1 %** |
| **Punktefahrer je punktendem Team** | **Spiel 2,18 · real 2,12** |

Die letzte Zeile ist der Beleg: **innerhalb der punktenden Teams verteilt die Engine die
Fahrer korrekt.** Der relative Fehler ist auf beiden Ebenen praktisch gleich groß — die
Fahrer-Abweichung ist die durchgereichte Team-Abweichung, kein zusätzlicher Fehler in
der Fahrer-Streuung. Wer an `BAD_DAY_PACE_FACTOR` oder der Pace-Streuung dreht, um die
Punktefahrer-Zahl zu treffen, arbeitet an der falschen Stelle.

---

### 23.09.2026: 1989: `ERA_DNF_RATES` ist in den Vor-Quali-Jahren zu niedrig

Gefragt war, warum 1989 mit −9,3 am stärksten abweicht. Das ist reine Datenanalyse gegen
F1DB, kein Spiel-Lauf.

**Was 1989 real besonders macht** (nur echte Starter, DNQ/DNPQ/DNS/EX herausgefiltert):

| | Starter/Rennen | DNF-Quote | im Ziel/Rennen | Punktefahrer | davon nur 1× | Top-2-Anteil Punkteplätze |
|---|---|---|---|---|---|---|
| 1988 | 26,0 | 46,4 % | 13,9 | 17 | 3 | 46 % |
| **1989** | 26,0 | **53,8 %** | **12,0** | **29** | **11** | **39 %** |
| 1990 | 25,9 | 47,1 % | 13,7 | 18 | 5 | 43 % |
| 1991 | 25,9 | 46,5 % | 13,9 | 24 | 11 | 46 % |

Nur zwölf Autos kamen im Schnitt ins Ziel, bei sechs Punkteplätzen. Wer 1989 durchkam,
landete oft schon in den Punkten. Das erklärt 11 Fahrer mit einer einzigen Punkteplatzierung
und 16 punktende Teams.

**Im Spiel steht für 1989 aber 37 %** (`ERA_DNF_RATES`, index.html ~5542). Die Rate wird
in `simulateRace` je Starter und Rennen angewandt (~14266). Das Spiel bringt also etwa
16 statt 12 Autos ins Ziel.

| Jahr | Tabelle | real, Nenner = Starter | real, Nenner = alle Meldungen |
|---|---|---|---|
| 1984 | 62 | 60,0 | 57,4 |
| 1988 | 42 | 46,4 | 38,9 |
| **1989** | **37** | **53,8** | **36,1** |
| 1990 | 39 | 47,1 | 36,0 |
| 1991 | 39 | 46,5 | 35,8 |

Von 1988 bis 1991 passt die Tabelle zur Variante **mit DNQ/DNPQ im Nenner**. In
anderen Jahren passt sie besser zur Starter-Variante. `generate-truth.js` hat die
Quote also offenbar nicht einheitlich berechnet. Über alle 76 Jahre liegt die Tabelle
im Schnitt ~4 Punkte neben jeder der vier geprüften Zählweisen. Der große Fehler sitzt
genau dort, wo es viele Nicht-Qualifizierte gab. 1989 hatte 38,8 Meldungen auf 26
Startplätze.

⚠ **Messfalle:** `feld-spreizung.js` meldete am 16.09.2026 „DNF-Quote trifft bereits".
Das stimmt **je Ära**. Der Ära-Schnitt deckt ein einzelnes Jahr mit −17 Punkten zu.

**Passt zu beiden großen Ausreißern:** 1989 (−9,3) und 1991 (−6,0) haben beide eine
deutlich zu niedrige Tabellenrate (−17 bzw. −7,5 Punkte).

**A/B 1989, Tabellenwert 37 → 54, je 20 Läufe** (`SIMCORE_FROM_INDEX=1 node
tests/vakuum-saison.js 1989 20`):

| | 37 % | **54 %** | real |
|---|---|---|---|
| Fahrer mit Punkten | 18,8 (−10,2) | **24,3 (−4,7)** | 29 |
| Teams mit Punkten | 11,4 (−4,6) | **13,4 (−2,6)** | 16 |
| Punktequote | 40,2 % | 51,4 % | 61,7 % |
| Spearman Endstand | 0,767 | 0,753 | |
| Punktanteil des Führenden | 21,2 % | 19,1 % | 20,3 % |

Die Ausfallrate erklärt gut die Hälfte der Lücke. Der Rest von −4,7 Fahrern und
−2,6 Teams passt zur Teams-Erklärung (Leistungslücke, flache DNF-Spreizung nach
Teamstärke). Spearman sinkt um 0,014: bei mehr Ausfällen erwartbar, Standardfehler aber
nicht bestimmt.

### Danach: die ganze Tabelle einheitlich neu berechnet

**Wurzel:** `tests/generate-truth.js` teilte durch **alle** Ergebniszeilen, also samt
DNQ/DNPQ, und zählte im Zähler nur `reasonRetired`. Jetzt gilt: Nenner = echte
Starter, Zähler = jede Nicht-Zahl in `positionText` (DNF/NC/DSQ), Indy 500 1950–60
ausgenommen. F1DB gibt dort allen 33 Startern eine Platzziffer, deshalb würde es die
50er künstlich senken (mit Indy 1950: 41 %, ohne: 53 %). `ERA_DNF_RATES` ist daraus
erzeugt. In `historical_truth.json` hat sich nur das Feld `dnfRate` geändert.

Die größten Änderungen: 1950er +3 bis +7, 1978 38 → 46, 1981 40 → 49, 1989 37 → 54,
1990/91 39 → 47, 1960–65 −3 bis −5, ab 2000 durchgehend −2 bis −5.

**A/B alle 75 Saisons × 4 Läufe, gepaart** (Monolith v0.9.18.10 gegen `index.html`,
`tests/output/vakuum-alle-dnf-alt.txt` / `-neu.txt`):

| | alt | neu | Delta | SE | t |
|---|---|---|---|---|---|
| Ø \|Punktefahrer-Abw.\| | 1,80 | 1,80 | −0,003 | 0,14 | −0,02 |
| Ø \|Team-Abw.\| | 0,92 | 0,89 | −0,035 | 0,065 | −0,53 |
| Ø Spearman | 0,833 | 0,831 | −0,002 | 0,004 | −0,61 |
| vorzeichenbehaftet | −0,11 | −0,02 | | | |
| Korrelation Diff ↔ Ziel | −0,631 | −0,592 | | | |

**Global kein messbarer Effekt** (35 Jahre besser, 32 schlechter). Die korrigierten
Vor-Quali-Jahre verbessern sich alle in die erwartete Richtung:

| Jahr | Rate alt → neu | Punktefahrer-Diff alt → neu | Teams Ist/Ziel alt → neu |
|---|---|---|---|
| 1978 | 38 → 46 | −4,8 → −1,5 | 10,8 → 12,0 / 14 |
| 1988 | 42 → 46 | −1,5 → +0,3 | 9,3 → 10,3 / 10 |
| **1989** | **37 → 54** | **−8,8 → −4,8** | 12,5 → 13,5 / 16 |
| 1990 | 39 → 47 | −1,8 → +0,3 | 9,8 → 10,8 / 10 |
| 1991 | 39 → 47 | −4,5 → −3,0 | 11,0 → 11,3 / 12 |

⚠ **Einzeljahre bei 4 Läufen sind weich.** 1953 ging von +4,0 auf +6,3, obwohl die
Rate nur 45 → 50 stieg. Belastbar ist das Muster über die fünf Jahre hinweg, nicht die
einzelne Zahl. Die Korrektur bleibt drin, weil sie einen Zählfehler behebt. Das
Punktefahrer-Problem insgesamt (Ø 1,80, Zug zur Mitte −0,59) löst sie nicht: das
bleibt die Teams-Frage. Ticker-Parität 40/40 geprüft.

---

### 23.09.2026 (2): Die Ausfall-Spreizung nach Teamstärke — die Formel trifft die Hälfte

Frage des Nutzers: statt einzelner Saisons eine globale Korrektur. Die Jahresrate ist
nur die Grundlinie. Wie sie sich auf die Teams verteilt, entscheidet in `simulateRace`
`dnf = Jahresrate × (1 + (Ø reliability − team.reliability) / 100)`.

Werkzeug `SIMCORE_FROM_INDEX=1 node tests/dnf-spreizung.js`, analytisch und ohne
Würfel. Stärke = mittlerer realer Startplatz, Drittel je Jahr, Teams ab 8 Starts:

| Ära | real stark | real schwach | **real Spreiz.** | Faktor | Formel Spreiz. | r(rel, DNF) | r(rel, Stärke) | Unfall-Anteil | Spreiz. mech / Unfall |
|---|---|---|---|---|---|---|---|---|---|
| 1950er | 39,3 | 57,1 | **17,8** | 1,45 | 6,3 | −0,71 | 0,60 | 13 % | 19,3 / −1,5 |
| 1960er | 46,0 | 50,0 | **4,0** | 1,09 | 1,5 | −0,61 | 0,11 | 13 % | 3,7 / 0,3 |
| 1970er | 37,0 | 49,3 | **12,3** | 1,33 | 7,7 | −0,40 | 0,77 | 24 % | 13,5 / −1,2 |
| 1980er | 44,3 | 56,8 | **12,5** | 1,28 | 11,0 | −0,64 | 0,86 | 23 % | 9,5 / 3,0 |
| 1990er | 35,8 | 55,7 | **19,9** | 1,56 | 10,4 | −0,65 | 0,94 | 35 % | 17,3 / 2,6 |
| 2000er | 20,4 | 36,2 | **15,8** | 1,77 | 5,7 | −0,67 | 0,93 | 38 % | 11,1 / 4,7 |
| 2010er | 11,4 | 20,6 | **9,2** | 1,81 | 3,6 | −0,55 | 0,96 | 40 % | 7,4 / 1,9 |
| 2020er | 8,8 | 14,2 | **5,4** | 1,62 | 2,4 | −0,49 | 0,95 | 51 % | 2,9 / 2,5 |
| **alle** | 31,5 | 44,0 | **12,5** | 1,40 | **6,3** | −0,59 | 0,76 | 29 % | **11,0 / 1,5** |

**Vier Befunde:**

1. **Die Formel liefert die halbe Spreizung** (6,3 statt 12,5 Punkte). Am stärksten
   fehlt sie in den 1950ern, 1990ern, 2000ern und 2010ern (Faktor 2,5–2,8). Die
   1980er passen (11,0 gegen 12,5), die 1960er sind real selbst flach. Der Hebel ist
   die **Amplitude** des reliability-Terms, nicht die Jahresrate.
2. **Die Spreizung ist mechanisch, nicht fahrerisch.** Schwache Teams haben 11 Punkte
   mehr technische Ausfälle, aber nur 1,5 Punkte mehr Unfälle. Unfälle verteilen sich
   fast gleich über das Feld.
3. **Der Unfall-Anteil ist stark ära-abhängig:** 13 % in den 50ern/60ern, 51 % heute.
   Das Spiel würfelt den Typ 50/50 (`dnfType`), für frühe Epochen also viel zu viele
   Unfälle. Das betrifft die Darstellung und möglicherweise Todesfälle, nicht die
   Ergebnisse.
4. **`reliability` taugt als Vorhersage** (r = −0,59 mit der echten DNF-Quote), ist
   ab 1990 aber praktisch eine Kopie der Stärke (r = 0,93–0,96). In den 1960ern ist
   sie unabhängig (0,11). Eine stärkere Amplitude verstärkt damit ab 1990 auch den
   Abstand stark/schwach im Ergebnis.

⚠ **Messfalle:** Stärke über Punkte oder WM-Rang zu definieren, wäre zirkulär.
Unzuverlässige Teams verlieren Punkte und landen dadurch im schwachen Drittel. Deshalb
wird hier der Startplatz genommen.

⚠ Einzelwerte streuen. 1989 fiel Ferrari real zu 70 % aus, bei reliability 83. Die
Tabelle ist ein Mittel über die Jahre, kein Maßstab je Team.

---

### 23.09.2026 (3): Unfall oder Technik — der 50/50-Würfel ist ersetzt

`simulateRace` würfelte die Ausfallart 50/50. Real liegt der Unfall-Anteil (Unfall,
Kollision, Dreher an allen Ausfällen, echte Starter, ohne Indy 500) je Saison zwischen
**2 % (1965)** und **63 % (2008)**: in den 50ern/60ern meist 8–19 %, 1975–82 25–38 %,
1983–88 14–22 %, ab 1992 35–45 %, seit 2020 47–60 %. Jetzt steht er je Jahr in
`ERA_DNF_ACCIDENT_SHARE` (Quelle `generate-truth.js` → `accidentShare`).

**Folge für die Todesfälle:** Der Todes-Check wählt sein Opfer nur unter den
Unfall-Ausfällen. Gibt es keinen, fällt ein geplanter Tod still weg. Bei ~1,3
Unfall-Ausfällen je Rennen in den 50ern passiert das in gut einem Viertel der Rennen.

`node tests/death-era-mc.js 10`, 1950–2025, alt = Monolith v0.9.18.11:

| Dekade | F1-WM alt | F1-WM neu |
|---|---|---|
| 1950er | 5,7 | 5,0 |
| 1960er | 6,8 | **4,3** |
| 1970er | 9,1 | 8,3 |
| 1980er | 2,1 | 1,7 |
| 1990er | 2,8 | 1,9 |
| **Summe** | **26,5** | **21,2 (−20 %)** |

Das passt zur Überschlagsrechnung; die 1960er trifft es am stärksten (1965: 2 %
Unfälle). Bei 10 Läufen ist die Summe etwa 2,4 Standardfehler auseinander.

⚠ Messfalle: `death-era-mc.js` setzt `SIMCORE_FROM_INDEX` fest auf 1. Für ein A/B gegen
den Monolithen braucht es eine Kopie ohne diese Zeile.

Beobachtung am Rand, schon vor der Änderung so: F1 gesamt 67,7 Tote gegen real ~40.
Der Überschuss kommt vor allem aus F1-nonWM (41,2).

### 23.09.2026 (4): Todesfälle je Ebene neu abgeglichen

Auftrag des Nutzers: Die Todeszahl jeder Ebene muss realistisch bleiben. Keine festen
Toten je Rennen (kein „Spa 1960 hat einen Toten"), sondern Ära-Raten.

**1. Tote im Rennen entstehen jetzt aus Unfällen.** Jeder Unfall-Ausfall würfelt mit
`ERA_ACCIDENT_LETHALITY` (je Dekade = reale Renntote ÷ reale Unfall-Ausfälle, F1DB,
ohne Indy 500): 50er 3/98 · 60er 6/109 · 70er 5/383 · 80er 1/466 · 90er 1/621 ·
00er 0/387 · 10er 1/293 · 20er 0/154. Der Wochenend-Würfel (`ERA_DEATH_RATES`)
trägt außer beim Indy 500 nur noch Training und Qualifying. Je Dekade und nicht je
Jahrfünft, weil ein Jahrfünft nur 0–3 Tote hat. ⚠ Nenner nur Unfall-**Ausfälle**,
weil im Spiel nur ein Ausfall ein Unfall sein kann. Mit gewerteten Unfällen wären es
~7 % weniger Tote.

**2. Gastfahrer-Tote wurden nie gebucht.** Indy-Nachrücker und Lückenfüller kommen aus
dem Reserve-Pool und stehen nicht im Kader. Traf es einen, stand „Fatal" im Ergebnis,
aber der Tod fehlte in `seasonDeaths`, und der Fahrer lebte weiter. Beim Indy 500
war das ein Viertel der Renntoten (Sonde über 1000 Wochenenden 1955: 103 von 427
markierten Opfern waren Gäste). Rennen, Training und Qualifying buchen den Tod jetzt
über `_bucheGastTod`, ohne Ersatzfahrer (kein Kaderplatz).

**3. Die Anker für Tote außerhalb der WM waren zu niedrig.** Neu hergeleitet aus F1DB:
Fahrer mit WM-Start, gestorben zwischen erstem Einsatz und letztem Einsatz +1, ohne
WM-Tote. F1DB kennt keine Todesursachen. Nicht-Rennbezug ist aus Kenntnis abgezogen
und hier nachprüfbar:

| Dekade | real | Namen (abgezogen) |
|---|---|---|
| 50er | 12 | Sommer, Fry, Fagioli, Bonetto, de Tornaco, Ascari, Beauman, Rosier, de Portago, Castellotti, MacKay-Fraser, Bueb (− Claes Krankheit, − Hawthorn Straße) |
| 60er | 13 | Chimeri, Blanchard, Schell, Cabianca, Ryan, R. Rodríguez, Anderson, Russo, Clark, Scarfiotti, Spence, L. Bianchi, Solana (− Barth Krankheit) |
| 70er | 7 | McLaren, Giunti, Siffert, P. Rodríguez, Bonnier, Revson, McGuire (− G. Hill, Brise, Pace Flugzeug, − Nilsson Krankheit) |
| 80er | 4 | Depailler, Winkelhock, Bellof, de Angelis |

Alter Anker im Werkzeug: 6/4/5/2. **Indy-Fahrer** (nur Indy-500-Starts, gestorben
1950–61): 30, davon 7 am 500-Wochenende im Mai (Vukovich, O'Connor, Scarborough, Miller,
Ayulo, Andrews, Unser), − Hellings Flugzeug → **~22 in AAA/USAC/Sprint/Midget** statt
des alten Ankers ~9. ⚠ Diese Zuordnung stammt aus Kenntnis, nicht aus einer Datenbank.

**Raten:** `ERA_NONWM_F1_DEATH_RATE` 1950–59 0,020 → 0,0125,
`ERA_NONWM_INDY_DEATH_RATE` 0,040 → 0,100. Die übrigen Dekaden trafen bereits.

**Ergebnis** `node tests/death-era-mc.js 10`, vorher = Monolith mit 50/50-Würfel:

| Ebene | vorher | nachher | real |
|---|---|---|---|
| WM-Rennen | – | 14,1–15,7 (2 Läufe) | 17 |
| WM Training/Quali | – | 5,4–5,6 | 8 |
| außerhalb WM (F1) | 41,2 | 38,1 | 36 |
| Indy 500 | 3,4 | 6,1–6,6 | 7 |
| Indy außerhalb | 7,8 | 20,8 | ~22 |
| **F1 je Dekade 50er–80er** | 24,4 / 17,9 / 16,6 / 5,7 | 17,2 / 19,1 / 13,5 / 5,4 | 16 / 21 / 15 / 6 |

Alle Dekaden liegen jetzt innerhalb ±2. Die WM-Rennen liegen je Dekade im Rauschen
(3,1/3 · 5,8/6 · 4,6/5), in der Summe aber in beiden Läufen unter 17. Training/Quali
liegt mit ~5,5 unter real 8. Beides nicht nachgeregelt: bei ±1,2 Standardfehler und
Einzelzahlen von 1–3 je Dekade würde man auf Rauschen kalibrieren.

Indy 500: Restlücke ~8 %. So oft gibt es im Rennen keinen Unfall-Ausfall, in dem das
geplante Opfer liegen könnte.

### 24.09.2026: `DNF_REL_SPREAD` = 2 — Ausfälle realistisch verteilt, Ergebnis schlechter

Die Formel steht jetzt einmal, in `dnfTeamFaktor(avgRel, rel)` = `1 + DNF_REL_SPREAD ×
(avgRel − rel) / 100`. Vorher stand sie doppelt: in `simulateRace` und in der DNF-Vorschau.

**Spreizung schwach − stark mit Faktor 2** (`dnf-spreizung.js`, analytisch):

| Ära | real | Faktor 1 | Faktor 2 |
|---|---|---|---|
| 1950er | 17,8 | 6,3 | 12,7 |
| 1960er | 4,0 | 1,5 | 2,9 |
| 1970er | 12,3 | 7,7 | 15,5 |
| 1980er | 12,5 | 11,0 | **22,1** |
| 1990er | 19,9 | 10,4 | 20,8 |
| 2000er | 15,8 | 5,7 | 11,5 |
| 2010er | 9,2 | 3,6 | 7,3 |
| **alle** | **12,5** | 6,3 | **12,6** |

Im Mittel getroffen, aber die 80er fast doppelt und die 70er zu breit.

**A/B Vollauf 75 Saisons × 4, gepaart** (Monolith v0.9.18.12 mit Faktor 1 gegen
`index.html` mit Faktor 2, `tests/output/vakuum-alle-spread-alt.txt` / `-neu.txt`):

| | Faktor 1 | Faktor 2 | Delta | t |
|---|---|---|---|---|
| Ø \|Punktefahrer-Abw.\| | 1,87 | 1,95 | +0,08 | 0,47 |
| Ø \|Team-Abw.\| | 0,90 | 1,00 | +0,10 | 1,34 |
| **Teams mit Punkten, vorzeichenbehaftet** | −0,23 | **−0,58** | **−0,35** | **−5,09** |
| Punktefahrer vorzeichenbehaftet | −0,19 | −1,02 | | |
| Spearman | 0,835 | 0,832 | −0,003 | −0,97 |
| Korrelation Diff ↔ Ziel | −0,607 | −0,644 | | |

**Wie vorhergesagt:** Weil `reliability` ab 1970 fast eine Kopie der Stärke ist
(r = 0,77–0,96), nimmt die realistischere Spreizung den schwachen Teams Punkte weg.
Im Spiel punkten dadurch signifikant **weniger** Teams (t = −5,1). Am stärksten in
den 70ern (−1,23 → −1,62) und 80ern (−0,52 → −1,19), also dort, wo Faktor 2 über das
Ziel schießt. Aber auch die 90er, in denen die Spreizung passt, verschlechtern sich
(−0,15 → −0,89). Die 50er und 60er werden besser (|Fahrer| 2,68 → 1,83 und
2,07 → 1,56).

**Deutung:** Bisher haben sich zwei Fehler teilweise aufgehoben. Die zu flache
Ausfall-Verteilung hat eine zu große Leistungslücke zwischen den Teams verdeckt. Real
fallen schwache Teams häufiger aus **und** punkten trotzdem öfter. Das geht nur, wenn
sie im Tempo näher dran sind als im Spiel.

**Entscheidung des Nutzers (24.09.2026):** Zurück auf Faktor 1. Zuerst wird die
Leistungslücke der Teams angegangen, danach Faktor 2 neu gemessen. Die gemeinsame
Funktion `dnfTeamFaktor` bleibt. Mit Faktor 1 rechnet sie exakt wie die alte Formel.

---

### 24.09.2026: Die Rauschgrenze — „Zug zur Mitte" ist bei den Fahrern ein Artefakt

Auftrag: die Leistungslücke der Teams angehen. Vorher drei Prüfungen, alle reine
Datenanalyse ohne Code-Änderung.

**1. Verworfen: die Rang-Pyramide verschluckt den echten Tempo-Abstand.** `carSpeed`
entsteht nur aus dem Rang (`TEAM_PYRAMID_*`), jede Saison hat also dieselbe Kurve.
Vermutung: Dominanz-Jahre und dichte Jahre lassen sich so nicht abbilden. Gemessen mit
dem echten Abstand zur Pole (F1DB-Qualifying, Median je Team-Saison, bis 2005
`timeMillis`, ab 2006 `q1Millis`, Teams ab 8 Starts, 71 Saisons):

| Tempo-Abstand-Kennzahl | r mit realen Punkte-Teams | r mit Spiel-Abweichung Teams |
|---|---|---|
| Abstand 2. Team | 0,06 | −0,09 |
| Abstand 4. Team | −0,29 | 0,18 |
| Abstand Mitte | 0,10 | 0,08 |
| Teams innerhalb 2 % | 0,18 | −0,08 |
| **Teams gesamt** | **0,84** | **−0,26** |

Der echte Tempo-Abstand erklärt weder die reale Zahl punktender Teams noch die
Abweichung des Spiels. Real bestimmt sie die Feldgröße.

**2. Verworfen: die Tempo-Reihenfolge in `SEASON_DATA` ist falsch.** Spearman
SD-Tempo gegen reale Quali-Reihenfolge je Dekade: 50er 0,75 · **60er 0,53** · 70er 0,86 ·
80er 0,83 · 90er 0,94 · 00er 0,92 · 10er 0,92 · 20er 0,92. Kein Zusammenhang mit der
Spiel-Abweichung (r = −0,08). Nebenbefund: 1964–68 passt die Reihenfolge kaum
(1966: 0,09, 1968: 0,24).

**3. Die Rauschgrenze.** Zwei Vollläufe mit praktisch gleichem Code (v0.9.18.11
`vakuum-alle-dnf-neu.txt` gegen v0.9.18.12 `vakuum-alle-spread-alt.txt`) unterscheiden
sich nur durch Zufall. Streuung ihrer Differenz ergibt die Streuung eines Einzellaufs.

| | σ Einzellauf | σ reale Zahl über die Jahre | r(Diff, Ziel) bei perfektem Spiel | gemessen | E\|Diff\| bei perfektem Spiel | gemessen |
|---|---|---|---|---|---|---|
| Fahrer mit Punkten | 1,92 | 2,75 | **−0,70** | −0,61 | **~1,71** | 1,80–1,87 |
| Teams mit Punkten | 0,89 | 2,71 | −0,33 | −0,60 | ~0,79 | 0,90 |

Rechnung: E\|Diff\| = 0,8 × √(σ² + σ²/4), weil real ein Einzelwert und das Spiel ein
4er-Mittel ist. r ≈ −σ / σ(real). Annahme: eine reale Saison streut so stark wie ein
Spiel-Lauf.

**Folgen:**
- **Die Fahrer-Kennzahl ist ausgereizt.** Ø \|Diff\| ~1,8 liegt an der Grenze, die ein
  perfektes Spiel hätte. „Das Spiel zieht zur Mitte" ist dort fast vollständig Artefakt,
  denn das gemessene r ist sogar schwächer als das reine Rauschen.
- **Bei den Teams bleibt ein echter Rest:** r −0,60 gegen −0,33 aus Rauschen, und
  Ø 0,90 gegen 0,79. Das Spiel staucht die Zahl punktender Teams etwas. Der Rest hängt an
  der Feldgröße (r = −0,26): große Felder zu wenige, kleine zu viele.
- ⚠ **Messfalle für alle künftigen Vollläufe:** Eine Einzelsaison als Ziel hat selbst
  σ ≈ 1,9 Fahrer. Ein Jahr mit −4 ist bei 75 Jahren **erwartbar** und kein Ausreißer.
  Einzeljahre nur jagen, wenn sie über ~2,5 σ liegen (Fahrer ~5, Teams ~2,3). 1989
  (−9,3, jetzt −4,8) lag darüber, der Rest selten.

### 24.09.2026 (2): Punkteanteil je Team-Drittel — ab 2000 zu wenig für die schwachen Teams

Neue Zielgröße in `vakuum-saison.js` / `vakuum-batch.js`: Punkteanteil des starken,
mittleren und schwachen Drittels. Die Drittel richten sich nach dem realen mittleren
Startplatz, gezählt werden Fahrerpunkte je realem Konstrukteur. Vollauf 75 × 4 auf
v0.9.18.13 (`tests/output/vakuum-alle-drittel-basis.txt`):

| Zeitraum | schwaches Drittel Spiel − real | t |
|---|---|---|
| 1950–69 | +0,56 Pp | 0,6 |
| 1970–99 | −0,55 Pp | −1,6 |
| **2000–24** | **−1,26 Pp** (Spiel ~2,2 %, real ~3,5 %) | **−4,1** |
| gesamt | −0,49 Pp | −1,6 |

Je Dekade Spiel/real: 50er 3,6/1,7 · 60er 14,2/14,9 · 70er 6,8/7,9 · 80er 2,6/3,2 ·
90er 2,2/2,2 · 00er 2,9/4,6 · 10er 2,1/3,0 · 20er 1,6/2,6. Das starke Drittel liegt
im Mittel richtig (−0,25 Pp).

**Die Leistungslücke existiert, aber nur ab 2000 signifikant.** Dort bekommen die
schwachen Teams etwa ein Drittel zu wenig Punkte.

**Passt zur festen Pyramide.** Realer Quali-Abstand des schwachen Drittels zur Pole je
Dekade: 6,4 % · 3,0 · 3,0 · 6,2 · 4,7 · 2,8 · 2,6 · **1,3 %**. Die Pyramide gibt jeder
Ära dieselbe Form (Letzter = 60). Korrelation realer Abstand ↔ Spiel-Abweichung des
schwachen Drittels über 70 Jahre: **r = +0,28**. Bei engem realen Feld bekommt das
schwache Drittel im Spiel zu wenig, bei weitem zu viel. Mäßig, aber in die erwartete
Richtung. Die 80er (weiter Abstand 6,2 %, trotzdem −0,54) passen nicht ins Bild.

Zur Einordnung von Abschnitt „Die Rauschgrenze" Punkt 1: Der Tempo-Abstand erklärt
nicht die ANZAHL punktender Teams, wohl aber teilweise den ANTEIL des schwachen
Drittels. Die Anzahl war die zu verrauschte Zielgröße.

### 24.09.2026 (3): `ERA_TEAM_SPREAD` aus dem Quali-Abstand — 2000+ repariert, 70er/80er schlechter

Variante A: Spreizung der Pyramide = 9,62 × realer Quali-Rückstand des schwachen Drittels
je Dekade (50er 61,9 · 60er 28,6 · 70er 29,1 · 80er 59,6 · 90er 44,9 · 00er 27,1 ·
10er 24,9 · 20er 11,8; vorher überall ~36). `carSpeed` 1955: 96…34, 1985: 96…36,
2023: 96…84. Die Pyramiden-Formel steht jetzt einmal, in `teamPyramidCarSpeed`.

**A/B 75 × 4, gepaart** (Monolith v0.9.18.13 gegen `index.html`,
`tests/output/vakuum-alle-spreizA-alt.txt` / `-neu.txt`):

| Block | schwaches Drittel alt | neu | Δ \|Fahrer-Abw.\| | Δ Spearman | Δ \|Team-Abw.\| |
|---|---|---|---|---|---|
| 1950–69 | +0,62 (t 0,6) | +0,38 (t 0,4) | +0,24 | +0,01 | −0,17 |
| 1970–79 | −1,04 (t −1,1) | **−1,44 (t −2,5)** | **−0,80 (t −2,9)** | +0,01 | −0,57 (t −2,5) |
| 1980–89 | −0,66 (t −1,3) | **−1,47 (t −5,0)** | +0,74 (t 1,9) | +0,02 | **+0,90 (t 2,2)** |
| 1990–99 | −0,20 | −0,82 (t −1,8) | +0,38 | 0,00 | +0,14 |
| **2000–24** | **−1,39 (t −5,0)** | **−0,03 (t −0,1)** | +0,04 | **−0,02 (t −4,7)** | −0,02 |
| alle | −0,55 | −0,41 | +0,12 | 0,00 | +0,01 |

- **2000–24 repariert:** Das schwache Drittel trifft jetzt die Realität. **Preis:**
  Spearman sinkt signifikant um 0,02 (0,95 → 0,93). Das engere Feld wird bei
  unverändertem Rauschen zufälliger.
- **80er wie vorhergesagt schlechter:** Spreizung 60 macht das schwache Drittel
  chancenlos (−1,47, t −5,0), obwohl es real bei ~50 % Ausfällen 3,2 % der Punkte holte.
- **70er unerwartet:** Eine kleinere Spreizung (29 statt 36) nimmt dem schwachen Drittel
  trotzdem Anteil (−1,04 → −1,44). Das Mittelfeld profitiert vom Zusammenrücken stärker.
  Die Fahrer- und Team-Zahlen werden dabei aber besser.

**Schluss:** Der reale Quali-Abstand ist als alleinige Quelle der Spreizung nur dort
tragfähig, wo das Tempo das Ergebnis bestimmt (ab 2000, wenige Ausfälle). In den
Ausfall-Ären 70er/80er holen schwache Teams ihre Punkte über das Chaos, nicht über das
Tempo. Ein großer Quali-Rückstand darf dort nicht in eine große `carSpeed`-Lücke
übersetzt werden.

### 24.09.2026 (4): `ERA_TEAM_SPREAD` am Ergebnis kalibriert

Aus den zwei Messpunkten je Dekade (Spreizung 36 und Quali-Wert) linear auf
„schwaches Drittel = real" interpoliert. Nur wo die Messung trägt (Messfehler je Dekade
≤ 0,6 Pp): **80er 17 · 90er 33 · 00er 22 · 10er 26 · 20er 22**. Die 50er bis 70er sind
zu verrauscht (±0,9–1,5 Pp; die 70er zeigten sogar eine Steigung mit falschem
Vorzeichen, die 50er hätten 80 verlangt) und bleiben bei 36.

**A/B 75 × 4, gepaart** (Monolith v0.9.18.13 mit 36 überall gegen `index.html`,
`tests/output/vakuum-alle-spreizA-alt.txt` / `-spreizA2-neu.txt`):

| Block | schwaches Drittel alt | neu | Δ \|Fahrer\| | Δ Spearman | Δ \|Teams\| |
|---|---|---|---|---|---|
| 1950–79 | +0,06 | +0,25 | −0,17 | 0,00 | **−0,26 (t −2,4)** |
| 1980–89 | −0,66 | +0,20 | +0,08 | **−0,02 (t −2,8)** | +0,46 |
| 1990–99 | −0,20 | +0,33 | −0,15 | 0,00 | −0,38 |
| 2000–09 | **−1,77 (t −3,0)** | −0,10 | −0,30 | −0,01 | −0,37 |
| 2010–24 | **−1,14 (t −4,9)** | +0,01 | −0,12 | **−0,02 (t −4,0)** | +0,07 |
| **alle** | −0,55 | **+0,16** | −0,14 | −0,01 (t −1,6) | −0,13 |

Summen: Ø \|Fahrer-Abw.\| 1,91 → **1,77** · Spearman 0,828 → 0,822 · starkes Drittel
−0,01 → −1,09 Pp.

**Das schwache Drittel stimmt jetzt in jeder Ära**, keine Abweichung ist mehr
signifikant. Fahrer- und Team-Zahlen werden leicht besser. **Preis:** Spearman sinkt
in den 80ern und ab 2010 um 0,02. Ein engeres Feld wird bei gleichem Rauschen
zufälliger, und das starke Drittel verliert gut 1 Pp.

⚠ Offen: Wo liegt die Rauschgrenze für Spearman? Auch ein perfektes Spiel erreicht
gegen eine einzelne reale Saison nicht 1,0. Prüfbar über Spearman zwischen zwei
Spiel-Läufen. Liegt Spiel↔Spiel nahe bei Spiel↔real, ist der Verlust kein echter
Realismusverlust.

### 24.09.2026 (5): Was eine Regel-Ära real ausmacht — Grundlage für Zukunfts-Ären

Frage des Nutzers: Nach 2025 enden die Ära-Tabellen, und künftige Saisons laufen mit
dem letzten Wert weiter. Braucht es künstliche Ären? Dafür gemessen, was eine Ära real
ausmacht. Ärenwechsel = große Regelumbrüche: 1954, 1961, 1966, 1983, 1989, 1995, 1998,
2006, 2009, 2014, 2017, 2022 (2026 steht an).

| Befund | Zahl |
|---|---|
| Ära-Länge | 4, 7, 5, 17, 6, 6, 3, 8, 3, 5, 3, 5, 4 → **Ø 5,8, σ 3,7** |
| DNF-Rate relativ zum Ära-Mittel, Jahr 0 / 1 / 2 / 3 / 4 / 5 / 6+ | **1,12 / 1,08** / 0,95 / 1,00 / 0,93 / 0,95 / 0,92 |
| Quali-Abstand schwaches Drittel, relativ | 0,95 / 0,98 / 1,06 / 0,98 / 0,93 / 0,87 / 1,12 → **kein Muster** |
| Spearman Teamreihenfolge Vorjahr → Jahr | Ärenwechsel **0,765 ± 0,047** (n 10) · sonst 0,675 ± 0,040 (n 55) |

**Negativergebnisse:**
- **Kein Umwürfeln beim Ärenwechsel.** Die Teamreihenfolge ist in Wechseljahren eher
  *stabiler* als sonst (nicht signifikant). Brawn 2009 und Mercedes 2014 sind
  Einzelfälle, die im Gedächtnis bleiben, kein Muster.
- **Kein Zusammenrücken innerhalb einer Ära**, jedenfalls nicht beim schwachen Drittel.

**Positiv:** Neue Regeln kosten Zuverlässigkeit. In den ersten beiden Jahren fallen
8–12 % mehr Autos aus als im Ära-Mittel.

**Umgesetzt (v0.9.18.15):** `REAL_ERA_CHANGES` bis 2026, danach würfelt
`eraChangesBis` die Längen aus den echten Längen und hält sie in
`GAME_STATE.futureEraChanges`. `eraReliabilityFactor` moduliert `getEraDNFRate` nur für
Jahre nach der Tabelle (2026: 12,3 %, 2027: 11,9 %, danach 10,5 %). Das
Saisonende-Modal kündigt einen Wechsel an („📜 Neues Reglement ab …"). Teamstärken
werden bewusst **nicht** umgewürfelt (s. oben).

**Nachtrag, These des Nutzers: „ein Ärenwechsel beendet die Dominanz"** (1959–2025):

| | Ärenwechsel (n 11) | sonst (n 56) |
|---|---|---|
| Konstrukteurs-Meister wechselt | **64 %** | 46 % |
| schnellstes Team (bester Ø Startplatz) wechselt | 45 % | 57 % |

Beim Titel ist eine kleine Neumischung möglich, beim Tempo nicht. Keiner der beiden
Unterschiede ist bei n = 11 belastbar (±15 Pp). Deshalb bleibt es beim Verzicht auf ein
künstliches Umwürfeln.

### 24.09.2026 (6): Spearman-Rauschgrenze — wo die Fahrerreihenfolge wirklich danebenliegt

⚠⚠ **WIDERRUFEN am 24.09.2026 (9):** Die Spearman-Werte dieses Abschnitts ordneten Gleichstände (punktlose Fahrer, 50er 67 %) beliebig und zwischen zwei Spiel-Läufen identisch. Mit Durchschnittsrängen verschwindet der „Modellfehler" der 50er/70er. Korrigierte Zahlen im Abschnitt (9).

Neue Kennzahl „Spearman Spiel<->Spiel" (zwei unabhängige Läufe über dieselbe
Fahrermenge wie gegen real). Vollauf 75 × 4 auf v0.9.18.15
(`tests/output/vakuum-alle-spgrenze.txt`):

| Dekade | Spiel↔real | Spiel↔Spiel (Grenze) | Diff | t |
|---|---|---|---|---|
| **1950er** | 0,647 | 0,762 | **−0,115** | **−5,7** |
| 1960er | 0,734 | 0,773 | −0,039 | −1,5 |
| **1970er** | 0,760 | 0,840 | **−0,080** | **−5,6** |
| 1980er | 0,810 | 0,809 | 0,000 | 0,0 |
| **1990er** | 0,865 | 0,901 | **−0,036** | **−4,3** |
| 2000er | 0,903 | 0,904 | −0,001 | −0,1 |
| 2010er | 0,936 | 0,940 | −0,004 | −0,8 |
| 2020er | 0,933 | 0,931 | +0,002 | 0,2 |

**Folgen:**
- **Der Spearman-Verlust aus `ERA_TEAM_SPREAD` (−0,02 in den 80ern und ab 2010) ist
  kein Realismusverlust.** Genau dort liegt das Spiel an seiner Rauschgrenze. Der Rest
  ist Zufall.
- **Echte Modellfehler in der Fahrerreihenfolge: 1950er, 1970er, 1990er.** Dort ordnet
  das Spiel die Fahrer deutlich schlechter, als der Zufall erklärt. Bei fixiertem Feld
  und realen Startplätzen bleibt als Ursache die **Fahrer- bzw. Autobewertung** dieser
  Ären (`PACE_RATINGS`, Auto/Fahrer-Gewicht; vgl. „Ära-Abhängigkeit: das Auto zählt heute
  mehr").

Leseregel: Spiel↔real < Grenze heißt Modellfehler, = heißt Zufall, > heißt, das Spiel
würfelt mehr als die Realität.

### 24.09.2026 (7): `DNF_REL_SPREAD` = 2 nach der Pyramiden-Korrektur — weiterhin nein

Gemessen wie angekündigt, nachdem `ERA_TEAM_SPREAD` die Leistungslücke behoben hat.
A/B 75 × 4, Monolith v0.9.18.15 (Faktor 1) gegen Faktor 2
(`tests/output/vakuum-alle-dnf2b-alt.txt` / `-neu.txt`):

| Block | Δ Teams mit Punkten (mit Vorzeichen) | schwaches Drittel neu | Δ \|Fahrer\| | Δ Spearman |
|---|---|---|---|---|
| 1950–69 | −0,57 (t −3,6) | −0,47 | −0,51 | −0,01 |
| **1970–89** | **−1,15 (t −4,1)** | **−1,51 (t −3,7)** | +0,22 | 0,00 |
| 1990–99 | −0,73 (t −2,3) | −0,38 | +0,30 | −0,01 |
| 2000–24 | −0,13 | −0,42 | −0,11 | 0,00 |
| alle | −0,60 (t −5,4) | −0,72 (t −2,4) | −0,07 | 0,00 |

Keine Ergebnis-Kennzahl wird besser, die schwachen Teams der 70er/80er verlieren
wieder. Ursache wie gehabt: Faktor 2 schießt dort über die reale Ausfall-Spreizung
(80er 22,1 statt 12,5). **Zurück auf 1.** Offen bliebe ein Faktor je Ära (real ÷
Formel: 50er 2,8 · 60er 2,7 · 70er 1,6 · 80er 1,1 · 90er 1,9 · 00er 2,8 · 10er 2,6 ·
20er 2,3). Sein Gewinn wäre nur, dass die Ausfälle selbst realistisch verteilt sind.
Keine Ergebnis-Kennzahl verlangt danach.

### 24.09.2026 (8): Auto-Bias — in den 50ern und 70ern zählt das Auto im Spiel zu viel

⚠⚠ **WIDERRUFEN am 24.09.2026 (9):** Die Spearman-Werte dieses Abschnitts ordneten Gleichstände (punktlose Fahrer, 50er 67 %) beliebig und zwischen zwei Spiel-Läufen identisch. Mit Durchschnittsrängen verschwindet der „Modellfehler" der 50er/70er. Korrigierte Zahlen im Abschnitt (9).
Die beiden Negativergebnisse unten (Decke, Gewicht) bleiben als Messung gültig. Sie haben nur ein Scheinproblem behandelt.

Neue Diagnose in `vakuum-saison.js`: Korrelation zwischen dem Rangfehler eines Fahrers
(Spiel − real) und der Stärke seines Autos (mittlerer realer Startplatz des Hauptteams).
Das ist die Rohzahl minus Kontrolle Spiel↔Spiel, die das Regressions-Artefakt
herausrechnet. Werte > 0 heißen: Fahrer in schwachen Autos landen im Spiel weiter hinten
als real, das Auto zählt also zu viel. Vollauf 75 × 4 auf v0.9.18.15
(`tests/output/vakuum-alle-autobias.txt`):

| Dekade | Auto-Bias | Spearman-Lücke zur Rauschgrenze |
|---|---|---|
| **1950er** | **+0,116 (t 2,3)** | −0,067 (t −2,6) |
| 1960er | −0,010 | −0,039 |
| **1970er** | **+0,140 (t 2,7)** | −0,087 (t −3,4) |
| 1980er | +0,012 | +0,005 |
| 1990er | +0,040 | −0,044 (t −3,4) |
| 2000er | −0,003 | 0,000 |
| 2010er | −0,038 | −0,012 |
| 2020er | −0,073 | −0,013 |

**r(Auto-Bias, Spearman-Lücke) über 75 Jahre = −0,48.** Die Dekaden mit echtem
Modellfehler in der Fahrerreihenfolge sind genau die, in denen das Auto zu viel zählt.

⚠ Bezug zu „`ERA_CAR_WEIGHT` gemessen und ZURÜCKGENOMMEN" (18.09.): Jene Bewertung
stützte sich auf die Punktefahrer-Zahl (inzwischen als Rauschgrenzen-Kennzahl entlarvt)
und 10 Saisons. Die Richtung damals (Auto früher schwächer gewichten) deckt sich mit
diesem Befund.

**Negativergebnis: die Auto-Decke (`_CEIL_HEADROOM`) ist nicht der Hebel.** Versuch 4 → 8
in allen Ären (`tests/output/vakuum-alle-ceil8.txt`): Der Auto-Bias der 50er sinkt
(0,116 → 0,026), der der 70er bleibt (0,140 → 0,139). Spearman ändert sich in keiner
Dekade signifikant (größte Bewegung 70er +0,011, t 1,8). Zurück auf 4.

**Negativergebnis: auch das Auto-Gewicht (`CAR_SPEED_WEIGHT`) ist nicht der Hebel.**
Versuch 0,20 → 0,10 in allen Ären (`tests/output/vakuum-alle-carw010.txt`):

| Dekade | Auto-Bias | Δ Spearman |
|---|---|---|
| 1950er | 0,116 → 0,023 | −0,013 |
| 1970er | 0,140 → **0,135** | +0,015 (t 2,2) |
| 2010er | −0,038 → −0,166 | −0,003, Punktefahrer schlechter (t 2,3) |

**Schluss aus beiden Versuchen:** Den Auto-Bias der 50er drücken beide Hebel weg, die
Fahrerreihenfolge wird dadurch nicht besser. Der der 70er reagiert auf keinen. Die
Auto-Mechanik (Decke, Gewicht) ist also **nicht** die Ursache der Spearman-Lücke. Das
Muster „Fahrer in schwachen Autos landen zu weit hinten" ist beobachtungsgleich mit
„diese Fahrer sind zu schwach bewertet". ▶ Verbleibende Ursache: die
**Fahrerbewertung** der 50er/70er (`PACE_RATINGS`). Beide Konstanten unverändert.

### 24.09.2026 (9): Die Gleichstands-Falle — der „Modellfehler 50er/70er" war ein Messartefakt

`vakuum-saison.js` bildete die Ränge für Spearman aus der **Tabellenposition**. Bei
Punktgleichstand ist die Position beliebig: real die F1DB-Reihenfolge, im Spiel die
Kaderreihenfolge, und die ist **zwischen zwei Spiel-Läufen identisch**. Punktlos waren
je Dekade real 67 % (50er) · 55 % · 51 % · 39 % · 37 % · 23 % · 20 % · 12 % (2020er).
Genau in den alten Ären hob das die Rauschgrenze künstlich an und drückte Spiel↔real.

**Korrektur:** Ränge aus den **Punkten**, Gleichstand = Durchschnittsrang, Spearman =
Pearson der Ränge (`rangMitGleichstand`, `pearsonR`). Gilt für Spiel↔real,
Spiel↔Spiel und den Auto-Bias. Vollauf 75 × 4 auf v0.9.18.15
(`tests/output/vakuum-alle-gleichstand.txt`):

| Dekade | Spiel↔real | Grenze | Lücke | Auto-Bias |
|---|---|---|---|---|
| 1950er | 0,691 | 0,647 | +0,044 (t 1,8) | −0,120 (t −1,8) |
| 1960er | 0,778 | 0,740 | +0,037 (t 2,3) | −0,038 |
| 1970er | 0,820 | 0,819 | +0,001 | +0,037 |
| 1980er | 0,819 | 0,800 | +0,019 (t 2,0) | −0,024 |
| 1990er | 0,871 | 0,851 | +0,020 (t 2,6) | −0,060 (t −2,6) |
| 2000er | 0,905 | 0,911 | −0,006 | −0,103 (t −1,7) |
| 2010er | 0,934 | 0,949 | **−0,015 (t −2,6)** | −0,063 (t −1,9) |
| 2020er | 0,936 | 0,952 | −0,016 (t −1,7) | **−0,179 (t −3,0)** |
| alle | 0,838 | 0,826 | +0,012 | −0,062 (t −3,4) |

**Folgen:**
- **Kein Modellfehler in der Fahrerreihenfolge der 50er und 70er.** Das Spiel liegt dort
  an oder knapp über der Rauschgrenze. Bis 1999 würfelt es leicht **mehr** als die
  Realität (Lücke > 0).
- **Übrig bleibt ein kleiner Befund ab 2000:** Spiel↔real knapp unter der Grenze, der
  Auto-Bias negativ. Das Auto zählt im Spiel heute eher **zu wenig**, passend zur
  F1DB-Messung „das Auto erklärt heute 0,93–0,97 des Endstands". Die Größenordnung
  ist klein (−0,015).
- ⚠ **Messfalle für jede Rangkorrelation über Endstände:** Gleichstände müssen
  Durchschnittsränge bekommen. Sonst misst man in Ären mit vielen Punktlosen die
  Sortierreihenfolge statt der Simulation.
