# Paket I — REPORT (D4: Größe & Wirkung)

Alle Zahlen reproduzierbar: `scripts/README.md`; Rohwerte: `data/fit-report.json`.

## 1. Union-Poolgröße (Budget-Nachweis)

| Nation | vorher (Region 0, Union first inkl. Tails) | Budget | **nachher** |
|---|---:|---:|---:|
| GER | 500 | 530 | **503** |
| GBR | 539 | 590 | **590** |
| USA | 588 | 590 | **590** |
| FRA | 430 | 550 | **551** |
| ITA | 590 | 590 | **407** ⚠ → **457** (Nachtrag s. u.) |

Kein Aufblähen; GER/ITA unter Budget, weil die Jahrgangs-Quellen nicht mehr hergeben
(METHODIK §8) — bewusst **nicht** mit Kaggle-Gegenwartsnamen aufgefüllt. ITA hat dafür
erstmals eine echte Zeitachse statt eines undatierten Blobs.

> **Nachtrag ITA-Tail-Vertiefung (2026-07-18, `scripts/deepen-ita-ranks.js`):** Die
> kuratierten Dekadenlisten 1900–1990 wurden von 50 auf 120 Namen je Dekade vertieft
> (Union 113 → 241; Tail-Genauigkeit ±15 Ränge statt ±5, s. `_meta.tail`). Wirkung:
> Pool 407 → **457**, eff je Jahrgang 1930: 27 → **35** (85 → 191 aktiv), 1955: 37 →
> **51**, 1980: 42 → **57**; modern bleibt ISTAT-gebunden (~52). Kopf-Anker intakt:
> Giuseppe 1930 8,6 % (Korridor ~9 %), Reihenfolge unverändert. Die Zahlen-Tabellen
> unten zeigen den Stand VOR dem Nachtrag; aktuelle Werte: `data/fit-report.json`.

## 2. Effektive Größe (Simpson `1/Σp²`) — das Erfolgsmaß

**Vorher** (Fenster-eff, `vorher-eff.js` gegen `data/names.js` v0.9.14.79):

| Nation | early | mid | modern |
|---|---:|---:|---:|
| GER | 16 / **eff 15** | 499 / eff 202 | 345 / eff 88 |
| GBR | 16 / **eff 14** | 537 / eff 191 | 390 / eff 85 |
| USA | 16 / **eff 14** | 584 / eff 239 | 436 / eff 135 |
| FRA | 16 / **eff 15** | 429 / eff 194 | 303 / eff 78 |
| ITA | 17 / **eff 16** | 589 / eff 177 | 428 / eff 101 |

**Nachher** (Kurven, je Geburtsjahrgang ausgewertet; „aktiv" = Namen mit Gewicht > 0):

| Nation | 1930 | 1955 | 1980 | 2005 |
|---|---:|---:|---:|---:|
| GER | eff **30** (153 aktiv) | eff 46 (269) | eff 69 (360) | eff 119 (367) |
| GBR | eff **33** (142) | eff 40 (162) | eff 56 (296) | eff 93 (492) |
| USA | eff **51** (324) | eff 63 (397) | eff 71 (465) | eff 145 (478) |
| FRA | eff **27** (228) | eff 42 (322) | eff 66 (381) | eff 105 (389) |
| ITA | eff **27** (85) | eff 37 (97) | eff 42 (175) | eff 53 (359) |

- **early-Ziel erfüllt:** eff 14–16 → **27–51** je Jahrgang, und statt 16 Stub-Namen für
  25 Jahrgänge hat jeder Jahrgang 85–324 aktive Namen mit eigener Verteilung.
- **Äpfel/Birnen-Hinweis:** Das alte mid-eff 177–239 ist KEIN besserer Wert — es entsteht
  durch Plattdrücken von 35 Jahrgängen + weight-1-Tails in ein Fenster. Die echte
  Bevölkerung eines einzelnen Jahrgangs hat eff ~40–150 (USA 1980 real: ~71) — **genau
  dort landen die Kurven.** Das erfüllt das verbindliche Nutzer-Kriterium
  `eff_Pool ≈ eff_Bevölkerung` (pyramid-300kart-nation-demand.md) erstmals auch zeitlich:
  ein 1955er-Feld dupliziert wie 1955 (Michael/Peter doppelt = gewollt), nicht wie 2020.

## 3. Bytes

| | Größe |
|---|---:|
| heutige first-Daten der 5 Nationen (Region 0 + first-Tails in `names.js`) | 38,2 KB |
| **`era-first-names.js`** (ersetzt sie) | **73,6 KB** (Header + 2.641 Kurven) |
| davon als gzip (für den geplanten Blob-Umbau, §9 der Speicher-Analyse) | 21,8 KB |

Netto **+35 KB** im Monolithen (+0,6 %) — dafür Ära-Auflösung von 3 Fenstern auf
**stufenlos**. Unter dem geplanten gzip-Blob kostet es netto ~**+10 KB**.
Bauform A (8 Fenster) hätte für dieselbe Auflösung ~8× Namens-Duplikate gespeichert
(geschätzt 120–150 KB) und bliebe an den Fenstergrenzen sprunghaft.

## 4. Plausibilitätsprobe: Top-5 je Geburtsjahrgang (Anteile innerhalb des Pools)

| Jahrgang | GER | GBR | USA | FRA | ITA |
|---|---|---|---|---|---|
| ~1930 | Hans 10,7 · Günther 6,9 · Karl 5,0 · Horst 4,6 · Heinz 4,5 | John 10,2 · William 5,1 · Peter 4,4 · George 3,8 · James 3,8 | John 5,9 · James 5,8 · Robert 5,6 · William 4,8 · Charles 3,1 | Jean 12,2 · André 5,6 · Pierre 4,8 · René 4,1 · Michel 4,1 | Giuseppe 9,9 · Giovanni 6,8 · Mario 6,4 · Antonio 5,6 · Luigi 4,7 |
| ~1955 | Peter 5,7 · Hans 5,1 · Michael* 4,6 · Klaus 4,4 · Wolfgang 4,4 | David 6,4 · John 6,0 · Michael 4,3 · Stephen 4,2 · Peter 4,1 | Robert 4,7 · James 4,5 · John 4,0 · Michael 3,8 · David 3,6 | Jean 7,0 · Michel 4,9 · Alain 4,8 · Patrick 4,3 · Philippe 3,9 | Giuseppe 7,3 · Giovanni 5,2 · Antonio 4,7 · Mario 4,5 · Francesco 4,5 |
| ~1980 | Christian 5,3 · Stefan 3,1 · Sebastian 2,8 · Markus 2,7 · Jan 2,7 | Paul 4,1 · Andrew 3,7 · James 3,6 · Christopher 3,4 · Mark 3,4 | Michael 4,8 · Christopher 3,7 · Jason 3,5 · David 3,1 · James 2,7 | Sébastien 4,9 · Nicolas 4,0 · David 3,6 · Christophe 3,1 · Julien 3,1 | Marco 5,7 · Francesco 4,7 · Andrea 4,5 · Giuseppe 3,9 · Alessandro 3,5 |
| ~2005 | Lukas 2,4 · Leon 2,2 · Jonas 2,0 · Luca 1,9 · Felix 1,8 | Jack 3,5 · Thomas 2,8 · Joshua 2,8 · James 2,2 · Harry 2,2 | Jacob 2,1 · Matthew 1,8 · Daniel 1,6 · Joshua 1,5 · John 1,5 | Lucas 2,8 · Enzo 2,7 · Hugo 2,3 · Théo 2,3 · Thomas 2,1 | Francesco 4,9 · Andrea 4,2 · Lorenzo 4,0 · Alessandro 4,0 · Matteo 4,0 |

\* Quellen-Reihenfolge der 1950er-Dekade ist Michael > Peter > Hans; die Kurve legt
Michaels Gipfel auf 1958, deshalb liegt er bei exakt 1955 knapp hinter Peter/Hans.

Externe Anker: E&W 1934 „John" real ~9 % ✓ · INSEE 1930 „Jean" 12,2 % ist der **echte**
Wert ✓ · SSA 1930 direkt aus Counts ✓ · „Giuseppe" 1930 ~10 % im Literatur-Korridor ✓.
Sichtbare Ära-Marker funktionieren: Kimi-Antonelli-Jahrgang zieht Matteo/Lorenzo, nicht
Giuseppe; ein 1950er-GER-Feld heißt Hans/Klaus/Wolfgang, nicht Leon/Luca.

## 5. Fit-Güte & Revival-Namen

| Nation | massegew. R² | 2-Komponenten-Namen im Pool |
|---|---:|---:|
| FRA | 0.951 | 62 |
| GER | 0.937 | 2 |
| USA | 0.924 | 78 |
| GBR | 0.896 | 11 |
| ITA | 0.842 | 11 |

(GER fast nur 1-Komponenten: dekadische Rang-Punkte sind glatt; ITA niedrigster Wert =
Splice kuratiert→real, erwartbar.) Beispiel-Kurven: `William [1866,55,836, 2006,10,136]`
(Revival), `Theodore [1862,75,42, 2022,5,46]`, `Jack [2002,10,305]`, `Hans [1931,20,909]`.

## 6. Einwanderungsnamen-Anteil je Kohorte (gemeldet, nicht gefiltert — Brief-Regel)

Anteil klassifizierter Namen an der Kohorten-Masse (voll: `data/immigrant-cohort-share.json`,
inkl. Namensliste `imPool` je Nation fürs Paket-J-Routing):

| Nation | ~1935 | ~1975 | ~1997 | ~2017 | im gelieferten Pool |
|---|---:|---:|---:|---:|---:|
| GER | 0,9 % | 2,3 % | 1,1 % | 0 %* | 22 Namen |
| FRA | — | — | 3,0 % | 9,4 % | 28 |
| GBR | — | — | 2,2 % | 4,8 % | 23 |
| ITA | 0 % | 3,5 % | 3,3 % | 5,6 % | 17 |
| USA | n/a (Schmelztiegel-Regel, METHODIK §Immigrant) | | | | 0 |

\* GER 2010er-Liste ist nur Top-30 → 0 % ist Listenkürze, nicht Realität (real ~2–3 %).
GER ~1935 enthält das bekannte Bielefeld-Artefakt (Mehmet #88, METHODIK §5).

## 7. Restrisiken

Siehe METHODIK §9 (ITA-Kuration ±5 Ränge, GBR ohne Schottland, Kopfform-Übertrag ±20 %).
Nichts davon blockiert den Einbau; Regressionsanker für Opus: `exportNameStats` gegen §4.
