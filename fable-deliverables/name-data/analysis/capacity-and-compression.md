# Kapazitäts-Szenarien, Renn-Pyramide-Bedarf & Kompression

Alle Zahlen aus der Analyse-Session 2026-07-13. Frankreich als durchgerechnetes Beispiel
(echte Rohverteilung: 209.962 Vornamen / 730.549 Nachnamen distinct).

---

## 1. Kapazitäts-Tiers — Frankreich (Szenario: 140 gleichzeitig aktive Franzosen lokal)

Zipf-Fit (s≈0,469): 400. FR-Nachname hat noch **2.798 Träger** (Rang 1 „Martin" = 46.409) →
die 400er-Kappung schneidet **mitten im gut-belegten Bereich** ab. 2.000. hat ~1.316, 5.000. ~856
— alles plausible Namen, kein Müll. FR trägt locker Top-5000.

| Tier | Nachnamen | ① Auslastung | max. gleichzeitig bis „spürbar" | ② Vollname-Doppel/3 Jh | Jahre bis 1. Doppel | ③ Vornamen-Doppel (140) |
|------|----------:|:------------:|:-------------------------------:|:----------------------:|:-------------------:|:-----------------------:|
| aktuell (v.70) | 297 | 47 % ⚠️ | 119 | ~302 (1,0/J) | ~17 J | ~36 |
| Top-400 (voll) | 400 | 35 % ✅ | 160 | ~153 (0,5/J) | ~24 J | ~25 |
| Top-2000 | 2000 | 7 % ✅✅ | 800 | ~6 (0,02/J) | ~121 J | ~5 |

## 2. Junior-Szene FR (fordernder: 200 gleichzeitig − 25 % Ausländer = 150 FR, 3-J-Karrieren → 50 neu/J)
→ 5.000/Jh · 15.000/3 Jh · 25.000/5 Jh.

**① Gleichzeitige Nachnamen (Dedup-Engpass, Bedarf 150):**

| Pool | N | Auslastung |
|------|---:|:---:|
| aktuell (v.70) | 297 | 51 % ⚠️ schon im Standbild sichtbar |
| A 400/800 | 800 | 19 % ✅ |
| **B 600/1500** | 1500 | 10 % ✅ |
| C 2000/2000 | 2000 | 8 % ✅ |
| echt ≥100 | 26.424 | 1 % ✅ |

**② Gleiche Vollnamen kumuliert (erwartete Doppel):**

| Pool | 1 Jh | 3 Jh | 5 Jh |
|------|-----:|-----:|-----:|
| aktuell | 155 | 1.393 | 3.868 |
| A 400/800 | 39 | 352 | 977 |
| **B 600/1500** | 14 | 125 | 347 |
| C 2000/2000 | 3 | 28 | 78 |
| echt ≥100 | 0,1 | 0,8 | 2,3 |

→ **Variante B gewählt und in v0.9.14.71 gebaut** (600 Vor / 1500 Nach entkoppelt; tiefe
Nachnamen wo's zählt, moderate Vornamen weil Wiederholung realistisch). names.js 304→711 KB.

### Zielgrößen-Tradeoff (zur Doku)
| Variante | Vornamen | Nachnamen | names.js grob | Wirkung |
|----------|---------:|----------:|:-------------:|---------|
| A – konservativ | 400 | 800 | ~0,6 MB | löst Engpass, kaum Bloat |
| **B – ausgewogen ⭐** | 600 | 1500 | ~1,1 MB | viel Puffer, vertretbar |
| C – max | 2000 | 2000 | ~2,5 MB | „Jahrhunderte"-sicher, größter Bloat |

---

## 3. Bedarf — die ganze Renn-Pyramide (pro Jahrhundert)

| Serie | Sitze |
|-------|------:|
| F1 / F2 / F3 | 20 / 22 / 30 |
| F4 (30 Meisterschaften) | 900 |
| Formula Regional (8) | 200 |
| Kart (50 Meisterschaften) | 1.700 |
| **gleichzeitig gesamt** | **~2.870** |

Bei Ø 6 J im System → **~480 neue Fahrer/Jahr → ~48.000/Jahrhundert** global.
Pro Nation: FRA (~8 %) ≈ 230 gleichzeitig, ~3.840/Jh · kleine Nation (~0,5 %) ≈ 14, ~240/Jh.

**Verdikt:** große/mittlere Nationen 100-fach über-versorgt (FRA 135 Mio Kombis vs. 3.840/Jh).
Unterversorgt nur ~10 Nationen (6 Null + KOR/EST/INA + Vornamen-Lücken TUR/MAR).

---

## 4. Kompression — Fahrernamen im Spielstand bei echter FR-Bevölkerungs-Häufigkeit

Nicht die Namens-DB, sondern die **tatsächlich vergebenen** Fahrernamen (bei realer Häufigkeit gezogen).
`dict` = jeden Vor-/Nachnamen einmal + 2 Referenzen/Fahrer.

| Fahrer (D) | versch. V | versch. N | versch. Vollnamen | roh | gzip | dict | dict+gz |
|-----------:|----------:|----------:|------------------:|----:|-----:|-----:|--------:|
| 10.000 | 3.135 | 8.212 | 9.994 | 142 KB | 65 KB (46 %) | 85 % | 31 % |
| 50.000 | 10.238 | 31.823 | 49.737 | 710 KB | 323 KB (45 %) | 71 % | 23 % |
| 200.000 | 27.366 | 89.540 | 196.413 | 2,8 MB | 1,3 MB (45 %) | 59 % | 17 % |
| 1.000.000 | 77.526 | 245.028 | 940.893 | 14,2 MB | 6,4 MB (45 %) | 45 % | 10 % |

**Zentrale (überraschende) Erkenntnis:** Bei echter Bevölkerungs-Häufigkeit sind **Vollnamen
fast nie doppelt** — 200k Fahrer → 98 % einzigartig, 1 Mio → 94 %. Der Namensraum (730k N × 210k V)
ist so groß, dass „gleiche Häufigkeit wie in der Bevölkerung" praktisch heißt: **keine
Vollname-Wiederholung**. Die früher berechneten „Kollisionen über Jahrhunderte" waren **reines
Artefakt der Pool-Kappung**.

→ **Ziel-Kriterium:** nicht „mehr Namen ist besser", sondern **Komponenten-Häufigkeit = Bevölkerung**.
Ein realistischer Jahrhunderte-Spielstand (~150–240k Fahrer) → Namensdaten ~17–23 % von roh
(dict+gzip). **Namen sind im Spielstand kein Speicherproblem.**

---

## 5. Codec-Vergleich (Browser + Standalone-Monolith)

localStorage-Limit 8 MB betrifft nur leichte Daten; die schweren liegen in **IndexedDB**
(`idbJDetailPut`, gzip via `_gzipEncode`) — Quota = % der Platte (hunderte MB–GB).

| Codec | Ratio vs gzip | Browser-nativ | Standalone-tauglich |
|-------|:-------------:|:-------------:|:-------------------:|
| gzip/DEFLATE | Basis (45 %) | ✅ CompressionStream | ✅ schon genutzt |
| brotli | ~15–25 % besser | ⚠️ nur Decompress nativ | ❌ Compress braucht WASM |
| zstd | ~20–30 % besser | ❌ | ❌ WASM (~150–300 KB inline) |
| lz4 | schlechter (Speed) | ❌ | falscher Zweck |
| lzma/xz | ~25–35 % besser, langsam | ❌ | ❌ WASM |
| SQLite (sql.js/OPFS) | kein Kompressor | ❌ WASM (~1 MB) | ❌ Bloat |

**Killer:** CLAUDE.md verlangt standalone, eine HTML-Datei, keine externen Abhängigkeiten. Jeder
Nicht-gzip-Codec braucht eine WASM-Lib base64-inline (150 KB–1 MB permanenter Bloat) um ~20–30 %
am Spielstand zu sparen. **Schlechter Deal — gzip ist die pragmatische Decke.**

**Die echten Hebel (viel größer als jeder Codec-Tausch):**
- ① **Dictionary-Encoding** (strukturell, ohne WASM): dict+gzip = 10–23 % statt gzip 45 % → 2–4× besser.
- ② **Seed-Regeneration = 0 Bytes**: Fahrername = deterministische Funktion der ID → nur ID speichern,
  Name beim Laden regenerieren. Wörtlich die „0 Bytes, Regeneration zur Laufzeit"-Philosophie der
  Fable-Bänke (Pakete 2–5). → Details in `storage-seed-regen-roadmap.md`.

  > ### ⚠️ PRÄZISIERUNG (2026-07-17) — ② gilt NUR für Filler, nicht pauschal
  > So wie oben formuliert ist ② **zu grob**. Maßgeblich ist die **Spine/Filler-Grenzregel**
  > aus `storage-seed-regen-roadmap.md`: **Notable** (Champion, Kletterer, allTimeStats-Eintrag)
  > behalten ihre **persistierten Namen**; nur **reine Filler** werden regeneriert (Name = f(id)).
  >
  > **Grund:** Der regenerierte Name ist eine Funktion **des Pools** — einer *veränderlichen
  > Datentabelle*. Eine Vertiefung (`pyramid-300kart-nation-demand.md` §7/§9) verschiebt jede
  > Ziehung. Bei Filler ist das der von der Roadmap akzeptierte „Identitäts-Drift"; bei Notable
  > hieße es, **der Meister von 2087 heißt nach dem Update anders** — das darf nicht passieren.
  > (Unterschied zu `heavy.races`: die hängen an Seed + gefrorenem Kontext, an nichts, was sich
  > durch ein Update ändert.)
  >
  > **Reihenfolge-Konsequenz:** Die entschiedene Pyramide (15 F4-Serien + Kart-WM/EM)
  > **überschreitet den Stufe-4-Trigger** („>~10–20 Serien"). → **Vertiefung VOR Stufe 4 ziehen**,
  > damit der Filler-Drift einmal und früh passiert, statt gewachsene Saves umzubenennen.
  > Details: `pyramid-300kart-nation-demand.md` §10. **Hebel ① bleibt unberührt gültig.**
