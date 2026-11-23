# Offene Fixes & Features

Bereinigte Fassung der Google-Doc-Sammelliste **„F1 RPG neue Fixes"**
(Original-Doc `1-bE5uXu5dFeq-eBJ4V2zm1mIdTbtNknb5wty1M4CICg`, zuletzt bearbeitet 2026-08-07 — bleibt unverändert).

**Abgeglichen gegen:** v0.9.21.45, Prüfdatum **2026-11-23** (vorher 2026-11-23 @ v0.9.21.44). v0.9.21.28–.30 (Ticker-Rennverlauf, Boxenstopps, Überholschwelle ab 2010) berühren keinen Listenpunkt. **2026-11-12:** alle offenen Punkte einzeln gegen den Code geprüft, Befunde mit „(Code 12.11.2026)“ vermerkt.
**Methode:** Code, Changelog und Git-Log. „Erledigt" heißt: Mechanik im Code nachweisbar — **nicht** funktional im Browser getestet.

**Diese Datei ist die Quelle.** Sie wird bei jeder Änderung in ein Google Sheet gespiegelt
(Ordner „F1 RPG HTML", Titel „F1 RPG Fixes – Ist-Stand", Blätter „Fixes" und „Konzepte").
Das Sheet wird in place überschrieben, **der Link bleibt gleich**; ihn nennt
`node tools/spiegel-fixes.js`. Zeilen, die im Sheet von Hand angelegt oder geändert werden, markiert
Spalte „Prüfen"; sie landen vor dem nächsten Überschreiben im Abschnitt „✚ Aus dem Sheet – ungeprüft".

Status: ✅ erledigt · ◐ teilweise · ❌ offen · ❔ unklar (nur im Spiel prüfbar)

---

## ✚ Aus dem Sheet – ungeprüft

Im Sheet von Hand eingetragen, noch nicht eingeordnet. Beim nächsten Abgleich prüfen und einsortieren.

- ✚ Anregungen aus diesem Fremd-Projekt: https://claude.ai/chat/0ce1c8c7-5e84-4efd-9ad4-81236b4f516e

---

## ◐ Teilweise erledigt

### Strafversetzung (Startplatz ≠ Quali-Platz, seit v0.9.21.22)
- ✅ Häufigkeit der Grid-Strafen pro Rennen + pro Saison, Anfang der Saison eher unwahrscheinlich, manchmal abhängig
  von Unfall aus Rennen zuvor: drei Arten mit Verlauf über die Rennnummer (sportlich 3/5 Plätze gleichmäßig, Teile
  nie im Auftaktrennen und Höhepunkt Rennen 13–17, Boxengasse), nach Unfall × 1,8 (v0.9.21.26, BEFUNDE.md 19.10.2026 (4))
- ✅ Grid-Strafen-Startplatz-Malus darf die Bewertung nicht verschlechtern, weder Startplatz noch Ergebnis — „wichtig
  ist, was man draus macht": Startplatz zählt über den Quali-Platz; Zielplatz bekommt eine Gutschrift in Höhe dessen,
  was eine Strafe im Mittel kostet (`STRAFE_ZIEL_GUTSCHRIFT`, v0.9.21.27). WM-Punkte bleiben absolute Punkte

### Head-to-Head
- ✅ Duelle pro Rennen **und** Quali (`trackTeammateDuels`), Karriere-H2H paarweise über Jahre gespeichert (v0.9.14.62)
- ✅ **Steckbrief-Tabelle zeigt Renn- und Quali-Duelle** je Teamkollege, aus den gespeicherten Ergebnissen
  (`teamkollegenDuelle`) — vorher nur gewonnene Saisons nach Punkten (v0.9.21.9)
- ✅ **Teams mit 3+ Fahrern:** in der Tabelle zählt jedes Paar (v0.9.21.9). Der Zähler fürs Ansehen
  (`trackTeammateDuels`, bricht bei `pair.length !== 2` ab) bleibt **bewusst** so — Nutzer-Entscheid 14.10.2026,
  sonst ändert sich das Balancing der Klassik-Ära
- ✅ historische Saisons/Duelle/Rennen/Quali **rückwirkend:** simulierte Saisons aus dem Archiv (v0.9.21.9), echte Jahre
  vor dem Spielstart aus F1DB (v0.9.21.10). Teamkollege = selber **Konstrukteur** — so zählt auch das Spiel, dort ist
  „Team" der Konstrukteur (1958: Maserati 18, Cooper 14 Fahrer). Quali aus `F1DB_QUALIFYING` (alle 1149 Rennen), Startplatz nur als Rückfall. DNQ = verlorenes Quali-Duell, zwei DNQ nach Zeit; DNPQ hinter allen Quali-Teilnehmern, untereinander nach Vorquali (`F1DB_PREQUALIFYING`, neu aus F1DB) — so auch in simulierten Saisons (Nutzer-Regel 14.10.2026; Zakspeed 1989 Schneider/Suzuki 0:0 → 13:3).
  **Indy 500 zählt nicht** (Nutzer-Entscheid 14.10.2026), der Indy GP 2000–07 schon
- ◐ Graham-Hill-Fall (Fahrer im eigenen H2H, grau, 0:0): Ursache — derselbe Fahrer stand in einer Saison unter
  einer zweiten ID (Zeitstempel-IDs), ausgeschlossen wurde nur über die ID. Jetzt auch über `histId`/Name (v0.9.21.9).
  Nutzer-Hinweis: am besten mit mehreren Spielständen prüfen — 1 Stand geprüft (1950–2010, v0.9.21.8): 825 Steckbriefe, kein Selbst-Eintrag (`h2h-steckbrief.js --stand`); weitere Stände offen
- ✅ **Übersichtlicher:** im selben Team gemeldet, aber nie am selben Wochenende → eigene Zeile unter der Tabelle (v0.9.21.9)
- ✅ **Sortierbar nach Leistung in Prozent** (Anteil gewonnener Renn-Duelle), dazu Zeile „Gegen alle" (v0.9.21.9).
  Spalte „Sais." entfallen (= Zahl der Jahres-Badges), sonst passt die Tabelle bei 390 px nicht
- aktuelle Saison separat anzeigen ist gewünscht, nicht Bug

### Reserve-Pool
- ✅ Talente (nie in F1 gestartet) getrennt von Free Agents (Ex-Fahrer ohne Cockpit) — v0.9.14.56
- ✅ **Potenzial-Pace** steht jetzt neben der Pace in jeder Zeile (v0.9.21.3)
- ✅ **Sortierung umschaltbar:** Zuletzt gefahren / Pace / Potenzial, erneuter Klick dreht die Richtung (v0.9.21.4)
- ◐ realistisches Durchschnittsalter für Talente: Pool hält ≥ 15 junge Talente frisch (Alters-Peak 32 → 30),
  aber kein FP1-Freitagsfahrer-Kriterium

### Verfrühtes Poaching junger Top-Fahrer
Symptome laut Doc: Nigel Mansell Mitte 1970er, Jack Brabham Mitte 1950er.
- ✅ Pace und Potenzial vor dem realen Debüt gedämpft (Reifekurve statt Inaktivitäts-Abbau), Talente unter 19
  nicht verpflichtbar, Abwerben mitten in der Saison nur bei deutlichem Aufstieg, zu junge Debüts 11 → 7 %
- ✅ Beim Spielstart landen keine real bereits verstorbenen oder zurückgetretenen Fahrer im Reserve-Pool
  (Jim Clark meldete 1974 noch 7,5-mal pro Saison)
- ❌ **dreiteilige Pace** (im Code `juniorPace`/`rookiePace`/`peakPace` = 0 Treffer):
  - **Junior-Pace** = fiktive Pace vor dem realen Eintritt, für reale F1- und reale F2/F3-Fahrer des Reserve-Pools
    (**nicht** Junior-Welt). Linear vom frühestmöglichen Eintrittsalter (19) bis 1 Jahr vor realem Eintritt.
  - Im Grid erscheint Junior-Pace als dritter Balken über Current Pace; Current Pace heißt dann vorübergehend
    **Rookie-Pace**. Ab dem realen Eintrittsjahr verschmelzen beide.
  - Potential Pace ggf. zu **Peak** umbenennen.

### Inaktivität
- ✅ Inaktivitäts-Abbau −2,5 Pace/Jahr, monatsgenau (v0.9.9.95–.99); Altersabbau repariert
  („verpuffte, weil potentialPace stehenblieb")
- ❔ inaktive Top-Fahrer (häufig Vettel) ohne Alters-/Inaktivitäts-Degradierung — im Spiel prüfen, ob damit erledigt
- ❌ **Inaktivitäts-Malus als sichtbare Zahl** in Pace-Verlauf und Steckbrief (Fall Jan Lammers); Abbau von
  Rennwochenende zu Rennwochenende, Idee: gefahrene Kilometer inkl. Training und Quali (Runden × km/Runde)

### Bewertungssystem (eigenes Teilprojekt)
- ✅ v0.9.18.20 Bewertung und Ansehen relativ zum Auto + Rohdiamant-Konzept; Ansehen als Marktwert mit
  Weltmeister-/Team-Bremse; v0.9.18.23 Marktvergleich für Hinterbänkler; Balken ab erster Wochenend-Teilnahme
- ✅ Fahrer parken nicht mehr jahrelang hinten: dauerhaft zu langsam ohne Potenzial → gegen Fahrer mit Perspektive getauscht
- ◐ Hinterbänkler in Ären mit vielen Ausfällen nicht mehr zu oft entlassen — DNF-Rate als Kritik-Dämpfer nur dort
- ❌ **Weniger Meldungen ≠ Malus** (Konzept, noch nicht einbauen; Sheet 12.11.2026): schlechterer WM-Platz, weil der
  Fahrer weniger Wochenenden gemeldet war, darf nicht bestrafen; mehr Erfolge an sich geben mehr Bonus. Es zählen
  Ergebnisse und alle anderen Faktoren
- ❌ noch nicht belegt aus dem Doc-Konzept:
  - **Erwartung nach Vorsaison-Konstrukteursplatz:** Platz 1 → P1/P2, Platz 2 → P3/P4, … Platz 11 → P21/P22;
    besser = Multiplikator (~×1,2), schlechter = Malus, gleich = neutral. Quali + Pre-Quali zusammengezählt
    (Pre-Quali nach Rundenzeit hinten angehängt). Rennen: nur Zieleinfahrten, daher gekrümmt — Idee: Gridplatz
    mit Rennergebnis und Zahl der Zieleinfahrten verrechnen (Grid 4, Ergebnis 12 bei 13 Zieleinfahrten).
    Überperformance ist Mathematik, keine Zielliste (Life qualifiziert sich, Sauber gewinnt, AGS punktet).
  - **Zeitfenster:** letzte 5 Saisons als EMA, aktuelle Saison am stärksten — im Doc selbst hinterfragt
  - **Bonus:** konstant überdurchschnittlich, schnellste Runde, **Rookies mit sofort guter Leistung**
  - **Malus:** DNQ, konstant schlecht
  - **Bezugsgrößen:** ELO über das ganze Feld + Team-Durchschnitt (alle Teamkollegen) + F1-Durchschnitt;
    **Prinzip Cevert vs. Stewart** — verliert das interne Duell, schlägt aber den Rest deutlich
  - **DNF-Kategorien:** Liste aller DNF-Arten über alle Ären, sortiert in mechanisch/fahrerisch; fahrerbedingte
    stärker gewichten. Autos mit vielen Ausfällen kosten Geld, unabhängig von der Schuld
  - **Gewichtung:** Rennen doppelt gegenüber Quali (inkl. Pre-Quali)
  - offene Frage im Doc: wieso sollten schwache Fahrer geringere Erwartungen haben? Hinten fahren kann
    Konstanz bedeuten; Erfahrung soll den Konstanz-Skill heben

### Weitere Teil-Erledigungen
- ◐ **Letzte 5–10 Saisons im Steckbrief direkt sichtbar:** 5-Saisons-Verlauf der Bewertung, Rennergebnisse
  aufklappbar je Team/Jahr; eine feste Saison-Übersicht dieser Art fehlt
- ◐ **Mobil-Responsivität** (Querschnittsregel): Regler mobil gesperrt (v0.9.16.12); Checkbox-Zeilen im
  Datensatz-Manager bei 390 px am 11.10.2026 gemessen: keine läuft mehr über, sie brechen um
- ◐ **F2/F3-Fotos:** 144 Feeder-Fahrer, 77 mit Foto (Abgleich gegen Wikidata/DriverDB); fehlende Fahrer ab 2022 ergänzen
- ◐ **Surtees 1975:** „galt als Kleinstkonstrukteur, Watson fuhr nur sporadisch" behoben; ❔ Dave Morgan steht
  inzwischen in den Daten (f1db.js, hist.js) — ob er 1975 meldet, im Spiel prüfen
- ◐ **Entlassene Fahrer:** landen sofort im Free-Agent-Pool, Same-Team-Guard; ob der Ringtausch unter Entlassenen
  weg ist, nicht gemessen
- ◐ **Bellasi > 1 Fahrer:** owner-only seit v0.9.10.14 — also schon VOR der Notiz im Doc; die Kleinstkonstrukteur-
  Fixes Juli/August („7 Wege ins Cockpit hatten die Regel umgangen") dürften es gelöst haben, im Spiel prüfen
- ◐ **DDR-Namen:** Platzhalternamen behoben; ❔ eigener Nachnamen-Pool (mehr Krause, weniger Jansen) nicht belegt
- ◐ **Links prüfen:** viele Einzelfixes (historische Fahrer, Groß-/Kleinschreibung, Zurück/Vor-Verlauf), keine
  systematische Prüfung
- ◐ **Konstrukteurs-Matrix:** Team-Matrix existiert (`renderTeamRaceGrid`); ❌ Vorgabe „nur bestes Team-Ergebnis
  pro Rennen + Warnhinweis oben" fehlt

---

## ❌ Offen

### Weltmeister-Tab (`renderChampions`)
- ✅ Jahre **vor** Spielstart zeigen jetzt Fahrer-WM-Punkte (`F1DB_STANDINGS`), Konstrukteursweltmeister und
  -Punkte (`HIST_CONSTRUCTOR_CHAMPIONS` in `data/hist.js`, offizielle Wertung ab 1958) — v0.9.21.3.
  Vor 1958 bleibt „-": da gab es keine Konstrukteurs-WM. Der historische Konstrukteur ist nicht verlinkt.
- zusätzliche Tab-Auswahl mit Detail-Tabellen nach Wikipedia-Vorbild, **Vorlage auf Deutsch**
  - <https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions>
  - <https://en.wikipedia.org/wiki/List_of_Formula_One_World_Constructors%27_Champions>

### All-Time-Statistiken
- Team-Tabelle: **keine Spalte Konstrukteurs-WM** (Titel-Spalte nur bei Fahrern)
- **Filter „nur aktive Fahrer"** in All-Time-Statistiken und Rekorde-Tab. Die grüne Hervorhebung im Rekorde-Tab
  gibt es seit 13.11.2026 (Code-Fix, `_recordActiveSet`, siehe ❔); der Filter fehlt weiter

### Einstellungen
- **Rennmodus als feste Voreinstellung**, damit ein Klick genügt — weiterhin Auswahlfenster
  Klassisch / Live-Ticker / Selbst fahren

### UI
- ✅ **Ersatzfahrer nach Todesfall verlinkt** (Beispiel im Doc: Jock Russell für Graham Hill) — in der Übersicht
  bei „Tödliche Unfälle außerhalb der WM" und im Saisonende-Fenster; der Nekrolog hatte den Link schon — v0.9.21.3
- ✅ **Zufriedenheitskarte:** aktive Fahrer ohne Bewertung sehen die Karte mit „?" statt gar keiner — v0.9.21.3.
  Offen bleibt: der Verlauf zeigt nur die letzten 5 Saisons
- ❔ **Team-Historie-Layout (S / P / Pkt. / WM)** auf Karriere-Historie von F1- und Junior-Welt-Fahrern übertragen,
  Designänderungen künftig synchron halten — Übertragung nicht belegt
- **Team-Steckbrief, Team-Historie und Rennergebnisse:** entlassene Fahrer verschwinden aus beiden Bereichen.
  Sollen bleiben, nur ohne Vertrag, evtl. mit Emoji „nicht mehr aktiv bei diesem Team"
- **Fahrer-Steckbrief, Rennergebnisse zählen Meldungen statt Rennen** (zwei Sheet-Einträge zusammengefasst):
  (a) Kalender sind unterschiedlich lang — sichtbar machen, ob der Fahrer trotzdem alle Rennen gemeldet war;
  (b) Saisons, die nur aus DSQ bestehen, fehlen
- ❔ **WM-Stand: Reserve-Driver-Bug** — alt und hartnäckig; derzeit nicht nachweisbar (Nutzer 12.11.2026), beim nächsten Auftreten Symptom + Spielstand sichern

### Teamlinien & Umbenennungen
- ◐ **Stroll-Sonderfall:** `LOYAL_OWNER_DRIVERS` (`data/hist.js`) führt Stroll nur unter `aston-martin`, Vertrag
  lebenslang seit v0.9.16.0; Racing Point 2019–20 seit 12.11.2026 ergänzt (Code-Fix, im Spiel unbestätigt). Offen bleibt nur der Privateer-Teil. Wunsch: ab Racing Point bis Karriereende im Team; Racing Point → Aston Martin zählt mit, er wird
  übernommen. Späteren Privateer-Status abschaffen — entweder fest oder gar nicht. Durch seinen Vertrag gibt es nur
  noch ein weiteres Cockpit, Privateer ist keine Ausweichmöglichkeit mehr

### Strecken & Kalender
- ◐ **Rennkalender / Reisebelastung 1950–1985** (drei Sheet-Einträge zusammengefasst; Gemini-Chats
  <https://gemini.google.com/app/92f1856b2cac4058>, PDF `OneDrive/Dokumente/F1 Simulator_ Termin- und Reiseplanung.pdf`;
  Dialog-Backup im Wortlaut in Git, Commit 35ad4f5). Kern: WM-Läufe, Nicht-WM-Rennen und andere Serien farblich
  getrennt; Terminkonflikte; Reisebelastung (Tage, Zeitverschiebung, Entfernung, auch über den Jahreswechsel);
  Importer für Wikipedia-Tabellen und 7-Zeilen-Blöcke mit Vorschau. Bausteine im Projekt: F1DB-Kalender +
  Streckenkoordinaten, `data/places.js`, echte Zeitzonen (IANA) statt fester GMT-Liste. Mängel im Gemini-Code: feste
  Zeitzonenliste ohne Sommerzeit, Parser nur über Tabulatoren, Sortierung bricht nach Neuladen, „Cache leeren" löscht
  den ganzen Speicher. **Entscheidung Nutzer 22.10.2026:** (1) beides — Kalender (welche Rennen kollidieren) UND Fahrer
  (wer fuhr wann wo). (2) erst eigenständiges `rennkalender.html`; Einbau in die Haupt-HTML später, wenn das Spiel
  weitere Rennserien kennt. Stand (Code 12.11.2026): `rennkalender.html` steht seit 25.10.2026 (WM, Nicht-WM, Sportwagen-WM
  1953–85, Formel 2; Fahrer-Ansicht, Zeitverschiebung mit Sommerzeit, Daten aus `tools/build-rennkalender.js`);
  Einbau in die Haupt-HTML bleibt offen

### Rennsimulation
- ◐ **Realistische Boxenstopps** — vorhanden (Code 12.11.2026): Team-`strategy` steuert in `simulateRace` Undercut (+1 Platz) und
  Katastrophenstopp, der Ticker erzählt Stopps mit Grund (`pit_langsam`/`pit_gut`/`pit_reparatur`). Fehlt: Stoppzeiten
  je Ära, Boxen-Skill getrennt von Strategie, Folgefehler als Ausfallarten. Wunsch: pro Ära (Jahrfünft oder sogar Jahr) Summe aus Reparatur, Tanken, Reifenwechsel.
  Abweichungen: zufällige Häufigkeit von Boxenstopp-Fehlern (inkl. Länge) und, je nach Team-Skill, Tempo von
  Reparatur/Tanken/Reifenwechsel. Das Top-Team ist nicht automatisch das beste Boxenstopp-Team. Bonus: ein schlechter
  Stopp wirkt nach (Schraube löst sich, falscher Reifensatz) und steuert die Häufigkeit bestimmter Ausfallarten —
  prüfen, auch wenn die Gesamthäufigkeit am Ende gleich bleibt. Hängt am Strategie-Skill des Teams; der Live-Ticker
  dokumentiert das Wichtigste
- **Teileabnutzung (Unfall und natürlich):** Übersicht je Teil zwischen den Rennen, im Fahrer-Steckbrief und im
  Team-Steckbrief bei den Fahrern; läuft zum Saisonende ab. Fahrer ohne Vertrag oder verstorben ohne Info. Teile
  saisongenau nach Stand der Technik. Kann aufblähen, niedrige Priorität — offen, ob es sich vor den Zeiten der
  Strafversetzung lohnt

### Fahrermarkt & Daten
- **Red Bull Racing und Schwesterteams:** Verhältnis prüfen und festlegen, Transfer-Wahrscheinlichkeiten in beide
  Richtungen. Red Bull hat wohl nie einen Rookie geholt; vermutlich erst ab 2008/09 gültig
- ◐ **Nachfolgeteams übernehmen Verträge** — laufende ja: `applyTeamSuccessions` (`CONSTRUCTOR_SUCCESSION`) behält
  Fahrer mit `contractEnd` > Vorjahr, `team.id` bleibt, nur Name und Farbe wechseln. ❌ Auslaufende werden nie
  verlängert (gleiche Wahrscheinlichkeit wie sonst), alle werden Free Agent (Code 12.11.2026)
- **Fangio:** fuhr 1952 nicht, 1953 wieder da. Bei Sim-Start 1952 fix für 1953 bei Maserati einplanen,
  Fallback anderes Top-Team
- ❔ **Kurtis Kraft 1959:** Troy Ruttman meldet trotz Zufallswürfel zwei Grands Prix (sofern aktiv) —
  `INDY_F1_CROSSOVER` kennt Ruttman nur 1958, gezielter Fix nicht belegt. Die Regel „Kurtis Kraft meldet seinen
  besten Fahrer zum US GP 1959" steht weiter in `data/hist.js` und muss bleiben; Absicherung für den Fall,
  dass Kurtis Kraft nicht mehr existiert, ungeprüft

### Fahrer-Stats
Mehr Stats für Fahrer mit Zufalls-Stats (generierte + F2/F3 aus dem **Reserve-Pool**, nicht Junior-Welt),
um Dominanzen zu verringern. Aktuell: Pace (Current + Potential), Regen, Konstanz, Erfahrung. Neu:

Starts · Überholen · Verteidigen · Aggressivität · Konzentration · Reifenmanagement ·
Kraftstoff-/ERS-/DRS-Management · Persönlichkeit · Mentale Stärke

- Erfahrung soll andere Werte mitbestimmen
- Persönlichkeit beeinflusst Verträge und Reaktionen auf WM-Stand/Ausfälle → Rücktritt oder Rauswurf als Folge
- ❌ **Einzelfahrer falsch gewichtet** (Sheet 2026-11-18), Befunde aus den Daten (18.11.2026):
  - **Tim Tramnitz viel zu oft Top-Talent** (real nie einer der Top-Kandidaten), **Joshua Dürksen** ebenso
    (Sheet-Nachtrag 18.11.2026): beide `FEEDER_ELO` Potenzial 98. Ursache (BEFUNDE 18.11.2026): `tools/junior-elo.js`
    legt nur den **Rang** in der oberen Gruppe (36 Fahrer) auf die Potenziale echter Rookies 2010–2025 — und die sind
    Rückschau: 9 von 58 bei 93–98 (Verstappen, Leclerc, Norris …), danach sofort 81. Die obersten ~15 % (Dürksen, Dunne,
    Tramnitz, Minì, Beganovic, Slater) erben Star-Werte, egal wie groß der Elo-Abstand ist. Gemessen wird nur die beste
    Einzelsaison je Serie (F2, F3, FRECA, EFO, GB3, Eurocup-3), keine Karriere, kein Kart. Nutzer 18.11.2026: Werkzeug
    nochmals prüfen; falls Kart dazukäme, anders gewichten
  - **Kimi Antonelli zu unbedeutend:** `PACE_RATINGS` 2025 = Pace 75, Potenzial 81, Konstanz 69 (Russell 98/98), real
    2025 150 Punkte. Bearman 74/74, Hadjar 58/73 ebenso. Ursache: am Datenende fehlt dem Potenzial die Rückschau, die
    Junior-Skala hat sie → **Nahtstelle F1-Pace ↔ Junior-Pace** passt nicht (Junior ohne F1-Platz 98, Rookie mit Podien 81).
    Nutzer 18.11.2026: Opfer des Wechsels in die F1 — gemeinsam mit Tramnitz lösen
  - **Jackie Stewart zu konstant — bestätigt (Monte Carlo, BEFUNDE 18.11.2026, `tests/fahrer-streuung.js`):** Zielplatz-SD
    1,7 statt real 2,6, Podium 56 statt 43 %, Siege 35 statt 27 %, Titel in 41 % der Saisons (real 3 von 9). Kein
    Stewart-Einzelfall: Clark 1,6 statt 2,5, Prost 1,6 statt 2,1, Lauda 2,1 statt 2,6 — den Spitzenfahrern fehlen die
    schwachen Zielankünfte (P4–P11). Gleiches Muster wie der offene Punkt „Dominator von vorn zu selten P4+“
    (BEFUNDE 18.10.2026 (3)). Fix gehört in `simulateRace`, nicht in Stewarts Werte. **Code-Fix v0.9.21.44** (s. ❔
    „Konstanz wörtlich“): Ursache war die Konstanz selbst, nicht Stewart — sie senkte zusätzlich das Rauschen. Streuung
    Spiel ÷ real jetzt 0,90–1,05 in allen Konstanz-Gruppen (vorher 0,70 bei Konstanz ≥ 90). Tramnitz/Antonelli offen

### Namen
- **Namens-Pakete für Fahrerinnen je Nation:** Frauen sind selten, Wiederholungen fallen kaum auf. Frauen-Wahrscheinlichkeit
  je Ära prüfen und einbauen
- ✅ **„'nathan' George": Vorname klein und in Anführungszeichen** — Datenfehler, nicht der Fahrer: GBR-Ära-Kurven trugen `"nathan"`/`"nathaniel"`/`"nate"`
  (CSV-Quotes aus ukbabynames), ITA `Nicolo'`/`Niccolo'`/`Giosue'` (ISTAT-Apostroph), DOM „de Jesus“/„Vda“ als Vorname. Quelle
  korrigiert, Kurven und `names.js` neu erzeugt; Alt-Spielstände nur in der Anzeige korrigiert (`nameAnzeigeFix`). Wächter
  `tests/namen-anzeige.js`, BEFUNDE 12.11.2026

### Junior-Welt
- **Kart-Welt** (erst Konzept, Machbarkeit): nur für den Spielstand generierte, komplette Kart-Welt eines Landes oder einer
  Region; Teilnahme an mehreren Serien, realistische Teilnahmen. Gemini-Chat „Global Pathway Kart-Konzept"
  <https://gemini.google.com/app/e56077b4a25061bd> mit Teilen der Auswertung

### Exporte
- **Alle Namenslisten leserlich exportieren:** mehrere Dateien, inkl. Ära- und Ethno-Listen, Index aller Listen,
  Weltkarten-Übersicht (bisher nur `exportNameStats` als Entwickler-Auswertung)
- ✅ **Separate JSON-Exports** (für Agenten-Review): Fahrersteckbrief-Historie, Teamsteckbrief-Historie,
  All-Time Fahrer, All-Time Teams — Button „Review-Export" (v0.9.21.6)
- ✅ **JSON-Export Saison-Endstände je Jahr:** Fahrer- und Teamwertung mit Punkten, Siegen, DNF, DNQ, DNPQ, Team-Drittel
  nach Quali-Platz (v0.9.21.6; am Export 1950–2015 geprüft: Siege 921 = All-Time Fahrer = All-Time Teams)
- ◐ **JSON-Export Rennergebnisse je Rennen:** Quali-Platz, Ziel, Wetter, DNQ/DNPQ/DNS, Indy-Flags (v0.9.21.6). ❌ DNF-Grund,
  rote Flagge und Regenart nur für die laufende Saison — das Archiv speichert sie nicht (`tests/README.md`)
- ✅ **JSON-Export Fahrermarkt-Chronik über alle Jahre** mit Drittel von/nach/Folgejahr (v0.9.21.6, Korrekturen v0.9.21.7:
  Verlängerungen mit Ziel-Team, Pool statt Platzhalter, Doppel-Entlassungen markiert)
- ✅ **JSON-Export Bewertungs-Verlauf:** Zufriedenheit und Ansehen je Fahrer und Saison (v0.9.21.6)
- ✅ **JSON-Export Todesfälle** mit Ebene und `wmRennTod` (v0.9.21.6)
- ✅ **JSON-Export Rekorde + Weltmeister-Liste:** Top 10 je Rekord, Quellen sim/all (v0.9.21.6)
- ✅ **JSON-Export Junior-Welt getrennt** (v0.9.21.6, Hinweise v0.9.21.8). `aufsteigerInF1` bleibt leer bis zur Phase-5-Brücke
- ✅ **Exporte einheitlich:** gemeinsamer Kopf, Verknüpfung über `histId`/Name, Indy 500/Indy GP getrennt (v0.9.21.6)
- ✅ **Sammel-Export „Review-Paket":** alles in einer Datei inkl. Reserve-Pool und Nationen (v0.9.21.6)

---

## ❔ Unklar — nur mit Spielstand prüfbar

- **Spielstand-Check Thackwell / Berger** (Sheet 2026-11-23: „Spielstand-Check: Mike Thackwell. siehee downloads-ordner.
  gerhard berger karriereende aber trootzdeem seelbes team verpflliichtet“; Nutzer: „der ewige nutzlose Privateer … Berger
  Karriereende kommt aber wieder zurück … im Prinzip alle genannten Punkte“). Code-Fix v0.9.21.45, Spielstände
  F1RPG_1980–1988 vom 20.11.: (1) **Ewiger Privateer:** ohne Start in der Saison lieferte `evaluateDriverPerformance` nichts,
  die Vertragsschleife brach ab → Thackwell blieb mit Vertrag bis 1981 bis 1985 bei Tyrrell. Jetzt „Nicht verlängert (ohne
  Einsatz)“ → Free Agent (Besitzer-Fahrer ausgenommen). (2) **Karriereende und Rückkehr:** `initReservePool` kannte nur
  Feld und Pool, Zurückgetretene galten nach dem Saisonwechsel als unbekannt und wurden neu angelegt (Thackwell: Karriereende
  1985, 1988 aktiv im Pool). Jetzt `karriereVorbeiSets` (history-Rücktritte + Tode) in allen drei Pool-Wegen, dazu
  Aufräumen je Saison wie bei Toten (Stand 1985: 7 → 0). (3) **Entlassung ≠ Karriereende:** Berger (1984 bei Spirit
  entlassen, danach Alfa Romeo) stand als Abgang da; Entlassene mit Cockpit fallen jetzt heraus, sonst eigene Zeile
  „Entlassen“. (4) **Off-Season-Fenster vollständig verlinkt** (Nutzer-Ergänzung): alle Fahrer und Teams, auch in
  Rückblick und Vorschau; der Steckbrief öffnet über dem Fenster, „Zurück“ führt wieder hin (Fenster im Verlauf).
  Geprüft im Browser: 22 Fahrer-, 23 Teamlinks, kein Name ohne Link; Klick → Zurück → Vor stimmt
- **Konstanz wörtlich aus F1DB** (Fix-Liste „Konstanz neu berechnen“; Nutzer 22./23.11.2026). Code-Fix v0.9.21.44:
  Konstanz K = Anteil der Rennen ohne Ausreißer (K 95 = 5 %), aus F1DB gegen die Teamkollegen-Paare gemessen
  (Rennstall + Konstrukteur, mehrere Kollegen gemittelt, Glättung Saison → Karriere → Feld; `tools/build-consistency.js`
  → `data/konstanz.js`), Grenzen 30–95 (keine Hyper-Konstanz). Ein schlechter Tag kostet sicher 4–9 Plätze oder endet im
  eigenen Unfall; Rauschen für alle gleich; Auto-Form je Wochenende für beide Teamkollegen; generierte Fahrer nach realer
  Verteilung mit Ära-Median. Dominator DNF 23 → 21 % (real 16), Streuung 0,90–1,05 (BEFUNDE 23.11.2026). Offen: Fahrer
  mit F1DB-Konstanz um 63 wirken im Spiel wie 71; Feinwerte aus 2 Läufen je Jahr
- **Fahrfehler-Mechanik** (Sheet: „Erst Häufigkeit messen. Oder haben wir das schon, wegen z.b. Regen? Dreherhäufigkeit
  ist nicht direkt messbar. Fahrfehler steuern Crash und Kollisions-Ausfälle mit“). Code-Fix v0.9.21.44: gemessen aus
  jolpica-Runden 1996–2024 × F1DB-Boxenstopps (`tests/fahrfehler-real.js`): Dreher/Ausritt ohne Ausfall (≥ 3 Plätze in
  einer Runde ohne Box) in 3,3 % der Fahrer-Rennen, kaum an die Konstanz gebunden → pauschaler Zwischenfall. Eigene
  Unfälle kommen jetzt aus schlechten Tagen (95 % der Unfall-Ausfälle, verteilt nach 100 − Konstanz, Ära-Summe bleibt).
  Der Ticker erzählt den schlechten Tag als Fahrfehler (Dreher, Ausritt, Verbremser)
- **Reale tödliche Unfälle im Steckbrief.** Code-Fix v0.9.21.43 (Sheet 2026-11-18; Nutzer: Quelle Motorsport Memorial,
  10-Jahres-Fenster nach der letzten F1-Saison, natürlicher Tod unsichtbar): `data/fatal-accidents.js` aus
  `tools/build-fatal-accidents.js` — 143 F1DB-Kandidaten, 117 mit MM-Eintrag (Rennen 72, Training 15, Quali 9,
  Test 12 …). `_todesAkte` zeigt den realen Unfall, wenn er VOR dem Spielstart lag („Tödlich verunglückt 1970 –
  Qualifikation, Gran Premio d'Italia (Monza)“); ab Spielstart entscheidet die Sim. Geprüft im Browser: Start 1980 →
  Rindt, Clark ja; Villeneuve, Alboreto, Bianchi nein; Start 2020 → alle fünf; Hulme und G. Hill nie. Lücke: Pironi
  († 1987 Powerboot) steht nicht bei MM (nur Auto-Datenbank `ct`) und fehlt deshalb
- **Startnummern nach Ära-Regeln.** Code-Fix v0.9.21.42 (Sheet 2026-11-18, Regeln Nutzer 18.11.2026): 1950–1973
  keine Nummern; 1974–2013 Teampaare nach Konstrukteurswertung der Vorsaison ohne 13, fest für die Saison, Teams ohne
  Wertungsplatz → nächste freie Paare, Einzelmelder und dritte Wagen → Rennnummer oberhalb des letzten Paars (nicht im
  Steckbrief); ab 2014 echte Karriere-Nummern (`data/car-numbers.js`), neue Fahrer nehmen eine freie. Vergabe
  `assignSeasonNumbers` (Paare) + `fillCarNumbers` (Spielstart, Saisonstart, nach jedem Rennen, Laden). Probe 1974 =
  echte Vergabe Platz für Platz; 1985–88 und 2012–15: keine Lücke, keine Dublette, keine 13, Laden ändert nichts
  (BEFUNDE 18.11.2026). Nebenbei: das Laden schrieb die Nummern auf den alten Spielstand. Alte Spielstände behalten
  ihre Nummern
- **Lupen-Suche findet nicht jeden Fahrer.** Code-Fix 13.11.2026: `globalSearchInput` durchsucht jetzt auch den
  Reserve-Pool („Reserve“) und `allTimeStATS.drivers` („Ehemalig“, auch generierte Ex-Fahrer)
- **WM-Stand „15/22 Rennen“.** Code-Fix 13.11.2026: Die Kopfzeile zeigt gefahrene/alle Rennen, in Archivsaisons die Gesamtzahl
- **Team-Steckbrief „Vertrag bis“.** Code-Fix 13.11.2026: In der Fahrer-Kachel steht die vierte Spalte „Vertrag bis“,
  bei Besitzer-Fahrern „für immer“
- **Rekorde-Tab: aktive Fahrer grün.** Code-Fix 13.11.2026: gleiche Markierung wie in All-Time, Abgleich über id,
  histId und Namen
- **Strecken-Kopf ohne Links.** Code-Fix 13.11.2026: `_venueCard` verlinkt den Sieger der ersten und letzten Austragung,
  den Rekordsieger und das Rekord-Team
- **BMW Sauber hatte Kick-Grün.** Code-Fix 12.11.2026: Die SEASON_DATA-Grundfarbe 2006–09 ist jetzt BMW-Blau #003FA3 statt #52E252.
  Die Livery Weiß/BMW-Blau ist als provisorisch markiert, also im Livery-Editor ein Platzhalter
- **Force India 2008–14 in BWT-Pink.** Code-Fix 12.11.2026: Es gibt jetzt provisorische, generische Ranges.
  2008 Weiß/Gold/Tungsten, 2009–13 Weiß/Safran/Grün, 2014 Schwarz/Safran/Grün
- **Teamfarben in simulierten Saisons.** Code-Fix 14.11.2026: Nach 2025 gilt die zuletzt bekannte Livery weiter
  (`getTeamColors` greift auf das letzte SEASON_DATA-Jahr zurück). Gemessen bis 2028: kein Team mehr grau, vorher 9 von 10
- **2026: Audi und Cadillac.** Code-Fix 14.11.2026: Kick Sauber wird 2026 zu Audi (laufende Verträge bleiben),
  Cadillac steigt 2026 ein, Sitze über den Sitzfüller; das Startfeld wächst nach 2025 mit den Teams (22 statt 20, vorher 46 DNQ je Saison). Farben provisorisch (Audi Titan/Schwarz/Rot, Cadillac
  Schwarz/Weiß), im Livery-Report als Platzhalter 2026. Cadillac-Pace geschätzt, hinter Alpine 2025
- **Links auf Vorgänger statt aufs Team.** Code-Fix 15.11.2026: Umbenennungen behalten die interne Team-ID
  (Honda 2008, Brawn 2009, Mercedes 2010 = `HON`), Links mit der ID öffneten das heutige Team. Links mit anderem
  Namen öffnen jetzt das Team dieses Namens (`teamProfilArg`). Team-Historie und Rennergebnisse zeigen nur die
  eigenen Jahre, Vorgänger stehen darunter als eigene Blöcke mit Trennlinie, nur zur Info (`teamVorgaenger`)
- **Off-Season: beide Namen bei Umbenennungen.** Code-Fix 15.11.2026: Saisonende-Fenster, Bestätigung und Saisonstart
  zeigen den Teamblock „🏁 Teams“ und Ziele im neuen Namen (seit .38). Jetzt auch der Fahrer-Steckbrief („Kick Sauber ·
  ab 2026: Audi (umbenannt, Vertrag läuft weiter)“ bzw. „(bisher Kick Sauber)“) und die Off-Season-Übersicht
  („Kick Sauber → Audi (umbenannt)“ statt ausgestiegen + eingestiegen; Ziele „Audi (bisher Kick Sauber)“)
- **Ruanda-Strecke.** Code-Fix 12.11.2026: Der Rwandan GP heißt jetzt „Bugesera Circuit“ (Bugesera-Distrikt, nahe Rilima).
  Die id `kigali` bleibt, weil bestehende Spielstände sie im Kalender führen
- **Doppelter Fahrer in angeblich zwei Teams** (`Matías Zagazeta`, zweimal im selben Chinese GP, P1 **und** P3,
  beide McLaren; Karriere-Historie 14 Saisons „Red Bull / McLaren"). Zagazeta und Fornaroli stehen nur in
  `FEEDER_DRIVERS`; `injectFeederDrivers` prüfte nicht gegen Historie, Rücktritte und Tode, und weil `feederSlug`
  deterministisch ist, trug ein zweiter Import **dieselbe id**. v0.9.15.53 gleicht die Prüfung an und sichert
  gegen die ID ab. Offen: (a) am Save verifizieren, (b) **bestehende** Duplikate werden nicht bereinigt.
- **Auto-Save zerstörte erstelltes Team** — Saisonwechsel-Ursache behoben (v0.9.15.52). Tritt es weiter auf, ist es
  vermutlich das **Reset-Center** (`restartCurrentSeason` / `deleteCurrentSeason` / `deleteSelectedSeasons`): es
  stellt Teams aus dem Snapshot der Vorsaison wieder her, ein mitten in der Saison erstelltes Team steht dort nicht drin.
- **Team-Steckbriefe mischen echte Fahrer-Paare mit erspielten** — mehrfach repariert, dieser Fall nicht belegt
- **Gesamt neu strukturieren** — zu allgemein für einen Code-Abgleich
- **Piquet 1981 bei zwei Teams** (beide 3 Siege, 48 Punkte). Code-Fix v0.9.21.31: Piquet war im Finale 1981 Gast bei
  Ligier (DNS) und blieb dort ohne Chronik-Eintrag; Rückholung der Gäste am Anfang von `processSeasonEndEvents`
  (4 → 0 stille Wechsel in 240 Saisons), Gäste nie DNS, Off-Season-Anzeigen mit Team zur Rennzeit + „ab 1982: …"
  (`tests/offseason-steckbrief.js`). Bestehender Spielstand unverändert. Nutzer 05.11.2026: Wechsel-Anzeige korrekt;
  Gastfahrer-Teil braucht Langzeittest
- **Jamie Connolly von ATS entlassen, nächste Saison wieder bei ATS** (Spielstand im Drive-Ordner
  <https://drive.google.com/drive/folders/1umDNWql2RPEHJ5HbXp1H1Hzl815UTt8b>). Code-Fix v0.9.21.31: Connolly war 1981
  R6–7 Gast bei Lotus und wurde vom Gastteam entlassen; `processMidSeasonDismissals` nimmt Gäste aus
  (`tests/gast-haengt.js`: 12 → 0 Fälle in 240 Saisons, BEFUNDE 05.11.2026)
- **Off-Season: Fahrer cockpitlos, weil das Team aufgibt** — kein Malus für die Zufriedenheit. Code-Fix v0.9.21.33:
  „Team ausgestiegen (Shadow) → ohne Cockpit" neutral, keine Entlassung, Steckbrief nennt den Ausstieg auch mit neuem
  Team (`tests/teamausstieg.js`: 33 Fahrer, 0 Entlassungen; BEFUNDE 06.11.2026)
- **Kleinere Nationen als IOC-Kürzel statt Name.** Code-Fix v0.9.21.32: Nationen-Tab kannte 73 Namen, der Generator
  119 Nationen — 51 erschienen als Kürzel; jetzt deutscher Landesname über `Intl.DisplayNames` (nur `INT` bleibt).
  Puerto Rico hat eine eigene Flagge, sie war fälschlich Portugal zugeordnet (BEFUNDE 05.11.2026)
- **Generierter Fahrer als Ersatz trotz 0 % generiert** (Review-Paket 1988, Start 1980: Ralf Fricke ab 1980, Jamie
  Connolly ab 1981, Andrew Fitzgerald ab 1982). Code-Fix v0.9.21.32: Debüt mitten in der Saison fand nie einen echten
  Neuling und generierte; jetzt echter Debütant → späterer echter Fahrer verfrüht → echter Ex-Fahrer, in echten Saisons
  nie generiert (`tests/generiert-herkunft.js`: 76 → 0 in 180 Saisons, BEFUNDE 05.11.2026)

---

## ✅ Erledigt

| Doc-Punkt | Beleg |
|---|---|
| CLAUDE.md aufräumen/verschlanken, Plugins | 23.10.2026 (Nutzer bestätigt): 265 → 94 Zeilen, Hintergrund in `HINTERGRUND.md`, Ticker-Werkzeuge in `tests/README.md` (e8e555f); Plugins claude-md-management + claude-code-setup aktiv (1483f12) |
| Auto-Backup aller Bilder | v0.9.15.54/.55 Backup; seit v0.9.17.0 917 Fahrerfotos + 256 Grafiken in `data/images.js` |
| Pace-Verlauf Teams / Button für ehemalige Teams | Team-Entwicklungsverlauf v0.9.10.41; ehemalige Teams v0.9.15.27–.32 (`makeTeamMatcher`, `collectTeamIdAliases`, `getFormerTeamIndex`) |
| `ent_COL_1987` / `ent_EUR_1988` / `ent_DAL_1988` in Wertung und Übersicht | v0.9.15.28 auflösbar, v0.9.15.85 Name statt Kennung, v0.9.15.86 keine `ent_`-IDs mehr |
| Nur-DNQ-Saisons: kein Eintrag, Strich statt Team, DNQ nicht in Historie | v0.9.15.12 Wochenend-Teilnahme statt Start, v0.9.15.25 Historie/Matrix; gilt nur für neu simulierte Saisons |
| Zakspeed-Logo nur „Z" | v0.9.15.52 — die hinterlegte Datei **war** nur das Signet, ersetzt durch Logo mit Schriftzug |
| Neue Saison löscht erstellte Teams | v0.9.15.52 Marker `userCreated` + Ausnahme in `applyTeamExits` |
| Streckenliste: Duplikate + Zielflaggen-Fallback | v0.9.15.52 `canonicalCircuitId` (F1DB-Slug vs. Klartext); der Fallback saß genau auf den Duplikaten |
| Zufriedenheit: Ampelfarben, Start ab Rennen 1, Verlauf | v0.9.15.52 Grün/Gelb/Orange/Rot, v0.9.15.14 ab erster Wochenend-Teilnahme |
| Vertragsstatus: Farbe passte nicht zum Text | v0.9.15.53 beide Schwellen 75/55/40 |
| Teamnamen in Rennergebnissen nicht in Teamfarbe | Rennergebnisse im Steckbrief aufklappbar, je Team eine Zeile in Ära-Farbe |
| Fehlende Teams in der Fahrer-Historie, tote Links | v0.9.15.27 (`tmn`-only/`team`-only, alle ID-Kandidaten), Fallback auf `HIST_NAMES` |
| Antonelli 2030 mit „Debüt“ nach 69 Rennen (Screenshot im Sheet, 14.11.2026) | v0.9.21.39 — Debüt = erste Meldung zur Quali/Vorquali, frühestes Jahr aller Spielquellen (`getF1DebutYear`, BEFUNDE 15.11.2026). ⚠ Erst 18.11. abgehakt: der ✚-Eintrag war nur ein Dateilink ohne Text, der Abgleich bei .39–.41 hielt die Changelog-Punkte nur gegen Text |
| Reserve: Talente vs. Free Agents | v0.9.14.56 |
| Nie-Wechsler-Liste inkl. Stroll | Besitzer-Fahrer verlassen ihr Team nie — Brabham, Surtees, McLaren, Stroll und 17 weitere |
| Kleinstkonstrukteure auf wenige Einsätze prüfen | v0.9.14.93–.97, v0.9.16.0/.10/.11 |
| USA-Namen: hispanisch/anglo trennen | v0.9.17.37, v0.9.19.0 Zuwanderer-Namen nach Geburtsjahrgang |
| Langzeit-Inaktive: Geburtsjahr statt Alter | Steckbrief zeigt Lebensdaten, ab dem 10. Jahr ohne Cockpit das Geburtsjahr |
| All-Time: Flaggen neben Aktiv-Status | Nationenflagge je Eintrag in Fahrer-, Team- und Weltmeister-Tabelle |
| Grid-/DNQ-Projekt | abgeschlossen, Bauplan `DNQ_MELDEPLAN.md` |
| Tödliche Unfälle außerhalb der WM | Rubrik + Nekrolog-Trennung; NaN-Rundennummer und falscher Renn-Link behoben (Ersatzfahrer-Link seit v0.9.21.3) |
| Owen im französischen Vornamen-Paket | kein Fehler: real französisch (INSEE Rang 85 in 2015–19, 4 085 Geburten), nur für Jahrgänge ab ~1995 — Nutzer bestätigt 17.10.2026 |
| Schumacher Jordan 1991 als feste Regel; weitere fixe Teilnahmen | v0.9.21.14 alle 281 festen Gastauftritte entfernt (`GUEST_ENTRIES`), Raten je Ära (`BEWEGUNG_QUOTEN`); v0.9.21.15 Verdrängen nach Saisonleistung statt pace (neuer Fehler 1997 Jordan) — Nutzer bestätigt 17.10.2026 |
| Generierte Teams zu bunt | v0.9.21.16 Farbe nach realer Verteilung je Dekade, bis 1967 nationale Rennfarbe (`realistischeTeamFarbe`), Junior-Palette gedämpft; v0.9.21.17 sanfter Ausgleich zum Feld — Nutzer bestätigt 17.10.2026 („gute mischung") |

---

## Quellen aus dem Doc

- Bewertungssystem: <https://claude.ai/chat/bf5ab246-0dc5-4121-bbcc-7d708b1492ac>
- Grid-/DNQ-Projekt: <https://claude.ai/chat/99b0bc20-316b-4f8a-aaab-ca48d308a3f8> → `DNQ_MELDEPLAN.md`
- F2/F3-Fotos: <https://claude.ai/chat/67cf6bca-d074-44f5-a3ff-7a06a5274024>
- Inspiration Statistik-Darstellung (aus dem Sheet, 14.10.2026): <https://www.bigdataf1.com/stats>

*Hinweis aus dem Doc: „Achtung Liste ist an sich länger. Das hier ist nur ein Ausschnitt."*
