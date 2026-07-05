# Nationen-Frequenz-Datenbasis (Paket A v3) — Build-Zeit-Quelle, KEIN Laufzeit-Code

Datengetriebene **Nationen-Verteilung je Debüt-Dekade** aus einem großen
Motorsport-Pool: **12.207 AUTO-Rennfahrer** (Wikidata, alle Serien und Ären,
Zweiräder/Speedway bewusst ausgeschlossen — die hätten POL/EST massiv verzerrt).
Ersetzt das Prinzip „handgepflegte Nationen-Listen je Ebene": eine Datenbasis,
F1/Junior sind gefilterte Ausschnitte (Trichter).

| Datei | Inhalt |
|---|---|
| `wikidata-cardrivers-raw.json` | SPARQL-Rohantwort: Land(QID/Label/IOC) × Geburtsdekade × Fahrerzahl |
| `build-nation-freq.js` | Mapping (historische Staaten, IOC-Alt-Codes), Debüt-Shift +20J, Normalisierung |
| `nation-frequency-by-decade.js` | **Deliverable**: `MOTORSPORT_NATION_FREQ` mit `counts` + `shares` je Debüt-Dekade 1950–2020 |

Reproduktion: SPARQL-Query steht im Kopf von `build-nation-freq.js` (WDQS),
dann `node build-nation-freq.js`.

## Für die Integration (Opus)
- `shares[dekade]` = Basis-Verteilung der gesamten Motorsport-Welt (Kart-Ebene).
- **F1-Ausschnitt**: nicht 1:1 übernehmen — filtern/dämpfen (z.B. USA runter: reale
  US-Breite ist NASCAR/Indy, nicht F1; Mindest-Anteil-Schwelle; Renormierung).
- **Junior-Welt**: `JUNIOR_NATIONS` (15 gleichgewichtet) durch gewichtete Ziehung
  aus `shares` ersetzen — deutlich realistischere Grid-Mischung.
- `counts` liegen bei, damit Schwellen (z.B. ≥3 Fahrer je Dekade) bei der
  Integration selbst entschieden werden können.

## Bekannte Verzerrungen (dokumentiert)
- **USA 20–30 %**: reale Breitenbasis (NASCAR/SCCA/Indy-Ligen) + en-Wikipedia-Bias.
  Für F1-/Europa-Trichter dämpfen.
- **EST 2–4 %** in 1950–70ern: teils real (Sowjet-Motorsport-Zentrum Tallinn,
  „Estonia"-Formelwagen), teils Wiki-Dichte-Bias.
- **2020er dünn** (n=793): Wikidata hinkt bei Geburtsjahrgängen 2000+ nach —
  ggf. mit 2010ern mischen.
- Debüt-Dekade = Geburtsdekade + 20 (Näherung Formel-Einstieg mit 18–25).
