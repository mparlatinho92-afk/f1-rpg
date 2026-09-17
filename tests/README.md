# Tests – Monte Carlo & Balancing

## Monte-Carlo-Infrastruktur

| Datei | Zweck |
|---|---|
| `sim-core.js` | Lädt die echte HTML-Datei in Node via `vm.runInNewContext` mit Browser-Stubs (Proxy) |
| `generate-truth.js` | Erzeugt `historical_truth.json` aus F1DB-Rohdaten (einmalig ausführen) |
| `monte-carlo.js` | Simuliert N Saisons, vergleicht mit historical_truth, gibt Bericht aus |
| `monte-carlo-multi.js` | Multi-Saison-Variante |
| `history-mc.js` | Historische Saisons |
| `mc-entries-dnq.js` | **Meldungen, DNQ und Einzelauswahl** je Fahrer/Team/Strecke, gegen F1DB |

## Meldungen & DNQ — `mc-entries-dnq.js`

Fährt die **volle Renn-Pipeline** (Training → Qualifying → Rennen → `applyRaceResults`)
und sieht damit auch Vor-Qualifikation, Grid-Füller und Ausfälle. Die Skripte
`dnq-entrant-diagnosis.js` / `dnq-venue-diagnosis.js` messen dagegen nur den
Planungsstand aus `expandSeasonData`, also den Saisonstart.

```
node tests/mc-entries-dnq.js 1952 30                 Meldungen/DNQ gegen F1DB
node tests/mc-entries-dnq.js 1974 30 --liste         GESAMTLISTE Fahrer + Konstrukteur
node tests/mc-entries-dnq.js 1975 20 --saisons=6     FORTGESETZTER Fall
node tests/mc-entries-dnq.js 1952 30 --strecken      Tabelle je Strecke
node tests/mc-entries-dnq.js 1965 20 --fahrer=Bonnier
node tests/mc-entries-dnq.js 1965 20 --team=Cooper
```

**Der Abgleich gegen F1DB läuft immer** — je Fahrer und je Konstrukteur, in
derselben Zeile wie Start/DNQ („1974: 15× Ronnie Peterson, 46× McLaren").
Drei Sorten Zeile:

| Zeile | Bedeutung |
|---|---|
| Spiel + real | Δ zeigt, ob die Meldezahl stimmt |
| nur im Spiel | erfunden bzw. generiert (in fortgesetzten Saisons normal) |
| **nur real** | dieser Fahrer/Konstrukteur **meldet im Spiel gar nicht** |

Zugeordnet wird über `driver.histId` (exakt der F1DB-Slug) und für Teams über die
Namensnormalisierung aus `dnq-lever-dryrun.js`. Ohne `--liste` sind die Tabellen auf
20 Zeilen gekürzt – **„meldet im Spiel NICHT" bleibt aber immer sichtbar**, das ist
der wichtigste Befund. `--liste` hebt nur die Kürzung auf.

⚠ **Kein „(ohne Team)" erwarten.** Geprüft: von 1380 Meldungen in 1974 hatte **keine
einzige** kein Team. Taucht die Zeile wieder auf, ist es ein Messfehler im Skript,
kein Spielbefund – der Kader muss zwischen `simulateRace` und `applyRaceResults`
eingelesen werden, weil letzteres schon Sitzverluste nachzieht.

- **Meldung = Starter + DNQ + DNPQ.** Wer in der Vor-Quali scheiterte, hat gemeldet. Indy ist überall ausgeschlossen (anderes Starterfeld).
- `--saisons=N` nutzt exakt die Saison-Übergangskette aus `monte-carlo-multi.js`.
- `--fahrer=` / `--team=` suchen als **Teilstring**, Groß/Klein egal.
- ⚠ Ab der zweiten Saison ist der Kader generiert — der F1DB-Vergleich trifft dann Niveau und Form, nicht die Identität einzelner Fahrer.
- ⚠ **Bekannter Befund (2026-08-08):** ab Saison 2 fällt DNQ auf ~0 und die Streckenstreuung kollabiert (Meldung = Starter). Siehe `DNQ_MELDEPLAN.md` Abschnitt 14.3.

Für die unkommittete `index.html` statt des letzten Monolithen: `SIMCORE_FROM_INDEX=1` davorsetzen. Gilt für **alle** sim-core-Skripte.

## Karriere-Bogen & Pace-Entwicklung — `karriere-peak*.js`, `pace-kurve-real.js`

Hat eine Fahrerkarriere einen **Bogen** (Aufstieg, Zenit, Abbau) oder ist sie flach?
Gemessen wird der **Punkteanteil am Saisonbesten** (`points / championPoints`) – der
überlebt Punktereformen und Feldgrößen, im Gegensatz zu Rohpunkten oder WM-Rang.

```
node tests/karriere-peak.js <export.json>              Export gegen F1DB, drei Gruppen
node tests/karriere-peak-sim.js 1980 160 2010 --laeufe=3   simuliert und misst
node tests/pace-kurve-real.js                          Zielkurve aus PACE_RATINGS
```

**Drei Gruppen, eine Metrik.** `karriere-peak.js` vergleicht immer:

| | Bedeutung |
|---|---|
| **A** | Realität aus F1DB (`f1db-seasons-drivers.json`) |
| **B** | echte Fahrer im Spielstand – **der realistische Zielwert**, gleiche Engine |
| **C** | generierte Fahrer |

Für A/B-Läufe: **ohne** `SIMCORE_FROM_INDEX` misst `karriere-peak-sim.js` den letzten
gebauten Monolithen (= Stand vor der Änderung), **mit** die Arbeitskopie. Beide Läufe
parallel starten, dann die Blöcke vergleichen.

**Die reale Zielkurve** (`pace-kurve-real.js`, 160 Fahrer mit lückenloser Jahresfolge):
Debüt bei **88,5 %** des eigenen Peaks, Zenit im Karrierejahr **4,2**, danach **2,95**
Pace-Punkte Abbau pro Jahr; der pro Jahr geschlossene Gap-Anteil **steigt**
(32/42/46/53 %).

⚠ **Messfallen:**
- `f1db-seasons-driver-standings.json` ist die **falsche** Quelle – sie listet nur
  Fahrer in der Wertung, punktlose Saisons fehlen. Richtig: `f1db-seasons-drivers.json`.
- Fahrer-IDs tragen einen Zeitstempel und sind **nicht stabil** – echte Fahrer über
  `histId` zusammenfassen, nie über `id`.
- **Noch aktive Karrieren müssen raus**, sonst zählt eine laufende Saison als
  Karriereende.
- Ein Lauf über 80 Saisons liefert nur ~40 abgeschlossene generierte Karrieren – bei
  dem n liegen 10 Prozentpunkte im Rauschen. `--laeufe=N` fasst mehrere zu **einer**
  Kohorte zusammen (Schlüssel werden je Lauf eindeutig gehalten).
- Rücktritte erst **nach `processTeamChanges()`** abgreifen, sonst fehlen die
  Entlassungen (16 statt ~300) und der Rest sieht „spurlos verschwunden" aus.
- `GAME_STATE.history` taugt **nicht** als Quelle: `drivers` ist dort ein heavy field
  und im Steady-State leer. Der Snapshot wird Saison für Saison selbst gezogen.
- **Feldgröße kontrollieren**, bevor ein Streuungsbefund geglaubt wird.

## Feld-Spreizung — `feld-spreizung.js`

Liegt das Feld so weit auseinander wie real? Vier Kennzahlen je Ära gegen F1DB:
Punktequote, Anteil des schwächsten Teams, Champion-Anteil, DNF-Quote.

```
node tests/feld-spreizung.js <export.json>
node tests/feld-spreizung.js <export.json> --csv
```

Gedacht als **Zielkurve** für carSpeed, Elo-Übersetzung und Form-Vielfalt — dieselbe
Rolle, die `ERA_ROOKIE_AGE` für das Debütalter spielt. Gemessen wird für **alle**
Fahrer gemeinsam, echt wie generiert: sie laufen durch dieselbe `simulateRace`.

⚠ **Messfallen:**
- **Betrag UND Vorzeichen lesen.** „Letztes Team" trifft im Mittel mit −0,4 — in
  Wahrheit ist das Spiel in den 1950ern zu hart und ab 2000 zu weich, zwei echte
  Fehler heben sich auf. Das Werkzeug warnt mit `⚠ VORZEICHEN KIPPT`.
- **Bei Anteilen dieselbe Grundgesamtheit verwenden.** Ein Champion-Anteil auf
  gefilterten Karrieren (nur ≥4 Saisons) gegen einen auf allen Fahrern ergibt 38,5 %
  gegen 18,2 % — reiner Messartefakt.
- Reale Feldgröße aus `f1db-seasons-drivers.json`, nicht aus den Standings: letztere
  listen nur Fahrer in der Wertung, und genau die punktlosen fehlen dort.
- Reales DNF: `positionText` ist bei Ausfällen keine Zahl; DNS/DNQ/DNPQ/EX vorher
  herausfiltern, das sind Nicht-Starter.

Stand 16.09.2026: **nur die Punktequote liegt daneben** (+17,6 Punkte, immer dieselbe
Richtung). Details in `BEFUNDE.md`.

## Vakuum-Saison — `vakuum-saison.js`

Misst die Ergebniserzeugung **ohne** das Drumherum: echte Fahrer, echte Teams, echtes
Startfeld aus F1DB. Was hier abweicht, kommt aus `simulateRace` selbst — aus carSpeed,
Elo-Übersetzung oder Form-Vielfalt.

```
SIMCORE_FROM_INDEX=1 node tests/vakuum-saison.js 1988 20
SIMCORE_FROM_INDEX=1 node tests/vakuum-saison.js 2010 20 --quali
```

**Zwei Modi, und ihre Differenz ist selbst ein Messwert:** ohne `--quali` reale
Startplätze (misst nur das Rennen), mit `--quali` qualifiziert das Spiel selbst und nur
das Teilnehmerfeld ist fixiert. Die Differenz ist der Beitrag der Qualifikation.

Setzt nicht das Fahrerfeld, sondern `qualifyingResults` — seit v0.9.17.14 folgt das
Rennen der Qualifikation, also bestimmt das Quali-Ergebnis Teilnehmer und Startplätze.

⚠ **Messfallen:**
- **Deckung zuerst lesen.** Ein Fahrer ohne gültiges `team` wird in `simulateRace`
  stillschweigend übersprungen. Unter ~90 % Deckung ist das Ergebnis wertlos.
- **Spiel-IDs sind keine F1DB-Slugs** — über `histId` auflösen, sonst stehen
  Trefferquoten von 100 % neben Top-3 von 0 %.
- **Streichresultate** bis 1990 (1988: beste 11 von 16). Beide Seiten rechnen hier
  ohne, deshalb führt 1988 Prost statt Senna. Für solche Jahre Rangabweichung und
  Top-3 lesen, nicht die Meister-Trefferquote.
- Indy 500 der 50er fliegt raus (anderes Rennen, eigenes Feld).

Stand 17.09.2026: Deckung 100 %, Rangabweichung 1,2–1,6 Plätze. Die Punktequote trifft
1988 fast genau (+2,6) und weicht 2010 um +14,9 ab — gegen +34,0 im vollen Spielstand.
Der größere Hebel liegt also im **Startfeld**, nicht in der Engine. Details in
`BEFUNDE.md`.

## Ausführen

Immer aus dem **Projektordner** starten (`C:\Users\lyric\Documents\F1 RPG HTML`).

```
node tests/generate-truth.js
node tests/monte-carlo.js 1967 50
node tests/monte-carlo.js 1984 100
```

### Welche HTML wird gemessen?

`sim-core.js` lädt standardmäßig den **neuesten Monolithen** `f1-rpg-vX.html` –
also den zuletzt per `manage-v` gebauten Stand. Um stattdessen die **unkommittete
`index.html` + `data/*.js`** zu messen, `SIMCORE_FROM_INDEX` setzen.

**PowerShell** (Umgebungsvariablen gehen dort anders als in bash):
```powershell
$env:SIMCORE_FROM_INDEX = "1"
node tests/mc-entries-dnq.js 1974 30 --liste

# wieder abschalten (sonst gilt es für das ganze Fenster):
$env:SIMCORE_FROM_INDEX = $null
```
Einzeiler: `$env:SIMCORE_FROM_INDEX="1"; node tests/monte-carlo.js 1974 50`

**Git Bash / CMD-mit-bash:** `SIMCORE_FROM_INDEX=1 node tests/...`

Die erste Zeile der Ausgabe sagt immer, was geladen wurde:
`[sim-core] Lade: f1-rpg-v0.9.15.82.html` oder `[sim-core] Lade: index.html + data/*.js`.

### Ergebnisse für Claude ablegen

**Nicht in den Chat kopieren** – als Datei nach `tests/output/` schreiben und Claude
den Dateinamen nennen; er liest sie direkt. Der Ordner ist in `.gitignore`.

```powershell
New-Item -ItemType Directory -Force tests/output | Out-Null
node tests/mc-entries-dnq.js 1974 30 --liste | Tee-Object -FilePath tests/output/mc-1974.txt
```

`Tee-Object` zeigt die Ausgabe gleichzeitig im Fenster. Wer sie nur in der Datei
braucht: `| Out-File -Encoding utf8 tests/output/mc-1974.txt`. Bei reinem `>` gehen
unter Windows die Tabellenlinien kaputt.

## Kennzahlen im Bericht

- Fahrer-/Konstrukteur-WM-Verteilung (mit `← REAL`-Markierung)
- Ø Siege pro Team, DNF-Rate (Sim vs. Real Δ)
- Champion-Punkte (Ø, Median, Min/Max)
- Realitäts-Check: ✓ wenn Realchampion ≥ 20 % der Sims gewinnt, ⚠ sonst

## Toleranzen (Strecken-Rundenzeiten)

- Qualifying: ±8s vs. historische Referenz
- Race: ±12s vs. historische Referenz
- Validiert für: 1950, 1962, 1967, 1975, 1984
