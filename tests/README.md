# Tests – Monte Carlo & Balancing

## Monte-Carlo-Infrastruktur

| Datei | Zweck |
|---|---|
| `sim-core.js` | Lädt die echte HTML-Datei in Node via `vm.runInNewContext` mit Browser-Stubs (Proxy) |
| `generate-truth.js` | Erzeugt `historical_truth.json` aus F1DB-Rohdaten (einmalig ausführen) |
| `monte-carlo.js` | Simuliert N Saisons, vergleicht mit historical_truth, gibt Bericht aus |
| `monte-carlo-multi.js` | Multi-Saison-Variante |
| `history-mc.js` | Historische Saisons |

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
