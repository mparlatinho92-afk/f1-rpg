# Briefing für Schreib-KIs: Sätze für den Saison-Rückblick eines Formel-1-Managerspiels

> **So benutzt du diese Datei:** Ganz in einen **neuen** Chat kopieren und abschicken. Die Antwort in den Claude-Code-Chat kopieren, mit Name der KI dazu. Gleiches Briefing für alle KIs.

---

## AUFTRAG DIESES DURCHLAUFS

- **Pool:** `rueckblick.special.rookie`
- **Ära:** keine – diese Sätze erscheinen in **allen** Epochen von 1950 bis in die Zukunft
- **Menge:** 40 Vorschläge

---

## Worum es geht

Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) erzählt am Ende jeder Saison einen kurzen **Rückblick** aus vier bis sechs Sätzen. Jeder Satz stammt aus einem Pool von Vorlagen mit Platzhaltern; das Spiel setzt Namen und Zahlen ein und reiht die Sätze aneinander. Du schreibst neue Vorlagen für einen Pool.

**Dieser Pool:** Sonderfall: der Weltmeister ist ein Neuling in seiner ersten Saison.
Form: ein Satz, der in einem Zeitungsrückblick stehen könnte.

**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.

## Harte Regeln (Verstöße werden automatisch aussortiert)

1. **Nur beschreiben, nichts erfinden.** Das Spiel übergibt nur die Werte in der Platzhalter-Tabelle unten. Alles andere weiß es nicht. Deshalb: **keine Ursache**, **keine Intensität** („heftig“, „dramatisch“), **keine Orte** („auf der Geraden“), **keine Gefühle, Zustände oder Haltungen** einer Person („gelassen“, „wütend“), **keine weiteren Personen** und **keine erfundenen Ereignisse** aus der Vergangenheit.
2. **Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht von der echten ab; auch Anspielungen auf echte Ereignisse sind tabu.
3. **Platzhalter werden nie gebeugt.** Sie stehen als fertiger Wert im Satz: kein Genitiv-s (`{x}s` verboten), kein „des {x}“, nichts direkt anhängen. Schreib den Satz so, dass der Wert unverändert passt. Platzhalter nur in der Schreibweise der Tabelle, keine eigenen erfinden.
4. **Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter. Keine ausgeschriebenen Zahlen, deren Form von einem Platzhalter abhängt.
5. **Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg. Höchstens zwei Zeilen mit demselben Anfang.
6. **Korrektes Deutsch.** Kommas vor Nebensätzen, keine Anglizismen, die es in der Epoche nicht gab.
7. **Länge:** 30 bis 170 Zeichen je Zeile.
8. **Satzanfang großgeschrieben.** Das Spiel korrigiert den Anfang hier nicht. Ein Platzhalter darf vorn stehen, wenn er ein Name oder eine Zahl ist ({champion}, {vize}, {year} …), nie {klasseNom}, {presseNom}, {publikum} oder {deadRaceBei}.
9. **Keine Vorgeschichte.** Das Spiel weiß nicht, ob es der erste oder fünfte Titel ist: kein „erstmals“, „erneut“, „Titelverteidigung“, „zum zweiten Mal“.

## Zeitlos schreiben

Derselbe Satz kann 1952 und 2035 erscheinen. Deshalb **kein zeitgebundenes Wortmaterial** (Fernsehen, Boxenfunk, Daten, Rookie, Social Media, Turbo, Hybrid …). Den Ton der Epoche liefern Platzhalter wie `{klasseNom}`, die das Spiel je nach Jahr füllt.

## Platzhalter (nur diese, genau so geschrieben)

| Platzhalter | Bedeutung | Beispielwert | so verwenden |
|---|---|---|---|
| `{champion}` | Name des Weltmeisters | Paul Hartmann | Name, nicht beugen |
| `{fahrerPl}` | Fahrer, Plural-Nomen | Fahrer / Piloten | Plural |
| `{klasseIn}` | Rennklasse als fertige Präpositionalphrase | in der Formel 1 / im Grand-Prix-Sport | fertig, kein „in“ davor |
| `{klasseNom}` | Name der Rennklasse, Nominativ Singular | die Formel 1 / die Königsklasse / der Grand-Prix-Sport | nur Subjekt |
| `{presseNom}` | Presse, Nominativ Singular | die Fachpresse / die Presse | nur Subjekt |

## Ausgabeformat (genau so, sonst geht Arbeit verloren)

- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.
- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine Erklärungen, keine Überschriften, kein Codeblock.
- **Kein** Emoji.

Liefere jetzt **40 Vorschläge**.
