# Nationen-Bedarf bei 300 Kartserien × 5 Jahrhunderte (Stand 2026-07-16)

**Frage:** Wie viel Namensmaterial braucht jede Nation, wenn die Renn-Pyramide auf
**300 Kartserien** wächst und ein Spielstand **5 Jahrhunderte** läuft? Vergleich
Kaggle-Rohquelle ↔ Ist-Zustand ↔ Ziel.

**Methodik-Wechsel ggü. `capacity-and-compression.md`:** Dort wurde mit *Rohzahlen*
(Pool-Länge) gerechnet. Das ist falsch, sobald die Gewichte schief sind. Hier zählt die
**effektive Poolgröße** (Simpson, `eff = 1/Σp²` = `Σcount² → sum²/sumsq`). Beispiel GBR:
1.322 Nachnamen verhalten sich wie **437**, weil Smith (w=100) gegen ~830 weight-1-Tails steht.

**Nutzer-Kriterium (verbindlich):** *bevölkerungsnatürliche Duplikate gehören in die
Gewichtung hinein*. Ziel ist **nicht** „null Kollisionen", sondern
**`eff_Pool ≈ eff_Bevölkerung`**. Ein echter Ort produziert Doppelnamen — der Pool soll
genau so viele produzieren, nicht weniger und nicht mehr.

---

## 1. Der Bedarf

| Serie | Rechnung | Sitze |
|---|---|---:|
| F1 / F2 / F3 | 20 + 22 + 30 | 72 |
| F4 | 30 Meisterschaften × 30 | 900 |
| Formula Regional | 8 × 25 | 200 |
| **Kart** | **300 Serien × 34** | **10.200** |
| **gleichzeitig gesamt** | | **11.372** |

Ø 6 Jahre im System → **1.895 neue Fahrer/Jahr** → **947.667 Fahrer / 5 Jh**.
(Zum Vergleich: das alte 50-Kartserien-Szenario ergab 2.870 Sitze / 48.000 pro Jh — der
neue Bedarf ist **~20×** so groß.)

Anteile aus `DECADE_NATION_POOLS[2020]` (Code-Fallback für alle Zukunftsdekaden:
`if (!pool) pool = DECADE_NATION_POOLS[2020]`).

## 2. Ist-Zustand — der Pool bricht

Auslastung = gleichzeitige Fahrer der Nation ÷ effektiver Nachnamen-Pool.
**Über 100 % heißt: mehr gleichzeitige Fahrer als unterscheidbare Nachnamen.**
**20 von 51 Nationen liegen über 100 %.**

| Nation | Anteil | gleichz. | eff. Vorn. | eff. Nachn. | Auslastung | Dup ist / natürl. | Faktor |
|---|---:|---:|---:|---:|---:|---:|---:|
| MON | 1,54 % | 175 | 26 | 29 | **601 %** | 141.767 / — | keine Daten |
| THA | 1,41 % | 160 | 29 | 37 | **436 %** | 84.832 / — | keine Daten |
| AUS | 4,82 % | 548 | 39 | 129 | **425 %** | 207.415 / — | keine Daten |
| CHN | 1,49 % | 169 | 33 | 44 | **388 %** | 69.645 / 17.703 | 3,9× |
| GBR | 12,26 % | 1.394 | 98 | 437 | **319 %** | 158.459 / 25.845 | 6,1× |
| FRA | 9,62 % | 1.094 | 99 | 452 | **242 %** | 92.840 / 2.406 | 38,6× |
| ESP | 5,38 % | 612 | 134 | 265 | **231 %** | 36.714 / 14.707 | 2,5× |
| GER | 7,06 % | 803 | 90 | 434 | **185 %** | 57.324 / 9.512 | 6,0× |
| USA | 7,36 % | 837 | 134 | 454 | **184 %** | 40.047 / 5.685 | 7,0× |
| UAE/SAU/QAT | je 0,2 % | 23 | ~14 | 13 | ~175 % | ~10.000 / ~50 | **135–345×** |
| CAN | 3,24 % | 368 | 59 | 231 | 159 % | 34.266 / 1.652 | 20,7× |
| NED | 4,56 % | 519 | 107 | 338 | 153 % | 25.678 / 1.983 | 13,0× |
| NZL | 1,18 % | 134 | 32 | 96 | 140 % | 20.168 / — | keine Daten |
| ITA | 4,59 % | 522 | 101 | 492 | 106 % | 18.960 / 1.053 | 18,0× |

Vollständige 51-Nationen-Tabelle: Skripte in `scratchpad/master.js` (reproduzierbar, s. §6).

## 3. Der größte Befund: die datenlosen Nationen sind die schlimmsten

**AUS (4,82 %), MON (1,54 %), THA (1,41 %), NZL (1,18 %), VEN (0,39 %), ZIM (0,2 %)
= ~9,5 % des Feldes** haben im Kaggle-Datensatz **überhaupt keine Einträge** (wissensbasiert
handbefüllt: AUS 79 Vor-/173 Nachnamen, MON 29/33, THA 32/40).

Bei 300 Kartserien sind das **548 gleichzeitige Australier aus 129 effektiven Nachnamen**
(425 %) und **175 Monegassen aus 29** (601 %). **Kaggle kann das nicht lösen — kein Tiefer-Graben
in der Quelle hilft, die Länder sind nicht drin.** Das ist Priorität 1 und braucht die
Bevölkerungsquellen aus `feedback_name_data_sources` (Amateur-/Historik-Fußball etc.).

## 4. Datendecke: wie tief die Quelle je Nation überhaupt trägt

`eff Bev.` = effektive Größe der **echten** Verteilung (alle Namen ≥100 Träger).
`Cap nötig` = Top-K, bei dem `eff(TopK) ≥ 90 % · eff_Bev`. `>6000` = auch Top-6000 reicht nicht.
⚠ = **dünne Quellenabdeckung** (<0,5 Mio Träger) → `eff Bev.` ist ein **Datensatz-Artefakt,
keine Realität**.

| Nation | Träger | eff Bev. V/N | eff jetzt V/N | Cap N für 90 % | Lücke N |
|---|---:|---:|---:|---:|---:|
| SAU | 19,4 M | 289/239 | 15/13 | >6000 | 18,2× |
| ITA | 24,9 M | 112/8053 | 101/492 | >6000 | 16,4× |
| FRA | 8,4 M | 310/5562 | 99/452 | >6000 | 12,3× |
| QAT | 1,2 M | 152/151 | 13/13 | 1.829 | 11,3× |
| UAE | 3,8 M | 273/134 | 14/13 | 4.144 | 10,4× |
| RSA | 8,5 M | 791/2391 | 66/279 | >6000 | 8,6× |
| SUI ⚠ | 0,3 M | 270/733 | 50/110 | 1.283 | 6,7× |
| RUS | 5,0 M | 84/1999 | 85/325 | >6000 | 6,2× |
| MAS | 7,2 M | 262/904 | 79/168 | >6000 | 5,4× |
| NED | 2,1 M | 279/1689 | 107/338 | 5.959 | 5,0× |
| BEL | 0,8 M | 367/1781 | 40/379 | 3.044 | 4,7× |
| GBR | 7,4 M | 168/1553 | 98/437 | >6000 | 3,6× |
| GER | 2,2 M | 184/1282 | 90/434 | 5.385 | 3,0× |
| USA | 21,6 M | 320/1338 | 134/454 | >6000 | 2,9× |

**→ „Top-4000 statt Top-400" wäre für die großen Nationen immer noch zu wenig.**

### Die Gegenrichtung (Vorsicht!)
Einige Nationen sind im Pool **diverser als die Quelle**: KOR (eff Bev. **2** — Kim/Lee/Park),
EST (4), DEN (75), JPN (211), GRE (70), INA (42), HUN (131).
Nach dem Kriterium „= Bevölkerung" müssten die **Duplikate bekommen, nicht Vielfalt**.
**ABER:** alle diese Nationen sind ⚠ dünn abgedeckt (KOR 0,11 M Träger / 30 Nachnamen ≥100;
EST 4 Nachnamen). `eff Bev. = 2` für Korea ist **Quellenlücke, nicht Korea** (real eher ~10–15).
**Nicht auf diese Zahlen hin schrumpfen** — hier braucht es eine bessere Quelle, bevor
irgendwas passiert. Deckt sich mit dem bekannten Befund „datenlimitierte Nationen"
in `raw-name-counts.md`.

## 5. Vorschlag: bedarfsproportionaler Cap statt big/mid/small

Die drei Klassen (`CLASSES` in `build-names-v3.js`) sind zu grob — sie geben MON und GBR
dieselbe Größenordnung, obwohl der Bedarf um Faktor 8 auseinanderliegt.

**Formel:** `cap_N = K, sodass eff(TopK) ≥ min(3 × gleichzeitige_Fahrer, eff_Bevölkerung)`
— also Nachnamen-Auslastung ≤ 33 %, **gedeckelt durch die echte Datendecke** (sonst holt
man bei JPN/KOR/EST Transliterationsmüll; Regel aus `raw-name-counts.md`).
Der Bevölkerungs-Deckel sorgt automatisch dafür, dass natürliche Duplikate erhalten bleiben.

**Ergebnis:** 50.645 → **124.592 Namen** (×2,46), `names.js` 747 KB → **~1,8 MB**
(Monolith ~5,5 → ~6,5 MB). Mini-Nationen behalten dabei bewusst einen Floor (~70–200 Namen),
damit die Ziehung überraschend bleibt, auch wenn nur 3 Fahrer gebraucht werden.

**Voraussetzung — der eigentliche Blocker:** `sur_agg.csv` / `fore_agg.csv` sind bereits auf
**exakt 1500 / 600 pro Land vorgeschnitten** (GB Rang 1500 = „Holman", 986 Träger — weit über
der Müllgrenze). Caps hochziehen allein bewirkt **nichts**; zuerst muss `aggregate-names.js`
mit größerem `TOP_N` neu laufen.

## 6. Reproduktion

Roh-CSVs: `fable-deliverables/name-data/F1 RPG Namenslisten & Namensgeneratoren/`
(`surnames.csv` 382 MB, `forenames.csv` 226 MB, gitignored).

```
# Bevölkerungs-eff je Land (streamend, O(1) Speicher: nur n/sum/sumsq bei count>=100)
node pop-eff.js surnames.csv pop-sur.json ALL
node pop-eff.js forenames.csv pop-fore.json M
# Top-6000-Counts je Land für die eff(K)-Kurven
node topk.js surnames.csv top-sur.json ALL 6000
# Ist-Pools: names.js laden + ensureNamePoolsMerged() nachbilden (Tails w=1!), dann mix()/eff()
```
**Fallstrick:** Wer nur `NAME_POOLS_BY_NATION` zählt, sieht ~490 Nachnamen und hält v4 für
nicht gebaut. Die Masse liegt in **`NAME_TAILS_BY_NATION`** und wird erst zur Laufzeit von
`ensureNamePoolsMerged()` (index.html ~L4991) mit **Gewicht 1** eingemischt.

## 7. Offene Kollision mit dem Ziel-Kriterium

`_makeJuniorDriver` (index.html ~L15720) dedupliziert aktiv gegen `usedNames` **und
`usedLast`** — es **verhindert** also genau die bevölkerungsnatürlichen Duplikate, die laut
Kriterium erwünscht sind. Bei 548 gleichzeitigen Australiern aus 129 effektiven Nachnamen
läuft dieser Dedup ohnehin leer. **Muss mitgeklärt werden, bevor die Caps steigen** —
sonst arbeiten Pool-Tiefe und Laufzeit-Dedup gegeneinander.
