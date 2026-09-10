# F1 RPG – Claude Code Regeln

## Anrede & Sprache (gilt immer, auch ohne Nachfrage)
**Deutsch, und den Nutzer DUZEN.** Nie siezen – auch nicht in Rückfragen, Bestätigungs-Dialogen oder Fehlermeldungen („willst du, dass ich pushe?", nicht „wollen Sie").
Kein Standardregister annehmen, wenn keine Anrede nötig scheint: im Zweifel duzen.
Code-Kommentare, Commit-Nachrichten und Changelog bleiben davon unberührt – die sind sachlich und ohne Anrede.

F1 RPG – Projekt-Regeln

Projektkontext
Git-Endprodukt: Einzelne HTML-Datei (~17MB Monolith), standalone ohne externe Abhängigkeiten. Der Löwenanteil ist `data/images.js` (9,2MB Fahrerfotos).
Entwicklung: `index.html` (~3MB) + `data/*.js` Dateien. `manage-v` inliniert data/*.js automatisch → Monolith.

Spiellogik-Priorität: plausibel vor perfekt, emergent vor gescriptet.

Ziel: Maximale Token-Effizienz durch chirurgische Code-Eingriffe.

Arbeitsweise & Schema-Pflicht (Höchste Priorität)
WICHTIG: Funktions-Index-Disziplin: Jede neue/geänderte Funktion muss sofort in functions.schema.json eingetragen werden (Name, Zeile, kurze Beschreibung).

Navigation & Token-Save: Nutze functions.schema.json für Zeilennummern. Bei Abweichungen (>10 Zeilen) sofort `grep -n` nutzen und danach `./update-functions-index.ps1` ausführen.

## Minimalismus & Sicherheit:

Arbeite immer im Diff-Modus: Zeige nur Änderungen, nie die ganze Datei.

Lies nur die im Schema identifizierten Blöcke (ca. 200-300 Zeilen).

Erkläre kurz das Warum einer Änderung, nicht nur das Was.

Frage nach, bevor du mehr als 3 Stellen gleichzeitig änderst.

Bei Unklarheiten: kurz nachfragen, nicht blind handeln.

## Bestätigungs-Dialog (Git, Push, manage-v)
Wie im Claude-Code-Terminal: Vor Schritten mit Wirkung auf **Remote**, **Archiv** oder **Versions-Script** immer zuerst im gewohnten Format nachfragen, z.B.:
- **„1“** = ja ausführen, **„2“** = nein, oder **y** / **n**
Betrifft mindestens: **`./manage-v`**, **`git push`**, und manuelle Commits, wenn anschließend Push gewünscht sein könnte.
**Nicht** eigenmächtig pushen oder `manage-v` starten, nur weil ein Task fertig ist – erst die Rückmeldung des Nutzers abwarten.
**Ausnahme:** Der Nutzer formuliert eindeutig (z.B. „push ausführen”, „ja, manage-v laufen lassen”) – das zählt als Bestätigung.

## Eingriffe außerhalb des Projektordners

Alles, was den Projektordner verlässt, wird **vorher in einem Satz angesagt** — auch
wenn die Berechtigung es zulässt und keine Rückfrage kommt. Betrifft unter anderem:
- eine Datei im Standardprogramm öffnen (`Start-Process`, `open`, `xdg-open`)
- außerhalb des Projekts schreiben (Desktop, Home, Downloads, Systempfade)
- ein Programm starten, das ein Fenster aufmacht
- etwas an einen externen Dienst schicken

Grund: Ein Fenster, das von selbst aufgeht, ist ein Schreck, kein Komfort. Nicht der
Vorgang stört, sondern dass er unangekündigt kommt.

**Ergebnisse liefern statt erwähnen.** Bilder, die Claude selbst betrachtet, sieht der
Nutzer nicht, und Dateien im Scratchpad findet er nicht. Ein Ergebnis ist erst
geliefert, wenn es an einem Ort liegt, den der Nutzer kennt, und der Pfad genannt ist.

**Bei Fragen zu Zugriffsrechten:** die tatsächliche Konfiguration lesen und Fakten
nennen (welche Datei, welcher Eintrag, was folgt daraus) — nicht allgemein beruhigen.

## Schema-Inventur nach jedem Coding-Task (PFLICHT)
Nach jedem Task der neue Funktionen hinzufügt:
1. `./update-functions-index.ps1` ausführen – aktualisiert Zeilennummern + trägt fehlende Funktionen ein
2. Wenn neue Einträge hinzugekommen: Nutzer **unaufgefordert** darauf hinweisen
3. Erst danach den `./manage-v`-Befehl vorschlagen

Claude muss das eigenständig erkennen — der Nutzer fragt nicht danach.

## Automatisierter Versions-Workflow
Sobald ein Task abgeschlossen ist, schlage unaufgefordert den passenden `./manage-v` Befehl vor. Ausführung erst nach Bestätigung – siehe **Bestätigungs-Dialog** (y/n oder 1/2 wie im Claude-Code-Terminal; in Cursor dieselbe Konvention).
**WICHTIG: Nach Abschluss eines Tasks diesen Workflow nutzen**
- Befehl: `./manage-v -NewVersion "0.9.9.69" -CommitMsg "Fix: DRS Logic" -ChangelogPoints "NEU: DRS Zonen optimiert;FIX: UI Glitch in Tabelle"`
- **Wrapper:** `manage-v` (ohne Extension) ist ein Bash-Wrapper der `powershell.exe -File manage-v.ps1 "$@"` aufruft – funktioniert direkt aus bash ohne Fehler
- **Vorteil:** Das Script patcht VERSION, Titel UND den Changelog in der HTML automatisch.
- Claude muss den Changelog NICHT mehr manuell in der HTML editieren.
- **Archivierung:** Die alte Version wird automatisch nach `/archive/` verschoben.
- **Git:** Add, Commit und Push erfolgen in einem Rutsch.

## Versionierung
- Versionsnummer steht in der HTML im `<title>`-Tag und in der Konstante `VERSION`
- **Hotfix** (4. Stelle, z.B. 0.9.9.5 → 0.9.9.6): Bugfix oder kleine UI-Änderung – Hauptformat bis 1.0
- **Patch** (3. Stelle, z.B. 0.9.9.x → 0.9.10.x): Abgeschlossene Feature-Gruppe aus v1.0-Checkliste
- **Minor** (2. Stelle, z.B. 0.9.x → 0.10.x): Mehrere Feature-Gruppen abgeschlossen
- **Major** (1.0.0): Alle v1.0-Bedingungen aus der Checkliste unten erfüllt
- **Strategie bis 1.0**: 0.9.9.x frei ausbauen (kein Limit), dann 0.9.10.x usw. – 1.0.0 ist das Ziel, nicht die nächste Zahl
- **v1.0-Checkliste**: siehe `V1_ROADMAP.md` – vor v1.0-Feature-Arbeit lesen
- Vergib die Versionsnummer eigenständig nach obiger Logik und erkläre die Wahl kurz
- Die Versionsanzeige oben links im UI wird immer aus der
  VERSION-Konstante gezogen, nie hardcoded – nach jeder
  Versionsnummer-Änderung sicherstellen dass das DOM-Element
  dynamisch befüllt wird

## Changelog pflegen (PFLICHT bei jeder Versionsänderung)
- Der Changelog liegt in einem eigenen Popup-Fenster (`#changelog-modal`, ab v0.9.12.26 – per Klick auf die Versionsnummer im Header oder Button in den Einstellungen). Grep weiterhin: `<!-- CHANGELOG -->` (Marker genau 1×, manage-v patcht ihn dort). NICHT mehr in den Einstellungen inline.
- Bei jeder neuen Version: obersten Eintrag `(aktuell)` entfernen, neue Version als erstes eintragen
- Format: `v0.9.1 (aktuell)` in grün, darunter Bullet-Points mit `• NEU:` / `• FIX:`
- Ältere Einträge bleiben bestehen (werden nach unten verdrängt)
- Maximal ~3–5 Bullet-Points pro Version, prägnant auf Deutsch

## Simulations-Architektur (eine Engine, mehrere Darstellungen)
**Modus = Darstellung, nie Konsequenzen.** Ergebnisse, Statistiken und Effekte sind in allen Modi identisch (Sofort-Rennen, Live-Ticker, Komplette-Saison, Balancing-Tool).
Neue Mechanik die nur in einem Modus wirkt = falsch platziert.

**Live-Ticker-Regel (VERBINDLICH):** Klassische Simulation und Live-Ticker liefern für dasselbe Rennen **identische Ergebnisse** (Reihenfolge, DNF, Tode, Punkte). Der Live-Ticker ist **nur das „Wie" (Darstellung)** – die Zahlen entstehen in **einer** Engine.

**Seit v0.9.18.0 ist das umgesetzt, nicht mehr nur angestrebt:** `startLiveRace()` ruft `simulateRace()`, legt das Ergebnis in `liveRaceState.plannedResult` und der Ticker **animiert nur noch dorthin**. `closeLiveRace()` reicht dieses Ergebnis durch, statt ein zweites zu bauen.

- ⚠ **Keine Renn-Logik mehr in den Ticker einbauen.** Die frühere Anweisung „immer beide Pfade synchron bearbeiten" gilt **nicht mehr** – es gibt nur noch einen Pfad. Wer im Ticker würfelt, legt die Divergenz neu an.
- **Feintuning der Simulation passiert ausschließlich in `simulateRace()`.** Der Ticker erbt es automatisch.
- **Reine Darstellung im Ticker ist erlaubt und erwünscht:** Boxenstopps, Positionswechsel, Überholmeldungen, die Ausfall*runde*. Alles davon darf das Ergebnis **nicht** verändern – Boxenstopps kosten deshalb bewusst keine Zeit. Ob jemand ausfällt, steht in `simulateRace` fest; nur das Wann ist frei.
- Marker `// [SYNC simulateRace]` kennzeichnen weiterhin Stellen, die auf die Engine zeigen – aber als **Verweis**, nicht mehr als Pflicht zur Doppelpflege.
- **Absicherung:** `node tests/ticker-paritaet.js --alle 40` vergleicht die Endreihenfolge des Tickers Fahrer für Fahrer mit `plannedResult`. Keine Toleranz. Bei jeder Änderung an Ticker oder `simulateRace` laufen lassen.

**Messwerkzeuge:**

| Befehl | Zweck |
|---|---|
| `node tests/ticker-paritaet.js --alle 40` | Beweist die Parität **direkt** (nicht statistisch) |
| `node tests/ticker-vs-sim.js 1950 0 300` | Monte Carlo: sofort / ticker / **real aus F1DB**, Schwerpunkt Grid→Ziel |
| `node tests/ticker-browser.js 1950` | Ticker im echten Browser mit `pageerror` – sim-core sieht UI-Fehler nicht |

⚠ **Messfallen (jede hat schon Zeit gekostet):**
- `GAME_STATE.seasonDeaths` enthält auch **Nicht-WM-Tode** aus `applyRaceResults`. Ohne Filter auf `fatalSession==='race'` sieht jede Zählung nach Doppelverbuchung aus.
- Das `raceResult` entsteht in **`closeLiveRace()`**, nicht in `finishLiveRace()` – letzteres setzt nur `finished` und die Siegermeldung.
- `liveRaceState` ist mit `let` deklariert und landet damit **nicht** auf dem vm-Kontext von sim-core; dort injiziert ein Patch den Getter `window.__liveState`. `startLiveRace`/`startRaceSimulation` hängen an `window`, nicht global.
- Monte Carlo kann die Parität **nicht beweisen** – beide Pfade würfeln unabhängig, vergleichbar sind nur Verteilungen. Dafür ist `ticker-paritaet.js` da.

**Historie:** Bis v0.9.18.0 hatte der Live-Ticker eine **eigene** Lap-Pace-Formel (`pace*0.02` / `carSpeed*0.015`, ohne `experience` und ohne Car-Ceiling) und baute sein Ergebnis aus akkumulierten Lap-Zeiten. Ein Fahrer mit pace 95 gegen einen mit 50 war dort **0,9 % pro Runde** schneller – in `simulateRace` entscheidet `pace` mit 0.45 von rund 100 Punkten. Deshalb kamen Balance-Fixes im Ticker nie an. Der Umbau entfernte ~345 Zeilen (netto 233 weniger).

Zentrale Logik-Funktionen (nie duplizieren):
- Saison-Ende → `processSeasonEndEvents()`
- Saison-Ende-UI → `showSeasonEndModal()` – liest State, schreibt nie
- Saison-Start → `startNewSeason()`
- Between-Race-Events (geplant) → `processMidSeasonEvents()` via `applyRaceResults()`

## Indianapolis: zwei Rennen, ein Gelände (NICHT verwechseln)
In Indianapolis fanden **zwei grundverschiedene Rennen** statt — dieselbe `circuitId`, dasselbe Rohflag in F1DB:

| | Jahre | Kurs | Runden | Startplätze |
|---|---|---|---|---|
| **Indy 500** | 1950–1960 | Oval | 200 | **33 per Reglement** |
| **Indy GP** (US-GP) | 2000–2007 | Infield-Rundkurs | ~73 | normales Feld, real 20–22 |

- **Das Feld heißt `isIndy500` bzw. `isIndyGP`.** Ein Feld `isIndy` gibt es nicht mehr — es stand bei BEIDEN auf `true` und gab dem US-GP 2005 ein 33er-Feld (27 Starter statt real 20) sowie ~5 Phantom-Tode je Jahrzehnt.
- Getrennt wird **an der Quelle** in `getF1DBYear` (data/f1db.js) nach Jahr. Das Rohflag `meta[3]` sagt nur, auf welchem Gelände gefahren wurde — nie allein abfragen.
- Altstände tragen noch `isIndy`; die Helfer `istIndy500(race, year)` / `istIndyGP(race, year)` lösen das über das Jahr auf. **Gespeicherte Stände werden nicht rückwirkend umgeschrieben.**
- ⚠ Lokale Variablen namens `isIndy` bedeuten etwas ANDERES: ist der *Fahrer* oder das *Team* Indy-only. Nicht mit dem Rennen verwechseln.
- **Wächter:** `node tests/indy-500-vs-gp.js` — 26 Prüfungen über sechs Jahrgänge (Flags, Deckel, Melder, Starter). Nach jeder Änderung an Kalender oder Startfeld laufen lassen.

### Die hohe Melderzahl beim Indy 500 ist GEWOLLT — kein Bug
Das Indy 500 bekommt **40–48 Melder auf 33 Startplätze**, also 12–15 DNQ. Das ist eine bewusst gesetzte **Halb-Fiktion** und darf nicht „korrigiert" werden:

> Die offizielle F1-Statistik kennt keine Indy-DNQs. Fahrer, die es nie ins Rennen schafften, werden dort nie erwähnt — es gibt also keine Gegenzahl, gegen die man kalibrieren könnte.

Der Kandidatenpool sollen **Datenbank-Fahrer** sein (halb-fiktional), generierte Fahrer nur als Rückfall.

## Testen vor Einbauen
**Workflow:** Nutzer sagt „teste Feature X" → Claude nennt Befehl → Nutzer führt aus → Nutzer schickt Output → Claude interpretiert.
Claude simuliert NIEMALS selbst (Token-Verschwendung).

→ Monte-Carlo-Infrastruktur: siehe `tests/README.md`

## Schemas (Navigations-Zentrale)
**Immer zuerst `/schemas/` lesen** – nicht blind in der 3MB-HTML suchen. Vor Zugriff auf GAME_STATE, Driver, SEASON_DATA oder HIST_SEASONS zwingend das zugehörige Schema lesen.

| Datei | Inhalt |
|---|---|
| `functions.schema.json` | **~183 Top-Level-Funktionen mit Zeilennummer + Zweck (Pflicht!)** |
| `season-data.schema.json` | SEASON_DATA[year].t / .d – Feldindex mit Typen |
| `hist-seasons.schema.json` | HIST_SEASONS[slug] – Feldindex, Pitfalls |
| `game-state.schema.json` | Alle GAME_STATE Top-Level-Felder |
| `driver-objects.schema.json` | Simulierter Fahrer, Team, Kontext-Varianten |

- Zeilennummern in `functions.schema.json` verschieben sich – nach signifikanten Edits `./update-functions-index.ps1` ausführen

## Dateistruktur
```
/f1-rpg-vX.X.X.html     ← Git-Endprodukt (Standalone-Monolith, von manage-v erzeugt)
/index.html              ← Entwicklungsdatei (~3MB, mit <script src="data/...">)
/data/f1db.js            ← F1DB-Renndaten (3.6MB – Grep only, nicht lesen)
/data/hist.js            ← Fahrer-/Saison-Historien (~286KB)
/data/seasons.js         ← SEASON_DATA Templates (~238KB)
/archive/                ← NUR die letzten ~10 Versionen (siehe Archiv-Regel unten)
/tests/                  ← isolierte Logik-Tests (Monte Carlo, Balancing)
/schemas/                ← Datenstruktur-Dokumentation (NUR Referenz, kein Laufzeit-Code)
/CLAUDE.md               ← diese Datei
```
**Daten editieren:** SEASON_DATA → `data/seasons.js`, HIST_SEASONS → `data/hist.js`, F1DB → `data/f1db.js`
**manage-v** inliniert alle drei automatisch → `f1-rpg-vX.html` ist danach ohne Hilfsdateien lauffähig.

## Archiv-Regel (seit 2026-08-14, PFLICHT)
**`archive/` hält nur die letzten ~10 Versionen.** Es war auf 496 Monolithen und 2,7 GB gewachsen, bei 1,4 GB freiem Plattenplatz — jetzt 14 Dateien, 90 MB.

Das ist gefahrlos, weil `manage-v` jede Version **committet, bevor** sie ins Archiv wandert: alle alten Stände liegen in der GitHub-Historie unter ihrem damaligen Wurzelpfad.

- **Zurückholen:** `node tools/restore-version.js <version>` → `wiederhergestellt/`, oder `--url` für die GitHub-Adresse, `--liste` für alle verfügbaren.
- ⚠ **Nicht selbst mit `git log` suchen:** das liefert den Commit, in dem die Datei ins Archiv verschoben, also **gelöscht** wurde — dort existiert sie nicht („path does not exist"). Gesucht ist der *neueste Commit, in dem sie noch vorhanden ist*. Genau das macht das Skript.
- **Vier Stände sind Ausnahmen** und in `archive/` eingecheckt, weil sie nie im Repo landeten: `f1-rpg-v0.9.7.3_pre/b_pre/c_pre` (Vorabstände, weichen um ~100 Zeilen von der Release ab) und `f1-rpg-v0.9.9.37`. Die `.gitignore` nutzt dafür `archive/*` plus `!`-Ausnahmen — Git kann eine Datei nicht einschließen, wenn ihr Verzeichnis ausgeschlossen ist.
- **Nie den ganzen Ordner einchecken.** Das erzeugte ~2,6 GB neue Objekte ohne Sicherheitsgewinn: die Arbeitskopien haben CRLF, die Git-Objekte LF — Git entdoppelt sie also nicht.

**Wenn das Archiv wieder über ~15 Dateien wächst:** die ältesten löschen, die letzten 10 behalten. Vorher prüfen, dass die Löschkandidaten auf `origin/master` liegen.

## Nach PC-Neustart (Nutzer-Info)
1. CMD im Projektordner öffnen
2. `npx serve .` → localhost:3000 im Browser
3. Neues CMD-Tab → `claude`
