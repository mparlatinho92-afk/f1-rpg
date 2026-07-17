# Paket H — METHODIK: Nachwuchs-Pyramide (Fluss-Parameter & Trichter-Validierung)

**Bearbeiter:** Fable · **Datum:** 2026-07-17 · **Brief:** `BRIEF.md`

## 0. Lieferumfang & Reproduktion

| Datei | Inhalt | Erzeugung |
|---|---|---|
| `pyramid-flow.js` | D1+D2: `PYRAMID_FLOW` — Ebenen-Skelett + Raten je Ära (e50…e10) | generiert |
| `intake-nation-shares.js` | D3a: `INTAKE_NATION_SHARES` — Basis-Intake je Dekade, Summe 1.0 | generiert |
| `promotion-rates.js` | D3b: `PYRAMID_NATION_LADDER` — Leiter-Modifikator je Nation × Ära | generiert |
| `VALIDIERUNG-D4.md` | D4: Modell vs. `DECADE_NATION_POOLS` je Dekade/Nation + TVD | generiert |
| `derive-pyramid.js` | das Skript, das alle vier erzeugt (Paket-F/G-Präzedenz) | Quelle |

**Reproduktion:** `node derive-pyramid.js` (aus diesem Ordner). `--calibrate` druckt
Kalibrier-Vorschläge für D3b. Quellen werden **nur gelesen**: `f1db-json-splitted/*.json`,
`../nation-data/nation-frequency-by-decade.js`, `index.html` (Regex-Extraktion von
`DECADE_NATION_POOLS`/`MOTORSPORT_NATION_BLEND` — bleibt automatisch synchron).

**Vertrauensgrade an jeder Zahl** (auch als `src`-Feld in `pyramid-flow.js`):
- **[D] datenbelegt** — direkt aus F1DB-JSON gerechnet (915 Fahrer, alle Rennergebnisse 1950–2025).
- **[A] abgeleitet** — folgt arithmetisch aus der Flussbilanz (Skript prüft die Konsistenz, s. §2).
- **[S] Schätzung** — wissensbasiert (Serien-Geschichte, Feldgrößen), extern nicht belegt.
  Spannen statt Präzision, wo es die Struktur erlaubt.

---

## 1. F1-Empirie (die einzige voll datenbelegte Ebene) [D]

Road-F1, **Indy raus** (Präzedenz `recompute-1950s-road-f1.js`), Verweildauer **zensur-korrigiert**
(nur Karrieren, die vor 2024 endeten; 2020er-Dekade auf 6 Datenjahre normiert):

| Dekade | Starter/Rennen | Debüts/Jahr | Verweildauer Med/Ø | ≤3-Starts-Anteil | Debütalter P10/Med/P90 |
|---|---:|---:|---:|---:|---|
| 1950 | 22,4 | **23,6** | 2 / 3,0 | **55 %** | 25 / 33 / 45 |
| 1960 | 20,7 | 13,5 | 2 / 3,4 | 53 % | 24 / 28 / 38 |
| 1970 | 26,7 | 13,3 | 2 / 3,8 | 33 % | 24 / 29 / 34 |
| 1980 | 29,0 | 7,9 | 3 / 4,7 | 10 % | 23 / 27 / 30 |
| 1990 | 26,3 | 6,6 | 2 / 4,5 | 18 % | 22 / 26 / 31 |
| 2000 | 21,0 | 4,9 | 3 / 4,8 | 4 % | 21 / 24 / 29 |
| 2010 | 21,7 | 4,1 | 2 / 3,1¹ | 2 % | 20 / 23 / 26 |
| 2020 | 20,0 | 2,6 | 2 / 1,9¹ | 17 %² | 19 / 22 / 25 |

¹ 2010/2020 nach unten verzerrt: lange Karrieren laufen noch (zensiert entfernt) — fürs Spiel
gilt die e10-Zeile in `PYRAMID_FLOW` mit tenure aus e94/e10-Mittel, nicht der Rohwert.
² 2020er-Anstieg = Sprint-/Ersatzfahrer-Einsätze (Doohan etc.), kein echtes Drehtür-Comeback.

**Korrektur der Brief-Schätzung:** „F1 26 Sitze / 8,0 J" ist doppelt falsch — die 1950er waren
eine **Drehtür** (24 Debüts/Jahr auf 22 Startplätze, 55 % der Debütanten mit ≤3 Starts), und
selbst modern liegt die mittlere Verweildauer bei ~5, nicht 8 Jahren. Das Debütalter fällt
über 75 Jahre von Median **33 auf 22** — das Spiel bekommt beides ära-genau.

## 2. D1+D2 — Ebenen-Skelett & Einsteiger-Raten

Semantik: `promoteShare` = Anteil der **Abgänger**, der aufsteigt (Rest verschwindet — Ursache
per Brief absichtlich nicht aufgetrennt). `freshShare` = Anteil der **Neuzugänge** frisch aus
der nicht-simulierten Masse. `fieldOverlap: true` → Sitze > Fahrer (Kart-WM+EM teilen sich das
Feld; F4-Serien sind geografisch getrennt → Sitze ≈ Fahrer).

Die Junior-Ebenen sind [S] (Feldgrößen/Verweildauern aus Serien-Geschichte), aber das Skript
**erzwingt die Flussbilanz** [A]: `freshShare(oben) ≙ 1 − befördert(unten)/Neuzugänge(oben)`.
Alle Ebenen schließen auf ≤3 pp (Konsole beim Lauf). Die Ära-Struktur ist Pflicht erfüllt:
**e50 hat `kart: null, f4: null`** (Kart-WM erst 1964, Formula Ford erst 1967) — 1955 gibt es
keine Leiter, F1-Debütanten kommen zu 65 % „aus dem Nichts" (Sportwagen, Motorräder, Geld).

### Antworten auf die beiden Prüffragen des Briefs (D2)

**„~91 % der F4-Neuzugänge frisch — wackeligster Wert?" → BESTÄTIGT, und robuster als gedacht.**
Der Wert hängt kaum an der Beförderungsquote, weil die Kart-Elite (150 Fahrer, 60 Abgänge/J)
gegen 280 F4-Neuzugänge/Jahr strukturell winzig ist:

| Kart-Elite promoteShare | F4-freshShare |
|---:|---:|
| 0,30 | 94 % |
| **0,40 (gewählt)** | **91 %** |
| 0,50 | 89 % |
| 0,70 (Brief-Sorge) | 85 % |

Selbst die aggressivste Annahme drückt den Wert nur auf 85 %. Die Aussage „nationale F4 wird
von nationalem Kartsport gespeist, nicht von der CIK-Elite" ist strukturell stabil.

**„F3 und F1 erzeugen null frische Fahrer?" → Für e10 im Kern bestätigt, historisch widerlegt.**
e10: F3 fresh 5 %, F1 fresh ~2 % (Superlizenz-Punkte schließen die Pipeline seit 2015 faktisch).
Aber: F1-freshShare je Ära = **0,65 / 0,45 / 0,20 / 0,08 / 0,02** (e50→e10). Ein Spiel, das
1950–1975 alle F1-Fahrer aus der Leiter zieht, wäre falsch — der „Rest des Chaos der 1960er"
steckt genau in diesen Werten.

## 3. D3a — Intake-Verteilung an der Basis

**Formel:** `intake(dek) = renorm( min( freqMaster(dek)^γ , popShare(dek)·CAP ) )`,
Floor ε = 0,002 (Paket-F-Regel), γ = 0,75, CAP = 25.

| Baustein | Quelle | Vertrauen | Warum |
|---|---|---|---|
| `freqMaster` | `MOTORSPORT_NATION_FREQ.shares` (12.207 Wikidata-Fahrer, **alle Serien**), auf den 59er-Nationen-Master gefiltert + renormiert | [D], mit bekanntem Bias | Einzige verfügbare Verteilung, die NASCAR/Supercars/Rally-**Breite** enthält — USA/AUS/JPN liegen hier von selbst ÜBER ihrem F1-Anteil (Brief-Forderung erfüllt, ohne sie hinzuschreiben) |
| `γ = 0,75` | kalibriert an D4 | [A] | dämpft den Enzyklopädie-Überlebenden-Bias (Spitze komprimieren, Breite anheben) — die Brief-Warnung „FREQ ungefiltert = Fehler nur verschoben" wird damit adressiert |
| `popShare·CAP` | Bevölkerungs-Anker 1950/1985/2020 (UN-Größenordnungen, geom. interpoliert) | [S] | **Pro-Kopf-Deckel:** kein Land liefert mehr Kart-Einsteiger pro Kopf als das 25-fache des Master-Schnitts. Erledigt MON/LIE/LUX strukturell (nicht per Handverbot); FIN (real ~21×) bleibt knapp drin |

Ergebnis-Stichproben: **MON 0,002 in allen Dekaden** (≈ Einwohnerzahl ✓) · **USA 17–19 %**
(F1-Anteil je nach Dekade 0,4–7,9 % ✓) · AUS 1,9→2,8 % · JPN bis 5,9 % (1980er) —
alle „eigene-Welt"-Nationen liegen am Intake deutlich über ihrem F1-Anteil.

**Befund-Korrektur zum Brief (wichtig für die Erzählung, nicht für die Zahlen):** F1DB
widerlegt „Monaco importiert fertige F1-Fahrer" im Wortsinn — **4 von 5** MON-F1-Fahrern sind
in Monte Carlo **geboren** (Chiron, Beretta, beide Leclerc). Monaco ist kein Personen-Import,
sondern ein **Wohlstands-/Kleinstzahlen-Ausreißer**: 5 Fahrer in 75 Jahren, Poisson-Rauschen
statt Pipeline. Für den Intake ändert das nichts (≈ ε bleibt richtig); es ändert nur die
Begründung. THA dagegen bestätigt: Albon ist in London geboren — Flaggen-Import existiert,
bleibt aber per Brief-Scope (kein Quereinstieg/Rückfluss) unmodelliert.

## 4. D3b — Leiter-Modifikator (`PYRAMID_NATION_LADDER`)

Relativer Durchsetzungs-Modifikator je Nation × Ära, Feld-Schnitt = 1,0. **Genau einmal pro
Fahrer anwenden** (empfohlen: an der Europa-Commit-Stufe F4→F3), nie je Stufe — sonst
quadriert sich der Effekt. Hier steckt der **implizite Abfluss** (Brief-Kern):

| Archetyp | Beispiele | Muster |
|---|---|---|
| Eigene Welt | USA 0,30→0,04 · AUS · JPN · ARG (ab e62) | NASCAR/Indy, Supercars, SF/SGT, TC saugen die Basis ab |
| Rally-/Motorrad-Drain | SWE · NOR · POR · ESP (bis e76) | große Motorsport-Breite, die nie Richtung Formel-Leiter fließt |
| Politisches Tor | Ostblock 0,05 vor 1990, danach 0,3–1,0 | keine Ausreise in West-Serien; RUS e10 = Geld-Ära |
| Industrie-Heimvorteil | GBR (e62: 2,3!) · ITA e76/e94 | Motorsport-Valley bzw. F3-/Kart-Industrie hebt die Durchsetzung |
| Überconversion | FIN e94/e10 ≈ 3,1–3,2 · BRA e94 | kleine Basis, extreme Ausbeute (Häkkinen→Bottas; Fittipaldi-Kultur) |
| Konversions-Kollaps | ITA e10 0,55 · AUT e10 0,10 | real: riesige Kart-Basis, kaum moderne F1-Fahrer |

**Kalibrier-Verfahren & Anti-Zirkularitäts-Hinweis (ehrlich):** Die λ-Werte wurden mit
`--calibrate` (Vorschlag = λ × Ø(Ziel/Modell), Debüt-gewichtet) angenähert und **von Hand auf
0,05er-Bänder gerundet**; Rausch-Fälle wurden bewusst NICHT gefittet (MON e10: Vorschlag 5,0 →
belassen bei 1,0; THA/CAN/AUS-2020er nur teilweise). D4 ist damit **kein unabhängiger Test der
λ-Tabelle** — die unabhängig belegten Teile des Modells sind der **Intake (§3, aus Nicht-F1-
Quellen)** und das **Skelett (§2)**. D4 prüft, ob die Struktur `Intake × ein λ je Ära` die
beobachtete F1-Verteilung überhaupt erreichen KANN und wo eine Zahl pro Ära nicht reicht
(Residuen §5). Genau das war der Auftrag: eine Tabelle, keine Mechanik.

**`dampUSA`:** unangetastet (Brief-Sperre). `PYRAMID_NATION_LADDER` ist der designierte
Ablöser (USA e10 = 0,04 ersetzt den Ad-hoc-Faktor 0,5 durch eine abgeleitete Quote) —
Entscheidung liegt bei Opus/Nutzer.

## 5. D4 — Validierung (Kurzfassung; volle Tabellen in `VALIDIERUNG-D4.md`)

Modell je Dekade: `renorm(INTAKE × LADDER[era])`, Floor ε, MODERN-Gate. Fehlermaß TVD
(½·Σ|Modell−Ziel|; 0 = identisch):

| Dekade | TVD | Debüts (Stichprobe) | Anmerkung |
|---|---:|---:|---|
| 1950 | **0,062** | 236 | **Indy-Präzedenz reproduziert:** USA-Intake 18,2 % → Modell ≈ Ziel 7,9 % (Brief-Pflichttest ✓) |
| 1960 | 0,157 | 135 | Rest = USA/GBR leicht unter Ziel; FRA-Dürre→Elf-Welle liegt IN e62 (eine λ-Zahl kann nicht beide Dekaden treffen) |
| 1970 | 0,152 | 133 | dito (gleiches Ära-Mittel-Problem, Vorzeichen gedreht) |
| 1980 | 0,107 | 79 | |
| 1990 | 0,126 | 66 | JPN-Bubble-Spitze (7,7 %) liegt IN e76 — Ära-Mittel glättet sie |
| 2000 | **0,078** | 47 | |
| 2010 | 0,126 | 41 | |
| 2020 | 0,208 | **11** | fast vollständig Ziel-Rauschen: 11 Debüts, 1 Fahrer = 9 pp (Piastri); MON −2,2 pp = Leclerc; bewusst nicht gefittet |
| **Ø** | **0,127** | | Start der Kalibrierung: 0,278 |

Zum Vergleich: die ε-Floor-Masse allein (≈40 Nationen × 0,2 % auf beiden Seiten) erzeugt eine
Grundrauschen-TVD von ~0,03–0,05. Ein Wert ≤0,15 heißt: das Trichter-Modell erklärt die
F1-Verteilung im Rahmen dessen, was Dekaden-Stichproben von 11–236 Debüts überhaupt hergeben.

**Bekannte, akzeptierte Residuen** (alle erklärbar, keine Modell-Reparatur nötig):
1. **Intra-Ära-Wellen** (FRA 60er/70er, JPN 80er/90er, GER 2010er/2020er) — eine λ-Zahl je
   Ära ist der gewollte Kompromiss; feiner = Überanpassung an Dekaden-Rauschen.
2. **Kleinstzahlen-Nationen** (MON/THA 2020) — im Ziel steckt je 1 realer Fahrer; ein
   Flussmodell soll das NICHT reproduzieren (sonst modelliert es Poisson-Rauschen als Kultur).
3. **CAN 2020** (−3,4 pp) — Stroll+Latifi = Pay-Driver-Wohlstandseffekt, 2 von 11 Debüts.

## 6. Einbau-Hinweise für Opus (beschreibend — kein Code von mir)

1. **Drei Tabellen, drei Rollen:** `INTAKE_NATION_SHARES[dekade]` ersetzt
   `pickNationMotorsport` **nur für frische Einsteiger an der Basis** (Kart/F4-Intake in
   `_makeJuniorDriver`). `PYRAMID_FLOW[era]` liefert Sitze/Raten/Alter je Ebene.
   `PYRAMID_NATION_LADDER[era][nat]` multipliziert die Beförderungs-Chance **genau einmal**
   (F4→F3). F1-Grid-Fill und Indy bleiben unberührt (Pools bzw. hart 'USA').
2. Dekade→Ära-Mapping wie im Skript: 1950→e50, 1960/70→e62, 1980/90→e76, 2000→e94 (2000er-
   Dekade ≈ e94), 2010+→e10. Jahre >2029 → letzte Dekade 2020 (wie bestehende Tabellen).
3. `seats` sind real-aggregierte Referenzen — das Spiel darf eigene Grid-Größen fahren, die
   **Raten sind skalenfrei** (Neuzugänge/Jahr = Sitze ÷ tenure gilt in jeder Skalierung).
4. Ebenen mit `null` (e50: kart, f4) in der Ära **nicht spawnen** — Fahrer entstehen dann
   „frisch" auf F3/F2/F1 gemäß `freshShare` (das ist das 1950er-Chaos, absichtlich).
5. Floor/Gate: Werte ≤0,002 nie auf 0 runden; `MODERN_ONLY_NATIONS` werden vom **bestehenden**
   Laufzeit-Gate vor 2000 entfernt — die Tabellen führen sie mit ε, wie die Pools heute.
6. `fieldOverlap: true` (Kart): bei Anzeige „WM+EM" nicht doppelt Fahrer erzeugen — ein
   Fahrer-Pool, zwei Wertungen.

## 7. Grenzen (ehrlich markiert)

- **Junior-Feldgrößen/Verweildauern sind [S]** — keine CIK-/ASN-Lizenzstatistik lag vor, und
  externe Beschaffung hätte Scheinpräzision erzeugt (historische Kart-Lizenzzahlen je Nation
  ab 1964 existieren schlicht nicht konsistent). Die Flussbilanz [A] und die F1-Anker [D]
  begrenzen den Schaden: Raten, nicht Absolutzahlen, tragen das Modell.
- **Bevölkerungs-Anker [S]** sind UN-Größenordnungen aus Wissen (3 Stützjahre, interpoliert) —
  für einen Deckel-Mechanismus mehr als genau genug, als Demografie-Quelle ungeeignet.
- **Eine λ-Zahl je Ära** glättet echte Wellen innerhalb einer Ära (§5.1) — bewusster Kompromiss.
- **Intake-Dekade = F1-Dekade** (kein ~8-Jahre-Versatz Kart-Einstieg→F1-Debüt). Bei
  Dekaden-Granularität und langsam driftenden Pools ist der Fehler klein; das Spiel simuliert
  den Versatz ohnehin selbst (der Fahrer klettert in Echtzeit durch die Ebenen).
- **Wikidata-Bias** ist gedämpft (γ), nicht eliminiert — en-Wiki-Übergewicht für USA/GBR
  steckt noch in Resten im Intake. Der Pro-Kopf-Deckel und λ fangen die Folgen ab.
