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

> ### ⚠️ KORREKTUR (später in derselben Session) — diese Zahl ist zu hoch
> Sie unterstellt, dass **jeder Sitz** neue Fahrer erzeugt (Sitze ÷ Verweildauer). In einem
> echten Trichter mit **Beförderung** entstehen neue Fahrer aber **nur beim Eintritt**:
> F3 und F1 erzeugen **null** frische Fahrer, die kommen alle von unten. **Siehe §7.**
> Die Tabellen in §2/§4 bleiben gültig (sie sind Verhältnisse), aber die **absoluten**
> Fahrerzahlen und Dup-Zahlen sind mit dem Faktor aus §7 zu skalieren.

**Nationen-Anteile:** aus `MOTORSPORT_NATION_BLEND[2020]` — **nicht** `DECADE_NATION_POOLS`.
Die Junior-Welt zieht via `pickNationMotorsport` aus dem Blend, das ist also die richtige
Verteilung für Junior-Bedarf. (Fallstrick: die beiden Konstanten liegen 38 Zeilen auseinander,
~L4839 vs. ~L4877 — ein großzügiges Slice erwischt die falsche. Der reine F1-Pool ist deutlich
konzentrierter: GBR 16,81 % statt 12,26 %, MON 2,48 %.)

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

Vollständige 51-Nationen-Tabelle: `cd scripts && node nation-demand.js 11372 500 6` (s. §6).

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

**→ Alle Skripte liegen lauffähig in `scripts/` — dort laufen lassen, nicht neu ableiten.
Befehle + Details: `scripts/README.md`.**

```
cd scripts && node nation-demand.js          # Default: 648 Sitze (entschiedene Linie, §7)
cd scripts && node nation-demand.js 11372 500 6   # Gegenprobe: Population-überall
```

Die Bevölkerungs-Baseline (`pop-sur.json` / `pop-fore.json`, 18 KB) ist **eingecheckt** —
sie spart ~6 min Streaming über 608 MB Roh-CSV. Die Roh-CSVs selbst liegen gitignored in
`fable-deliverables/name-data/F1 RPG Namenslisten & Namensgeneratoren/`
(`surnames.csv` 382 MB, `forenames.csv` 226 MB) und werden nur gebraucht, wenn die Baseline
oder die eff(K)-Kurven (`topk.js`) neu erzeugt werden müssen.
**Fallstrick:** Wer nur `NAME_POOLS_BY_NATION` zählt, sieht ~490 Nachnamen und hält v4 für
nicht gebaut. Die Masse liegt in **`NAME_TAILS_BY_NATION`** und wird erst zur Laufzeit von
`ensureNamePoolsMerged()` (index.html ~L4991) mit **Gewicht 1** eingemischt.

## 7. Der Rechenfehler + die Architektur-Entscheidung (Session-Ende 2026-07-16)

### Der Trichter ändert die Größenordnung
Neue Fahrer entstehen **nur beim Eintritt**, nicht pro Sitz. Mit Beförderung
(50 %-Annahme) und der **Nutzer-Entscheidung, wo die Population endet**:

**Population:** F1, F2, F3, **F4 (~15 Serien)**, **Kart-WM/EM** (Handvoll, überlappende
Felder). **Verteilung** (nie simuliert, nur eine Rate): die unübersichtliche Kart-Masse.

| Ebene | Sitze | Verweild. | Eintritte/J | befördert | **frisch/J** |
|---|---:|---:|---:|---:|---:|
| F1 | 26 | 8,0 | 3 | 3 | **0** |
| F2 | 22 | 2,0 | 11 | 8 | 4 |
| F3 | 30 | 2,0 | 15 | 15 | **0** |
| F4 (15 Serien) | 420 | 1,5 | 280 | 25 | **255** |
| Kart-WM/EM | 150 | 3,0 | 50 | 0 | 50 |

**→ 648 sichtbare Sitze · 309 frisch/Jahr · 154.250 Fahrer / 5 Jh** (statt 947.667).

**Struktureller Fund:** F4 braucht 280 Neuzugänge/Jahr, die Kart-Elite liefert nur ~25 →
**~91 % der F4-Einsteiger kommen frisch aus der unsichtbaren Masse**. Das Elitefeld ist
Faktor ~3 zu klein für 15 F4-Serien — passt zur Realität (nationale F4 wird von *nationalem*
Kartsport gespeist, nicht von der CIK-FIA-Elite). **Die Zahl hängt an der 50-%-Quote und ist
der wackeligste Wert im Modell** → Paket H soll sie ersetzen.

### Folge: Namens-Vertiefung ist NICHT erzwungen
| | Population überall | Entschiedene Linie |
|---|---:|---:|
| GBR gleichzeitig | 1.394 | **79** |
| GBR Nachnamen-Auslastung | 319 % ⚠️ | **18 %** ✅ |
| `names.js` | ~1,8 MB nötig | **747 KB reichen** |

Der **Dedup-Engpass ist weg**. `data/names.js` bleibt unangetastet, der `TOP_N`-Neulauf
von `aggregate-names.js` wurde **nicht** ausgeführt.

### ABER: das ist eine Geschmacks-, keine Kapazitätsfrage
**Der Nutzer hat ausdrücklich offengelassen, die Vielfalt doch zu wollen** („vielleicht
brauche ich die Namensvielfalt doch"). Was bleibt, ist nämlich der **Duplikat-Faktor**:
GBR produziert **6,1× mehr gleiche Vollnamen als die echte Bevölkerung**. Dieser Faktor ist
**skalen-invariant** — er hängt nur an der Pool-Konzentration, nicht an der Fahrerzahl
(beide gehen mit D²). Die Trichtergröße entscheidet nur, *ob es auffällt*:
- 30-Jahre-Save: ~15 Doppelnamen unter ~1.100 Briten → verschmerzbar.
- 5-Jahrhunderte-Save: **22 % aller Briten** teilen sich einen Vollnamen.

### Rezept, falls die Vertiefung doch kommt (Reihenfolge zwingend)
1. **Blocker zuerst:** `sur_agg.csv` / `fore_agg.csv` sind auf **exakt 1500/600 pro Land
   vorgeschnitten** (GB Rang 1500 = „Holman", 986 Träger — weit über der Müllgrenze).
   **`CLASSES` hochziehen bewirkt allein NICHTS.** Erst:
   ```
   node aggregate-names.js ".../forenames.csv" fore_agg.csv M   6000
   node aggregate-names.js ".../surnames.csv"  sur_agg.csv  ALL 6000
   ```
2. **Cap-Formel** (ersetzt big/mid/small in `build-names-v3.js`):
   `cap = K, sodass eff(TopK) ≥ min(3 × gleichzeitige_Fahrer, eff_Bevölkerung)`
   — Bevölkerungs-Deckel erhält die natürlichen Duplikate und verhindert
   Transliterationsmüll bei JPN/KOR/EST. Mini-Nationen: Floor ~70–200 (Überraschung).
   eff(K)-Kurven: `scripts/topk.js`.
3. **Erst dann** `usedLast`-Dedup entschärfen (§7) — vorher maskiert er die Flachheit;
   nimmt man ihn früher raus, gibt es Smith/Smith/Smith.
4. Kosten bei voller Formel: 50.645 → 124.592 Namen, `names.js` → ~1,8 MB
   (Monolith ~5,5 → ~6,5 MB).

**Reproduktion aller Zahlen:** `scripts/` (Skripte + Bevölkerungs-Baseline eingecheckt,
`node nation-demand.js`). **Fluss-Parameter:** `../../paketH-pyramide/BRIEF.md`.

## 8. Offene Kollision mit dem Ziel-Kriterium

`_makeJuniorDriver` (index.html ~L15720) dedupliziert aktiv gegen `usedNames` **und
`usedLast`** — es **verhindert** also genau die bevölkerungsnatürlichen Duplikate, die laut
Kriterium erwünscht sind. Bei 548 gleichzeitigen Australiern aus 129 effektiven Nachnamen
läuft dieser Dedup ohnehin leer. **Muss mitgeklärt werden, bevor die Caps steigen** —
sonst arbeiten Pool-Tiefe und Laufzeit-Dedup gegeneinander.

## 9. Blob + gzip: die Vertiefung wird praktisch gratis (gemessen 2026-07-16)

**Kopfzahl: der VERTIEFTE Pool als gzip+base64-Blob kostet ~0,73 MB im Monolithen — der
HEUTIGE, unvertiefte Pool kostet 747 KB.** Gleiche Dateigröße, **2,46× so viele Namen**.
Damit kippt die Kosten-Nutzen-Rechnung aus §7: die Vertiefung ist nicht mehr „1,8 MB Bloat
gegen 6,1× Duplikate", sondern „gleiche Größe wie heute, mehr Namen".

### Gemessen (nicht geschätzt)

| Variante | Datei im Monolithen | RAM |
|---|---:|---:|
| **heute** (JS-Literal `names.js`) | 747 KB | **8,2 MB** |
| Blob roh (kein JS-Syntax) | 497 KB | — |
| Blob gzip | 226 KB | — |
| **Blob gzip+base64** (inline-fähig) | **302 KB** | ~1 MB als String |
| vertieft, JS-Literal | ~1,8 MB | ~20 MB |
| **vertieft, gzip+base64** | **~0,73 MB** | ~2,5 MB + materialisierte Nationen |

Messung: `node --expose-gc`, heapUsed-Delta um Parse + `ensureNamePoolsMerged`-Nachbildung.

### Warum der Overhead so groß ist
747 KB Quelltext → **8,2 MB RAM**, Faktor **11**. Pro `[name, gewicht]`-Paar **130 Byte** bei
~9 Byte Nutzdaten. Fast reiner V8-Objekt-Overhead: jeder Name ein String-Objekt mit Header,
jedes Paar ein Array mit Header. **Die Daten sind winzig, die Verpackung ist alles.**

### Die begriffliche Schärfung
Im Monolithen heißt „noch nicht abgerufen" **nicht** „noch nicht geladen" — die Namen stehen
in der Datei, die Datei ist geparst. Die Frage ist nur, ob sie als teure JS-Objekte oder als
billiger String dastehen. Der richtige Begriff ist **„noch nicht materialisiert"**.

### Der Bauplan (Aufhänger existiert schon)
- **`ensureNamePoolsMerged()`** (index.html ~L4991) ist **bereits** ein Lazy-Init mit
  `_namePoolsMerged`-Flag → exakt der Punkt, an dem der Blob-Decode hängt.
- **`DecompressionStream` ist browser-nativ**, braucht **kein WASM**. §5 von
  `capacity-and-compression.md` schließt brotli/zstd zu Recht aus — aber das gilt für
  *Kompression*. gzip-**Decode** ist nativ, und `_gzipEncode` nutzt `CompressionStream`
  bereits. **CLAUDE.md-Standalone-Regel bleibt unverletzt.**
- **Fallstrick:** `DecompressionStream` ist **async**, `pickPooledName` ist **synchron**.
  → Einmal beim Boot async entpacken → Blob-String im RAM → daraus **synchron** pro Nation
  materialisieren (Lazy-Hook s.o.).
- Blob-Format (Vorschlag, in der Messung verwendet):
  `NAT|regionIdx|regionW|last:w,last:w|first...` je Zeile, Ära-Fenster mit `~` getrennt,
  Tails als eigene `T`-Zeilen.

### Zwei ehrliche Einschränkungen
1. **Der RAM-Gewinn erodiert.** Über 5 Jahrhunderte wird jede der 51 Nationen irgendwann
   gezogen → materialisiert → wieder ~20 MB. Lazy hilft beim Start und in kurzen Spielen.
   Dauerhaft niedrig nur ohne Cache (pro Ziehung in den Blob indizieren = CPU statt RAM)
   oder mit LRU.
2. **20 MB RAM sind kein Problem.** Der Monolith ist selbst 5,5 MB; die Junior-Welt kämpfte
   vor der Seed-Regeneration mit 279 MB. **RAM ist das schwächere Argument — der starke ist
   die Dateigröße**, weil sie bei jedem Laden anfällt und dauerhaft ist.

### Nicht verwechseln
Das betrifft den **Pool** (Wörterbuch möglicher Namen) — muss immer da sein. Die **vergebenen**
Namen im Spielstand sind eine andere Sache und schon gelöst: Seed-Regeneration,
`capacity-and-compression.md` §5 ② („Fahrername = deterministische Funktion der ID → 0 Bytes").

### Konsequenz für das Rezept in §7
Wenn die Vertiefung kommt, gehört **Blob+gzip als Schritt 0** davor — dann kostet Schritt 4
(„names.js → ~1,8 MB, Monolith ~6,5 MB") nichts mehr, sondern landet bei ~0,73 MB und der
Monolith bleibt unter seinem heutigen Stand. Reihenfolge: Blob-Umbau → `TOP_N`-Neulauf →
Cap-Formel → `usedLast` entschärfen.

## 10. Spielstand + die verworfene Seed-Regeneration für Namen (2026-07-17)

### Die drei Kosten sauber getrennt (werden ständig verwechselt)
| | Kostet? | Maßnahme |
|---|---|---|
| **Monolith-Dateigröße** | **JA** — bei jedem Laden, dauerhaft | gzip-Blob (§9) |
| **RAM** | nein — 8→20 MB tut keinem weh | **nichts tun** |
| **Spielstand** | nein — s. u. | **nichts tun** |

### gzip JA, lazy NEIN
Der CPU-Preis des Blobs fällt **einmal beim Boot** an (ein `DecompressionStream`-Durchlauf,
Millisekunden), danach ist alles materialisiert wie heute. **Kleine Datei UND schnelle
Ziehungen — kein Entweder-oder.** Lazy-Materialisierung kauft *nur* RAM und kostet CPU pro
Ziehung. Da RAM nicht das Problem ist: **nicht lazy bauen.** (§9 beschreibt den Lazy-Hook —
er wird für den Blob-Decode gebraucht, nicht für Lazyness pro Nation.)

### Unbenutzte Namen können nicht im Save landen
**Strukturell unmöglich.** Das Wörterbuch lebt im **Monolithen**, nicht im Save. Ein Name
kommt erst dann in den Spielstand, wenn ein Fahrer ihn trägt — „ungenutzt" und „im Save"
schließen sich per Konstruktion aus. Die Sorge ist unbegründet.

### Was tatsächlich im Save liegt — und warum es egal ist
Namen **existierender** Fahrer, konkret in `heavy.drivers` je Saison
(`index.html:15960`: `{ id, histId, name, nation, number, team, pace, potential, … }`).
Bei 648 Sitzen × 500 Jahren ≈ **324.000 Fahrer-Saison-Datensätze** → grob 6,5 MB roh nur für
Namen → **~3 MB gzip**.

Unkritisch, weil das **schwere** Daten sind: IndexedDB via `idbJDetailPut` + `_gzipEncode`,
Quota = Anteil der Platte (hunderte MB–GB). Das **8-MB-localStorage-Limit betrifft nur die
leichten Daten** (s. `capacity-and-compression.md` §5).

### Seed-Regeneration für Namen: gilt nur für FILLER — und kollidiert mit der Vertiefung

`capacity-and-compression.md` §5 ② formuliert den Hebel **pauschal**: *„Fahrername =
deterministische Funktion der ID → nur ID speichern"*. **So pauschal ist er falsch** — und
`storage-seed-regen-roadmap.md` weiß das bereits besser (**Spine/Filler-Grenzregel**):

> Fahrer, die der Spine kennt (Champion, Kletterer, allTimeStats-Eintrag) behalten ihre
> **persistierte Identität/Namen**; reine Filler werden aus dem Seed neu erzeugt (Name = f(id)).
> So bleibt der Meister von 2087 immer derselbe, aber das P14-Feld dahinter kostet nichts.

Das ist die **richtige** Auflösung: Notable-Namen persistiert = versionsstabil, Filler-Namen
regeneriert = dürfen driften. Die Roadmap benennt „**Identitäts-Drift** — jede künftige
Formel-Änderung ändert die historische Realität, `genVersion` mildert nur" bereits als eines
der drei Risiken von **Stufe 4 (Voll-Replay), die bewusst AUFGESCHOBEN ist**.

### Der neue Befund: Vertiefung IST ein Identitäts-Drift-Ereignis
Der Namens-**Pool** ist eine **veränderliche Datentabelle**. Eine Vertiefung (§7/§9)
verschiebt jede Ziehung → in Altsaves heißen alle **Filler** anders. Die Roadmap akzeptiert
Filler-Drift ausdrücklich, das ist also **kein Blocker** — aber es ist ein **Reihenfolge**-Problem:

- **Stufe-4-Trigger laut Roadmap:** „erst wenn die Welt real auf viele Serien wächst
  (Größenordnung **>~10–20**)".
- **Die entschiedene Linie (§7) hat 15 F4-Serien + Kart-WM/EM** → **sie überschreitet den
  Trigger genau.** Stufe 4 wird also relevant, sobald die Pyramide gebaut wird.

**→ Konsequenz: die Vertiefung VOR Stufe 4 ziehen.** Dann passiert der Filler-Drift **einmal,
früh**, bevor lange Saves existieren. Umgekehrt (erst Stufe 4, dann vertiefen) würde man
gewachsene Spielstände nachträglich umbenennen — technisch erlaubt, aber unnötig ärgerlich.
Ein zweiter Grund für dieselbe Reihenfolge: Stufe 4 nennt als Risiko (1) die **mit der F1
geteilte Namens-/Nations-Kette** (`pickPooledName`/`pickNameRegion`/`weightedPick`) — die will
man nicht zweimal anfassen.

### Was NICHT geht
Namen **aller** Fahrer regenerieren (inkl. Notable). Dann würde der Meister von 2087 nach
jedem Pool-Update anders heißen. Genau davor schützt die Spine/Filler-Grenzregel — sie darf
beim Bau nicht aufgeweicht werden. **`capacity-and-compression.md` §5 ② ist entsprechend
präzisiert.**
