# Werksfahrer-Kaskade — Bauplan

Stand 30.08.2026, nach v0.9.17.25. Nutzer-Auftrag:

> „wenn ein team ohne werksfahrer dasteht, sollte es als fallback jeden privateer in
> werksfahrer umwandeln. aber nicht immer, eher eine kaskade, je wichtiger/stärker das team,
> desto seltener ist es dass ein team nur mit teilzeitfahrern fährt."

> „junge top-fahrer sind 1,2 jahre später plötzlich für immer sporadische fahrer. man könnte
> schauen dass diese bevorzugt eingesetzt werden. also zufriedenheit nutzen. ansehen wäre
> schwierig, da ansehen sich über jahre sammeln muss."

---

## 1. Die Messung, an der alles hängt

**Definition Stammfahrer:** bestreitet ≥ 80 % der Rennen, die **sein eigenes Team** in dieser
Saison gefahren ist. Bewusst relativ zum Team, nicht zum Kalender — ein Kleinstkonstrukteur
fährt fünf von sechzehn Rennen, und wer alle fünf fährt, ist sein Stammfahrer.

Werkzeug: `node tests/works-driver-reality.js [von] [bis]`, Spielvergleich mit
`--spiel <startjahr> <saisons>`. Referenz und Spielmessung stehen absichtlich in **einer**
Datei — zwei Skripte mit zwei Definitionen sind die häufigste Quelle einer Scheindifferenz.

Quelle: `f1db-json-splitted/f1db-seasons-entrants-drivers.json` (Runden je Fahrer,
Konstrukteur und Saison), Testfahrer ausgeschlossen.

### Anteil der Team-Saisons **ohne Stammfahrer**

| Größe (Lebenszeit-Starts) | real, alle Ären | real 1950–64 | Spiel 1950–64 |
|---|---|---|---|
| groß (200+) | **0,9 %** | 2,6 % | **18,4 %** |
| mittel (60–199) | 10,8 % | 26,7 % | 23,3 % |
| klein (20–59) | 11,5 % | 15,0 % | 40,0 % |
| winzig (<20) | 9,5 % | 9,2 % | 18,5 % |

Nach Dekade (alle Größen): 1950er 11,2 % · 1960er 7,6 % · 1970er 9,8 % · 1980er 6,1 % ·
ab 1990 praktisch null.

### Zwei Befunde, die den Bauplan bestimmen

1. **Im Spiel existiert die Kaskade überhaupt nicht.** Ein großer Konstrukteur steht mit
   18,4 % ohne Stammfahrer da, ein Kleinstkonstrukteur mit 18,5 % — identisch. In der
   Wirklichkeit trennen die beiden Welten um den Faktor 10.
2. **Die reale Kurve ist zweistufig, nicht vierstufig.** Winzig, klein und mittel liegen alle
   um 10 %; nur „groß" bricht auf ein Zehntel ein. Eine Regel mit **einer** harten Schwelle
   trifft die Daten besser als eine feine Abstufung.

---

## 2. Wo der Fehler entsteht

Die Kette am Saisonstart:

```
markPrivateers            → die zwei Schnellsten je Team sind Werksfahrer (isPrivateer=false)
assignPrivateerSchedules  → Werksfahrer: scheduledRaces = null (jedes Rennen)
                            Privatiers:  gezogene Rennzahl
  └─ DRIVER_STARTS-Block  → ÜBERSCHREIBT beide mit der REALEN Rennzahl des Fahrers
  └─ L1-Nachlauf          → beschneidet auf die realen Strecken DES TEAMS (TEAM_PRESENCE)
```

**Der DRIVER_STARTS-Block ist die Wurzel.** Er setzt für jeden Fahrer mit `histId` die real
gefahrene Rennzahl — auch für Werksfahrer. Ausgenommen sind nur `hasEarnedFullSeat(d)`
(letzter Karriere-Score ≥ 55) und `_homeOnlyCurated`. Waren **beide** Werksfahrer eines Teams
real Gaststarter, hat das Team am Ende keinen einzigen Stammfahrer — und niemand merkt es,
weil die Prüfung auf Team-Ebene fehlt.

**Wichtig für die Reihenfolge:** Der L1-Nachlauf verwandelt `scheduledRaces = null` in die
Streckenliste des Teams (`allowed.slice()`). Nach L1 hat **kein** Fahrer mehr einen offenen
Plan. Die Kaskade muss deshalb **nach L1** laufen und ihre Deckung **innerhalb von `allowed`**
vergeben — sonst überschreibt sie die realen Präsenzdaten.

⚠ **Bekannte Unsauberkeit aus v0.9.17.25:** `stabilizeConstructorPresence` setzt beim
Absturz-Schutz `chef.scheduledRaces = null`. Das läuft nach L1 und bedeutet dort „jedes
Rennen" — die Regel kann also die reale Präsenz überschreiben. Greift selten (nur beim
Absturz ≥80 % → ≤50 %), gehört aber im selben Paket auf `allowed` umgestellt.

---

## 3. Bauplan

### Stufe 1 — Team-Deckung als Nachlauf (der Kern)

Neue Funktion `enforceRegularDriverPerTeam(teams, drivers, races, year)`, aufgerufen als
**letzter Schritt in `assignPrivateerSchedules`, nach dem L1-Nachlauf.**

Je Team mit ≥ 1 aktivem Fahrer und ohne Indy-Bindung:

1. `programm` = Streckenliste des Teams (die `allowed`-Menge aus L1; ohne L1-Daten der volle
   Kalender).
2. Gibt es einen Fahrer mit ≥ 80 % von `programm`? → fertig, nichts tun.
3. Sonst **ein Wurf je Team und Saison** (`t._deckungRoll`, `t._deckungYear` — nach dem
   Muster von `_smallCtorRoll`; ein Wurf je Aufruf würde die Entscheidung zittern lassen,
   siehe v0.9.16.10).
   - `roll < SCHWELLE[klasse]` → das Team darf ohne Stammfahrer fahren, nichts tun.
   - sonst → Kaskade (Stufe 2) befördert einen Fahrer auf `programm`.

**Klassen und Startwerte für `SCHWELLE`.** Klasse aus den vorhandenen Mengen
`CONSTRUCTOR_TINY` / `CONSTRUCTOR_SMALL`, alles übrige = groß.

| Klasse | Zielrate „ohne Stammfahrer" | Startwert `SCHWELLE` |
|---|---|---|
| groß | 1 % (modern) bis 3 % (klassisch) | 0,15 |
| alle übrigen | 10 % | 0,50 |

Die Startwerte sind **Schätzungen aus dem Verhältnis Ziel/Ist** und werden nach der ersten
Messung nachgezogen. Nicht vorab feinjustieren — messen.

Ära-Zuschlag: ab 1990 liegt die reale Rate bei null. Für `year >= 1990` gilt `SCHWELLE = 0`
in allen Klassen (immer decken).

### Stufe 2 — Wen befördern (die Kaskade im engeren Sinn)

Reihenfolge der Kandidaten innerhalb des Teams:

1. **`hasEarnedFullSeat(d)`** — bewährt, existiert bereits.
2. **Frische Form / Zufriedenheit** — der Hebel des Nutzers für die abgerutschten Jungstars,
   siehe Stufe 3. Ausdrücklich **nicht Ansehen**: das sammelt sich über Jahre, und genau die
   hat ein Fahrer nicht, der ein Jahr oben war.
3. **Pace** als letzte Instanz.

Der Beförderte bekommt `scheduledRaces = programm.slice()`. `_homeOnlyCurated` und
`homeOnly` bleiben unangetastet — dort ist die Strecke geprüfte Wahrheit, nicht nur die Zahl.

Ist das Team ein Kleinstkonstrukteur mit Teamplan, ist `programm` genau dieser Teamplan — die
Beförderung macht aus einem Gaststarter also den Stammfahrer einer Teilsaison, nicht einen
Vollzeitfahrer. Das ist der Punkt der Definition.

### Stufe 3 — Der abgerutschte Jungstar

`hasEarnedFullSeat` liest **nur den letzten** Karriere-Score:

```js
const letzte = cs[cs.length - 1];
return letzte.score >= 55;
```

Damit verliert ein Fahrer den Status sofort nach einer schwachen Saison — und weil ohne
Vollzeit-Sitz kaum ein starker Score entsteht, kommt er nie zurück. **Das ist die Mechanik
hinter „1,2 Jahre später für immer sporadisch".**

Änderung: der Status gilt für **zwei bis drei Saisons nach** einem starken Jahr weiter,
etwa über ein Feld `d._bewaehrtBis = jahr + 2`, gesetzt sobald ein Score ≥ 55 erreicht wird.
`hasEarnedFullSeat` prüft dann `score >= 55 || year <= d._bewaehrtBis`.

⚠ Ausdrücklich **keine Erfolgsgarantie** — Nutzer: „ob er dann bei weiteren volleinsätzen
(egal ob er wechselt oder nicht) liefert, ist nicht garantiert." Die Regel vergibt eine
zweite Chance auf einen Sitz, nicht Leistung. Wer sie nicht nutzt, rutscht danach ab.

### Stufe 4 — Aufräumen

`stabilizeConstructorPresence` auf `allowed` statt `null` umstellen (siehe ⚠ oben).

---

## 4. Abnahme

| Prüfung | Kriterium |
|---|---|
| `tests/works-driver-reality.js --spiel 1950 15` | groß ≤ 5 %, übrige 8–15 % |
| `tests/works-driver-reality.js --spiel 1975 15` | groß ≤ 3 % |
| `tests/mc-entries-dnq.js 1950 5 --saisons=8` | **DNQ und Meldungen unverändert** |
| `tests/constructor-presence.js 1950 20` | Aussetzer 0, Absturzrate ≈ 1,5 % |

**Die dritte Zeile ist die wichtige.** Genau hier scheiterte v0.9.16.8: der Versuch
„Werkssitz = ganze Saison" ließ 1955 die DNQ von 2,5 auf 5,3 springen und wurde
zurückgenommen. Gemessen an F1DB fährt ein Werksfahrer **in keiner Dekade** verlässlich die
ganze Saison — die Spanne liegt zwischen 52 % und 87 %.

Der Unterschied dieses Plans zu v0.9.16.8: dort wurde **jedem** Werksfahrer die volle Saison
gegeben. Hier bekommt **ein** Fahrer je Team das **Programm seines Teams** — und nur dann,
wenn sonst gar kein Stammfahrer da wäre. Die Zahl der Meldungen soll sich dadurch kaum
ändern, nur ihre Verteilung auf die Fahrer.

---

## 5. Fallen

- **Lebenszeit-Starts immer über alle Jahre**, nie über das Zeitfenster — sonst verschieben
  sich die Größenbänder mit dem Aufruf und Ferrari fällt in 1950–64 von „groß" nach „mittel".
- **Ein Wurf je Team und Saison**, nicht je Aufruf. Sonst zittert die Entscheidung, wie es
  der Kleinstkonstrukteur-Wurf vor v0.9.16.10 tat (Werksfahrer-Anteil schwankte zwischen
  35 % und 81 % bei einem realen Wert von 66 %).
- **Nach L1, nicht davor.** Davor beschneidet L1 die eben vergebene Deckung wieder.
- **Echte Ausstiege sind kein Absturz** — beim Messen nur Teams zählen, die im Folgejahr noch
  im Feld stehen. Sonst gilt Alfa Romeo 1952 als Aussetzer.
- **`h.teams` ist ein schweres Feld** und im Speicher oft leer; Teamnamen aus der
  Wertungszeile lesen.

---

## Offen, nicht Teil dieses Pakets

- **Nicht-Teilnahme aus der Realität statt aus dem Spielstand** (Nutzer-Punkt 1): L1 ist heute
  nur eine **Obergrenze** — sagt `TEAM_PRESENCE` „volle Saison", erlaubt L1 alle Rennen,
  zwingt aber niemanden hin. Die Untergrenze braucht die Kaskade als Träger, deshalb kommt sie
  danach.
- **Protos meldet zu viel** (11 Fahrer 1967 gegen real einen Wagen in zwei Rennen).
- **UI-Update der Rennergebnisse-Matrix** bei Fahrern und Teams.
