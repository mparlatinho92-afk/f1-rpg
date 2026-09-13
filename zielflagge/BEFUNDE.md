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
| `test-dreher-cache.js` | Dreher, Cache — und die **Startgerechtigkeit** (siehe „Offen") |

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

## OFFEN: Startgerechtigkeit

**`test-dreher-cache.js` ist rot** — bewusst so eingecheckt, nicht übersehen.

Gemessen nach 3 Sekunden Vollgas: Spieler **23,4 m/s**, Gegner **38,9 m/s**. 38,9 ist der
physikalisch richtige Wert (Beschleunigung 32 gegen Luftwiderstand 0,02·v² ergibt eine
Grenze von 40 m/s). Der Spieler bleibt zurück, weil er im Startgetümmel wirklich anstößt.

**Die Wurzel:** die Startaufstellung hat zwei Spalten. In den Augen der KI liegt der
Nachbar in der anderen Spalte 6 m seitlich entfernt — mehr als die 2,2 m der
Vordermann-Prüfung. Die Gegner fahren am Start also durch das Feld, als wäre es leer, und
werden von niemandem aufgehalten. Nur der Spieler kollidiert physisch.

Vorher war das verdeckt: die alte Windschatten-Deckelung (`seins+6`) hat die KI am Start
zufällig gebremst und die Werte damit nebeneinander plausibel aussehen lassen.

Nutzer-Regel, die hier auf dem Spiel steht: *„wer sich am start überholt fühlt, hat dann
recht, ohne dass es an ihm liegt."*

Zu klären ist also, wie die KI das Feld am Start wahrnimmt — nicht, wie schnell sie
beschleunigt. Die Schwelle von 2,2 m stammt aus der Spurbreite und passt nicht auf eine
Aufstellung, die absichtlich versetzt steht.

## OFFEN: Kurve 1

Von 19 + 33 Drehern je Runde auf 26 gesunken, verteilt statt geballt. 15 von 26 Wagen
bekommen in den ersten 60 Sekunden noch einen Dreher ab, drei davon schwer.

Der Rest hängt am selben Punkt wie die Startgerechtigkeit: 26 Wagen führen aus zwei
Spalten auf eine Linie zusammen, und im Scheitel liegen alle drei Fahrlinien auf demselben
Randstein. Auf 15 m Bahnbreite haben bei 2,2 m Sicherheitsabstand sechs Wagen
nebeneinander Platz — es sammeln sich dort mehr.
