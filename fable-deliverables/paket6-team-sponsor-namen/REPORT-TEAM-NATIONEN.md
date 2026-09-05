# Paket 6 — Nachtrag: Nationen-Gewichtung für neue Teams (v0.9.17.43)

**Stand 2026-09-05.** Nutzer-Beobachtung: „ich finde finnland zu stark."

## Der Befund

Der Team-Generator zog seine Nation über `pickNationMotorsport` — eine
**Fahrer**-Verteilung. Fahrerländer und Rennstallländer sind aber zwei
verschiedene Landkarten. Gemessen an 40.000 Ziehungen:

| | Generator | Realität |
|---|---:|---:|
| **Finnland** | 3,4 % | **null Konstrukteure in 76 Jahren F1** |
| **Großbritannien** | 9,6 % | **44 % aller Renneinsätze**, 59 Konstrukteure |
| Brasilien | 7,3 % | 1 Konstrukteur |
| Japan | 7,0 % | 5 Konstrukteure |

Finnland war also nur das Symptom; die größere Schieflage war Großbritannien,
das Rennstall-Land schlechthin — Lotus, Williams, McLaren, Brabham, Tyrrell,
March, BRM, Cooper — gezogen seltener als Italien.

**17 Nationen ohne je einen F1-Konstrukteur** trugen zusammen **18,5 %** aller
Team-Ziehungen.

## Die Lösung: TEAM_NATION_BLEND

`data/team-nations.js`, generiert von `tools/build-team-nations.js`, je Dekade.
`MOTORSPORT_NATION_BLEND` bleibt unverändert und gilt weiter für **Fahrer**.

Drei Quellen, gemischt:

1. **f1db-Konstrukteure je Saison** (Rennstall-Realität, Anteil 85 % bzw. 55 %).
   Gezählt werden Konstrukteur-Saisons, **nicht Renneinsätze** — sonst drückt
   Ferraris Dauerpräsenz alle kleinen Rennställe desselben Landes weg.
2. **`tools/quellen/feeder-teams.csv`** — 77 heutige F2/F4/WEC-Teams mit Land aus
   dem Nutzer-Sheet, 24 Länder. Nur ab Dekade 2010 eingemischt (35 %). Sie ist das
   Korrektiv für die Gegenwart: in den Feeder-Serien gibt es tschechische,
   ungarische, slowenische und dänische Rennställe, die in der F1-Historie nie
   auftauchen.
3. **15 % Bodensatz aus der Fahrer-Verteilung**, damit ein finnisches oder
   argentinisches Team möglich bleibt — nur eben selten.

## Ergebnis

| Jahr | | GBR | ITA | FRA | weitere |
|---|---|---:|---:|---:|---|
| 1955 | neu | 39,0 % | 25,0 % | 11,4 % | GER 16,9 % |
| | real | 42,7 % | 27,3 % | 10,9 % | GER 18,2 % |
| 1990 | neu | 40,5 % | 28,4 % | 11,4 % | IRL 5,6 % · SUI 4,5 % |
| | real | 45,7 % | 31,4 % | 11,4 % | IRL 6,4 % · SUI 5,0 % |
| 2020 | neu | 25,5 % | 17,7 % | 9,9 % | GER 10,8 % · USA 8,8 % |
| | real | 29,6 % | 25,4 % | 9,9 % | GER 11,3 % · USA 11,3 % |

Die Hauptnationen treffen auf **×0,6 bis ×1,0** — leicht unter der Realität, was
der Bodensatz erklärt und so gewollt ist.

- **Finnland: 3,4 % → 0,5 %** (möglich, aber selten)
- **Länder ohne je einen Konstrukteur: 18,5 % → 1,9 %** der Ziehungen
- Irland (Jordan) und die Schweiz (Sauber) tauchen in den Neunzigern jetzt
  überhaupt auf — vorher lagen sie bei 0,7 % und 1,9 %

**Nebeneffekt:** weil nun die klassischen Rennstall-Länder dominieren, greift das
`generic`-Sprachregister deutlich seltener — statt 36–46 % nur noch **4,6 %
(1955), 15,5 % (1990), 22,1 % (2020)**. Die verbleibenden 22 % in der Gegenwart
kommen aus der Feeder-Liste (Schweiz, Österreich, VAE, Neuseeland, Tschechien,
Ungarn) und wären der Ansatzpunkt, falls `TEAM_NATION_KEY` über seine neun
Register hinauswachsen soll.

## Zwei Fallen

1. **f1db führt drei Ländercodes je Datensatz** — `alpha2Code` (DE), `alpha3Code`
   (DEU) und `iocCode` (GER). Das Spiel rechnet durchgehend in IOC. Beim ersten
   Messlauf war `alpha3Code` gemappt, wodurch Deutschland als zwei Länder erschien:
   `GER` mit null Konstrukteuren und `DEU` mit 21. Dasselbe für die Schweiz
   (`SUI`/`CHE`) und Malaysia (`MAS`/`MYS`).
2. **Das Indianapolis 500 zählte 1950–1960 zur WM.** Ohne Filter stellen Kurtis
   Kraft, Kuzma, Watson & Co. die Fünfziger auf den Kopf: **USA 41,5 % statt
   2,5 %**. Die Liste `INDY_500_ONLY_CONSTRUCTORS` (32 Namen) pflegt das Spiel in
   `data/hist.js` bereits; das Bau-Skript liest sie von dort.

Eine dritte Falle betrifft nur die Messung: **die Referenz muss dekadengenau
sein.** Gegen die Gesamthistorie gemessen sah eine korrekte Ziehung für 1990
fälschlich nach „Deutschland zu schwach" aus — Deutschland stellt über alle Jahre
21 Konstrukteure, in den Neunzigern aber praktisch keinen.

## Prüfwerkzeug

`SIMCORE_FROM_INDEX=1 node tests/team-nation-weights.js` — vergleicht alt, neu und
Realität nebeneinander. `JAHR=2020` wählt die Dekade.

---

# Nachtrag: Sprachregister zusammengefasst (v0.9.17.44)

Nach der Gewichtung war das `generic`-Register der nächste Engpass: **15,5 %** aller
Teams landeten dort. Zwei Gruppen ließen sich ohne neues Register auflösen.

## Nationen, die eine vorhandene Sprache schreiben

`AUT → de`, `IRL → gb`, `RSA → gb`. Österreich schreibt deutsch, Irland und
Südafrika englisch — Jordan Grand Prix, Eddie Jordan Racing und Team Gunston
klingen wie britische Rennställe, weil sie es sprachlich sind.

Wichtig: **nur das Register wird geteilt, nicht der Namenspool.** Irische Teams
bekommen irische Nachnamen im englischen Muster — *Crowe Racing, Tormey Racing,
Roche Racing, Butler Racing Team* — keine britischen.

## Mehrsprachige Länder: Region je Team ausgewürfelt

Die Schweiz hat Sauber neben Scuderia Filipinetti neben Écurie Basilisk. Ein
pauschales Register wäre in jedem Fall falsch. `TEAM_NATION_REGIONS` würfelt
deshalb **pro Team** die Sprachregion:

| | Regionen |
|---|---|
| **SUI** | de 55 % · fr 33 % · it 12 % |
| **BEL** | fr 55 % · nl 45 % |

Die Gewichte stammen aus `NAME_POOLS_BY_NATION` (Paket J) — derselben Quelle, aus
der die Fahrernamen gezogen werden. Damit passen Teamname und Fahrername im selben
Land zusammen, statt aus zwei unabhängigen Verteilungen zu stammen.

Die Schweizer Werte sind auf die drei Landessprachen normalisiert. Der vierte
Regionsanteil dort (0,06 portugiesisch) ist Zuwanderung — eine Herkunft von
Personen, keine Sprachregion für Firmennamen.

Ergebnis: *Stauffer Team · Équipe Rochat · Royal Falcon Rossi Racing* für die
Schweiz, *Mortier Grand Prix · Blue Panther Callens Racing* für Belgien.

## Kanada

Ebenfalls zweisprachig, gleiche Behandlung: **`gb` 63 % · `fr` 37 %.** Der
englische Teil zeigt auf das britische, nicht das amerikanische Register — Walter
Wolf Racing klang wie ein britischer Rennstall, nicht wie ein Speedway-Team.
Ergebnis: *Team Lavoie Racing · Dubé Engineering · Morin Team* neben *Antares
Talon Racing*.

## Stand

**`generic`: 15,5 % → 7,3 %.** Was bleibt, sind Einzelposten unter 1 % — Indien
0,83 %, Argentinien 0,69 %, Russland, Australien, Finnland, Malaysia, Tschechien.
Für keines davon lohnt derzeit ein eigenes Register.

---

# Nachtrag 2: Keltische Großschreibung in den Namens-Pools (v0.9.17.44)

Aufgefallen an einem generierten Teamnamen: *Mcmahon Racing*. Der Fehler saß aber
nicht im Teamgenerator, sondern in `data/names.js` und betraf damit auch alle
**Fahrernamen**. Der Pool führte `MacDonald` und `Mcdonald` nebeneinander.

Ursache: `build-names-v3.js` **filterte** Namen mit abweichender Großschreibung nur
(Zeile 501, `O'|Mc|Mac` als Ausnahme durchgelassen), **korrigierte** sie aber nie —
die Schreibweise kam so aus den Rohdaten.

## Warum eine pauschale Regel hier Schaden anrichtet

`Machado`, `Macedo`, `Maciel` (portugiesisch), `Macias` (spanisch), `Machida`
(japanisch), `Maciej`, `Maciejewski`, `Machnik`, `Mackiewicz` (polnisch),
`Mchunu`, `Machava`, `Machaba` (Bantu) fangen nur zufällig so an. „Mac + Großbuchstabe"
hätte daraus `MacHado` und `MacIas` gemacht — beim ersten Versuch ist genau das
passiert.

Drei Sicherungen in `fixCelticCaps()`:

1. **Nationsfilter** — nur GBR, IRL, USA, CAN, AUS, NZL, RSA. Das erschlägt die
   portugiesischen, spanischen, japanischen und polnischen Fälle auf einen Schlag.
2. **Auf `Mac` folgt bei keltischen Namen kein `h`.** Das trennt `Machava`,
   `Machaba`, `Machete` (über RSA im Pool) sauber ab. Bei `Mc` gilt das **nicht** —
   McHugh und McHale sind echt.
3. **Ausnahmeliste** für den Rest: `Mack`, `Mchunu`, `Macri`, `Macron` sowie
   `Macken` und `Mackle`, eigenständige irische Namen (von Ó Maicín), nicht Mac +
   Stamm.

`O'` wird unabhängig von der Nation korrigiert — dort gibt es praktisch keine
Fehlalarme. Zusätzlich wird die getrennte Schreibung zusammengezogen: die Rohdaten
führten `Mc Nulty`.

## Ergebnis

**88 Namen korrigiert**, Pool-Einträge unverändert (23.837) — es hat sich nichts
verschoben außer der Schreibweise. Gegenprobe je Nation:

```
IRL   O'Reilly, O'Sullivan, O'Connor, McGrath, McNulty
USA   McDowell, McDonald, McCoy
CAN   MacDonald, MacLeod, MacLean, McGuire, McKay
BRA   Macedo, Maciel, Machado          <- unangetastet
POL   Maciejewski, Machnik, Mackiewicz <- unangetastet
```

⚠ **`data/names.js` ist generiert.** Der Fix steht in `build-names-v3.js`; die
Datei selbst wurde neu gebaut, nicht von Hand editiert.

Ein Randfall bleibt unangetastet: der US-Pool führt `Mac` als alleinstehenden
Nachnamen (drei Zeichen, vom Längenfilter gerade noch durchgelassen).

---

# Nachtrag 3: Spanisch- und portugiesischsprachige Länder (v0.9.17.45)

## Was die Daten sagen — und was sie widerlegen

Vor der Zuordnung: alle F1-Melder dieser Länder aus `f1db-entrants.json`.

| | Melder | Namensform |
|---|---:|---|
| **ARG** | 8 | **Scuderia** Achille Varzi, **Scuderia** Sud Americana, Rest Privatiers |
| **ESP** | 6 | Hispania Racing, HRT Formula 1 Team, Centro Asegurador F1 |
| **BRA** | 5 | Escuderia Bandeirantes, Copersucar Fittipaldi, Fittipaldi Automotive |
| **MEX** | 1 | Team Rebaque |
| POR · CHI · COL | 0 | — |

Zwei Annahmen fallen damit: „Escudería" ist in der F1 **kaum belegt** (einmal, in
Brasilien), und **Argentinien schreibt italienisch**. Beide bekannten F1-Melder
heißen „Scuderia", und `Scuderia Buell` aus der heutigen Feeder-Liste macht drei
von drei. Argentinien hat starke italienische Einwanderung — Fangio, Marimón und
Estéfano sind italienischstämmige Namen.

## Zuordnung

- **`MEX CHI COL VEN PER URU → es`** — Escudería, Equipo, Competición, Automóviles
- **`ARG → es 60 % / it 40 %`**, gewürfelt je Team wie bei der Schweiz. Drei Fälle
  tragen keine Verteilung, deshalb bleibt Spanisch die Mehrheit — aber das
  italienische Register ist sichtbar dabei
- **`POR → pt`**, ein neues Mini-Register. Portugal an Brasilien zu hängen wäre
  falsch: pt-PT schreibt **`Equipa`**, brasilianisch **`Equipe`**; `Automóveis` ist
  die europäische Form. Portugal stellte nie einen F1-Melder, das Register ist
  sprachlich hergeleitet, nicht gemessen

Ergebnis: *Escudería Vidal* neben *Squadra Corse Bernal* (ARG), *Escudería
Hernández* (MEX), *Equipa Cid* und *Boavida Competições* (POR), *Escudería Da Silva
Automóviles* (URU).

## Stand und was NICHT lohnt

**`generic`: 7,14 % → 6,26 %.**

Der Rest sollte **nicht** weiter verkleinert werden, und zwar aus zwei Gründen:

1. **`generic` und `gb` sind identisch** — gleicher Präfix-Pool (`[['Team', 6]]`),
   beide ohne `suffixNat`. Die englischsprachigen Länder (Indien, Australien,
   Neuseeland, Malaysia, Hongkong, zusammen 2,3 %) umzuhängen ändert **kein
   einziges Zeichen** an den Namen. Das wäre reine Statistikkosmetik.
2. **Nordische und slawische Register wären schlechter als generic.** Die
   Feeder-Liste belegt es: `JMT Engineering`, `Zengo Motorsport`, `Janik
   Motorsport`, `STEP Motorsport`, `Sladecka Motorsport`, `SMP Racing` — Tschechen,
   Ungarn, Dänen, Slowaken und Russen nennen ihre Teams englisch. Für sie ist
   generic die richtige Antwort, nicht die Notlösung. Irreführend ist der Name des
   Registers, nicht sein Verhalten.

**Der lohnende Hebel liegt woanders:** `suffixNat` hat Einträge für Italien,
Frankreich, Deutschland, Spanien, Brasilien, die USA, Japan, die Niederlande und
jetzt Portugal — **nur für Großbritannien nicht.** Ausgerechnet die Nation, die je
nach Ära 25–40 % aller Teams stellt, fällt immer aufs Ära-Basissuffix zurück.
Dabei gäbe es reichlich: `Cars` (Lola Cars, Cooper Car Company), `Racing
Organisation` (Tyrrell), `Engineering` (March), `Developments` (JHR). Das beträfe
fünf- bis zehnmal so viele Teams wie die gesamte generic-Restmenge.
