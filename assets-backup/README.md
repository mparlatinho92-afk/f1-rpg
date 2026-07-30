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
| `external/` | 257 | 9,2 MB | Gespiegelte Fremdquellen (Logopedia/Wikia, Wikimedia, statsf1) — in der HTML nur verlinkt, hier lokal gesichert gegen Link-Rot |

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

## Aktualisieren

Nach jeder Aenderung an Bildern in `index.html`:

```bash
node tools/extract-images.js          # eingebettete neu ziehen + Manifest
node tools/mirror-external-images.js  # nur neue URLs laden (Rest aus Cache)
```

`--force` laedt auch die bereits gespiegelten externen Bilder neu.
