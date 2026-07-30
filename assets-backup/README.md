# Bild-Backup

Sicherung **aller** Bilder des Spiels. Alle Bilder leben ausschliesslich in `index.html`
(die `data/*.js` enthalten keine) — es gibt also keine zweite Quelle, aus der man sie
zurueckholen koennte. Genau dafuer ist dieser Ordner da.

Erzeugt von `tools/extract-images.js` + `tools/mirror-external-images.js`.
Nichts hier wird zur Laufzeit geladen — das Spiel bleibt unveraendert.

## Inhalt

| Ordner | Anzahl | Groesse | Was |
|---|---|---|---|
| `embedded/` | 58 | 136 KB | **Unersetzbar.** Als data-URI in der HTML eingebettet: selbstgebaute Flaggen (Rhodesien, DDR, historische Staaten), Favicon, 23 selbst umkodierte Team-Logos |
| `external/` | 257 | 9,2 MB | Gespiegelte Team-Logos (Logopedia/Wikia, Wikimedia, statsf1) — in der HTML nur verlinkt, hier lokal gesichert gegen Link-Rot |
| `drivers/` | 854 | 11,2 MB | Fahrer-Fotos von statsf1.com. Stehen **nirgends** in der HTML: die URL wird zur Laufzeit aus der Fahrer-ID gebaut |

`manifest.json` haelt zu jedem Bild fest: Schluessel, Dateiname, MIME, **Zeile in index.html**,
Groesse und sha256.

### Die selbstkreierten Flaggen (`embedded/`)

`ZIM_RHO` (Rhodesien 1965–79), `ZIM_SR` (Suedrhodesien), `ZIM_FED` (Foederation),
`ZIM_ZR` (Zimbabwe-Rhodesien), `DDR`, `CAN_OLD`, `RSA_OLD`, `ESP_OLD`, `HKG_OLD`
sowie die 25 SVG-Standardflaggen aus `SVG_FLAGS`.

## Wiederherstellen

Einzelnes Bild als data-URI ausgeben (so wie es in der HTML stehen muss):

```bash
node tools/restore-image.js ZIM_RHO
node tools/restore-image.js --list          # alle Schluessel + Zeilennummern
node tools/restore-image.js ZIM_RHO --out flagge.txt
```

Die Zeilennummer im Manifest zeigt, wo der Eintrag urspruenglich stand — Zeilen
verschieben sich, der Schluessel (`'ZIM_RHO':`) bleibt aber greifbar.

## Fahrer-Fotos (`drivers/`)

`mirror-driver-photos.js` bildet `getDriverPhotoUrl()` + `getDriverPhotoUrlFallback()` nach
und liest `DRIVER_PHOTO_OVERRIDES`, `DRIVER_PHOTO_BLOCKLIST` und `FEEDER_PHOTO_OVERRIDES`
direkt aus `index.html` — die Tabellen koennen also nicht auseinanderlaufen.

Bilanz ueber alle 917 Fahrer-IDs (F1DB + Override-Tabellen), Stand v0.9.15.56:

| | Anzahl | |
|---|---|---|
| gesichert | 854 | eigene Datei |
| geteilt | 2 | beides Mal derselbe Mensch (Feeder- und F1-Eintrag), kein Fehler |
| ohne Foto | 46 | statsf1 hat keins — das Spiel zeigt hier den Sketch-Avatar |
| Blocklist | 15 | Avatar ist so gewollt |

## Der Foto-Abgleich (`audit-driver-photos.js`) — TEILWEISE GELAUFEN

Das Spiel **raet** den Dateinamen (letzter Teil der Fahrer-ID). statsf1 kuerzt aber auf
8 Zeichen und haengt bei Namensgleichen mal die Initiale (`nissanyr`), mal eine Ziffer
(`jones2`) an. Wo zwei Fahrer auf denselben Namen fielen, sah einer das Gesicht des
anderen. Massgeblich ist die statsf1-Fahrerseite `/en/<id>.aspx`, die den Dateinamen
direkt nennt — genau das prueft das Skript.

**Stand: 52 von 915 Fahrern seitenverifiziert.** statsf1 drosselt nach etwa 50 Seiten
und liefert danach nur noch 302-Weiterleitungen (der Bild-Pfad bleibt erreichbar, nur
die `.aspx`-Seiten sind gesperrt). Das Skript hat deshalb einen Wiederaufnahme-Modus:
ein erneuter Lauf uebernimmt alle bereits geklaerten Fahrer aus `photo-audit.json` und
fragt nur den Rest ab.

```bash
node tools/audit-driver-photos.js --concurrency=1 --delay=3000   # fortsetzen
node tools/audit-driver-photos.js --fresh                        # von vorn
```

In v0.9.15.56 wurden daraus 27 Korrekturen in `DRIVER_PHOTO_OVERRIDES` eingetragen:
13 seitenverifiziert, 14 ueber die Initiale erschlossen (Datei-Existenz per HTTP
geprueft, Zuordnung eindeutig, weil sich die Vornamen der Betroffenen im ersten
Buchstaben unterscheiden).

### Wie gross ist das Restrisiko?

Zwei Gegenproben, die **ohne eine einzige Anfrage** auskommen und den offenen Rest
eingrenzen — bei Foto-Arbeit zuerst diese laufen lassen, nicht die Quelle abfragen:

1. **Gleiche Datei unter verschiedenen Namen?** sha256 ueber alle Fotos: 854 Dateien,
   854 verschiedene Bilder, **null Duplikate**. Kein Fahrer sieht mehr das Gesicht eines
   anderen — die eigentliche Fehlerklasse ist damit unabhaengig bestaetigt erledigt.
2. **Passt der Dateiname zum Fahrernamen?** 797 von 802 ungeprueften Fahrern ja; die
   5 Ausreisser sind Doppelnamen (`servoz-gavin` → `gavin.png`) oder laengst gepruefte
   Alteintraege. **Kein neuer Verdachtsfall.**

Ein Vollabgleich waere also Kosmetik. `robots.txt` erlaubt automatisierten Zugriff
(`User-Agent: *` → `Allow: /`, keine `Crawl-delay`; gesperrt sind gezielt SEO-/KI-Bots) —
die 302 sind ein technisches Limit, keine Hausordnung. Wer trotzdem weitermacht: sehr
langsam takten (`--delay=10000`), die Sperre hielt am 2026-07-30 ueber eine Stunde an.

## Aktualisieren

Nach jeder Aenderung an Bildern in `index.html`:

```bash
node tools/extract-images.js          # eingebettete neu ziehen + Manifest
node tools/mirror-external-images.js  # nur neue URLs laden (Rest aus Cache)
node tools/mirror-driver-photos.js    # nur neue Fahrer laden (Rest aus Cache)
```

`--force` laedt jeweils auch das bereits Gespiegelte neu.
