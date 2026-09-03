# Livery-Werkzeug – Datenformat & Bauplan

Ersetzt den Google-Calc-Reiter „teamfarben". **Gebaut und geprüft am 02.09.2026.**

| Datei | Zweck |
|---|---|
| `tools/livery-report.html` | die Werkstatt. Live-Modus über den Dev-Server: `localhost:3000/tools/livery-report.html` |
| `tools/livery-core.js` | gemeinsamer Kern für Browser **und** Node – Extraktion, Zellen, Farbworte, Faltung |
| `tools/build-livery-snapshot.js` | `node tools/build-livery-snapshot.js [--inline]` → Snapshot, optional Standalone |
| `tools/livery-snapshot.json` | Spielstand der Farben, für den Werkstatt-Modus |
| `tools/livery-report.standalone.html` | eine Datei mit allem drin – für unterwegs |
| `tools/build-livery-sheet-import.js` | überträgt den Google-Calc-Reiter ins Import-Format |
| `tools/quellen/teamfarben-sheet.md` | Rohkopie des Sheets vom 02.09.2026 (Quelle, nicht von Hand pflegen) |
| `tools/quellen/livery-sheet-import.json` | das Ergebnis – in der Werkstatt über „Import" einlesen |

## 0. Grundsatz

**Eine Livery pro Team pro Saison. Nur eine Wahrheit.**
Der Editor darf trotzdem chaotisch sein: mehrere Vorschläge dürfen an derselben
Zelle hängen, halbfertig, widersprüchlich. Das System unterscheidet sauber
zwischen *geklärt* und *Kladde* und zeigt dir jederzeit, was noch offen ist.

Abweichende Lackierungen je Entry/Sponsor/Fahrer sind **nicht** Teil dieses
Modells – siehe Memo `project_livery_system.md`, Abschnitt „Notierte Ideen".

## 1. Speicherkorn: die Zelle

Schlüssel `TEAMID:JAHR`, z. B. `MAR:1976`. Nicht die Zeitspanne.

```json
"MAR:1976": {
  "pick": "c3",
  "candidates": [ /* siehe unten */ ]
}
```

`pick` = id des gewählten Kandidaten, oder `null` = noch nicht entschieden.

**Zeitspannen sind eine Eingabegeste, kein Speicherformat.** Tippst du im Editor
„March 1974–1976 orange", schreibt das Werkzeug drei Zellen und merkt sich in
jedem Kandidaten `spanId`, damit du die Spanne später als Ganzes wieder anfassen
kannst. Ranges entstehen erst beim Export zurück (Abschnitt 5).

## 2. Der Kandidat

```json
{
  "id": "c3",
  "kind": "colors",
  "colors": ["#FF6600", "#FF6600", "#FFFFFF"],
  "raw": "orange-orange-weiß",
  "stage": "bestaetigt",
  "origin": {
    "kind": "chat",
    "ref": "https://claude.ai/chat/94d1a864-…",
    "image": "https://i.pinimg.com/1200x/…jpg",
    "date": "2026-08-14"
  },
  "spanId": "s12",
  "note": "Beta-Livery, ab Monaco"
}
```

| Feld | Bedeutung |
|---|---|
| `kind` | `colors` = echter Farbwert · `note` = Auftrag ohne Farbe („historische Dynamik-Farben") |
| `colors` | 1–3 Hex. Doppelnennung = ⅔/⅓ – identisch zu `TEAM_COLORS_RANGES` |
| `raw` | was wirklich getippt wurde. Bleibt erhalten, auch nach Auflösung nach Hex |
| `stage` | **Fortschritt, von dir gesetzt:** `idee` → `vorschlag` → `bestaetigt` |
| `origin.kind` | `chat` · `bild` · `hand` · `spiel` (aus dem Monolith eingelesen) |

`kind: "note"` ist wichtig: „historische Dynamik-Farben" (Eurobrun, McLaren,
Matra-Kette im Sheet) ist kein Farbwert, sondern die Aussage „hier gehört eine
Ära-Abfolge hin, keine Einzelfarbe". Als Kandidat geführt, nie exportierbar.

## 3. Zwei Zustandsachsen

**Fortschritt** – am Kandidaten, von dir gesetzt: `idee` → `vorschlag` → `bestaetigt`.
Inhaltliche Aussage über die Farbe. Nur ein Mensch kann sie treffen.

**Lieferstatus** – an der Zelle, **berechnet, nie gespeichert, nie getippt**:

| Wert | Bedeutung |
|---|---|
| `werkstatt` | existiert nur hier |
| `exportiert` | steht in `liveries-todo.json`, `done: false` |
| `im-spiel` | `getTeamColors()` liefert exakt diesen Wert |
| `abweichend` | **im Spiel steht etwas anderes** – der wertvollste Fall |
| `unbekannt` | nur Snapshot-Modus, Spielstand nicht live prüfbar |

Sobald der Lieferstatus von Hand gepflegt werden muss, ist Google Calc
nachgebaut. Die Notizen „BIS 2005!!" im Sheet sind genau das: handgepflegter
Lieferstatus, der nur stimmt, solange du dran denkst.

## 4. Chaos oder Ordnung – die Prüfregeln

Eine Zelle ist **geklärt**, wenn genau ein Kandidat `bestaetigt` ist und `pick`
darauf zeigt. Alles andere ist Kladde und wird als offener Posten gezählt:

| Befund | Auslöser | Beispiel aus dem Sheet |
|---|---|---|
| `luecke` | kein Kandidat, kein Wert im Spiel | 286 Team-Jahre / 104 Teams |
| `unentschieden` | ≥2 Kandidaten, `pick` fehlt | Eurobrun: „weiß" **und** „historische Dynamik-Farben" |
| `widerspruch` | ≥2 Kandidaten mit `stage: bestaetigt` | Saison-Chat gegen Team-Chat auf derselben Zelle |
| `nur-idee` | Kandidaten vorhanden, keiner über `idee` hinaus | BAR „einfach weiß" |
| `einheitsfarbe` | Team ≥3 Saisons, alle Zellen identisch, Herkunft `spiel` | **March 14× `#ff6600`**, BRM 23×, Cooper 19× — 17 Teams, 179 Team-Jahre |
| `abweichend` | Lieferstatus (s. o.) | Beschlossenes ≠ Eingebautes |

`einheitsfarbe` ist der Befund, den das Sheet nicht liefern konnte: kein Fehler,
sondern die fehlende Ära-Struktur. Nicht mit `luecke` in einen Topf werfen.

## 5. Import – was der Livery-Chat liefern soll

Bewusst flach und dumm. Kein Zustand, keine ids – die vergibt das Werkzeug.

```json
{
  "schema": "f1rpg-livery/1",
  "source": {
    "kind": "chat",
    "ref": "https://claude.ai/chat/94d1a864-…",
    "image": "https://i.pinimg.com/1200x/…jpg",
    "note": "Saisons 2015–2022"
  },
  "entries": [
    { "team": "SAU", "from": 2015, "to": 2017,
      "colors": ["#FFFFFF", "#FFFFFF", "#003FA3"], "comment": "…" },
    { "team": "Eurobrun", "year": 1988, "colors": ["weiß"] }
  ]
}
```

- `team`: Kurz-ID **oder** Klartextname – das Werkzeug löst auf (wie `getTeamColors`)
- `from`/`to` **oder** `year`
- `colors`: Hex **oder** Farbwort **oder** ein Wort je Drittel („blau-blau-weiß")

**Import setzt nie `bestaetigt`.** Ausnahme: beim Einlesen fragt die Oberfläche
einmal „diesen Stapel als mitgeprüft übernehmen?" – dann kommt der ganze Import
als `bestaetigt` rein. Eine bewusste Entscheidung pro Stapel, nicht 200× einzeln.
(Der 2015–2022-Chat ist so ein Fall.)

## 6. Export – zurück in den Monolith

Ziel ist das bestehende `liveries-todo.json`, das `add-livery.ps1` liest:

```json
{ "team": "MAR", "from": 1974, "to": 1976,
  "colors": ["#FF6600","#FF6600","#FFFFFF"], "comment": "…", "done": false }
```

**Faltung Zellen → Ranges:**
1. nur Zellen mit `pick`, dessen Kandidat `stage: bestaetigt` und `kind: colors` hat
2. je Team nach Jahr sortieren, aufeinanderfolgende gleiche Farbfolgen zusammenfassen
3. Jahre, in denen das Team gar nicht in `SEASON_DATA` steht, brechen die Spanne
   **nicht** – hält die Range-Liste kurz und ist folgenlos, weil `getTeamColors`
   nur bei einem Treffer liest
4. Ranges, die exakt so schon im Spiel stehen, werden weggelassen
5. Einzeljahre, die eine bestehende Range durchbrechen, gehen nach
   `TEAM_COLORS_EXTRA` statt `TEAM_COLORS_RANGES` (Jahr-Override hat Vorrang)

## 6a. Farbeditor (Pipette)

Bilder per Drag & Drop, Einfügen (Strg+V) oder Dateiauswahl in den Dialog
„Farbe aus Bild"; mehrere Bilder liegen als Miniaturen nebeneinander. Klick ins
Bild nimmt die Farbe ab, bis zu drei in der Banner-Reihenfolge; `×2` verdoppelt
eine Farbe für den ⅔-Anteil. Übernehmen schreibt sie ins Eingabefeld der
gewählten Zelle.

- **5×5-Mittelwert statt Einzelpixel** – JPEG-Rauschen trifft sonst daneben
- Lupe mit 10× Vergrößerung und Fadenkreuz, damit man die Fläche trifft
- **Externe Bilder lassen sich meist nicht auslesen**: fremde Seiten (pinimg,
  Instagram) erlauben kein CORS, `getImageData` wirft dann. Der Dialog sagt das
  und rät zum Herunterladen. Die Referenzbilder aus dem Sheet sind also zum
  *Ansehen* da, zum Pipettieren muss das Bild lokal vorliegen.

## 6b. Bildersammlung

Hereingezogene Bilder landen in **IndexedDB** und bleiben erhalten – `localStorage`
kann keine Blobs und wäre nach drei Fotos voll. Aus jedem Team-Jahr erreichbar,
damit ein Bild mit mehreren Jahren oder mehreren Wagen nur einmal gesucht werden
muss.

Zwei Richtungen:

- **vom Team-Jahr aus**: Zelle wählen → „Farbe aus Bild" → Miniatur aus der
  Sammlung anklicken
- **vom Bild aus**: Knopf „Bilder" klappt die Leiste unten auf, dann ein
  Team-Jahr aus dem Zeitstrahl oder Jahr-Raster **auf ein Bild ziehen**. Der
  Farbeditor öffnet mit genau diesem Bild und dieser Zelle. Praktisch, wenn ein
  Bild für viele Zellen taugt.

Die Leiste verkürzt `#view` über `--tray`, damit nichts verdeckt wird.

## 7. Farbworte

Wörterbuch Wort → Hex („weiß", „British Racing Green", „anthrazit", „weinrot").
Mehrteiliges wird an `-` getrennt, je Teil ein Hex, Doppelnennung bleibt erhalten:
`blau-blau-weiß` → `["#…blau","#…blau","#FFFFFF"]`.
Unbekannte Wörter werden **nicht geraten** – sie bleiben in `raw` stehen, der
Kandidat gilt als ungeklärt und taucht in der Offen-Liste auf.

## 8. Live gegen Snapshot

Kein Schalter. Die Datei versucht beim Start `../index.html` + `data/seasons.js`
zu laden:

- **gelingt** → Live-Modus, Kopfzeile grün, Lieferstatus echt gemessen,
  Export schreibt neben `add-livery`
- **scheitert** → Werkstatt-Modus, Kopfzeile gelb mit Snapshot-Datum,
  Lieferstatus `unbekannt`, Austausch nur über JSON

Der Snapshot trägt Spielversion + Hash der drei Blöcke
(`TEAM_COLORS_EXTRA`, `TEAM_COLORS_RANGES`, `getTeamColors`). Weicht der Hash im
Live-Modus ab, steht oben „Snapshot veraltet".

Der Live-Modus baut die Kaskade **nicht nach**, sondern schneidet `getTeamColors`
und `getTeamHeaderGradient` aus `index.html` und führt sie aus. Findet er einen
Block nicht, bricht er ab statt zu raten. Ein Nachbau wäre eine zweite Wahrheit —
dasselbe Muster wie die Live-Ticker-Divergenz.

## 9. Fallen

- `isIndyOnlyConstructor` trifft über den **Namen** (`t[1]`), nie über die
  Kurz-ID. Der Indy-Filter muss beides prüfen. Alle 104 Indy-Team-Jahre sind
  farblos – der Filter räumt Scheinlücken weg, ohne eine echte zu verstecken.
- Referenzbilder: `scontent`/Instagram-URLs tragen Ablauf-Token und sterben.
  `pinimg` hält meist. Tote Bilder müssen erkennbar sein.
- Die Hauptfarbe ist Schriftfarbe. `renderTeamNameColored` zieht bei Luminanz
  < 0,13 und > 0,65 einen Shadow – die Übersicht zeigt `colors[0]` deshalb auf
  hellem **und** dunklem Grund plus Luminanzwert.

## 10. Ist-Stand (gemessen 01.09.2026, v0.9.17.36)

1064 Team-Jahre in `SEASON_DATA` 1950–2025, davon 104 reine Indy.
Von den verbleibenden 960:

| Quelle | Team-Jahre |
|---|---|
| `TEAM_COLORS_EXTRA` | 13 |
| `TEAM_COLORS_RANGES` (95 Einträge, 20 Teams) | 296 |
| `SEASON_DATA`-Einzelfarbe | 365 |
| gar nichts → grau | 286 (104 Teams) |

Echtes Banner (2–3 Farben): 279 von 960 = **29 %**.
Dazu 179 Team-Jahre in 17 Teams mit `einheitsfarbe`-Befund: eingefärbt, aber ohne Ära-Struktur.
