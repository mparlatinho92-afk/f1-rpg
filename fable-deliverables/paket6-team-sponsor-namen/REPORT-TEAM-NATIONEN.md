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
