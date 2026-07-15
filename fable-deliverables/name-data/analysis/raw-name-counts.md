# Echte Rohzahlen pro Land (Kaggle / philipperemy name-dataset)

**Quelle:** Kaggle „forenames-and-surnames-with-gender-and-country" (aggregiert aus
philipperemy/name-dataset, **491.655.925 Records, 106 Länder**). Schema `name,gender,country,count`
(ISO-2). Roh-CSVs lokal in `F1 RPG Namenslisten & Namensgeneratoren/` (forenames.csv 226 MB /
surnames.csv 382 MB), per `.gitignore` vom Repo ausgeschlossen — **hier die daraus gezählten Zahlen**.

Die `distinct`-Gesamtzahl enthält viel Tippfehler-/Transliterations-Schwanz. **≥100 Träger ist
die belastbare „echte Namen"-Zahl.** (Datei ist nach Land gruppiert → speicherschonendes Streaming.)

Gesamt über alle 104 Länder mit Nachnamen-Daten: **15,7 M distinct · ≥50: 847.096 · ≥100: 453.493.**

## Nachnamen — echte Distinct-Zahlen (Spiel-Nationen)

| IOC | ISO | distinct (roh) | ≥50 | ≥100 |
|-----|-----|---------------:|----:|-----:|
| ITA | IT | 661.812 | 74.006 | 45.999 |
| FRA | FR | 730.549 | 52.912 | 26.424 |
| USA | US | 707.038 | 45.651 | 25.260 |
| MAR | MA | 665.216 | 33.828 | 17.670 |
| RSA | ZA | 348.353 | 30.550 | 16.635 |
| TUR | TR | 391.107 | 28.423 | 16.142 |
| RUS | RU | 459.203 | 24.343 | 12.409 |
| GBR | GB | 272.432 | 20.285 | 11.665 |
| MAS | MY | 340.619 | 17.898 | 10.085 |
| COL | CO | 522.692 | 18.411 | 8.878 |
| ESP | ES | 606.580 | 17.070 | 8.253 |
| NED | NL | 198.320 | 16.486 | 8.041 |
| MEX | MX | 366.641 | 13.633 | 7.299 |
| GER | DE | 286.788 | 15.322 | 7.239 |
| ISR | IL | 179.804 | 10.488 | 5.352 |
| BRA | BR | 179.702 | 9.111 | 4.678 |
| IND | IN | 156.151 | 8.613 | 4.671 |
| BEL | BE | 168.026 | 9.726 | 4.383 |
| CAN | CA | 161.686 | 7.970 | 4.142 |
| POL | PL | 119.775 | 8.018 | 3.812 |
| ARG | AR | 85.565 | 3.866 | 2.010 |
| FIN | FI | 52.029 | 3.676 | 1.932 |
| SUI | CH | 89.054 | 4.324 | 1.913 |
| IRL | IE | 43.108 | 2.653 | 1.601 |
| CZE | CZ | 98.679 | 3.588 | 1.529 |
| AUT | AT | 75.004 | 3.454 | 1.409 |
| URU | UY | 53.205 | 2.782 | 1.393 |
| POR | PT | 39.536 | 2.281 | 1.314 |
| SWE | SE | 62.178 | 2.045 | 1.008 |
| JPN | JP | 22.847 | 1.117 | **521** |
| DEN | DK | 36.288 | 992 | 438 |
| HUN | HU | 20.399 | 811 | 386 |
| NOR | NO | 33.958 | 846 | 359 |
| GRE | GR | 60.558 | 902 | 304 |
| INA | ID | 9.993 | 208 | **71** |
| KOR | KR | 480 | 50 | **32** |
| EST | EE | 9.822 | 57 | **11** |

## Vollname-Kombinationsraum (Vornamen männl. × Nachnamen, beide ≥100 Träger)

| IOC | V≥100 | N≥100 | Kombis (V×N) |
|-----|------:|------:|-------------:|
| ITA | 5.793 | 45.999 | 266 Mio |
| USA | 7.890 | 25.260 | 199 Mio |
| FRA | 5.098 | 26.424 | 135 Mio |
| RSA | 5.547 | 16.635 | 92 Mio |
| MAS | 5.577 | 10.085 | 56 Mio |
| COL | 4.590 | 8.878 | 41 Mio |
| GBR | 2.955 | 11.665 | 34 Mio |
| RUS | 2.601 | 12.409 | 32 Mio |
| MEX | 3.248 | 7.299 | 24 Mio |
| ESP | 2.592 | 8.253 | 21 Mio |
| IND | 4.263 | 4.671 | 20 Mio |
| NED | 2.159 | 8.041 | 17 Mio |
| GER | 2.146 | 7.239 | 16 Mio |
| ISR | 2.240 | 5.352 | 12 Mio |
| BRA | 2.415 | 4.678 | 11 Mio |
| CAN | 1.781 | 4.142 | 7,4 Mio |
| BEL | 1.492 | 4.383 | 6,5 Mio |
| SUI | 956 | 1.913 | 1,8 Mio |
| POL | 419 | 3.812 | 1,6 Mio |
| ARG | 677 | 2.010 | 1,4 Mio |
| FIN | 540 | 1.932 | 1,0 Mio |
| IRL | 523 | 1.601 | 837 k |
| AUT | 567 | 1.409 | 799 k |
| POR | 526 | 1.314 | 691 k |
| URU | 475 | 1.393 | 662 k |
| CZE | 322 | 1.529 | 492 k |
| SWE | 470 | 1.008 | 474 k |
| MAR | **14** | 17.670 | 247 k |
| JPN | 347 | 521 | 181 k |
| GRE | 433 | 304 | 132 k |
| DEN | 296 | 438 | 130 k |
| NOR | 295 | 359 | 106 k |
| HUN | 156 | 386 | 60 k |
| INA | 70 | 71 | 4.970 |
| KOR | 63 | 32 | 2.016 |
| EST | 88 | 11 | 968 |
| TUR | **0** | 16.142 | **0** |

### Datenlücken, die Fable-Handarbeit brauchen (nicht mechanisch lösbar)
- **TUR:** 0 männliche Vornamen in der Quelle (Nachnamen 16k!) — Vornamen komplett handbefüllen.
- **MAR:** nur 14 Vornamen ≥100 (Nachnamen 17k) — Vornamen scrapen den Boden.
- **KOR 63/32, EST 88/11, INA 70/71** — echte Datengrenze (Korea hat real kaum Nachnamen).
- **6 Null-Nationen** (AUS/NZL/VEN/ZIM/MON/THA): im Datensatz gar nicht enthalten.
- **CHN:** in den Rohdaten mit **2000/2000** vorhanden — war bisher nur eine Config-Auslassung
  im alten Export (handbefüllt mit 89). Mechanisch erschließbar.

### Datenlimitierte Nationen (echtes Maximum < 2000, kein Filter-Artefakt)
KR Nachnamen 479 · EE Vornamen 1801 · IS 1087/1907 · MA Vornamen 323 · TN Vornamen 1 (unbrauchbar).
→ **Pro-Nation-Cap muss `min(Ziel, echte Decke)` sein**, sonst holt man bei JPN/KOR/EST Datenmüll.

## Nicht-Spiel-Länder mit Daten (66 total — Kandidaten zum Aktivieren)
Die Quelle hat ~104 Länder, ~60 davon nicht im Spiel — viele **reicher als aktuelle Spiel-Nationen**:

| ISO | Land | V≥100 | N≥100 | Kombis |
|-----|------|------:|------:|-------:|
| SA | Saudi-Arabien | 14.904 | 22.978 | 342 Mio |
| EG | Ägypten | 11.786 | 28.201 | 332 Mio |
| IQ | Irak | — | ~12k | 90 Mio |

Weitere genannt: 🇸🇩 Sudan, 🇳🇬 Nigeria (~8k N), 🇵🇪 Peru (~5,4k N), 🇨🇱 Chile, 🇰🇿 Kasachstan,
🇦🇫 Afghanistan (450k Kombis), 🇩🇿 Algerien (~13k N), 🇸🇾 Syrien (~7,6k N).

**Gender-Lücke (arabische Länder):** viele haben tausende Nachnamen, aber **0 Vornamen**
(DZ 12.978 N / 0 V, SY 7.600 / 0, TN 7.202 / 0, YE, LB, LY) — dort wären Vornamen Handarbeit.

> Vollständige 66er-Liste reproduzierbar aus den Roh-CSVs (Join V≥100 × N≥100 pro Land,
> Skript-Muster in `capacity-and-compression.md` bzw. `aggregate-names.js`).

## Aggregations-Befehle (Top-2000 aus den Roh-CSVs)
```
# aus fable-deliverables/name-data/, Roh-CSVs im Unterordner:
node aggregate-names.js "F1 RPG Namenslisten & Namensgeneratoren/forenames.csv" fore_agg.csv M   2000
node aggregate-names.js "F1 RPG Namenslisten & Namensgeneratoren/surnames.csv"  sur_agg.csv  ALL 2000
```
Streaming (konstanter Speicher), ~30 s gesamt. Top-2000: Vornamen 4,48 M / Nachnamen 16,58 M
Zeilen übernommen, 59 Länder. `TOP_N` ist nur ein Parameter — die Kappung sitzt zusätzlich in
`build-names-v3.js` `CLASSES` (Torso-Caps + weight-1-Tails).
