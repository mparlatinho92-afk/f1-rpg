# F1 RPG – Claude Code Regeln

## Arbeitsweise
- Arbeite immer im **Diff-Modus**: zeige nur was sich ändert, nie die ganze Datei
- Erkläre kurz **warum** du eine Änderung machst, nicht nur was
- Frage nach bevor du mehr als 3 Stellen gleichzeitig änderst
- Bei Unklarheiten: frage kurz nach, handle nicht blind
- **Vor jedem Coding-Task:** `/schemas/functions.schema.json` → Zeilennummer → direkt lesen. Kein blindes Grep durch 3,5MB.
- **Vor Datenstruktur-Zugriffen** (SEASON_DATA, HIST_SEASONS, GAME_STATE, Driver): passendes Schema lesen statt aus dem Code rückschließen.

## Versionierung
- Versionsnummer steht in der HTML im `<title>`-Tag und in der Konstante `VERSION`
- **Patch** (z.B. 0.8.7 → 0.8.8): Bugfix oder kleine UI-Änderung
- **Minor** (z.B. 0.8.7 → 0.9.0): Neues Feature oder Systemänderung
- **Major** (z.B. 0.8.7 → 1.0.0): Fundamentale Änderung der Spiellogik
- Vergib die Versionsnummer eigenständig nach obiger Logik und erkläre die Wahl kurz
- Die Versionsanzeige oben links im UI wird immer aus der 
  VERSION-Konstante gezogen, nie hardcoded – nach jeder 
  Versionsnummer-Änderung sicherstellen dass das DOM-Element 
  dynamisch befüllt wird

## Nach PC-Neustart
1. CMD im Projektordner öffnen
2. `npx serve .` → localhost:3000 im Browser
3. Neues CMD-Tab → `claude`

## Changelog pflegen (PFLICHT bei jeder Versionsänderung)
- Der Changelog befindet sich in den Einstellungen der HTML-Datei (grep: `<!-- CHANGELOG -->`)
- Bei jeder neuen Version: obersten Eintrag `(aktuell)` entfernen, neue Version als erstes eintragen
- Format: `v0.9.1 (aktuell)` in grün, darunter Bullet-Points mit `• NEU:` / `• FIX:`
- Ältere Einträge bleiben bestehen (werden nach unten verdrängt)
- Maximal ~3–5 Bullet-Points pro Version, prägnant auf Deutsch

## Git-Workflow (nach jeder Änderung)
**WICHTIG: Git-Workflow nach jeder abgeschlossenen Änderung automatisch ausführen**
- Nicht warten bis der Nutzer es erwähnt – den Workflow direkt starten
- Der native Claude Code Bestätigungs-Prompt übernimmt die Freigabe (1 = Yes, 2 = No)

Schritte (nur nach Freigabe):
1. Backup der alten Version: `cp f1-rpg-vX.X.X.html archive/f1-rpg-vX.X.X_backup.html`
2. Neue Versionsnummer in HTML einsetzen (`VERSION`-Konstante + `<title>`)
3. Changelog in HTML aktualisieren (siehe oben)
4. Git commit mit aussagekräftiger Message auf Deutsch:
   `git commit -m "v0.9.0 – Retirement-Wahrscheinlichkeit balanciert"`
5. Datei umbenennen auf neue Versionsnummer

## Dateistruktur
```
/f1-rpg-vX.X.X.html     ← aktuelle Version (Einzeldatei, bleibt Monolith)
/archive/                ← alle alten Versionen als Backup
/tests/                  ← isolierte Logik-Tests (Monte Carlo, Balancing)
/schemas/                ← Datenstruktur-Dokumentation (NUR Referenz, kein Laufzeit-Code)
/CLAUDE.md               ← diese Datei
```

## Schemas (Datenstrukturen + Funktions-Index)
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

## Testen vor Einbauen
- Neue Logik (Wahrscheinlichkeiten, Berechnungen) erst als isoliertes Test-Script
- Test läuft im Terminal durch, Ergebnis plausibel → dann erst in HTML einbauen
- Bei Balance-Tests: gegen historische Referenzdaten in `/tests/historical_truth.js` prüfen

## Projektkontext
- Einzelne HTML-Datei (~3.5MB), bleibt Monolith, nicht aufteilen
- Mobilfreundlich halten
- Lazy-Loading für historische Jahrgänge beibehalten
- Spiellogik-Priorität: **plausibel vor perfekt**, emergent vor gescriptet
