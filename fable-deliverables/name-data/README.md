# Namens-Datenbasis (Paket A) — Build-Zeit-Quelle, KEIN Laufzeit-Code

Aggregat aus dem BigQuery-Namens-Datensatz (Drive-Ordner `1BXqtZZfJZhvGgwWtfO-aXXYAf_U0EMFV`,
Roh-CSVs: forenames.csv 226 MB / surnames.csv 381 MB — bleiben im Drive, NICHT ins Repo).

| Datei | Inhalt |
|---|---|
| `fore_agg.csv` | Top-400 männliche Vornamen je Land (`country,name,count`), aus 12,5 Mio. Zeilen |
| `sur_agg.csv` | Top-400 Nachnamen je Land (beide Geschlechter summiert), aus 21,1 Mio. Zeilen |
| `country_codes.csv` | ISO-2 → Ländername (105 Länder; es fehlen u.a. AU, NZ, TH, MC, VE, ZW) |
| `aggregate-names.js` | Streaming-Aggregator Roh-CSV → Aggregat (`node aggregate-names.js in.csv out.csv M|ALL topN`) |
| `curation-view.js` | Kurations-Ansicht: Top-N je Land mit 1–5-Bucket (`node curation-view.js fore_agg.csv 30 DE,GB`) |

Bekannte Daten-Macken (bei Nutzung filtern): weibliche Formen in `sur_agg` (PL -ska, CZ -ová,
RU -ова), Akzent-Duplikate (ES/PT), RU/IL teils nicht-lateinische Schrift, CN nur englische
Spitznamen, MA-Vornamen defekt kodiert, Expat-Rauschen (z.B. FI: Khan/Kumar). Datensatz ist
gegenwartslastig — keine Ära-Information.
