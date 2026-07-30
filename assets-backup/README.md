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
| `drivers/` | 830 | 10,9 MB | Fahrer-Fotos von statsf1.com. Stehen **nirgends** in der HTML: die URL wird zur Laufzeit aus der Fahrer-ID gebaut |

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

Bilanz ueber alle 917 Fahrer-IDs (F1DB + Override-Tabellen):

| | Anzahl | |
|---|---|---|
| gesichert | 830 | eigene Datei |
| geteilt | 18 | Namensvettern auf derselben Datei (`jones.png`, `gonzalez.png` …) |
| ohne Foto | 53 | statsf1 hat keins — das Spiel zeigt hier ohnehin den Sketch-Avatar |
| Blocklist | 16 | Avatar ist so gewollt (Namensvettern-Kollisionen) |

**Beobachtung, nicht eingebaut:** drei Fahrer haben auf statsf1 sehr wohl ein Foto, nur unter
einem Namen, den die Slug-Regel nicht trifft — `alexander-rossi` → `rossia.png`,
`ma-qinghua` → `ma.png`, `pedro-de-la-rosa` → `delarosa.png`. Sie liegen hier im Backup
(`BACKUP_ONLY_ALIASES` im Skript); im Spiel bleibt der Avatar, solange sie nicht in
`DRIVER_PHOTO_OVERRIDES` stehen.

## Aktualisieren

Nach jeder Aenderung an Bildern in `index.html`:

```bash
node tools/extract-images.js          # eingebettete neu ziehen + Manifest
node tools/mirror-external-images.js  # nur neue URLs laden (Rest aus Cache)
node tools/mirror-driver-photos.js    # nur neue Fahrer laden (Rest aus Cache)
```

`--force` laedt jeweils auch das bereits Gespiegelte neu.
