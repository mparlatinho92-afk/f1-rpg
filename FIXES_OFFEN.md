# Offene Fixes & Features

Bereinigte Fassung der Google-Doc-Sammelliste **„F1 RPG neue Fixes"**
(Doc-ID `1-bE5uXu5dFeq-eBJ4V2zm1mIdTbtNknb5wty1M4CICg`, Doc-Stand 2026-07-29).

**Abgeglichen gegen:** `index.html` @ v0.9.15.51 (Commit `baa9274`), Prüfdatum **2026-07-29**.
**Methode:** Grep/Read gegen den Code. „Erledigt" heißt: Mechanik im Code nachweisbar — **nicht** funktional im Browser getestet.

Zeilennummern verschieben sich; bei Abweichung `grep -n` + `./update-functions-index.ps1`.

---

## 🟡 Teilweise erledigt

### H2H: Teams mit 3+ Fahrern erzeugen keine Duelle
`trackTeammateDuels` (index.html:10241) zählt korrekt pro Session (Quali **und** Rennen), bricht aber bei
`pair.length !== 2` ab (:10249). In der klassischen Ära mit 3+ Autos pro Konstrukteur entsteht dadurch
**gar kein** Duell-Eintrag → erklärt „nicht bei jedem Steckbrief, nicht mit jedem Teamkollegen".

Ebenfalls offen aus dem Doc:
- historische Saisons/Duelle/Rennen/Quali **rückwirkend** ins Spiel bringen
- Graham-Hill-Fall: Fahrer taucht im eigenen H2H auf (ausgegraut, 0:0) — neutral ist vertretbar, aber Ersatzfahrer-Verlinkung (John Russell) fehlt in der Schlagzeile
- aktuelle Saison separat anzeigen ist gewünscht, nicht Bug

### Reserve-Pool: Anzeige & Sortierung
`renderReservePool` (index.html:8586).
- ✅ Talente/Free-Agents/Testfahrer/Kommend/Indy als eigene Tabs (:8606–8613, `isPoolTalent`)
- ❌ **kein Potential-Pace-Wert** in der Zeile — nur ein Pace-Balken (:8666–8672)
- ❌ **keine freie Sortierung**; fest `lastRacedYear` → `pace`, absteigend (:8601)
- ❌ realistisches Durchschnittsalter für Talente (Doc-Idee: FP1-Freitagsfahrer als Referenz)

---

## ❌ Offen — UI & Statistiken

### Weltmeister-Tab
`renderChampions` (index.html:23881).
- Jahre **vor** Spielstart liefern hart `championPoints: '-'`, `teamChampion: '-'`, `teamChampionPoints: '-'` (:23893)
  → das ist der gemeldete „Felder sind leer"-Bug, kein Render-Fehler
- gewünscht: zusätzliche Tab-Auswahl mit Detail-Tabellen nach Wikipedia-Vorbild, **Vorlage auf Deutsch**
  - <https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions>
  - <https://en.wikipedia.org/wiki/List_of_Formula_One_World_Constructors%27_Champions>

### All-Time-Statistiken
- Fahrer-Tabelle: **keine Flaggen** neben dem Aktiv-Status (`renderAllTimeDrivers`, :23784 — nur 🏎️/👴/📜)
- Team-Tabelle: **keine Spalte Konstrukteurs-WM** (`renderAllTimeTeams`, Spalten :23851–23857)

### Saisonverlauf
- Konstrukteurs-Matrix als Ergänzung — existiert nicht.
  Vorgabe: nur **bestes Team-Ergebnis pro Rennen** zeigen (Tabelle flach halten), Warnhinweis oben.

### Einstellungen
- Sim-Modus-Toggle: `liveTickerMode` existiert nur als GAME_STATE-Flag (:7162) mit Auswahl-Modal (:2966/2975).
  Gewünscht: **fester Standard in den Einstellungen**, damit ein einzelner Klick genügt.

### Sonstiges UI
- Team-Historie-Layout (S / P / Pkt. / WM) auf Karriere-Historie von F1- **und** Junior-Welt-Fahrern übertragen;
  Designänderungen künftig synchron halten
- sämtliche Links auf Funktion und Reaktionsgeschwindigkeit prüfen
- **Querschnittsregel:** jede UI-Entscheidung, die mobil negativ wirken kann, muss responsiv sein

---

## ❌ Offen — Fahrermarkt & Pace-Modell

### Verfrühtes Poaching junger Top-Fahrer
Symptome: Nigel Mansell Mitte 1970er, Jack Brabham Mitte 1950er. Ursache laut Doc: Current Pace entscheidet,
Mindestalter lässt es zu.

**Vorschlag dreiteilige Pace** (im Code: `juniorPace`/`rookiePace`/`peakPace` = 0 Treffer):
- **Junior-Pace** = fiktive Pace vor dem realen Eintritt, gilt für reale F1- und reale F2/F3-Fahrer des Reserve-Pools
  (**nicht** Junior-Welt-Fahrer). Entwicklung linear vom frühestmöglichen Eintrittsalter (19) bis 1 Jahr vor realem
  Eintritt: 10 Jahre Abstand → 1/10 pro Jahr, bis im Eintrittsjahr die Current Pace erreicht ist.
- Poachbar, aber bei niedriger Pace weniger wert.
- Im Grid erscheint Junior-Pace als dritter Balken über Current Pace; Current Pace heißt dann vorübergehend
  **Rookie-Pace**. Ab dem realen Eintrittsjahr verschmelzen beide zu Current Pace.
- Potential Pace ggf. zu **Peak** umbenennen.
- Betrifft auch bereits zurückgetretene/verstorbene Fahrer, deren Schicksal VOR der Sim feststand — nur **eindeutige**
  Karriereenden (inkl. crashbedingt), kein „fuhr schon länger nicht mehr". Unvollständige Liste liegt im Google Drive.

### Inaktivitäts-Malus
Kein Treffer im Code. Gewünscht:
- sichtbarer Zahlenwert in **Pace-Verlauf** und **Steckbrief**, je länger inaktiv desto schlechter (Fall Jan Lammers)
- baut sich von Rennwochenende zu Rennwochenende ab; gewohnter Pace-Abbau läuft daneben weiter
- Abbau-Metrik offen — Idee: gefahrene Kilometer inkl. Training und Quali (Runden × km/Runde; Rundenzahl je Session
  ist noch zu bestimmen)
- Gegenstück: inaktive Top-Fahrer (häufig Vettel) behalten aktuell ihre Current Pace ohne Alters- oder
  Inaktivitäts-Degradierung

### Weitere Marktpunkte
- **Nachfolgeteams übernehmen Verträge**; ausgelaufene Verträge werden ggf. verlängert (gleiche Wahrscheinlichkeit
  wie sonst im Spiel) — kein Mechanismus im Code
- **entlassene Fahrer gelangen nicht in den Pool** und ersetzen mit hoher Wahrscheinlichkeit einen anderen
  entlassenen Fahrer
- **Langzeit-Inaktive:** ab dem 10. aufeinanderfolgenden Jahr ohne Cockpit Altersangabe → **Geburtsjahr** umstellen
  (kein 200-jähriger Fahrer; natürlicher Tod bleibt unsichtbar). Bei Rückkehr zurück auf Alter.

---

## ❌ Offen — Fahrer-Stats

Aktuell: Pace (Current + Potential), Regen, Konstanz, Erfahrung.
Alle Fahrer mit Zufalls-Stats (generierte + F2/F3 aus dem **Reserve-Pool**, nicht Junior-Welt) sollen mehr Stats
bekommen, um Dominanzen zu verringern (0 Treffer im Code):

Starts · Überholen · Verteidigen · Aggressivität · Konzentration · Reifenmanagement ·
Kraftstoff-/ERS-/DRS-Management · Persönlichkeit · Mentale Stärke

- Erfahrung soll andere Werte mitbestimmen
- Persönlichkeit beeinflusst Verträge und Reaktionen auf WM-Stand/Ausfälle → Rücktritt oder Rauswurf als Folge

---

## ❌ Offen — Bewertungssystem (eigenes Teilprojekt)

Nur `_computeDriverSeasonScore` (index.html:15606) als Vorstufe vorhanden. Das Konzept aus dem Doc verlangt eine
eigene Markdown, da es sich laufend verfeinern soll.

**Zeitfenster:** letzte 5 Saisons als EMA, je frischer desto relevanter (im Doc selbst hinterfragt: „gilt das
wirklich?"), aktuelle Saison höchste Gewichtung, historische Rennen rückwirkend berechnet. Verhältnis zum
bestehenden Ansehen ist zu klären.

**Erwartungs-Skalierung:** nach Team-Tier; höheres Ansehen und starke Vergangenheit heben die Erwartung.
Vorsaison-Konstrukteursplatz als Anker — Platz 1 → Mindesterwartung P1/P2, Platz 2 → P3/P4, … Platz 11 → P21/P22.
Besser als erwartet = Multiplikator (~×1,2), schlechter als P22 = Malus, gleich = neutral.
Quali und Pre-Quali werden zusammengezählt (Pre-Quali-Fahrer nach Rundenzeit hinten angehängt).
Beim Rennen zählen nur Zieleinfahrten, daher gekrümmt — Idee: Gridplatz mit Rennergebnis und Gesamtzahl der
Zieleinfahrten verrechnen (z. B. Grid 4, Ergebnis 12 bei 13 Zieleinfahrten).
**Überperformance ist Mathematik, keine Zielliste** — Beispiele nur zur Anschauung: Life qualifiziert sich,
Sauber gewinnt, AGS punktet.

**Offene Frage im Doc:** wieso sollten schwache Fahrer geringere Erwartungen haben? Fahrer sollen nicht jahrelang
im hinteren Feld parken (raus oder hoch), andererseits kann genau das Konstanz bedeuten (nicht der Konstanz-Skill).
Erfahrung soll den Konstanz-Skill heben.

**Bonus:** konstant überdurchschnittliche Ergebnisse, Erfolge wie schnellste Runde, **Rookies mit sofort guter
Leistung** (wird aktuell nicht gewürdigt).
**Malus:** DNQ, konstant schlechte Ergebnisse.

**Bezugsgrößen:** ELO-Prinzip über das ganze Feld (alle Wochenend-Teilnehmer), zusätzlich Team-Durchschnitt
(alle Teamkollegen, egal wie viele) und F1-Durchschnitt.
**Prinzip Cevert vs. Stewart:** Cevert verliert das interne Duell ständig, schlägt aber den Rest des Feldes deutlich —
beides muss sichtbar bleiben.

**Retirements:** bei hoher DNF-Rate der Ära oder des Rennens fällt die Kritik geringer aus (ggf. Division durch
Gesamt-DNF). Fahrerbedingte Ausfälle (Crash/Kollision/Off-Track) stärker gewichten → **Liste aller DNF-Arten über
alle Ären erstellen und in mechanisch/fahrerisch sortieren**. Ökonomisch: Autos mit vielen Ausfällen kosten Geld,
unabhängig von der Schuld.

**Gewichtung:** alle Teilnahmen an Quali und Rennen werden bewertet, Rennen zählt doppelt gegenüber Quali
(inkl. Pre-Quali).

---

## ❌ Offen — Daten & Meldeplan

- **Nie-Wechsler-Liste** vervollständigen (`NEVER_SWITCH`/`LOYAL_DRIVERS` = 0 Treffer). Auch Lance Stroll, aber
  nur gültig bei Aston Martin.
- **Kurtis Kraft 1959:** Troy Ruttman meldet trotz Zufallswürfel zwei Grands Prix (sofern noch aktiv); die Regel,
  dass Kurtis Kraft seinen besten Fahrer (nicht zwingend Rodger Ward) zum US GP 1959 meldet, muss bleiben —
  sonst Game-Breaking-Bug, sofern Kurtis Kraft noch existiert.
- **Bellasi** hat mehr als 1 Fahrer → Kleinstkonstrukteure auf ihre wenigen Einsätze prüfen.
- **Surtees 1975:** John Watson zu selten, Dave Morgan fehlt komplett → Verdacht auf Bug in der
  Meldelisten-Formel pro Konstrukteur.
- **Fangio:** fuhr 1952 nicht, 1953 wieder da. Bei Sim-Start 1952 fix für 1953 bei Maserati einplanen;
  Fallback anderes Top-Team.
- Siehe auch `DNQ_MELDEPLAN.md` (Grid/DNQ-Bauplan, wartet auf Bau-Go).

---

## ❌ Offen — Namen & Daten-Export

- **USA-Namenspakete prüfen:** hispanischer Nachname + angelsächsischer Vorname von rein hispanisch trennen;
  alles Hispanische in den frühen Jahren eher unüblich.
- **DDR:** übernimmt alle historischen Namenslisten von Deutschland (ein Einzeiler genügt evtl.), aber
  **eigener Nachnamen-Pool** — mehr Krause, weniger Jansen. Im Code existiert DDR bisher nur als Nation/Flagge.
- **Alle verwendeten Namenslisten leserlich exportieren:** mehrere Dateien, inkl. Ära- und Ethno-Listen,
  Index aller Listen als eigene Datei, Weltkarten-Übersicht.
- **Separate JSON-Exports** (gut für gezielten Agenten-Review): Fahrersteckbrief-Historie, Teamsteckbrief-Historie,
  All-Time Fahrer, All-Time Teams.
- **F2/F3-Rennfahrer-Fotos crawlen**, dabei fehlende Fahrer ab 2022 ergänzen.

---

## ❓ Nicht prüfbar ohne reproduzierenden Spielstand

- Streckenliste bekommt nach mehreren simulierten Saisons **Duplikate mit Rechtschreibfehlern** + nur
  Chequered-Flag-Fallback (Screenshot im Doc angekündigt)
- **Auto-Save zerstörte erstelltes Team**; neue Saison löscht erstellte Teams
  → gewünscht: freie Wahl, ob die aktuelle Saison überlebt, bis zur manuellen Löschung
- **doppelter Fahrer in angeblich zwei Teams** (`Screenshot 2026-07-17 201041.png`, `…200914.png`)
- **Zufriedenheitsverlauf:** soll sofort starten statt ab Rennen 3, Ampelfarben; die Zufriedenheit der *aktuellen*
  Saison bleibt ab Rennen 3, davor im Verlauf als „?"
- **Zakspeed-Logo** zeigt nur das „Z" — Logo-Bestand wurde in .15.34 erneuert, Darstellung im Spiel gegenprüfen

---

## ✅ Seit dem Doc-Stand erledigt (verifiziert 2026-07-29)

| Doc-Punkt | Beleg |
|---|---|
| `ent_COL_1987` / `ent_EUR_1988` / `ent_DAL_1988` in Fahrerwertung + Saison-Übersicht | `unpackEnteredTeamId` (:22112), `renderTeamNameColored` in `renderDriverStandings` (:22536/22541) — v0.9.15.28 |
| DNQ wird nicht in der Historie gespeichert; ganze DNQ-Saison ohne Eintrag; Karriere-Historie zeigt Strich statt Team | v0.9.15.12 (Wochenend-Teilnahme statt Start) + v0.9.15.25 (Historie/Matrix) |
| Teamnamen in Rennergebnissen nicht in Teamfarbe | `renderTeamNameColored` im Steckbrief (:26773/26775) |
| Ehemalige Teams: kein Pace-Verlauf-Button, fehlende Teams in der Fahrer-Historie, tote Links | v0.9.15.27–.32 (`makeTeamMatcher`, `collectTeamIdAliases`, `getFormerTeamIndex`) |
| Reserve-Pool: Talente vs. Free Agents trennen | `isPoolTalent` + Tabs in `renderReservePool` (:8606–8613) |
| H2H pro Rennwochenende statt nur pro Saison | `trackTeammateDuels` (:10241) — aber Einschränkung oben beachten |

---

## Quellen aus dem Doc

- Bewertungssystem: <https://claude.ai/chat/bf5ab246-0dc5-4121-bbcc-7d708b1492ac>
- Grid-/DNQ-Projekt: <https://claude.ai/chat/99b0bc20-316b-4f8a-aaab-ca48d308a3f8> → `DNQ_MELDEPLAN.md`
- F2/F3-Fotos: <https://claude.ai/chat/67cf6bca-d074-44f5-a3ff-7a06a5274024>

*Hinweis aus dem Doc: „Achtung Liste ist an sich länger. Das hier ist nur ein Ausschnitt."*
