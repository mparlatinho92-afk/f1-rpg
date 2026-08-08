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

**`--liste` ist der Vollabgleich gegen die Realität** — „1974: 15× Ronnie Peterson,
46× McLaren" — mit drei Sorten Zeile:

| Zeile | Bedeutung |
|---|---|
| Spiel + real | Δ zeigt, ob die Meldezahl stimmt |
| nur im Spiel | erfunden bzw. generiert (in fortgesetzten Saisons normal) |
| **nur real** | dieser Fahrer/Konstrukteur **meldet im Spiel gar nicht** |

Zugeordnet wird über `driver.histId` (exakt der F1DB-Slug) und für Teams über die
Namensnormalisierung aus `dnq-lever-dryrun.js`. Ohne `--liste` erscheint nur eine
Kurzfassung mit den größten Abweichungen.

- **Meldung = Starter + DNQ + DNPQ.** Wer in der Vor-Quali scheiterte, hat gemeldet. Indy ist überall ausgeschlossen (anderes Starterfeld).
- `--saisons=N` nutzt exakt die Saison-Übergangskette aus `monte-carlo-multi.js`.
- `--fahrer=` / `--team=` suchen als **Teilstring**, Groß/Klein egal.
- ⚠ Ab der zweiten Saison ist der Kader generiert — der F1DB-Vergleich trifft dann Niveau und Form, nicht die Identität einzelner Fahrer.
- ⚠ **Bekannter Befund (2026-08-08):** ab Saison 2 fällt DNQ auf ~0 und die Streckenstreuung kollabiert (Meldung = Starter). Siehe `DNQ_MELDEPLAN.md` Abschnitt 14.3.

Für die unkommittete `index.html` statt des letzten Monolithen: `SIMCORE_FROM_INDEX=1` davorsetzen. Gilt für **alle** sim-core-Skripte.

## Ausführen

```
node tests/generate-truth.js
node tests/monte-carlo.js 1967 50
node tests/monte-carlo.js 1984 100
```

## Kennzahlen im Bericht

- Fahrer-/Konstrukteur-WM-Verteilung (mit `← REAL`-Markierung)
- Ø Siege pro Team, DNF-Rate (Sim vs. Real Δ)
- Champion-Punkte (Ø, Median, Min/Max)
- Realitäts-Check: ✓ wenn Realchampion ≥ 20 % der Sims gewinnt, ⚠ sonst

## Toleranzen (Strecken-Rundenzeiten)

- Qualifying: ±8s vs. historische Referenz
- Race: ±12s vs. historische Referenz
- Validiert für: 1950, 1962, 1967, 1975, 1984
