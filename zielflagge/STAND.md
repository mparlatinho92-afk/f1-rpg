# ZIELFLAGGE — Stand bei der Pause

*Arbeit pausiert am 14.09.2026. Letzter Commit: `1797004`.*

Dieses Dokument ist die **Übergabe**: was ZIELFLAGGE ist, wie es gebaut ist, was
funktioniert, was offen ist und wo die Hebel sitzen. Es setzt keinen Chatverlauf voraus.

Zwei Dokumente daneben:
- **`BEFUNDE.md`** — die gemessenen Erkenntnisse zur Fahr-KI und zu den echten Strecken,
  einschließlich der **verworfenen Versuche mit den Zahlen, die sie widerlegt haben**, und
  der Messfallen. *Vor jeder Arbeit an Fahrlinien, Abstandsregeln, Kollisionen oder
  Streckendaten lesen.*
- **`HERKUNFT.md`** — der Chatverlauf, aus dem ZIELFLAGGE ursprünglich entstand.

---

## Was es ist

Ein eigenständiges 3D-Rennspiel in `zielflagge/`, das die Rennsimulation des F1 RPG
fahrbar macht. Es läuft ohne Server, ohne Abhängigkeiten, per Doppelklick auf
`index.html`.

**Architektur, vom Nutzer gesetzt:** `simulateRace()` ist der äußere Rahmen; darin liegen
Sofort-Sim, Live-Ticker und ZIELFLAGGE als drei Darstellungen desselben Rennens.
ZIELFLAGGE ist dabei der **manipulative Modus**:

> „im endergebnis ist es egal ob es sofort-sim, zielgerade oder live-ticker war. der weg
> dahin ist entweder gescriptet oder gescriptet und manipulation kämpfen gegeneinander."

Die **Lieferung** (`state.lieferung`) bringt Strecke, Runden, Startfeld und das gerechnete
Ergebnis mit. Das Ergebnis ist der **Rahmen**, nicht die Schiene: die Wagen fahren selbst,
und was dabei herauskommt, *ist* das Ergebnis. Gemessen weicht das Rennen im Schnitt um
rund **2 Plätze** vom Drehbuch ab — `test-lieferung.js` wacht darüber, dass es unter 4
bleibt.

---

## Dateien

| Datei | Größe | Zweck |
|---|---|---|
| `index.html` | 202 KB | das Spiel: Szene, Physik, KI, Oberfläche |
| `three.min.js` | 589 KB | Three.js, lokal eingebunden (kein CDN) |
| `strecken-daten.js` | 234 KB | 78 Strecken, 160 Ausbaustufen, 71 Längen — **erzeugt** |
| `colors.js` | 28 KB | Livery-Tabellen — **erzeugt** |
| `wagen.js` | 18 KB | 11 Ära-Wagenmodelle, prozedural |
| `strecken.js` | 17 KB | SVG-Pfad → Mittellinie in Metern |
| `build-strecken-daten.js` | 2 KB | erzeugt `strecken-daten.js` aus `../data/` |
| `build-colors.js` | 2 KB | erzeugt `colors.js` aus `../index.html` |

Das Spiel lädt **1,09 MB**. Die erzeugten Dateien nicht von Hand editieren — Build-Skript
erneut laufen lassen.

⚠ Die Version von Three.js lässt sich aus der minifizierten Datei nicht auslesen (sie
enthält kein `REVISION`-Feld). Wer sie braucht, muss gegen einen bekannten Bau vergleichen.

---

## Was funktioniert

**Hin- und Rückweg zum RPG.** Import eines echten Spielstands (NDJSON), Auswahl des
Fahrers, Export des gefahrenen Ergebnisses zurück.

**Fahren.** Selbst oder Autopilot, jederzeit umschaltbar; der Wechsel zur Hand hat drei
Sekunden Countdown. Die Modus-Plakette in der Leiste sagt eindeutig, wer fährt.
Geschwindigkeitsstufen 1× / 2× / 5× / 10×, **selbst fahren immer 1×**.

**Fahrphysik.** Eine Physik für Mensch und KI: dieselbe Beschleunigung, derselbe
Luftwiderstand, dieselbe Haftgrenze `v = √(GRIP·R)`. Bremspunkte entstehen daraus von
selbst, sie sind nirgends hinterlegt.

**Fahrlinien.** Drei Linien, gebaut als *Scheitelvarianten* (früh / geometrisch / spät) —
keine Parallelspuren. Ein Bogen hat genau einen Scheitel. In Schikanen wird durchgezogen.

**Zweikämpfe.** Korridor-Regel statt Summenkraft (die war das Zittern), Linienwechsel mit
Prüfung, ob die Ziellinie frei ist, Notbremsung vor dem Auffahren (90 % Trefferquote),
stehende Hindernisse werden umfahren — über die Auslaufzone, wenn kein Asphalt frei ist.
Crashs sind möglich, aber mit jedem zusätzlich Beteiligten unwahrscheinlicher (0,12ⁿ).

**Echte Strecken.** 78 Strecken aus `data/circuit-layouts.js`, jahresgenau die richtige
Ausbaustufe, frei wählbar in der Leiste. Karte oben rechts mit Umriss, Start/Ziel,
Richtungspfeil, Länge und den Wagen als Punkte.

---

## Wie man es prüft

**19 Tests**, alle mit Playwright gegen die echte Seite, bei der Pause **alle grün**.
Einzeln laufen lassen mit `node zielflagge/test-<name>.js`. Dazu zwei Dateien, die keine
Tests sind: `test-hilfe.js` (fester Zufallssamen, von allen benutzt) und `test-freihand.js`
(Werkzeug, rechnet eine handgezeichnete Linie aus einem Bild zurück).

Die vier wichtigsten:

| Test | wacht über |
|---|---|
| `test-lieferung.js` | **Die Lieferung bleibt der Rahmen** (< 4 Plätze Abweichung) |
| `test-zweikampf.js` | Querbewegung, kein Zittern, keine Durchdringung, Start |
| `test-linien.js` | Kurvenschneiden, Schikanen, Alternativen — mit Bildern |
| `test-strecken.js` | Alle 160 Layouts wandelbar, Längen, Jahr → Stufe |

⚠ Alle nutzen `test-hilfe.js` mit **festem Zufallssamen**. Ohne den tastet jeder Lauf ein
anderes Rennen ab und dieselbe Prüfung ist mal grün, mal rot. Wer eine neue
`Math.random()`-Stelle einbaut, verschiebt den ganzen Samen — Vergleiche vorher/nachher
sind dann nicht mehr gültig.

---

## Die Stellschrauben

Alle in `index.html`, alle mit Begründung im Kommentar. Wer hier dreht, soll vorher
`BEFUNDE.md` lesen — mehrere dieser Werte sind das Ergebnis mehrfacher Fehlversuche.

| Konstante | Wert | was sie tut |
|---|---|---|
| `GRIP` | 30 | Querbeschleunigung; bestimmt alle Kurventempi |
| `TOP_TEMPO` | 53 | Höchsttempo-Basis (mit mittleren Werten ~63 m/s) |
| `BESCHL` | 32 | Beschleunigung, **für Mensch und KI dieselbe** |
| `KI_BREMS` | 26 | Verzögerung; Basis der Vorausschau |
| `KI_ABSTAND` | 9 | Wunschabstand zum Vordermann |
| `TRACK_WIDTH` | 15 | Bahnbreite |
| `AUSLAUF_AUSSEN/INNEN/GERADE` | 22 / 2,5 / 9 | Auslaufzonen; innen bewusst fast nichts |
| `GRID_FADE_S` | 10 | Startversatz schmilzt über diese Zeit — **und bis dahin sind Dreher und Tempoverlust unterdrückt** |
| `HINDERNIS_TEMPO/SICHT` | 3 / 25 | wann ein Wagen als stehendes Hindernis gilt |
| `AUSWEICH_FEHLER` | 0,12 | Grundwahrscheinlichkeit, dass Ausweichen misslingt |

---

## Offen — nach Aufwand sortiert

### 1. Der 80er/90er-Look (am schwersten)
Das Ziel des Nutzers: ein Rennspiel wie Crammond/Papyrus. Schwer nicht wegen der Menge,
sondern weil es als Einziges **kein Maß hat** — jeder andere Punkt ließ sich an einer Zahl
entlangbauen. Die Strecke ist heute ein Band mit Rändern: keine Streckenobjekte, keine
Lichtstimmung, keine Texturen.

### 2. Baukasten-Streckeneditor
Der meiste Code, aber überschaubares Risiko. Zeichnen und Speichern ist Fleißarbeit; der
Aufwand steckt in der **Prüfung**, ob eine Strecke fahrbar ist: kein Selbstschnitt,
Mindestradius gegen `GRIP`, geschlossene Schleife, genug Gerade vor der Linie.

### 3. Start/Ziel je Strecke festlegen
Der Mechanismus steht (`STRECKE_START`, Pfeile unter der Karte), die Tabelle ist leer.
Start/Ziel **lässt sich aus den Rohdaten nicht ableiten** — Begründung mit Zahlen in
`BEFUNDE.md`. Wer eine Strecke falsch findet, stellt sie in der Karte ein und trägt den
Wert fest ein.

### 4. Längen je Ausbaustufe
`STRECKE_STUFEN_KM` hat 11 nachgerechnete Einträge (Silverstone ×8, Spielberg ×3). Alle
anderen Stufen außer der jeweiligen Bezugsstufe sind geschätzt — die Karte schreibt ein
`~` davor. Sieben Strecken fehlen ganz, weil `CIRCUIT_LENGTHS` sie nicht kennt:
Hockenheim, Interlagos, Monaco, Monza, Nürburgring, Paul Ricard, Spa — genau die mit den
größten Umbauten.

### 5. Ära-Abhängigkeit der Wagen
Die echten Strecken haben es sichtbar gemacht: die optimale Runde liegt bei **89 s für
Silverstone 1950** und **117 s für 2015** — real waren es rund 110 bzw. 92 s, also genau
andersherum. `TOP_TEMPO` und `GRIP` sind ära-neutral; die Wagen von 1950 fahren im Modell
so schnell wie die von heute.

### 6. Größe
1,09 MB, davon `three.min.js` 589 KB (54 %) und die Streckendaten 234 KB (21 %). Die
Streckendaten lassen sich **nicht** durch Runden verkleinern (die SVG-Pfade sind relativ
aufgebaut, siehe `BEFUNDE.md`). Der eigentliche Hebel wäre ein abgespeckter Three.js-Bau.

### 7. Name
„ZIELFLAGGE" ist ein Arbeitstitel und steht in der Konstante `APP_NAME` — umbenennen ist
ein Einzeiler, Ordner und Datei umbenennen kostet extra.

---

## Regeln des Nutzers, die hier gelten

- **Die Lieferung ist der Rahmen, nicht die Schiene.** Das Ergebnis darf sich im Rennen
  verschieben — aber in Grenzen.
- **Eine Physik für alle.** „Wer sich am Start überholt fühlt, hat dann recht, ohne dass
  es an ihm liegt."
- **Ausweichen eines Objekts, das im Weg steht, ist Pflicht.**
- **Selbst fahren ist immer Echtzeit** (1×), egal welche Stufe die Simulation läuft.
- **Gespeicherte Stände werden nie rückwirkend umgeschrieben.**
