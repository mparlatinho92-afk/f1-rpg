# Paket 6 — Nachtrag: Teamnamen als gewichtete Bausteine (v0.9.17.40)

**Stand 2026-09-03.** Der Nutzer hat den Baukasten geliefert (Google-Sheet, Blatt
Präfix / Hauptwort / Suffix) plus eine Liste von 78 realen Feeder- und
Endurance-Teams mit Land und Serie — ausdrücklich **nicht als Namen zum Übernehmen**,
sondern als Material, aus dem sich Bausteine ableiten lassen.

## 1. Was die reale Liste hergibt (68 auswertbare Teams)

Nutzer-Aussage vorab: „die moderne hat viel motorsport." Nachgezählt:

| Suffix | Anteil |
|---|---:|
| Motorsport(s) | **33,9 %** |
| Racing | **27,9 %** |
| *kein Suffix* (Trident, Hillspeed, Garage 59) | **20,6 %** |
| Sport, Engineering | je 2,9 % |
| Developments, Performance, Competition, Motors, Corse, Team, Grand Prix, GP | je 1,5 % |

Kern-Typ derselben 68:

| Typ | Anteil | Beispiele |
|---|---:|---|
| Initial-Kürzel | **30,9 %** | MP Motorsport, PHM Racing, JHR Developments, AKM, ART |
| ein Wort | 48,5 % | Prema Racing, Fortec Motorsport, Invicta Racing |
| mehrere Wörter | 20,6 % | Van Amersfoort Racing, Graham Brunton Racing |

## 2. Der eigentliche Befund: Gewichte, nicht mehr Bausteine

`constructorPattern` zog **gleichverteilt** aus 5–8 Mustern je Nation. „Engineering"
kam damit so oft wie „Racing" — real ist Racing rund **14×** häufiger. Mehr Bausteine
hätten das verschlimmert. Die Liste ist deshalb nicht länger geworden, sondern
**gewichtet**.

Zweiter Befund, der die Ära-Achse erzwang: **„Écurie" kommt in der modernen Liste
kein einziges Mal vor.** Die vier französischen Teams heißen ART Grand Prix, R-ace GP,
DAMS, Akkodis ASP Team. Écurie/Automobili/Squadra Corse sind historische Register,
Motorsport ist das moderne. Präfixe und Suffixe tragen daher ein **Ära-Fenster**
(`[wort, gewicht, vonÄra, bisÄra]`) — außerhalb fallen sie ganz weg, statt nur
seltener zu werden.

⚠ **Länderzahlen sind bewusst NICHT aus den Daten abgeleitet.** 3–19 Teams pro Land
tragen keine Verteilung; dieselbe Falle wie bei den Doppelnamen. Gemessen ist die
Gesamtverteilung über 68, die Länderspezifika bleiben kuratiert.

## 3. Aufbau

Präfix + Kern + Suffix, alle drei gewichtet:

- **`suffixEra`** — je Ära, `''` = kein Suffix (der gemessene Fünftel).
- **`suffixNat`** — nationstypisch (Corse, Compétition, Rennsport, Competición …),
  ersetzt das Basis-Suffix mit `natSuffixProb` (0,14 in e50 auf 0,07 in e10 — s. Nachtrag).
- **`prefix`** — je Nation mit Ära-Fenster (Scuderia, Écurie, Escudería, Rennstall, Team).
- **`kernTyp`** — Kürzel-Anteil steigt von 0 % (e50) auf 31 % (e10, gemessen),
  Kunstwort-Anteil von 12 % auf 20 %, Rest ist der Gründername.
- **`kunstwort`** — je Ära 12 Kerne im Trident-/Invicta-/Hillspeed-Ton.
- **NED neu** als eigene Nation (vorher `generic`).

`_teamInitials` bildet das Kürzel aus dem Gründernamen: „Marius Vermeer" → „MV",
in 45 % der Fälle dreistellig („MVR").

## 4. Vier Regeln, die erst der Test sichtbar gemacht hat

1. **Anti-Stapelung.** Ein Präfix *ersetzt* meist das Suffix — „Scuderia Ferrari",
   nicht „Scuderia Ferrari Cars". Ohne diese Regel entstand „Squadra Corse Leonardi
   Cars" und „Automobiles Leduc Grand Prix". Suffix bleibt bei vorhandenem Präfix
   nur noch in 35 % der Fälle.
2. **Sponsor und Präfix schließen sich aus** — sie besetzen denselben Platz.
   „Veltra Team JM Racing" war ein Stapel, kein Name.
3. **Sponsor vor Kunstwort erzwingt ein Suffix.** Sonst stehen zwei Fantasiewörter
   nebeneinander („Veltra Kinetiq") und man liest zwei Sponsoren statt Sponsor + Team.
4. **Erzwungenes Suffix wird gezogen, nicht gesetzt.** Der erste Entwurf setzte hart
   `'Racing'`, wenn ein nackter Nachname kein Suffix bekommen hatte — das trieb
   Racing auf 41 % und drehte das reale Verhältnis um. Jetzt wird gewichtet
   nachgezogen.

Dazu die Fuzzy-Regel aus dem Sheet: Präfix und Suffix sind nie dasselbe Wort
(„Team Vermeer Team"), und ein zweistelliges Kürzel trägt sich nicht allein — „AT"
ist kein Team, „ADM" und „DAMS" schon.

## 5. Gegenmessung (je 4.000 Namen) — ÜBERHOLT durch den Nachtrag unten

| | Motorsport | Racing | ohne Suffix | Kürzel |
|---|---:|---:|---:|---:|
| GBR 2020 | **33 %** | 31 % | 17 % | **32 %** |
| ITA 2020 | 25 % | 28 % | 16 % | 33 % |
| FRA 2020 | 27 % | 29 % | 18 % | 33 % |
| GBR 1955 | **0 %** | 24 % | 26 % | **0 %** |

Ziel war Motorsport 33,9 %, Racing 27,9 %, Kürzel 30,9 %. Probe aufs Exempel:
**Écurie in FRA 2020: 0 von 4.000. Motorsport in GBR 1955: 0 von 4.000.**

Beispiele: *Rosso Corse · Écurie Tempesta · Équipe Joseph Motors · Brown Engineering ·
Robson Cars* (historisch) — *JW Racing · MAN Developments · Scuderia Perrone ·
Van Der Meijden Developments · Peeters Motorsport · Nexora GL Racing* (modern).

## 6. Offen

Die Nutzer-Tabelle enthält weitere Blätter, die **nicht** zu diesem Paket gehören und
unangetastet blieben: Streckenrotation, Teamsterben mit Wahrscheinlichkeits-Tiers
(Endurance > F2 > Rest > IndyCar/NASCAR), Motorenhersteller-Liste und neue Strecken.
Die Zeile „IndyCar + NASCAR noch ergänzen" steht dort als Notiz des Nutzers.

---

# Nachtrag: Wo liegt die Grenze zwischen Écurie-Ära und Motorsport-Ära?

Nutzer-Frage: „wir haben fünfziger und moderne bearbeitet, aber was ist mit
zwischendrin." Berechtigt — die Ära-Fenster oben waren **gesetzt, nicht gemessen**:
Écurie lief bis 1993, Motorsport ab 1976, beides frei interpoliert.

## Die Quelle, die es beantwortet

Nicht `SEASON_DATA` — dort stehen nur normalisierte Kurznamen („Ferrari", „Lotus"),
kein einziges „Scuderia". Sondern **`f1db-json-splitted/f1db-entrants.json`**
(830 volle Rennstallnamen) verknüpft mit `f1db-seasons-entrants.json`
(1.799 Jahr/Melder-Paare, 1950–2026). Das ist die Meldeliste mit den *vollen* Namen.

## Was dabei herauskam — vier Korrekturen

| | gesetzt war | gemessen |
|---|---|---|
| **Écurie** | bis 1993 | **letzter Melder 1971** |
| **Engineering** | bis heute | **endet 1984** |
| **Scuderia** | fällt zur Moderne | **steigt: 5 % → 16 %** |
| **„F1 Team"** | fehlte ganz | **ab 1997, heute 51 %** |

Suffix am Namensende, Anteil je Dekade:

    Suffix           '50  '60  '70  '80  '90  '00  '10  '20
    ohne Suffix      93%  68%  62%  60%  83%  51%  28%  25%
    Racing            ·    9%  24%  11%   6%  13%  18%  17%
    F1 Team           ·    ·    ·    ·    1%  33%  45%  51%
    Racing Team       1%  10%   7%   9%    ·    ·    ·    ·
    Engineering       2%   2%   3%    ·    ·    ·    ·    ·

**Der wichtigste Einzelbefund: 93 % der 50er-Melder tragen gar kein Suffix**, weil
sie schlicht nach einer Person heißen — Bob Gerard, A.E. Dean, Alberto Uria,
Chapman S. Root. Genau der Privatier, den der Generator erzeugt. Die Regel „ein
nackter Nachname ist kein Teamname" war für die Frühzeit also falsch und gilt jetzt
erst ab e76.

Die 90er-Delle (83 % ohne Suffix) ist kein Rückschritt, sondern die Sponsor-Ära:
„Marlboro McLaren Mercedes", „Mild Seven Benetton Renault" enden auf dem
Motorenhersteller, nicht auf einem Suffix.

## F1 ist nicht Feeder — die beiden Datenquellen widersprechen sich

In der **Feeder-/Endurance-Welt** (Nutzer-Tabelle) dominiert „Motorsport" mit 33,9 %.
In der **F1** liegt dasselbe Wort bei 2 % — dort heißt es „F1 Team". Beide Zahlen
stimmen, sie messen verschiedene Ligen.

Aufgelöst als Kompromiss: e10 bekommt F1 Team 32, Racing 18, **Motorsport 10**.
Die F1-Konvention führt, aber Motorsport bleibt spürbar — neue Teams steigen laut
Nutzer-Konzept aus Endurance und F2 auf und bringen ihren Namen mit.

## Zwei Fehler, die erst die Gegenmessung zeigte

1. **`Corse` stand in `suffixEra`** statt in `suffixNat.it` — ein Basis-Suffix gilt für
   alle Nationen, also entstand „Trident Corse" und „Owens Corse" für britische Teams.
2. **Die Fuzzy-Regel war ein Gleichheitsvergleich** und ließ „Team Haynes F1 Team"
   durch: `'Team' === 'F1 Team'` ist falsch. Jetzt reicht, dass ein Wort im anderen
   steckt. Gegenprobe: **0 Wortdopplungen in 20.000 Namen.**

## Gegenmessung des Ära-Verlaufs (je 4.000 Namen, GBR)

    Jahr    ohne  Racing  F1 Team  Motorsport  Team
    1955     64%     ·        ·         ·        ·
    1968     55%    13%       ·         ·        ·
    1985     19%    40%       ·         ·       16%
    2005     16%    29%      26%        ·       11%
    2020     18%    24%      34%       11%       8%

Proben: **Écurie in FRA 1985: 0 von 4.000. F1 Team in GBR 1985: 0 von 4.000.**

⚠ Bewusste Abweichung: 1955 liefert der Generator 64 % suffixlose Namen, real sind es
93 %. Voll ausgereizt bestünde das halbe Startfeld aus nackten Nachnamen — der
Kunstwort-Anteil ginge verloren. Wer mehr Härte will, dreht `suffixEra.e50[''].w` hoch.

Beispiele: *Brooks · Team Shaw · Muir Engineering · Aquila Special · Scuderia
Cristiano · Squadra Corse Pinna* (50er) — *Lacombe Racing Organisation · Écurie
Guillou · Condor Racing* (60er) — *Team Peacock · Scott Racing · Blue Panther White
Racing* (80er) — *Webster F1 Team · Zephyra Palmer Racing · Tomlinson Performance*
(2020er).
