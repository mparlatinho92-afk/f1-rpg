# Paket 8 — Nachtrag: Gewichte und Ära-Fenster für Strecken- und Rennnamen (v0.9.17.41)

**Stand 2026-09-04.** Ausgangslage: der Pool war breit (30 Nationen, 212 Ortsnamen,
91 Streckenmuster, 72 Rennmuster) und sprachlich sauber getrennt, aber er hatte
dieselben zwei Schwächen wie Paket 6 vor seinem Umbau — **gleichverteilt** und
**ohne Zeitachse**. `Motorsport-Arena {loc}` war 1954 genauso wahrscheinlich wie
2024, `Coppa {loc}` so häufig wie `Gran Premio di {loc}`.

## Quelle

**1.171 reale F1-Rennen** aus `f1db-json-splitted/f1db-races.json`, verknüpft über
`circuitId` mit `f1db-circuits.json` (78 Strecken, Feld `fullName`) und mit dem
Feld `officialName` für die Rennnamen. Damit ist jedes Muster einem Jahr zugeordnet.

## Messung

Streckenname — Anteil der Rennen, deren Strecke das Muster trägt:

    Muster                '50  '60  '70  '80  '90  '00  '10  '20
    Circuit               45%  46%  35%  45%  53%  58%  71%  66%
    Autodromo/-e          19%  18%  17%  26%  27%  16%  16%  21%
    -ring                 10%   9%  14%  15%  17%  18%  12%  12%
    International          1%  10%   7%   1%   2%  13%  17%  14%
    Park                   6%  12%  10%   4%   1%   3%   1%   5%
    Street                  ·    ·    ·   8%   5%   2%   7%   6%
    Motor Racing           4%   2%    ·    ·    ·    ·    ·    ·

Rennname (`officialName`): **„Grand Prix" trägt 64 % (50er) bis 92 % (2020er).**

## Zwei Grenzen der Quelle — ehrlich benannt

1. **f1db kennt nur WM-Läufe.** Trophy, Gold Cup, Coppa und Trofeo waren Nicht-WM-
   Rennen und tauchen deshalb mit 0 % auf. Das ist **kein** Beleg dafür, dass es sie
   nicht gab — sie bleiben kuratiert, bekommen aber kleines Gewicht und ein Fenster
   bis e76, weil die freien Rennen mit der Straffung der WM verschwunden sind.
2. **Die Sponsor-Messung ist unbrauchbar** (Format-Artefakt): mal steht das Jahr vorn
   („1990 Iceberg USA Grand Prix"), mal hinten („… Grosser Preis von Österreich 2020"),
   und ab 2010 steht „Formula 1" als Präfix davor. Die bestehende Sponsor-Staffelung
   im Generator (0 % vor 1972 → 70 % ab 2010) blieb deshalb **unangetastet**.

Ebenso NICHT abgeleitet: Gewichte je Nation. 78 Strecken auf ~25 Länder sind drei pro
Land — dieselbe Falle wie bei den Doppelnamen und den Teamnamen. Gemessen ist die
Gesamtverteilung, die nationalen Eigenheiten (`Omloop van`, `{loc}banan`) bleiben
kuratiert.

## Umsetzung — und warum harte Ära-Fenster hier NICHT reichen

Erster Entwurf nutzte dasselbe Fenster-Format wie Paket 6:
`[muster, gewicht, vonÄra, bisÄra]`. Die Gegenmessung an den Rändern (1955 / 2020)
sah gut aus — **die Zwischenjahre nicht**, worauf der Nutzer hinwies:

- Italien sprang von *Coppa 18 % / Trofeo 11 %* (1985) auf **100 % Gran Premio**
  (1995). Ein Stichtag, wo real ein Ausschleichen über Jahrzehnte war.
- „Park Circuit" fiel von 20 % auf 0 % zwischen denselben zwei Jahren.

Deshalb trägt ein Eintrag jetzt wahlweise ein **Gewicht je Ära**:

    ['Coppa {loc}', { e50: 5, e62: 4, e76: 2, e94: 1 }]

Fehlt eine Ära, ist das Gewicht 0. Damit blendet ein Muster aus, statt zu schalten.
`_circuitPick` nimmt alle drei Formen: nackter String (Gewicht 5, zeitlos),
`[muster, zahl]`, `[muster, {ära: gewicht}]` und weiterhin `[muster, zahl, von, bis]`.

**Zwei Muster wogen außerdem zu schwer für etwas, das real kaum vorkommt:**
„Aerodrome Circuit" stand bei 15–18 %, ist in den echten `fullName`-Daten aber mit
**0 %** gemessen — Silverstone und Aintree *waren* Flugplätze, heißen aber schlicht
„X Circuit". Ebenso „Motorsport-Arena" (bei mir ab 1995 mit 18 %, real 0 %). Beide
jetzt klein und spät bzw. klein und früh.

## Gegenmessung über die ganze Zeitachse (je 4.000 Ziehungen)

GBR Streckenmuster:

    Muster                1955  1965  1985  1995  2015
    X Circuit               51    47    55    56    50
    X Park Circuit          21    23    18     6     5
    X International C.       5    19    11    27    30
    X Street Circuit         ·     ·    16    11    15
    X Aerodrome Circuit     11     6     ·     ·     ·
    X Motor Racing C.       11     5     ·     ·     ·

ITA Rennnamen, „Gran Premio"-Anteil gegen die realen Werte:

    Jahr        1965  1985  1995  2005  2015
    Generator     64    81    93    92   100
    real (Dek.)   78    77    80    87    88

Die Delle bei „International" in den 80ern (real 10 % → 1 % → 13 %) bildet sich mit ab.

⚠ **Bekannte Grenze: 1965 und 1975 sind identisch.** Beide liegen in e62; innerhalb
einer Ära verändert sich nichts. Die fünf Register (e50/e62/e76/e94/e10) sind
Projektkonvention und werden von Paket B, C, 1, 2 und dem Teamnamen-Baukasten
geteilt — eine feinere Granularität nur für Strecken würde davon abweichen.

## Offen: die Ortsnamen

Nicht angefasst und der einzige verbleibende Fable-Fall: **212 Orte auf 30 Nationen
sind rund sieben pro Land.** Ein Italien-Kalender zieht aus zehn Orten; über einen
rotierenden Zukunftskalender hinweg wiederholt sich „Valdano" schnell. Dafür gibt es
im Projekt keine Datenquelle — einen glaubwürdig finnisch oder ungarisch klingenden
Ort zu erfinden ist Sprachgefühl, keine Statistik.

## Lehre für den nächsten Baukasten

**Ränder messen reicht nicht.** Sowohl bei Paket 6 als auch hier sah die Prüfung an
den Extremjahren gut aus, während die Mitte einen Stichtag hatte. Bei jedem
Ära-Mechanismus mindestens fünf Stützjahre gegenmessen — und prüfen, ob der Verlauf
*monoton* ist, wo er es sein soll.
