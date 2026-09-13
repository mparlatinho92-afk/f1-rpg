# ZIELFLAGGE — Befunde zur Fahr-KI

*Stand 13.09.2026. Vor jeder Arbeit an Fahrlinien, Abstandsregeln oder Kollisionen lesen.*

Dieses Dokument hält fest, was an der Fahr-KI **gemessen** wurde — nicht was geplant ist.
Es gibt drei Sorten Eintrag: **geltende Regeln** mit ihrer Begründung, **verworfene
Versuche** mit den Zahlen, die sie widerlegt haben, und **Messfallen**, die schon Zeit
gekostet haben. Der Grund für die Form: mehrere dieser Punkte wurden im Lauf der
Entwicklung zwei- und dreimal neu ausprobiert, weil die Gegenmessung nirgends stand.

---

## Messwerkzeuge

| Datei | Zweck |
|---|---|
| `test-lieferung.js` | **Der Rahmen-Wächter.** Platzverschiebung gegen das Drehbuch, muss unter 4 Plätzen bleiben |
| `test-zweikampf.js` | Querbewegung, Zittern, Kollisionsfreiheit, Start |
| `test-hindernis.js` | Stehendes Hindernis, Auslaufzone, Lückensuche |
| `test-linien.js` | Kurvenschneiden, Schikanen, Alternativen |
| `test-freihand.js` | Rechnet eine **handgezeichnete** Linie aus einem Bild zurück und vergleicht sie in Metern mit `LINIEN[0]` |
| `test-dreher-cache.js` | Dreher, Cache — und die **Startgerechtigkeit** |

Alle nutzen `test-hilfe.js` (fester Zufallssamen). Ohne den tastet jeder Lauf ein anderes
Rennen ab, und dieselbe Prüfung ist mal grün, mal rot.

---

## Geltende Regeln

### Ein Bogen, ein Scheitel
Innerhalb eines durchgehenden Bogens geht die Linie nur nach innen, danach nur nach außen.
Nutzer: *„im selben kurvenradius erst nach links und nach rechts lenken ist unnötig."*

Gemessen war das verletzt: in einem Linksbogen (Punkt 191–231) wich die Linie zweimal um
1,3–1,4 m nach außen zurück. Ursache ist die Ausgangsform — sie entsteht als Bandpass der
Krümmung, und in einem langen Bogen schwankt die Krümmung leicht (−0,31 … −0,57 … −0,33);
der Bandpass macht daraus Querversatz. `einBogenEineRichtung` erzwingt die Regel.

⚠ **Die Korrekturrichtung entscheidet.** Der Rückzieher wird nach INNEN gezogen, nicht die
Anfahrt nach außen aufgemacht — sonst verliert man genau das Anschneiden.

### Alternativen sind Scheitelvarianten, keine Parallelspuren
Aus den Lehrbildern in `Ideallinie/`: eine Alternative ist **dieselbe Linie mit
verschobenem Scheitel**. Die Linien kreuzen sich und laufen am Randstein zusammen.
`LINIEN[1]`/`[2]` entstehen aus `scheitelVersatz` +7/−4.

Vorher hatten alle drei denselben Scheitel (Punkt 212) — es waren gar keine Varianten.

Kosten neu gemessen: +23 m früher **+0,10 s**, +10 m früher −0,17 s, −10 m später +0,42 s,
−23 m später +1,69 s. Früher scheiteln ist fast gratis, später teuer.

### Folgen heißt Annäherung rechnen, nicht Abstand
`v = √(v_vorn² + 2·a·Puffer)` mit 60 % der Verzögerung. Vorher fing das Bremsen erst unter
`KI_ABSTAND` an und nahm 1,8 m/s je fehlendem Meter — wer mit 5 m/s Überschuss auflief,
hatte danach 0,2 s bis zur Berührung.

⚠ Der Wunschabstand **muss mit dem Tempo wachsen** (3 m im Stand + 0,15 s, gedeckelt bei
9 m). Fest auf 9 m liefert die Wurzel am Start exakt null: der Vordermann steht, auf dem
Grid steht jeder näher als 9 m — das ganze Feld darf dann nicht losfahren.

### Wenn seitlich kein Platz ist, nimmt der Hintere längs zurück
Die Bremsregel schaut nur auf Wagen in der eigenen Spur (2,2 m). Wer genau 2,0 m daneben
fährt, gilt nicht als Vordermann — also bremste niemand füreinander und man blieb
nebeneinander, bis es kracht. Alle gemessenen Treffer in Kurve 1 sahen so aus:
0,8–3,6 m längs, 1,8–2,3 m quer.

⚠ Zurückgenommen wird auf das Tempo des **Nachbarn**, nicht auf „eigenes minus X". Ein
Abzug vom eigenen Tempo senkt das Ziel in jedem Bild weiter und heißt am Start schlicht
stehenbleiben (gemessen: Autopilot bewegte den Wagen 2,97 m in zwei Sekunden).

### Freier Korridor statt Summe über alle Nachbarn
Jeder Nachbar verengt den erlaubten Querbereich von seiner Seite; die geforderte Lücke
wächst erst, wenn er näher kommt, und ist am Fensterrand null.

⚠ **Keine Summe.** Daran ist die erste Fassung gescheitert: die Menge der Nachbarn wechselt
von Bild zu Bild, und mit ihr sprang die Summe — das war das Zittern. Eine Schranke
springt nicht, solange ihre Forderung am Fensterrand auf null zurückgeht.

### Stehendes Hindernis: Asphalt zuerst, Auslaufzone zuletzt
Ein Hindernis ist ein Wagen, der **quer steht UND langsam ist**. Nur „quer" reicht nicht
(ein Streifschuss dreht kurz an, ohne zu bremsen), nur „langsam" auch nicht (wer langsam
ist, weil er hinter jemandem steht, ist eine Schlange — da reiht man sich ein; mit dieser
Lesart sprang die Abweichung vom Drehbuch von 3,3 auf 5,5 Plätze).

Die Lücken werden über **alle** Stehenden aufgestellt, nicht nur den nächsten. Genommen
wird die, die noch auf den Asphalt passt.

Crash-Wahrscheinlichkeit: 0,12 hoch der Zahl der schon Beteiligten — 12 %, 1,4 %, 0,2 %.
Die Entscheidung fällt **einmal je Begegnung**; bei dreißig Bildern je Sekunde käme sonst
immer der Einschlag heraus.

### Eine Physik für beide
`BESCHL` gilt für Spieler und KI. Seit 13.09. auch der **Luftwiderstand** (`0,02·v²`) — er
stand nur in `updatePlayer`, die Gegner beschleunigten flach. Ebenso zahlt bei einer
Berührung Spieler↔KI jetzt auch der Gegner Tempo; bei KI↔KI war das schon so.

---

## Verworfene Versuche (nicht noch einmal probieren)

| Versuch | Ergebnis |
|---|---|
| Wunschabstand in **Sekunden** statt Metern (0,35 s = 16 m bei 45 m/s), um das Feld am Start auseinanderzuziehen | Gegenteil: die größere Forderung verstärkt die Bremswelle nach hinten. Dreher 20 → **43**, und sie wandern die Gerade hinauf |
| Startversatz **verzögert** schmelzen lassen, damit die Zusammenführung als Welle nach hinten läuft | Nur verteilt: 48 leichte statt 26 schweren Drehern, dieselben 15 betroffenen Wagen |
| **Restversatz im Scheitel** (30 %, also 0,75 m), damit das Feld dort nicht auf einer Spur fährt | 17 statt 15 betroffene Wagen, und weicht die Scheitelvarianten wieder zu Parallelspuren auf |
| Ausweich-Zweig mit `return` verlassen | Der Ausweichende ignoriert seine Nachbarn für die ganze Anfahrt, berührt sie, sie drehen sich und werden selbst zu Hindernissen. Abweichung 3,3 → 6,3 Plätze |
| Seitenwahl nach dem meisten Platz **bis zur Außengrenze** | Schickt Wagen ins Gras, obwohl innen zwölf Meter Asphalt frei sind |
| Bedingung „ich muss viel schneller sein als er" für die Hinderniserkennung | Schaltet die Erkennung genau dann ab, wenn der Wagen hinter dem Block schon langsam ist. Alle hielten davor an |
| Ideallinie zur Modell-Bestzeit hin mischen (`misch` < 1) | Das Zeitmodell kennt weder Abtrieb noch Reifenlast und bevorzugt eine mittige Linie. Es hat dreimal in die falsche Richtung gezeigt; `misch = 1.0` gilt |

---

## Messfallen

Diese Fehler stecken in der **Messung**, nicht im Code — sie haben mehrfach zu falschen
Schlüssen geführt.

- **Luftlinie statt Längsabstand.** Auf dieser Strecke laufen Abschnitte dicht aneinander
  vorbei. Per Luftlinie steht ein Wagen auf der Nachbargeraden scheinbar 11 m neben dem
  Hindernis. Immer `laengsAbstand` benutzen.
- **Ausgefallene Wagen mitgezählt.** Sie werden auf `trackHalfWidth()+2,5` geparkt, also
  bei **genau 10,0 m** — mitten in der Auslaufzone. Wer sie mitzählt, hält das Abstellen
  für ein Ausweichmanöver.
- **Höchstwerte über den ganzen Lauf.** Über 40 Sekunden fährt jeder mehrere Runden, und
  irgendwo dreht sich immer jemand. Fremde Zwischenfälle landen so in der Statistik der
  untersuchten Stelle.
- **Nachlauf.** `cm.seitlich` schwenkt über rund eine Sekunde zurück. Eine Querlage sagt
  also nichts darüber, ob der Wagen GERADE ausweicht — dafür `cm.ausweichFuer` prüfen.
- **Dreher sind bis `GRID_FADE_S` unterdrückt** (`drehErlaubt`). Senkt man die Konstante,
  werden Berührungen sichtbar, die vorher schon passierten. Das ist kein neuer Fehler.
- **Prozentzahlen sagen nichts über das Bild.** „42 % der Innenseite" sind auf einer 15 m
  breiten Bahn 2,6 m, also fünf Pixel in der Draufsicht. Eine Kurve groß rendern.
- **Zusätzliche `Math.random()`-Aufrufe verschieben den ganzen Samen.** Eine neue
  Würfelstelle ändert jedes spätere Rennen, auch wenn sie selbst harmlos ist.

---

## GELÖST 13.09.2026: Startgerechtigkeit und Kurve 1

Beide hingen an **zwei** Fehlern, keiner davon in der Beschleunigung.

### 1. Zwei Bezugssysteme, die vermischt wurden
Während der Startphase liegt die **Planposition** eines Gegners (`cm.fortschritt`) bis zu
70 m vor der Stelle, an der sein Wagen **gezeichnet** wird — der Aufstellungsversatz wird
erst auf `planU` aufgeschlagen. Der Spieler dagegen lebt immer in der gezeichneten Welt
(`player.frac` kommt aus seiner echten Position).

Alle Längsvergleiche rechneten im Plan. Folge:

- Am Start stehen alle 26 Wagen im Plan auf **demselben Punkt**. `dl` war damit rund null
  und fiel durch die Prüfung `dl > 0`: **kein Gegner sah einen anderen.** Das ganze Feld
  beschleunigte ungehindert auf exakt dieselben 38,9 m/s und pflügte durch alles, was
  wirklich dort stand.
- Den Spieler sahen sie erst recht nicht und fuhren ihn von hinten um: er beschleunigte
  sauber auf 31 m/s und stand 1,5 s später bei 3 m/s, mit Kontakt in 50 von 180 Bildern.

Korrigiert in `fahreGegner` (Gegner und Spieler), `waehleLinie` und `freiAuf`: alle
vergleichen jetzt über `laengsAbstand` auf `uVor`/`planU` — dieselbe Welt, in der auch die
Kollisionen stattfinden.

### 2. Die Schonfrist galt nur für die KI
`gegnerKollisionen` überspringt **Tempoverlust und Dreher**, solange `raceClock <=
GRID_FADE_S` läuft: in der Startphase schmilzt der Aufstellungsversatz weg, und die
Berührungen dabei sind ein Artefakt der Darstellung, kein Fahrfehler.

Beim Spieler war nur der **Dreher** so abgesichert (`drehErlaubt`), der **Tempoverlust**
nicht. Er zahlte also in genau dem Fenster, in dem die KI nichts zahlt — 23,5 m/s gegen
35,2 im Feld nach drei Sekunden, obwohl er bis 36,5 beschleunigt hatte. Jetzt gilt
dieselbe Frist für beide.

### Ergebnis
Kurve 1 von **52 auf 22 Dreher** je Minute, und nicht mehr dort geballt: 6 in Kurve 1,
6 an anderer Stelle, der Rest verteilt — normaler Rennkontakt statt Karambolage.
Spieler nach 3 s 38,9 m/s, Feld-Median 35,3. Alle 18 Tests grün.

### Weiteres Verworfenes aus diesem Durchgang

| Versuch | Ergebnis |
|---|---|
| Den **Gegner mitschieben** bei Spieler-Kontakt, wie `gegnerKollisionen` es zwischen zwei Gegnern tut | Durchweg schlechter: 15,4 m/s (quer + längs), 9,0 m/s (nur quer) gegen 23,5 ohne. Längs schieben liest sein Regler als Rückstand zum Plan und beschleunigt mit bis zu +9 m/s dagegen, also direkt wieder hinein |
| Dem Spieler die Überdeckung **halbieren** (`tiefe *= 0.5`) | Er bleibt länger im Gegner stecken und verliert mehr Tempo statt weniger: 13,8 statt 23,5 m/s |

### Messfalle, die dabei auffiel
**`raceClock` vorspringen lassen und ein Bild rechnen simuliert nichts.** `test-autopilot`
sprang 1,3 s vor und rief `updateAICars` einmal auf — der Wagen bewegt sich je Bild aber
nur 3,7 % auf sein Querziel zu (`dt*2.2`). Solange der Spieler am Start langsam war, stand
er zufällig noch auf der Bahn und die Prüfung ging durch. Jetzt werden die 78 Bilder
wirklich gefahren.
