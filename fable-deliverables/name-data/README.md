# Namens-Datenbasis (Paket A) — Build-Zeit-Quelle, KEIN Laufzeit-Code

**v3 (aktuell):** `data/names.js` wird komplett von **`build-names-v3.js`** generiert
(volle Top-400-Datenlast, echte Count-Gewichte w=round(100·(c/max)^0.6), ~20.500 Namen,
304 KB). Eingefrorene Kurationsbasis: `curated-base-v2.js` (NIE data/names.js als
Build-Input lesen — Idempotenz!). Analyse: `analyze-weights.js`, Validierung:
`validate-names-v3.js` (repliziert Laufzeit-Pick-Mathematik exakt), Review:
`names-v3-review.txt`. `../paketA-name-pools.js` ist die veraltete v2-Kopie.
Die v2-Tail-Skripte unten bleiben als Dokumentation der Kurationsentscheidungen
(Bans/OPS sind nach build-names-v3.js portiert).

Aggregat aus dem BigQuery-Namens-Datensatz (Drive-Ordner `1BXqtZZfJZhvGgwWtfO-aXXYAf_U0EMFV`,
Roh-CSVs: forenames.csv 226 MB / surnames.csv 381 MB — bleiben im Drive, NICHT ins Repo).

| Datei | Inhalt |
|---|---|
| `fore_agg.csv` | Top-400 männliche Vornamen je Land (`country,name,count`), aus 12,5 Mio. Zeilen |
| `sur_agg.csv` | Top-400 Nachnamen je Land (beide Geschlechter summiert), aus 21,1 Mio. Zeilen |
| `country_codes.csv` | ISO-2 → Ländername (105 Länder; es fehlen u.a. AU, NZ, TH, MC, VE, ZW) |
| `aggregate-names.js` | Streaming-Aggregator Roh-CSV → Aggregat (`node aggregate-names.js in.csv out.csv M|ALL topN`) |
| `curation-view.js` | Kurations-Ansicht: Top-N je Land mit 1–5-Bucket (`node curation-view.js fore_agg.csv 30 DE,GB`) |
| `extract-tails.js` | Raritäten-Schwänze aus den Aggregaten ziehen (Filter + Regions-Routing) → `name-tails.out.js` + Review |
| `curate-tails.js` | Dokumentierter Kurationspass (drop/move/rename, Akzente) → `name-tails.final.js` (steckt in `../paketA-name-pools.js`) |

Reproduktion der Tails: `node extract-tails.js && node curate-tails.js` (aus diesem Ordner).

Bekannte Daten-Macken (bei Nutzung filtern): weibliche Formen in `sur_agg` (PL -ska, CZ -ová,
RU -ова), Akzent-Duplikate (ES/PT), RU/IL teils nicht-lateinische Schrift, CN nur englische
Spitznamen, MA-Vornamen defekt kodiert, Expat-Rauschen (z.B. FI: Khan/Kumar). Datensatz ist
gegenwartslastig — keine Ära-Information.
