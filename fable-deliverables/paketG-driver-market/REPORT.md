# Paket G – Driver-Market-Realismus-Korpus (2026-07-07)

**Quellenbasis:** F1DB (`f1db-json-splitted/`), komplette Saisons **1950–2025** (2026 verworfen). Indy-500-Starts 1950–1960 zählen nicht als F1-Debüt (konsistent zum Spiel). Reproduzierbar: `node derive-market-corpus.js` → schreibt `whitelist-rookies-top3.json`, `expectation-curve.json`, `corpus-raw.json`.

**Technischer Hinweis (wichtig für alle Rang-Angaben):** F1DB führt Konstrukteurs-Standings je **Konstrukteur+Motor-Kombi** (Lotus-Climax ≠ Lotus-BRM). Alle Ränge hier sind auf **Team-Ebene re-aggregiert** (Punkte aller Kombis summiert, neu gerankt) — sonst wäre z. B. „Brabham 1967" P11 statt Weltmeister.

---

## Deliverable 1 — Rookie-bei-Top-3-Whitelist

288 Fälle gesamt (P1–P5, alle Ären) in `whitelist-rookies-top3.json`. Drei Schichten, weil „Top-3-Team" je Ära etwas anderes bedeutet:

| Schicht | Fälle | Verwertbarkeit |
|---|---|---|
| vor 1958 (`preConstructorsEra`) | 80 | Konstrukteurs-WM existierte nicht — Pseudo-Rang aus aggregierten Saisonpunkten, **nur mit Vorbehalt** |
| 1959–1980 (`customerChassisEra`) | 174 | überwiegend **Privatiers in Kundenchassis** („Cooper-Rookie 1962" = Rob-Walker-Kunde, kein Werkssitz) — als Kalibrierungsbasis ungeeignet |
| ab 1981 (moderne Ära) | 34 | **die belastbare Liste** (unten) |

### Moderne Ära (ab 1981), Vorsaison **Top-3** — 14 Fälle in 45 Saisons

| Fahrer | Debüt | Team | Vorsaison-Rang | Anmerkung |
|---|---|---|---|---|
| Philippe Streiff | 1984 | Renault | P2 | Teilsaison (1 Rennen, Saisonfinale) |
| Satoru Nakajima | 1987 | Lotus | P3 | Honda-Paket |
| Johnny Herbert | 1989 | Benetton | P3 | |
| Emanuele Pirro | 1989 | Benetton | P3 | Herbert-Ersatz ab Mitte Saison |
| Michael Schumacher | 1991 | Benetton | P3 | **Debüt bei Jordan**, nach 1 Rennen zu Benetton |
| Michael Andretti | 1993 | McLaren | P2 | |
| David Coulthard | 1994 | Williams | P1 | Senna-Ersatz |
| Jos Verstappen | 1994 | Benetton | P3 | |
| Jacques Villeneuve | 1996 | Williams | P2 | |
| Alexander Wurz | 1997 | Benetton | P3 | Berger-Ersatz (3 Rennen) |
| Juan Pablo Montoya | 2001 | Williams | P3 | |
| Heikki Kovalainen | 2007 | Renault | P1 | |
| Lewis Hamilton | 2007 | McLaren | P3 | |
| Nelson Piquet Jr. | 2008 | Renault | P3 | |

Davon **geplante Voll-Saison-Werkssitze nur ~9** — der Rest sind Ersatz-Einsätze (Coulthard, Pirro, Wurz) oder Sonderfälle (Schumacher). Seit **2008 null Fälle**: In 17 Jahren hat kein Rookie mehr in einem Top-3-Auto debütiert. Die Spielregel „generierte Rookies nie in Top-3" ist also **realistischer als die Realität der 90er und strenger als nötig nur für Ausnahmegenies** — genau dafür ist die Whitelist der Override.

### Moderne Ära, Grenzfälle **P4–P5** — 20 Fälle (separat, Nutzer entscheidet)

1983 Palmer (Williams P4) · 1986 Dumfries (Lotus P4) · 1989 Donnelly (Arrows P5) · 1993 Lamy (Lotus P5) · 1994 Panis + Lagorce (Ligier P5) · 1995 J. Magnussen (McLaren P4) · 1997 R. Schumacher (Jordan P5) · 2000 Burti (Jaguar P4) · **2000 Button (Williams P5)** · 2002 Massa (Sauber P4) · 2002 Sato (Jordan P5) · 2006 Rosberg (Williams P5) · 2009 Grosjean (Renault P4) · 2009 Kobayashi (Toyota P5) · **2014 K. Magnussen (McLaren P5)** · 2017 Stroll (Williams P5) · 2018 Sirotkin (Williams P5) · **2023 Piastri (McLaren P5)** · **2025 Antonelli (Mercedes P4)**

**Antonelli-Korrektur bestätigt:** Mercedes 2024 = P4 → unter der strikten Top-3-Regel qualifiziert er sich nicht. P4–P5-Debüts kommen dagegen regelmäßig vor (20 in 45 Jahren) — die Grenze bei Top-3 zu ziehen und P4–P5 zuzulassen ist datenseitig gut begründbar.

---

## Deliverable 2 — Basisrate: Champion → schlechteres Auto

75 Titel (1950–2024), Auto-Qualität des Champions in der Folgesaison N+1 (Mittelfeld = Rang 4 bis 70 % des Feldes). Volle Fall-Liste in `corpus-raw.json`.

| Kategorie N+1 | Fälle | Anteil (von 68 Angetretenen) |
|---|---|---|
| **Top-3-Auto** | 56* | **82,4 %** |
| Mittelfeld | 9 | 13,2 % |
| Backmarker | 3 | 4,4 % |
| nicht angetreten (Rücktritt/Tod) | 7 | — |

\* inkl. Alonso 2007: McLaren wurde aus der Konstrukteurs-WM ausgeschlossen (Spygate), war aber de facto Top-2 — als Top-3 gezählt.

**Die drei Backmarker-Fälle:** Phil Hill 1962 (blieb bei Ferrari, Team brach ein — *unfreiwillig*), Scheckter 1980 (blieb bei Ferrari, Auto-Flop — *unfreiwillig*), **Damon Hill 1997** (Williams → Arrows — einziger Fall der Geschichte, dass ein amtierender Champion aktiv zu einem Backmarker *wechselte*, und auch das nur, weil Williams ihn abservierte). **Kein einziger Champion der letzten 45 Jahre rutschte unfreiwillig unter Mittelfeld.** Die Mittelfeld-Fälle sind fast alle „blieb loyal beim einbrechenden Team" (Andretti/Lotus 1979, Piquet/Brabham 1982/84) oder Projekt-Wetten (Piquet→Lotus 1988). Freiwillige Wechsel nach Titel gingen sonst immer in Top-3-Autos (Lauda→Brabham '78, Prost→Ferrari '90, Schumacher→Ferrari '96, Button→McLaren '10, Hamilton→Mercedes '13 kein Titeljahr davor, etc.).

---

## Deliverable 3 — Erwartungskurve (je Konstrukteurs-WM-Rang)

Fenster **1990–2025** (~14.900 Starts). Zielpositionen: nur **klassifizierte** Ergebnisse. Punkte: **modernes 25-18-15-…-1-Schema auf alle Starts (DNF = 0)** — dadurch era-übergreifend vergleichbar. Maschinenlesbar: `expectation-curve.json`.

| Rang | Median-Ziel | P25 | P75 | Ø Pkt/Start | Finish-Quote | n |
|---|---|---|---|---|---|---|
| 1 | **2** | 1 | 4 | 14,82 | 87 % | 1329 |
| 2 | **3** | 2 | 5 | 10,85 | 80 % | 1330 |
| 3 | **5** | 3 | 7 | 8,24 | 78 % | 1330 |
| 4 | **7** | 5 | 9 | 5,43 | 76 % | 1330 |
| 5 | **8** | 6 | 11 | 3,62 | 74 % | 1330 |
| 6 | **10** | 7 | 12 | 2,46 | 71 % | 1326 |
| 7 | **10** | 8 | 13 | 1,89 | 70 % | 1330 |
| 8 | **11** | 9 | 14 | 1,33 | 68 % | 1329 |
| 9 | **13** | 10 | 15 | 0,72 | 67 % | 1322 |
| 10 | **15** | 12 | 17 | 0,40 | 70 % | 1266 |
| 11 | 16 | 13 | 18 | 0,28 | 54 % | 492 (nur 90er-Grids) |
| 12 | 18 | 14,5 | 20 | 0,33 | 57 % | 180 ⚠ dünn |
| 13 | (11) | 7 | 14 | 0,66 | 28 % | 32 ⚠ unbrauchbar |

R11–R13 existieren nur in den vollen 90er-Grids; **R13 ist Rauschen** (28 % Finish-Quote verzerrt den Median der wenigen Zieleinläufe) — Lookup bei R11 kappen, darüber extrapolieren.

**Teamkollegen-Delta** (beide Autos klassifiziert, n=4025): **Median 2 Positionen, Mittel 3,3** — Top-3-Teams 2/3,4 · Mittelfeld 3/3,6 · Backmarker 2/2,7. Eine Differenz von 2–3 Plätzen zum Teamkollegen ist also *normal*; erst eine *konsistente* Differenz deutlich darüber ist ein Reputations-Signal.

---

## Empfehlung an Opus (abzuleitende Konstanten)

1. **Rookie-Lock:** Generierte Rookies nie bei Vorsaison-Top-3 (Basisrate real: ~0,3 Fälle/Jahr, seit 2008 null). **P4–P5 zulassen** — das deckt Button/Massa/Piastri/Antonelli ab und hält das Spiel lebendig. Whitelist-Override nur für den historischen Seed nötig (der ohnehin unangetastet bleibt) — `whitelist-rookies-top3.json` liegt bei, falls je ein „Ausnahmegenie"-Mechanismus kommt (dann Kriterium an Schumacher/Hamilton/Villeneuve orientieren: dominanter Junior-Meister).
2. **Champion-Retention:** `P(Top-3-Auto in N+1) ≈ 0.82`, **`P(mindestens Mittelfeld) ≈ 0.96`**. Spielregel: ein amtierender Champion nimmt **nie** aktiv einen Sitz unterhalb Mittelfeld an; unter Mittelfeld nur durch Team-Kollaps bei Verbleib (≈4 % Restrisiko, im Spiel über Team-Einbruch emergent — nicht extra würfeln). Retention-Schwelle: Champion bleibt/wechselt mit p≈0.95+ in ein Auto mit Erwartung ≥ Mittelfeld.
3. **Erwartungs-Lookup:** `medianPos`-Spalte als Array `[2,3,5,7,8,10,10,11,13,15,16]` (R1–R11, darüber kappen/extrapolieren). `overperformance = erwartete_position(carRank) − tatsächliche_position`; P25/P75 als Band für „im Rahmen" (innerhalb Band = keine Reputationsänderung). Punkte-Erwartung (`avgPoints`) für die Saison-Aggregation.
4. **Teamkollegen-Gewicht:** Differenzen bis ±3 Positionen pro Rennen als Rauschen behandeln (Median 2, Mittel 3,3); Reputation nur aus dem **Saison-Mittel** des Duells speisen, gedeckelt, damit ein überragender Teamkollege den anderen nicht unfair abwertet.
