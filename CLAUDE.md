# F1 RPG – Claude Code Regeln

## Anrede & Sprache (gilt immer, auch ohne Nachfrage)
**Deutsch, und den Nutzer DUZEN.** Nie siezen – auch nicht in Rückfragen, Bestätigungs-Dialogen oder Fehlermeldungen („willst du, dass ich pushe?", nicht „wollen Sie").
Kein Standardregister annehmen, wenn keine Anrede nötig scheint: im Zweifel duzen.
Code-Kommentare, Commit-Nachrichten und Changelog bleiben davon unberührt – die sind sachlich und ohne Anrede.

F1 RPG – Projekt-Regeln

Projektkontext
Git-Endprodukt: Einzelne HTML-Datei (~5.5MB Monolith), standalone ohne externe Abhängigkeiten.
Entwicklung: `index.html` (~1.4MB) + `data/*.js` Dateien. `manage-v` inliniert data/*.js automatisch → Monolith.

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

## Simulations-Architektur (Modi & Pfade, immer synchron)
**Modus = Darstellung, nie Konsequenzen.** Ergebnisse, Statistiken und Effekte sind in allen Modi identisch (Sofort-Rennen, Live-Ticker, Komplette-Saison, Balancing-Tool).
Neue Mechanik die nur in einem Modus wirkt = falsch platziert.

**Live-Ticker-Regel (VERBINDLICH):** Klassische Simulation und Live-Ticker müssen für dasselbe Rennen **identische Ergebnisse** liefern (Reihenfolge, DNF, Tode, Punkte). Der Live-Ticker ist **nur das „Wie" (Darstellung)** – die Zahlen entstehen in **einer** Engine. Zielarchitektur: der Live-Ticker holt sein Ergebnis von `simulateRace()` und **animiert nur noch dorthin**, statt selbst zu würfeln.
- **Beim Feintuning der Simulation IMMER beide Pfade synchron bearbeiten.** Eine Änderung nur in einem Modus = Bug.
- Marker `// [SYNC simulateRace]` kennzeichnen duplizierte/gekoppelte Stellen (DNF, Todes-Check, Grid, Pace-Formel).
- Historie: Bis v0.9.14.45 hatte der Live-Ticker eine **eigene** Lap-Pace-Formel (~L9379 `pace*0.02` / ~L9384 `carSpeed*0.015`) und baute sein Ergebnis aus akkumulierten Lap-Zeiten → divergierte von `simulateRace` (`pace*0.45`/`carSpeed*0.15` + Car-Ceiling). Parität ist das laufende Reform-Ziel.

Zentrale Logik-Funktionen (nie duplizieren):
- Saison-Ende → `processSeasonEndEvents()`
- Saison-Ende-UI → `showSeasonEndModal()` – liest State, schreibt nie
- Saison-Start → `startNewSeason()`
- Between-Race-Events (geplant) → `processMidSeasonEvents()` via `applyRaceResults()`

## Testen vor Einbauen
**Workflow:** Nutzer sagt „teste Feature X" → Claude nennt Befehl → Nutzer führt aus → Nutzer schickt Output → Claude interpretiert.
Claude simuliert NIEMALS selbst (Token-Verschwendung).

→ Monte-Carlo-Infrastruktur: siehe `tests/README.md`

## Schemas (Navigations-Zentrale)
**Immer zuerst `/schemas/` lesen** – nicht blind in der 1,4MB-HTML suchen. Vor Zugriff auf GAME_STATE, Driver, SEASON_DATA oder HIST_SEASONS zwingend das zugehörige Schema lesen.

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
/index.html              ← Entwicklungsdatei (~1.4MB, mit <script src="data/...">)
/data/f1db.js            ← F1DB-Renndaten (3.6MB – Grep only, nicht lesen)
/data/hist.js            ← Fahrer-/Saison-Historien (~286KB)
/data/seasons.js         ← SEASON_DATA Templates (~238KB)
/archive/                ← alle alten Versionen als Backup
/tests/                  ← isolierte Logik-Tests (Monte Carlo, Balancing)
/schemas/                ← Datenstruktur-Dokumentation (NUR Referenz, kein Laufzeit-Code)
/CLAUDE.md               ← diese Datei
```
**Daten editieren:** SEASON_DATA → `data/seasons.js`, HIST_SEASONS → `data/hist.js`, F1DB → `data/f1db.js`
**manage-v** inliniert alle drei automatisch → `f1-rpg-vX.html` ist danach ohne Hilfsdateien lauffähig.

## Nach PC-Neustart (Nutzer-Info)
1. CMD im Projektordner öffnen
2. `npx serve .` → localhost:3000 im Browser
3. Neues CMD-Tab → `claude`
