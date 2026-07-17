# Paket I — METHODIK (Ära-Vornamen aus Geburtsjahrgangs-Statistik)

**Lieferung:** `era-first-names.js` (Bauform B, 2.641 Kurven, 5 Nationen) + `data/` + `REPORT.md`.
Reproduktion: `scripts/README.md`. **Kein Einbau durch Fable** — Einbau-Hinweise in §7.

---

## 1. Quellen (verifiziert, Abruf 2026-07-17)

| Nation | Quelle | Abdeckung | Art |
|---|---|---|---|
| USA | SSA baby names (Original blockt curl per Akamai → Mirror `github.com/hackerb9/ssa-baby-names`, identische Daten) | **1900–2020 volle Counts** (≥5 Träger/Jahr) | Counts |
| FRA | INSEE „fichier des prénoms" `insee.fr/fr/statistiques/fichier/7633685/nat2022_csv.zip` | **1900–2022 volle Counts** inkl. `_PRENOMS_RARES`-Aggregat | Counts |
| GBR | ONS England & Wales via `github.com/mine-cetinkaya-rundel/ukbabynames` | **1996–2020 volle Counts**; 1904–1994 nur **Top-100-Ränge, dekadisch** | Counts + Ränge |
| ITA | ISTAT „Contanomi"-Webservice (`…/contanomi/nati/index2022.php`, JSONP, aus dem offiziellen Widget) | **1999–2024 Counts** (Top-300/Jahr; 2018/19 max ~230, 2021 max ~100 — serverseitig) | Counts |
| GER | beliebte-vornamen.de Dekaden-Seiten (Knud Bielefeld) — **Erwartung des Briefs bestätigt: kein amtliches Register** | 1900er–2000er **80–300 Ränge je Dekade**, 2010er nur Top-30 | **Rang-only** |

Erwartungs-Abweichungen zum Brief: ONS liefert via ukbabynames sogar volle Counts ab 1996
(besser als erwartet); ITA-Frühjahrgänge sind wie erwartet leer → §5; Schottland (NRS) ist
**nicht** enthalten (nur E&W — leichte Untererfassung schottischer Namen, bewusst gekauft).

**Männlich-only-Regel:** Es zählt die Geschlechts-Spalte der Quelle (SSA `M`, INSEE `sexe=1`,
ONS `sex=M`, ISTAT `gender=m`), nicht der Name. Unisex-Namen (z. B. US „Casey") sind damit
automatisch nur mit ihrer **männlichen** Häufigkeit drin; die weibliche Zeile wird verworfen.
GER-Ranglisten sind bereits getrennt (Jungen-`<ol>`).

## 2. D1a — Umschlagsrate (rechtfertigt die Ära-Auflösung)

Top-50-Vergleich zwischen Geburtskohorten (5J-Buckets), Ø über die Zeitachse:

| Lag | USA Jaccard / Masse-Verbleib | FRA | GBR (nur 1996+) |
|---|---|---|---|
| 5 J | 0.80 / 0.95 | 0.75 / 0.94 | 0.71 / 0.91 |
| 10 J | 0.65 / 0.90 | 0.58 / 0.85 | 0.49 / 0.78 |
| 20 J | 0.46 / 0.79 | 0.34 / 0.60 | 0.27 / 0.55 |

→ Nach 20 Jahren ist **die Hälfte bis zwei Drittel der Top-50 ausgetauscht**. Drei starre
Fenster (early = 25 Jahrgänge!) verschmieren das; Jahrfünfte wären nötig — und genau die
macht Bauform B stufenlos gratis.

## 3. D1b — Bauform-Entscheidung: **B (Gauß-Kurve je Name)** ⭐

Least-Squares-Fit `share(t) = a·exp(−½((t−p)/σ)²)` je Name auf die 5J-Kohorten
(Grid-Search p×σ, Amplitude closed-form). Massegewichtetes R²:

| Nation | 1 Komponente | 2 Komponenten | Namen, die 2 brauchen (Masseanteil) |
|---|---|---|---|
| USA | 0.886 | 0.939 | 79 (7.8 %) |
| FRA | 0.918 | 0.969 | 59 (5.5 %) |
| GBR | 0.908 | 0.934 | 18 (2.8 %) |

**Antwort auf die Ausreißer-Frage des Briefs:** Bimodale Männernamen sind real, aber eine
kleine Minderheit (~3–8 % der Masse) — es sind die Revivals: GBR *Jack, George, William,
Thomas, Edward, Louis*; FRA *Jules, Gabriel, Victor, Antoine, Augustin*; USA *Theodore, Leo,
Oscar, Samuel, Vincent*. **Lösung statt Bauform-Wechsel:** solche Namen bekommen **zwei**
Komponenten (6 statt 3 Zahlen). Regel im Build: 2. Komponente nur bei ≥12 Beobachtungs-
punkten, R²(1K) < 0.85 und Gewinn ≥ 0.10 (Overfit-Schutz bei den dünn beobachteten
Rang-Quellen). Ergebnis: 164 von 2.641 Einträgen sind 6-Tupel.

Bauform A (8 Jahrzehnt-Fenster) wurde damit verworfen: gleiche Datenbasis, aber
Fenster-Brüche (1949→1951-Problem des Briefs), ~8× duplizierte Speicherung der
überlappenden Namen und keine bessere Fit-Güte.

## 4. D3 — Zipf: Kalibrierung, Drift-Beleg, und warum die Anwendung nicht-parametrisch ist

Log-log-OLS `share(rank) ∝ rank^(−s)` über die Top-80 je Kohorte (volle Tabellen:
`data/zipf-fit.json`, R² der Fits 0.87–0.99):

| Kohorte | USA | FRA | GBR | ITA |
|---|---|---|---|---|
| 1900–1949 | 0.87 | 1.20 | — | — |
| 1950–1979 | 0.85 | 0.91 | — | — |
| 1980–2004 | 0.67 | 0.67 | 0.74 | 0.88 |
| ab 2005 | 0.37 | 0.53 | 0.58 | 0.82 |

**Antwort auf die Drift-Frage: ja, s driftet massiv** (USA 0.89→0.36, FRA 1.27→0.47) —
die Vornamen-Konzentration hat sich seit 1930 grob **halbiert bis gedrittelt**. Ein fester
Exponent wäre falsch; die Nutzer-Intuition („Platz 17 hat eine bestimmte Häufigkeit")
stimmt, aber die Häufigkeit ist **ära-abhängig**.

**Anwendung auf die Rang-only-Quellen — Kopf-Problem des parametrischen Fits:** Der
Ø-Exponent wird vom historischen FRA-Ausreißer-Kopf steil gezogen (Jean 1930 = **12,2 %
real**); parametrisch auf GER/GBR/ITA angewandt entstünden 25–50 %-Spitzennamen (Probe:
„John 1930 = 41 %", real ~9 %). Ein aus dem Modern-Überlapp kalibrierter Nation-Multiplikator
(ITA 1,5×) extrapoliert zusätzlich falsch in die Vergangenheit. Deshalb Rang→Anteil über die
**empirische Rang-Kurve**: `share(rang r, t) = Ø über USA+FRA der beobachteten Anteile an
Position r im nächstliegenden Bucket`. Das ist dieselbe Kalibrierung, nur nicht-parametrisch —
Kopfform und Top-N-Coverage stimmen per Konstruktion, die s-Tabelle oben bleibt der
Drift-Beleg. Plausibilitäts-Anker nach Umstellung: GBR 1930 „John 10,2 %" (real ~9 %),
GER 1930 „Hans 10,7 %", ITA 1930 „Giuseppe 9,9 %" — alle im realistischen Korridor.

## 5. Quellen-Sonderfälle je Nation

- **GER (Rang-only):** 12 Dekaden-Listen → Beobachtungspunkte bei t = Dekade+5. Bekanntes
  Quellen-Artefakt: Bielefelds Listen enthalten in frühen Dekaden vereinzelt Namen
  im Ausland geborener späterer Einwohner (Mehmet Rang 88 „1930er"). Gemäß
  Brief-Regel **nicht gefiltert**; Anteil je Kohorte separat gemeldet
  (`data/immigrant-cohort-share.json`).
- **GBR (Splice):** Ränge 1904–1994 (empirische Kurve) + echte Counts 1996–2020; die
  Fit-Routine sieht beide als eine Zeitreihe. Abwesenheit in einer nur-100-tiefen
  Rangliste wird mit halbem Gewicht als 0 gewertet (Liste zu kurz ≠ Name verschwunden).
- **ITA (prä-1999 kuratiert):** einzige Stelle ohne maschinenlesbare Quelle. Dekaden-
  Ranglisten 1900–1990 **kuratiert** aus Living-Population-Rangliste (ISTAT-basiert),
  ISTAT-1999-Endpunkt und onomastischer Literatur — vollständige Anker + Genauigkeits-
  angabe (±5 Ränge) in `data/ita-decade-ranks.json` `_meta`. **Ehrlich markierte
  Schätzung** (Brief: „kennzeichnen und weitermachen"); die realen 1999+-Counts ankern
  das moderne Ende, der Fit glättet Einzelfehler.
- **USA/FRA:** durchgängig echte Counts, keine Synthese.

## 6. Jahrgangs-Versatz + Zukunfts-/Vergangenheits-Regel

- **Kurven sind nach GEBURTSJAHR indiziert** — der Versatz gehört in den Aufrufer:
  `birthYear = bekannt ? driver.birthYear : pickYear − 24`. Junior-Welt kennt das Alter
  bei der Generierung (`_makeJuniorDriver`, Einstieg 17–20) → **dort echtes Geburtsjahr
  verwenden, keine Konstante.** Die 24 ist der Fallback für kontextlose Picks: Debütalter-
  Median driftet real 33 (1950er) → 22 (heute); 24 liegt im gemeinsamen Korridor, und ein
  Fehler von ±5 Jahren verschiebt bei σ ≥ 8 nur Nuancen. Eine zusätzliche Streuung ist
  **unnötig**, wo echte Geburtsjahre existieren — nur der Fallback dürfte optional ±3 würfeln.
- **Clamp-Regel (`ERA_FIRST_CLAMP` in der Lieferung):** `by = clamp(birthYear, min, max)`
  je Nation (GER [1905, 2015], andere bis 2020/22). Nach dem Datenhorizont wird die
  **letzte Kohorte eingefroren** (ein 2035 Geborener zieht wie 2020) — bewusst kein
  Extrapolieren von Trends, die die Quelle nicht enthält. Vor dem Horizont analog.

## 7. Einbau (Opus-Seite — hier nur beschrieben)

1. `ERA_FIRST_NAMES` + `ERA_FIRST_CLAMP` inline (Block ist paste-fertig, 74 KB / 22 KB gzip).
2. `pickPooledName` (~L5104): für die 5 Nationen, **Region 0**, statt
   `region.first[era]`: Gewichte per Kurve —
   ```
   by = clamp((birthYear ?? year - 24), CLAMP[nat])
   arr = Namen der Nation → [name, Σ_k a_k·exp(−½((by−p_k)/s_k)²)]  (1 od. 2 Terme)
   weightedPick(arr)   // Floor nicht nötig: >100 Namen je Jahrgang aktiv
   ```
   Perf: 500–590 exp-Aufrufe/Ziehung sind harmlos; optional je (nat, by) einmal
   berechnen und cachen (by ganzjährig → max. ~120 Caches/Nation).
3. **Signatur-Frage:** `pickPooledName(nation, year, …)` kennt heute kein Geburtsjahr.
   Empfehlung: optionalen Parameter `birthYear` ergänzen; `_makeJuniorDriver` übergibt
   `year − age`, alle anderen Aufrufer bleiben unverändert (Fallback `year − 24`).
4. **Diaspora-Regionen unangetastet:** GBR r1 (0.08, ab 1995) und FRA r1 (0.10, ab 1995)
   behalten ihre kuratierten Listen. Die Kurven-Tabelle ist **national** und enthält
   Einwanderungsnamen (Muhammad GBR, Mohamed/Rayan FRA …) → milde Doppelzählung.
   Sauberste Auflösung: diese Vornamen per Paket-J-`routeFirst` in die Diaspora-Region
   routen (Liste: `data/immigrant-cohort-share.json` → `imPool`); akzeptable Minimal-
   lösung: Doppelzählung hinnehmen (≤ ~5 % Masse, modern).
5. **Kaggle-Ablösung (D2-Option) — Empfehlung: JA, komplett** für die **Vornamen** dieser
   5 Nationen: Kaggle ist ein Gegenwarts-Schnappschuss; selbst sein „mid"-Fenster ist
   damit falsch datiert, und die Jahrgangskurven decken die ganze Achse ab. Konkret:
   `build-names-v3.js` überspringt für GER/GBR/USA/FRA/ITA die `fore`-Merges (Region 0)
   und die `first`-Tails; **Nachnamen bleiben unverändert Kaggle.** `ensureNamePoolsMerged`
   („first → Gewicht 1 nur an mid+modern") wird für diese 5 Nationen gegenstandslos.
6. Nach Einbau: `exportNameStats(20000, 1955)` und `…(20000, 2024)` gegen die
   Top-5-Proben in `REPORT.md` §4 halten.

## 8. Kappungs-/Budget-Regel (D2)

Auswahl = **Union der Top-M je 5J-Kohorte 1915–2020** (aus den Kurven ausgewertet),
M per Binärsuche, bis die Union das Budget (heutige Poolgröße, `vorher-eff.js`) erreicht:
GBR M=282→590, FRA M=161→551, USA M=210→590. GER (503 von 530) und ITA (407 von 590)
erreichen das Budget nicht ganz — **die Quellen geben nicht mehr her** (GER: Union der
Dekaden-Listen; ITA: 50/Dekade + Top-300 modern). Kein Auffüllen mit Kaggle-Namen:
das würde exakt den Gegenwarts-Bias wieder einschleppen, den das Paket entfernt.
Masse-Floor: Namen mit Gesamt-Beobachtungsmasse < 0.0002 entfallen (Rauschen).

## 9. Bekannte Grenzen

- ITA vor 1999: kuratiert (±5 Ränge), s. §5 — schwächster Teil, bewusst markiert.
- GER: Bielefeld-Ranglisten sind eine seriöse, aber private Sammlung; Tail-Ränge
  (>100) sind Näherung. 2010er nur Top-30 → GER-Clamp endet 2015.
- GBR ohne Schottland (Fraser/Callum etc. leicht untergewichtet, kommen aber ab 1996 rein).
- SSA vor ~1937 untererfasst (keine SSN-Pflicht) — Anteile bleiben brauchbar, absolute
  totals nicht (werden nicht verwendet).
- Empirische Rang-Kurve überträgt die Ø-Kopfform von USA/FRA auf GER/GBR/ITA-Vergangenheit;
  nationale Eigenheiten des Kopfes (z. B. extremere GER-Konzentration in den 1910ern)
  gehen darin unter — Fehlerband geschätzt ±20 % auf die Spitzen-Anteile.
