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
| Form-Vielfalt kalibriert, carSpeed-Gewicht verworfen | `BAD_DAY_PACE_FACTOR`, Streuung im Rennen |
| Ära-Abhängigkeit: das Auto zählt heute mehr | `ERA_CAR_WEIGHT`, Auto/Fahrer-Verhältnis, Spearman-Fallen |

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
