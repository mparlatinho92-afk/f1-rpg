# Coverage-Report: Spiel vs. lokale Quelle (Top-400-Export)

**Stand:** vor der v4-Vertiefung (Spiel = v0.9.14.70-Pool). Quelle = `fore_agg.csv`/
`sur_agg.csv`, damals hart auf **Top-400 je Land & Typ** gekappt (800/Nation). Zählung via
Opus-Skript über `data/names.js` (Spiel) vs. CSV (Quelle), IOC→ISO-Mapping aus `build-names-v3.js`.

> **Hinweis:** Diese Prozente sind der Ausgangszustand. Nach v0.9.14.71 (Caps 600 Vor/1500 Nach)
> sind die Spiel-Zahlen ~4–5× höher. Der Report zeigt, **wo damals gefiltert wurde** und dient als
> Baseline für „welche Nation ist relativ dünn".

## Getrennt nach Vor-/Nachnamen (alle 45 Nationen)

| IOC | ISO | Spiel V | Quelle V | V% | Spiel N | Quelle N | N% |
|-----|-----|--------:|---------:|---:|--------:|---------:|---:|
| USA | US  | 272 | 400 | 68% | 375 | 400 | 94% |
| ESP | ES  | 284 | 400 | 71% | 359 | 400 | 90% |
| ITA | IT  | 267 | 400 | 67% | 373 | 400 | 93% |
| GBR | GB  | 267 | 400 | 67% | 364 | 400 | 91% |
| BRA | BR  | 266 | 400 | 67% | 351 | 400 | 88% |
| JPN | JP  | 276 | 400 | 69% | 326 | 400 | 82% |
| GER | DE  | 268 | 400 | 67% | 312 | 400 | 78% |
| FRA | FR  | 272 | 400 | 68% | 297 | 400 | 74% |
| RSA | ZA  | 233 | 400 | 58% | 308 | 400 | 77% |
| SUI | CH  | 224 | 400 | 56% | 305 | 400 | 76% |
| CAN | CA  | 218 | 400 | 55% | 302 | 400 | 76% |
| BEL | BE  | 219 | 400 | 55% | 295 | 400 | 74% |
| FIN | FI  | 212 | 400 | 53% | 298 | 400 | 75% |
| ARG | AR  | 215 | 400 | 54% | 288 | 400 | 72% |
| NED | NL  | 206 | 400 | 52% | 292 | 400 | 73% |
| SWE | SE  | 209 | 400 | 52% | 289 | 400 | 72% |
| MEX | MX  | 207 | 400 | 52% | 288 | 400 | 72% |
| IRL | IE  | 203 | 400 | 51% | 289 | 400 | 72% |
| AUT | AT  | 203 | 400 | 51% | 288 | 400 | 72% |
| COL | CO  | 203 | 400 | 51% | 288 | 400 | 72% |
| POL | PL  | 202 | 400 | 51% | 287 | 400 | 72% |
| POR | PT  | 200 | 400 | 50% | 288 | 400 | 72% |
| DEN | DK  | 200 | 400 | 50% | 286 | 400 | 72% |
| HUN | HU  | 200 | 400 | 50% | 278 | 400 | 70% |
| NOR | NO  | 207 | 400 | 52% | 260 | 400 | 65% |
| GRE | GR  | 194 | 400 | 49% | 269 | 400 | 67% |
| CZE | CZ  | 200 | 400 | 50% | 187 | 400 | 47% |
| RUS | RU  | 204 | 400 | 51% | 175 | 400 | 44% |
| IND | IN  | 143 | 400 | 36% | 201 | 400 | 50% |
| EST | EE  | 141 | 400 | 35% | 202 | 400 | 51% |
| MAS | MY  | 132 | 400 | 33% | 196 | 400 | 49% |
| URU | UY  | 134 | 400 | 34% | 193 | 400 | 48% |
| INA | ID  | 124 | 400 | 31% | 190 | 400 | 48% |
| ISR | IL  | 125 | 400 | 31% | 184 | 400 | 46% |
| TUR | TR  | 44 | **0** | — | 260 | 400 | 65% |
| MAR | MA  | 30 | 323 | 9% | 181 | 400 | 45% |
| KOR | KR  | 20 | 400 | 5% | 170 | 400 | 43% |
| AUS | —   | 79 | **0** | — | 173 | **0** | — |
| NZL | —   | 60 | **0** | — | 118 | **0** | — |
| VEN | —   | 64 | **0** | — | 114 | **0** | — |
| CHN | —   | 37 | **0** | — | 52 | **0** | — |
| ZIM | —   | 18 | **0** | — | 70 | **0** | — |
| MON | —   | 29 | **0** | — | 33 | **0** | — |
| THA | —   | 32 | **0** | — | 25 | **0** | — |
| INT | —   | 12 | **0** | — | 12 | **0** | — |
| **Σ** | | **7.555** | **14.323** | **53%** | **10.691** | **14.800** | **72%** |

## Nullen
- **Im Spiel:** keine einzige Nation mit 0 — jede hat Vor- und Nachnamen (selbst INT-Fallback 12/12).
- **Quelle Vornamen = 0:** TUR + die 8 handbefüllten (AUS, NZL, VEN, CHN, ZIM, MON, THA, INT).
  TUR ist der interessante Fall: keine türkischen Vornamen im BigQuery-Export → die 44 im Spiel handergänzt.
- **Quelle Nachnamen = 0:** nur die 8 handbefüllten.

## Was auffällt
- **Nachnamen (72 %) viel besser abgedeckt als Vornamen (53 %)** — Vornamen werden stärker
  gefiltert (Ära-Splits + Migrations-Bans wie „keine Mehmet/Mohammed in GER-Vornamen").
- **Billig aufstockbar** (Quelle da, Spiel dünn): KOR (Vornamen 20/400!), MAR (30/323), sowie
  IND/EST/MAS/URU/INA/ISR (~30–35 %). Reine Build-Skript-Frage, keine neuen Daten nötig.
  → Nach v0.9.14.71 teils erledigt.
- **Nur mit neuen Daten aufstockbar** (keine Quelle): CHN (89), ZIM (88), MON (62), THA (57)
  — hier ist Wiederholungsgefahr am größten. (CHN ist inzwischen als lösbar erkannt, s.
  `raw-name-counts.md` — war nur Config-Auslassung.)
