# Paket P3: Bewertungssystem — Entscheidungsvorlage „Chassis-Flucht, zwei Balken, Konflikt"

Du arbeitest mit dem Entwickler eines Formel-1-Managerspiels (Browser, Deutsch, 1950 bis
Zukunft, Einzelprojekt). Du hast **keinen** Zugriff auf den Code, und du sollst auch keinen
schreiben. Diese Datei enthält den Stand des Systems, ein Konzept des Entwicklers und die
Fragen, die er noch nicht entschieden hat.

**Deine Rolle:** Hilf ihm entscheiden. Stell die Fragen **einzeln**, gib zu jeder zwei bis
drei Optionen mit Vor- und Nachteilen und **eine Empfehlung**. Er antwortet, du hältst die
Entscheidung fest, dann kommt die nächste Frage. Er ist dabei unterwegs und am Handy,
also kurze Antworten, keine Romane. Duzen.

## Spielprinzipien, die über allem stehen

- **Plausibel vor perfekt, emergent vor gescriptet.** Nichts wird herbeigeführt: Wenn ein
  Fahrer flüchtet, dann weil die Zahlen es ergeben, nicht weil ein Skript es will.
- **Realität ist der Maßstab.** Jede neue Mechanik wird später gegen echte F1-Daten
  (F1DB, 1950–2025) gemessen. Eine Entscheidung ist also nur gut, wenn sie eine **messbare
  Zielgröße** hat (z. B. „so viele Top-Fahrer verlassen real ein abgestürztes Team").
  Schlag zu jeder Entscheidung vor, woran man sie messen könnte.
- **Keine neuen Zähler, wenn ein vorhandener reicht.** Es gibt schon mehrere Werte für die
  Gemütslage eines Fahrers (siehe unten). Ein fünfter braucht eine sehr gute Begründung.
- **An bestehenden Spielständen wird nichts rückwirkend umgeschrieben.**

## Was schon gebaut ist (Stand v0.9.18.23, 28.09.2026)

| Wert | Bedeutung | Maßstab |
|---|---|---|
| **Zufriedenheit** (Sicht des Teams) | Wie gut fährt er **relativ zu seinem Auto**? Erwartet wird die Platzierung, die dem Auto-Rang entspricht. Glockenkurve um 50. | Saison für Saison, volatil |
| **Ansehen** 0–100 (Sicht der Öffentlichkeit: Sponsoren, Fans, Motorenhersteller) | Leistung relativ zur Erwartung aus der WM, Erfolge zu einem Drittel, geglättet (35 % neue Saison). Weltmeister verlieren es drei Saisons lang langsamer. Unterperformt das **ganze Team** deutlich, bremst das den Ansehensverlust. | karrieregetragen, träge |
| **Entscheidungswert** für Vertrag und Rauswurf | 65 % Zufriedenheit + 35 % Ansehen | |
| **Teamkollegen-Duell** | Pro Rennen und pro Qualifying gezählt, fließt zu 25 % in die Bewertung | |
| **Auto-Niveau-Historie** je Team | WM-Anteil der letzten fünf Jahre | |

Die Zufriedenheit wurde am 27.09. **grundlegend umgestellt**: Vorher bewertete sie in
Wahrheit das Auto (ein Fahrer genau auf Erwartung bekam im Top-Team 72, hinten 44), jetzt
die Leistung relativ zum Auto (51 / 59 / 52).

**Gemessene Realität am Fahrermarkt** (Stammfahrer, Folgesaison):

| | bleibt im Team | wechselt, gleich stark | wechselt nach unten | verschwindet aus der WM |
|---|---|---|---|---|
| starkes Team, real | 67,6 % | 10,3 % | 13,6 % | 8,6 % |
| schwaches Team, real | 31,5 % (19,8 % steigen auf) | 16,0 % | 2,5 % | 30,2 % |

## Das Konzept des Entwicklers (16.08.2026, noch nichts davon gebaut)

1. **Chassis-Verfall als Fluchtauslöser.** Ein Top-Fahrer bekommt ein schwaches Auto, landet
   sichtbar weiter hinten und wird unzufrieden, sein Teamkollege auch. Bleibt das Auto im
   2. Jahr schlecht, sinkt auch die **Team-Zufriedenheit**, und der Top-Fahrer will weg, zu
   einem Team mit **aktuell** schnellem Wagen. Ohne Garantie: Er kann wieder in einem
   langsamen Auto landen.
2. **Zwei Balken statt einem.** Fahrer-Zufriedenheit und Team-Zufriedenheit. Die
   Fahrer-Zufriedenheit läuft nur über „Form schlechter als üblich" gegen „besser als
   üblich". Alter braucht **keine** eigene Mechanik: Wer altersbedingt nachlässt, fällt
   über die Form.
3. **Konflikt-Malus auf beide Balken.** Team gegen Fahrer oder Fahrer gegen Teamkollegen.
   Heftige Teamduelle führen zu Streit (Datenquelle: das vorhandene Teamkollegen-Duell).
   Vorbilder, die er genannt hat: Surtees, Phil Hill und Prost, jeweils bei Ferrari.
4. **Textbausteine** zum Konflikt (das ist Paket P4, danach).
5. **Zielteam — schon entschieden, nicht neu aufrollen:** Kein Extra-Würfel („Top-Team holt
   sich einen zweiten Star"). Der Markt läuft wie immer, mit genau **zwei** Abweichungen:
   - Fahrer **flüchten vor schlechtem Chassis**.
   - Bei der Teamsuche **schlägt hohes Ansehen die aktuelle Form**: Die anderen Teams
     sehen, dass es wahrscheinlich am Auto lag.

**Konflikt mit einer älteren Idee:** In der Ideenliste steht ein „Moral-System": versteckter
Wert je Fahrer, Auslöser „Teamkollege fünfmal hintereinander vorn", sichtbar als „Stimmung",
**und es wirkt auf die Pace**, greift also in die Rennsimulation ein. Das Konzept oben
wirkt dagegen nur auf den Markt. Beides zusammen wären vier Werte für dieselbe Gemütslage.

## Die offenen Fragen (in dieser Reihenfolge)

**F1 — Die neue Richtungsfrage.** Die heutige Zufriedenheit ist die **Sicht des Teams auf
den Fahrer** und seit dem 27.09. relativ zum Auto. Ein Top-Fahrer im abgestürzten Auto, der
das Maximum herausholt, ist damit **nicht** unzufrieden, und genau das trägt das Konzept
nicht mehr. Die Flucht braucht die **Sicht des Fahrers auf das Team**: Ist das Auto
seinem Anspruch angemessen? Ist Balken 2 aus dem Konzept genau das? Oder ist die
„Team-Zufriedenheit" des Konzepts etwas Drittes?
*Klär zuerst diese Frage. Alle anderen hängen davon ab.*

**F2 — Persistiert oder abgeleitet?** Bekommt der neue Balken einen eigenen gespeicherten
Wert, oder lässt er sich jedes Mal aus Vorhandenem berechnen (Auto-Niveau-Historie,
Ansehen des Fahrers, Auto-Rang dieser Saison)? Abgeleitet heißt: nichts im Spielstand,
keine Altlasten, aber kein Gedächtnis über die Historie hinaus.

**F3 — Schwelle und Dauer der Flucht.** Ab welchem Absturz (Auto-Rang, WM-Anteil) und nach
wie vielen Saisons? Relativ zum Ansehen des Fahrers (ein Star flieht früher als ein
Mittelfeldfahrer)? Gilt das auch für den schwächeren Teamkollegen, der vielleicht froh
über jedes Cockpit ist? Und die Realität dazu: Aus starken Teams wechseln real 10 % gleich
stark und 14 % nach unten. Wie viel davon wäre „Flucht"?

**F4 — Konflikt: Zustand oder Malus?** Ein Zustand mit Dauer (beginnt, hält an, endet mit
Wechsel oder Versöhnung) oder nur ein Abzug pro Saison, berechnet aus dem Teamduell? Wer
kann ihn auslösen: Fahrer gegen Kollegen, Fahrer gegen Team, oder beides? Braucht es eine
Mindeststärke beider Fahrer (Streit nur zwischen zwei Guten)?

**F5 — Das Moral-System.** Verwerfen, aufschieben oder als Pace-Aufschlag auf die
vorhandenen Werte umsetzen (kein eigener Zähler)? Achtung: Alles, was auf die Pace wirkt,
verändert die Rennergebnisse und muss gegen die Realität neu gemessen werden. Das ist
teurer als eine Markt-Mechanik.

**F6 — Anzeige.** Was sieht der Spieler: beide Balken im Fahrerprofil? Nur eine
Ampel „will weg"? Einen Eintrag in der Transfer-Chronik („verlässt X, weil …")?

## Rückgabe: genau eine Datei `bewertung-entscheidungen.md`

```markdown
# Bewertungssystem – Entscheidungen vom <Datum>

## F1 Richtung
Entscheidung: …
Begründung (ein bis zwei Sätze): …
Messbar an: …

## F2 … (usw. für jede Frage)

## Was offen bleibt
- …

## Ereignisse, die Texte brauchen (Eingabe für Paket P4)
| Ereignis | Wann | Was das Spiel dazu weiß |
```

Wenn er bei einer Frage „weiß nicht" oder „später" sagt, halt das so fest und geh weiter.
Behaupte keine Zahlen über die echte Formel 1, die nicht in dieser Datei stehen. Wenn du
eine vermutest, markier sie als **„ungeprüft"**. Gemessen wird später am PC.
