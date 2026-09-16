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
| Das Feld ist zu ausgeglichen: niemand geht leer aus | Punkteverteilung, carSpeed-Spanne, Startfeld, `simulateRace` |

---

## Fahrer-Karrieren: Bogen und Pace-Entwicklung (seit v0.9.18.5)

Eine Karriere hat einen **Bogen** – Aufstieg, Zenit, Abbau. Wer an `developDriverPace`,
`checkCareerEnds` oder den Alterskurven dreht, misst ihn vorher und nachher.

| Befehl | Zweck |
|---|---|
| `node tests/karriere-peak.js <export.json>` | Drei Gruppen gegen F1DB: Realität, echte Fahrer im Save, generierte |
| `node tests/karriere-peak-sim.js 1980 160 2010 --laeufe=3` | Simuliert und misst – für A/B **ohne** und **mit** `SIMCORE_FROM_INDEX=1` |
| `node tests/pace-kurve-real.js` | Die **Zielkurve** aus `PACE_RATINGS` (160 reale Fahrer) |

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

| | Feld Ø | mit Punkten Ø | Quote |
|---|---|---|---|
| real 1950er | 90,1 | 22,2 | 25 % |
| real 1960–79 | 50,8 | 20,7 | 42 % |
| real 1980–99 | 35,5 | 20,6 | 59 % |
| real 2010–24 | 29,6 | 19,2 | **66 %** |
| generiert | 18,5 | 18,5 | **99,8 %** |

**Die Zahl der Punktefahrer ist über alle Ären stabil bei 19–22 — das Spiel trifft sie
mit 18,5.** Was fehlt, sind die rund zehn Fahrer je Saison, die real **leer ausgehen**.

### Der fehlende Tiefpunkt: Nullsaisons

| | Karriere mit ≥1 Nullsaison | **erste** Saison punktlos |
|---|---|---|
| real, alle Ären | 88,8 % | 62,8 % |
| real, Ende ab 2000 | 71,7 % | 32,6 % |
| echte Fahrer im Save | 76,5 % | 43,7 % |
| **generiert** | **1,2 %** | **0,0 %** |

Kein einziger generierter Fahrer hat je eine punktlose Debütsaison. **Das ist der
fehlende Tiefpunkt in Abschnitt 1 des Karriere-Bogens** (38 % statt real 16 %) — nicht
eine falsch kalibrierte Pace-Kurve. Die stimmt seit .18.5.

### Die Ursache liegt bei den AUTOS, nicht am Punktesystem

| | Teams Ø | ohne Punkte | Top-Team hält | Champion hält |
|---|---|---|---|---|
| real 2010–24 | 10,7 | **1,1 (10 %)** | 31,6 % | 38,5 % |
| real 1980–99 | 11,4 | 0,1 (0 %) | 33,0 % | 20,2 % |
| generiert | 10,0 | **0,0** | **19,7 %** | **13,5 %** |

Die Teamzahl stimmt. Aber im Spiel ist **kein Auto chancenlos und keins dominant**. Das
letzte Team holt **10,6 %** der Punkte des Meisterteams — real sind es 0–2 %.

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
