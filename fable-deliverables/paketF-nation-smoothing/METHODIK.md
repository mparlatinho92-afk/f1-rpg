# Paket F – Methodik: Nationen-Glättung (2026-07-07)

**Deliverables:** `DECADE_NATION_POOLS.js` + `MOTORSPORT_NATION_BLEND.js` (paste-fertig, exakt bestehende Key-Struktur, Summe je Dekade = 1.0) — generiert von `derive-smoothed-pools.js` (reproduzierbar: `node derive-smoothed-pools.js`).

## Datenbasis

- **DECADE-Pools:** F1DB (`f1db-json-splitted/`, Stand inkl. **Saison 2025 komplett**, 2026 verworfen) — Renn-**Starts** und **unique Fahrer** je Nation/Dekade, nur Road-F1 (Indy-500-Rennen 1950–1960 ausgeschlossen, konsistent zu v0.9.14.38). Dekade 2020 = 2020–2025.
- **BLEND:** zusätzlich Wikidata-Motorsport-Shares (12.207 Auto-Rennfahrer, `nation-data/nation-frequency-by-decade.js`).
- Vorher-Werte: Tabellen aus `index.html` v0.9.14.46 (Blend-Snapshot: `current-blend-snapshot.js`).

## Pipeline (je Dekade)

| Schritt | Parameter | Zweck |
|---|---|---|
| 1. Rohbasis | **geometrisches Mittel** aus Start-Anteil × Unique-Fahrer-Anteil | Single-Driver-Fix Teil 1: Albon (6 Saisons, 1 Kopf) und 1950er-Ein-Rennen-Privatiers werden beide gedrückt. Brief schlug „Saisons bzw. Starts" vor — reine Starts ließen THA bei ~0.046, weil die alte Tabelle *bereits* Fahrer-Saisons zählte. Die Kopf-Komponente ist die eigentliche Korrektur. |
| 2. Potenz-Glättung | **p = 0.65** | Vielfalt (analog Namen-Paket `count^0.6`); danach renormiert |
| 3. Shrink | **× u/(u+4)** (u = unique Fahrer der Nation in der Dekade) | Single-Driver-Fix Teil 2 (Empirical-Bayes-artig). k=4 nötig, weil Potenz-Glättung + Floor-Renorm Ein-Fahrer-Nationen sonst wieder anheben |
| 4. Europa-Tilt | 1950/60: ×1.0 · 1970: ×1.05 · 1980/90: ×1.1 · 2000: ×1.15 · 2010/20: ×**1.2** | milder Europa-Fokus; früh keiner (dort ohnehin europalastig), modern am stärksten (reale F1 wird globaler, Spielwelt soll europäischer bleiben). Europa-Definition im Skript (`EUROPE`-Set, inkl. RUS/TUR) |
| 5. Floor | **ε = 0.002** über Master-Liste, dann renorm | keine Nation 0 % |

**Master-Liste (56 Nationen):** Union aus allen Nationen der beiden bisherigen Tabellen + F1DB-Startdaten. Einziger Neuzugang aus F1DB: **LIE** (Rikky von Opel, 1970er). Alle bisherigen Nationen bleiben erhalten.

**BLEND-Formel:** 50 % Wikidata-Shares (auf Master-Liste beschränkt, dann ^p + Tilt, **ohne** Shrink — 12.207-Fahrer-Basis hat kein Ein-Fahrer-Problem) + 50 % geglätteter DECADE-Pool (vor Floor), danach Floor + Renorm. Das Laufzeit-Mixing der dünnen 2020er mit den 2010ern in `pickNationMotorsport` bleibt unverändert bestehen. `dampUSA` (×0.5) unangetastet — keine zusätzliche USA-Dämpfung eingebaut.

## Entropie vorher → nachher (Shannon, bits; Klammer = effektive Nationenzahl 2^H)

| Dekade | DECADE alt | DECADE neu | BLEND alt | BLEND neu |
|---|---|---|---|---|
| 1950 | 3.22 (9.3) | **3.82 (14.1)** | 3.57 (11.9) | **4.27 (19.3)** |
| 1960 | 3.44 (10.9) | **3.93 (15.2)** | 4.01 (16.1) | **4.54 (23.2)** |
| 1970 | 4.00 (16.0) | **4.39 (20.9)** | 4.31 (19.9) | **4.79 (27.6)** |
| 1980 | 3.68 (12.8) | **4.03 (16.4)** | 4.14 (17.6) | **4.62 (24.6)** |
| 1990 | 3.74 (13.3) | **3.89 (14.8)** | 4.25 (19.0) | **4.65 (25.2)** |
| 2000 | 3.32 (10.0) | **4.13 (17.5)** | 4.19 (18.2) | **4.78 (27.5)** |
| 2010 | 3.50 (11.3) | **4.29 (19.6)** | 4.31 (19.9) | **4.87 (29.2)** |
| 2020 | 3.75 (13.4) | **4.36 (20.5)** | 4.22 (18.7) | **4.82 (28.2)** |

Durchgängig +0.15 bis +0.8 bits ≈ **4–8 zusätzliche „effektive" Nationen je Dekade** — mehr Vielfalt, ohne die Rangfolge der großen Motorsport-Nationen zu kippen.

## Auffälligste Werte vorher → nachher (DECADE-Pool | BLEND)

| Dekade | THA | USA | GBR | ITA |
|---|---|---|---|---|
| 1950 | 0.0042→0.0043 \| 0.0023→0.0032 | 0.0720→0.0788 \| 0.1642→0.1155 | 0.3305→**0.2381** \| 0.2304→0.1733 | 0.1144→0.1302 \| 0.1241→0.1171 |
| 1960 | 0→0.0019 \| 0→0.0020 | 0.1704→0.1526 \| 0.1849→0.1370 | 0.2444→0.2671 \| 0.1581→0.1691 | 0.1185→0.0879 \| 0.0987→0.0773 |
| 1970 | 0→0.0019 \| 0→0.0020 | 0.0677→0.0672 \| 0.1440→0.0925 | 0.1729→0.1629 \| 0.1178→0.1115 | 0.1278→0.0954 \| 0.0986→0.0783 |
| 1980 | 0→0.0019 \| 0→0.0020 | 0.0253→0.0348 \| 0.1456→0.0825 | 0.1392→0.1347 \| 0.1033→0.0995 | 0.2278→0.2128 \| 0.1547→0.1447 |
| 1990 | 0→0.0019 \| 0→0.0035 | 0.0149→0.0040 \| 0.1206→0.0583 | 0.0746→0.1280 \| 0.0697→0.0952 | 0.2239→0.2291 \| 0.1379→0.1452 |
| 2000 | 0→0.0019 \| 0.0020→0.0040 | 0→0.0068 \| 0.1112→0.0571 | 0.1704→0.1319 \| 0.1306→0.1039 | 0.1481→0.1022 \| 0.0985→0.0769 |
| 2010 | 0.0081→0.0062 \| 0.0065→0.0076 | 0→0.0039 \| 0.1182→0.0561 | 0.1613→0.1384 \| 0.1284→0.1082 | 0.0323→0.0372 \| 0.0381→0.0412 |
| 2020 | **0.0485→0.0194** \| **0.0261→0.0141** | 0.0194→0.0136 \| 0.1578→**0.0736** | 0.1748→0.1681 \| 0.1271→0.1226 | 0.0194→0.0408 \| 0.0336→0.0459 |

## Einordnung / Grenzfälle (Nutzer-Entscheid möglich)

- **THA 2020: 0.0485 → 0.0194.** Ziel „deutlich unter 0.02" ist knapp erreicht (−60 %). Härter ginge nur mit k≥6 — das würde aber ebenso legitime Ein-Fahrer-Nationen der 2020er (DEN/Magnussen, CHN/Zhou) unter den Floor drücken. Wer THA noch niedriger will: `K_SHRINK` im Skript hochdrehen, neu laufen lassen.
- **USA im BLEND halbiert** (z. B. 2020: 0.158→0.074): Potenz-Glättung + Europa-Tilt wirken beide gegen den Wikidata-USA-Berg (NASCAR-Breite + en-Wiki-Bias) — gewollt, ersetzt **nicht** das `dampUSA` der Junior-Welt (bleibt zusätzlich aktiv).
- **USA 1990 DECADE: 0.0149→0.0040.** Real: einziger US-F1-Fahrer der 90er war Michael Andretti (13 Starts) → Shrink greift korrekt. Wirkt im Spiel ggf. streng — bewusst datentreu gelassen.
- **ITA 2020: 0.019→0.041.** Steigt durch Tilt + Glättung, obwohl real nur Giovinazzi/Antonelli fuhren — passt zur gewünschten europäischen Spielwelt, ist aber eine bewusste Abweichung von der realen F1.
- **1960er-Floor-Kuriosum:** ESP/JPN u. a. liegen dort auf ε (real fast keine Fahrer) — korrekt, nur ungewohnt sichtbar, weil die Keys jetzt in jeder Dekade vollständig sind (56 je Dekade).
- Die Ziehungs-Funktionen (`pickNationByDecade`, `pickNationMotorsport`) brauchen **keine Code-Änderung** — nur Tabellen tauschen.
