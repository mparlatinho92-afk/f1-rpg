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
Roh-CSVs: forenames.csv 226 MB / surnames.csv 381 MB — lokal unter `F1 RPG Namenslisten & Namensgeneratoren/`, gitignored, NICHT ins Repo).

| Datei | Inhalt |
|---|---|
| `fore_agg.csv` | Top-400 männliche Vornamen je Land (`country,name,count`), aus 12,5 Mio. Zeilen |
| `sur_agg.csv` | Top-400 Nachnamen je Land (beide Geschlechter summiert), aus 21,1 Mio. Zeilen |
| `country_codes.csv` | ISO-2 → Ländername (105 Länder; es fehlen u.a. AU, NZ, TH, MC, VE, ZW) |
| `w3_*.csv` + `nations-w3.js` | Welle 3 (ALB/GEO/AZE/TKM/NGR/GHA): Aggregate und Nationen-Konfiguration |
| `w4_*.csv` + `nations-w4.js` | Welle 4 (HKG/MAC/TPE/SGP/KAZ/BAN): Aggregate und Nationen-Konfiguration; Vorschau `namens-vorschau-w4.md` |
| `cn_*.csv` + `nations-cn.js` + `cn-hanzi-pinyin.json` | CHN tief aggregiert (6.000/3.000), Positiv-Prüfung, Schriftzeichen→Pinyin; Vorschau `namens-vorschau-chn.md`. ⚠ Rohnamen nie ausgeben (API-Inhaltsfilter) |
| `w5_*.csv` + `nations-w5.js` | Welle 5 (TUN/ALG/LBA/IRQ/JOR/LBN/BRN/KUW); `w5_fore_u_agg.csv` = Länder ohne Geschlechtsangabe; Vorschau `namens-vorschau-w5.md` |
| `gender-ref.js` → `w5_gender_ref.csv` | M/F je Vorname aus Ländern MIT Geschlechtsangabe — Filter für Länder, deren Rohdaten keins haben (`node gender-ref.js`) |
| `country-count.js` | Zeilen und Träger je Land in den Roh-CSVs — vor jeder neuen Welle prüfen, ob ein Land drin ist (`node country-count.js UA,BY,KZ`) |
| `aggregate-names.js` | Streaming-Aggregator Roh-CSV → Aggregat (`node aggregate-names.js in.csv out.csv M|ALL topN`) |
| `curation-view.js` | Kurations-Ansicht: Top-N je Land mit 1–5-Bucket (`node curation-view.js fore_agg.csv 30 DE,GB`) |
| `extract-tails.js` | Raritäten-Schwänze aus den Aggregaten ziehen (Filter + Regions-Routing) → `name-tails.out.js` + Review |
| `curate-tails.js` | Dokumentierter Kurationspass (drop/move/rename, Akzente) → `name-tails.final.js` (steckt in `../paketA-name-pools.js`) |

Reproduktion der Tails: `node extract-tails.js && node curate-tails.js` (aus diesem Ordner).

Bekannte Daten-Macken (bei Nutzung filtern): weibliche Formen in `sur_agg` (PL -ska, CZ -ová,
RU -ова), Akzent-Duplikate (ES/PT), RU/IL teils nicht-lateinische Schrift, CN nur englische
Spitznamen, MA-Vornamen defekt kodiert, Expat-Rauschen (z.B. FI: Khan/Kumar). Datensatz ist
gegenwartslastig — keine Ära-Information.
**SI ist kosovo-albanisch verseucht** (03.10.2026): Nachnamen Rang 1–19 alle albanisch (Gashi 4760,
Krasniqi 3962 …), erst Rang 20 Novak 555; Vornamen gemischt (Egzon, Valon, Endrit in den Top 20).
Für SLO zwingend per Route/Ban trennen — der abgetrennte Teil taugt als Zusatzquelle für ALB.
LT enthält Platzhalter-Müll als Nachnamen (Nesvarbu = „egal", As, Ka, Ma, St, Ra). LV fehlt ganz.
AL, AZ, GE, TM, NG, GH: seit 03.10.2026 in `w3_fore_agg.csv` / `w3_fore_f_agg.csv` (weiblich) / `w3_sur_agg.csv`, Konfiguration `nations-w3.js`.
Nicht im Datensatz: KG, UZ, TJ, AM, BA, MK, ME, VN, LV.
Zählung 03.10.2026 gegen die Roh-CSVs (alle Länder mit Rückfall-Pool): `country_codes.csv` ist vollständig — was dort fehlt,
fehlt auch roh (zusätzlich zu oben: UA, BY, SK, PK, LK, NP, KE, SN, CI, MZ, CU, DO, PY, SM, LI, AD). Vorhanden, Träger Vor-/Nachname:
SA 26,2/26,5 Mio · IQ 15,6/15,7 · DZ 10,4/10,2 · TN 5,8/5,7 · LY 3,6/3,7 · BD 3,3/3,5 · KW 3,1/3,1 · KZ 3,0/2,8 · JO 2,8/2,8 ·
BO 2,7/2,4 · SG 2,6/2,6 · HK 2,5/2,7 · LB 1,7/1,6 · GT 1,4/1,4 · CR 1,3/1,2 · PA 1,3/1,3 · BH 1,2/1,2 · PH 0,68/0,72 ·
TW 0,52/0,63 · MO 0,31/0,35 · AO 0,28/0,38 · EC 0,26/0,24 · LU 0,16/0,13 · PR 0,11/0,11 · MT 0,10/0,09 · IS 0,025/0,023.
⚠ TW/MO: Vornamen extrem zersplittert (Spitze 1.588 bzw. 904 Träger), Nachnamen dagegen konzentriert (139.759 / 38.880).
