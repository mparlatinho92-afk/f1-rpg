# Offene Fixes & Features

Bereinigte Fassung der Google-Doc-Sammelliste **„F1 RPG neue Fixes"**
(Original-Doc `1-bE5uXu5dFeq-eBJ4V2zm1mIdTbtNknb5wty1M4CICg`, zuletzt bearbeitet 2026-08-07 — bleibt unverändert).

**Abgeglichen gegen:** v0.9.21.23, Prüfdatum **2026-10-18** (vorher 2026-10-18 @ v0.9.21.22).
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

- ✚ Jetlag-Kalender siehe wohl Google Gemini

---

## ◐ Teilweise erledigt

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

### Fahrermarkt & Daten
- **Nachfolgeteams übernehmen Verträge**; ausgelaufene ggf. verlängert (gleiche Wahrscheinlichkeit wie sonst) —
  kein Mechanismus gefunden
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

---

## ✅ Erledigt

| Doc-Punkt | Beleg |
|---|---|
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
