# Paket I — Skripte (Reproduktion)

Reihenfolge (alles aus diesem Ordner, Node ≥ 18, keine Dependencies):

```
sh fetch-raw.sh ./raw            # 1. Rohquellen laden (~50 MB, einmalig; NICHT einchecken)
node parse-ger-decades.js ./raw  # 2. GER-Dekaden-HTML → ../data/ger-decade-ranks.json
node build-cohorts.js ./raw      # 3. Roh → ../data/cohorts-{USA,FRA,GBR,ITA}.json (5J-Kohorten)
node zipf-calibrate.js           # 4. D3: s je Nation/Kohorte → ../data/zipf-fit.json
node analyze-turnover.js         # 5. D1: Umschlagsrate + Gauß-Fit-Güte (nur Konsole)
node derive-era-first-names.js   # 6. D2: ../era-first-names.js + fit-report + immigrant-share
node vorher-eff.js               # 7. D4-Baseline: eff-Größen des HEUTIGEN Pools (liest data/names.js, nur lesend)
```

Schritte 4–7 laufen **ohne** Rohdaten — die eingecheckten `../data/cohorts-*.json`
+ Rang-Dateien reichen. Schritte 1–3 nur nötig, wenn die Quellen aktualisiert werden.

| Datei in ../data/ | Inhalt |
|---|---|
| `cohorts-{USA,FRA,GBR,ITA}.json` | 5-Jahres-Geburtskohorten, männlich, Counts + totals |
| `ger-decade-ranks.json` | GER Jungennamen-Ränge je Dekade (Rang-only, beliebte-vornamen.de) |
| `ita-decade-ranks.json` | ITA Dekaden-Ränge 1900–1990 — **kuratierte Schätzung**, s. `_meta` |
| `gbr-rankings-1904-1994.csv` | ONS E&W Top-100-Ränge, dekadisch (via ukbabynames) |
| `zipf-fit.json` | D3: Zipf-s je Nation/Kohorte (Drift-Beleg) |
| `fit-report.json` | Fit-Güte, Poolgrößen, eff- und Top-5-Proben (Basis von REPORT.md) |
| `immigrant-cohort-share.json` | Anteil Einwanderungsnamen je Kohorte + Liste im Pool (→ Regionen-Paket J) |
