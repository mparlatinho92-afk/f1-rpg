# Paket H — D4-Validierung: Trichter-Modell vs. `DECADE_NATION_POOLS`

GENERIERT von `derive-pyramid.js` — nicht von Hand editieren.

Modell je Dekade: `F1(nat) = renorm( INTAKE_NATION_SHARES[dek][nat] × LADDER[era(dek)][nat] )`,
Floor ε=0.002, MODERN-Gate vor 2000. Ziel: `DECADE_NATION_POOLS` (selbst geglättet, Paket F).
Fehlermaß: **TVD** = ½·Σ|Modell−Ziel| (0 = identisch, 1 = disjunkt).

| Dekade | TVD | F1-Debüts (Stichprobe) | Bewertung |
|---|---:|---:|---|
| 1950 | 0.062 | 236 | ✅ gut |
| 1960 | 0.157 | 135 | 🟡 ok (Dekaden-Rauschen) |
| 1970 | 0.152 | 133 | 🟡 ok (Dekaden-Rauschen) |
| 1980 | 0.107 | 79 | ✅ gut |
| 1990 | 0.126 | 66 | ✅ gut |
| 2000 | 0.078 | 49 | ✅ gut |
| 2010 | 0.126 | 41 | ✅ gut |
| 2020 | 0.208 | 18 | 🟡 ok (Dekaden-Rauschen) |

**Mittlere TVD über 8 Dekaden: 0.127**

Hinweis Stichprobengröße: 2010er/2020er haben nur 41/11 reale F1-Debüts — ein einzelner
Fahrer bewegt dort mehrere Prozentpunkte (Piastri ≈ 9% der 2020er-Debüts). Abweichungen
bei AUS/MON/THA 2020 sind Poisson-Rauschen des Ziels, kein Modellfehler (METHODIK §6).

## 1950er (TVD 0.062, Ära e50)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| POR | 1.1% | 0.2% | +0.9pp |
| URU | 0.4% | 1.2% | -0.8pp |
| BRA | 0.9% | 1.7% | -0.8pp |
| GBR | 23.0% | 23.8% | -0.8pp |
| AUS | 1.3% | 2.0% | -0.7pp |
| NOR | 0.9% | 0.2% | +0.7pp |
| CAN | 0.9% | 0.2% | +0.7pp |
| RSA | 0.9% | 0.2% | +0.7pp |
| MON | 0.3% | 0.9% | -0.7pp |
| FRA | 11.9% | 12.4% | -0.5pp |

## 1960er (TVD 0.157, Ära e62)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| USA | 10.2% | 15.3% | -5.1pp |
| GBR | 21.7% | 26.7% | -5.0pp |
| FRA | 8.9% | 5.1% | +3.8pp |
| AUT | 3.5% | 1.4% | +2.1pp |
| AUS | 4.5% | 2.5% | +1.9pp |
| SWE | 2.5% | 0.8% | +1.7pp |
| BRA | 1.4% | 0.2% | +1.2pp |
| CAN | 1.5% | 2.4% | -0.9pp |
| RSA | 5.3% | 6.1% | -0.8pp |
| JPN | 1.0% | 0.2% | +0.8pp |

## 1970er (TVD 0.152, Ära e62)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| USA | 11.2% | 6.7% | +4.5pp |
| GBR | 20.0% | 16.3% | +3.7pp |
| FRA | 7.9% | 11.6% | -3.7pp |
| BRA | 2.5% | 5.0% | -2.5pp |
| AUT | 2.9% | 5.0% | -2.0pp |
| SWE | 2.6% | 4.6% | -2.0pp |
| AUS | 2.9% | 4.5% | -1.5pp |
| ITA | 8.5% | 9.5% | -1.1pp |
| BEL | 3.5% | 2.6% | +1.0pp |
| ZIM | 1.1% | 0.2% | +0.9pp |

## 1980er (TVD 0.107, Ära e76)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| ITA | 24.2% | 21.3% | +2.9pp |
| JPN | 3.7% | 1.3% | +2.4pp |
| USA | 2.2% | 3.5% | -1.3pp |
| FRA | 15.9% | 17.2% | -1.3pp |
| GBR | 12.4% | 13.5% | -1.1pp |
| ARG | 1.4% | 2.5% | -1.0pp |
| IRL | 1.1% | 2.0% | -1.0pp |
| BEL | 1.7% | 0.8% | +0.9pp |
| FIN | 2.6% | 1.7% | +0.9pp |
| COL | 0.2% | 1.0% | -0.8pp |

## 1990er (TVD 0.126, Ära e76)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| ITA | 18.2% | 22.9% | -4.7pp |
| JPN | 4.2% | 7.7% | -3.5pp |
| IRL | 3.4% | 0.2% | +3.3pp |
| USA | 2.0% | 0.4% | +1.6pp |
| ARG | 2.4% | 0.9% | +1.5pp |
| FIN | 2.5% | 3.6% | -1.1pp |
| BEL | 1.4% | 2.5% | -1.1pp |
| AUT | 3.5% | 4.2% | -0.7pp |
| ESP | 1.9% | 1.2% | +0.7pp |
| SWE | 1.0% | 0.4% | +0.6pp |

## 2000er (TVD 0.078, Ära e94)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| BRA | 11.7% | 12.9% | -1.2pp |
| GER | 14.6% | 15.7% | -1.1pp |
| GBR | 12.2% | 13.2% | -1.0pp |
| IRL | 1.5% | 0.6% | +0.9pp |
| ARG | 1.5% | 0.6% | +0.9pp |
| ITA | 9.4% | 10.2% | -0.8pp |
| COL | 0.2% | 1.0% | -0.8pp |
| CHN | 0.9% | 0.2% | +0.7pp |
| FIN | 5.9% | 6.5% | -0.6pp |
| FRA | 5.7% | 6.3% | -0.5pp |

## 2010er (TVD 0.126, Ära e10)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| GER | 12.4% | 16.8% | -4.4pp |
| BRA | 5.0% | 6.9% | -1.9pp |
| CAN | 2.5% | 0.9% | +1.6pp |
| ESP | 7.6% | 8.8% | -1.2pp |
| GBR | 14.9% | 13.8% | +1.1pp |
| NED | 3.7% | 2.7% | +1.0pp |
| MAS | 1.1% | 0.2% | +0.9pp |
| IRL | 1.0% | 0.2% | +0.8pp |
| BEL | 1.4% | 2.2% | -0.8pp |
| COL | 0.9% | 0.2% | +0.7pp |

## 2020er (TVD 0.208, Ära e10)

| Nation | Modell | Ziel (Pools) | Δ |
|---|---:|---:|---:|
| GER | 16.1% | 8.4% | +7.7pp |
| GBR | 12.7% | 16.8% | -4.1pp |
| AUS | 3.2% | 6.8% | -3.5pp |
| CAN | 1.5% | 4.9% | -3.4pp |
| BRA | 5.4% | 2.5% | +2.9pp |
| MON | 0.3% | 2.5% | -2.2pp |
| ESP | 7.6% | 6.3% | +1.3pp |
| FRA | 11.5% | 12.7% | -1.2pp |
| THA | 0.8% | 1.9% | -1.1pp |
| CHN | 0.6% | 1.7% | -1.1pp |
