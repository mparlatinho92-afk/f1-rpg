# F1 RPG – Claude Code Regeln

F1 RPG – Projekt-Regeln

Projektkontext
Einzelne HTML-Datei (~3.5MB), bleibt Monolith, nicht aufteilen.

Spiellogik-Priorität: plausibel vor perfekt, emergent vor gescriptet.

Ziel: Maximale Token-Effizienz durch chirurgische Code-Eingriffe.

Arbeitsweise & Schema-Pflicht (Höchste Priorität)
WICHTIG: Funktions-Index-Disziplin: Jede neue/geänderte Funktion muss sofort in functions.schema.json eingetragen werden (Name, Zeile, kurze Beschreibung).

Daten-Integrität: Vor Zugriff auf GAME_STATE, Driver, SEASON_DATA oder HIST_SEASONS zwingend das zugehörige Schema in /schemas/ lesen. Rückschlüsse aus dem Code sind untersagt.

Navigation & Token-Save: Nutze functions.schema.json für Zeilennummern. Bei Abweichungen (>10 Zeilen) sofort grep -n nutzen und danach ./update-functions-index.ps1 ausführen.

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

## Schemas (Navigations-Zentrale)
Datei	Inhalt
functions.schema.json	Index aller Funktionen mit Zeilennummer + Zweck (Pflicht!)
game-state.schema.json	Struktur des globalen Spielzustands (Savegames/Settings)
driver-objects.schema.json	Definition von Driver- und Team-Objekten ($skills etc.)
season-data.schema.json	Feld-Index für historische Saison-Templates (t/d Arrays)
hist-seasons.schema.json	Struktur der Fahrer-Historien (WM-Ergebnisse)

## Schema-Inventur nach jedem Coding-Task (PFLICHT)
Nach jedem Task der neue Funktionen hinzufügt:
1. `grep -c "function " f1-rpg-vX.html` vs. Einträge in `functions.schema.json` vergleichen
2. Wenn Lücke > 0: Nutzer **unaufgefordert** darauf hinweisen und neue Funktionen eintragen
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
- Der Changelog befindet sich in den Einstellungen der HTML-Datei (grep: `<!-- CHANGELOG -->`)
- Bei jeder neuen Version: obersten Eintrag `(aktuell)` entfernen, neue Version als erstes eintragen
- Format: `v0.9.1 (aktuell)` in grün, darunter Bullet-Points mit `• NEU:` / `• FIX:`
- Ältere Einträge bleiben bestehen (werden nach unten verdrängt)
- Maximal ~3–5 Bullet-Points pro Version, prägnant auf Deutsch

## Testen vor Einbauen
**Workflow:** Nutzer sagt „teste Feature X" → Claude nennt Befehl → Nutzer führt aus → Nutzer schickt Output → Claude interpretiert.
Claude simuliert NIEMALS selbst (Token-Verschwendung).

→ Monte-Carlo-Infrastruktur: siehe `tests/README.md`

## Schemas (Datenstrukturen + Funktions-Index)
WICHTIG: Prüfe nach jeder Versionserhöhung (v0.9.9.x), ob die Zeilennummern in functions.schema.json noch korrekt sind. Wenn sie um mehr als 10 Zeilen abweichen, aktualisiere das Schema sofort im selben Arbeitsschritt


**Immer zuerst `/schemas/` lesen** – nicht blind in der 3,5MB-HTML suchen.

| Datei | Inhalt |
|---|---|
| `season-data.schema.json` | SEASON_DATA[year].t / .d – Feldindex mit Typen |
| `hist-seasons.schema.json` | HIST_SEASONS[slug] – Feldindex, Pitfalls |
| `game-state.schema.json` | Alle GAME_STATE Top-Level-Felder |
| `driver-objects.schema.json` | Simulierter Fahrer, Team, Kontext-Varianten |
| `functions.schema.json` | **135 Funktionen mit Zeilennummer + Zweck** |

- Schemas bei Strukturänderungen oder größeren Edits mitpflegen
- Zeilennummern in `functions.schema.json` verschieben sich – nach signifikanten Edits aktualisieren

## Dateistruktur
```
/f1-rpg-vX.X.X.html     ← aktuelle Version (Einzeldatei, bleibt Monolith)
/index.html              ← GitHub Pages Einstieg (immer = aktuelle Version)
/archive/                ← alle alten Versionen als Backup
/tests/                  ← isolierte Logik-Tests (Monte Carlo, Balancing)
/schemas/                ← Datenstruktur-Dokumentation (NUR Referenz, kein Laufzeit-Code)
/CLAUDE.md               ← diese Datei
```

## Nach PC-Neustart (Nutzer-Info)
1. CMD im Projektordner öffnen
2. `npx serve .` → localhost:3000 im Browser
3. Neues CMD-Tab → `claude`
