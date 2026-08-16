# F1 RPG – Post-Release Ideen

> Brainstorming nach v1.0. Keine Verpflichtung, kein Aufwands-Commitment.
> Sortiert nach Kategorie, nicht nach Priorität.

---

## Narrativ & Atmosphäre

### Alt-History Branching Points
An historisch definierten Schlüsselmomenten bekommt der Spieler eine Entscheidung angeboten, die auf echten Verhandlungen basiert.
- "Ferrari hat Lauda für 1977 angefragt. Annehmen?"
- Villeneuve überlebt Zolder 1982 mit 30% Chance – Schmetterlings-Effekte auf Team/WM
- Senna-Imola 1994: Bergier-Szenario möglich?
- Basis existiert: alle Daten vorhanden, nur Event-Tabelle + Verzweigungslogik fehlt

### Zeitung / Headline-Generator
Nach jedem Rennen oder Saisonende eine stilisierte Zeitungsschlagzeile, automatisch aus Spielzustand generiert.
- "SENNA TAKES MONACO IN THE RAIN – TEAM LOTUS IN CRISIS"
- Template-Logik, kein manueller Content
- Scrapbook-Ansicht: alle Headlines einer Karriere durchblätterbar

### Familien-Dynastien
Vater-Sohn-Beziehungen automatisch erkennen und im Fahrerprofil anzeigen.
- Hill/Hill, Villeneuve/Villeneuve, Rosberg/Rosberg, Fittipaldi/Fittipaldi
- Badge im Profil, eigener Filter in der Fahrerliste
- Daten aus F1DB bereits vorhanden (family-relationships)

### Hall of Fame
Ein lebendig wachsendes Dokument des eigenen Playthroughs.
- Weltmeister chronologisch mit Portrait, Team, Punkten
- Besondere Einträge: meiste Siege, jüngster/ältester Champion, tödlichste Saison
- Automatisch gepflegt, kein manueller Input

---

## Strategie & Management

### Rival-Team AI mit echtem Signing-Verhalten
Andere Teams bieten aktiv um Fahrer, reagieren auf deine Entscheidungen.
- Wenn du Senna holst, reagiert McLaren und verpflichtet Prost
- Teams haben simulierte Budgets und Prioritätsprofil (Titelkandidat / Entwicklungsteam / Sparteam)
- Macht die Transferperiode zum echten Duell statt One-Way-Shopping
- Schwierigste Frage: wie tief greift die AI in historische Rosters ein?

### Technical Development Tree
Pro Saison ein Budget aus "Entwicklungspunkten" auf Bereiche verteilen.
- Aerodynamik / Motor / Fahrwerk / Pitstop-Crew
- Jede Wahl beeinflusst carSpeed-Trajektorie anders (Aero = sofortiger Effekt, Motor = langfristig)
- Historische Boni: bei hohem Aero-Level in den 90ern kommt Newey auf den Markt
- Ersetzt oder ergänzt das bestehende Chassis-Würfelsystem

### Sponsor-System
Titelsponsoren mit era-korrekten Marken (Marlboro, JPS, Rothmans, Petronas, Santander...).
- Sponsor zahlt Budget, stellt aber Bedingungen (mind. X Punkte / Rennen)
- Bei Schlechtleistung: Abgang → Budgetkrise → Fahrermarkt eingeschränkt
- Macht schlechte Saisons spürbar statt nur kosmetisch
- Livery-Farbe optional dynamisch anpassbar

### Budget-System
Einnahmen: Preisgelder, Sponsoren, Konstrukteurs-WM-Prämie.
Ausgaben: Fahrergehälter (era-abhängig skaliert), Chassis-Entwicklung, Reisekosten.
- Backmarker-Teams historisch korrekt unter Druck (Brabham 1992, Lotus 1994)
- Budget-Krise als optionaler Modus einschaltbar

### Pre-Season Testing
Vor Saisonstart 3 simulierte Testtage – Ergebnisse geben verrauschte Hinweise auf wahre carSpeed.
- Ferrari ist 0.4s schneller als alle. Aber ist das repräsentativ?
- Erzeugt Vorfreude + taktische Fehleinschätzungen, genau wie real
- Technisch fast nur ein Mini-Simulationslauf mit Noise-Overlay

---

## Fahrer-Psychologie & Dynamik

### Morale-System
Jeder Fahrer hat einen versteckten Moralwert, der Pace und Verhalten beeinflusst.
- Teamkollege 5 Mal hintereinander vor dir → Morale sinkt, Pace leidet leicht, Wechselneigung steigt
- Historisch belegbar: Piquet vs. Mansell 1986–87, Prost vs. Senna 1988–89, Webber vs. Vettel
- Emergentes Storytelling ohne geskripteten Inhalt
- Sichtbar im Fahrerprofil als "Stimmung"-Indikator

⚠ **Potenzieller Konflikt mit dem Bewertungssystem — vor dem Bau klären.**
Hauptreferenz: `memory/project_satisfaction_and_chassis_flight.md` (Zufriedenheit, Ansehen,
Chassis-Flucht). Dort ist ein sichtbarer Zufriedenheits-Balken geplant, der auf denselben Auslöser
reagiert (Teamkollegen-Duelle → Wechselneigung). Es gäbe dann **vier** Werte für dieselbe
Fahrer-Gemütslage: `reputation` (Ansehen, gebaut), `evaluateDriverPerformance().score`
(Zufriedenheit, gebaut), der geplante Team-Zufriedenheits-Balken und dieser versteckte Moralwert.
Auch die Datenquelle überschneidet sich: „Teamkollege 5 Mal hintereinander vorne" ist exakt das
bereits vorhandene `h2hSeason`.
**Der eigenständige Kern dieser Idee ist die Pace-Wirkung** — Morale greift in die Simulation ein,
das Bewertungssystem nur ins Marktverhalten. Wenn Morale gebaut wird, dann als *Pace-Overlay auf
die vorhandenen Werte*, nicht als fünfter eigener Zähler.

### Anpassungsfähigkeit (A63, erweitert)
Fahrer-Attribut das bestimmt, wie gut ein Pilot sich an neue Situationen anpasst.
- F1-Wagen-Anpassung (Hamilton zu Ferrari), Formelwagen-Umstieg (Andretti), Open-Wheeler (Surtees)
- Kurze Eingewöhnungsphase bei Teamwechsel: erste 3 Rennen leicht reduzierter Pace
- Hochwertige Anpassungsfähigkeit = kein Malus, niedrige = bis zu -5 Pace für halbe Saison

### Karriere-Ziele & Vertragspoker
Fahrer haben eigene Karriereziele, die ihre Wechselbereitschaft bestimmen.
- Junger Fahrer: will zu Top-Team wechseln sobald möglich
- Erfahrener Fahrer: will WM-würdiges Auto oder zieht sich zurück
- Gehaltsverhandlung: Fahrer fordern mehr bei steigender Pace/Titeln → Budgetdruck

---

## Teambuilding

### Teamstaff-System
Hire/Fire: Chefdesigner, Teammanager, Renningenieur.
- Jede Rolle beeinflusst einen Gameplay-Parameter
- Newey → Aero-Bonus; Colin Chapman → Innovationsbonus aber höhere DNF-Rate; Ron Dennis → Konstanz-Bonus
- Historische Figuren mit era-korrekter Verfügbarkeit
- Staff kann von Konkurrenten abgeworben werden

### Multi-Generationen-Karriere
Nach ~20 Saisons oder freiwilligem Rücktritt: Teamführung an Nachfolger übergeben.
- Eigener Name + Führungsstil wählbar
- Teamlegacy, Konstrukteurs-Stammbaum, "Du führst das Erbe von Enzo Ferrari fort"
- Endlos spielbar über mehrere Jahrzehnte

---

## Rennsport-Erweiterungen

### Non-Championship-Rennen (A23, Post-Release-Ausbau)
Frühe Saisons realistisch lang machen.
- Silverstone International Trophy, Pau GP, Goodwood, Formula Libre
- Im Kalender filterbar (alle / nur WM / nur Non-Champ)
- Farblich unterschieden, eigene Statistik-Kategorie
- Auch tödlich (historisch höhere Rate bei Nicht-WM-Rennen)

### AAA / USAC-Saison (A51)
Separates parallel laufendes Meisterschaftsmodul.
- Indy-Statistiken zwischen beiden Serien geteilt
- Getrennte Fahrerlisten, eigene Teamstruktur
- Fahrer die in beiden Serien aktiv sind: Gurney, Hill, Clark, Andretti
- Indy 500 bleibt Teil beider Welten (1950–1960 WM-Zählung)
- Quasi ein zweites Spielmodul – kann unabhängig entwickelt werden

### Qualifying-Modi
Verschiedene historische Qualifying-Formate.
- 1950er–70er: Zeittraining (beste Runde aus 2 Sessions)
- 1980er–90er: Turbo-Qualifying, Sonder-Reifen-Limit
- 1996–2002: 12-Runden-Aggregate
- 2003+: Single-Lap, dann K.O.-Format
- Gibt jedem Wochenende ein eigenes Rhythmusgefühl

---

## UI & Darstellung

### Live-Ticker: Dramatik-Upgrades
Das Ticker-System existiert – diese Erweiterungen würden es emotional aufwerten:
- **Battle-Widget**: "HUNT vs LAUDA – 0.3s – 8 Runden" groß hervorgehoben wenn zwei Fahrer < 1s auseinander
- **Championship-Implikationen live**: "Wenn es so bleibt: Lauda WM – Hunt braucht Suzuka-Sieg"
- **Ingenieur-Radio**: statt generischer Event-Meldungen situations-spezifische Sprüche ("Box, Box, Box – Wetterreifen!")

### Dramatik-Index
Post-Saison-Screen der bewertet wie spannend die WM war.
- Letzter-Rennen-Entscheid, Punktedifferenz, Anzahl Führungswechsel, Anzahl Titelkandidaten
- "Diese Saison war die dramatischste deiner Karriere" / Vergleich mit 1976, 2008, 2021
- Einzeiler, keine komplexe Logik

### Strecken-Charakter-Screen
Vor jedem Rennen eine kurze Strecken-Info-Karte.
- Streckentyp (Stadtrennen / Highspeed / Technik), historische Besonderheiten
- Wer ist hier historisch dominant? (Monaco → Senna 6x)
- Macht jeden GP individuell statt austauschbar

---

## Technisch / Infrastruktur

### Savegame-Export / Import
Spielstand als JSON-Datei exportieren und auf anderem Gerät weiterspielen.
- Mobilgerät → Desktop und zurück
- Community-Sharing: "Mein 1976-Playthrough – bitte weiterspielen"

### Replay-Modus
Eine abgeschlossene Saison noch einmal als schnelle Animation durchspielen.
- Alle Rennergebnisse bekannt, nur Visualisierung
- WM-Kurve animiert, Höhen und Tiefen des Jahres

---

## Offene Fragen / Konzepte ohne klaren Umsetzungsweg

- **Wetter-Strategie-Tiefe**: Reifenwahl vor dem Rennen mit echtem Trade-off (Soft = schnell aber degradiert, Hard = langsam aber hält durch)
- **Fahrerschule / Nachwuchsprogramm**: eigene Talente ausbilden, lange Vorlaufzeit, unsicheres Ergebnis
- **Teamfusionen / Übernahmen** als Spieler-Aktion: kaufe Team X und integriere Fahrer + Wagen
- **Grid-Walk / Atmosphären-Modus**: reiner Flavor-Screen vor dem Start, kein Gameplay-Impact

---

---

## UI-Redesign mit Claude Design

Nach v1.0 könnte die UI mit **Claude Design** (claude.ai/design, Pro-Plan) gezielt modernisiert werden.

**Empfohlener Workflow:**
1. Einzelne Komponente isolieren (z.B. Rennergebnis-Kacheln, Standings-Tabelle, Kalender)
2. Screenshot in Claude Design hochladen + Prompt mit Stil-Wunsch (z.B. „F1 dashboard, dark, mobile-first")
3. Mit KI-Schiebereglern Farben/Abstände/Layout iterieren
4. CSS-Muster extrahieren → chirurgisch in den Monolith einbauen

Geeignet für neue Komponenten und Layout-Experimente – nicht für Bugfixes oder Logik.

---

*Stand: 2026-03 – nach v0.9.9.68, vor v1.0*
