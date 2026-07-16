# Analyse-Skripte — Namens-Kapazität & Nationen-Bedarf

Reproduzieren die Zahlen aus `../pyramid-300kart-nation-demand.md` und
`../capacity-and-compression.md`. **Vor Namens-/Kapazitätsarbeit hier laufen lassen,
statt neu zu rechnen.**

| Datei | Zweck |
|---|---|
| `nation-demand.js` | **Hauptskript.** Ist-Pool vs. Bevölkerung vs. Bedarf, alle 51 Nationen |
| `pop-eff.js` | Bevölkerungs-Baseline aus den Roh-CSVs (streamend, O(1) Speicher) |
| `topk.js` | Top-K-Counts je Land → für eff(K)-Kurven („welcher Cap bringt welche Vielfalt") |
| `pop-sur.json` / `pop-fore.json` | **Ergebnis von `pop-eff.js`, eingecheckt.** 18 KB, spart ~6 min Streaming über 608 MB |

## Sofort lauffähig (braucht nur das Repo)

```
node nation-demand.js                 # Default: 648 Sitze, 500 Jahre, tenure 6
node nation-demand.js 11372 500 6     # Gegenprobe: Population-überall, 300 Kartserien
```

## Braucht die Roh-CSVs (gitignored, lokal in `../../F1 RPG Namenslisten & Namensgeneratoren/`)

`surnames.csv` 382 MB · `forenames.csv` 226 MB — Kaggle
„forenames-and-surnames-with-gender-and-country", aggregiert aus
philipperemy/name-dataset (491.655.925 Records, 106 Länder). Schema `name,gender,country,count`.

```
# Bevölkerungs-Baseline neu erzeugen (nur nötig, wenn die Quelle wechselt)
node pop-eff.js "../../F1 RPG Namenslisten & Namensgeneratoren/surnames.csv"  pop-sur.json  ALL
node pop-eff.js "../../F1 RPG Namenslisten & Namensgeneratoren/forenames.csv" pop-fore.json M

# eff(K)-Kurven für die Cap-Frage (Top-6000 je Land, ~1,7 MB Output → NICHT einchecken)
node topk.js "../../F1 RPG Namenslisten & Namensgeneratoren/surnames.csv"  top-sur.json  ALL 6000
node topk.js "../../F1 RPG Namenslisten & Namensgeneratoren/forenames.csv" top-fore.json M    6000
```

## Die drei Fallstricke (alle schon einmal zugeschlagen)

1. **Effektive statt roher Poolgröße.** Simpson `1/Σp²`. GBR: 1.322 Nachnamen verhalten
   sich wie **437**, weil Smith (w=100) gegen ~830 weight-1-Tails steht. Mit Rohzahlen zu
   rechnen führt systematisch in die Irre.
2. **`NAME_TAILS_BY_NATION` wird erst zur Laufzeit gemerged** (`ensureNamePoolsMerged`,
   `index.html` ~L4991, Gewicht 1, `first` nur in mid+modern). Wer nur
   `NAME_POOLS_BY_NATION` zählt, sieht ~490 Nachnamen statt 1.322 und hält v4 (Variante B,
   v0.9.14.71) fälschlich für ungebaut.
3. **`DECADE_NATION_POOLS` (~L4839, `{weights:{...}}`-Wrapper) und `MOTORSPORT_NATION_BLEND`
   (~L4877, flach) liegen 38 Zeilen auseinander.** Ein großzügiges Slice ab der einen erwischt
   die 2020er-Zeile der anderen. `nation-demand.js` nutzt deshalb exakte Klammer-Grenzen.
   Die Junior-Welt zieht aus dem **Blend** (via `pickNationMotorsport`), nicht aus dem F1-Pool.

## Und der konzeptionelle Fallstrick

`perYear = Sitze / Verweildauer` ist nur eine **grobe Näherung**. In einem echten Trichter mit
Beförderung entstehen neue Fahrer **nur beim Eintritt** — F3 und F1 erzeugen null frische.
Das Hauptskript kann das nicht wissen (es kennt keine Ebenen) und warnt deshalb im Kopf.
Die ebenenweise Rechnung steht in `../pyramid-300kart-nation-demand.md`; die belastbaren
Fluss-Parameter liefert **Paket H** (`../../../paketH-pyramide/BRIEF.md`).
