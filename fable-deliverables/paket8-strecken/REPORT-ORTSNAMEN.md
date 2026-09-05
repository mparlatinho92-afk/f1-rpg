# Paket 8 — Ortsnamen aus GeoNames statt Erfindung (v0.9.17.42)

**Stand 2026-09-05.** Ausgangslage: `CIRCUIT_NAME_POOLS.place` hielt **212 erfundene
Ortsnamen** auf 30 Nationen — rund sieben je Land (`Kingsmoor`, `Draycott` für
Großbritannien, `Valdano`, `Montefiore` für Italien, `Kazemura` für Japan). Im
rotierenden Zukunfts-Kalender wiederholten sie sich zwangsläufig.

Die Einschätzung im Fable-Index, dafür gebe es „keine Datenquelle", war falsch.
Ortsdatenbanken gibt es; man erfindet nichts, sondern überlässt je Staat der
Datenbank die Auswahl.

## Quelle

**GeoNames** (CC-BY 4.0), zwei Dateien:

| Datei | Größe | wofür |
|---|---|---|
| `cities500.txt` | 39 MB | Ort, Land, Einwohnerzahl, Ortstyp |
| `alternateNamesV2.txt` | 746 MB | Name in der Landessprache |

Die Rohdaten gehören **nicht ins Repo**. Gebaut wird mit
`node tools/build-places.js <verzeichnis>` → `data/places.js`. Die Datei ist
**generiert**; Änderungen gehören ins Bau-Skript, nicht in die Ausgabe (gleiche
Regel wie `data/names.js` / `build-names-v3.js`).

## Warum zwei Dateien

`cities500` allein liefert für Großstädte das **englische Exonym**: `Rome`, `Milan`,
`Naples`, `Turin`, `Genoa`, `Munich`, `Warsaw`. Ein „Gran Premio di Rome" wäre
falsch. `alternateNamesV2` liefert den Namen in der Landessprache — aus 19,1
Millionen Zeilen blieben 27.378 verwertbare, davon haben **3.379 ein Exonym
ersetzt**: Roma, Milano, Napoli, Torino, Genova, München, Warszawa.

Für Japan, Korea, China, Russland, die Ukraine, Griechenland, Israel, Indien,
Thailand, Serbien, Bulgarien und die arabischen Länder wird die Landessprache
**bewusst nicht** genommen — sonst stünde dort 東京 oder Москва. Diese Länder
behalten die lateinische Umschrift aus `cities500`.

## Ergebnis

**15.420 Orte in 56 Nationen, 174 KB** (≈ 3 % des Monolithen). Zwei Eimer je Land:

- `k` = unter 50.000 Einwohner → **permanente Kurse**
- `g` = ab 50.000 → **Straßenkurse**

Die Zweiteilung ist an der Realität gemessen: reale F1-Strecken heißen nach
Dörfern (Silverstone 1.907 Einw., Nürburg 169, Magny-Cours 1.501, Le Castellet
4.114, Watkins Glen 1.859) **oder** nach Großstädten, wenn es Straßenkurse sind
(Las Vegas, Dallas, Long Beach, Miami, Barcelona). Gegenprobe an 20 echten
F1-Streckenorten: **16 sind in der Datenbank**; nicht gefunden nur Fawkham
(englischer Weiler), Aida (in Mimasaka aufgegangen) sowie zwei Schreibvarianten.

Deckel **300 je Land** (70 % Kleinorte / 30 % Städte). Reicht ein Eimer nicht,
füllt der andere auf — Korea (53 Kleinorte) und die Emirate (26) bekommen so
Städte in den Dorf-Eimer, statt eine halbleere Liste zu behalten.

## Nationsabdeckung: 30 → 56

`MOTORSPORT_NATION_BLEND` kennt **59 Nationen**, `CIRCUIT_NATION_KEY` hatte nur 30.
`_pickCircuitNation` verwarf jede Nation ohne Eintrag — **11,3 % aller
Kalender-Ziehungen liefen ins Leere**. Neu erschlossen sind 26 Länder, darunter
Polen, Rumänien, Ukraine, Dänemark, Norwegen, Irland, Estland, Thailand,
Kolumbien und die Elfenbeinküste.

Nicht aufgenommen: **Monaco** (per `EXCL` gesperrt), **Liechtenstein** (14 Orte)
und **Katar** (42) — zu dünn für einen eigenen Pool.

## Vier Fallen, die beim Bauen zugeschlagen haben

1. **`cities500` heißt nicht „500 Orte je Land"**, sondern „Orte ab 500 Einwohner" —
   und enthält trotzdem kleinere: Nürburg steht mit 169 drin. Eine erste Messung,
   die alles unter 500 ignorierte, verlor 22.649 Orte und hätte genau das Register
   verworfen, aus dem echte Streckennamen kommen.
2. **`pop = 0` heißt „unbekannt", nicht „klein".** China führt 12.578 solcher
   Einträge, Indonesien 8.792. Wer sie als Dörfer zählt, mischt Millionenstädte in
   den Kleinort-Eimer. Sie werden verworfen.
3. **Der osteuropäische Zeichensatz beginnt bei `Ą` (U+0104), nicht bei `Ā` (U+0100).**
   Ein Glättungsfilter, der bei `Ā` ansetzt, verschont genau die Makron-Zeichen aus
   der arabischen Umschrift, die er entfernen soll — `Khawr Fakkān` blieb stehen.
   Polnische und tschechische Diakritika (`Puławy`, `Dębica`) bleiben erhalten,
   sie sind echte Landessprache.
4. **„Höchstens zwei Wortteile" verwirft arabische Ortsnamen pauschal.** `Ras Al
   Khaimah` und `Al Ain City` fielen weg, die Emirate behielten 36 Orte. Jetzt sind
   drei Teile erlaubt, solange der Name unter 16 Zeichen bleibt.

Zusätzlich gefiltert: Ortstyp `PPLX` (Stadtteile wie Jumeirah, Ido-dong, Lingotto)
sowie verlassene und historische Orte, und **192 Namensvettern echter Strecken** —
ohne diesen Filter zöge der Generator irgendwann Monza oder Suzuka.

## Gewichtung der Nationen

Die Nationswahl war bereits gewichtet (`pickNationMotorsport` über
`MOTORSPORT_NATION_BLEND`), der **Notausgang** aber nicht: schlägt die gewichtete
Ziehung 40-mal fehl — was bei vollem Kalender die Regel ist, weil die großen
Nationen dann belegt sind — griff `pool[Math.random() * pool.length]`,
**gleichverteilt**. Mit 56 statt 30 Nationen wäre die Elfenbeinküste dort so
wahrscheinlich geworden wie Spanien. Der Notausgang zieht jetzt nach demselben
Gewicht.

Gemessen mit `tests/circuit-namegen.js`, 20.000 Ziehungen:

| | vorher | nachher |
|---|---|---|
| ESP : CIV, leerer Kalender | — | **11,7 : 1** |
| RUS : CIV, 12 große Nationen belegt | 1,0 : 1 | **6,0 : 1** |
| Straßenkurs zieht Stadt | — | **100 %** |
| permanenter Kurs zieht Kleinort | — | **99,8 %** |
| belegte Nation erneut gezogen | — | **nie** |

## Offen: Paket 8b

Die 26 neuen Nationen nutzen das Auffangregister `circuitPattern.intl` /
`racePattern.intl` — sprachneutral (`{loc} Circuit`, `Grand Prix of {loc}`), mit
denselben Ära-Gewichten wie die gemessenen Register aus v0.9.17.41. Landestypisch
fehlt Polen (`Tor {loc}`), Rumänien, die Ukraine und 23 weitere. Das ist **rein
sprachliche Arbeit**; die Datenseite ist fertig und ändert sich dadurch nicht.
