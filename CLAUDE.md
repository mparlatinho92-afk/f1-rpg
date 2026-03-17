# F1 RPG – Claude Code Regeln

## Projektkontext
- Einzelne HTML-Datei (~3.5MB), bleibt Monolith, nicht aufteilen
- Mobilfreundlich halten
- Lazy-Loading für historische Jahrgänge beibehalten
- Spiellogik-Priorität: **plausibel vor perfekt**, emergent vor gescriptet

## Arbeitsweise
- Arbeite immer im **Diff-Modus**: zeige nur was sich ändert, nie die ganze Datei
- Erkläre kurz **warum** du eine Änderung machst, nicht nur was
- Frage nach bevor du mehr als 3 Stellen gleichzeitig änderst
- Bei Unklarheiten: frage kurz nach, handle nicht blind
- **Vor jedem Coding-Task:** `/schemas/functions.schema.json` → Zeilennummer → direkt lesen. Kein blindes Grep durch 3,5MB.
- **Vor Datenstruktur-Zugriffen** (SEASON_DATA, HIST_SEASONS, GAME_STATE, Driver): passendes Schema lesen statt aus dem Code rückschließen.

## Git-Workflow (nach jeder Änderung)
**WICHTIG: Git-Workflow nach jeder abgeschlossenen Änderung automatisch ausführen**
- Nicht warten bis der Nutzer es erwähnt – den Workflow direkt starten
- Der native Claude Code Bestätigungs-Prompt übernimmt die Freigabe (1 = Yes, 2 = No)

Schritte (nur nach Freigabe):
1. Neue Datei anlegen: `cp f1-rpg-vX.X.X.html f1-rpg-vY.Y.Y.html`
2. Neue Versionsnummer in der neuen Datei einsetzen (`VERSION`-Konstante + `<title>`)
3. Changelog in der neuen Datei aktualisieren (siehe oben)
4. Alte Version ins Archiv verschieben: `mv f1-rpg-vX.X.X.html archive/` ← nur lokal, Git ignoriert `archive/`
5. `cp f1-rpg-vY.Y.Y.html index.html` ← **PFLICHT – nie überspringen!** Netlify deployed index.html, nicht die versionierte Datei
6. Git add + commit mit aussagekräftiger Message auf Deutsch:
   `git add f1-rpg-vY.Y.Y.html index.html CLAUDE.md` ← NUR neue Dateien, nie archive/
   `git commit -m "v0.9.0 – Retirement-Wahrscheinlichkeit balanciert"`
7. `git push origin master` ← Netlify deployed automatisch

→ Ergebnis: Hauptordner hat genau eine HTML-Datei, Archive hat eine saubere Datei pro Version (lokal, kein Git-Tracking)
→ index.html = immer aktuelle Version → sofort mobil verfügbar unter https://mparlatinho92-afk.github.io/f1-rpg/
→ Git/GitHub Pages sehen nur: aktuelle HTML + index.html + schemas/ + tests/ + CLAUDE.md

## Versionierung
- Versionsnummer steht in der HTML im `<title>`-Tag und in der Konstante `VERSION`
- **Hotfix** (4. Stelle, z.B. 0.9.9.5 → 0.9.9.6): Bugfix oder kleine UI-Änderung – Hauptformat bis 1.0
- **Patch** (3. Stelle, z.B. 0.9.9.x → 0.9.10.x): Abgeschlossene Feature-Gruppe aus v1.0-Checkliste
- **Minor** (2. Stelle, z.B. 0.9.x → 0.10.x): Mehrere Feature-Gruppen abgeschlossen
- **Major** (1.0.0): Alle v1.0-Bedingungen aus der Checkliste unten erfüllt
- **Strategie bis 1.0**: 0.9.9.x frei ausbauen (kein Limit), dann 0.9.10.x usw. – 1.0.0 ist das Ziel, nicht die nächste Zahl
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
- Neue Logik (Wahrscheinlichkeiten, Berechnungen) erst als isoliertes Test-Script in `/tests/`
- Scripts sind reines Node.js (kein Browser, keine HTML-Abhängigkeiten)
- **Workflow:** Claude schreibt Script → Nutzer führt aus (`node tests/foo.js`) → Nutzer schickt Output → Claude interpretiert
- Claude führt Monte-Carlo-Simulationen NIEMALS selbst aus (Token-Verschwendung)
- Bei Balance-Tests: gegen historische Referenzdaten in `/tests/historical_truth.js` prüfen

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

## Dateistruktur
```
/f1-rpg-vX.X.X.html     ← aktuelle Version (Einzeldatei, bleibt Monolith)
/index.html              ← Netlify-Einstieg (immer = aktuelle Version)
/archive/                ← alle alten Versionen als Backup
/tests/                  ← isolierte Logik-Tests (Monte Carlo, Balancing)
/schemas/                ← Datenstruktur-Dokumentation (NUR Referenz, kein Laufzeit-Code)
/CLAUDE.md               ← diese Datei
```

## v1.0 Voraussetzungen (Checkliste)
**1.0.0 wird erst vergeben wenn alle Punkte ✓ sind.**
Status: `○` = offen · `◑` = teilweise · `✓` = fertig

### Balance & Gameplay
- `○` **Top-Team-Dominanz brechen** – Wagen kann von Saison zu Saison besser/schlechter werden; seltene Extremfälle; Fahrer-Formschwäche (je länger desto unwahrscheinlicher)
- `○` **Historisch korrekte Fahrer-Paces** – z.B. junger Alonso zu stark bei Minardi; Current Pace ≠ Potential Pace bei jungen Fahrern; Rohdiamanten: schnelleres Wachstum, Potential-Cap bis halber Altersschnitt
- `○` **Historisch korrekte Team-Paces** – harmoniert mit Fahrerpaces; Ziel: Minardi 2001 kommt selten in Punkte
- `○` **Rohdiamanten-Buff** – sollen sich wirklich lohnen, zu oft unten durch; Rohdiamant-Status nur bis halber Altersschnitt möglich
- `○` **Funktionierendes Bewertungssystem** – Teamstärke, Teamkollegen-Stärke, Formaufschwung berücksichtigen

### Reservefahrer & Pool
- `○` **Entlassene Fahrer 5 Jahre als Free Agent** im Reservefahrer-Pool verfügbar; Rückkehr-Wahrscheinlichkeit schrumpft exponentiell
- `○` **Fixer Fahrer-Pool für erfundene Fahrer** – vorhersehbarer Nachwuchs; Fallback bleibt der große Reservepool
- `○` **Historische Saison-Fahrer** in eigenem Tab der Reservefahrer-Liste; chronologisch erste 2 Fahrer; bei echtem 1-Auto-Team kein Generieren

### Saison-Optionen (einstellbar vor jeder Saison)
- `○` **Ab 1983: max. 2 Fahrer gleichzeitig** (Option) – chronologisch erste 2; Spiel fragt ob 2. Fahrer für neue Saisons dazukommen soll
- `○` **Grid-Begrenzung** (Option) – historische Startfeld-Größe; Rest durch Quali / Pre-Quali
- `○` **Neue hist. Fahrer zu Reserveliste** (Option) – 2. Frage ob einsetzen; bei Rookie-Zuordnung berücksichtigen; zukünftige Fahrer-Tab-Fahrer auch einbeziehen; Mittelfeld 25%/Backmarker 75%-Regel
- `○` **Ersatzfahrer aus Reserveliste** (Option) – auch entlassene Free Agents möglich
- `○` **Mid-Season Entlassungen** (Option) – bei extrem schlechter Leistung; Top→Mittelfeld/Back, Mittelfeld→Back/weg; Abstieg = automatischer Tausch; "ganz weg" = Rookie-Ersatz
- `○` **Historisches Kommen/Gehen der Teams** (Option) – Team ersetzt anderes, übernimmt Verträge + Wagen (Skills eher neu)
- `○` **Lokalmatadoren-Teams** (Option) – epochenbedingter Prozentsatz; Fahrer-Konstrukteurseigentümer wechseln nie (sonst löst sich Team auf)

### Features
- `○` **Non-Championship-Rennen** – frühe Saisons nicht zu kurz; auch tödlich; im Kalender auswählbar (alle/Championship/Non-Championship); farblich unterschieden
- `○` **Jahreskalender** – anstehende Rennen mit Uhrzeit; Zeitkonflikte untereinander
- `○` **AAA/USAC-Saison** – separates parallel laufendes Feld; Indy 500 Statistiken geteilt; höhere Todesrate als F1
- `○` **Verletzungs-System** – Rückkehrgarantie, Ersatzfahrer-Kaskade, historische Wahrscheinlichkeit, Formschwäche nach Rückkehr, Bewertung eingefroren (UI-Markierung), Rücktrittsneigung steigt
- `○` **Anpassungsfähigkeit** – F1-Wagen (Hamilton/Ferrari-Szenario), Formelwagen (Andretti), Open-Wheeler (Surtees)
- `○` **Alle manuellen Teamwechsel** – jeder Fahrer zu jeder Zeit versetzbar
- `○` **Saubere Löschfunktion** – Rennen/Saison zurücksetzen inkl. Tod, Wechsel, Ergebnisse, All-Time-Stats

### UI & Bugs
- `○` **Alle UI-Bug-Fixes** – laufend abarbeiten, kein spezifischer Stand definiert

## Nach PC-Neustart (Nutzer-Info)
1. CMD im Projektordner öffnen
2. `npx serve .` → localhost:3000 im Browser
3. Neues CMD-Tab → `claude`
