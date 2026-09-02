# Paket J — Welle 5: GBR-Dreiteilung + USA-Entmischung

**Stand 2026-09-01.** Auslöser war eine Nutzer-Beobachtung, keine Messung:
„Hispanics und weiße Amerikaner mischen noch zu viel Vor- und Nachnamen. Brad
Benavides ist eine moderne Ausnahme. Genauso Hindu/Sikh/paki-muslimisch, hängen
noch zusammen, bei den Briten."

## 1. Warum regionsinterne Mischung überhaupt schadet

`pickPooledName` (index.html) zieht **eine** Region und daraus **Vor- und
Nachname**. Regionsübergreifende Mischung kann also gar nicht entstehen — jede
falsche Paarung entsteht *innerhalb* einer Region. Ein Sammeltopf „britisch-
asiatisch" produziert damit zwangsläufig „Mohammed Singh".

## 2. Messung vorher (je 6.000 Ziehungen aus der Region)

| Region | eindeutig unstimmig | Beispiele |
|---|---:|---|
| GBR r1 „britisch-asiatisch" | **43,5 %** | Mohammed Patel · Imran Singh · Abdul Sharma · Raj Ali |
| USA r1 „hispanisch" | **75,4 %** | Tony Rodriguez · Brandon Cantu · Nick Valenzuela |

Der USA-Wert ist NICHT einfach ein Fehler: der Anglo-Kopf in r1 war eine bewusste
Entscheidung der Welle 3 (Kommentar in `NEW_REGIONS.USA`: „r1 heißt hispanische
FAMILIEN, nicht spanische Vornamen") und die 2./3. Generation heißt real so.
Falsch waren zwei fehlende Begrenzungen:

1. **Volles Datengewicht.** Ein geteilter Name (`[0,1]`) wurde mit seinem
   kompletten US-Datengewicht in r1 kopiert — „Michael" wog dort so schwer wie
   in r0 und erschlug die spanischen Formen.
2. **Keine Zeitachse.** r1 hatte ein flaches `first`-Array ohne Ära-Fenster und
   kein `minYear`: „Brandon Cantu" war **1950** ziehbar.

## 3. Was geändert wurde

### GBR: eine Region wird drei
- **r1** auf muslimisch (pakistanisch/bangladeschisch) verengt — `REGION_PATCHES.GBR[1]`
- **r2** Sikh (Punjabi) — neu, `NEW_REGIONS.GBR[0]`
- **r3** Hindu (indisch/Gujarati/südindisch) — neu, `NEW_REGIONS.GBR[1]`

Gewichte `[0.92, 0.046, 0.012, 0.022]` — die 8 % südasiatischer Anteil bleiben in
Summe unverändert, r0 ist unberührt. Aufteilung nach Census 2021 England & Wales
(Beleg in `WEIGHT_PROPOSALS.GBR`); Sikh-Anteil ⚠ von 10 auf 15 % angehoben
(Punjabi-Verankerung im Kfz-Gewerbe → Kartsport-Zugang), Setzung ohne Fahrer-Anker.

Die fünf Anglo-Doppelgänger der Welle 3 (Jay, Kian, Rohan, Aman, Dev) bleiben
geteilt, jetzt `[0, 3]` — sonst wären „Jay Watson" und „Dev Hughes" unziehbar.

### USA: Dämpfung statt Verbot, plus Zeitachse
- `USA_SHARED_FIRST` aufgeteilt in `USA_CROSS_FIRST` (echte Doppelnamen wie
  Mario, Antonio, Oscar, Gabriel — ungedämpft) und `USA_ANGLO_ASSIM_FIRST`
  (reine Anglo-Rufnamen — Faktor **0.07** in r1).
- `REGION_PATCHES.USA[1]` gibt r1 ein **Ära-Fenster**: `early` rein spanisch,
  `mid` erste Anglo-Rufnamen, `modern` deutlich mehr. Die Datenmasse landet im
  Fenster-Zweig des Builds ohnehin nur in mid/modern — `early` bleibt sauber.

## 4. Zwei Build-Erweiterungen (`build-names-v3.js`)

1. **`NEW_REGIONS`-Eintrag darf ein Array sein** — mehrere neue Regionen je Nation
   in einem Zug (GBR r2 + r3).
2. **Dritter Routen-Eintrag = Gewichtsfaktor je Zielregion**:
   `[ANGLO, [0,1], {1: 0.07}]`. Derselbe Name steht in beiden Regionen, wiegt in
   der Minderheitsregion aber nur einen Bruchteil.
3. **`ROUTE_LAST_PREPEND`** (neuer Export in `region-routes.js`): Nachnamen-Routen,
   die **vor** `cfg.route` laufen müssen. `ROUTE_LAST_ADD` hängt hinten an — das
   reicht für GBR nicht, weil `CFG.GBR.route` mit `[SOUTH_ASIAN, 1]` beginnt und
   Singh/Patel/Sharma abfängt, ehe eine angehängte Route sie sieht. SOUTH_ASIAN
   bleibt dahinter als Rest-Auffang auf r1.

## 5. Messung nachher

| Region | unstimmig | Beispiele |
|---|---:|---|
| GBR r1 muslimisch | **0,0 %** | Muhammad Khan · Ibrahim Hussain · Bilal Rashid |
| GBR r2 Sikh | **0,0 %** | Baljit Singh · Manpreet Dhillon · Harpreet Virk |
| GBR r3 Hindu | **0,0 %** | Nikhil Patel · Dev Shah · Arjun Rao |

USA r1, Anteil reiner Anglo-Rufnamen (vorher **73 %, zeitlos**):

| Jahr | Anteil | Beispiel |
|---|---:|---|
| 1955 | **0,0 %** | Alberto Martinez · Arturo Lopez |
| 1985 | **17,6 %** | Bobby Martinez · Sebastian Lopez |
| 2015 | **29,6 %** | Brandon Lara · Mike Martinez |

Monoton steigend — Assimilation nimmt über die Generationen zu, und „Brandon
Lara" ist jetzt die Ausnahme statt der Normalfall.

Ladetest im Browser (Port 3000, `pageerror`-Lauscher): keine Konsolenfehler,
`renderAll` definiert. Ziehungen über die echte Pipeline: GBR 1960 rein britisch
(minYear greift), GBR 2020 „Bilal Iqbal", USA 1960 „Ernesto Carrillo"/„Ramon
Flores", USA 2020 „Mario Mejía".

## 6. Nebenbefund: der Restlisten-Eintrag „Cape-Coloured RSA r0 18,9 %"

**Nicht reproduzierbar.** Gemessen am heutigen Stand:

- Cape-Coloured-**Nachnamen** (`RSA_CO_LAST`) in r0: **0,0 %**
- Cape-Coloured-**Vornamen** (r3-Kuratierpool) in r0: **2,5 %** — und die drei
  Treffer (Craig, Wayne, Shaun) sind echte Doppelnamen beider Gruppen.

Der Eintrag stammt aller Wahrscheinlichkeit nach aus der Zeit **vor Welle 4**,
die r3 überhaupt erst eingeführt hat; deren Kommentar nennt für den Ist-Stand
davor 7,8 %. Kein Handlungsbedarf erkennbar.

## 7. Pflichtschritt nach dieser Welle

`ERA_FIRST_EXCLUDE` in `index.html` wurde mit `gen-era-curve-excludes.js` neu
erzeugt (GBR 39 → 45 Einträge). **Falle dabei:** „Milan" wanderte über die neue
Hindu-Route in die Ausschlussliste und wäre damit aus der GBR-Kurve gefallen —
der Gujarati-Beleg wiegt diesen Verlust nicht auf, der Name wurde aus
`GBR_HINDU_FIRST` entfernt. Nach jeder Routen-Änderung diese Liste gegenlesen,
nicht nur neu generieren.

---

# Nachtrag: Bindestrich-Doppelnamen (v0.9.17.38)

Nutzer-Konzept: „Man könnte einfach als Wahrscheinlichkeit nur die Kultur-
Wahrscheinlichkeit eines Doppelnamens nehmen, und es wird eine Zufalls-Kombi
zweier Namen desselben Kulturraums gezogen. Müller-Schmidt statt Müller-Dogan."

Mechanisch ist das in Paket J fast geschenkt: die **Region ist der Kulturraum**,
ein zweiter Zug aus derselben `region.last` kann „Müller-Dogan" nicht erzeugen.

## Die Häufigkeit ist NICHT messbar — drei Quellen, drei Sackgassen

| Quelle | Umfang | Warum sie nicht trägt |
|---|---|---|
| `SEASON_DATA` / F1DB | 849 Fahrer | 11 Fälle gesamt. „Spanisch 13,3 %" = 2 von 15. Zu dünn für Raten je Nation. |
| `sur_agg.csv` | 88.980 Zeilen | **Kategorie fehlt**: 0,00 % Bindestrich in 28 von 31 Ländern — die Aggregation hat Doppelnamen getrennt oder verworfen. Kein Beleg für Seltenheit, ein Quellen-Artefakt. |
| `wikidata-cardrivers-raw.json` | 12.207 Fahrer | liegt nur als Land × Dekade × Anzahl vor, ohne Einzelnamen. |

**Konsequenz:** `HYPHEN_NAME_CURVE` ist eine **Setzung**, im Code als solche
markiert — wie die ⚠-Regionsgewichte in `WEIGHT_PROPOSALS` auch. Eine Rate aus
11 Fällen abzuleiten wäre eine Scheinzahl gewesen.

## Was die dünnen Daten trotzdem hergeben: die FORM der Kurve

Alle 11 realen F1-Doppelnamen debütieren **1950–1988**, keiner danach:

    1950er  6/335   1,8 %      1990er  0/64   0,0 %
    1960er  2/137   1,5 %      2000er  0/49   0,0 %
    1970er  2/127   1,6 %      2010er  0/41   0,0 %
    1980er  1/79    1,3 %      2020er  0/17   0,0 %

Für einzelne Nationen trägt das nichts, für die **Zeitachse** schon: der
double-barrelled Name ist ein Oberschicht-Marker, und der frühe Motorsport war
Oberschicht (Shawe-Taylor, Fotheringham-Parker, Riseley-Prichard, Campbell-Jones
— alle britisch, alle 1950–1962). Deshalb Ära-Abfall statt fester Rate.

## Umsetzung

`hyphenNameRate(nation, year)` interpoliert linear zwischen Stützpunkten:

| Nation | 1955 | 1985 | 2020 |
|---|---:|---:|---:|
| GBR | 2,5 % | 1,0 % | 0,3 % |
| FRA | 1,5 % | 0,6 % | 0,2 % |
| GER | 0,3 % | 0,3 % | 0,3 % |
| ITA | 0,4 % | 0,4 % | 0,4 % |

Drei Leitplanken in `pickPooledName`:
1. **Nur Region 0.** Diaspora-Regionen kennen die Form nicht — „Khan-Iqbal" gibt es nicht.
2. **Zweiter Teil nur aus dem gewichteten Kern (w > 1).** Ohne das zieht der zweite
   Zug aus dem Gewicht-1-Tail: „Giovanni Vinci-Popa" (rumänischer Name im
   italienischen Pool) und „Giorgio Carlo-Federico". Einzeln vertretbar, in der
   Kombination fällt es auf — der Doppelname macht Pool-Ausreißer sichtbar.
3. **Längengrenze 21 Zeichen** für beide Teile zusammen (Tabellen, Saison-Matrix,
   Live-Ticker). „Fotheringham-Parker" wäre real, sprengt aber die Spalten.

Gemessen (je 20.000 Ziehungen über die echte Pipeline): GBR 2,52 / 0,28 %,
FRA 1,52 %, GER 0,25 %, ITA 0,36 %, USA und ESP 0 %. Beispiele: Dennis
Hughes-Cairns, John Kane-Brown, Maurice Letellier-Riou, Helmut Hempel-Wolff,
Maurizio Esposito-Cortese.

**Bewusst NICHT enthalten:** das iberische Zwei-Nachnamen-System. „Pérez-Sala"
und „Soler-Roig" sind keine Doppelnamen im britischen Sinn, sondern Vater- plus
Muttername — eine Form, die praktisch *jeder* trägt und die im Alltag auf den
ersten Namen verkürzt wird. Über dieselbe Prozentzahl abgebildet, wäre beides
falsch. Braucht eigene Mechanik und hat UI-Folgen (Namenslänge). Vom Nutzer
am 02.09.2026 zurückgestellt.

**Nächste Kandidaten**, falls die Form ausgeweitet werden soll: die anglophonen
Ex-Kolonien RSA/AUS/NZL/ZIM erben den britischen Namensstock samt double-barrelled
Tradition — stehen aktuell auf 0 %.

## Anzeige: automatische Schriftverkleinerung statt Längengrenze

Nutzer-Einwand zur 21-Zeichen-Grenze: „Trick für Fotheringham-Parker —
automatische Verkleinerung der Schrift." Richtig, die Grenze warf echten
Realismus weg. Grenze auf 28 angehoben, die Anzeige regelt sich jetzt selbst.

**Befund bei der Suche nach der Bruchstelle:** die Klasse `truncate` kommt im
Markup 4× vor, hat aber **keine CSS-Regel** — sie ist wirkungslos. Lange Namen
wurden bis dahin überhaupt nicht behandelt.

`fitLongNames()` läuft am Ende von `renderAll()`. Statt an ~70 Render-Stellen
einzugreifen (es gibt keine zentrale Fahrernamen-Funktion), misst ein Pass am
Element und schrumpft nur dort, wo es klemmt — in 0,06-Schritten bis minimal
0,72em.

Drei Punkte, die den Unterschied machen:

1. **Zwei Symptome prüfen, nicht eins.** Ohne `white-space: nowrap` bricht ein zu
   langer Name **um**, statt überzulaufen — dann bleibt `scrollWidth ===
   clientWidth` und eine reine Breitenprüfung sieht nichts. Deshalb zusätzlich
   `scrollHeight > lineHeight * 1.6`.
2. **Längen-Vorfilter vor jeder Messung.** Nur Elemente ab 14 Zeichen werden
   gemessen; alles andere kostet keinen Reflow. Gemessen: **0,4 ms** pro
   Durchlauf über das gesamte Dokument.
3. **Inline-Elemente überspringen** (`clientWidth === 0`). Sonst ist die
   Enge-Bedingung dort immer wahr und jeder lange Name würde grundlos auf 0,72em
   geschrumpft. Im Test verifiziert: enge Spalte → 0,7em, freistehender
   Inline-Span → unberührt.
