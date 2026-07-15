# Namens-Kapazität & Speicher-Analyse — Bauplan (Stand 2026-07-13)

**Zweck:** Persistierte Erkenntnisse der Analyse-Session vom 2026-07-13 (Namens-Pool
über Jahrhunderte + Speicher-Architektur der Junior-Welt). Damit künftige Sessions
das Wissen aus dem Projekt-Ordner ziehen, statt es aus Kontext neu abzuleiten.

Quelle: kompletter Session-Mitschnitt (ursprünglich Root-`.txt`, Big-Data lokal in
`fable-deliverables/name-data/F1 RPG Namenslisten & Namensgeneratoren/`,
per `.gitignore` vom Repo ausgeschlossen).

Verwandte Memos: `project_name_pool_deepening`, `feedback_name_data_sources`,
`project_fable_paketA_name_pools`, `project_storage_roadmap`, `project_junior_world`.

---

## Dateien in diesem Ordner

| Datei | Inhalt |
|---|---|
| `coverage-report.md` | Spiel vs. lokale Quelle (Top-400) je Nation, Vor-/Nachnamen getrennt, Null-Prüfung |
| `raw-name-counts.md` | Echte Roh-Distinct-Zahlen pro Land (≥50/≥100-Träger), Vollname-Kombinationsraum, 66 Nicht-Spiel-Länder |
| `capacity-and-compression.md` | Kapazitäts-Szenarien (Top-400 vs 2000), Renn-Pyramide-Bedarf, Kompression bei Bevölkerungs-Häufigkeit, Codec-Vergleich |
| `storage-seed-regen-roadmap.md` | Junior-Welt-Speicher: Spine/Filler-Trennung, Speicher↔RAM-Spektrum, Determinismus-Mechanik, Umsetzungs-Fahrplan |

---

## Kernbefund in einem Satz

Nach der v4-Vertiefung (v0.9.14.71, 600 Vor-/1500 Nachnamen) sind **die großen/mittleren
Nationen 100-fach über-versorgt**; der echte Engpass ist **nicht der Namensspeicher (~3 %
der Daten), sondern die Renn-Detaildaten der Junior-Pyramide (~56 MB/Jahrhundert)** — lösbar
per **Seed-Regeneration (RAM statt Speicher)**.

---

## Der Bauplan (4 Teile, wie in der Session erarbeitet)

### 1. Bedarf — die ganze Renn-Pyramide
91 Serien (F1/F2/F3 + 30× F4 + 8× Formula Regional + 50× Kart) = **~2.870 Sitze gleichzeitig**
→ bei Ø 6 J im System **~480 neue Fahrer/Jahr → ~48.000/Jahrhundert** global.
Pro Nation: FRA (~8 %) ≈ 230 gleichzeitig, ~3.840/Jh. Kleine Nation (~0,5 %) ≈ 14 gleichzeitig.

**Verdikt:** Große/mittlere Nationen sind massiv über-versorgt (FRA: 135 Mio Kombis vs.
3.840/Jh). Weiter breit vertiefen bringt **nichts**. Unterversorgt sind nur **~10 Nationen**:
die 6 Null-Nationen (AUS/NZL/VEN/ZIM/MON/THA) + KOR, EST, INA + die Vornamen-Lücken TUR/MAR.
Details in `raw-name-counts.md`.

### 2. Kompressibilität
Nicht die Namens-DB, sondern die **im Spielstand vergebenen Fahrernamen** bei realer
Bevölkerungs-Häufigkeit. Ergebnis: **Vollnamen kollidieren fast nie** (200k Fahrer → 98 %
einzigartig). Die früher berechneten „Kollisionen über Jahrhunderte" waren **reines Artefakt
der Pool-Kappung**. Ziel-Kriterium ist also nicht „mehr Namen", sondern
**Komponenten-Häufigkeit = Bevölkerung**. Kompression: gzip ~45 %, dict+gzip bis 10 % bei
großer Skala. Details in `capacity-and-compression.md`.

### 3. Ethnische Komponente (kein Muss)
Tiefe fördert Einwanderungsnamen zutage (FR „Smith"/„Chou"). Exakter Native-Anteil bräuchte
Namens-Ethnie-Klassifikation (out of scope). Proxy: `banLast`-Regexe. Bewusst zurückgestellt.

### 4. Quellen für kleine Nationen — **Bevölkerungs-Querschnitt, NICHT Fahrernamen**
Wichtige Nutzer-Korrektur: **echte Fahrernamen sind verzerrt** (zu viele Senna/Rottengatter,
weil dokumentierte Fahrer überrepräsentiert). Der Wikidata-Namen-Vorschlag wurde **verworfen**.
Für die Null-Nationen sind **statistische/amtliche Bevölkerungsquellen** der richtige Weg
(vgl. `feedback_name_data_sources`: Amateur-/Historik-Fußball statt Nationalteams → Ethnien-Falle).

---

## Empfohlene Bau-Reihenfolge (noch NICHT gebaut)

1. **Ziel-Nationen fixieren** — die ~10 unterversorgten (Rest ist fertig).
2. **Bevölkerungsquellen** für die 6 Null-Nationen + Vornamen-Lücken (TUR/MAR/KOR/EST/INA).
3. **Ära-Split-Aufräumen** im selben Rebuild — behalten: **GER/GBR/USA/FRA/ITA**, Rest flach.
   (Split lohnt erst, wenn die Namensmengen feststehen — deshalb NACH Schritt 1/2.)
4. **Erstauswahl neue Nationen** separat: 🇸🇦 SA / 🇦🇪 AE / 🇶🇦 QA / 🇨🇱 CL / 🇵🇪 PE
   (ausdrücklich nur Erstauswahl, nicht final).

## Ära-Split — Behalten-Set (Nutzer-bestätigt)
Nativer Vornamen-Trendwandel ist nur bei wenigen wirklich auffällig:
- **DE** stark (Karl-Heinz/Horst/Jürgen → Leon/Luca/Finn/Noah)
- **GB/US** moderat-stark (Nigel/Graham/Derek → Jack/Harry/Oliver — mid-century datiert hart)
- **FR** moderat (Jean/Louis/Guy → Hugo/Léo/Lucas)
- **IT** mild — alles andere: flach reicht.

**Doppelnutzen der Flachlegung:** Der Split macht die `early`-Ära dünn (nur ~10–18 kuratierte
Namen) — ein 1955er-Fahrer aus z. B. BEL/COL schöpft aus zu wenig. Flach = voller tiefer Pool
in allen Ären, milder Anachronismus fällt bei diesen Nationen nicht auf (ihre Namen datieren kaum).
Umsetzung: `ERA_SPLIT_KEEP`-Set in `build-names-v3.js`, curated-base bleibt unangetastet.

## Der Kernhebel (Speicher): Seed-Regeneration
„RAM statt Speicher" — alles, was deterministische Funktion gespeicherter Anker ist, wird beim
Ansehen in RAM neu erzeugt statt persistiert. Junior-Pyramide über 5 Jh: **~279 MB → ~5 MB**.
Vollständiger Fahrplan in `storage-seed-regen-roadmap.md`.
